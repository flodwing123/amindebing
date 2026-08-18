/* =========================================================
   「📚 我爱学习」· 讲座 / 会议记录 AI 助手
   将讲座内容一键生成：智能笔记 + 思维导图 + 核心内容
   保存到笔记库，随时查看 / 导出 / 调用
   数据 key: studyNotes -> [ {id,title,source,raw,date,note,mind,core,archived} ]
   ========================================================= */

const STUDY_SOURCES = ["讲座", "会议", "培训", "教研活动", "读书", "其他"];
let studyOpenId = null; // 笔记库当前展开的详情
let studyResult = null; // 当前生成的 AI 结果（未保存前）

function getStudyNotes() { return Store.get("studyNotes", []); }
function saveStudyNotes(list) { Store.set("studyNotes", list); }
function studyDateNow() { return Today.now() + " " + new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }); }

/* ---------- 文本分析（纯前端启发式 AI，离线可用） ---------- */
function splitSentences(text) {
  const out = [];
  String(text || "").split(/\n+/).forEach(para => {
    const p = para.trim();
    if (!p) return;
    const m = p.match(/[^。！？!?;；]+[。！？!?;；]?/g) || [];
    const sents = m.map(s => s.trim()).filter(s => s.length >= 2);
    if (!sents.length && p.length >= 2) out.push(p);
    else sents.forEach(s => out.push(s));
  });
  return out;
}

const NOTE_KEYWORD = ["首先", "其次", "再次", "最后", "重点", "关键", "核心", "必须", "应该", "需要", "注意", "记住", "强调", "总结", "总之", "因此", "所以", "第一", "第二", "第三", "一是", "二是", "三是", "不能", "不要", "严禁", "要求", "提醒", "建议", "我们", "老师", "学生"];
const NOTE_HEAD_RE = /^第[一二三四五六七八九十百\d]+[章节课讲]|^[一二三四五六七八九十百\d]+[、.．]|^【[^】]+】|^（[一二三四五六七八九十百\d]+）/;
const NOTE_END_PUNCT = /[。！？!?]$/;

/* 1) 生成结构化笔记 */
function buildNote(title, text) {
  const paras = String(text || "").split(/\n+/).map(p => p.trim()).filter(p => p);
  const blocks = [];
  paras.forEach((p, pi) => {
    // 标题判定：编号/带【】/括号编号开头，或短行（≤20字且无句末标点）或段尾冒号
    const isHead = NOTE_HEAD_RE.test(p) || (p.length <= 20 && !NOTE_END_PUNCT.test(p)) || /[:：]$/.test(p);
    if (isHead) { blocks.push({ type: "h", text: p }); return; }
    const sents = splitSentences(p);
    sents.forEach(s => {
      const isPoint = NOTE_KEYWORD.some(k => s.startsWith(k) || (s.length <= 60 && s.includes(k)));
      blocks.push({ type: isPoint ? "li" : "p", text: s });
    });
  });
  if (!blocks.length) blocks.push({ type: "p", text: String(text || "").slice(0, 500) });
  return { heading: title || paras[0] || "未命名笔记", blocks };
}

/* 2) 生成思维导图树 */
function buildMindmap(title, text) {
  const paras = String(text || "").split(/\n+/).map(p => p.trim()).filter(p => p);
  const topic = (title || paras[0] || "讲座内容").slice(0, 16);
  let children = [];
  if (paras.length >= 2) {
    children = paras.slice(0, 7).map(p => {
      const sents = splitSentences(p);
      const head = sents[0] || p;
      const name = head.length > 20 ? head.slice(0, 20) + "…" : head;
      const subs = sents.slice(1, 5).map(s => (s.length > 22 ? s.slice(0, 22) + "…" : s));
      return { name, children: subs.map(n => ({ name: n, children: [] })) };
    });
  } else {
    const sents = splitSentences(text);
    children = sents.slice(0, 7).map(s => ({ name: (s.length > 22 ? s.slice(0, 22) + "…" : s), children: [] }));
  }
  return { topic, children };
}

