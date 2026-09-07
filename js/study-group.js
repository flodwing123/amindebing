/* =========================================================
   「👥 学习小组」· 按 Excel/CSV 分组名册管理
   - 不做自动分配；老师事先在 Excel 里写好「谁在哪一组」
   - 上传 xlsx / csv → 解析 → 多套方案管理 → 卡片/表格/统计三视图
   - 数据 key: studyGroups -> { version, activePlanId, plans: {id: {...}} }
   - 自动随 cloud-sync / Supabase 同步（沿用现有 key 收集机制）
   ========================================================= */

const StudyGroups = (() => {
  const KEY = "studyGroups";
  const DEFAULT = { version: 1, activePlanId: null, plans: {} };

  function get() { return Store.get(KEY, DEFAULT); }
  function set(v) { Store.set(KEY, v); }

  function newPlan(name, groups, source) {
    const total = groups.reduce((s, g) => s + g.members.length, 0);
    return {
      id: "plan_" + uid(),
      name: (name || "未命名方案").trim().slice(0, 30) || "未命名方案",
      uploadedAt: Today.now() + " " + new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      source: source || "manual",
      totalStudents: total,
      groups: groups
    };
  }

  function savePlan(plan, setActive) {
    const data = get();
    data.plans[plan.id] = plan;
    if (setActive || !data.activePlanId) data.activePlanId = plan.id;
    set(data);
  }

  function deletePlan(id) {
    const data = get();
    delete data.plans[id];
    if (data.activePlanId === id) {
      const remain = Object.keys(data.plans);
      data.activePlanId = remain.length ? remain[0] : null;
    }
    set(data);
  }

  function setActive(id) {
    const data = get();
    data.activePlanId = id;
    set(data);
  }

  function renamePlan(id, newName) {
    const data = get();
    if (data.plans[id]) {
      data.plans[id].name = (newName || "").trim().slice(0, 30) || data.plans[id].name;
      set(data);
    }
  }

  function getActive() {
    const data = get();
    return data.activePlanId ? data.plans[data.activePlanId] : null;
  }

  function listPlans() {
    const data = get();
    return Object.values(data.plans).sort((a, b) => (b.uploadedAt > a.uploadedAt ? 1 : -1));
  }

  return { get, set, newPlan, savePlan, deletePlan, setActive, renamePlan, getActive, listPlans, KEY };
})();

/* =========================================================
   SheetJS 动态加载（CDN · 按需懒加载）
   ========================================================= */
let _sgXLSXPromise = null;
function sgLoadXLSX() {
  if (typeof XLSX !== "undefined") return Promise.resolve(XLSX);
  if (_sgXLSXPromise) return _sgXLSXPromise;
  _sgXLSXPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    s.async = true;
    s.onload = () => {
      if (typeof XLSX !== "undefined") resolve(XLSX);
      else { _sgXLSXPromise = null; reject(new Error("SheetJS 加载后未定义")); }
    };
    s.onerror = () => { _sgXLSXPromise = null; reject(new Error("无法加载 xlsx 解析库（请检查网络）")); };
    document.head.appendChild(s);
  });
  return _sgXLSXPromise;
}

/* =========================================================
   CSV 解析（支持 BOM / CRLF / 引号转义 / 逗号+制表符+分号）
   ========================================================= */
function sgParseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  let cur = "", row = [], inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; continue; }
        inQuote = false; continue;
      }
      cur += c;
    } else {
      if (c === '"') { inQuote = true; continue; }
      if (c === "," || c === "\t" || c === ";") { row.push(cur); cur = ""; continue; }
      if (c === "\r") continue;
      if (c === "\n") { row.push(cur); cur = ""; rows.push(row); row = []; continue; }
      cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => String(c || "").trim()));
}

/* =========================================================
   通用分组解析（兼容 xlsx / csv 输出的二维数组）
   - 自动识别「组号」列与「姓名」列
   - 接受「第1组」「1组」「第N小组」「1」「一」等多种写法
   ========================================================= */
