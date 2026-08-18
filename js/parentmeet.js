/* =========================================================
   家长会 · 每学期3场（开学首次 / 期中 / 期末）
   AI 议程生成 · 编辑保存 · 家长会PPT
   成绩分析：保存成绩快照 → 一键生成「成绩分析PPT」在家长会展示
   ========================================================= */

/* ---------- 三场家长会主题库 ---------- */
const PM_SESSIONS = [
  {
    id: "open", icon: "🚀", tag: "开学首次", when: "开学第 1~2 周", color: "#3E9C86",
    title: "新起点 · 心同行", goal: "让家长了解班级愿景与新学期安排，建立家校信任，共商习惯养成计划，帮孩子顺利进入新学期状态。",
    agenda: [
      { t: "欢迎与自我介绍", time: "5min", c: "班主任欢迎家长到来，简要自我介绍与带班理念；逐一介绍科任老师团队。" },
      { t: "班级情况介绍", time: "15min", c: "班级人数、班委架构、班级公约与积分规则；展示教室布置与开学准备情况。" },
      { t: "新学期计划", time: "15min", c: "本学期教学安排、考试节点、班级活动规划；明确对学生的期望与一日常规要求。" },
      { t: "习惯养成建议", time: "10min", c: "手机管理、作业习惯、睡眠作息、运动阅读——给家长 5 条可落地建议。" },
      { t: "家校沟通方式", time: "5min", c: "班级群使用规范、与科任老师沟通渠道；现场收集家长意见与建议。" }
    ]
  },
  {
    id: "mid", icon: "📈", tag: "期中", when: "期中考试后一周", color: "#5B8DC0",
    title: "聚焦半程 · 共促成长", goal: "分析期中成绩与前半学期学情，肯定进步、直面问题，明确下阶段改进方向，家长配合督促。",
    agenda: [
      { t: "期中成绩分析", time: "20min", c: "结合成绩分析 PPT，展示班级各科平均分、优秀率、及格率与分数段分布。" },
      { t: "学情反馈", time: "15min", c: "表扬进步明显的学生与班级亮点；指出共性问题（偏科、基础薄弱、作业质量、课堂专注）。" },
      { t: "对策研讨", time: "10min", c: "针对共性问题给出家庭配合建议：错题整理、限时训练、阅读打卡、作息保障。" },
      { t: "重点关注沟通", time: "5min", c: "对个别需要关注的学生，会后单独约谈，约定沟通时间与配合方式。" }
    ]
  },
  {
    id: "final", icon: "🏁", tag: "期末", when: "期末考试后", color: "#D9A441",
    title: "盘点收获 · 展望假期", goal: "总结一学期成果与成长，通过期中期末对比看见进步，规划假期学习与生活，做好新学期衔接。",
    agenda: [
      { t: "学期总结", time: "15min", c: "回顾班级一学期的活动、荣誉与成长瞬间；结合成绩分析 PPT 展示期末整体情况。" },
      { t: "期末成绩分析", time: "15min", c: "各科平均分与名次变化；对比期中与期末两次成绩，展示进步榜与待提升名单。" },
      { t: "假期规划", time: "10min", c: "假期学习建议：复习巩固、预习衔接、阅读书单；作息与手机管理约定。" },
      { t: "安全提醒", time: "5min", c: "防溺水、交通安全、网络安全、心理健康等假期安全注意事项。" },
      { t: "新学期展望", time: "5min", c: "下学期安排预告；家校继续携手，共同见证孩子成长。" }
    ]
  }
];

/* ---------- AI 议程模板池（按场次类型随机组合） ---------- */
const PM_AGENDA_POOL = {
  open: {
    welcome: [
      "班主任欢迎家长到来，简要自我介绍与带班理念；逐一介绍科任老师团队。",
      "开场用一段开学第一天的班级剪影/照片导入，介绍班主任带班理念与新学期愿景。"
    ],
    intro: [
      "班级人数、班委架构、班级公约与积分规则；展示教室布置与开学准备情况。",
      "介绍班级文化（班名/口号/目标），说明班级管理方式与日常考评机制。"
    ],
    plan: [
      "本学期教学安排、考试节点、班级活动规划；明确对学生的期望与一日常规要求。",
      "讲解本学期的学科学习重点与节奏，公布月考/期中/期末时间节点，明确家校配合要点。"
    ],
    habit: [
      "手机管理、作业习惯、睡眠作息、运动阅读——给家长 5 条可落地建议。",
      "聚焦初一/初二学生特点：青春期沟通、专注力训练、电子产品管理，给出具体操作建议。"
    ],
    comm: [
      "班级群使用规范、与科任老师沟通渠道；现场收集家长意见与建议。",
      "说明家校沟通渠道与最佳时段，邀请家长填写意见卡，共同完善班级建设。"
    ]
  },
  mid: {
    score: [
      "结合成绩分析 PPT，展示班级各科平均分、优秀率、及格率与分数段分布。",
      "用成绩分析 PPT 呈现班级整体水平与学科强弱，引导家长理性看待分数、关注过程。"
    ],
    feedback: [
      "表扬进步明显的学生与班级亮点；指出共性问题（偏科、基础薄弱、作业质量、课堂专注）。",
      "分学科反馈学习表现，展示优秀作业与课堂剪影；点名表扬进步学生，同时客观指出共性问题。"
    ],
    strategy: [
      "针对共性问题给出家庭配合建议：错题整理、限时训练、阅读打卡、作息保障。",
      "给出「家庭学习 30 分钟」行动方案：复习-作业-预习闭环，家长如何陪伴而不打扰。"
    ],
    focus: [
      "对个别需要关注的学生，会后单独约谈，约定沟通时间与配合方式。",
      "说明重点关注学生名单与原因，约定会后一对一面谈时间表，保护孩子自尊心。"
    ]
  },
  final: {
    summary: [
      "回顾班级一学期的活动、荣誉与成长瞬间；结合成绩分析 PPT 展示期末整体情况。",
      "用照片墙/时间线回顾一学期精彩瞬间，肯定班级整体进步与每一位孩子的闪光点。"
    ],
    score: [
      "各科平均分与名次变化；对比期中与期末两次成绩，展示进步榜与待提升名单。",
      "通过期中期末对比图展示进退步，重点表扬持续进步的孩子，客观分析退步原因。"
    ],
    holiday: [
      "假期学习建议：复习巩固、预习衔接、阅读书单；作息与手机管理约定。",
      "发放假期学习计划表模板与推荐书单，约定手机使用时长与作息时间。"
    ],
    safety: [
      "防溺水、交通安全、网络安全、心理健康等假期安全注意事项。",
      "强调假期安全红线：防溺水六不准、出行安全、网络防沉迷与防诈骗。"
    ],
    outlook: [
      "下学期安排预告；家校继续携手，共同见证孩子成长。",
      "预告下学期重点（新增学科/中考备考/活动安排），传递信心与期待。"
    ]
  }
};

