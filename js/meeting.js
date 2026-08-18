/* =========================================================
   班会 · 25节主题规划 / AI备课 / PPT生成
   覆盖维度：凝聚力 · 自控力 · 情商 · 与老师相处 · 班规 · 诚信 · 遵守规则 · 抗挫 · 青春期 · 感恩 · 复盘
   ========================================================= */
const MEETING_ASPECTS = {
  "收心立志": "#3E9C86", "凝聚力": "#5B8DC0", "班规": "#D9A441", "自控力": "#E8835A",
  "诚信": "#9C7FB8", "情商": "#C0809F", "与老师相处": "#3E9C86", "遵守规则": "#5B8DC0",
  "规则与安全": "#E8835A", "感恩": "#D9A441", "抗挫力": "#9C7FB8", "青春期": "#C0809F",
  "目标与自控": "#5B8DC0", "复盘": "#3E9C86"
};
function meetingAspectColor(a) { return MEETING_ASPECTS[a] || "#3E9C86"; }

/* 计算开学第几周（1~25） */
function getCurrentWeek(startStr) {
  const start = new Date(startStr);
  if (isNaN(start.getTime())) return 1;
  const diff = Math.floor((new Date() - start) / (7 * 24 * 3600 * 1000)) + 1;
  return Math.max(1, Math.min(diff, 25));
}

function renderMeeting() {
  const themes = Store.get("meetingThemes", defaultMeetingThemes());
  const cfg = Store.get("meetingCfg", { start: "2026-09-01", name: "2026 秋季学期" });
  const week = getCurrentWeek(cfg.start);
  const thisTheme = themes.find(t => t.week === week);
  let html = `
    <div class="card">
      <div class="card-title">🎤 每周班会 · AI 备课 <span class="sub">学期规划 25 节 · 一键生成教案与 PPT</span>
        <button class="btn btn-ghost btn-sm" data-act="meeting-cfg">⚙️ 学期设置</button>
        <button class="btn btn-ghost btn-sm" data-act="meeting-dl-all">📄 导出全学期规划</button>
      </div>
      <div class="meeting-sem" style="background:linear-gradient(135deg,#1F5C4D,#3E9C86);color:#fff;border-radius:12px;padding:14px 18px;margin-bottom:14px">
        <div style="font-size:16px;font-weight:700">${esc(cfg.name)} · 开学第 ${week} 周</div>
        ${thisTheme ? `<div style="margin-top:6px;font-size:13px;opacity:.95">📌 本周班会：<b>${esc(thisTheme.title)}</b>（${esc(thisTheme.aspect)}） · ${esc(thisTheme.goal)}</div>` : ""}
      </div>
      <div class="meeting-grid">`;
  themes.forEach(t => {
    const isThis = thisTheme && thisTheme.id === t.id;
    html += `<div class="meeting-card ${isThis ? "this-week" : ""}" data-meeting-id="${t.id}" data-act="meeting-open">
        <div class="mc-top"><span class="mc-week">第 ${t.week} 周</span>
          <span class="mc-aspect" style="background:${meetingAspectColor(t.aspect)}">${esc(t.aspect)}</span></div>
        <div class="mc-title">${esc(t.title)}</div>
        <div class="mc-goal">${esc(t.goal)}</div>
        <div class="mc-foot">📋 教案 · 🎞️ ${t.slides.length}页PPT ${isThis ? "· 本周" : ""}</div>
      </div>`;
  });
  html += `</div>
    <div style="margin-top:10px;font-size:12px;color:var(--ink-light)">💡 点击任意主题卡 → AI 备课教案（可编辑保存）+ 一键生成班会 PPT。覆盖：凝聚力 · 自控力 · 情商 · 与老师相处 · 班规 · 诚信 · 遵守规则 等维度。</div>
  </div>`;
  return html;
}

/* 生成教案纯文本 */
function buildMeetingPlanText(t, notes) {
  const flow = (notes && notes.flow) ? notes.flow : t.flow;
  let txt = "【第 " + t.week + " 周班会】" + t.title + "（" + t.aspect + "）\n\n";
  txt += "一、班会目标\n" + t.goal + "\n\n";
  txt += "二、开场金句\n" + t.quote + "\n\n";
  txt += "三、班会流程（40分钟）\n";
  flow.forEach((s, i) => { txt += "环节" + (i + 1) + "【" + s.t + "】" + s.time + "：" + s.c + "\n"; });
  return txt;
}

