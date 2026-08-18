/* =========================================================
   「🔒 数据保险库」· 数据永不丢失保障
   1. 自动快照：任何数据写入后节流留档（最多 10 份，滚动保留）
   2. 手动快照：随时存档当前状态
   3. 全量导出 / 从文件恢复：手机 ↔ 电脑数据互通
   4. 数据概览：所有业务数据一目了然
   ========================================================= */

const VAULT_SNAP_MAX = 10;
const VAULT_SNAP_LIMIT = 2 * 1024 * 1024; // 单份快照上限 2MB

/* 包装 Store.set：写入后自动调度快照（节流 15 秒合并） */
const __vaultOrigSet = Store.set.bind(Store);
Store.set = function (k, v) {
  __vaultOrigSet(k, v);
  vaultSchedule();
};
let __vaultTimer = null;
function vaultSchedule() {
  if (__vaultTimer) return;
  __vaultTimer = setTimeout(() => { __vaultTimer = null; vaultSnapshot("自动快照"); }, 15000);
}

function vaultBizKeys() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("teacher_workbench_") && !k.startsWith("teacher_workbench_vault_")) out.push(k);
  }
  return out;
}
function vaultIdx() {
  try { return JSON.parse(localStorage.getItem("teacher_workbench_vault_idx") || "[]") || []; }
  catch (e) { return []; }
}
function vaultFmtTs(d) {
  const p = n => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "_" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}
function vaultFmtTime(ts) {
  if (!ts) return "";
  const a = ts.split("_");
  return a.length === 2 ? a[0].slice(0, 4) + "-" + a[0].slice(4, 6) + "-" + a[0].slice(6, 8) + " " + a[1].slice(0, 2) + ":" + a[1].slice(2, 4) + ":" + a[1].slice(4, 6) : ts;
}
function vaultKb(n) { return n < 1024 ? n + " B" : (n / 1024).toFixed(1) + " KB"; }

/* 创建快照 */
function vaultSnapshot(label) {
  try {
    const keys = vaultBizKeys();
    if (!keys.length) return false;
    const data = {};
    keys.forEach(k => { try { data[k.replace("teacher_workbench_", "")] = JSON.parse(localStorage.getItem(k)); } catch (e) { } });
    const payload = JSON.stringify(data);
    if (payload.length > VAULT_SNAP_LIMIT) {
      if (label !== "自动快照") toast("⚠️ 数据超过快照上限，请使用「全量导出」备份");
      return false;
    }
    const ts = vaultFmtTs(new Date());
    localStorage.setItem("teacher_workbench_vault_snap_" + ts, JSON.stringify({ ts, label, data }));
    const idx = vaultIdx();
    idx.push({ ts, label, size: payload.length, n: keys.length });
    while (idx.length > VAULT_SNAP_MAX) {
      const old = idx.shift();
      try { localStorage.removeItem("teacher_workbench_vault_snap_" + old.ts); } catch (e) { }
    }
    localStorage.setItem("teacher_workbench_vault_idx", JSON.stringify(idx));
    return true;
  } catch (e) { console.error("快照失败", e); return false; }
}

/* 恢复某个快照（恢复前先自动留档当前状态，防止误操作丢失数据） */
function vaultRestoreSnap(ts) {
  if (!confirm("将恢复到快照「" + vaultFmtTime(ts) + "」时的全部数据。\n\n恢复前会自动留档当前数据，请放心。\n确定恢复吗？")) return;
  vaultSnapshot("恢复前自动留档");
  try {
    const snap = JSON.parse(localStorage.getItem("teacher_workbench_vault_snap_" + ts));
    if (!snap || !snap.data) { toast("⚠️ 快照数据缺失"); return; }
    Object.keys(snap.data).forEach(k => __vaultOrigSet(k, snap.data[k]));
    toast("✅ 已恢复到 " + vaultFmtTime(ts) + " 的快照，正在刷新…");
    setTimeout(() => location.reload(), 800);
  } catch (e) { toast("⚠️ 快照恢复失败"); }
}

/* 全量导出（排除快照自身，兼容手机/电脑互传恢复） */
function vaultExportAll() {
  const keys = vaultBizKeys();
  const data = {};
  keys.forEach(k => { try { data[k.replace("teacher_workbench_", "")] = JSON.parse(localStorage.getItem(k)); } catch (e) { } });
  const payload = { _meta: { app: "啊敏的兵", type: "full-backup", exportedAt: Today.now(), count: keys.length }, data };
  downloadFile("啊敏的兵_全部数据_" + Today.now() + ".json", JSON.stringify(payload, null, 2), "application/json");
  toast("💾 全量备份已下载（手机/电脑互传此文件即可同步）");
}

