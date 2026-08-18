/* =========================================================
   📮 请假管理 · 登记 · 统计 · 导出
   纯前端 localStorage 持久化（数据 key：leaveRecords）
   依赖：Store / esc / toast / openModal / closeModal / uid /
        Today / downloadFile / modToolbar / defaultClasses
   ========================================================= */

/* ---------- 数据存取 ---------- */
function getLeaveRecords() {
  const list = Store.get("leaveRecords", []);
  if (!Array.isArray(list)) return [];
  // 按 createdAt 倒序（新建在前）
  return list.slice().sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
}
function saveLeaveRecords(list) {
  Store.set("leaveRecords", Array.isArray(list) ? list : []);
}

/* 取指定班级的学生姓名数组（兼容缺失名单） */
function leaveStudentsOfClass(className) {
  const all = Store.get("students", {});
  const arr = (className && all[className]) || [];
  return arr.map(s => (s && s.name ? String(s.name) : "")).filter(Boolean);
}

/* 计算天数 = 结束日期 - 开始日期 + 1 */
function leaveCalcDays(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  if (isNaN(s) || isNaN(e)) return 0;
  const diff = Math.round((e - s) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

/* ---------- 统计区（卡片内容） ---------- */
function leaveStatsInner(records) {
  // 各班请假人次
  const byClass = {};
  records.forEach(r => { byClass[r.cls] = (byClass[r.cls] || 0) + 1; });
  const classChips = Object.keys(byClass)
    .sort((a, b) => byClass[b] - byClass[a])
    .map(k => `<span class="stat-chip">🏫 ${esc(k)} · ${byClass[k]} 人次</span>`)
    .join("") || `<span class="stat-chip">🏫 暂无班级数据</span>`;

  // 各类型分布
  const byType = { "病假": 0, "事假": 0, "其他": 0 };
  records.forEach(r => { if (byType[r.type] != null) byType[r.type]++; else byType["其他"]++; });
  const typeChips = Object.keys(byType)
    .map(k => `<span class="stat-chip">📋 ${esc(k)} · ${byType[k]} 次</span>`)
    .join("");

  // 本月请假统计
  const now = Today.now();
  const monthPrefix = now.slice(0, 7); // YYYY-MM
  const monthRecords = records.filter(r => (r.start || "").startsWith(monthPrefix));
  const monthDays = monthRecords.reduce((sum, r) => sum + (Number(r.days) || 0), 0);
  const monthChip = `<span class="stat-chip">📅 本月 ${monthRecords.length} 人次 · 合计 ${monthDays} 天</span>`;

  // 审批状态分布
  const byStatus = { "待批": 0, "已批": 0, "已销假": 0 };
  records.forEach(r => { if (byStatus[r.status] != null) byStatus[r.status]++; else byStatus["待批"]++; });
  const statusChips = Object.keys(byStatus)
    .map(k => `<span class="stat-chip">🔖 ${esc(k)} · ${byStatus[k]}</span>`)
    .join("");

  return `
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
      <span class="stat-chip">📝 共 ${records.length} 条记录</span>
      ${monthChip}
    </div>
    <div style="font-size:13px;font-weight:600;margin:4px 0 6px;color:var(--ink-soft)">🏫 各班请假人次</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">${classChips}</div>
    <div style="font-size:13px;font-weight:600;margin:4px 0 6px;color:var(--ink-soft)">📋 类型分布</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">${typeChips}</div>
    <div style="font-size:13px;font-weight:600;margin:4px 0 6px;color:var(--ink-soft)">🔖 审批状态</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">${statusChips}</div>`;
}

/* ---------- 记录列表（表格/空态） ---------- */
function leaveListInner(records, filterCls, filterType) {
  let list = records.slice();
  if (filterCls && filterCls !== "all") list = list.filter(r => r.cls === filterCls);
  if (filterType && filterType !== "all") list = list.filter(r => r.type === filterType);
  if (!list.length) {
    return `<div style="text-align:center;color:var(--ink-light);padding:28px 0;font-size:13px">
      暂无请假记录 · 点击「➕ 新增记录」开始登记
    </div>`;
  }
  let rows = "";
  list.forEach(r => {
    rows += `<tr>
      <td>${esc(r.name || "")}</td>
      <td>${esc(r.cls || "")}</td>
      <td>${esc(r.type || "")}</td>
      <td style="white-space:nowrap">${esc(r.start || "")}</td>
      <td style="white-space:nowrap">${esc(r.end || "")}</td>
      <td class="num">${esc(r.days || 0)}</td>
      <td style="max-width:200px;white-space:pre-wrap;word-break:break-all">${esc(r.reason || "")}</td>
      <td>${esc(r.status || "")}</td>
      <td class="num"><button class="btn btn-danger btn-sm" data-act="leave-del" data-id="${esc(r.id)}">删除</button></td>
    </tr>`;
  });
  return `<div class="tbl-wrap"><table class="tbl">
    <thead><tr>
      <th>学生</th><th>班级</th><th>类型</th>
      <th>开始日期</th><th>结束日期</th><th>天数</th>
      <th>原因</th><th>审批状态</th><th>操作</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

/* ---------- 模块主渲染 ---------- */
function renderLeave() {
  const records = getLeaveRecords();
  const classes = Store.get("classes", defaultClasses());
  const clsOpts = classes
    .map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`)
    .join("");
  const typeOpts = ["病假", "事假", "其他"]
    .map(t => `<option value="${t}">${t}</option>`).join("");

  return `
  <div id="leaveView">
    <div class="mv-header"><h2 class="mv-title">📮 请假管理</h2>
      <p class="mv-sub">登记 · 统计 · 导出 · 共 ${records.length} 条</p></div>
    ${modToolbar("请假管理")}

    <div class="card">
      <div class="card-title">🛠 操作栏 <span class="sub">筛选 / 新增 / 导出</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
        <select class="inp" id="leaveFilterCls" style="min-width:140px">
          <option value="all">全部班级</option>
          ${clsOpts}
        </select>
        <select class="inp" id="leaveFilterType" style="min-width:120px">
          <option value="all">全部类型</option>
          ${typeOpts}
        </select>
        <button class="btn btn-primary" data-act="leave-add">➕ 新增记录</button>
        <button class="btn btn-ghost" data-act="leave-export">⬇️ 导出CSV</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📊 统计 <span class="sub">各班人次 · 类型分布 · 本月统计 · 审批状态</span></div>
      <div id="leaveStats">${leaveStatsInner(records)}</div>
    </div>

    <div class="card">
      <div class="card-title">📋 请假记录 <span class="sub">点击「删除」可移除单条记录（需确认）</span></div>
      <div id="leaveList">${leaveListInner(records, "all", "all")}</div>
    </div>

    <div style="font-size:12px;color:var(--ink-light);margin-top:10px">
      💡 数据自动保存到本地浏览器，可用顶部「💾 备份」整体导出与跨设备同步。
    </div>
  </div>`;
}

/* ---------- 局部刷新（筛选后） ---------- */
function leaveRefreshAll() {
  const records = getLeaveRecords();
  const filterCls = (document.getElementById("leaveFilterCls") || {}).value || "all";
  const filterType = (document.getElementById("leaveFilterType") || {}).value || "all";
  const stats = document.getElementById("leaveStats");
  const list = document.getElementById("leaveList");
  if (stats) stats.innerHTML = leaveStatsInner(records);
  if (list) list.innerHTML = leaveListInner(records, filterCls, filterType);
}

/* ---------- 新增记录弹窗 ---------- */
function leaveOpenAdd() {
  const classes = Store.get("classes", defaultClasses());
  if (!classes.length) {
    toast("请先在「班级管理」中添加班级");
    return;
  }
  const clsOpts = classes
    .map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`)
    .join("");
  const today = Today.now();
  const typeOpts = ["病假", "事假", "其他"]
    .map(t => `<option value="${t}">${t}</option>`).join("");
  const statusOpts = ["待批", "已批", "已销假"]
    .map(s => `<option value="${s}">${s}</option>`).join("");

  openModal(`
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>
        <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">班级</label>
        <select class="inp" id="leaveCls" style="width:100%">${clsOpts}</select>
      </div>
      <div>
        <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">学生（随班级联动）</label>
        <select class="inp" id="leaveStu" style="width:100%"></select>
      </div>
      <div style="display:flex;gap:10px">
        <div style="flex:1">
          <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">请假类型</label>
          <select class="inp" id="leaveType" style="width:100%">${typeOpts}</select>
        </div>
        <div style="flex:1">
          <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">审批状态</label>
          <select class="inp" id="leaveStatus" style="width:100%">${statusOpts}</select>
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <div style="flex:1">
          <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">开始日期</label>
          <input type="date" class="inp" id="leaveStart" value="${esc(today)}" style="width:100%">
        </div>
        <div style="flex:1">
          <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">结束日期</label>
          <input type="date" class="inp" id="leaveEnd" value="${esc(today)}" style="width:100%">
        </div>
        <div style="flex:0 0 80px">
          <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">天数</label>
          <input type="text" class="inp" id="leaveDays" value="1" readonly style="width:100%;text-align:center;background:var(--bg-alt)">
        </div>
      </div>
      <div>
        <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">请假原因</label>
        <textarea class="inp" id="leaveReason" rows="3" placeholder="如：感冒发烧，需在家休息" style="width:100%;resize:vertical"></textarea>
      </div>
    </div>
  `, "新增请假记录");

  const clsSel = document.getElementById("leaveCls");
  const stuSel = document.getElementById("leaveStu");
  function fillStudents() {
    const arr = leaveStudentsOfClass(clsSel.value);
    stuSel.innerHTML = arr.length
      ? arr.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("")
      : `<option value="">（该班暂无学生名单，请先在「学生信息」录入）</option>`;
  }
  clsSel.onchange = fillStudents;
  fillStudents();

  // 天数自动计算
  const startInp = document.getElementById("leaveStart");
  const endInp = document.getElementById("leaveEnd");
  const daysInp = document.getElementById("leaveDays");
  function updateDays() {
    const d = leaveCalcDays(startInp.value, endInp.value);
    daysInp.value = d > 0 ? d : 0;
  }
  startInp.addEventListener("change", updateDays);
  endInp.addEventListener("change", updateDays);
  updateDays();

  const ok = document.querySelector("[data-act=modal-ok]");
  if (ok) ok.onclick = leaveSaveRecord;
}

/* ---------- 保存记录 ---------- */
function leaveSaveRecord() {
  const cls = (document.getElementById("leaveCls") || {}).value || "";
  const name = (document.getElementById("leaveStu") || {}).value || "";
  const type = (document.getElementById("leaveType") || {}).value || "病假";
  const status = (document.getElementById("leaveStatus") || {}).value || "待批";
  const start = (document.getElementById("leaveStart") || {}).value || "";
  const end = (document.getElementById("leaveEnd") || {}).value || "";
  const reason = (document.getElementById("leaveReason") || {}).value.trim();

  if (!cls) return toast("请选择班级");
  if (!name) return toast("该班级暂无学生名单，请先在「学生信息」中录入");
  if (!start) return toast("请选择开始日期");
  if (!end) return toast("请选择结束日期");
  if (new Date(end) < new Date(start)) return toast("结束日期不能早于开始日期");
  if (!reason) return toast("请填写请假原因");

  const days = leaveCalcDays(start, end);
  if (days <= 0) return toast("天数计算异常，请检查日期");

  const list = Store.get("leaveRecords", []);
  list.push({
    id: uid(),
    cls,
    name,
    type,
    start,
    end,
    days,
    reason,
    status,
    createdAt: new Date().toISOString()
  });
  saveLeaveRecords(list);
  closeModal();
  toast("✅ 已登记请假");
  leaveRefreshAll();
}

/* ---------- 删除记录 ---------- */
function leaveDelete(id) {
  if (!id) return;
  if (!confirm("确定删除该条请假记录？此操作不可撤销。")) return;
  const list = Store.get("leaveRecords", []);
  const next = list.filter(r => r.id !== id);
  saveLeaveRecords(next);
  toast("🗑 已删除");
  leaveRefreshAll();
}

/* ---------- 导出 CSV（带 BOM，Excel 可直接打开） ---------- */
function leaveExportCSV() {
  const records = getLeaveRecords();
  if (!records.length) { toast("暂无可导出的数据"); return; }
  const filterCls = (document.getElementById("leaveFilterCls") || {}).value || "all";
  const filterType = (document.getElementById("leaveFilterType") || {}).value || "all";
  let list = records.slice();
  if (filterCls !== "all") list = list.filter(r => r.cls === filterCls);
  if (filterType !== "all") list = list.filter(r => r.type === filterType);
  if (!list.length) { toast("当前筛选下无数据"); return; }

  const rows = [["学生", "班级", "请假类型", "开始日期", "结束日期", "天数", "原因", "审批状态", "记录时间"]];
  list.forEach(r => rows.push([
    r.name || "",
    r.cls || "",
    r.type || "",
    r.start || "",
    r.end || "",
    r.days || 0,
    r.reason || "",
    r.status || "",
    (r.createdAt || "").replace("T", " ").slice(0, 19)
  ]));
  const csv = rows.map(row =>
    row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(",")
  ).join("\n");
  downloadFile("请假记录_" + Today.now() + ".csv", "\ufeff" + csv, "text/csv;charset=utf-8");
  toast("⬇️ 已导出 " + list.length + " 条记录");
}

/* ---------- 模块注册 ---------- */
registerModule("leave", {
  title: "📮 请假管理",
  sub: "请假统计 · 导出Excel",
  render() { return renderLeave(); },
  after() {
    const root = document.getElementById("leaveView");
    if (!root) return;

    // 点击事件委托：新增 / 导出 / 删除
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "leave-add") leaveOpenAdd();
      else if (act === "leave-export") leaveExportCSV();
      else if (act === "leave-del") leaveDelete(btn.dataset.id);
    });

    // 班级筛选
    const filterCls = document.getElementById("leaveFilterCls");
    if (filterCls) filterCls.addEventListener("change", leaveRefreshAll);

    // 类型筛选
    const filterType = document.getElementById("leaveFilterType");
    if (filterType) filterType.addEventListener("change", leaveRefreshAll);
  }
});