const SG_KEY_G = ["组号", "组别", "小组", "分组", "组名", "队伍", "小组号", "group", "grp", "team"];
const SG_KEY_N = ["姓名", "学生", "名字", "成员", "name", "student", "member"];
const SG_CN_NUM = { "零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10, "十一": 11, "十二": 12 };
function sgExtractNo(label) {
  const s = String(label || "").trim();
  if (!s) return null;
  const numMatch = s.match(/\d+/);
  if (numMatch) return parseInt(numMatch[0], 10);
  for (const k of Object.keys(SG_CN_NUM).sort((a, b) => b.length - a.length)) {
    if (s.includes(k)) return SG_CN_NUM[k];
  }
  return null;
}

function sgParseGroupRows(rows) {
  if (!rows || !rows.length) throw new Error("文件为空");
  const header = rows[0].map(c => String(c || "").trim());
  let gCol = -1, nCol = -1;
  header.forEach((h, i) => {
    const hl = h.toLowerCase();
    if (gCol < 0 && SG_KEY_G.some(k => hl.includes(k.toLowerCase()))) gCol = i;
    if (nCol < 0 && SG_KEY_N.some(k => hl.includes(k.toLowerCase()))) nCol = i;
  });
  // 兜底：两列场景默认第 1 列是组号、第 2 列是姓名
  if (gCol < 0 && nCol < 0) {
    if (header.length >= 2) { gCol = 0; nCol = 1; }
    else throw new Error("未找到「组号」和「姓名」列（请检查表头）");
  } else {
    if (gCol < 0) gCol = 0;
    if (nCol < 0) nCol = header.length > 1 ? 1 : 0;
  }

  const groupMap = {};
  let fallbackNo = 0;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rawNo = String((row && row[gCol]) || "").trim();
    const name = String((row && row[nCol]) || "").trim();
    if (!name) continue;
    let no = sgExtractNo(rawNo);
    if (no == null) no = ++fallbackNo;
    if (!groupMap[no]) {
      groupMap[no] = { no, label: rawNo || ("第" + no + "组"), members: [] };
    }
    groupMap[no].members.push(name);
  }
  const groups = Object.values(groupMap).sort((a, b) => a.no - b.no);
  if (!groups.length) throw new Error("没读到任何学生（检查姓名列是否为空）");
  return { groups, gCol, nCol, totalCols: header.length };
}

/* =========================================================
   文件读取：xlsx / csv / txt
   ========================================================= */
async function sgReadFile(file) {
  const name = (file.name || "").toLowerCase();
  const isXlsx = name.endsWith(".xlsx") || name.endsWith(".xls");
  if (isXlsx) {
    const XLSX = await sgLoadXLSX();
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
    return { rows: rows.map(r => r.map(c => String(c == null ? "" : c))), source: "xlsx", sheetName };
  }
  const text = await file.text();
  return { rows: sgParseCSV(text), source: "csv" };
}

/* =========================================================
   下载 CSV 模板（2 列：组号 + 姓名）
   ========================================================= */
function sgDownloadTemplate() {
  const csv = "组号,姓名\n第1组,张三\n第1组,李四\n第2组,王五\n第2组,赵六\n第3组,钱七\n第3组,孙八\n";
  downloadFile("学习小组模板_" + Today.now() + ".csv", "\ufeff" + csv, "text/csv;charset=utf-8");
  toast("⬇️ 模板已下载（含 3 组示例）");
}

/* =========================================================
   模块渲染
   ========================================================= */
let sgViewMode = "card"; // card | table | chart
let sgSearch = "";

function sgTotalGroups(plan) { return plan ? plan.groups.length : 0; }
function sgTotalStudents(plan) { return plan ? plan.totalStudents : 0; }
function sgGroupNameByPlan(plan, idx) {
  if (!plan || !plan.groups[idx]) return "";
  return plan.groups[idx].label || ("第" + plan.groups[idx].no + "组");
}

function sgRosterRows(plan) {
  /* 转成 [{组号, 组名, 姓名}, ...] 用于表格视图 */
  if (!plan) return [];
  const out = [];
  plan.groups.forEach(g => {
    g.members.forEach(name => out.push({ groupNo: g.no, groupLabel: g.label, name }));
  });
  return out;
}

