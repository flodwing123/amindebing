/* =========================================================
   Supabase 自写最小客户端（原生 fetch，无官方 SDK）
   - Auth：注册 / 登录 / 登出 / 会话恢复 / refresh_token 续期
   - REST：select / insert / upsert / delete 链式查询
   - 特性：20s 请求超时 · 401 自动续期重试一次 · 空响应体处理
   - token 持久化：localStorage（sb_auth）
   ========================================================= */

const SB = (() => {
  const TOKEN_KEY = "sb_auth";          // 登录态持久化 key
  const TIMEOUT = 20000;                // 请求超时（毫秒）

  /* ---------- 基础请求（超时 + 401 自动续期重试） ---------- */
  let refreshing = null;                // 防止并发刷新 token

  async function request(method, path, opts = {}) {
    const { body, auth = true, retried = false, headers: extraHeaders } = opts;
    const url = SB_CONFIG.projectUrl.replace(/\/$/, "") + path;

    const headers = {
      "apikey": SB_CONFIG.publishableKey,
      "Content-Type": "application/json"
    };
    if (auth) {
      const ses = getSession();
      if (ses && ses.access_token) headers["Authorization"] = "Bearer " + ses.access_token;
    }
    if (extraHeaders) Object.assign(headers, extraHeaders);

    // 20s 超时
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);

    let res;
    try {
      res = await fetch(url, {
        method, headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl.signal
      });
    } catch (e) {
      clearTimeout(timer);
      const err = new Error("网络错误或请求超时: " + e.message);
      err.name = "SBTimeout";
      throw err;
    }
    clearTimeout(timer);

    // 401：用 refresh_token 续期一次后重试
    if (res.status === 401 && !retried) {
      const ok = await refreshSession();
      if (ok) return request(method, path, { body, auth, retried: true, headers: extraHeaders });
    }
    if (!res.ok) {
      let msg = "HTTP " + res.status;
      try { const j = await res.json(); msg = (j.msg || j.error_description || j.message || JSON.stringify(j)).slice(0, 200); } catch (e) {}
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    // 空响应体处理：204 / 无内容
    const txt = await res.text();
    if (!txt) return null;
    try { return JSON.parse(txt); } catch (e) { return txt; }
  }

  /* ---------- 会话管理 ---------- */
  function getSession() {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return (s && s.access_token) ? s : null;
    } catch (e) { return null; }
  }
  function saveSession(s) {
    if (s) localStorage.setItem(TOKEN_KEY, JSON.stringify(s));
    else localStorage.removeItem(TOKEN_KEY);
  }

  /* 用 refresh_token 换新 token（串行化，防并发重复刷新） */
  async function refreshSession() {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      const ses = getSession();
      if (!ses || !ses.refresh_token) return false;
      try {
        const data = await request("POST",
          "/auth/v1/token?grant_type=refresh_token",
          { body: { refresh_token: ses.refresh_token }, auth: false });
        if (data && data.access_token) {
          saveSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token || ses.refresh_token,
            expires_at: Date.now() + (data.expires_in || 3600) * 1000,
            user: data.user || ses.user
          });
          return true;
        }
        return false;
      } catch (e) {
        saveSession(null); // 续期失败视为登录失效
        return false;
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  }

  /* 会话是否有效（过期则自动续期） */
  async function ensureSession() {
    let ses = getSession();
    if (!ses) return null;
    if (ses.expires_at && Date.now() > ses.expires_at - 60000) {
      const ok = await refreshSession();
      ses = getSession();
      if (!ok || !ses) return null;
    }
    return ses;
  }

  /* ---------- Auth API ---------- */
  /* 注册（项目已关闭 Confirm email，注册即返回会话） */
  async function signUp(email, password) {
    const data = await request("POST", "/auth/v1/signup",
      { body: { email, password }, auth: false });
    if (data && (data.access_token || (data.user && data.user.id))) {
      if (data.access_token) saveSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in || 3600) * 1000,
        user: data.user
      });
      return data.user;
    }
    throw new Error("注册未返回会话（检查 Confirm email 是否已关闭）");
  }

  /* 登录 */
  async function signIn(email, password) {
    const data = await request("POST", "/auth/v1/token?grant_type=password",
      { body: { email, password }, auth: false });
    if (!data || !data.access_token) throw new Error("登录失败：未返回令牌");
    saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
      user: data.user
    });
    return data.user;
  }

  /* 登出（服务端撤销 refresh_token；失败不阻塞本地清理） */
  async function signOut() {
    try { await request("POST", "/auth/v1/logout", {}); } catch (e) { /* 忽略 */ }
    saveSession(null);
  }

  /* ---------- REST 查询构建器（链式） ---------- */
  function from(table) {
    const q = { table, filters: [], select: "*", method: "GET", body: null,
      onConflict: null, opts: { auth: true } };

    const api = {
      /* select("*") 或 select("key,data") */
      select(cols) { q.select = cols || "*"; return api; },
      /* 等值过滤：eq("user_id", uid) */
      eq(col, val) { q.filters.push(`${col}=eq.${encodeURIComponent(String(val))}`); return api; },
      /* IN 过滤：in("key", ["a","b"]) */
      in(col, vals) {
        if (vals && vals.length) q.filters.push(`${col}=in.(${vals.map(v => encodeURIComponent(String(v))).join(",")})`);
        else q.filters.push(`${col}=in.()`); // 空集合
        return api;
      },
      order(col, desc) { q.filters.push(`order=${col}.${desc ? "desc" : "asc"}`); return api; },
      limit(n) { q.filters.push(`limit=${n}`); return api; },
      insert(rows) { q.method = "POST"; q.body = Array.isArray(rows) ? rows : [rows]; return api; },
      upsert(rows) {
        q.method = "POST"; q.body = Array.isArray(rows) ? rows : [rows];
        q.onConflict = "user_id,key";
        q.opts.headers = { "Prefer": "resolution=merge-duplicates,return=minimal" };
        return api;
      },
      delete() { q.method = "DELETE"; return api; },

      /* 执行查询 */
      async then(resolve, reject) {
        try { resolve(await exec()); } catch (e) { reject(e); }
      },
      async exec() {
        const path = "/rest/v1/" + q.table + buildQS(q);
        const h = Object.assign({}, q.opts.headers || {});
        let data;
        if (q.method === "GET") data = await request("GET", path, { auth: q.opts.auth });
        else data = await request(q.method, path, { body: q.body, auth: q.opts.auth, headers: h });
        return data === null ? [] : data;   // 空响应体 → 空数组
      }
    };

    function buildQS(q) {
      const parts = [];
      parts.push("select=" + encodeURIComponent(q.select));
      if (q.onConflict) parts.push("on_conflict=" + q.onConflict);
      if (q.filters.length) parts.push(q.filters.join("&"));
      return "?" + parts.join("&");
    }

    return api;
  }

  /* ---------- 表键（业务键排除清单，与 cloud-sync 一致） ---------- */
  const SKIP_KEYS = [
    "teacher_workbench_vault_snap", "teacher_workbench_vault_idx",
    "teacher_workbench_cloudSyncCfg", "teacher_workbench_cloudSyncTs",
    TOKEN_KEY
  ];
  function isSyncKey(k) {
    if (SKIP_KEYS.some(p => k === p || k.startsWith(p))) return false;
    return k.indexOf("teacher_workbench_") === 0;
  }
  /* 业务键名 → 存入云端的 key（去掉前缀） */
  function cloudKey(localKey) { return localKey.replace(/^teacher_workbench_/, ""); }
  /* 云端 key → 本地 localStorage key（加回前缀） */
  function localKey(cKey) { return "teacher_workbench_" + cKey; }

  return {
    TOKEN_KEY, TIMEOUT,
    request, getSession, saveSession, refreshSession, ensureSession,
    signUp, signIn, signOut, from, isSyncKey, cloudKey, localKey
  };
})();
