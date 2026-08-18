/* =========================================================
   成绩分析模块
   板块A 班主任班级综合成绩分析（录入/单次分析/个人趋势/进退步）
   板块B 道法科任老师所教班级成绩分析（导入/分析/导出）
   数据 key：
     gradeExams  → [{id, name, cls, date, scores:{姓名:{chinese,math,english,total}}}]
     daofaScores → { "701班": [{name, hist:[历次分数]}] }
   ========================================================= */

/* ---------- 模块内部状态 ---------- */
let gaTopTab = "A";            // A 班主任综合 / B 道法科任
let gaSubTab = "input";        // input 录入 / single 单次 / trend 趋势 / compare 进退步
let gaState = {
  cls: "", examId: "", stuName: "",
  cmpA: "", cmpB: "",          // 进退步对比的两次考试 id
  dfCls: ""                    // 道法导入班级
};

/* ---------- 数据工具 ---------- */
function gaClasses() { return Store.get("classes", defaultClasses()); }
function gaHomeClassName() {
  const c = gaClasses().find(x => x.isHome) || gaClasses()[0];
  return c ? c.name : "701班";
}
function gaStudentsOf(cls) { return (Store.get("students", {}) || {})[cls] || []; }
function gaExams() { return Store.get("gradeExams", []); }
function gaExamById(id) { return gaExams().find(e => e.id === id) || null; }
function gaDaofa() { return Store.get("daofaScores", {}); }

/* 数组统计：n 人数 / avg 均分 / max / min / pass 及格率 / good 优良率（满分按 full） */
function gaStat(arr, full) {
  const nums = arr.filter(v => typeof v === "number" && !isNaN(v));
  if (!nums.length) return { n: 0, avg: 0, max: 0, min: 0, pass: 0, good: 0 };
  const sum = nums.reduce((a, b) => a + b, 0);
  const avg = sum / nums.length;
  const passLine = full * 0.6, goodLine = full * 0.85;
  const pass = Math.round(nums.filter(v => v >= passLine).length / nums.length * 100);
  const good = Math.round(nums.filter(v => v >= goodLine).length / nums.length * 100);
  return {
    n: nums.length, avg: Math.round(avg * 10) / 10,
    max: Math.max(...nums), min: Math.min(...nums), pass, good
  };
}
function gaChip(label, val, unit) {
  return `<span class="badge badge-green" style="padding:6px 12px;font-size:12.5px">${label} <b style="font-size:14px">${val}</b>${unit || ""}</span>`;
}