/* 统计每组人数柱状图（用现有 chart-bar 样式） */
function sgRenderChart(plan) {
  if (!plan || !plan.groups.length) return "";
  const max = Math.max(...plan.groups.map(g => g.members.length), 1);
  const bars = plan.groups.map(g => {
    const h = Math.max(4, Math.round(g.members.length / max * 170));
    return `<div class="chart-bar">
      <div class="cb-val">${g.members.length}</div>
      <div class="cb-col" style="height:${h}px"></div>
      <div class="cb-name">${esc(g.label)}</div>
    </div>`;
  }).join("");
  const avg = (plan.totalStudents / plan.groups.length).toFixed(1);
  return `<div class="chart-wrap">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
      <b style="color:var(--green-700)">📊 各组人数分布</b>
      <span style="font-size:12px;color:var(--ink-light)">共 ${plan.groups.length} 组 · ${plan.totalStudents} 人 · 平均 ${avg} 人/组</span>
    </div>
    <div class="chart-bars">${bars}</div>
  </div>`;
}

/* 卡片视图 */
function sgRenderCards(plan) {
  if (!plan || !plan.groups.length) return "";
  const max = Math.max(...plan.groups.map(g => g.members.length), 1);
  const palette = ["scrap-1", "scrap-2", "scrap-3", "scrap-4", "scrap-5"];
  return `<div class="sg-cards">
    ${plan.groups.map((g, i) => {
      const colorCls = palette[i % palette.length];
      const isMax = g.members.length === max;
      return `<div class="scrap-card ${colorCls} sg-group-card">
        <span class="sc-ico">👥</span>
        <div class="sc-title">${esc(g.label)}</div>
        <div style="font-size:13px;line-height:1.8;opacity:.95">${g.members.map(m => `<span class="sg-chip">${esc(m)}</span>`).join("")}</div>
        <div class="sg-meta">
          <span class="sg-count">👤 ${g.members.length} 人${isMax ? " · 🏆 人数最多" : ""}</span>
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

/* 整班表格视图 */
function sgRenderTable(plan, search) {
  if (!plan || !plan.groups.length) return "";
  const rows = sgRosterRows(plan).filter(r => !search || r.name.includes(search) || r.groupLabel.includes(search));
  return `<div class="card">
    <div class="card-title">📋 整班名单（按组排列）<span class="sub">共 ${rows.length} 人${search ? " · 已按关键字过滤" : ""}</span></div>
    <div style="overflow-x:auto">
    <table class="tbl sg-tbl">
      <thead><tr><th style="width:80px">组号</th><th>组名</th><th>姓名</th></tr></thead>
      <tbody>
        ${rows.map(r => `<tr><td>${esc(r.groupLabel)}</td><td>第${r.groupNo}组</td><td><b>${esc(r.name)}</b></td></tr>`).join("")}
      </tbody>
    </table>
    </div>
  </div>`;
}

/* 顶部方案选择 + 操作栏 */
function sgRenderPlanBar() {
  const data = StudyGroups.get();
  const plans = Object.values(data.plans).sort((a, b) => (b.uploadedAt > a.uploadedAt ? 1 : -1));
  const activeId = data.activePlanId;
  const opts = plans.length
    ? plans.map(p => `<option value="${p.id}" ${p.id === activeId ? "selected" : ""}>${esc(p.name)} · ${p.groups.length}组/${p.totalStudents}人 · ${p.uploadedAt.slice(0, 10)}</option>`).join("")
    : `<option value="">（暂无方案）</option>`;
  return `
    <div class="sg-plan-bar">
      <div class="sg-plan-bar-l">
        <span style="font-weight:600;color:var(--ink)">📂 当前方案：</span>
        <select class="sel sg-plan-sel" id="sgPlanSel" style="min-width:240px;max-width:380px">${opts}</select>
        <button class="btn btn-ghost btn-sm" data-act="sg-rename" ${plans.length ? "" : "disabled"}>✏️ 重命名</button>
        <button class="btn btn-danger btn-sm" data-act="sg-del" ${plans.length ? "" : "disabled"}>🗑️ 删除方案</button>
      </div>
      <div class="sg-plan-bar-r">
        <button class="btn btn-ghost btn-sm" data-act="sg-template">⬇️ 下载模板</button>
        <button class="btn btn-ghost btn-sm" data-act="sg-manual">📝 网页内编辑</button>
        <label class="btn btn-primary btn-sm" style="cursor:pointer">
          📥 上传 Excel / CSV
          <input type="file" id="sgFileInput" accept=".xlsx,.xls,.csv,.txt" style="display:none">
        </label>
      </div>
    </div>
    <div id="sgUploadStatus"></div>`;
}

function sgRenderPlanInfo(plan) {
  if (!plan) return "";
  return `<div class="sg-info">
    <span class="badge badge-green">📂 ${esc(plan.name)}</span>
    <span class="badge badge-blue">📥 来源：${plan.source === "xlsx" ? "Excel" : (plan.source === "csv" ? "CSV" : "网页编辑")}</span>
    <span class="badge badge-amber">🕐 ${esc(plan.uploadedAt)}</span>
    <span style="color:var(--ink-light);font-size:12.5px">共 <b style="color:var(--green-700)">${plan.groups.length}</b> 组 · <b style="color:var(--green-700)">${plan.totalStudents}</b> 人</span>
  </div>`;
}

function sgRenderViewSwitch() {
  return `<div class="sg-view-switch">
      <button class="sg-view-btn ${sgViewMode === "card" ? "active" : ""}" data-view="card">🎴 卡片视图</button>
      <button class="sg-view-btn ${sgViewMode === "table" ? "active" : ""}" data-view="table">📋 整班表格</button>
      <button class="sg-view-btn ${sgViewMode === "chart" ? "active" : ""}" data-view="chart">📊 人数分布</button>
    </div>`;
}

registerModule("study-group", {
  title: "👥 学习小组",
  sub: "Excel 分组名册 · 多套方案 · 卡片/表格/统计",
  render() {
    const plan = StudyGroups.getActive();
    const empty = !plan;

    /* 空态：还没上传 */
    if (empty) {
      return `
      <div class="mv-header"><h2 class="mv-title">👥 学习小组 <span style="font-size:13px;color:var(--ink-light);font-weight:400">按 Excel 分组名册 · 卡片/表格/统计三视图</span></h2>
        <p class="mv-sub">还没有分组方案 · 先下载模板填好再上传</p></div>
      ${modToolbar("学习小组")}
      ${sgRenderPlanBar()}
      <div class="card" style="text-align:center;padding:40px 20px">
        <div style="font-size:48px;margin-bottom:10px">📥</div>
        <div style="font-weight:600;color:var(--green-700);font-size:16px;margin-bottom:6px">还没有学习小组方案</div>
        <div style="font-size:13px;color:var(--ink-light);margin-bottom:14px;line-height:1.8">
          1. 点 <b>⬇️ 下载模板</b> 拿到 2 列表格（组号 + 姓名）<br>
          2. 在 WPS / Office 里填好<b>您排好的分组</b>，存为 .xlsx 或 .csv<br>
          3. 点 <b>📥 上传 Excel / CSV</b> 导入到这里<br>
          4. 也可以直接 <b>📝 网页内编辑</b> 临时录入
        </div>
        <div style="font-size:12px;color:var(--ink-light)">💡 工作台不会自动分组，分组完全由您事先在 Excel 里定好</div>
      </div>`;
    }

    /* 主视图 */
    const head = `<div class="mv-header"><h2 class="mv-title">👥 学习小组 <span style="font-size:13px;color:var(--ink-light);font-weight:400">按 Excel 分组名册 · 卡片/表格/统计三视图</span></h2>
      <p class="mv-sub">${plan.name} · ${plan.groups.length} 组 · ${plan.totalStudents} 人</p></div>
    ${modToolbar("学习小组")}
    ${sgRenderPlanBar()}
    ${sgRenderPlanInfo(plan)}
    ${sgRenderViewSwitch()}
    <div id="sgViewBody">`;

    let body = "";
    if (sgViewMode === "card") {
      body = `<div style="margin-bottom:8px;font-size:12px;color:var(--ink-light)">🎴 每组一张卡片 · 名字多的组带 🏆 标识</div>${sgRenderCards(plan)}`;
    } else if (sgViewMode === "table") {
      body = `
      <div class="sg-search-row">
        <input class="inp" id="sgSearchInput" placeholder="🔍 搜索姓名 / 组名..." value="${esc(sgSearch)}" style="max-width:280px">
        <span style="font-size:12px;color:var(--ink-light)">${sgSearch ? "过滤中" : ""}</span>
      </div>${sgRenderTable(plan, sgSearch)}`;
    } else {
      body = sgRenderChart(plan);
    }

    /* 导出区 */
    const exportArea = `
    <div class="card" style="margin-top:14px">
      <div class="card-title">⬇️ 导出与分享 <span class="sub">手机/电脑都可以打印</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" data-act="sg-export-csv">📥 下载 CSV</button>
        <button class="btn btn-ghost btn-sm" data-act="sg-export-text">📝 复制纯文本</button>
        <button class="btn btn-ghost btn-sm" data-act="sg-export-print">🖨️ 打印名单</button>
      </div>
    </div>`;

    return head + body + exportArea + `</div>`;
  },
  after() {
    const data = StudyGroups.get();
    const plans = Object.values(data.plans);
    const plan = StudyGroups.getActive();

    /* 方案切换 */
    document.getElementById("sgPlanSel")?.addEventListener("change", (e) => {
      StudyGroups.setActive(e.target.value);
      rerenderSg();
      toast("✅ 已切换方案");
    });

    /* 上传文件 */
    const fileInput = document.getElementById("sgFileInput");
    fileInput?.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      await sgHandleUpload(file);
    });

    /* 顶部操作按钮 */
    document.querySelector("[data-act=sg-template]")?.addEventListener("click", sgDownloadTemplate);
    document.querySelector("[data-act=sg-manual]")?.addEventListener("click", sgOpenManualEditor);
    document.querySelector("[data-act=sg-rename]")?.addEventListener("click", () => {
      if (!plan) return;
      openModal(`<input class="inp" id="sgRenameInp" value="${esc(plan.name)}" maxlength="30">`, "重命名方案");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const v = document.getElementById("sgRenameInp").value.trim();
        if (v) { StudyGroups.renamePlan(plan.id, v); closeModal(); rerenderSg(); toast("✏️ 方案已重命名"); }
      };
    });
    document.querySelector("[data-act=sg-del]")?.addEventListener("click", () => {
      if (!plan) return;
      if (!confirm(`确定删除方案「${plan.name}」吗？\n\n该操作可在数据保险库的历史快照中恢复。`)) return;
      StudyGroups.deletePlan(plan.id);
      rerenderSg();
      toast("🗑️ 方案已删除");
    });

    /* 视图切换 */
    document.querySelectorAll("[data-view]").forEach(b => {
      b.onclick = () => {
        sgViewMode = b.dataset.view;
        rerenderSg();
      };
    });

    /* 搜索过滤 */
    const searchInp = document.getElementById("sgSearchInput");
    if (searchInp) {
      searchInp.addEventListener("input", () => {
        sgSearch = searchInp.value.trim();
        const body = document.getElementById("sgViewBody");
        if (body) body.innerHTML = sgRenderTable(plan, sgSearch);
      });
    }

    /* 导出 */
    document.querySelector("[data-act=sg-export-csv]")?.addEventListener("click", () => sgExportCSV(plan));
    document.querySelector("[data-act=sg-export-text]")?.addEventListener("click", () => sgExportText(plan));
    document.querySelector("[data-act=sg-export-print]")?.addEventListener("click", () => sgPrint(plan));
  }
});