/* AI 重新备课：环节设计模板池随机组合 */
const AI_FLOW_POOL = {
  import: [
    function (t) { return { t: "情境导入", time: "5min", c: "围绕「" + t.title + "」讲述一个贴近生活的小故事或短片，抛出核心问题，激发学生思考。" }; },
    function (t) { return { t: "互动导入", time: "5min", c: "快问快答 + 举手表决：关于「" + t.title + "」你最有感触的一次经历是什么？现场统计，引出话题。" }; },
    function (t) { return { t: "游戏导入", time: "5min", c: "设计一个 2 分钟小游戏/情景模拟（与「" + t.title + "」相关），让学生在体验中进入主题。" }; },
    function (t) { return { t: "数据导入", time: "5min", c: "呈现一组与本班相关的真实数据或照片（考勤、积分、活动剪影），从事实切入「" + t.title + "」。" }; }
  ],
  explore: [
    function (t) { return { t: "案例分析", time: "12min", c: "呈现 2 个正反面对比案例（与「" + t.title + "」相关），小组讨论：两种选择的后果与背后的价值观。" }; },
    function (t) { return { t: "情景辨析", time: "12min", c: "给出 3 个生活化情景，学生判断对错并说明理由，教师追问引导，深化对「" + t.title + "」的认知。" }; },
    function (t) { return { t: "辩论思考", time: "12min", c: "围绕「" + t.title + "」设置一个两难话题，正反方各 2 分钟陈述，教师点评总结观点。" }; },
    function (t) { return { t: "故事共情", time: "12min", c: "讲述一个真实故事，引导学生代入角色，讨论故事中的选择与启示。" }; }
  ],
  practice: [
    function (t) { return { t: "小组共创", time: "15min", c: "小组合作产出与「" + t.title + "」相关的成果（公约/清单/承诺卡/行动计划），推选代表分享。" }; },
    function (t) { return { t: "情景演练", time: "15min", c: "两两或小组角色扮演，模拟「" + t.title + "」场景下的正确做法，互相点评改进。" }; },
    function (t) { return { t: "个人承诺", time: "15min", c: "每人写下与「" + t.title + "」相关的具体行动承诺（我将在____做到____），同桌互签见证。" }; },
    function (t) { return { t: "经验分享", time: "15min", c: "邀请 2-3 位同学分享自己在这方面的成功经验或改进计划，全班给予掌声与建议。" }; }
  ],
  summary: [
    function (t) { return { t: "总结升华", time: "5min", c: "班主任用一句话总结「" + t.title + "」的核心价值，配一句金句送给全班。" }; },
    function (t) { return { t: "齐读誓词", time: "5min", c: "全班齐读与「" + t.title + "」相关的班级承诺/口号，强化行动意愿。" }; },
    function (t) { return { t: "行动回望", time: "5min", c: "布置本周行动小任务（记录/打卡/互助），下周一班会课前 2 分钟回顾。" }; },
    function (t) { return { t: "写后寄语", time: "5min", c: "请学生把今天的收获用一句话写在便签上贴进成长手册，班主任寄语收尾。" }; }
  ]
};
function aiRegeneratePlan(t) {
  const pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  return {
    flow: [pick(AI_FLOW_POOL.import)(t), pick(AI_FLOW_POOL.explore)(t), pick(AI_FLOW_POOL.practice)(t), pick(AI_FLOW_POOL.summary)(t)]
  };
}