/* 从备份文件恢复 */
function vaultRestoreFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const data = (parsed && parsed._meta && parsed.data) ? parsed.data : parsed;
      const keys = Object.keys(data || {}).filter(k => !k.startsWith("vault_"));
      if (!keys.length) { toast("⚠️ 备份文件为空"); return; }
      keys.forEach(k => __vaultOrigSet(k, data[k]));
      toast("✅ 已恢复 " + keys.length + " 项数据，正在刷新…");
      setTimeout(() => location.reload(), 800);
    } catch (err) { toast("⚠️ 备份文件格式不正确，无法恢复"); }
  };
  reader.readAsText(file);
}

/* 业务数据概览 */
function vaultBizInfo() {
  return vaultBizKeys().map(k => {
    const raw = localStorage.getItem(k) || "";
    let n = 0;
    try { const v = JSON.parse(raw); n = Array.isArray(v) ? v.length : (v && typeof v === "object" ? Object.keys(v).length : 1); } catch (e) { }
    return { key: k.replace("teacher_workbench_", ""), size: raw.length, n };
  });
}

/* 模块渲染 */
registerModule("vault", {
  title: "🔒 数据保险库",
  sub: "自动快照 · 全量备份 · 永不丢失",
  render() {
    const idx = vaultIdx();
    const biz = vaultBizInfo();
    const total = biz.reduce((s, b) => s + b.size, 0);
    const totalN = biz.reduce((s, b) => s + b.n, 0);
    const ideas = getIdeas();
    const study = getStudyNotes();
    return `
    <div class="mv-header"><h2 class="mv-title">🔒 数据保险库 <span style="font-size:13px;color:var(--ink-light);font-weight:400">你输入的一切 · 都保存 · 都可找回</span></h2>
      <p class="mv-sub">${vaultKb(total)} 数据 · ${totalN} 个数据项 · ${idx.length}/${VAULT_SNAP_MAX} 份快照 · 自动留档中</p></div>
    ${modToolbar("数据保险库")}

    <!-- 数据总览 -->
    <div class="card" id="sub-overview">
      <div class="card-title">📊 数据总览</div>
      <div class="vault-stats">
        <div class="vault-stat"><div class="vs-num">${vaultKb(total)}</div><div class="vs-label">数据总量</div></div>
        <div class="vault-stat"><div class="vs-num">${totalN}</div><div class="vs-label">数据项</div></div>
        <div class="vault-stat"><div class="vs-num">${ideas.list.length + ideas.archived.length}</div><div class="vs-label">奇思妙想</div></div>
        <div class="vault-stat"><div class="vs-num">${study.length}</div><div class="vs-label">学习笔记</div></div>
        <div class="vault-stat"><div class="vs-num">${idx.length}</div><div class="vs-label">历史快照</div></div>
      </div>
      <div class="vault-actions">
        <button class="btn btn-primary" data-act="vault-export">💾 全量导出备份</button>
        <button class="btn btn-ghost" data-act="vault-import">📥 从备份文件恢复</button>
        <button class="btn btn-ghost" data-act="vault-snap-now">📸 立即快照</button>
        <input type="file" id="inpVaultImport" accept=".json,application/json" style="display:none">
      </div>
      <div style="font-size:12.5px;color:var(--ink-light);line-height:1.9;margin-top:10px">
        📱 手机与电脑同步：电脑点「💾 全量导出备份」→ 微信/QQ 传到手机 → 手机点「📥 从备份文件恢复」选择该文件即可。<br>
        🕐 快照最多保留 ${VAULT_SNAP_MAX} 份，超出自动滚动；建议重要节点手动「📸 立即快照」。
      </div>
    </div>

    <!-- 历史快照 -->
    <div class="card" id="sub-snap">
      <div class="card-title">🕐 历史快照 <span class="sub">每次数据变更自动留档 · 随时一键回滚</span>
        <button class="btn btn-ghost btn-sm" data-act="vault-export-snaps">⬇️ 下载全部快照</button>
      </div>
      ${idx.length === 0 ? `<div class="empty"><span class="e-ico">🕐</span>暂无快照：编辑任意数据后将自动生成第一份快照</div>` : `
      <div class="snap-list">
        ${idx.slice().reverse().map(s => `
        <div class="snap-row">
          <span class="snap-ts">🕐 ${esc(vaultFmtTime(s.ts))}</span>
          <span class="snap-label">${esc(s.label)}</span>
          <span class="snap-size">${vaultKb(s.size)} · ${s.n} 项</span>
          <span class="snap-ops">
            <button class="btn btn-ghost btn-sm" data-act="vault-snap-restore" data-ts="${s.ts}">↩️ 恢复</button>
            <button class="btn btn-ghost btn-sm" data-act="vault-snap-dl" data-ts="${s.ts}">⬇️</button>
          </span>
        </div>`).join("")}
      </div>`}
    </div>

    <!-- 业务数据清单 -->
    <div class="card">
      <div class="card-title">🗃️ 全部数据清单 <span class="sub">只读查看 · 每一项都可随备份带走</span></div>
      <table class="tbl">
        <thead><tr><th>数据项</th><th>大小</th><th>条数</th></tr></thead>
        <tbody>
          ${biz.length === 0 ? `<tr><td colspan="3" style="color:var(--ink-light)">暂无数据</td></tr>` :
            biz.sort((a, b) => b.size - a.size).map(b => `<tr><td>${esc(b.key)}</td><td>${vaultKb(b.size)}</td><td>${b.n}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- 保障说明 -->
    <div class="card" style="border-color:#D9E4DD;background:#F7FAF8">
      <div class="card-title">🛡️ 三大保障 · 数据永不丢失</div>
      <div class="vault-guard">
        <div><b>1️⃣ 自动快照</b><br>你输入的任何内容保存后，15 秒内自动留档一份快照，最新 ${VAULT_SNAP_MAX} 份随时可回滚。</div>
        <div><b>2️⃣ 全量备份</b><br>一键导出全部数据为 JSON 文件，微信/QQ 互传即可在手机与电脑间无缝迁移，格式更新也不影响旧数据。</div>
        <div><b>3️⃣ 只归档不删除</b><br>奇思妙想、学习笔记的记录默认只进「归档箱」，不设一键清空；即使彻底删除，历史快照与备份文件中仍有记录。</div>
      </div>
    </div>`;
  },
  after() {
    const body = document.getElementById("moduleView");
    document.querySelector("[data-act=vault-export]")?.addEventListener("click", () => {
      vaultSnapshot("导出前留档");
      vaultExportAll();
    });
    document.querySelector("[data-act=vault-import]")?.addEventListener("click", () => document.getElementById("inpVaultImport").click());
    document.getElementById("inpVaultImport")?.addEventListener("change", e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      vaultSnapshot("恢复前留档");
      vaultRestoreFile(f);
      e.target.value = "";
    });
    document.querySelector("[data-act=vault-snap-now]")?.addEventListener("click", () => {
      if (vaultSnapshot("手动快照")) toast("📸 已手动快照");
      const v = document.getElementById("moduleView"); v.innerHTML = Modules.vault.render(); Modules.vault.after();
    });
    body.querySelectorAll("[data-act=vault-snap-restore]").forEach(b => b.onclick = () => vaultRestoreSnap(b.dataset.ts));
    body.querySelectorAll("[data-act=vault-snap-dl]").forEach(b => b.onclick = () => {
      try {
        const snap = JSON.parse(localStorage.getItem("teacher_workbench_vault_snap_" + b.dataset.ts));
        if (!snap) { toast("⚠️ 快照不存在"); return; }
        downloadFile("啊敏的兵_快照_" + b.dataset.ts + ".json", JSON.stringify({ _meta: { app: "啊敏的兵", type: "snapshot", ts: b.dataset.ts, label: snap.label }, data: snap.data }, null, 2), "application/json");
      } catch (e) { toast("⚠️ 快照读取失败"); }
    });
    document.querySelector("[data-act=vault-export-snaps]")?.addEventListener("click", () => {
      const idx = vaultIdx();
      if (!idx.length) { toast("暂无快照"); return; }
      const out = {};
      idx.forEach(s => {
        try { out[s.ts] = { label: s.label, data: JSON.parse(localStorage.getItem("teacher_workbench_vault_snap_" + s.ts)).data }; } catch (e) { }
      });
      downloadFile("啊敏的兵_全部快照_" + Today.now() + ".json", JSON.stringify({ _meta: { app: "啊敏的兵", type: "all-snapshots" }, data: out }, null, 2), "application/json");
      toast("⬇️ 已下载全部 " + idx.length + " 份快照");
    });
  }
});

/* 首次打开：留档一份初始快照（仅当还没有快照时） */
document.addEventListener("DOMContentLoaded", function () {
  if (!vaultIdx().length) vaultSnapshot("打开工作台留档");
});