function pmRegenerate(session) {
  const pool = PM_AGENDA_POOL[session.id] || PM_AGENDA_POOL.open;
  const pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  const tpl = session.agenda.map(function (a, i) {
    const keys = Object.keys(pool);
    return {
      t: a.t,
      time: a.time,
      c: pick(pool[keys[i % keys.length]] || pool[keys[0]])
    };
  });
  return tpl;
}

function pmSessionById(id) {
  return PM_SESSIONS.find(function (s) { return s.id === id; }) || PM_SESSIONS[0];
}

/* ---------- 家长会数据 ---------- */
function pmCfg() { return Store.get("parentCfg", { name: "2026 秋季学期", start: "2026-09-01" }); }
function pmNotes() { return Store.get("parentNotes", {}); }
function pmSnaps() { return Store.get("parentScoreSnaps", []); }

/* 把 agenda 组装成 {t, sub, points} 幻灯片结构（与班会 PPT 一致） */
function pmBuildSlides(session, agenda) {
  const slides = [];
  agenda.forEach(function (a, i) {
    const pts = String(a.c).split(/[；;。]/).map(function (x) { return x.trim(); }).filter(function (x) { return x; });
    slides.push({ t: "环节" + (i + 1) + " · " + a.t, sub: "⏱ " + a.time, points: pts });
  });
  return slides;
}

function pmPlanText(session, agenda) {
  let txt = "【" + session.tag + "家长会】" + session.title + "\n\n";
  txt += "一、会议目标\n" + session.goal + "\n\n";
  txt += "二、会议议程（约 50 分钟）\n";
  agenda.forEach(function (a, i) { txt += "环节" + (i + 1) + "【" + a.t + "】" + a.time + "：" + a.c + "\n"; });
  return txt;
}

/* ---------- 成绩分析工具 ---------- */
function pmAllScoreRows() {
  // 从 students 提取当前全部分数数据 → [{cls, name, chinese, math, english, total}]
  const classes = Store.get("classes", defaultClasses());
  const students = Store.get("students", {});
  const rows = [];
  classes.forEach(function (c) {
    (students[c.name] || []).forEach(function (s) {
      if (s.total == null) return;
      rows.push({
        cls: c.name, name: s.name,
        chinese: s.chinese != null ? +s.chinese : null,
        math: s.math != null ? +s.math : null,
        english: s.english != null ? +s.english : null,
        total: +s.total
      });
    });
  });
  return rows;
}

function pmAvg(list, f) {
  const vals = list.map(f).filter(function (v) { return v != null; });
  return vals.length ? (vals.reduce(function (a, b) { return a + b; }, 0) / vals.length) : 0;
}

/* 快照数据统计 → PPT 数据模型 */
function pmAnalyze(rows) {
  const n = rows.length;
  if (!n) return null;
  const sortedT = rows.map(function (r) { return r.total; }).sort(function (a, b) { return b - a; });
  const maxT = sortedT[0];
  /* 按总分名次百分位分档：A 前15% / B 15%~30% / C 30%~50% / D 后50% */
  const grade = function (t) {
    const pct = (sortedT.indexOf(t) + 1) / n;
    if (pct <= 0.15) return "A";
    if (pct <= 0.3) return "B";
    if (pct <= 0.5) return "C";
    return "D";
  };
  const dist = { A: 0, B: 0, C: 0, D: 0 };
  rows.forEach(function (r) { dist[grade(r.total)]++; });
  const sorted = rows.slice().sort(function (a, b) { return b.total - a.total; });
  return {
    n: n,
    avgTotal: pmAvg(rows, function (r) { return r.total; }),
    avgChinese: pmAvg(rows, function (r) { return r.chinese; }),
    avgMath: pmAvg(rows, function (r) { return r.math; }),
    avgEnglish: pmAvg(rows, function (r) { return r.english; }),
    maxTotal: maxT,
    minTotal: Math.min.apply(null, rows.map(function (r) { return r.total; })),
    passRate: Math.round(rows.filter(function (r) { return r.total >= maxT * 0.6; }).length / n * 100),
    goodRate: Math.round(rows.filter(function (r) { return r.total >= maxT * 0.8; }).length / n * 100),
    dist: dist,
    top10: sorted.slice(0, 10),
    byCls: {}
  };
}

/* 对比两次快照 → 进步榜（可显示姓名）/ 退步整体统计（永不出现姓名） */
function pmCompare(prevRows, curRows) {
  const find = function (rows, name, cls) {
    return rows.find(function (r) { return r.name === name && r.cls === cls; });
  };
  const deltas = [];
  curRows.forEach(function (r) {
    const p = find(prevRows, r.name, r.cls);
    if (p) deltas.push({
      name: r.name, cls: r.cls, delta: r.total - p.total, cur: r.total,
      dc: r.chinese != null && p.chinese != null ? r.chinese - p.chinese : 0,
      dm: r.math != null && p.math != null ? r.math - p.math : 0,
      de: r.english != null && p.english != null ? r.english - p.english : 0
    });
  });
  deltas.sort(function (a, b) { return b.delta - a.delta; });
  const up = deltas.filter(function (d) { return d.delta > 0; }).slice(0, 8);
  /* 退步仅做整体分析——不保留任何学生姓名 */
  const downAll = deltas.filter(function (d) { return d.delta < 0; });
  const downStat = downAll.length ? {
    count: downAll.length,
    ratio: Math.round(downAll.length / deltas.length * 100),
    avgDelta: Math.round(downAll.reduce(function (a, b) { return a + b.delta; }, 0) / downAll.length),
    maxDrop: Math.min.apply(null, downAll.map(function (d) { return d.delta; })),
    subDrop: {
      chinese: downAll.filter(function (d) { return d.dc < 0; }).length,
      math: downAll.filter(function (d) { return d.dm < 0; }).length,
      english: downAll.filter(function (d) { return d.de < 0; }).length
    }
  } : null;
  return { up: up, downStat: downStat, hasCompare: deltas.length > 0 };
}

