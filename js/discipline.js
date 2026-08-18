/* =========================================================
   ⚠️ 违纪统计 · 记录 · 统计 · 导出
   纯前端 localStorage 持久化（数据 key：disciplineRecords）
   依赖：Store / esc / toast / openModal / closeModal / uid /
        Today / downloadFile / modToolbar / defaultClasses
   ========================================================= */

/* ---------- 数据存取 ---------- */
function getDisciplineRecords() {
  const list = Store.get("disciplineRecords", []);
  if (!Array.isArray(list)) return [];
  // 按 createdAt 倒序（新建在前）
  return list.slice().sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
}
function saveDisciplineRecords(list) {
  Store.set("disciplineRecords", Array.isArray(list) ? list : []);
}

/* 取指定班级的学生姓名数组（兼容缺失名单） */
function discStudentsOfClass(className) {
  const all = Store.get("students", {});
  const arr = (className && all[className]) || [];
  return arr.map(s => (s && s.name ? String(s.name) : "")).filter(Boolean);
}

/* ---------- 统计区（卡片内容） ---------- */
function discStatsInner(records) {
  // 各班违纪次数
  const byClass = {};
  records.forEach(r => { byClass[r.cls] = (byClass[r.cls] || 0) + 1; });
  const classChips = Object.keys(byClass)
    .sort((a, b) => byClass[b] - byClass[a])
    .map(k => `<span class="stat-chip">🏫 ${esc(k)} · ${byClass[k]} 次</span>`)
    .join("") || `<span class="stat-chip">🏫 暂无班级数据</span>`;

  // 常违纪学生 TOP5
  const byStu = {};
  records.forEach(r => {
    const key = (r.name || "") + "@" + (r.cls || "");
    if (!r.name) return;
    byStu[key] = (byStu[key] || 0) + 1;
  });
  const top = Object.keys(byStu)
    .sort((a, b) => byStu[b] - byStu[a])
    .slice(0, 5);

  let topHtml;
  if (top.length) {
    let rows = "";
    top.forEach((k, i) => {
      const [name, cls] = k.split("@");
      rows += `<tr>
        <td class="num">${i + 1}</td>
        <td>${esc(name)}</td>
        <td>${esc(cls)}</td>
        <td class="num">${byStu[k]}</td>
      </tr>`;
    });
    topHtml = `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>排名</th><th>学生</th><th>班级</th><th>次数</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  } else {
    topHtml = `<div style="color:var(--ink-light);font-size:13px;padding:6px 0">暂无足够数据</div>`;
  }

  return `
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
      <span class="stat-chip">📝 共 ${records.length} 条记录</span>
      ${classChips}
    </div>
    <div style="font-size:13px;font-weight:600;margin:4px 0 6px;color:var(--ink-soft)">🏆 常违纪学生 TOP5</div>
    ${topHtml}`;
}

/* ---------- 记录列表（表格/空态） ---------- */
function discListInner(records, filterCls, kw) {
  let list = records.slice();
  if (filterCls && filterCls !== "all") list = list.filter(r => r.cls === filterCls);
  if (kw) {
    const k = String(kw).toLowerCase();
    list = list.filter(r =>
      (r.name + r.event + r.result + r.cls).toLowerCase().includes(k)
    );
  }
  if (!list.length) {
    return `<div style="text-align:center;color:var(--ink-light);padding:28px 0;font-size:13px">
      暂无违纪记录 · 点击「➕ 新增记录」开始登记
    </div>`;
  }
  let rows = "";
  list.forEach(r => {
    rows += `<tr>
      <td style="white-space:nowrap">${esc(r.date || "")}</td>
      <td>${esc(r.cls || "")}</td>
      <td>${esc(r.name || "")}</td>
      <td style="max-width:320px;white-space:pre-wrap;word-break:break-all">${esc(r.event || "")}</td>
      <td style="max-width:240px;white-space:pre-wrap;word-break:break-all">${esc(r.result || "")}</td>
      <td class="num"><button class="btn btn-danger btn-sm" data-act="disc-del" data-id="${esc(r.id)}">删除</button></td>
    </tr>`;
  });
  return `<div class="tbl-wrap"><table class="tbl">
    <thead><tr>
      <th>违纪日期</th><th>班级</th><th>学生</th>
      <th>事件描述</th><th>处理结果</th><th>操作</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

/* ---------- 模块主渲染 ---------- */
function renderDiscipline() {
  const records = getDisciplineRecords();
  const classes = Store.get("classes", defaultClasses());
  const clsOpts = classes
    .map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`)
    .join("");

  return `
  <div id="discView">
    <div class="mv-header"><h2 class="mv-title">⚠️ 违纪统计</h2>
      <p class="mv-sub">记录 · 统计 · 导出 · 共 ${records.length} 条</p></div>
    ${modToolbar("违纪统计")}

    <div class="card">
      <div class="card-title">🛠 操作栏 <span class="sub">筛选 / 搜索 / 新增 / 导出</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
        <select class="inp" id="discFilterCls" style="min-width:140px">
          <option value="all">全部班级</option>
          ${clsOpts}
        </select>
        <input class="inp" id="discSearch" placeholder="搜索 学生/事件/处理结果" style="flex:1;min-width:200px">
        <button class="btn btn-primary" data-act="disc-add">➕ 新增记录</button>
        <button class="btn btn-ghost" data-act="disc-export">⬇️ 导出CSV</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📊 统计 <span class="sub">各班违纪次数 · 常违纪学生 TOP5</span></div>
      <div id="discStats">${discStatsInner(records)}</div>
    </div>

    <div class="card">
      <div class="card-title">📋 违纪记录 <span class="sub">点击「删除」可移除单条记录（需确认）</span></div>
      <div id="discList">${discListInner(records, "all", "")}</div>
    </div>

    <div style="font-size:12px;color:var(--ink-light);margin-top:10px">
      💡 数据自动保存到本地浏览器，可用顶部「💾 备份」整体导出与跨设备同步。
    </div>
  </div>`;
}

/* ---------- 局部刷新（筛选/搜索后） ---------- */
function discRefreshAll() {
  const records = getDisciplineRecords();
  const filterCls = (document.getElementById("discFilterCls") || {}).value || "all";
  const kw = (document.getElementById("discSearch") || {}).value || "";
  const stats = document.getElementById("discStats");
  const list = document.getElementById("discList");
  if (stats) stats.innerHTML = discStatsInner(records);
  if (list) list.innerHTML = discListInner(records, filterCls, kw);
}

/* ---------- 新增记录弹窗 ---------- */
function discOpenAdd() {
  const classes = Store.get("classes", defaultClasses());
  if (!classes.length) {
    toast("请先在「班级管理」中添加班级");
    return;
  }
  const clsOpts = classes
    .map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`)
    .join("");
  const today = Today.now();

  openModal(`
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>
        <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">班级</label>
        <select class="inp" id="discCls" style="width:100%">${clsOpts}</select>
      </div>
      <div>
        <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">学生（随班级联动）</label>
        <select class="inp" id="discStu" style="width:100%"></select>
      </div>
      <div>
        <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">违纪日期</label>
        <input type="date" class="inp" id="discDate" value="${esc(today)}" style="width:100%">
      </div>
      <div>
        <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">违纪事件描述</label>
        <textarea class="inp" id="discEvent" rows="3" placeholder="如：课间在走廊追逐打闹" style="width:100%;resize:vertical"></textarea>
      </div>
      <div>
        <label class="lbl" style="display:block;font-size:12px;margin-bottom:4px;color:var(--ink-soft)">处理结果</label>
        <textarea class="inp" id="discResult" rows="2" placeholder="如：谈话教育 + 通知家长" style="width:100%;resize:vertical"></textarea>
      </div>
    </div>
  `, "新增违纪记录");

  const clsSel = document.getElementById("discCls");
  const stuSel = document.getElementById("discStu");
  function fillStudents() {
    const arr = discStudentsOfClass(clsSel.value);
    stuSel.innerHTML = arr.length
      ? arr.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("")
      : `<option value="">（该班暂无学生名单，请先在「学生信息」录入）</option>`;
  }
  clsSel.onchange = fillStudents;
  fillStudents();

  const ok = document.querySelector("[data-act=modal-ok]");
  if (ok) ok.onclick = discSaveRecord;
}

/* ---------- 保存记录 ---------- */
function discSaveRecord() {
  const cls = (document.getElementById("discCls") || {}).value || "";
  const name = (document.getElementById("discStu") || {}).value || "";
  const date = (document.getElementById("discDate") || {}).value || "";
  const event = (document.getElementById("discEvent") || {}).value.trim();
  const result = (document.getElementById("discResult") || {}).value.trim();

  if (!cls) return toast("请选择班级");
  if (!name) return toast("该班级暂无学生名单，请先在「学生信息」中录入");
  if (!date) return toast("请选择违纪日期");
  if (!event) return toast("请填写违纪事件描述");

  const list = Store.get("disciplineRecords", []);
  list.push({
    id: uid(),
    cls,
    name,
    date,
    event,
    result: result || "—",
    createdAt: new Date().toISOString()
  });
  saveDisciplineRecords(list);
  closeModal();
  toast("✅ 已记录违纪");
  discRefreshAll();
}

/* ---------- 删除记录 ---------- */
function discDelete(id) {
  if (!id) return;
  if (!confirm("确定删除该条违纪记录？此操作不可撤销。")) return;
  const list = Store.get("disciplineRecords", []);
  const next = list.filter(r => r.id !== id);
  saveDisciplineRecords(next);
  toast("🗑 已删除");
  discRefreshAll();
}

/* ---------- 导出 CSV（带 BOM，Excel 可直接打开） ---------- */
function discExportCSV() {
  const records = getDisciplineRecords();
  if (!records.length) { toast("暂无可导出的数据"); return; }
  const filterCls = (document.getElementById("discFilterCls") || {}).value || "all";
  const kw = (document.getElementById("discSearch") || {}).value || "";
  let list = records.slice();
  if (filterCls !== "all") list = list.filter(r => r.cls === filterCls);
  if (kw) {
    const k = kw.toLowerCase();
    list = list.filter(r => (r.name + r.event + r.result + r.cls).toLowerCase().includes(k));
  }
  if (!list.length) { toast("当前筛选下无数据"); return; }

  const rows = [["违纪日期", "班级", "学生", "事件描述", "处理结果", "记录时间"]];
  list.forEach(r => rows.push([
    r.date || "",
    r.cls || "",
    r.name || "",
    r.event || "",
    r.result || "",
    (r.createdAt || "").replace("T", " ").slice(0, 19)
  ]));
  const csv = rows.map(row =>
    row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(",")
  ).join("\n");
  downloadFile("违纪统计_" + Today.now() + ".csv", "\ufeff" + csv, "text/csv;charset=utf-8");
  toast("⬇️ 已导出 " + list.length + " 条记录");
}

/* ---------- 模块注册 ---------- */
registerModule("discipline", {
  title: "⚠️ 违纪统计",
  sub: "记录 · 统计 · 导出",
  render() { return renderDiscipline(); },
  after() {
    const root = document.getElementById("discView");
    if (!root) return;

    // 点击事件委托：新增 / 导出 / 删除
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "disc-add") discOpenAdd();
      else if (act === "disc-export") discExportCSV();
      else if (act === "disc-del") discDelete(btn.dataset.id);
    });

    // 班级筛选
    const filterCls = document.getElementById("discFilterCls");
    if (filterCls) filterCls.addEventListener("change", discRefreshAll);

    // 关键词搜索（防抖 200ms）
    const search = document.getElementById("discSearch");
    if (search) {
      let timer = null;
      search.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(discRefreshAll, 200);
      });
    }
  }
});
