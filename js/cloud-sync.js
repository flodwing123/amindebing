/* =========================================================
   云端同步 · 手机电脑数据自动同步
   免费方案：用户配置一个免费的 JSON 云存储（如 jsonbin.io）
   打开时自动拉取、数据变更后自动推送
   ========================================================= */

/* 同步配置 key */
const SYNC_CFG_KEY = "cloudSyncCfg";   // { endpoint, apiKey, binId, autoSync }
const SYNC_TS_KEY = "cloudSyncTs";     // 上次同步时间戳

/* 读取同步配置 */
function getSyncCfg() {
  return Store.get(SYNC_CFG_KEY, { endpoint: "", apiKey: "", binId: "", autoSync: true });
}

/* 保存同步配置 */
function saveSyncCfg(cfg) {
  Store.set(SYNC_CFG_KEY, cfg);
}

/* 构造云端 URL（jsonbin.io 风格） */
function syncUrl(cfg) {
  if (cfg.binId && cfg.endpoint) {
    return cfg.endpoint.replace(/\/$/, "") + "/" + cfg.binId;
  }
  return cfg.endpoint || "";
}

/* 收集所有业务数据（排除保险库快照前缀，避免数据量过大） */
function syncCollectData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith("teacher_workbench_vault_snap")) continue; // 快照不入云
    if (k.startsWith("teacher_workbench_vault_idx")) continue;
    if (k === "teacher_workbench_" + SYNC_CFG_KEY) continue;   // 配置本身不入云
    if (k === "teacher_workbench_" + SYNC_TS_KEY) continue;
    try {
      const raw = localStorage.getItem(k);
      if (raw && raw.length < 500000) { // 跳过超大值
        data[k] = JSON.parse(raw);
      }
    } catch (e) { /* 跳过非 JSON */ }
  }
  return { _meta: { ts: Date.now(), device: navigator.userAgent.slice(0, 80) }, data };
}

/* 推送数据到云端 */
async function syncPush() {
  const cfg = getSyncCfg();
  if (!cfg.endpoint) return { ok: false, msg: "未配置云端地址" };
  const payload = syncCollectData();
  try {
    const url = syncUrl(cfg);
    const headers = { "Content-Type": "application/json" };
    if (cfg.apiKey) headers["X-Master-Key"] = cfg.apiKey;
    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      Store.set(SYNC_TS_KEY, { ts: Date.now(), dir: "push" });
      return { ok: true, msg: "推送成功" };
    }
    return { ok: false, msg: "HTTP " + res.status };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

/* 从云端拉取数据 */
async function syncPull() {
  const cfg = getSyncCfg();
  if (!cfg.endpoint) return { ok: false, msg: "未配置云端地址" };
  try {
    const url = syncUrl(cfg);
    const headers = {};
    if (cfg.apiKey) headers["X-Master-Key"] = cfg.apiKey;
    const res = await fetch(url + "?t=" + Date.now(), { headers });
    if (!res.ok) return { ok: false, msg: "HTTP " + res.status };
    const payload = await res.json();
    if (!payload || !payload.data) return { ok: false, msg: "云端数据格式异常" };
    const cloudTs = payload._meta ? payload._meta.ts : 0;
    const localTs = Store.get(SYNC_TS_KEY, { ts: 0 }).ts;
    // 云端比本地新才覆盖
    if (cloudTs > localTs) {
      const keys = Object.keys(payload.data);
      let count = 0;
      keys.forEach(k => {
        try {
          localStorage.setItem(k, JSON.stringify(payload.data[k]));
          count++;
        } catch (e) { /* 跳过 */ }
      });
      Store.set(SYNC_TS_KEY, { ts: cloudTs, dir: "pull" });
      return { ok: true, msg: "已从云端同步 " + count + " 项数据", reload: true };
    }
    return { ok: true, msg: "本地已是最新", reload: false };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

/* 自动推送（防抖 3 秒） */
let syncPushTimer = null;
function syncAutoPush() {
  const cfg = getSyncCfg();
  if (!cfg.autoSync || !cfg.endpoint) return;
  if (syncPushTimer) clearTimeout(syncPushTimer);
  syncPushTimer = setTimeout(() => { syncPush().catch(() => {}); }, 3000);
}

/* 启动时自动拉取 */
async function syncAutoPull() {
  const cfg = getSyncCfg();
  if (!cfg.autoSync || !cfg.endpoint) return;
  const r = await syncPull();
  if (r.ok && r.reload) {
    toast("☁️ 已从云端同步最新数据");
    setTimeout(() => location.reload(), 800);
  }
}

/* 包装 Store.set 触发自动推送（与保险库快照共存） */
const _origSet = Store.set;
Store.set = function(key, val) {
  _origSet.call(Store, key, val);
  syncAutoPush();
};

/* ---------- 渲染同步设置面板 ---------- */
function renderSyncPanel() {
  const cfg = getSyncCfg();
  const ts = Store.get(SYNC_TS_KEY, null);
  return `
    <div class="card">
      <div class="card-title">☁️ 云端同步设置
        <span class="sub">手机和电脑数据自动同步</span>
      </div>
      <div style="font-size:13px;color:var(--ink-light);margin:0 0 16px;line-height:1.7">
        <b>这是什么？</b> 配置一个免费的云端 JSON 存储地址后，你的工作台数据会<b>自动</b>在手机和电脑之间同步——
        电脑上改了，手机打开自动更新；手机上改了，电脑打开也自动更新。<br>
        <b>推荐免费方案：</b> 注册 <a href="https://jsonbin.io" target="_blank" style="color:var(--green)">jsonbin.io</a>
        （免费 10MB 足够），创建一个 Bin 后把地址和 API Key 填入下方即可。<br>
        <b>不想配？</b> 也可以继续用「💾 备份 / 📥 恢复」手动传 JSON 文件互传，效果一样。
      </div>
      <div class="sync-form">
        <label class="lbl">云端 API 地址</label>
        <input class="inp" id="syncEndpoint" placeholder="https://api.jsonbin.io/v3/b" value="${esc(cfg.endpoint)}">

        <label class="lbl">API Key（Master Key）</label>
        <input class="inp" id="syncApiKey" type="password" placeholder="粘贴你的 jsonbin Master Key" value="${esc(cfg.apiKey)}">

        <label class="lbl">Bin ID</label>
        <input class="inp" id="syncBinId" placeholder="粘贴你的 Bin ID" value="${esc(cfg.binId)}">

        <label class="sync-check">
          <input type="checkbox" id="syncAuto" ${cfg.autoSync ? "checked" : ""}>
          <span>开启自动同步（数据变更后自动推送 + 打开时自动拉取）</span>
        </label>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
          <button class="btn btn-primary" data-act="sync-save">💾 保存配置</button>
          <button class="btn btn-ghost" data-act="sync-push">⬆️ 立即推送</button>
          <button class="btn btn-ghost" data-act="sync-pull">⬇️ 立即拉取</button>
        </div>

        ${ts ? `<div class="sync-status">上次同步：${new Date(ts.ts).toLocaleString("zh-CN")}（${ts.dir === "push" ? "推送" : "拉取"}）</div>` : `<div class="sync-status" style="color:var(--ink-light)">尚未同步过</div>`}
      </div>
    </div>
  `;
}

/* 注册为可被保险库或设置访问的面板 */
/* 在数据保险库模块底部追加同步入口 */