/* 打开班会备课弹窗 */
function openMeetingTheme(id) {
  const themes = Store.get("meetingThemes", defaultMeetingThemes());
  const t = themes.find(function (x) { return x.id === id; });
  if (!t) return;
  const notes = Store.get("meetingNotes", {})[id] || null;
  const customTxt = notes && notes.custom ? notes.custom : null;
  const planTxt = customTxt || buildMeetingPlanText(t, notes ? { flow: notes.flow || t.flow } : null);
  const slidesHtml = t.slides.map(function (s, i) {
    return `
    <div class="meet-slide">
      <div class="ms-page">第 ${i + 1} 页</div>
      <div class="ms-title">${esc(s.t)}</div>
      <div class="ms-sub">${esc(s.sub || "")}</div>
      <ul>${s.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("")}</ul>
    </div>`;
  }).join("");
  openModal(`
    <div class="meeting-modal">
      <div class="mm-head">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="mc-week">第 ${t.week} 周</span>
          <span class="mc-aspect" style="background:${meetingAspectColor(t.aspect)}">${esc(t.aspect)}</span>
          <b style="font-size:16px;color:var(--green-900)">${esc(t.title)}</b>
        </div>
        <div style="margin-top:6px;font-size:13px;color:var(--ink)">🎯 目标：${esc(t.goal)}</div>
        <div style="margin-top:4px;font-size:13px;color:var(--green-700)">💬 金句：${esc(t.quote)}</div>
      </div>
      <div class="mm-tabs">
        <button class="btn btn-ghost btn-sm active" data-act="mm-tab" data-tab="plan">📋 AI 教案</button>
        <button class="btn btn-ghost btn-sm" data-act="mm-tab" data-tab="slides">🎞️ 幻灯片预览（${t.slides.length}页）</button>
      </div>
      <div class="mm-body" id="mmBody">
        <div class="mm-pane" data-pane="plan"><pre class="meet-plan" id="meetPlanTxt">${esc(planTxt)}</pre></div>
        <div class="mm-pane" data-pane="slides" style="display:none"><div class="meet-slides">${slidesHtml}</div></div>
      </div>
      <div class="mm-actions">
        <button class="btn btn-primary btn-sm" data-act="meeting-copy">📋 复制教案</button>
        <button class="btn btn-ghost btn-sm" data-act="meeting-ai">🤖 AI 重新备课</button>
        <button class="btn btn-ghost btn-sm" data-act="meeting-edit">✍️ 编辑教案</button>
        <button class="btn btn-ghost btn-sm" data-act="meeting-ppt">📊 下载班会PPT</button>
        <button class="btn btn-ghost btn-sm" data-act="meeting-print">🖨️ 打印幻灯片</button>
      </div>
    </div>`, "🤖 AI 备课 · " + t.title);
  const body = document.getElementById("mmBody");
  body.querySelectorAll("[data-act=mm-tab]").forEach(function (b) {
    b.onclick = function () {
      body.querySelectorAll("[data-act=mm-tab]").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      body.querySelectorAll(".mm-pane").forEach(function (p) { p.style.display = "none"; });
      body.querySelector("[data-pane=" + b.dataset.tab + "]").style.display = "";
    };
  });
  body.querySelector("[data-act=meeting-copy]").onclick = async function () {
    const txt = document.getElementById("meetPlanTxt").textContent;
    try { await navigator.clipboard.writeText(txt); toast("📋 教案已复制，可直接粘贴到 Word/PPT"); }
    catch (e) { prompt("请手动复制：", txt); }
  };
  body.querySelector("[data-act=meeting-ai]").onclick = function () {
    const np = aiRegeneratePlan(t);
    const notes = Store.get("meetingNotes", {});
    notes[id] = { flow: np.flow, custom: null };
    Store.set("meetingNotes", notes);
    document.getElementById("meetPlanTxt").textContent = buildMeetingPlanText(t, { flow: np.flow });
    toast("🤖 AI 已生成新教案并保存，可继续编辑");
  };
  body.querySelector("[data-act=meeting-edit]").onclick = function () {
    const cur = document.getElementById("meetPlanTxt").textContent;
    openModal('<textarea id="inpMeetEdit" style="width:100%;height:340px;font-size:13px;line-height:1.8;padding:10px;border:1px solid var(--line);border-radius:8px;box-sizing:border-box">' + esc(cur) + '</textarea>', "✍️ 编辑教案（保存后展示此版）");
    document.querySelector("[data-act=modal-ok]").onclick = function () {
      const notes = Store.get("meetingNotes", {});
      notes[id] = { flow: null, custom: document.getElementById("inpMeetEdit").value };
      Store.set("meetingNotes", notes);
      closeModal();
      document.getElementById("meetPlanTxt").textContent = notes[id].custom;
      toast("✅ 教案已保存");
    };
  };
  body.querySelector("[data-act=meeting-ppt]").onclick = function () { downloadMeetingPPT(t); };
  body.querySelector("[data-act=meeting-print]").onclick = function () { printMeetingSlides(t); };
  const ok = document.querySelector("[data-act=modal-ok]");
  if (ok) ok.onclick = closeModal;
}