function rerenderSg() {
  const view = document.getElementById("moduleView");
  if (!view) return;
  view.innerHTML = Modules["study-group"].render();
  Modules["study-group"].after();
}

/* =========================================================
   上传后的处理流程
   ========================================================= */
async function sgHandleUpload(file) {
  const statusEl = document.getElementById("sgUploadStatus");
  if (statusEl) statusEl.innerHTML = `<div class="sg-status loading">⏳ 正在解析 ${esc(file.name)} ...</div>`;
  try {
    const { rows, source, sheetName } = await sgReadFile(file);
    const parsed = sgParseGroupRows(rows);
    const totalStudents = parsed.groups.reduce((s, g) => s + g.members.length, 0);
    const totalGroups = parsed.groups.length;
    const defaultName = (file.name || "新方案").replace(/\.(xlsx|xls|csv|txt)$/i, "").slice(0, 30);

    if (statusEl) statusEl.innerHTML = `
      <div class="sg-status ok">
        ✅ 已识别 <b>${totalGroups}</b> 组 / <b>${totalStudents}</b> 人（来源：${source === "xlsx" ? "Excel · " + esc(sheetName || "Sheet1") : "CSV"}）<br>
        <span style="color:var(--ink-light);font-size:12px">识别列：第 ${parsed.gCol + 1} 列 = 组号 · 第 ${parsed.nCol + 1} 列 = 姓名</span>
      </div>`;

    openModal(`
      <div style="font-size:13px;color:var(--ink);line-height:1.7;margin-bottom:8px">
        文件解析成功！将创建为新方案：
      </div>
      <label style="font-size:12px;color:var(--ink-light)">方案名称</label>
      <input class="inp" id="sgPlanName" value="${esc(defaultName)}" maxlength="30" style="margin-bottom:10px">
      <label style="font-size:12px;color:var(--ink-light)">预览（前 8 行）</label>
      <div style="background:#F4FBF6;border:1px solid var(--line);border-radius:8px;padding:8px;font-size:12px;line-height:1.7;max-height:160px;overflow:auto;font-family:Menlo,Consolas,monospace">
        ${parsed.groups.slice(0, 4).map(g => `<div>📌 <b>${esc(g.label)}</b>（${g.members.length} 人）：${esc(g.members.slice(0, 4).join("、 "))}${g.members.length > 4 ? " …" : ""}</div>`).join("")}
        ${parsed.groups.length > 4 ? `<div style="color:var(--ink-light);margin-top:4px">… 还有 ${parsed.groups.length - 4} 组</div>` : ""}
      </div>
      `, "📥 确认导入");

    const ok = document.querySelector("[data-act=modal-ok]");
    ok.textContent = "导入并设为当前";
    ok.onclick = () => {
      const name = (document.getElementById("sgPlanName").value || defaultName).trim();
      const plan = StudyGroups.newPlan(name, parsed.groups, source);
      StudyGroups.savePlan(plan, true);
      sgViewMode = "card"; sgSearch = "";
      closeModal();
      rerenderSg();
      toast(`✅ 已创建方案「${plan.name}」· ${plan.totalStudents} 人`);
    };
  } catch (err) {
    if (statusEl) statusEl.innerHTML = `<div class="sg-status err">❌ 解析失败：${esc(err.message || String(err))}<br><span style="color:var(--ink-light);font-size:12px">请确认：① 文件是否 xlsx/csv/txt ② 至少有「组号」「姓名」两列</span></div>`;
    toast("❌ 解析失败：" + err.message);
  }
}