/* 3) 提取核心内容：关键词 + 核心句 */
const CORE_STOP = new Set(["我们", "你们", "他们", "她们", "这个", "那个", "一个", "什么", "可以", "没有", "就是", "不是", "自己", "老师", "学生", "同学", "时候", "因为", "所以", "如果", "但是", "然后", "已经", "还有", "大家", "真的", "非常", "特别", "进行", "通过", "对于", "关于", "这些", "那些", "其中", "以及", "或者", "那么", "这样", "那样", "需要", "应该", "可能", "一定", "很多", "一些", "每个", "今天", "现在", "最后", "首先", "其次", "觉得", "认为", "孩子", "家长", "学校", "班级", "工作", "问题", "方面", "时候", "出来", "起来", "一下", "一种", "内容", "方法", "过程", "结果", "方式", "情况"]);
function extractKeywords(text) {
  const s = String(text || "").replace(/[\s\d_\-—–,.。，、;；:：!！?？()（）[\]【】"'“”‘’《》<>|/\\+=*@#$%^&~`]/g, "");
  const freq = {};
  for (let i = 0; i < s.length - 1; i++) {
    const w = s.slice(i, i + 2);
    if (!CORE_STOP.has(w) && !/\s/.test(w)) freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(x => x[0]);
}
function extractCore(text) {
  const sents = splitSentences(text);
  const scored = sents.map((s, i) => {
    let sc = 0;
    if (s.length >= 12 && s.length <= 90) sc += 2;
    if (NOTE_KEYWORD.some(k => s.includes(k))) sc += 3;
    if (i === 0 || i === sents.length - 1) sc += 2;
    if (i % 6 === 0) sc += 1;
    if (/[。！？!?]$/.test(s)) sc += 1;
    if (s.length < 6) sc -= 3;
    return sc;
  });
  return scored.map((sc, i) => ({ sc, s: sents[i] }))
    .sort((a, b) => b.sc - a.sc)
    .slice(0, Math.min(8, sents.length))
    .map(r => r.s);
}

/* 一键生成 */
function generateStudy(title, raw) {
  const note = buildNote(title, raw);
  const mind = buildMindmap(title, raw);
  const core = { keywords: extractKeywords(raw), sentences: extractCore(raw) };
  return { note, mind, core };
}

/* ---------- 思维导图 SVG 布局与渲染 ---------- */
const MM_COLORS = ["#D9A441", "#E8835A", "#5E9BC0", "#8A6FBF", "#C0567A", "#6FA88A"];
function mmLeafCount(n) { return n.children && n.children.length ? n.children.reduce((s, c) => s + mmLeafCount(c), 0) : 1; }
function mindLayout(mind) {
  const nodes = [], links = [];
  function place(n, x, yTop, depth) {
    const lc = mmLeafCount(n);
    const id = nodes.length;
    nodes.push({ id, name: n.name, x, y: yTop + (lc * 56 - 34) / 2, depth });
    let cy = yTop;
    (n.children || []).forEach(c => {
      const cid = place(c, x + 260, cy, depth + 1);
      cy += mmLeafCount(c) * 56;
      links.push({ from: id, to: cid });
    });
    return id;
  }
  let maxDepth = 0;
  (function dep(n, d) { maxDepth = Math.max(maxDepth, d); (n.children || []).forEach(c => dep(c, d + 1)); })(mind, 0);
  place(mind, 24, 24, 0);
  const h = mmLeafCount(mind) * 56 + 48;
  const w = 24 + maxDepth * 260 + 260;
  return { nodes, links, w, h };
}
function mmTextLines(name) {
  const s = String(name || "");
  if (s.length <= 16) return [s];
  const a = [];
  for (let i = 0; i < s.length; i += 16) a.push(s.slice(i, i + 16));
  return a.slice(0, 2);
}
function renderMindmapSVG(mind) {
  const { nodes, links, w, h } = mindLayout(mind);
  const linkPath = links.map(l => {
    const f = nodes[l.from], t = nodes[l.to];
    const mx = (f.x + 130 + t.x) / 2;
    return `<path d="M ${f.x + 190} ${f.y + 17} C ${mx} ${f.y + 17}, ${mx} ${t.y + 17}, ${t.x} ${t.y + 17}" fill="none" stroke="#9FB3A8" stroke-width="1.6"/>`;
  }).join("");
  const nodeHtml = nodes.map(n => {
    const isRoot = n.depth === 0;
    const fill = isRoot ? "#1F5C4D" : MM_COLORS[n.depth - 1] || "#6FA88A";
    const lines = mmTextLines(n.name);
    const hh = 20 + lines.length * 16;
    const yy = n.y - (hh - 34) / 2;
    const text = lines.map((ln, i) => `<tspan x="${n.x + 14}" y="${yy + 24 + i * 16}">${esc(ln)}</tspan>`).join("");
    return `<g>
      <rect x="${n.x}" y="${yy}" width="${isRoot ? 190 : 230}" height="${hh}" rx="9" fill="${fill}" opacity="${isRoot ? 1 : 0.94}"/>
      <text font-size="12.5" fill="#fff" font-weight="${isRoot ? 700 : 500}">${text}</text>
    </g>`;
  }).join("");
  return `<svg class="mind-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">${linkPath}${nodeHtml}</svg>`;
}

/* 纯文本导出工具 */
function noteToText(note) {
  const lines = [];
  (note.blocks || []).forEach(b => {
    if (b.type === "h") lines.push("◆ " + b.text);
    else if (b.type === "li") lines.push("   · " + b.text);
    else lines.push("     " + b.text);
  });
  return lines.join("\n");
}
function mindToText(mind) {
  const lines = [];
  const walk = (n, pre, last) => {
    lines.push(pre + (last ? "└─ " : "├─ ") + n.name);
    (n.children || []).forEach((c, i) => walk(c, pre + (last ? "   " : "│  "), i === n.children.length - 1));
  };
  (mind.children || []).forEach((c, i) => walk(c, "", i === mind.children.length - 1));
  return lines.join("\n");
}
function studyToText(r) {
  return "📄 " + r.title + "\n🗓 " + r.date + " · 来源：" + r.source + "\n\n" +
    "========== 📝 智能笔记 ==========\n" + noteToText(r.note) + "\n\n" +
    "========== 🧠 思维导图 ==========\n" + r.mind.topic + "\n" + mindToText(r.mind) + "\n\n" +
    "========== 🔥 核心内容 ==========\n关键词：" + (r.core.keywords || []).join(" / ") + "\n" +
    (r.core.sentences || []).map(s => "· " + s).join("\n");
}

/* ---------- 音频播放器组件 ---------- */
function fmtAudioDur(s) {
  if (!s) return "0:00";
  var m = Math.floor(s / 60), ss = s % 60;
  return m + ":" + String(ss).padStart(2, "0");
}
function fmtAudioSize(b) {
  if (!b) return "—";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 / 1024).toFixed(2) + " MB";
}
/* 渲染音频信息条（录音完成后、保存前显示） */
function renderAudioInfo(b64, dur, size, scope) {
  if (!b64) return "";
  return '<div class="vr-audio-info" id="srAudioInfo">'
    + '<span class="vr-audio-badge">🎙️ 录音已就绪</span>'
    + '<span class="vr-audio-meta">' + fmtAudioDur(dur) + ' · ' + fmtAudioSize(size) + '</span>'
    + '<span class="vr-audio-note">保存笔记时音频一并存储</span>'
    + '</div>';
}
/* 渲染音频播放器（已保存的记录中回放） */
function renderAudioPlayer(b64, dur, size, scope) {
  if (!b64) return "";
  var dlName = (scope === "comm" ? "沟通录音" : "讲座录音") + "_" + fmtAudioDur(dur).replace(":", "分") + "秒." + (b64.indexOf("audio/mp4") >= 0 ? "m4a" : b64.indexOf("audio/ogg") >= 0 ? "ogg" : "webm");
  return '<div class="vr-audio-player">'
    + '<div class="vr-ap-head">'
    +   '<span class="vr-ap-icon">🎙️</span>'
    +   '<span class="vr-ap-title">录音存档</span>'
    +   '<span class="vr-ap-meta">' + fmtAudioDur(dur || 0) + ' · ' + fmtAudioSize(size || 0) + '</span>'
    + '</div>'
    + '<audio controls preload="none" src="' + b64 + '" style="width:100%;margin-top:6px"></audio>'
    + '<div class="vr-ap-actions">'
    +   '<a class="btn btn-ghost btn-sm" href="' + b64 + '" download="' + dlName + '">⬇️ 下载录音</a>'
    + '</div>'
    + '</div>';
}

/* ---------- 模块渲染 ---------- */
registerModule("study", {
  title: "📚 我爱学习",
  sub: "讲座/会议 AI 笔记 · 思维导图 · 核心内容",
  render() {
    const list = getStudyNotes();
    const active = list.filter(n => !n.archived).sort((a, b) => (b.date > a.date ? 1 : -1));
    const arch = list.filter(n => n.archived).sort((a, b) => (b.date > a.date ? 1 : -1));
    return `
    <div class="mv-header"><h2 class="mv-title">📚 我爱学习 <span style="font-size:13px;color:var(--ink-light);font-weight:400">讲座/会议内容 → AI 笔记 · 导图 · 核心</span></h2>
      <p class="mv-sub">共 ${active.length} 条学习笔记 · 全部保存本地，随时查看调用</p></div>
    ${modToolbar("我爱学习")}

    <!-- 新建记录 -->
    <div class="card" id="sub-create">
      <div class="card-title">🎙️ 记录讲座 / 会议 <span class="sub">支持实时录音转文字 · 或粘贴文字 · 一键生成学习成果</span></div>
      <div class="study-input-row">
        <input class="inp" id="inpStudyTitle" placeholder="📄 讲座/会议标题" style="flex:2;min-width:160px">
        <select class="inp" id="inpStudySource" style="flex:1;min-width:110px">
          ${STUDY_SOURCES.map(s => `<option>${s}</option>`).join("")}
        </select>
      </div>
      <div id="voiceBar" style="margin-bottom:8px"></div>
      <textarea class="tarea" id="inpStudyRaw" rows="10" style="width:100%" placeholder="🎤 点击上方「开始录音」自动转写，或在此粘贴讲座/会议内容原文……"></textarea>
      <div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary" data-act="study-gen">🤖 一键生成：笔记 + 思维导图 + 核心内容</button>
        <span style="font-size:12px;color:var(--ink-light)">AI 摘要为启发式生成，建议人工校对</span>
      </div>
      <div id="studyResult">${studyResult ? renderStudyResult(studyResult) : ""}</div>
    </div>

    <!-- 笔记库 -->
    <div class="card" id="sub-notes">
      <div class="card-title">🗃️ 学习笔记库 <span class="sub">点击卡片查看详情 · 可导出可调用</span>
        <button class="btn btn-ghost btn-sm" data-act="study-export-all">⬇️ 导出全部</button>
      </div>
      ${active.length === 0 ? `<div class="empty"><span class="e-ico">📚</span>笔记库为空：记录一场讲座，点「🤖 一键生成」并保存即可</div>` : `
      <div class="study-note-list">
        ${active.map(n => `
        <div class="study-note-card ${studyOpenId === n.id ? "open" : ""}" data-study-open="${n.id}">
          <div class="sn-top">
            <span class="sn-src">${esc(n.source)}</span>
            <span class="sn-date">🕐 ${esc(n.date)}</span>
          </div>
          <div class="sn-title">📄 ${esc(n.title)}</div>
          <div class="sn-meta">${n.audioData ? '🎙️ 含录音 · ' : ''}${n.raw ? (n.raw.length + " 字原文") : ""} · ${(n.note.blocks || []).length} 条笔记 · ${(n.core.keywords || []).length} 个关键词 · ${(n.core.sentences || []).length} 句核心</div>
          ${studyOpenId === n.id ? renderStudyDetail(n) : ""}
        </div>`).join("")}
      </div>`}
    </div>

    ${arch.length ? `
    <div class="card" style="border-color:#E7DDC4;background:#FDFBF4">
      <div class="card-title">🗄️ 归档箱 <span class="sub">归档不删除，随时可恢复</span></div>
      <div class="study-note-list">
        ${arch.map(n => `
        <div class="study-note-card ${studyOpenId === n.id ? "open" : ""}" data-study-open="${n.id}">
          <div class="sn-top"><span class="sn-src">${esc(n.source)}</span><span class="sn-date">🕐 ${esc(n.date)}</span></div>
          <div class="sn-title">📄 ${esc(n.title)}</div>
          <div class="sn-meta">${n.audioData ? '🎙️ 含录音 · ' : ''}已归档 · ${(n.note.blocks || []).length} 条笔记</div>
          ${studyOpenId === n.id ? renderStudyDetail(n) : ""}
        </div>`).join("")}
      </div>
    </div>` : ""}`;
  },
  after() {
    const body = document.getElementById("moduleView");
    /* 绑定录音控件 */
    VoiceRecord.bind("voiceBar", "inpStudyRaw", {
      onDone: function (text) {
        /* 录音完成后获取音频 base64，存入 studyResult 待保存 */
        VoiceRecord.getAudioBase64(function (b64) {
          if (b64) {
            studyResult = studyResult || {};
            studyResult._audio = b64;
            studyResult._audioDur = VoiceRecord.getDuration();
            studyResult._audioSize = VoiceRecord.getAudioSize();
            /* 如果结果区已渲染，刷新音频信息 */
            var info = document.getElementById("srAudioInfo");
            if (info) {
              info.innerHTML = renderAudioInfo(b64, studyResult._audioDur, studyResult._audioSize, "study");
            }
          }
          /* 聚焦到生成按钮 */
          var btn = document.querySelector("[data-act=study-gen]");
          if (btn && text) btn.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    });
    document.querySelector("[data-act=study-gen]")?.addEventListener("click", () => {
      const raw = document.getElementById("inpStudyRaw").value.trim();
      if (!raw) { toast("⚠️ 请先粘贴讲座/会议内容"); return; }
      const title = document.getElementById("inpStudyTitle").value.trim();
      studyResult = generateStudy(title || "", raw);
      studyResult._title = title;
      studyResult._source = document.getElementById("inpStudySource").value;
      studyResult._raw = raw;
      const box = document.getElementById("studyResult");
      box.innerHTML = renderStudyResult(studyResult);
      bindStudyResultEvents();
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      toast("🤖 已生成：笔记 + 思维导图 + 核心内容");
    });
    /* 笔记库卡片展开/收起 */
    body.querySelectorAll("[data-study-open]").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-study-op]")) return; // 操作按钮不触发展开
        const id = card.dataset.studyOpen;
        studyOpenId = studyOpenId === id ? null : id;
        body.innerHTML = Modules.study.render();
        Modules.study.after();
      });
    });
    bindStudyDetailEvents();
    document.querySelector("[data-act=study-export-all]")?.addEventListener("click", () => {
      const list = getStudyNotes().filter(n => !n.archived);
      if (!list.length) { toast("笔记库为空"); return; }
      const txt = list.map(n => studyToText(n) + "\n\n" + "=".repeat(40) + "\n\n").join("");
      downloadFile("学习笔记库_全部_" + Today.now() + ".txt", txt, "text/plain;charset=utf-8");
      toast("⬇️ 已导出全部学习笔记");
    });
  }
});