/* 动态加载 pptxgenjs 并生成 .pptx */
function loadPptxGen(cb) {
  if (window.PptxGenJS) { cb(); return; }
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
  s.onload = cb;
  s.onerror = function () { toast("⚠️ PPT 引擎加载失败，请检查网络后重试（离线可用「打印幻灯片」代替）"); };
  document.head.appendChild(s);
}
function downloadMeetingPPT(t) {
  loadPptxGen(function () {
    try {
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "WIDE", width: 10, height: 5.625 });
      pptx.layout = "WIDE";
      const GREEN = "1F5C4D", GOLD = "D9A441", WHITE = "FFFFFF", INK = "33443F";
      let slide = pptx.addSlide();
      slide.background = { color: GREEN };
      slide.addText("啊敏的兵 · 每周班会", { x: 0.5, y: 0.4, w: 9, h: 0.5, fontSize: 12, color: "BFE3D5", align: "left", fontFace: "Microsoft YaHei" });
      slide.addText(t.title, { x: 0.5, y: 1.5, w: 9, h: 1.3, fontSize: 34, bold: true, color: WHITE, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText(t.aspect + " · 第 " + t.week + " 周", { x: 0.5, y: 3.1, w: 9, h: 0.6, fontSize: 16, color: GOLD, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText(t.goal, { x: 0.8, y: 3.9, w: 8.4, h: 1.1, fontSize: 11, color: "BFE3D5", align: "center", fontFace: "Microsoft YaHei" });
      t.slides.forEach(function (s) {
        slide = pptx.addSlide();
        slide.background = { color: WHITE };
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
        slide.addText(s.t, { x: 0.6, y: 0.35, w: 8.8, h: 0.9, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
        slide.addText(s.sub || "", { x: 0.6, y: 1.15, w: 8.8, h: 0.4, fontSize: 12, color: "8A9A93", fontFace: "Microsoft YaHei" });
        s.points.forEach(function (p, pi) {
          slide.addText("•  " + p, { x: 0.9, y: 1.9 + pi * 0.72, w: 8.2, h: 0.62, fontSize: 15, color: INK, fontFace: "Microsoft YaHei" });
        });
        slide.addText("啊敏的兵 · " + t.title, { x: 0.6, y: 5.1, w: 8.8, h: 0.35, fontSize: 9, color: "B8C4BE", align: "right", fontFace: "Microsoft YaHei" });
      });
      slide = pptx.addSlide();
      slide.background = { color: GREEN };
      slide.addText("谢谢聆听 · 我们一起成长", { x: 0.5, y: 2.0, w: 9, h: 1.2, fontSize: 28, bold: true, color: WHITE, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText(t.quote, { x: 0.8, y: 3.4, w: 8.4, h: 0.8, fontSize: 14, color: GOLD, align: "center", fontFace: "Microsoft YaHei" });
      pptx.writeFile({ fileName: "班会_第" + t.week + "周_" + t.title + ".pptx" });
      toast("✅ 班会 PPT 已生成并下载");
    } catch (e) { toast("⚠️ PPT 生成失败：" + e.message); }
  });
}

/* 打印幻灯片（新窗口 16:9 卡片，可直接打印为 PDF） */
function printMeetingSlides(t) {
  const w = window.open("", "_blank");
  if (!w) { toast("⚠️ 请允许弹出窗口"); return; }
  const slidesHtml = t.slides.map(function (s, i) {
    return `
    <div class="ps-slide">
      <div class="ps-head"><span>啊敏的兵 · 每周班会</span><span>第 ${i + 1} / ${t.slides.length} 页</span></div>
      <div class="ps-body">
        <div class="ps-title">${esc(s.t)}</div>
        <div class="ps-sub">${esc(s.sub || "")}</div>
        <ul>${s.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("")}</ul>
      </div>
      <div class="ps-foot">${esc(t.title)} · ${esc(t.aspect)}</div>
    </div>`;
  }).join("");
  w.document.write('<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
    "<title>班会幻灯片_" + esc(t.title) + "</title>" +
    '<style>' +
    'body{background:#EDEDE7;font-family:"Microsoft YaHei",sans-serif;margin:0;padding:20px}' +
    '.ps-slide{width:960px;height:540px;margin:0 auto 20px;background:#fff;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden;page-break-after:always}' +
    '.ps-head{background:#1F5C4D;color:#fff;padding:10px 24px;display:flex;justify-content:space-between;font-size:12px}' +
    '.ps-body{padding:40px 56px;flex:1}.ps-title{font-size:30px;font-weight:700;color:#1F5C4D;margin-bottom:8px}' +
    '.ps-sub{font-size:14px;color:#8A9A93;margin-bottom:24px}.ps-body li{font-size:18px;color:#33443F;line-height:2.1}' +
    '.ps-foot{background:#F7F5EE;color:#5a6b64;padding:10px 24px;font-size:12px;text-align:right}' +
    '@media print{body{padding:0}.ps-slide{box-shadow:none;border:1px solid #ddd;margin-bottom:0}}' +
    "</style></head><body>" +
    '<div class="ps-slide" style="background:#1F5C4D;justify-content:center;align-items:center;text-align:center">' +
    '<div style="color:#BFE3D5;font-size:14px">啊敏的兵 · 每周班会 · 第 ' + t.week + ' 周</div>' +
    '<div style="color:#fff;font-size:40px;font-weight:700;margin:16px 0">' + esc(t.title) + '</div>' +
    '<div style="color:#D9A441;font-size:18px">' + esc(t.aspect) + '</div>' +
    '<div style="color:#BFE3D5;font-size:13px;margin-top:20px;padding:0 80px">' + esc(t.goal) + '</div></div>' +
    slidesHtml +
    '<div class="ps-slide" style="background:#1F5C4D;justify-content:center;align-items:center;text-align:center">' +
    '<div style="color:#fff;font-size:34px;font-weight:700">谢谢聆听 · 我们一起成长</div>' +
    '<div style="color:#D9A441;font-size:16px;margin-top:16px">' + esc(t.quote) + '</div></div>' +
    "</body></html>");
  w.document.close();
  w.focus();
  setTimeout(function () { try { w.print(); } catch (e) {} }, 400);
}

/* 班会子栏目事件绑定（在 bindTabActions 中调用） */
function bindMeetingEvents() {
  const body = document.getElementById("classTabBody");
  if (!body) return;
  body.querySelectorAll("[data-act=meeting-open]").forEach(function (card) {
    card.onclick = function () { openMeetingTheme(card.dataset.meetingId); };
  });
  body.querySelector("[data-act=meeting-cfg]")?.addEventListener("click", function () {
    const cfg = Store.get("meetingCfg", { start: "2026-09-01", name: "2026 秋季学期" });
    openModal('<label style="font-size:13px;color:var(--ink-light)">学期名称</label>' +
      '<input class="inp" id="inpMtName" value="' + esc(cfg.name) + '" style="margin-bottom:10px">' +
      '<label style="font-size:13px;color:var(--ink-light)">开学日期（用于计算第几周）</label>' +
      '<input class="inp" id="inpMtStart" type="date" value="' + esc(cfg.start) + '">', "⚙️ 班会学期设置");
    document.querySelector("[data-act=modal-ok]").onclick = function () {
      const nc = {
        name: document.getElementById("inpMtName").value.trim() || "2026 秋季学期",
        start: document.getElementById("inpMtStart").value || "2026-09-01"
      };
      Store.set("meetingCfg", nc);
      closeModal();
      body.innerHTML = renderMeeting();
      bindMeetingEvents();
      toast("✅ 学期设置已保存");
    };
  });
  body.querySelector("[data-act=meeting-dl-all]")?.addEventListener("click", function () {
    const themes = Store.get("meetingThemes", defaultMeetingThemes());
    const cfg = Store.get("meetingCfg", { start: "2026-09-01", name: "2026 秋季学期" });
    const lines = ["【" + cfg.name + " · 班会主题全学期规划（25节）】", ""];
    themes.forEach(function (t) {
      lines.push("第" + String(t.week).padStart(2, "0") + "周 · " + t.aspect + " · " + t.title);
      lines.push("  目标：" + t.goal);
    });
    downloadFile("班会全学期规划_" + Today.now() + ".txt", lines.join("\n"));
    toast("📄 全学期规划已导出");
  });
}