/* =========================================================
   网页内编辑（手动输入分组）
   ========================================================= */
function sgOpenManualEditor() {
  const plan = StudyGroups.getActive();
  const initial = plan
    ? plan.groups.map(g => `${g.label || ("第" + g.no + "组")}|${g.members.join("、 ")}`).join("\n")
    : "第1组|张三、李四、王五\n第1组|赵六\n第2组|钱七、孙八\n第2组|周九、吴十";
  openModal(`
    <div style="font-size:12px;color:var(--ink-light);margin-bottom:6px;line-height:1.6">
      格式 <b>组号|成员</b>（一行一条，成员用「、 」分隔）。<br>
      同组可写多行；同名会自动去重。
    </div>
    <textarea class="tarea" id="sgManualText" rows="14" style="width:100%;font-family:Menlo,Consolas,monospace">${esc(initial)}</textarea>
  `, "📝 网页内编辑分组");

  const ok = document.querySelector("[data-act=modal-ok]");
  ok.textContent = "保存为新方案";
  ok.onclick = () => {
    const text = document.getElementById("sgManualText").value.trim();
    if (!text) { toast("内容为空"); return; }
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const rows = [["组号", "姓名"]];
    lines.forEach(line => {
      const idx = line.indexOf("|");
      const sep = idx >= 0 ? "|" : (line.indexOf(",") >= 0 ? "," : (line.indexOf("\t") >= 0 ? "\t" : null));
      if (!sep) { rows.push([line.trim(), ""]); return; }
      const label = line.slice(0, line.indexOf(sep)).trim();
      const names = line.slice(line.indexOf(sep) + 1).split(/[、,,]/).map(s => s.trim()).filter(Boolean);
      names.forEach(n => rows.push([label, n]));
    });
    try {
      const parsed = sgParseGroupRows(rows);
      const planObj = StudyGroups.newPlan(("手动编辑 " + Today.now()).slice(0, 30), parsed.groups, "manual");
      StudyGroups.savePlan(planObj, true);
      sgViewMode = "card"; sgSearch = "";
      closeModal();
      rerenderSg();
      toast("✅ 已保存为新方案");
    } catch (e) {
      toast("❌ " + e.message);
    }
  };
}