/* 全勤之星：在考勤记录中从未被标记迟到/缺勤/请假的学生（按班分组，可显示姓名） */
function pmFullAttendance() {
  const att = Store.get("attendance", {});
  const classes = Store.get("classes", defaultClasses());
  const students = Store.get("students", {});
  const dates = Object.keys(att).filter(function (d) { return Object.keys(att[d] || {}).length > 0; });
  const bad = {};
  dates.forEach(function (d) {
    Object.keys(att[d] || {}).forEach(function (n) { if (att[d][n]) bad[n] = true; });
  });
  const groups = [];
  classes.forEach(function (c) {
    const list = (students[c.name] || []).map(function (s) { return s.name; }).filter(function (n) { return n && !bad[n]; });
    if (list.length) groups.push({ cls: c.name, list: list });
  });
  return groups;
}

/* 实施策略与步骤（改进建议落地为两步走方案） */
const PM_ACTION_PLAN = [
  {
    t: "策略一 · 家庭「三定」学习法",
    desc: "定时 · 定点 · 定量，帮孩子建立稳定学习节律",
    steps: [
      "第1周：和孩子共同制定每日作息表，固定学习时段与手机使用时段",
      "第2周：落实「先复习 → 再作业 → 后预习」流程，家长陪伴但不代劳",
      "第3周：建立专属错题本，每周末和孩子一起复盘本周错题",
      "第4周起：执行满一个月后，与班主任同步一次情况，再优化计划"
    ]
  },
  {
    t: "策略二 · 家校「一加一」联动",
    desc: "每周一次沟通 + 每月一次复盘，家校形成合力",
    steps: [
      "每周：与科任老师简要沟通一次孩子课堂与作业近况",
      "每月：对照错题本与作业签字，找出一项最需改进的习惯并聚焦攻克",
      "每考后：和孩子一起做「进步清单」——列出一学期做得好的 3 件事",
      "长期：多表扬过程性努力（按时作业/坚持阅读），少贴标签，守护信心"
    ]
  }
];

/* 改进建议：通用 5 条 + 依据退步整体分析动态补充学科关注 */
function pmAdvice(downStat) {
  const advice = [
    "理性看待分数：看进步、看习惯，不因一次成绩否定孩子",
    "保障作息：初中生建议每晚 22:30 前入睡，保证 8 小时睡眠",
    "管理手机：学习时段手机交家长保管，杜绝「作业帮」式依赖",
    "每日沟通：饭桌上 10 分钟，聊聊校园趣事与烦恼，先听后说",
    "配合老师：作业签字、错题本检查，有情况及时与班主任沟通"
  ];
  if (downStat && downStat.count) {
    const top = [
      { k: "chinese", n: "语文" }, { k: "math", n: "数学" }, { k: "english", n: "英语" }
    ].sort(function (a, b) { return downStat.subDrop[b.k] - downStat.subDrop[a.k]; })[0];
    if (downStat.subDrop[top.k] > 0) {
      advice.unshift("学科关注：回落学生中以「" + top.n + "」居多，建议加强该科基础巩固与限时训练");
    }
  }
  return advice;
}

/* ---------- 渲染：家长会主视图 ---------- */
function renderParentsMeeting() {
  const cfg = pmCfg();
  const week = getCurrentWeek(cfg.start);
  const snaps = pmSnaps();
  const rows = pmAllScoreRows();
  const curAnalyze = pmAnalyze(rows);
  const lastSnap = snaps.length ? snaps[snaps.length - 1] : null;
  const dataChanged = curAnalyze && (!lastSnap || pmFingerprint(rows) !== lastSnap.fp);

  let html = `
    <div class="card">
      <div class="card-title">👨‍👩‍👧 家长会 <span class="sub">每学期 3 场 · AI 议程 · 成绩分析 PPT</span>
        <button class="btn btn-ghost btn-sm" data-act="pm-cfg">⚙️ 学期设置</button>
      </div>
      <div class="meeting-sem" style="background:linear-gradient(135deg,#1F5C4D,#3E9C86);color:#fff;border-radius:12px;padding:14px 18px;margin-bottom:14px">
        <div style="font-size:16px;font-weight:700">${esc(cfg.name)} · 开学第 ${week} 周</div>
        <div style="margin-top:6px;font-size:13px;opacity:.95">📅 本学期待办家长会：<b>开学首次</b>（第1~2周）→ <b>期中</b>（期中考试后）→ <b>期末</b>（期末考试后）</div>
      </div>
      <div class="pm-grid">`;
  PM_SESSIONS.forEach(function (s) {
    html += `<div class="pm-card" data-pm-id="${s.id}" data-act="pm-open" style="--pmc:${s.color}">
        <div class="pm-top"><span class="pm-tag" style="background:${s.color}">${s.icon} ${s.tag}</span>
          <span class="pm-when">${esc(s.when)}</span></div>
        <div class="pm-title">${esc(s.title)}</div>
        <div class="pm-goal">${esc(s.goal)}</div>
        <div class="pm-foot">📋 议程 ${s.agenda.length} 项 · 📊 家长会PPT</div>
      </div>`;
  });
  html += `</div>
      <div style="margin-top:10px;font-size:12px;color:var(--ink-light)">💡 点击任意场次 → AI 议程详情（可重新生成/编辑保存）+ 一键下载家长会 PPT / 打印幻灯片。</div>
    </div>

    <div class="card">
      <div class="card-title">📊 成绩分析 PPT <span class="sub">只展示正向数据与表扬名单 · 退步仅做整体分析（不点名）</span>
        <button class="btn btn-primary btn-sm" data-act="pm-snap-save">📸 保存本次成绩快照</button>
      </div>
      <div class="pm-hint" style="border:1px solid #D9E4DD;background:#F2F8F5;color:#2D6A4F;border-radius:8px;padding:8px 12px;font-size:12.5px;margin-bottom:10px">🛡️ 生成规则：PPT 中前十名 / 进步榜 / 全勤之星可显示姓名表扬；退步信息仅以整体数据呈现（人数、幅度、学科分布），不出现学生姓名，并附改进建议与实施策略步骤。</div>
      ${dataChanged ? `<div class="pm-hint" style="border:1px solid #E8C9A0;background:#FDF6EC;color:#8a6d3b;border-radius:8px;padding:8px 12px;font-size:12.5px;margin-bottom:10px">📌 检测到成绩数据有变化，建议先「📸 保存本次成绩快照」，再生成最新成绩分析 PPT。</div>` : ""}
      ${curAnalyze ? `<div class="pm-cur">
        <div class="pm-cur-stat"><div class="pcs-num">${esc(curAnalyze.avgTotal.toFixed(1))}</div><div class="pcs-lb">班级平均总分</div></div>
        <div class="pm-cur-stat"><div class="pcs-num">${curAnalyze.passRate}%</div><div class="pcs-lb">及格率</div></div>
        <div class="pm-cur-stat"><div class="pcs-num">${curAnalyze.goodRate}%</div><div class="pcs-lb">优良率</div></div>
        <div class="pm-cur-stat"><div class="pcs-num">${curAnalyze.n}</div><div class="pcs-lb">参考人数</div></div>
      </div>
      <div style="font-size:12px;color:var(--ink-light);margin-top:8px">语文 ${curAnalyze.avgChinese.toFixed(1)} · 数学 ${curAnalyze.avgMath.toFixed(1)} · 英语 ${curAnalyze.avgEnglish.toFixed(1)} · 最高 ${curAnalyze.maxTotal} · 最低 ${curAnalyze.minTotal}</div>` : `<div class="empty">暂无成绩数据——请先在「学生信息 → 花名册」导入成绩</div>`}
      ${snaps.length ? `<div style="margin-top:12px;font-size:13px;font-weight:700;color:var(--green-700)">🕐 成绩快照（${snaps.length} 份）</div>
      <div class="pm-snaps">${snaps.slice().reverse().map(function (sn) {
        return `<div class="pm-snap"><div class="psn-info"><b>${esc(sn.label)}</b><span class="psn-date">${esc(sn.date)}</span></div>
          <div class="psn-ops">
            <button class="btn btn-primary btn-sm" data-act="pm-snap-ppt" data-sid="${sn.id}">📈 生成成绩分析PPT</button>
            <button class="btn btn-ghost btn-sm" data-act="pm-snap-del" data-sid="${sn.id}">🗑️</button>
          </div></div>`;
      }).join("")}</div>` : ""}
    </div>`;
  return html;
}

