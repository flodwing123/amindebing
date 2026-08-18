/* =========================================================
   认证 + 多端数据同步引擎
   - 邮箱登录 / 注册 / 登出（token 持久化 localStorage，刷新恢复登录态）
   - 登录后拉取云端数据组装到本地；本地修改先写本地再串行推送云端
   - 删除：云端键集合快照差集（云端有、本地已删 → 删除云端行）
   - 串行队列 + 防抖，避免并发重复保存
   - 登出：清除本地全部业务数据 + token + 全局状态，重绘至登录页（账号隔离）
   ========================================================= */

const Sync = (() => {
  const state = {
    loggedIn: false,
    user: null,
    ready: false,          // 就绪前（初始拉取中）不推送，防止默认值覆盖云端
    cloudKeys: new Set(),  // 云端键集合快照（差集删除用）
    dirty: new Set(),      // 本地变更待推送的键
    deleted: new Set(),    // 本地已删除的键
    queue: Promise.resolve(),
    syncing: false
  };

  /* ---------- 包装 Store（vault / cloud-sync 包装之后，保持链式） ---------- */
  const _set = Store.set, _del = Store.del;
  Store.set = function (key, val) {
    _set.call(Store, key, val);
    if (state.loggedIn && state.ready && SB.isSyncKey(Store._ns + key)) {
      state.dirty.add(key);
      state.deleted.delete(key);
      scheduleFlush();
    }
  };
  Store.del = function (key) {
    _del.call(Store, key);
    if (state.loggedIn && state.ready && SB.isSyncKey(Store._ns + key)) {
      state.deleted.add(key);
      state.dirty.delete(key);
      scheduleFlush();
    }
  };

  /* ---------- 串行队列 ---------- */
  function enqueue(fn) {
    state.queue = state.queue.then(fn).catch(e => console.warn("[sync]", e.message));
    return state.queue;
  }

  /* ---------- 推送：差集删除 + 变更 upsert ---------- */
  async function flush() {
    if (state.syncing || !state.loggedIn || !state.ready) return;
    state.syncing = true;
    try {
      const ses = await SB.ensureSession();
      if (!ses) { state.loggedIn = false; return; }
      const uid = ses.user.id;

      // 1) 差集删除：本地已删 且 云端快照仍存在 → 批量 DELETE
      const delKeys = [...state.deleted].filter(k => state.cloudKeys.has(k));
      if (delKeys.length) {
        await SB.from("user_sync").delete().eq("user_id", uid).in("key", delKeys).exec();
        delKeys.forEach(k => { state.cloudKeys.delete(k); state.deleted.delete(k); });
      }

      // 2) 变更 upsert（串行一次批量提交，避免并发重复保存）
      const ups = [...state.dirty]
        .map(k => ({ user_id: uid, key: k, data: Store.get(k, null), updated_at: new Date().toISOString() }))
        .filter(r => r.data !== null);
      if (ups.length) {
        await SB.from("user_sync").upsert(ups).exec();
        ups.forEach(r => { state.cloudKeys.add(r.key); state.dirty.delete(r.key); });
      }
    } catch (e) {
      console.warn("[sync] flush 失败，保留待同步队列:", e.message);
    } finally {
      state.syncing = false;
    }
  }
  let flushTimer = null;
  function scheduleFlush() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => enqueue(flush), 800); // 防抖 800ms + 串行
  }

  /* ---------- 拉取：登录后全量组装到本地 ---------- */
  async function pullAll() {
    const ses = await SB.ensureSession();
    if (!ses) return false;
    const uid = ses.user.id;
    const rows = await SB.from("user_sync").select("key,data").eq("user_id", uid).exec();
    state.cloudKeys = new Set(rows.map(r => r.key));
    rows.forEach(r => {
      try { localStorage.setItem(SB.localKey(r.key), JSON.stringify(r.data)); } catch (e) {}
    });
    state.dirty.clear();
    state.deleted.clear();
    return true;
  }

  /* ---------- 登录 / 注册 / 登出 ---------- */
  async function doAuth(kind, email, password) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("请输入正确的邮箱地址");
    if (!password || password.length < 6) throw new Error("密码至少 6 位");
    const user = kind === "login" ? await SB.signIn(email.trim(), password) : await SB.signUp(email.trim(), password);
    state.user = user;
    state.loggedIn = true;
    try { await pullAll(); } catch (e) { console.warn("[sync] 首次拉取失败，将继续使用本地数据:", e.message); }
    state.ready = true;
    return user;
  }

  async function logout() {
    await SB.signOut(); // 服务端撤销 refresh_token（失败不阻塞）
    // 清除本地缓存：全部业务数据 + token（账号隔离）
    const remove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf("teacher_workbench_") === 0) remove.push(k);
    }
    remove.forEach(k => localStorage.removeItem(k));
    // 清除全局状态
    state.loggedIn = false; state.user = null; state.ready = false;
    state.dirty.clear(); state.deleted.clear(); state.cloudKeys.clear();
    location.reload(); // 重绘至无数据状态（未登录 → 登录页）
  }

  /* ---------- 登录页 UI ---------- */
  function renderAuthScreen() {
    const host = document.getElementById("authScreen");
    if (!host) return;
    host.style.display = "block";
    host.innerHTML = `
      <div class="auth-card">
        <div class="auth-logo">🌿</div>
        <h1 class="auth-title">啊敏的兵</h1>
        <p class="auth-sub">登录后自动同步手机 / 电脑数据</p>
        <input class="auth-inp" id="authEmail" type="email" placeholder="邮箱" autocomplete="email">
        <input class="auth-inp" id="authPwd" type="password" placeholder="密码（至少 6 位）" autocomplete="current-password">
        <div class="auth-err" id="authErr"></div>
        <button class="auth-btn auth-btn-primary" id="authLogin">登 录</button>
        <button class="auth-btn auth-btn-ghost" id="authRegister">注册新账号</button>
        <p class="auth-tip">🔒 数据仅本人可见 · 多设备实时同步</p>
      </div>`;

    const err = () => document.getElementById("authErr");
    const busy = (on) => {
      const b1 = document.getElementById("authLogin"), b2 = document.getElementById("authRegister");
      if (!b1 || !b2) return;
      b1.disabled = on; b2.disabled = on;
      b1.textContent = on ? "请稍候…" : "登 录";
    };

    async function submit(kind) {
      err().textContent = "";
      busy(true);
      try {
        const u = await doAuth(kind, document.getElementById("authEmail").value, document.getElementById("authPwd").value);
        busy(false);
        toast("✅ 登录成功：" + (u.email || ""));
        setTimeout(() => location.reload(), 600);
      } catch (e) {
        busy(false);
        err().textContent = "❌ " + e.message;
      }
    }

    document.getElementById("authLogin").onclick = () => submit("login");
    document.getElementById("authRegister").onclick = () => submit("register");
    const onKey = (ev) => { if (ev.key === "Enter") submit("login"); };
    document.getElementById("authEmail").addEventListener("keydown", onKey);
    document.getElementById("authPwd").addEventListener("keydown", onKey);
    setTimeout(() => { const e = document.getElementById("authEmail"); if (e) e.focus(); }, 50);
  }

  /* ---------- 侧边栏用户区 ---------- */
  function renderUserArea() {
    const header = document.querySelector(".sidebar-header");
    if (!header) return;
    const old = document.getElementById("userArea");
    if (old) old.remove();

    const div = document.createElement("div");
    div.id = "userArea";
    div.className = "user-area";
    if (state.loggedIn && state.user) {
      div.innerHTML = `
        <span class="user-email" title="${esc((state.user.email || ""))}">📧 ${esc((state.user.email || ""))}</span>
        <button class="user-logout" id="btnLogout">退出</button>`;
      const btn = div.querySelector("#btnLogout");
      if (btn) btn.onclick = () => { logout(); };
    } else {
      div.innerHTML = `<button class="user-login" id="btnAuthOpen">🔑 登录</button>`;
      const btn = div.querySelector("#btnAuthOpen");
      if (btn) btn.onclick = () => { renderAuthScreen(); };
    }
    header.appendChild(div);
  }

  /* ---------- 启动：恢复登录态 / 显示登录页 ---------- */
  async function boot() {
    const ses = await SB.ensureSession(); // 过期自动续期
    if (ses && ses.user) {
      state.loggedIn = true;
      state.user = ses.user;
      try { await pullAll(); } catch (e) { console.warn("[sync] 恢复拉取失败:", e.message); }
      state.ready = true;
      renderUserArea();
    } else {
      state.ready = false;
      renderAuthScreen();
    }
  }

  document.addEventListener("DOMContentLoaded", () => { boot(); });
  window.addEventListener("beforeunload", () => {
    // 退出页面时尝试冲刷待同步数据（尽力而为）
    if (state.dirty.size && state.loggedIn) { flush(); }
  });

  return { state, flush, pullAll, doAuth, logout };
})();
