/* =========================================================
   认证 + 多端数据同步引擎
   - 邮箱登录 / 注册 / 登出（token 持久化 localStorage，刷新恢复登录态）
   - 登录后拉取云端数据组装到本地；本地修改先写本地再串行推送云端
   - 删除：云端键集合快照差集（云端有、本地已删 → 删除云端行）
   - 串行队列 + 防抖，避免并发重复保存
   - 登出：清除本地全部业务数据 + token + 全局状态，重绘至登录页（账号隔离）
   ========================================================= */

const Sync = (() => {
  /* 转义函数：优先复用页面已有的 esc，缺失时用内置实现兜底
     （避免依赖其它脚本文件的加载顺序，那会让整个同步模块直接崩掉） */
  const esc = (typeof window !== "undefined" && typeof window.esc === "function")
    ? window.esc
    : (s) => String(s == null ? "" : s).replace(/[<>&"]/g,
        c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));

  const state = {
    loggedIn: false,
    user: null,
    ready: false,          // 就绪前（初始拉取中）不推送，防止默认值覆盖云端
    cloudKeys: new Set(),  // 云端键集合快照（差集删除用）
    dirty: new Set(),      // 本地变更待推送的键
    deleted: new Set(),    // 本地已删除的键
    queue: Promise.resolve(),
    syncing: false,
    offline: false,        // 离线模式：云端不可达，纯本地运行
    lastError: null
  };

  const OFFLINE_KEY = "teacher_workbench_offline_mode";

  /* ---------- 本机安全快照 ----------
     独立存放（key 不带 teacher_workbench_ 前缀），因此：
     · 不会同步到云端  · 退出登录清空本机数据时也不会被删掉
     万一误触退出 / 清缓存，可从这里找回。只保留最近一份。 */
  const SNAP_KEY = "wb_autosnap_v1";
  let snapTimer = null;
  function takeSnapshot() {
    try {
      const snap = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf("teacher_workbench_") === 0 && k !== OFFLINE_KEY) {
          snap[k] = localStorage.getItem(k);
        }
      }
      if (!Object.keys(snap).length) return;
      localStorage.setItem(SNAP_KEY, JSON.stringify({ t: Date.now(), data: snap }));
    } catch (e) { /* 配额满则跳过 */ }
  }
  function scheduleSnapshot() {
    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(takeSnapshot, 15000); // 停止操作 15 秒后落盘
  }
  function readSnapshot() {
    try {
      const raw = localStorage.getItem(SNAP_KEY);
      if (!raw) return null;
      const j = JSON.parse(raw);
      return (j && j.data && Object.keys(j.data).length) ? j : null;
    } catch (e) { return null; }
  }
  function restoreSnapshot() {
    const s = readSnapshot();
    if (!s) { alert("本机没有找到可恢复的快照。"); return; }
    const d = new Date(s.t);
    if (!confirm(`找到 ${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} 的本机快照，共 ${Object.keys(s.data).length} 项数据。\n\n恢复到这台设备吗？`)) return;
    Object.keys(s.data).forEach(k => { try { localStorage.setItem(k, s.data[k]); } catch (e) {} });
    toast("✅ 已恢复，正在刷新…");
    setTimeout(() => location.reload(), 800);
  }

  /* ---------- 包装 Store（vault / cloud-sync 包装之后，保持链式） ---------- */
  const _set = Store.set, _del = Store.del;
  Store.set = function (key, val) {
    _set.call(Store, key, val);
    scheduleSnapshot();
    if (state.loggedIn && state.ready && SB.isSyncKey(Store._ns + key)) {
      state.dirty.add(key);
      state.deleted.delete(key);
      scheduleFlush();
    }
  };
  Store.del = function (key) {
    _del.call(Store, key);
    scheduleSnapshot();
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

  /* ---------- 离线模式切换 ---------- */
  function setOffline(err) {
    if (state.offline) return;
    state.offline = true;
    state.lastError = err ? (err.message || String(err)) : "未知错误";
    try { localStorage.setItem(OFFLINE_KEY, "1"); } catch (e) {}
    renderSyncBadge();
    showOfflineBanner();
    startReconnect();
  }
  function setOnline() {
    if (!state.offline) return;
    state.offline = false;
    state.lastError = null;
    try { localStorage.removeItem(OFFLINE_KEY); } catch (e) {}
    hideOfflineBanner();
    renderSyncBadge();
    stopReconnect();
    if (state.loggedIn && state.ready) enqueue(flush);
  }

  /* 自动重连探测：离线时每 60 秒试一次，通了自动恢复同步 */
  let reconnectTimer = null;
  function startReconnect() {
    stopReconnect();
    reconnectTimer = setInterval(async () => {
      if (!state.offline) { stopReconnect(); return; }
      const ok = await SB.ping(5000);
      if (ok) {
        console.info("[sync] 云端已恢复，自动重新同步");
        setOnline();
        if (state.loggedIn) {
          try { await pullAll(); } catch (e) {}
        }
      }
    }, 60000);
  }
  function stopReconnect() {
    if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }
  }

  /* ---------- 推送：差集删除 + 变更 upsert ---------- */
  async function flush() {
    if (state.syncing || !state.loggedIn || !state.ready) return;
    if (state.offline) return;   // 离线：保留待同步队列，不发起注定失败的请求
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
      if (e && e.offline) setOffline(e);
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
    // 先探活，避免让用户在登录页干等 20 秒超时
    const ok = await SB.ping(6000);
    if (!ok) {
      setOffline(new Error("云端不可达"));
      throw new Error("连不上云端服务器。可点下方「离线使用」先正常用起来，数据存在本机。");
    }
    const user = kind === "login" ? await SB.signIn(email.trim(), password) : await SB.signUp(email.trim(), password);
    state.user = user;
    state.loggedIn = true;
    setOnline();
    try { await pullAll(); }
    catch (e) {
      console.warn("[sync] 首次拉取失败，将继续使用本地数据:", e.message);
      if (e && e.offline) setOffline(e);
    }
    state.ready = true;
    return user;
  }

  async function logout() {
    // 退出会清空本机数据 —— 先拦一道，避免误触把数据清没了
    const tips = state.offline
      ? "当前是离线模式，云端没连上。\n退出会清除本机全部数据且无法从云端找回。\n\n强烈建议先点「💾 备份」导出 JSON。\n\n确定仍要退出吗？"
      : (state.dirty.size
        ? "还有数据尚未同步到云端，退出会清除本机数据。\n建议先点「💾 备份」导出保存。\n\n确定要退出吗？"
        : "退出会清除本机数据（云端仍保留，下次登录自动取回）。\n确定退出吗？");
    if (!window.confirm(tips)) return;
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

  /* ---------- 样式注入（免改 style.css，替换本文件即生效） ---------- */
  function injectStyles() {
    if (document.getElementById("syncOfflineStyle")) return;
    const s = document.createElement("style");
    s.id = "syncOfflineStyle";
    s.textContent = `
.offline-banner{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));
  z-index:9998;display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;
  background:#FFF4E5;border:1px solid #F5D9A8;color:#8A5300;font-size:13px;line-height:1.4;
  box-shadow:0 4px 16px rgba(0,0,0,.12)}
.ob-dot{width:8px;height:8px;border-radius:50%;background:#F0A020;flex:none}
.ob-text{flex:1;min-width:0}
.ob-retry,.ob-close{border:none;background:rgba(0,0,0,.06);color:#8A5300;border-radius:8px;
  padding:6px 10px;font-size:12px;cursor:pointer;min-height:32px;flex:none}
.ob-close{font-size:16px;line-height:1;padding:4px 9px}
.sync-badge{display:flex;align-items:center;gap:6px;font-size:12px;padding:6px 10px;
  border-radius:8px;margin-bottom:8px;background:#F1F5F4;color:#4A5D57;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sync-badge .sb-dot{width:7px;height:7px;border-radius:50%;flex:none;background:#9AA5A1}
.sync-badge.is-online .sb-dot{background:#2E9E6B}
.sync-badge.is-offline{background:#FFF1F0;color:#B03A2E}
.sync-badge.is-offline .sb-dot{background:#E05A4B}
.auth-offline-tip{background:#FFF4E5;border:1px solid #F5D9A8;color:#8A5300;border-radius:10px;
  padding:10px 12px;font-size:13px;line-height:1.55;margin-bottom:12px;
  display:flex;flex-direction:column;gap:4px}
.auth-btn-offline{margin-top:10px;background:transparent;border:1px dashed #B9C4C0;color:#5A6B65}
@media (max-width:768px){
  .offline-banner{left:8px;right:8px;font-size:12px;padding:9px 10px;bottom:calc(8px + env(safe-area-inset-bottom))}
  .ob-text{font-size:12px}
}
`;
    document.head.appendChild(s);
  }

  /* ---------- 顶部离线横幅 ---------- */
  function showOfflineBanner() {
    if (document.getElementById("offlineBanner")) return;
    const b = document.createElement("div");
    b.id = "offlineBanner";
    b.className = "offline-banner";
    b.innerHTML = `
      <span class="ob-dot"></span>
      <span class="ob-text">离线模式 · 数据存在本机，未同步到云端</span>
      <button class="ob-retry" id="obRetry">重试连接</button>
      <button class="ob-close" id="obClose" title="关闭">×</button>`;
    document.body.appendChild(b);
    const retry = document.getElementById("obRetry");
    if (retry) retry.onclick = async () => {
      retry.disabled = true; retry.textContent = "连接中…";
      const ok = await SB.ping(8000);
      if (ok) { setOnline(); toast("✅ 云端已恢复，正在同步"); if (state.loggedIn) { try { await pullAll(); } catch (e) {} } }
      else { toast("❌ 仍然连不上云端"); retry.disabled = false; retry.textContent = "重试连接"; }
    };
    const close = document.getElementById("obClose");
    if (close) close.onclick = () => hideOfflineBanner();
  }
  function hideOfflineBanner() {
    const b = document.getElementById("offlineBanner");
    if (b) b.remove();
  }

  /* ---------- 侧边栏同步状态徽章 ---------- */
  function renderSyncBadge() {
    const old = document.getElementById("syncBadge");
    if (old) old.remove();
    const footer = document.querySelector(".sidebar-footer");
    if (!footer) return;
    const d = document.createElement("div");
    d.id = "syncBadge";
    d.className = "sync-badge " + (state.offline ? "is-offline" : (state.loggedIn ? "is-online" : "is-local"));
    if (state.offline) {
      const n = state.dirty.size + state.deleted.size;
      d.innerHTML = `<span class="sb-dot"></span>离线${n ? " · " + n + " 项待同步" : ""}`;
      d.title = "云端连不上，数据暂存在本机。恢复连接后自动同步。";
    } else if (state.loggedIn) {
      const mail = String((state.user && state.user.email) || "").replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
      d.innerHTML = `<span class="sb-dot"></span>已同步 · ${mail}`;
    } else {
      d.innerHTML = `<span class="sb-dot"></span>本机模式`;
    }
    footer.insertBefore(d, footer.firstChild);
  }

  /* 只刷新登录页的网络提示区，不重绘整个卡片（避免清空用户正在输入的邮箱密码） */
  function updateAuthNetTip(ok) {
    const el = document.getElementById("authNetTip");
    if (!el) return;
    if (ok) {
      el.style.display = "none";
    } else {
      el.style.display = "";
      el.innerHTML = `<b>⚠️ 暂时连不上云端</b>
        <span>可以先「离线使用」，数据存在这台设备本机，记得定期点「💾 备份」导出保存。</span>`;
    }
  }

  /* ---------- 进入离线模式（跳过登录，直接用本机数据） ---------- */
  function enterOfflineMode() {
    const host = document.getElementById("authScreen");
    if (host) host.style.display = "none";
    state.loggedIn = false;
    state.user = null;
    state.ready = false;
    setOffline(new Error("用户选择离线模式"));
    renderUserArea();
    toast("已进入离线模式，数据存在本机");
  }

  /* ---------- 登录页 UI ---------- */
  function renderAuthScreen() {
    const host = document.getElementById("authScreen");
    if (!host) return;
    host.style.display = "block";
    const offTip = `<div class="auth-offline-tip" id="authNetTip">
           <span>正在检测云端连接…</span>
         </div>`;
    host.innerHTML = `
      <div class="auth-card">
        <div class="auth-logo">🌿</div>
        <h1 class="auth-title">啊敏的兵</h1>
        <p class="auth-sub">登录后自动同步手机 / 电脑数据</p>
        ${offTip}
        <input class="auth-inp" id="authEmail" type="email" placeholder="邮箱" autocomplete="email">
        <input class="auth-inp" id="authPwd" type="password" placeholder="密码（至少 6 位）" autocomplete="current-password">
        <div class="auth-err" id="authErr"></div>
        <button class="auth-btn auth-btn-primary" id="authLogin">登 录</button>
        <button class="auth-btn auth-btn-ghost" id="authRegister">注册新账号</button>
        <button class="auth-btn auth-btn-offline" id="authOffline">📴 离线使用（数据存本机）</button>
        <p class="auth-tip">🔒 数据仅本人可见 · 多设备实时同步</p>
      </div>`;

    const offBtn = document.getElementById("authOffline");
    if (offBtn) offBtn.onclick = () => enterOfflineMode();

    // 本机有安全快照时，给一个恢复入口（防误删 / 防退出清空）
    if (readSnapshot()) {
      const tip = host.querySelector(".auth-tip");
      if (tip) {
        const b = document.createElement("button");
        b.className = "auth-btn auth-btn-offline";
        b.textContent = "🔄 从本机快照恢复数据";
        b.onclick = () => restoreSnapshot();
        tip.parentNode.insertBefore(b, tip);
      }
    }

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
    renderSyncBadge();
  }

  /* ---------- 启动：恢复登录态 / 显示登录页 ---------- */
  async function boot() {
    const wasOffline = (() => { try { return localStorage.getItem(OFFLINE_KEY) === "1"; } catch (e) { return false; } })();

    let ses = null;
    try { ses = await SB.ensureSession(); }        // 过期自动续期
    catch (e) { console.warn("[sync] 会话恢复失败:", e.message); if (e && e.offline) setOffline(e); }

    if (ses && ses.user) {
      state.loggedIn = true;
      state.user = ses.user;
      if (!state.offline) {
        try { await pullAll(); }
        catch (e) {
          console.warn("[sync] 恢复拉取失败，使用本机数据:", e.message);
          if (e && e.offline) setOffline(e);
        }
      }
      state.ready = true;
      renderUserArea();
      if (state.offline) showOfflineBanner();
    } else {
      // 未登录：先把登录页画出来（界面立刻可见），再异步探测云端，探测完只刷新提示区
      state.ready = false;
      renderAuthScreen();
      const ok = await SB.ping(6000);
      if (wasOffline || !ok) setOffline(new Error("云端不可达"));
      else { try { localStorage.removeItem(OFFLINE_KEY); } catch (e) {} }
      updateAuthNetTip(ok);
    }
  }

  document.addEventListener("DOMContentLoaded", () => { injectStyles(); boot(); });
  window.addEventListener("beforeunload", () => {
    // 退出页面时尝试冲刷待同步数据（尽力而为）
    if (state.dirty.size && state.loggedIn) { flush(); }
  });

  return { state, flush, pullAll, doAuth, logout, enterOfflineMode, restoreSnapshot, takeSnapshot, readSnapshot };
})();