/* =========================================================
   导出 / 打印
   ========================================================= */
function sgExportCSV(plan) {
  if (!plan) return;
  const rows = [["组号", "组名", "姓名"]];
  plan.groups.forEach(g => g.members.forEach(n => rows.push([g.no, g.label, n])));
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
  downloadFile(`学习小组_${plan.name}_${Today.now()}.csv`, "\ufeff" + csv, "text/csv;charset=utf-8");
  toast("⬇️ 已下载 CSV");
}

function sgExportText(plan) {
  if (!plan) return;
  const txt = plan.groups.map(g => `${g.label}（${g.members.length} 人）\n  ${g.members.join("、 ")}`).join("\n\n");
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).then(() => toast("📋 名单已复制到剪贴板")).catch(() => {
      prompt("复制以下名单：", txt);
    });
  } else {
    prompt("复制以下名单：", txt);
  }
}

function sgPrint(plan) {
  if (!plan) return;
  const w = window.open("", "_blank");
  if (!w) { toast("⚠️ 请允许弹出窗口"); return; }
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>学习小组 · ${esc(plan.name)}</title>
  <style>
    body{font-family:system-ui,'PingFang SC','Microsoft YaHei',sans-serif;color:#22302A;padding:24px;max-width:800px;margin:0 auto}
    h1{color:#1F5C4D;border-bottom:2px solid #1F5C4D;padding-bottom:8px}
    .meta{color:#8A9890;font-size:13px;margin-bottom:20px}
    .group{border:1px solid #BFDCCE;border-radius:10px;padding:12px 16px;margin-bottom:12px;page-break-inside:avoid}
    .gh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;border-bottom:1px dashed #BFDCCE;padding-bottom:4px}
    .gh b{color:#1F5C4D;font-size:15px}
    .gh span{color:#8A9890;font-size:12px}
    .names{font-size:14px;line-height:1.9}
    .names span{display:inline-block;background:#F4FBF6;border:1px solid #D6E8DD;border-radius:6px;padding:2px 10px;margin:2px 4px 2px 0}
    .roster{border-collapse:collapse;width:100%;margin-top:8px;font-size:13px}
    .roster th,.roster td{border:1px solid #BFDCCE;padding:6px 10px;text-align:left}
    .roster th{background:#E2EBE4;color:#1F5C4D}
    @media print { .no-print{display:none} }
  </style></head><body>
  <h1>👥 ${esc(plan.name)}</h1>
  <div class="meta">共 ${plan.groups.length} 组 · ${plan.totalStudents} 人 · 来源：${plan.source === "xlsx" ? "Excel" : (plan.source === "csv" ? "CSV" : "网页编辑")} · 导出时间 ${Today.now()}</div>
  <h2 style="color:#1F5C4D;font-size:16px;margin-top:18px">🎴 卡片视图</h2>
  ${plan.groups.map(g => `<div class="group">
    <div class="gh"><b>${esc(g.label)}</b><span>${g.members.length} 人</span></div>
    <div class="names">${g.members.map(m => `<span>${esc(m)}</span>`).join("")}</div>
  </div>`).join("")}
  <h2 style="color:#1F5C4D;font-size:16px;margin-top:24px">📋 整班名单</h2>
  <table class="roster">
    <thead><tr><th>组号</th><th>组名</th><th>姓名</th></tr></thead>
    <tbody>${sgRosterRows(plan).map(r => `<tr><td>${esc(r.groupLabel)}</td><td>第${r.groupNo}组</td><td><b>${esc(r.name)}</b></td></tr>`).join("")}</tbody>
  </table>
  <p style="color:#8A9890;font-size:11px;margin-top:20px;text-align:center">🌿 啊敏的兵 · 学习小组</p>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>
  </body></html>`;
  w.document.write(html);
  w.document.close();
}