/* AI 结果区渲染 */
function renderStudyResult(r) {
  return `
  <div class="study-result">
    <div class="sr-head">
      <span>🤖 生成结果 · <b>${esc(r._title || r.note.heading || "未命名")}</b></span>
      <span class="sr-actions">
        <button class="btn btn-ghost btn-sm" data-act="study-save">💾 保存到笔记库</button>
      </span>
    </div>
    ${r._audio ? renderAudioInfo(r._audio, r._audioDur, r._audioSize, "study") : '<div id="srAudioInfo"></div>'}
    <div class="study-cols">
      <div class="card sr-col">
        <div class="card-title">📝 智能笔记</div>
        <div class="sr-note">${renderNoteHtml(r.note)}</div>
      </div>
      <div class="card sr-col">
        <div class="card-title">🧠 思维导图
          <button class="btn btn-ghost btn-sm" data-act="mm-export">⬇️ SVG</button>
          <button class="btn btn-ghost btn-sm" data-act="mm-print">🖨️</button>
        </div>
        <div class="sr-mind">${renderMindmapSVG(r.mind)}</div>
      </div>
      <div class="card sr-col">
        <div class="card-title">🔥 核心内容</div>
        <div class="sr-core">
          <div class="sc-kw">${(r.core.keywords || []).map(k => `<span class="kw">${esc(k)}</span>`).join("") || "—"}</div>
          <ol class="sc-list">${(r.core.sentences || []).map(s => `<li>${esc(s)}</li>`).join("") || "<li>暂无</li>"}</ol>
        </div>
      </div>
    </div>
  </div>`;
}
function renderNoteHtml(note) {
  return `<div class="note-blocks">${(note.blocks || []).map(b => {
    if (b.type === "h") return `<div class="nb-h">◆ ${esc(b.text)}</div>`;
    if (b.type === "li") return `<div class="nb-li">· ${esc(b.text)}</div>`;
    return `<div class="nb-p">${esc(b.text)}</div>`;
  }).join("")}</div>`;
}
function bindStudyResultEvents() {
  document.querySelector("[data-act=study-save]")?.addEventListener("click", () => {
    if (!studyResult) return;
    var list = getStudyNotes();
    list.unshift({
      id: uid(),
      title: studyResult._title || studyResult.note.heading || "未命名笔记",
      source: studyResult._source || "讲座",
      raw: studyResult._raw || "",
      date: studyDateNow(),
      note: studyResult.note,
      mind: studyResult.mind,
      core: studyResult.core,
      audioData: studyResult._audio || null,
      audioDur: studyResult._audioDur || 0,
      audioSize: studyResult._audioSize || 0,
      archived: false
    });
    saveStudyNotes(list);
    studyResult = null;
    studyOpenId = null;
    /* 清除录音缓存 */
    VoiceRecord.clearAudio();
    const body = document.getElementById("moduleView");
    body.innerHTML = Modules.study.render();
    Modules.study.after();
    toast("✅ 已保存到学习笔记库（含录音 · 自动备份到数据保险库）");
  });
  document.querySelector("[data-act=mm-export]")?.addEventListener("click", () => {
    if (!studyResult) return;
    const svg = renderMindmapSVG(studyResult.mind);
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg;
    downloadFile("思维导图_" + (studyResult._title || "讲座") + ".svg", xml, "image/svg+xml;charset=utf-8");
    toast("⬇️ 思维导图 SVG 已下载");
  });
  document.querySelector("[data-act=mm-print]")?.addEventListener("click", () => {
    if (!studyResult) return;
    const w = window.open("", "_blank");
    if (!w) { toast("⚠️ 请允许弹出窗口"); return; }
    w.document.write(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>思维导图</title>
      <style>body{font-family:system-ui,'PingFang SC','Microsoft YaHei',sans-serif;background:#fff;color:#22302A;margin:24px}
      h2{color:#1F5C4D}.mind-svg{max-width:100%;height:auto}</style></head>
      <body><h2>🧠 ${esc(studyResult._title || "思维导图")}</h2>${renderMindmapSVG(studyResult.mind)}
      <p style="color:#8A9890;font-size:12px">啊敏的兵 · 我爱学习 · ${Today.now()}</p>
      <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
    w.document.close();
  });
}

/* 笔记库详情 */
function renderStudyDetail(n) {
  return `
  <div class="study-detail">
    <div class="sd-actions">
      <button class="btn btn-ghost btn-sm" data-study-op data-act="study-export-one" data-id="${n.id}">⬇️ 导出</button>
      ${n.archived
        ? `<button class="btn btn-ghost btn-sm" data-study-op data-act="study-restore" data-id="${n.id}">↩️ 恢复</button>`
        : `<button class="btn btn-ghost btn-sm" data-study-op data-act="study-archive" data-id="${n.id}">🗄️ 归档</button>`}
      <button class="btn btn-danger btn-sm" data-study-op data-act="study-del" data-id="${n.id}" title="彻底删除（历史快照仍可恢复）">✕ 删除</button>
      <button class="btn btn-ghost btn-sm" data-study-op data-act="study-close">收起</button>
    </div>
    ${n.audioData ? renderAudioPlayer(n.audioData, n.audioDur, n.audioSize, "study") : ""}
    <div class="study-cols">
      <div class="card sr-col"><div class="card-title">📝 智能笔记</div><div class="sr-note">${renderNoteHtml(n.note)}</div></div>
      <div class="card sr-col"><div class="card-title">🧠 思维导图</div><div class="sr-mind">${renderMindmapSVG(n.mind)}</div></div>
      <div class="card sr-col"><div class="card-title">🔥 核心内容</div>
        <div class="sr-core">
          <div class="sc-kw">${(n.core.keywords || []).map(k => `<span class="kw">${esc(k)}</span>`).join("") || "—"}</div>
          <ol class="sc-list">${(n.core.sentences || []).map(s => `<li>${esc(s)}</li>`).join("") || "<li>暂无</li>"}</ol>
        </div></div>
    </div>
    ${n.raw ? `<details class="sd-raw"><summary>📜 查看原文（${n.raw.length} 字）</summary><pre>${esc(n.raw)}</pre></details>` : ""}
  </div>`;
}
function bindStudyDetailEvents() {
  const body = document.getElementById("moduleView");
  body.querySelectorAll("[data-act=study-export-one]").forEach(b => b.onclick = () => {
    const n = getStudyNotes().find(x => x.id === b.dataset.id);
    if (n) downloadFile("学习笔记_" + n.title + ".txt", studyToText(n), "text/plain;charset=utf-8");
  });
  body.querySelectorAll("[data-act=study-archive]").forEach(b => b.onclick = () => {
    const list = getStudyNotes();
    const n = list.find(x => x.id === b.dataset.id);
    if (n) { n.archived = true; saveStudyNotes(list); toast("🗄️ 已归档（可在归档箱找回）"); }
    const v = document.getElementById("moduleView"); v.innerHTML = Modules.study.render(); Modules.study.after();
  });
  body.querySelectorAll("[data-act=study-restore]").forEach(b => b.onclick = () => {
    const list = getStudyNotes();
    const n = list.find(x => x.id === b.dataset.id);
    if (n) { n.archived = false; saveStudyNotes(list); toast("↩️ 已恢复到笔记库"); }
    const v = document.getElementById("moduleView"); v.innerHTML = Modules.study.render(); Modules.study.after();
  });
  body.querySelectorAll("[data-act=study-del]").forEach(b => b.onclick = () => {
    if (!confirm("⚠️ 彻底删除后无法撤销！\n\n历史快照与备份文件中仍保留该记录。\n\n确定删除吗？")) return;
    saveStudyNotes(getStudyNotes().filter(x => x.id !== b.dataset.id));
    studyOpenId = null;
    const v = document.getElementById("moduleView"); v.innerHTML = Modules.study.render(); Modules.study.after();
    toast("已删除（数据保险库快照中仍可恢复）");
  });
  body.querySelectorAll("[data-act=study-close]").forEach(b => b.onclick = () => {
    studyOpenId = null;
    const v = document.getElementById("moduleView"); v.innerHTML = Modules.study.render(); Modules.study.after();
  });
}