/* 成绩数据指纹：判断是否与最近快照一致 */
function pmFingerprint(rows) {
  return rows.map(function (r) { return r.cls + r.name + r.total; }).join("|");
}

/* 保存成绩快照 */
function pmSaveSnap(label) {
  const rows = pmAllScoreRows();
  if (!rows.length) { toast("⚠️ 暂无成绩数据，请先导入成绩"); return; }
  const snaps = pmSnaps();
  snaps.push({
    id: "sn" + Date.now(),
    label: label || ("成绩快照 " + (snaps.length + 1)),
    date: Today.now(),
    fp: pmFingerprint(rows),
    rows: rows
  });
  Store.set("parentScoreSnaps", snaps);
}

/* ---------- 家长会备课弹窗 ---------- */
function openPM(sessionId) {
  const session = pmSessionById(sessionId);
  const notes = pmNotes()[sessionId] || null;
  const agenda = notes && notes.agenda ? notes.agenda : session.agenda;
  const customTxt = notes && notes.custom ? notes.custom : null;
  const planTxt = customTxt || pmPlanText(session, agenda);
  const slides = pmBuildSlides(session, agenda);
  const slidesHtml = slides.map(function (s, i) {
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
          <span class="pm-tag" style="background:${session.color}">${session.icon} ${session.tag}家长会</span>
          <span class="pm-when">${esc(session.when)}</span>
          <b style="font-size:16px;color:var(--green-900)">${esc(session.title)}</b>
        </div>
        <div style="margin-top:6px;font-size:13px;color:var(--ink)">🎯 目标：${esc(session.goal)}</div>
      </div>
      <div class="mm-tabs">
        <button class="btn btn-ghost btn-sm active" data-act="pm-tab" data-tab="plan">📋 AI 议程</button>
        <button class="btn btn-ghost btn-sm" data-act="pm-tab" data-tab="slides">🎞️ 幻灯片预览（${slides.length}页）</button>
      </div>
      <div class="mm-body" id="pmBody">
        <div class="mm-pane" data-pane="plan"><pre class="meet-plan" id="pmPlanTxt">${esc(planTxt)}</pre></div>
        <div class="mm-pane" data-pane="slides" style="display:none"><div class="meet-slides">${slidesHtml}</div></div>
      </div>
      <div class="mm-actions">
        <button class="btn btn-primary btn-sm" data-act="pm-copy">📋 复制议程</button>
        <button class="btn btn-ghost btn-sm" data-act="pm-ai">🤖 AI 重新生成</button>
        <button class="btn btn-ghost btn-sm" data-act="pm-edit">✍️ 编辑议程</button>
        <button class="btn btn-ghost btn-sm" data-act="pm-ppt">📊 下载家长会PPT</button>
        <button class="btn btn-ghost btn-sm" data-act="pm-print">🖨️ 打印幻灯片</button>
      </div>
    </div>`, "👨‍👩‍👧 " + session.tag + "家长会 · " + session.title);
  const body = document.getElementById("pmBody");
  body.querySelectorAll("[data-act=pm-tab]").forEach(function (b) {
    b.onclick = function () {
      body.querySelectorAll("[data-act=pm-tab]").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      body.querySelectorAll(".mm-pane").forEach(function (p) { p.style.display = "none"; });
      body.querySelector("[data-pane=" + b.dataset.tab + "]").style.display = "";
    };
  });
  body.querySelector("[data-act=pm-copy]").onclick = async function () {
    const txt = document.getElementById("pmPlanTxt").textContent;
    try { await navigator.clipboard.writeText(txt); toast("📋 议程已复制，可直接粘贴到 Word/PPT"); }
    catch (e) { prompt("请手动复制：", txt); }
  };
  body.querySelector("[data-act=pm-ai]").onclick = function () {
    const np = pmRegenerate(session);
    const notes = pmNotes();
    notes[sessionId] = { agenda: np, custom: null };
    Store.set("parentNotes", notes);
    document.getElementById("pmPlanTxt").textContent = pmPlanText(session, np);
    toast("🤖 AI 已生成新议程并保存，可继续编辑");
  };
  body.querySelector("[data-act=pm-edit]").onclick = function () {
    const cur = document.getElementById("pmPlanTxt").textContent;
    openModal('<textarea id="inpPmEdit" style="width:100%;height:340px;font-size:13px;line-height:1.8;padding:10px;border:1px solid var(--line);border-radius:8px;box-sizing:border-box">' + esc(cur) + '</textarea>', "✍️ 编辑议程（保存后展示此版）");
    document.querySelector("[data-act=modal-ok]").onclick = function () {
      const notes = pmNotes();
      notes[sessionId] = { agenda: null, custom: document.getElementById("inpPmEdit").value };
      Store.set("parentNotes", notes);
      closeModal();
      document.getElementById("pmPlanTxt").textContent = notes[sessionId].custom;
      toast("✅ 议程已保存");
    };
  };
  body.querySelector("[data-act=pm-ppt]").onclick = function () { downloadPMPPT(session); };
  body.querySelector("[data-act=pm-print]").onclick = function () { printPMSlides(session); };
  const ok = document.querySelector("[data-act=modal-ok]");
  if (ok) ok.onclick = closeModal;
}

/* ---------- 家长会 PPT（议程内容） ---------- */
function downloadPMPPT(session) {
  loadPptxGen(function () {
    try {
      const notes = pmNotes()[session.id] || null;
      const agenda = notes && notes.agenda ? notes.agenda : session.agenda;
      const slides = pmBuildSlides(session, agenda);
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "WIDE", width: 10, height: 5.625 });
      pptx.layout = "WIDE";
      const GREEN = "1F5C4D", GOLD = "D9A441", WHITE = "FFFFFF", INK = "33443F";
      let slide = pptx.addSlide();
      slide.background = { color: GREEN };
      slide.addText("啊敏的兵 · " + session.tag + "家长会", { x: 0.5, y: 0.4, w: 9, h: 0.5, fontSize: 12, color: "BFE3D5", align: "left", fontFace: "Microsoft YaHei" });
      slide.addText(session.title, { x: 0.5, y: 1.5, w: 9, h: 1.3, fontSize: 34, bold: true, color: WHITE, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText(session.tag + " · " + pmCfg().name, { x: 0.5, y: 3.1, w: 9, h: 0.6, fontSize: 16, color: GOLD, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText(session.goal, { x: 0.8, y: 3.9, w: 8.4, h: 1.1, fontSize: 11, color: "BFE3D5", align: "center", fontFace: "Microsoft YaHei" });
      slides.forEach(function (s) {
        slide = pptx.addSlide();
        slide.background = { color: WHITE };
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
        slide.addText(s.t, { x: 0.6, y: 0.35, w: 8.8, h: 0.9, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
        slide.addText(s.sub || "", { x: 0.6, y: 1.15, w: 8.8, h: 0.4, fontSize: 12, color: "8A9A93", fontFace: "Microsoft YaHei" });
        s.points.forEach(function (p, pi) {
          slide.addText("•  " + p, { x: 0.9, y: 1.9 + pi * 0.72, w: 8.2, h: 0.62, fontSize: 15, color: INK, fontFace: "Microsoft YaHei" });
        });
        slide.addText("啊敏的兵 · " + session.title, { x: 0.6, y: 5.1, w: 8.8, h: 0.35, fontSize: 9, color: "B8C4BE", align: "right", fontFace: "Microsoft YaHei" });
      });
      slide = pptx.addSlide();
      slide.background = { color: GREEN };
      slide.addText("家校同心 · 静待花开", { x: 0.5, y: 2.0, w: 9, h: 1.2, fontSize: 28, bold: true, color: WHITE, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText("感谢各位家长的到来与信任", { x: 0.8, y: 3.4, w: 8.4, h: 0.8, fontSize: 14, color: GOLD, align: "center", fontFace: "Microsoft YaHei" });
      pptx.writeFile({ fileName: "家长会_" + session.tag + "_" + session.title + ".pptx" });
      toast("✅ 家长会 PPT 已生成并下载");
    } catch (e) { toast("⚠️ PPT 生成失败：" + e.message); }
  });
}

/* 打印家长会幻灯片（新窗口，可打印为 PDF） */
function printPMSlides(session) {
  const notes = pmNotes()[session.id] || null;
  const agenda = notes && notes.agenda ? notes.agenda : session.agenda;
  const slides = pmBuildSlides(session, agenda);
  const w = window.open("", "_blank");
  if (!w) { toast("⚠️ 请允许弹出窗口"); return; }
  const slidesHtml = slides.map(function (s, i) {
    return `
    <div class="ps-slide">
      <div class="ps-head"><span>啊敏的兵 · ${session.tag}家长会</span><span>第 ${i + 1} / ${slides.length} 页</span></div>
      <div class="ps-body">
        <div class="ps-title">${esc(s.t)}</div>
        <div class="ps-sub">${esc(s.sub || "")}</div>
        <ul>${s.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("")}</ul>
      </div>
      <div class="ps-foot">${esc(session.title)}</div>
    </div>`;
  }).join("");
  w.document.write('<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
    "<title>家长会_" + esc(session.title) + "</title>" +
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
    '<div style="color:#BFE3D5;font-size:14px">啊敏的兵 · ' + session.tag + '家长会 · ' + esc(pmCfg().name) + '</div>' +
    '<div style="color:#fff;font-size:40px;font-weight:700;margin:16px 0">' + esc(session.title) + '</div>' +
    '<div style="color:#D9A441;font-size:18px">' + esc(session.when) + '</div>' +
    '<div style="color:#BFE3D5;font-size:13px;margin-top:20px;padding:0 80px">' + esc(session.goal) + '</div></div>' +
    slidesHtml +
    '<div class="ps-slide" style="background:#1F5C4D;justify-content:center;align-items:center;text-align:center">' +
    '<div style="color:#fff;font-size:34px;font-weight:700">家校同心 · 静待花开</div>' +
    '<div style="color:#D9A441;font-size:16px;margin-top:16px">感谢各位家长的到来与信任</div></div>' +
    "</body></html>");
  w.document.close();
  w.focus();
  setTimeout(function () { try { w.print(); } catch (e) {} }, 400);
}

/* ---------- 成绩分析 PPT ---------- */
function downloadScorePPT(snap) {
  loadPptxGen(function () {
    try {
      const rows = snap.rows;
      const st = pmAnalyze(rows);
      if (!st) { toast("⚠️ 该快照无成绩数据"); return; }
      const hasMulti = (function () {
        const cls = {};
        rows.forEach(function (r) { cls[r.cls] = true; });
        return Object.keys(cls).length > 1;
      })();
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "WIDE", width: 10, height: 5.625 });
      pptx.layout = "WIDE";
      const GREEN = "1F5C4D", GOLD = "D9A441", WHITE = "FFFFFF", INK = "33443F", LIGHT = "8A9A93";
      let slide;

      /* 封面 */
      slide = pptx.addSlide();
      slide.background = { color: GREEN };
      slide.addText("啊敏的兵 · 家长会", { x: 0.5, y: 0.4, w: 9, h: 0.5, fontSize: 12, color: "BFE3D5", align: "left", fontFace: "Microsoft YaHei" });
      slide.addText("学生成绩分析报告", { x: 0.5, y: 1.6, w: 9, h: 1.2, fontSize: 36, bold: true, color: WHITE, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText(snap.label + " · " + snap.date, { x: 0.5, y: 3.2, w: 9, h: 0.6, fontSize: 16, color: GOLD, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText(hasMulti ? "多班对比 · 数据仅供家长参考，请理性看待分数" : "数据仅供家长参考，请理性看待分数、关注成长", { x: 0.8, y: 4.0, w: 8.4, h: 0.8, fontSize: 11, color: "BFE3D5", align: "center", fontFace: "Microsoft YaHei" });

      /* 班级整体概况 */
      slide = pptx.addSlide();
      slide.background = { color: WHITE };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
      slide.addText("班级整体概况", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
      const cards = [
        { n: st.avgTotal.toFixed(1), l: "平均总分" }, { n: st.passRate + "%", l: "及格率" },
        { n: st.goodRate + "%", l: "优良率" }, { n: st.n + " 人", l: "参考人数" },
        { n: st.maxTotal, l: "最高分" }, { n: st.minTotal, l: "最低分" }
      ];
      cards.forEach(function (c, i) {
        const col = i % 3, row = Math.floor(i / 3);
        slide.addShape(pptx.ShapeType.roundRect, { x: 0.7 + col * 2.95, y: 1.4 + row * 1.9, w: 2.65, h: 1.6, fill: { color: row === 0 ? "E7F1EC" : "F7F5EE" }, rectRadius: 0.08 });
        slide.addText(String(c.n), { x: 0.7 + col * 2.95, y: 1.75 + row * 1.9, w: 2.65, h: 0.7, fontSize: 26, bold: true, color: GREEN, align: "center", fontFace: "Microsoft YaHei" });
        slide.addText(c.l, { x: 0.7 + col * 2.95, y: 2.55 + row * 1.9, w: 2.65, h: 0.35, fontSize: 12, color: LIGHT, align: "center", fontFace: "Microsoft YaHei" });
      });
      slide.addText("参考人数：考试有成绩记录的学生数", { x: 0.6, y: 5.15, w: 8.8, h: 0.3, fontSize: 9, color: "B8C4BE", align: "right", fontFace: "Microsoft YaHei" });

      /* 各科平均分 */
      slide = pptx.addSlide();
      slide.background = { color: WHITE };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
      slide.addText("各科平均分对比", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
      const subs = [
        { n: "语文", v: st.avgChinese }, { n: "数学", v: st.avgMath }, { n: "英语", v: st.avgEnglish }
      ];
      const maxSub = Math.max(st.avgChinese, st.avgMath, st.avgEnglish, 1);
      subs.forEach(function (s, i) {
        slide.addText(s.n, { x: 1.0, y: 1.6 + i * 1.2, w: 1.2, h: 0.6, fontSize: 18, bold: true, color: INK, fontFace: "Microsoft YaHei" });
        slide.addShape(pptx.ShapeType.roundRect, { x: 2.3, y: 1.7 + i * 1.2, w: 4.4 * (s.v / maxSub), h: 0.5, fill: { color: i === 0 ? "3E9C86" : i === 1 ? "5B8DC0" : "D9A441" }, rectRadius: 0.25 });
        slide.addText(s.v.toFixed(1), { x: 7.0, y: 1.6 + i * 1.2, w: 1.5, h: 0.6, fontSize: 20, bold: true, color: GREEN, align: "right", fontFace: "Microsoft YaHei" });
      });
      slide.addText("平均分反映班级整体水平，可结合分数段分布判断学科强弱", { x: 0.6, y: 5.1, w: 8.8, h: 0.3, fontSize: 9, color: "B8C4BE", align: "right", fontFace: "Microsoft YaHei" });

      /* 分数段分布 */
      slide = pptx.addSlide();
      slide.background = { color: WHITE };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
      slide.addText("分数段分布", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
      slide.addText("按总分位次划分：A 优秀（前 15%） · B 良好（15%~30%） · C 中等（30%~50%） · D 待提升（后 50%）", { x: 0.6, y: 1.05, w: 8.8, h: 0.35, fontSize: 11, color: LIGHT, fontFace: "Microsoft YaHei" });
      const dist = [
        { g: "A · 优秀", v: st.dist.A, c: "3E9C86" }, { g: "B · 良好", v: st.dist.B, c: "5B8DC0" },
        { g: "C · 中等", v: st.dist.C, c: "D9A441" }, { g: "D · 待提升", v: st.dist.D, c: "E8835A" }
      ];
      const maxD = Math.max(st.dist.A, st.dist.B, st.dist.C, st.dist.D, 1);
      dist.forEach(function (d, i) {
        const y = 1.75 + i * 0.95;
        slide.addText(d.g, { x: 0.9, y: y, w: 2.0, h: 0.5, fontSize: 14, bold: true, color: INK, fontFace: "Microsoft YaHei" });
        slide.addShape(pptx.ShapeType.roundRect, { x: 3.0, y: y + 0.05, w: 4.6 * (d.v / maxD), h: 0.42, fill: { color: d.c }, rectRadius: 0.21 });
        slide.addText(d.v + " 人 · " + (d.v / st.n * 100).toFixed(0) + "%", { x: 7.8, y: y, w: 1.6, h: 0.5, fontSize: 13, bold: true, color: GREEN, align: "right", fontFace: "Microsoft YaHei" });
      });
      slide.addText("分数段分布直观反映班级两极分化程度与整体水平", { x: 0.6, y: 5.1, w: 8.8, h: 0.3, fontSize: 9, color: "B8C4BE", align: "right", fontFace: "Microsoft YaHei" });

      /* 班级前十 */
      slide = pptx.addSlide();
      slide.background = { color: WHITE };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
      slide.addText("班级总分前十名", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
      st.top10.forEach(function (r, i) {
        const y = 1.25 + i * 0.42;
        slide.addShape(pptx.ShapeType.rect, { x: 0.7, y: y, w: 8.6, h: 0.36, fill: { color: i % 2 ? "F7F5EE" : "FFFFFF" } });
        slide.addText((i < 3 ? ["🥇", "🥈", "🥉"][i] + " " : "") + (i + 1), { x: 0.8, y: y - 0.06, w: 0.9, h: 0.4, fontSize: 12, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
        slide.addText(r.cls ? r.cls + " · " + r.name : r.name, { x: 1.8, y: y - 0.06, w: 3.5, h: 0.4, fontSize: 13, color: INK, fontFace: "Microsoft YaHei" });
        slide.addText("语文 " + (r.chinese != null ? r.chinese : "-") + "  数学 " + (r.math != null ? r.math : "-") + "  英语 " + (r.english != null ? r.english : "-"), { x: 5.3, y: y - 0.06, w: 2.6, h: 0.4, fontSize: 11, color: LIGHT, fontFace: "Microsoft YaHei" });
        slide.addText(String(r.total), { x: 8.0, y: y - 0.06, w: 1.2, h: 0.4, fontSize: 13, bold: true, color: GREEN, align: "right", fontFace: "Microsoft YaHei" });
      });
      slide.addText("姓名均为化名展示请留意；前十名单供表彰与激励参考", { x: 0.6, y: 5.1, w: 8.8, h: 0.3, fontSize: 9, color: "B8C4BE", align: "right", fontFace: "Microsoft YaHei" });

      /* 进步之星（对比上一次快照，仅表扬，显示姓名） */
      const prev = (function () {
        const snaps = pmSnaps();
        const idx = snaps.findIndex(function (s) { return s.id === snap.id; });
        return idx > 0 ? snaps[idx - 1] : null;
      })();
      const cmp = prev ? pmCompare(prev.rows, rows) : null;
      if (cmp && cmp.hasCompare && cmp.up.length) {
        slide = pptx.addSlide();
        slide.background = { color: WHITE };
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
        slide.addText("🌟 进步之星", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
        slide.addText("对比「" + prev.label + "」总分提升 Top" + cmp.up.length + " · 点滴进步都值得被看见", { x: 0.6, y: 1.05, w: 8.8, h: 0.4, fontSize: 12, color: LIGHT, fontFace: "Microsoft YaHei" });
        cmp.up.forEach(function (d, i) {
          const y = 1.6 + i * 0.42;
          slide.addShape(pptx.ShapeType.rect, { x: 0.7, y: y, w: 8.6, h: 0.36, fill: { color: i % 2 ? "F5FBF8" : "FFFFFF" } });
          slide.addText("▲ " + (i + 1), { x: 0.8, y: y - 0.05, w: 0.8, h: 0.36, fontSize: 13, bold: true, color: "3E9C86", fontFace: "Microsoft YaHei" });
          slide.addText((d.cls ? d.cls + " · " : "") + d.name, { x: 1.8, y: y - 0.05, w: 4.2, h: 0.36, fontSize: 13, bold: true, color: INK, fontFace: "Microsoft YaHei" });
          slide.addText("总分提升 +" + d.delta + " 分", { x: 6.2, y: y - 0.05, w: 3.0, h: 0.36, fontSize: 13, bold: true, color: "2D6A4F", align: "right", fontFace: "Microsoft YaHei" });
        });
        slide.addText("进步是长期坚持的结果，请家长多肯定孩子的努力与好习惯", { x: 0.6, y: 5.1, w: 8.8, h: 0.3, fontSize: 9, color: "B8C4BE", align: "right", fontFace: "Microsoft YaHei" });
      }

      /* 全勤之星（显示姓名，来自考勤记录） */
      const fullAtt = pmFullAttendance();
      const fullTotal = fullAtt.reduce(function (a, g) { return a + g.list.length; }, 0);
      if (fullTotal > 0) {
        slide = pptx.addSlide();
        slide.background = { color: WHITE };
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
        slide.addText("🎖️ 全勤之星", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
        slide.addText("已记录考勤的日期中，从未迟到 · 缺勤 · 请假，共 " + fullTotal + " 人", { x: 0.6, y: 1.05, w: 8.8, h: 0.4, fontSize: 12, color: LIGHT, fontFace: "Microsoft YaHei" });
        fullAtt.forEach(function (g, gi) {
          const y = 1.55 + gi * 0.78;
          slide.addText(g.cls, { x: 0.7, y: y, w: 1.4, h: 0.5, fontSize: 15, bold: true, color: "2D6A4F", fontFace: "Microsoft YaHei" });
          slide.addText(g.list.join("、"), { x: 2.2, y: y, w: 7.1, h: 0.65, fontSize: 12, color: INK, valign: "top", fontFace: "Microsoft YaHei" });
        });
        slide.addText("好习惯是最珍贵的成绩单，为坚持的孩子们点赞", { x: 0.6, y: 5.1, w: 8.8, h: 0.3, fontSize: 9, color: "B8C4BE", align: "right", fontFace: "Microsoft YaHei" });
      }

      /* 整体学情观察（退步仅做整体分析，绝不出现学生姓名） */
      if (cmp && cmp.downStat) {
        const ds = cmp.downStat;
        slide = pptx.addSlide();
        slide.background = { color: WHITE };
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
        slide.addText("整体学情观察（不点名）", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 22, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
        slide.addText("对比「" + prev.label + "」· 以下仅做整体数据分析，保护每一位孩子的自尊", { x: 0.6, y: 1.05, w: 8.8, h: 0.4, fontSize: 11, color: LIGHT, fontFace: "Microsoft YaHei" });
        const obs = [
          { n: ds.count + " 人", l: "总分回落人数（占可对比 " + ds.ratio + "%）" },
          { n: ds.avgDelta + " 分", l: "回落学生平均回落分数" },
          { n: ds.maxDrop + " 分", l: "单次最大回落幅度" },
          { n: "语 " + ds.subDrop.chinese + " · 数 " + ds.subDrop.math + " · 英 " + ds.subDrop.english, l: "回落学生中单科退步人数" }
        ];
        obs.forEach(function (c, i) {
          const col = i % 2, row = Math.floor(i / 2);
          slide.addShape(pptx.ShapeType.roundRect, { x: 0.7 + col * 4.5, y: 1.75 + row * 1.55, w: 4.2, h: 1.35, fill: { color: "FDF8F2" }, rectRadius: 0.08 });
          slide.addText(String(c.n), { x: 0.7 + col * 4.5, y: 2.0 + row * 1.55, w: 4.2, h: 0.55, fontSize: 20, bold: true, color: "C0665A", align: "center", fontFace: "Microsoft YaHei" });
          slide.addText(c.l, { x: 0.7 + col * 4.5, y: 2.6 + row * 1.55, w: 4.2, h: 0.4, fontSize: 10, color: LIGHT, align: "center", fontFace: "Microsoft YaHei" });
        });
        slide.addText("成绩波动是成长常态：班级已启动「同伴互助 + 教师面批」帮扶；如需了解孩子个体情况，请会后与班主任一对一沟通", { x: 0.6, y: 4.95, w: 8.8, h: 0.5, fontSize: 10, color: "7A6A50", fontFace: "Microsoft YaHei" });
      }

      /* 改进建议 */
      slide = pptx.addSlide();
      slide.background = { color: WHITE };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
      slide.addText("💡 改进建议", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
      slide.addText(cmp && cmp.downStat ? "依据整体学情，给家长的建议" : "给家长的 5 条建议", { x: 0.6, y: 1.05, w: 8.8, h: 0.4, fontSize: 12, color: LIGHT, fontFace: "Microsoft YaHei" });
      const advice = pmAdvice(cmp ? cmp.downStat : null);
      advice.forEach(function (a, i) {
        slide.addText((i + 1) + ".  " + a, { x: 0.9, y: 1.5 + i * 0.72, w: 8.2, h: 0.62, fontSize: 13.5, color: INK, fontFace: "Microsoft YaHei" });
      });

      /* 实施策略与步骤 */
      slide = pptx.addSlide();
      slide.background = { color: WHITE };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
      slide.addText("🚀 实施策略与步骤", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
      slide.addText("两条策略 · 八步行动，建议打印贴在家中最显眼处", { x: 0.6, y: 1.05, w: 8.8, h: 0.4, fontSize: 12, color: LIGHT, fontFace: "Microsoft YaHei" });
      PM_ACTION_PLAN.forEach(function (p, pi) {
        const x = 0.6 + pi * 4.55;
        slide.addShape(pptx.ShapeType.roundRect, { x: x, y: 1.5, w: 4.3, h: 3.55, fill: { color: pi === 0 ? "E7F1EC" : "F7F5EE" }, rectRadius: 0.1 });
        slide.addText(p.t, { x: x + 0.25, y: 1.62, w: 3.8, h: 0.5, fontSize: 14, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
        slide.addText(p.desc, { x: x + 0.25, y: 2.15, w: 3.8, h: 0.35, fontSize: 10, color: LIGHT, fontFace: "Microsoft YaHei" });
        p.steps.forEach(function (s, si) {
          slide.addText((si + 1) + ". " + s, { x: x + 0.25, y: 2.55 + si * 0.62, w: 3.85, h: 0.58, fontSize: 9.5, color: INK, valign: "top", fontFace: "Microsoft YaHei" });
        });
      });
      slide.addText("教育是一场温柔的坚持：家校同频，孩子才能走得稳、走得远", { x: 0.6, y: 5.1, w: 8.8, h: 0.3, fontSize: 9, color: "B8C4BE", align: "right", fontFace: "Microsoft YaHei" });

      /* 尾页 */
      slide = pptx.addSlide();
      slide.background = { color: GREEN };
      slide.addText("家校同心 · 静待花开", { x: 0.5, y: 2.0, w: 9, h: 1.2, fontSize: 28, bold: true, color: WHITE, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText("每一个孩子都值得被看见 · " + snap.label, { x: 0.8, y: 3.4, w: 8.4, h: 0.8, fontSize: 14, color: GOLD, align: "center", fontFace: "Microsoft YaHei" });

      pptx.writeFile({ fileName: "成绩分析PPT_" + snap.label + ".pptx" });
      toast("✅ 成绩分析 PPT 已生成并下载");
    } catch (e) { toast("⚠️ 成绩 PPT 生成失败：" + e.message); }
  });
}

/* ---------- 事件绑定 ---------- */
function bindParentsMeetingEvents() {
  const body = document.getElementById("classTabBody");
  if (!body) return;

  body.querySelectorAll("[data-act=pm-open]").forEach(function (card) {
    card.onclick = function () { openPM(card.dataset.pmId); };
  });

  body.querySelector("[data-act=pm-cfg]")?.addEventListener("click", function () {
    const cfg = pmCfg();
    openModal('<label style="font-size:13px;color:var(--ink-light)">学期名称</label>' +
      '<input class="inp" id="inpPmName" value="' + esc(cfg.name) + '" style="margin-bottom:10px">' +
      '<label style="font-size:13px;color:var(--ink-light)">开学日期（用于计算第几周）</label>' +
      '<input class="inp" id="inpPmStart" type="date" value="' + esc(cfg.start) + '">', "⚙️ 家长会学期设置");
    document.querySelector("[data-act=modal-ok]").onclick = function () {
      const nc = {
        name: document.getElementById("inpPmName").value.trim() || "2026 秋季学期",
        start: document.getElementById("inpPmStart").value || "2026-09-01"
      };
      Store.set("parentCfg", nc);
      closeModal();
      body.innerHTML = renderParentsMeeting();
      bindParentsMeetingEvents();
      toast("✅ 学期设置已保存");
    };
  });

  body.querySelector("[data-act=pm-snap-save]")?.addEventListener("click", function () {
    const rows = pmAllScoreRows();
    if (!rows.length) { toast("⚠️ 暂无成绩数据，请先导入成绩"); return; }
    openModal('<label style="font-size:13px;color:var(--ink-light)">本次考试名称（如：期中考试 / 期末联考）</label>' +
      '<input class="inp" id="inpPmSnap" placeholder="期中考试" value="' + esc(pmSnaps().length === 0 ? "期中考试" : "期末考试") + '">' +
      '<p style="font-size:12px;color:var(--ink-light);margin-top:8px">将保存当前 ' + rows.length + ' 人成绩。生成 PPT 时：前十名/进步榜/全勤之星显示姓名表扬，退步仅做整体分析不点名，并自动附改进建议与实施策略步骤。</p>', "📸 保存成绩快照");
    document.querySelector("[data-act=modal-ok]").onclick = function () {
      const label = document.getElementById("inpPmSnap").value.trim() || ("成绩快照 " + (pmSnaps().length + 1));
      pmSaveSnap(label);
      closeModal();
      body.innerHTML = renderParentsMeeting();
      bindParentsMeetingEvents();
      toast("✅ 成绩快照已保存，可一键生成成绩分析 PPT");
    };
  });

  body.querySelectorAll("[data-act=pm-snap-ppt]").forEach(function (btn) {
    btn.onclick = function () {
      const snap = pmSnaps().find(function (s) { return s.id === btn.dataset.sid; });
      if (snap) downloadScorePPT(snap);
      else toast("⚠️ 快照不存在");
    };
  });

  body.querySelectorAll("[data-act=pm-snap-del]").forEach(function (btn) {
    btn.onclick = function () {
      if (!confirm("确定删除这份成绩快照？\n\n历史数据保险库中仍可找回，请放心。")) return;
      const snaps = pmSnaps().filter(function (s) { return s.id !== btn.dataset.sid; });
      Store.set("parentScoreSnaps", snaps);
      body.innerHTML = renderParentsMeeting();
      bindParentsMeetingEvents();
      toast("🗑️ 快照已删除（保险库可找回）");
    };
  });
}