/* ---------- 可打印报告（新窗口 HTML） ---------- */
function gaOpenReport(title, bodyHtml) {
  const w = window.open("", "_blank");
  if (!w) { toast("浏览器拦截了新窗口，请允许弹窗后重试"); return; }
  w.document.write(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
  <title>${esc(title)}</title><style>
    body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;max-width:820px;margin:24px auto;padding:0 18px;color:#2A3B33;line-height:1.7}
    h1{font-size:20px;border-bottom:2px solid #52B788;padding-bottom:8px;color:#2D6A4F}
    h2{font-size:16px;color:#2D6A4F;margin:22px 0 8px}
    table{border-collapse:collapse;width:100%;margin:8px 0;font-size:13px}
    th,td{border:1px solid #B7CEC0;padding:5px 8px;text-align:center}
    th{background:#EAF6EF}
    .up{color:#2D6A4F;font-weight:700}.down{color:#B4563E}
    .meta{color:#7A8B81;font-size:12px}
    .btn{display:inline-block;padding:8px 18px;background:#52B788;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px}
    @media print{.btn{display:none}}
  </style></head><body>
  <button class="btn" onclick="window.print()">🖨️ 打印 / 保存为 PDF</button>
  <h1>${esc(title)}</h1>
  <p class="meta">生成时间：${Today.now()} · 教师工作台 · 成绩分析</p>
  ${bodyHtml}
  <p class="meta" style="margin-top:24px">※ 本报告仅作家校沟通参考，请结合孩子日常表现综合看待。</p>
  </body></html>`);
  w.document.close();
}

/* 简易 SVG 折线（totals: 数值数组, labels: 横轴标签） */
function gaLineSVG(totals, labels, unit) {
  const vals = totals.filter(v => typeof v === "number" && !isNaN(v));
  if (vals.length < 2) return `<div class="empty" style="padding:14px"><span class="e-ico">📉</span>至少两次有效成绩才能画出走势</div>`;
  const W = 640, H = 200, padL = 34, padB = 34, padT = 16;
  const min = Math.min(...totals) - 5, max = Math.max(...totals) + 5;
  const span = max - min || 1;
  const px = i => padL + (W - padL - 16) * (totals.length < 2 ? 0.5 : i / (totals.length - 1));
  const py = v => padT + (H - padT - padB) * (1 - (v - min) / span);
  const pts = totals.map((v, i) => (typeof v === "number" && !isNaN(v)) ? `${px(i)},${py(v)}` : null).filter(Boolean);
  const gridY = [0, 0.5, 1].map(t => {
    const y = padT + (H - padT - padB) * (1 - t);
    const val = Math.round((min + span * t) * 10) / 10;
    return `<line x1="${padL}" y1="${y}" x2="${W - 16}" y2="${y}" stroke="#DCE8E0" stroke-width="1"/>
      <text x="${padL - 6}" y="${y + 4}" font-size="10" fill="#8AA094" text-anchor="end">${val}</text>`;
  }).join("");
  const dots = totals.map((v, i) => (typeof v === "number" && !isNaN(v))
    ? `<circle cx="${px(i)}" cy="${py(v)}" r="4" fill="#52B788" stroke="#fff" stroke-width="1.5"/>
       <text x="${px(i)}" y="${py(v) - 9}" font-size="10.5" fill="#2D6A4F" text-anchor="middle" font-weight="700">${v}</text>` : "").join("");
  const xlab = labels.map((s, i) => `<text x="${px(i)}" y="${H - 12}" font-size="10" fill="#8AA094" text-anchor="middle">${esc(String(s).slice(0, 8))}</text>`).join("");
  return `<div class="tbl-wrap" style="text-align:center"><svg viewBox="0 0 ${W} ${H}" style="max-width:100%;height:auto">
    ${gridY}<polyline points="${pts.join(" ")}" fill="none" stroke="#52B788" stroke-width="2.5" stroke-linejoin="round"/>${dots}${xlab}
  </svg></div><div class="meta" style="text-align:center;font-size:11px;color:var(--ink-light)">单位：${esc(unit || "分")}</div>`;
}

/* =========================================================
   板块A · 班主任综合
   ========================================================= */

/* ---- A1 各科成绩录入 ---- */
function renderGaInput() {
  const cls = gaState.cls || gaHomeClassName();
  gaState.cls = cls;
  const classes = gaClasses();
  const stus = gaStudentsOf(cls);
  const exams = gaExams().filter(e => e.cls === cls);
  return `
  <div class="card">
    <div class="card-title">📝 各科成绩录入
      <button class="btn btn-primary btn-sm" data-act="ga-exam-save">💾 保存本次考试</button>
      <button class="btn btn-ghost btn-sm" data-act="ga-exam-export">⬇️ 导出考试列表</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <select class="sel" id="gaInCls" style="width:110px">${classes.map(c => `<option value="${esc(c.name)}" ${c.name === cls ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      <input class="inp" id="gaExamName" placeholder="考试名称（如：期中考试）" style="width:170px">
      <input class="inp" type="date" id="gaExamDate" value="${Today.now()}" style="width:140px">
    </div>
    ${stus.length === 0 ? `<div class="empty"><span class="e-ico">📋</span>${esc(cls)} 暂无学生名单，请先在「学生信息」模块导入花名册</div>` : `
    <div class="tbl-wrap"><table class="tbl" id="gaInputBody">
      <tr><th class="num">#</th><th>姓名</th><th>语文</th><th>数学</th><th>英语</th></tr>
      ${stus.map((s, i) => `<tr>
        <td class="num">${i + 1}</td><td>${esc(s.name)}</td>
        <td><input class="inp" type="number" min="0" max="100" data-sname="${esc(s.name)}" data-subj="chinese" style="width:76px;padding:4px 8px"></td>
        <td><input class="inp" type="number" min="0" max="100" data-sname="${esc(s.name)}" data-subj="math" style="width:76px;padding:4px 8px"></td>
        <td><input class="inp" type="number" min="0" max="100" data-sname="${esc(s.name)}" data-subj="english" style="width:76px;padding:4px 8px"></td>
      </tr>`).join("")}
    </table></div>
    <div style="font-size:12px;color:var(--ink-light);margin-top:8px">💡 同一班级 + 同名考试会覆盖旧数据；总分自动计算；留空表示该科缺考（不计入统计）。</div>`}
  </div>
  <div class="card">
    <div class="card-title">🗂️ ${esc(cls)} 已录入考试（${exams.length} 次）</div>
    ${exams.length === 0 ? `<div class="empty"><span class="e-ico">📭</span>暂无考试数据</div>` : `
    <div class="tbl-wrap"><table class="tbl">
      <tr><th>考试名称</th><th>日期</th><th>录入人数</th><th>操作</th></tr>
      ${exams.map(e => `<tr><td>${esc(e.name)}</td><td>${esc(e.date)}</td>
        <td class="num">${Object.keys(e.scores || {}).length}</td>
        <td><button class="btn btn-ghost btn-sm" data-act="ga-exam-del" data-id="${e.id}">🗑️ 删除</button></td></tr>`).join("")}
    </table></div>`}
  </div>`;
}

/* ---- A2 单次分析 ---- */
function renderGaSingle() {
  const exams = gaExams();
  if (!gaState.examId || !gaExamById(gaState.examId)) gaState.examId = exams[0] ? exams[0].id : "";
  return `
  <div class="card">
    <div class="card-title">📊 单次考试成绩分析
      <button class="btn btn-primary btn-sm" data-act="ga-single-report">📄 导出分析报告</button>
    </div>
    ${exams.length === 0 ? `<div class="empty"><span class="e-ico">📭</span>请先在「各科录入」保存一次考试</div>` : `
    <select class="sel" id="gaSingleSel" style="margin-bottom:14px">
      ${exams.map(e => `<option value="${e.id}" ${e.id === gaState.examId ? "selected" : ""}>${esc(e.cls)} · ${esc(e.name)}（${esc(e.date)}）</option>`).join("")}
    </select>
    <div id="gaSingleBody">${renderGaSingleBody()}</div>`}
  </div>`;
}
function renderGaSingleBody() {
  const exam = gaExamById(gaState.examId);
  if (!exam) return "";
  const sc = exam.scores || {};
  const pick = k => Object.values(sc).map(v => v[k]).filter(v => v != null && v !== "");
  const subs = [
    { k: "chinese", name: "语文", arr: pick("chinese"), full: 100 },
    { k: "math", name: "数学", arr: pick("math"), full: 100 },
    { k: "english", name: "英语", arr: pick("english"), full: 100 },
    { k: "total", name: "总分", arr: pick("total"), full: 300 }
  ];
  const rows = subs.map(s => ({ ...s, st: gaStat(s.arr, s.full) }));
  return `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
    ${gaChip("参考人数", rows[0].st.n, " 人")}${gaChip("总分均分", rows[3].st.avg)}${gaChip("及格率", rows[3].st.pass, "%")}${gaChip("优良率", rows[3].st.good, "%")}
  </div>
  <div class="tbl-wrap"><table class="tbl">
    <tr><th>科目</th><th>均分</th><th>最高</th><th>最低</th><th>及格率</th><th>优良率</th><th>均分示意</th></tr>
    ${rows.map(r => `<tr><td><b>${r.name}</b></td><td>${r.st.avg}</td><td>${r.st.max}</td><td>${r.st.min}</td>
      <td>${r.st.pass}%</td><td>${r.st.good}%</td>
      <td style="min-width:120px"><div style="background:#E2EBE4;border-radius:6px;height:10px"><div style="width:${Math.min(100, r.st.avg / r.full * 100)}%;height:10px;border-radius:6px;background:linear-gradient(90deg,#74C69D,#52B788)"></div></div></td></tr>`).join("")}
  </table></div>
  <div style="font-size:12px;color:var(--ink-light);margin-top:8px">及格线 = 满分×60%，优良线 = 满分×85%；缺考科目不计入该科统计。</div>`;
}

/* ---- A3 个人趋势 ---- */
function renderGaTrend() {
  const cls = gaState.cls || gaHomeClassName();
  gaState.cls = cls;
  const stus = gaStudentsOf(cls);
  const exams = gaExams().filter(e => e.cls === cls).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  return `
  <div class="card">
    <div class="card-title">📈 个人成绩趋势
      <button class="btn btn-primary btn-sm" data-act="ga-trend-report">📄 导出个人报告</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <select class="sel" id="gaTrCls">${gaClasses().map(c => `<option value="${esc(c.name)}" ${c.name === cls ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      <select class="sel" id="gaTrStu" style="min-width:130px">
        <option value="">— 选择学生 —</option>
        ${stus.map(s => `<option value="${esc(s.name)}" ${s.name === gaState.stuName ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
      </select>
    </div>
    <div id="gaTrendBody">${renderGaTrendBody()}</div>
  </div>`;
}
function renderGaTrendBody() {
  const cls = gaState.cls, name = gaState.stuName;
  if (!name) return `<div class="empty"><span class="e-ico">👤</span>请选择学生查看各次考试走势</div>`;
  const exams = gaExams().filter(e => e.cls === cls).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const recs = exams.map(e => ({ e, r: (e.scores || {})[name] })).filter(x => x.r);
  if (!recs.length) return `<div class="empty"><span class="e-ico">📭</span>${esc(name)} 在 ${esc(cls)} 暂无考试成绩</div>`;
  const totals = recs.map(x => (typeof x.r.total === "number" ? x.r.total : null));
  return `
  <h4 style="margin:6px 0 10px">🎓 ${esc(name)} · 总分走势（${recs.length} 次考试）</h4>
  ${gaLineSVG(totals, recs.map(x => x.e.name), "总分")}
  <div class="tbl-wrap" style="margin-top:12px"><table class="tbl">
    <tr><th>考试</th><th>日期</th><th>语文</th><th>数学</th><th>英语</th><th>总分</th><th>较上次</th></tr>
    ${recs.map((x, i) => {
      const d = i > 0 && typeof x.r.total === "number" && typeof recs[i - 1].r.total === "number"
        ? x.r.total - recs[i - 1].r.total : null;
      return `<tr><td>${esc(x.e.name)}</td><td>${esc(x.e.date)}</td>
        <td>${x.r.chinese ?? "-"}</td><td>${x.r.math ?? "-"}</td><td>${x.r.english ?? "-"}</td>
        <td><b>${x.r.total ?? "-"}</b></td>
        <td>${d == null ? "-" : `<span class="${d >= 0 ? "up" : "down"}" style="font-weight:700;color:${d >= 0 ? "var(--green-600,#2D6A4F)" : "#B4563E"}">${d >= 0 ? "+" : ""}${d}</span>`}</td></tr>`;
    }).join("")}
  </table></div>`;
}

/* ---- A4 进退步分析 ---- */
function renderGaCompare() {
  const cls = gaState.cls || gaHomeClassName();
  gaState.cls = cls;
  const exams = gaExams().filter(e => e.cls === cls);
  return `
  <div class="card">
    <div class="card-title">🔁 进退步分析（两次考试对比）
      <button class="btn btn-primary btn-sm" data-act="ga-cmp-report">📄 导出对比报告</button>
    </div>
    ${exams.length < 2 ? `<div class="empty"><span class="e-ico">📭</span>${esc(cls)} 至少需要 2 次考试才能对比，请先录入</div>` : `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <select class="sel" id="gaCmpCls">${gaClasses().map(c => `<option value="${esc(c.name)}" ${c.name === cls ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      <select class="sel" id="gaCmpA" style="min-width:150px">${exams.map((e, i) => `<option value="${e.id}" ${e.id === gaState.cmpA ? "selected" : (i === 0 && !gaState.cmpA ? "selected" : "")}>前次：${esc(e.name)}</option>`).join("")}</select>
      <select class="sel" id="gaCmpB" style="min-width:150px">${exams.map((e, i) => `<option value="${e.id}" ${e.id === gaState.cmpB ? "selected" : (i === exams.length - 1 && !gaState.cmpB ? "selected" : "")}>后次：${esc(e.name)}</option>`).join("")}</select>
    </div>
    <div id="gaCmpBody">${renderGaCmpBody()}</div>`}
  </div>`;
}
function gaCmpData() {
  const cls = gaState.cls;
  const a = gaExamById(gaState.cmpA), b = gaExamById(gaState.cmpB);
  if (!a || !b || a.id === b.id) return null;
  const names = [...new Set([...Object.keys(a.scores || {}), ...Object.keys(b.scores || {})])];
  const rows = names.map(name => {
    const ra = (a.scores || {})[name], rb = (b.scores || {})[name];
    const ta = ra && typeof ra.total === "number" ? ra.total : null;
    const tb = rb && typeof rb.total === "number" ? rb.total : null;
    return { name, ta, tb, diff: (ta != null && tb != null) ? tb - ta : null };
  }).filter(r => r.diff != null);
  return { a, b, cls, rows };
}
function renderGaCmpBody() {
  const d = gaCmpData();
  if (!d) return `<div class="empty"><span class="e-ico">🔁</span>请选择两次不同的考试</div>`;
  const rows = d.rows.slice().sort((x, y) => y.diff - x.diff);
  const ups = rows.filter(r => r.diff > 0), flats = rows.filter(r => r.diff === 0), downs = rows.filter(r => r.diff < 0);
  const avgDiff = rows.length ? Math.round(rows.reduce((s, r) => s + r.diff, 0) / rows.length * 10) / 10 : 0;
  const bigDown = downs.filter(r => r.diff <= -15).length;
  return `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
    ${gaChip("对比人数", rows.length, " 人")}${gaChip("进步", ups.length, " 人")}${gaChip("持平", flats.length, " 人")}${gaChip("退步", downs.length, " 人")}${gaChip("班级人均变化", (avgDiff >= 0 ? "+" : "") + avgDiff, " 分")}
  </div>
  <div class="tbl-wrap"><table class="tbl">
    <tr><th class="num">排名</th><th>姓名</th><th>${esc(d.a.name)}</th><th>${esc(d.b.name)}</th><th>变化</th></tr>
    ${rows.map((r, i) => `<tr><td class="num">${i + 1}</td><td>${esc(r.name)}</td>
      <td>${r.ta}</td><td><b>${r.tb}</b></td>
      <td><span style="font-weight:700;color:${r.diff >= 0 ? "var(--green-600,#2D6A4F)" : "#B4563E"}">${r.diff >= 0 ? "+" : ""}${r.diff}</span></td></tr>`).join("")}
  </table></div>
  <div style="font-size:12px;color:var(--ink-light);margin-top:10px">
    🔒 出于保护学生自尊，退步名单不在报告中点名，仅作整体统计：本次对比中退步 ${downs.length} 人，其中下滑超过 15 分的 ${bigDown} 人，建议课后单独沟通、及时鼓励。
  </div>`;
}

/* ---- 板块A 整体（含子标签） ---- */
function renderGaA() {
  const tabs = [
    { k: "input", ico: "📝", name: "各科录入", desc: "按班级录入三科分数" },
    { k: "single", ico: "📊", name: "单次分析", desc: "概况 · 及格率 · 优良率" },
    { k: "trend", ico: "📈", name: "个人趋势", desc: "学生多次考试走势" },
    { k: "compare", ico: "🔁", name: "进退步分析", desc: "两次对比 · 进步名单" }
  ];
  const map = { input: renderGaInput, single: renderGaSingle, trend: renderGaTrend, compare: renderGaCompare };
  return `
  <div class="big-tab-grid g4" id="gaSubTabs">
    ${tabs.map(t => `<div class="big-tab ${t.k === "trend" ? "theme-blue" : t.k === "single" ? "theme-teal" : t.k === "compare" ? "theme-gold" : "theme-rose"} ${gaSubTab === t.k ? "active" : ""}" data-gasub="${t.k}" id="sub-${t.k}">
      <span class="bt-ico">${t.ico}</span><div><div class="bt-name">${t.name}</div><div class="bt-desc">${t.desc}</div></div></div>`).join("")}
  </div>
  <div id="gaABody">${map[gaSubTab]()}</div>`;
}

/* =========================================================
   板块B · 道法科任
   ========================================================= */
function renderGaB() {
  const df = gaDaofa();
  const cls = gaState.dfCls || gaHomeClassName();
  gaState.dfCls = cls;
  /* 汇总所有班级数据：[{cls, name, cur, prev, hist}] */
  const all = [];
  Object.keys(df).forEach(c => (df[c] || []).forEach(p => {
    const h = (p.hist || []).filter(v => typeof v === "number");
    if (h.length) all.push({ cls: c, name: p.name, hist: h, cur: h[h.length - 1], prev: h.length > 1 ? h[h.length - 2] : null });
  }));
  const bigUp = all.filter(s => s.prev != null && s.cur - s.prev >= 8);
  const bigDown = all.filter(s => s.prev != null && s.cur - s.prev <= -8);
  const wave = all.filter(s => s.hist.length >= 3 && Math.max(...s.hist) - Math.min(...s.hist) >= 15);
  const room = all.filter(s => (s.hist.reduce((a, b) => a + b, 0) / s.hist.length) < 60);
  const byCls = gaClasses().map(c => {
    const list = (df[c.name] || []).map(p => (p.hist || []).filter(v => typeof v === "number")).filter(h => h.length);
    return { name: c.name, st: gaStat(list.map(h => h[h.length - 1]), 100), n: list.length };
  });
  const mk = (title, ico, arr, tip) => `
    <div class="card">
      <div class="card-title">${ico} ${title} <span class="sub">${esc(tip)}</span></div>
      ${arr.length === 0 ? `<div class="empty" style="padding:12px"><span class="e-ico">📭</span>暂无符合条件的学生</div>` : `
      <div class="tbl-wrap"><table class="tbl"><tr><th>班级</th><th>姓名</th><th>上次</th><th>本次</th><th>历次</th></tr>
        ${arr.slice(0, 30).map(s => `<tr><td>${esc(s.cls)}</td><td>${esc(s.name)}</td><td>${s.prev == null ? "-" : s.prev}</td><td><b>${s.cur}</b></td>
        <td style="font-size:11.5px;color:var(--ink-light)">${s.hist.join(" → ")}</td></tr>`).join("")}
      </table></div>`}
    </div>`;
  return `
  <div class="card">
    <div class="card-title">📥 导入道法成绩
      <button class="btn btn-primary btn-sm" data-act="ga-df-save">💾 保存导入</button>
      <button class="btn btn-ghost btn-sm" data-act="ga-df-report">📄 导出5班整体报告</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start">
      <select class="sel" id="gaDfCls" style="width:110px">${gaClasses().map(c => `<option value="${esc(c.name)}" ${c.name === cls ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      <textarea class="tarea" id="gaDfPaste" placeholder="每行一名学生：姓名,分数&#10;例如：&#10;张三,85&#10;李四,72" style="flex:1;min-width:240px;min-height:110px"></textarea>
    </div>
    <div style="font-size:12px;color:var(--ink-light);margin-top:8px">💡 每次导入会追加为该生的“下一次成绩”，可多次导入形成趋势；同一学生姓名自动匹配历史记录。</div>
  </div>
  <div class="card">
    <div class="card-title">🏫 各班道法概况（最新一次）</div>
    ${byCls.every(c => c.n === 0) ? `<div class="empty"><span class="e-ico">📭</span>暂无道法成绩，请先导入</div>` : `
    <div class="tbl-wrap"><table class="tbl">
      <tr><th>班级</th><th>人数</th><th>均分</th><th>最高</th><th>最低</th><th>及格率</th><th>优良率</th></tr>
      ${byCls.map(c => `<tr><td><b>${esc(c.name)}</b></td><td class="num">${c.n}</td><td>${c.n ? c.st.avg : "-"}</td><td>${c.n ? c.st.max : "-"}</td><td>${c.n ? c.st.min : "-"}</td><td>${c.n ? c.st.pass + "%" : "-"}</td><td>${c.n ? c.st.good + "%" : "-"}</td></tr>`).join("")}
    </table></div>`}
  </div>
  ${mk("进步大的学生", "🚀", bigUp.sort((a, b) => (b.cur - b.prev) - (a.cur - a.prev)), "较上次提高 ≥ 8 分")}
  ${mk("波动大的学生", "🌀", wave.sort((a, b) => (Math.max(...b.hist) - Math.min(...b.hist)) - (Math.max(...a.hist) - Math.min(...a.hist))), "历次最高最低差 ≥ 15 分")}
  ${mk("退步大的学生", "📉", bigDown.sort((a, b) => (a.cur - a.prev) - (b.cur - b.prev)), "较上次下降 ≥ 8 分，建议重点关注")}
  ${mk("有很大进步空间的学生", "🌱", room.sort((a, b) => a.hist[a.hist.length - 1] - b.hist[b.hist.length - 1]), "历次平均分 < 60 分，需要基础帮扶")}`;
}

/* =========================================================
   模块注册
   ========================================================= */
registerModule("grade", {
  title: "📊 成绩分析",
  sub: "班主任三科分析 · 进退步 · 道法科任5班分析",
  render() {
    return `
    <div class="mv-header"><h2 class="mv-title">📊 成绩分析</h2>
      <p class="mv-sub">班主任综合分析 · 道法科任分析 · 报告一键导出</p></div>
    ${modToolbar("成绩分析")}
    <div class="big-tab-grid g2" id="gaTopTabs">
      <div class="big-tab theme-teal ${gaTopTab === "A" ? "active" : ""}" data-gatab="A">
        <span class="bt-ico">🏫</span><div><div class="bt-name">班主任 · 班级综合成绩</div><div class="bt-desc">录入 / 单次分析 / 个人趋势 / 进退步</div></div></div>
      <div class="big-tab theme-blue ${gaTopTab === "B" ? "active" : ""}" data-gatab="B">
        <span class="bt-ico">📖</span><div><div class="bt-name">道法科任 · 5班成绩分析</div><div class="bt-desc">导入 / 进步退步波动 / 整体报告</div></div></div>
    </div>
    <div id="gaBody">${gaTopTab === "A" ? renderGaA() : renderGaB()}</div>`;
  },
  after() { gaBindBody(); }
});

/* ---------- 刷新与事件绑定（事件委托） ---------- */
function gaRefresh() {
  const body = document.getElementById("gaBody");
  if (!body) return;
  body.innerHTML = gaTopTab === "A" ? renderGaA() : renderGaB();
  gaBindBody();
}
function gaBindBody() {
  const root = document.getElementById("gaBody");
  if (!root) return;

  /* 顶部 A/B 标签 */
  document.querySelectorAll("#gaTopTabs .big-tab").forEach(t => {
    t.onclick = () => {
      gaTopTab = t.dataset.gatab;
      document.querySelectorAll("#gaTopTabs .big-tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      gaRefresh();
    };
  });

  /* A 内部子标签 */
  document.querySelectorAll("#gaSubTabs .big-tab").forEach(t => {
    t.onclick = () => {
      gaSubTab = t.dataset.gasub;
      gaRefresh();
    };
  });

  /* —— 录入：切换班级 —— */
  const inCls = document.getElementById("gaInCls");
  if (inCls) inCls.onchange = () => { gaState.cls = inCls.value; gaRefresh(); };

  /* —— 录入：保存考试 —— */
  const btn = (act) => root.querySelector(`[data-act="${act}"]`);
  if (btn("ga-exam-save")) btn("ga-exam-save").onclick = () => {
    const name = (document.getElementById("gaExamName") || {}).value || "";
    const date = (document.getElementById("gaExamDate") || {}).value || Today.now();
    if (!name.trim()) { toast("请填写考试名称"); return; }
    const scores = {};
    root.querySelectorAll("#gaInputBody input[data-sname]").forEach(inp => {
      const v = inp.value.trim();
      if (v === "") return;
      const n = parseFloat(v);
      if (isNaN(n) || n < 0 || n > 100) return;
      const sname = inp.dataset.sname;
      scores[sname] = scores[sname] || {};
      scores[sname][inp.dataset.subj] = Math.round(n * 10) / 10;
    });
    const names = Object.keys(scores);
    if (!names.length) { toast("请至少录入一名学生的成绩"); return; }
    names.forEach(n => {
      const s = scores[n];
      const parts = ["chinese", "math", "english"].filter(k => typeof s[k] === "number");
      s.total = parts.length ? Math.round(parts.reduce((a, k) => a + s[k], 0) * 10) / 10 : null;
    });
    const exams = gaExams();
    const exist = exams.find(e => e.cls === gaState.cls && e.name === name.trim());
    if (exist) { exist.date = date; exist.scores = scores; toast(`已覆盖「${gaState.cls} · ${name.trim()}」`); }
    else { exams.push({ id: uid(), name: name.trim(), cls: gaState.cls, date, scores }); toast(`✅ 已保存「${gaState.cls} · ${name.trim()}」`); }
    Store.set("gradeExams", exams);
    gaRefresh();
  };

  /* —— 录入：导出考试列表 CSV / 删除考试 —— */
  if (btn("ga-exam-export")) btn("ga-exam-export").onclick = () => exportScopeToCSV("考试成绩_" + gaState.cls, root);
  root.querySelectorAll("[data-act=ga-exam-del]").forEach(b => {
    b.onclick = () => {
      if (!confirm("确定删除这次考试吗？删除后不可恢复")) return;
      Store.set("gradeExams", gaExams().filter(e => e.id !== b.dataset.id));
      toast("已删除");
      gaRefresh();
    };
  });

  /* —— 单次分析 —— */
  const singleSel = document.getElementById("gaSingleSel");
  if (singleSel) singleSel.onchange = () => {
    gaState.examId = singleSel.value;
    document.getElementById("gaSingleBody").innerHTML = renderGaSingleBody();
  };
  if (btn("ga-single-report")) btn("ga-single-report").onclick = () => {
    const exam = gaExamById(gaState.examId);
    if (!exam) { toast("暂无考试数据"); return; }
    const body = document.getElementById("gaSingleBody");
    gaOpenReport(`${exam.cls} ${exam.name} 成绩分析报告（${exam.date}）`, body.innerHTML);
  };

  /* —— 个人趋势 —— */
  const trCls = document.getElementById("gaTrCls"), trStu = document.getElementById("gaTrStu");
  if (trCls) trCls.onchange = () => { gaState.cls = trCls.value; gaState.stuName = ""; gaRefresh(); };
  if (trStu) trStu.onchange = () => {
    gaState.stuName = trStu.value;
    document.getElementById("gaTrendBody").innerHTML = renderGaTrendBody();
  };
  if (btn("ga-trend-report")) btn("ga-trend-report").onclick = () => {
    if (!gaState.stuName) { toast("请先选择学生"); return; }
    const body = document.getElementById("gaTrendBody");
    gaOpenReport(`${gaState.cls} ${gaState.stuName} 同学成绩趋势报告`, body.innerHTML);
  };

  /* —— 进退步分析 —— */
  const cmpCls = document.getElementById("gaCmpCls"), cmpA = document.getElementById("gaCmpA"), cmpB = document.getElementById("gaCmpB");
  if (cmpCls) cmpCls.onchange = () => { gaState.cls = cmpCls.value; gaState.cmpA = gaState.cmpB = ""; gaRefresh(); };
  if (cmpA) cmpA.onchange = () => { gaState.cmpA = cmpA.value; document.getElementById("gaCmpBody").innerHTML = renderGaCmpBody(); };
  if (cmpB) cmpB.onchange = () => { gaState.cmpB = cmpB.value; document.getElementById("gaCmpBody").innerHTML = renderGaCmpBody(); };
  if (btn("ga-cmp-report")) btn("ga-cmp-report").onclick = () => {
    const d = gaCmpData();
    if (!d) { toast("请选择两次不同的考试"); return; }
    const body = document.getElementById("gaCmpBody");
    gaOpenReport(`${d.cls} 进退步对比报告：${d.a.name} → ${d.b.name}`, body.innerHTML);
  };

  /* —— 道法：切换导入班级 / 保存导入 / 整体报告 —— */
  const dfCls = document.getElementById("gaDfCls");
  if (dfCls) dfCls.onchange = () => { gaState.dfCls = dfCls.value; };
  if (btn("ga-df-save")) btn("ga-df-save").onclick = () => {
    const cls = (dfCls ? dfCls.value : gaState.dfCls) || gaHomeClassName();
    const txt = (document.getElementById("gaDfPaste") || {}).value || "";
    const lines = txt.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast("请先粘贴成绩（每行：姓名,分数）"); return; }
    const df = gaDaofa();
    df[cls] = df[cls] || [];
    let ok = 0, bad = 0;
    lines.forEach(line => {
      const m = line.split(/[,，\t ]+/).map(x => x.trim()).filter(Boolean);
      if (m.length < 2) { bad++; return; }
      const name = m[0], score = parseFloat(m[1]);
      if (!name || isNaN(score) || score < 0 || score > 100) { bad++; return; }
      let p = df[cls].find(x => x.name === name);
      if (!p) { p = { name, hist: [] }; df[cls].push(p); }
      p.hist.push(Math.round(score * 10) / 10);
      ok++;
    });
    Store.set("daofaScores", df);
    toast(`✅ ${cls} 导入成功 ${ok} 人${bad ? `，忽略 ${bad} 行格式错误` : ""}`);
    gaState.dfCls = cls;
    gaRefresh();
  };
  if (btn("ga-df-report")) btn("ga-df-report").onclick = () => {
    const cards = Array.from(root.querySelectorAll(".card")).map(c => c.innerHTML).join("<hr style='border:none;border-top:1px dashed #B7CEC0;margin:18px 0'>");
    if (!gaDaofa() || !Object.keys(gaDaofa()).length) { toast("暂无道法成绩数据"); return; }
    gaOpenReport("道法学科 · 所教5个班成绩分析报告", cards);
  };
}
