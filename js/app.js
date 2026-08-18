/* =========================================================
   主应用 · 侧边栏 / 路由 / 每日打勾 / 全局事件
   ========================================================= */

/* ---------- 内置任务子菜单（侧边栏下拉快速定位） ---------- */
const TASK_SUB = {
  daily: [
    { key: "todos", name: "今日清单", ico: "✅" },
    { key: "cat", name: "养小猫", ico: "🐱" }
  ],
  retirement: [
    { key: "countdown", name: "续命倒计时", ico: "🧘" },
    { key: "calendar", name: "学校校历", ico: "📅" },
    { key: "timetable", name: "作息课程表", ico: "⏰" },
    { key: "quad", name: "四象限待办", ico: "🗂️" },
    { key: "cat", name: "养小猫", ico: "🐱" }
  ],
  timetable: [
    { key: "home", name: "班主任课表", ico: "🏠" },
    { key: "subject", name: "科任课表", ico: "📖" },
    { key: "temp", name: "临时换课", ico: "🔁" }
  ],
  lesson: [{ key: "links", name: "快捷链接", ico: "🔗" }],
  class: [
    { key: "timetable", name: "班级课程表", ico: "⏰" },
    { key: "attendance", name: "考勤记录", ico: "📋" },
    { key: "decibel", name: "早读分贝", ico: "📢" },
    { key: "bottle", name: "心愿瓶", ico: "🍯" },
    { key: "coupon", name: "奖券打印", ico: "🎟️" },
    { key: "seats-edit", name: "座位表编辑", ico: "🪑" },
    { key: "seats-ai", name: "AI自动排座", ico: "🤖" },
    { key: "duty", name: "值日表", ico: "🧹" },
    { key: "committee", name: "班委分工", ico: "👥" },
    { key: "parent", name: "家长联系", ico: "📞" },
    { key: "ledger", name: "学生台账", ico: "📓" },
    { key: "score", name: "小组积分", ico: "⭐" },
    { key: "meeting", name: "每周班会", ico: "🎤" },
    { key: "parentsmeeting", name: "家长会", ico: "👨‍👩‍👧" }
  ],
  homework: [
    { key: "hw", name: "作业登记", ico: "📚" },
    { key: "board", name: "统计看板", ico: "📊" },
    { key: "recite", name: "背书登记", ico: "📖" },
    { key: "dict", name: "默写登记", ico: "✍️" },
    { key: "quote", name: "每日金句", ico: "💬" }
  ],
  student: [
    { key: "roster", name: "学生花名册", ico: "📋" },
    { key: "profile", name: "学生个人档案", ico: "📁" },
    { key: "io", name: "信息导入导出", ico: "📦" },
    { key: "report", name: "个人报告导出", ico: "📄" },
    { key: "rank", name: "个人排名", ico: "🏆" }
  ],
  comm: [
    { key: "reply", name: "高情商回复", ico: "🤖" },
    { key: "quick", name: "快速写", ico: "✍️" },
    { key: "notice", name: "班级通知", ico: "📣" },
    { key: "records", name: "沟通记录", ico: "📇" }
  ],
  honor: [
    { key: "add", name: "登记荣誉", ico: "➕" },
    { key: "album", name: "荣誉手账", ico: "📖" }
  ],
  ideas: [
    { key: "manage", name: "管理小妙招", ico: "💡" },
    { key: "essay", name: "班级小随笔", ico: "✍️" },
    { key: "paper", name: "论文小火花", ico: "🔥" }
  ],
  study: [
    { key: "create", name: "记录讲座", ico: "🎙️" },
    { key: "notes", name: "学习笔记库", ico: "🗃️" }
  ],
  vault: [
    { key: "overview", name: "数据总览", ico: "📊" },
    { key: "snap", name: "历史快照", ico: "🕐" }
  ],
  monthly: [
    { key: "report", name: "本月小结", ico: "📆" },
    { key: "history", name: "历史回顾", ico: "🗂️" }
  ],
  grade: [
    { key: "input", name: "各科录入", ico: "📝" },
    { key: "single", name: "单次分析", ico: "📊" },
    { key: "trend", name: "个人趋势", ico: "📈" },
    { key: "compare", name: "进退步分析", ico: "🔁" },
    { key: "daofa", name: "道法科任分析", ico: "📖" }
  ],
  discipline: [
    { key: "list", name: "违纪记录", ico: "📋" }
  ],
  leave: [
    { key: "list", name: "请假记录", ico: "📋" }
  ]
};

/* 任务悬停小标签描述 */
const TASK_TIP = {
  daily: "今日待办 · 首页看板",
  student: "花名册 · 个人档案 · 导入导出 · 报告 · 排名",
  grade: "班主任三科分析 · 道法5班成绩 · 趋势 · 进退步",
  discipline: "违纪记录 · 统计 · 导出",
  homework: "作业登记 · 统计看板 · 背书默写 · 金句",
  leave: "请假登记 · 统计 · 导出Excel",
  class: "座位编辑/AI排座 · 考勤 · 班会/家长会AI备课",
  retirement: "续命倒计时 · 校历 · 四象限 · 小猫",
  timetable: "班主任/科任课表 · 临时换课",
  lesson: "备课链接一键直达",
  comm: "高情商回复 · 班级通知",
  honor: "荣誉登记 · 标本手账",
  ideas: "随手记录 · 管理妙招/随笔/论文火花",
  study: "讲座AI笔记 · 思维导图 · 核心内容",
  vault: "自动快照 · 全量备份 · 永不丢失",
  monthly: "照片上传 · AI四板块汇总 · 家长版PPT"
};

/* ---------- 今日待办模块（模块0） ---------- */
registerModule("daily", {
  title: "🏠 今日待办",
  sub: "每日任务清单 · 打勾打卡",
  render() {
    const todos = Store.get("dailyTodos", defaultDailyTodos());
    const done = Store.get("dailyDone", {});
    const today = Today.now();
    const list = done[today] || [];
    const checkedCount = list.filter(x => x).length;
    let html = `
    <div class="mv-header"><h2 class="mv-title">🏠 今日待办</h2>
      <p class="mv-sub">${today} · 已完成 ${checkedCount} / ${todos.length}</p></div>
    ${modToolbar("今日待办")}
    <div class="daily-checkbar">
      <div class="dp-bar" style="flex:1;background:#E2EBE4"><div class="dp-bar-inner" style="width:${todos.length ? checkedCount / todos.length * 100 : 0}%"></div></div>
      <span style="font-size:12px;color:var(--ink-light)">${Math.round(todos.length ? checkedCount / todos.length * 100 : 0)}%</span>
    </div>
    <div class="card" id="sub-todos">
      <div class="card-title">✅ 每日清单
        <button class="btn btn-primary btn-sm" data-act="todo-add">＋ 添加任务</button>
        <button class="btn btn-ghost btn-sm" data-act="todo-reset">重置今日</button>
      </div>
      <div id="todoList">
        ${todos.map((t, i) => `
        <div class="score-row" style="cursor:pointer" data-todo-item data-i="${i}">
          <span style="font-size:16px">${esc(t.ico)}</span>
          <label style="flex:1;display:flex;align-items:center;gap:10px;cursor:pointer">
            <input type="checkbox" data-act="todo-check" data-i="${i}" ${list[i] ? "checked" : ""} style="width:17px;height:17px;accent-color:var(--green-600)">
            <span style="${list[i] ? "text-decoration:line-through;color:#9AA8A0" : "font-weight:600"}">${esc(t.name)}</span>
          </label>
          <button class="btn btn-danger btn-sm" data-act="todo-del" data-i="${i}">✕</button>
        </div>`).join("")}
      </div>
      <div style="margin-top:10px;font-size:12px;color:var(--ink-light)">💡 每完成一项都会给小猫喂经验值哦（+5XP）</div>
    </div>
    <div class="card" id="sub-cat">
      <div class="card-title">🐱 今日小猫动态</div>
      <div class="cat-area" id="dailyCat">${renderMiniCat()}</div>
    </div>`;
    return html;
  },
  after() {
    const todos = Store.get("dailyTodos", defaultDailyTodos());
    const done = Store.get("dailyDone", {});
    const today = Today.now();
    const list = done[today] || [];
    document.querySelectorAll("[data-act=todo-check]").forEach(cb => {
      cb.onchange = () => {
        const i = +cb.dataset.i;
        list[i] = cb.checked;
        done[today] = list;
        Store.set("dailyDone", done);
        if (cb.checked) {
          addCatXp(5);
          toast("✅ 完成！小猫 +5XP");
        }
        const view = document.getElementById("moduleView");
        view.innerHTML = Modules.daily.render();
        Modules.daily.after();
        renderSidebar();
      };
    });
    document.querySelector("[data-act=todo-add]")?.addEventListener("click", () => {
      openModal(`<input class="inp" id="inpTodoName" placeholder="任务名称" style="margin-bottom:8px">
        <input class="inp" id="inpTodoIco" placeholder="图标（emoji，如 📖）" maxlength="4">`, "添加每日任务");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const name = document.getElementById("inpTodoName").value.trim();
        if (name) {
          const todos2 = Store.get("dailyTodos", defaultDailyTodos());
          todos2.push({ id: uid(), name, ico: document.getElementById("inpTodoIco").value.trim() || "✅" });
          Store.set("dailyTodos", todos2);
          const done2 = Store.get("dailyDone", {});
          done2[today] = done2[today] || [];
          done2[today].push(false);
          Store.set("dailyDone", done2);
        }
        closeModal();
        const view = document.getElementById("moduleView");
        view.innerHTML = Modules.daily.render();
        Modules.daily.after();
        renderSidebar();
      };
    });
    document.querySelector("[data-act=todo-del]")?.addEventListener("click", (e) => {
      const i = +e.target.dataset.i;
      const todos2 = Store.get("dailyTodos", defaultDailyTodos());
      todos2.splice(i, 1);
      Store.set("dailyTodos", todos2);
      const done2 = Store.get("dailyDone", {});
      done2[today] = done2[today] || [];
      done2[today].splice(i, 1);
      Store.set("dailyDone", done2);
      const view = document.getElementById("moduleView");
      view.innerHTML = Modules.daily.render();
      Modules.daily.after();
      renderSidebar();
    });
    document.querySelector("[data-act=todo-reset]")?.addEventListener("click", () => {
      done[today] = [];
      Store.set("dailyDone", done);
      const view = document.getElementById("moduleView");
      view.innerHTML = Modules.daily.render();
      Modules.daily.after();
      renderSidebar();
      toast("今日清单已重置");
    });
  }
});

function renderMiniCat() {
  const cat = Store.get("cat", defaultCat());
  const catLevels = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
  const curLevel = catLevels.indexOf(Math.max(...catLevels.filter(v => v <= cat.xp)));
  const level = curLevel === -1 ? 1 : curLevel + 1;
  const catEmojis = ["🐣", "🐥", "🐱", "🐈", "😺", "😸", "😻", "🐆", "🦁", "🐯"];
  return `<div class="cat-box">
    <span class="cat-emoji">${catEmojis[level - 1] || "🐯"}</span>
    <div class="cat-name">${esc(cat.name)} Lv.${level}</div>
    <div class="cat-xp">经验 ${cat.xp}</div>
    <div class="cat-stats"><span>🍖 喂食 ${cat.fed}</span><span>✋ 摸摸 ${cat.pet}</span></div>
  </div>`;
}

function addCatXp(n) {
  const cat = Store.get("cat", defaultCat());
  cat.xp += n;
  Store.set("cat", cat);
}

/* =========================================================
   首页看板模块（今日待办 · 考勤统计 · 倒计时 · 治愈文案）
   ========================================================= */
registerModule("dashboard", {
  title: "🏠 今日待办",
  sub: "首页看板 · 今日一览",
  render() {
    const today = Today.now();
    const now = new Date();
    const week = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];
    const weekNo = getWeekOfSemester(now);
    const mot = getDailyMotivation(now);
    const quote = getDailyQuotes(now)[0];
    const stats = getAttendanceStats();
    const todoList = getTodayTodoList();
    const doneMap = getTodayDoneMap(todoList);
    const checkedCount = todoList.filter(t => doneMap[t.id]).length;
    const pct = todoList.length ? Math.round(checkedCount / todoList.length * 100) : 0;
    const countdown = getCountdown();
    const extra = getDashboardExtraStats();

    return `
    <div class="mv-header">
      <h2 class="mv-title">🏠 今日待办 <span style="font-size:13px;color:var(--ink-light);font-weight:400">首页看板 · 一眼掌握全天</span></h2>
      <p class="mv-sub">${today} 周${week} · 本学期第 ${weekNo} 周</p>
    </div>
    ${modToolbar("今日待办")}

    <!-- 英雄区：日期 + 治愈文案 -->
    <div class="dash-hero">
      <div class="dh-date">📅 ${today} · 周${week} · 本学期第${weekNo}周</div>
      <h2>${now.getMonth() + 1}月${now.getDate()}日，${isWeekendToday() ? "周末快乐！好好休息" : "又是元气满满的一天"}</h2>
      <div class="dh-mot">“${esc(mot)}”</div>
      <div class="dh-progress">
        <div class="dp-head"><span>📌 今日待办完成进度</span><span>${checkedCount}/${todoList.length} · ${pct}%</span></div>
        <div class="dp-bar" style="background:rgba(255,255,255,.22)"><div class="dp-bar-inner" style="width:${pct}%"></div></div>
      </div>
    </div>

    ${renderBirthdayCard()}

    <!-- 考勤统计：让班主任一目了然 -->
    <div class="dash-stats">
      <div class="dash-stat s-total"><div class="ds-ico">👥</div><div class="ds-num">${stats.total}<small> 人</small></div><div class="ds-label">全班人数</div></div>
      <div class="dash-stat s-present"><div class="ds-ico">✅</div><div class="ds-num">${stats.present}<small> 人</small></div><div class="ds-label">今日出勤</div></div>
      <div class="dash-stat s-late"><div class="ds-ico">⏰</div><div class="ds-num">${stats.late}<small> 人</small></div><div class="ds-label">迟到</div></div>
      <div class="dash-stat s-leave"><div class="ds-ico">🏖️</div><div class="ds-num">${stats.leave}<small> 人</small></div><div class="ds-label">请假</div></div>
      <div class="dash-stat s-absent"><div class="ds-ico">⚠️</div><div class="ds-num">${stats.absent}<small> 人</small></div><div class="ds-label">缺勤</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin:-8px 0 18px;background:var(--white);border:1px solid var(--line);border-radius:12px;padding:10px 16px">
      <span style="font-size:12.5px;color:var(--ink-light)">📊 今日出勤率：</span>
      <div class="dp-bar" style="flex:1;background:#E2EBE4"><div class="dp-bar-inner" style="width:${stats.rate}%;${stats.rate < 90 ? "background:linear-gradient(90deg,#F6C453,#E8835A)" : ""}"></div></div>
      <b style="color:${stats.rate >= 95 ? "var(--green-600)" : stats.rate >= 90 ? "#B7791F" : "#C0564D"};font-size:16px">${stats.rate}%</b>
      <button class="btn btn-ghost btn-sm no-print" data-act="dash-goto-att" title="去登记考勤">📋 登记考勤</button>
    </div>

    <!-- 额外统计：本周违纪 / 今日作业未交 / 今日请假 -->
    <div class="dash-stats dash-extra">
      <div class="dash-stat s-disc" data-act="dash-goto-disc" title="点击查看违纪统计">
        <div class="ds-ico">⚠️</div>
        <div class="ds-num">${extra.weekDiscCount}<small> 次</small></div>
        <div class="ds-label">本周违纪</div>
      </div>
      <div class="dash-stat s-hw" data-act="dash-goto-hw" title="点击查看作业登记">
        <div class="ds-ico">📕</div>
        <div class="ds-num">${extra.hwUnfinCount}<small> 人</small></div>
        <div class="ds-label">今日作业未交</div>
      </div>
      <div class="dash-stat s-leave2" data-act="dash-goto-leave" title="点击查看请假管理">
        <div class="ds-ico">📮</div>
        <div class="ds-num">${extra.todayLeaveCount}<small> 人</small></div>
        <div class="ds-label">今日请假</div>
      </div>
    </div>

    <div class="dash-grid">
      <div>
        <!-- 今日待办大卡（校历备注 + 每日清单） -->
        <div class="card" id="sub-todos">
          <div class="card-title">✅ 今日待办 <span class="sub">点击打勾 · 自动喂小猫 +5XP</span>
            <button class="btn btn-primary btn-sm" data-act="todo-add">＋ 添加任务</button>
            <button class="btn btn-ghost btn-sm" data-act="todo-reset">重置</button>
          </div>
          <div id="dashTodoList">
            ${todoList.length === 0 ? `<div class="empty"><span class="e-ico">🍃</span>今天没有待办，去校历添加备注试试？</div>` :
            todoList.map(t => `
            <div class="dash-todo-item ${doneMap[t.id] ? "done" : ""}" data-todo-item data-i="${t.id}">
              <input type="checkbox" data-act="dash-todo-check" data-id="${t.id}" ${doneMap[t.id] ? "checked" : ""}>
              <span class="dti-ico">${esc(t.ico)}</span>
              <span class="dti-name">${esc(t.name)}</span>
              <span class="dti-src ${t.src === "note" ? "note" : "task"}">${t.src === "note" ? "📅 校历" : "📌 清单"}</span>
            </div>`).join("")}
          </div>
          <div style="margin-top:10px;font-size:12px;color:var(--ink-light)">💡 「校历」任务来自校历当日备注，可在「早日退休 → 学校校历」中维护</div>
        </div>

        <!-- 今日金句 -->
        <div class="card" id="sub-quote">
          <div class="card-title">💬 今日反馈金句 <span class="sub">给学生 / 家长的话</span>
            <a class="btn btn-ghost btn-sm" data-act="dash-goto-quote">查看全部 50 条</a>
          </div>
          <div class="dash-quote">
            <span class="dq-mark">❝</span>
            <div class="dq-text">“${esc(quote.text)}”</div>
            <span class="dq-cat">${esc(quote.cat)}</span>
          </div>
        </div>

        <!-- 小猫 -->
        <div class="card" id="sub-cat">
          <div class="card-title">🐱 我的小猫 <span class="sub">完成任务自动成长</span></div>
          <div class="cat-area">${renderMiniCat()}</div>
        </div>
      </div>

      <div>
        <!-- 倒计时：假期 + 周末 -->
        <div class="card">
          <div class="card-title">⏳ 放假倒计时 <span class="sub">打工人续命指南</span></div>
          <div class="dash-countdown">
            ${renderCdCard(countdown)}
          </div>
          <div style="margin-top:12px;font-size:12px;color:var(--ink-light);line-height:1.8">
            🌿 ${esc(getMotivationForCd(countdown))}
          </div>
        </div>
      </div>
    </div>`;
  },
  after() {
    // 生日祝福语复制
    document.querySelectorAll("[data-act=bday-copy]").forEach(btn => {
      btn.onclick = async () => {
        const txt = btn.dataset.bless;
        try { await navigator.clipboard.writeText(txt); toast("📋 祝福语已复制，可粘贴发送给学生或家长"); }
        catch (e) { prompt("请手动复制祝福语：", txt); }
      };
    });
    document.querySelector("[data-act=bday-goto-roster]")?.addEventListener("click", () => {
      renderModule("student");
      activeTaskId = Store.get("tasks", defaultTasks()).find(t => t.type === "student")?.id;
      renderSidebar();
    });
    // 打勾
    document.querySelectorAll("[data-act=dash-todo-check]").forEach(cb => {
      cb.onchange = () => {
        const id = cb.dataset.id;
        const todoList = getTodayTodoList();
        const doneMap = getTodayDoneMap(todoList);
        doneMap[id] = cb.checked;
        saveTodayDoneMap(todoList, doneMap);
        if (cb.checked) { addCatXp(5); toast("✅ 完成！小猫 +5XP"); }
        const view = document.getElementById("moduleView");
        view.innerHTML = Modules.dashboard.render();
        Modules.dashboard.after();
        renderSidebar();
      };
    });
    // 添加任务
    document.querySelector("[data-act=todo-add]")?.addEventListener("click", () => {
      openModal(`<input class="inp" id="inpTodoName" placeholder="任务名称" style="margin-bottom:8px">
        <input class="inp" id="inpTodoIco" placeholder="图标（emoji，如 📖）" maxlength="4">`, "添加每日任务");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const name = document.getElementById("inpTodoName").value.trim();
        if (name) {
          const todos = Store.get("dailyTodos", defaultDailyTodos());
          todos.push({ id: uid(), name, ico: document.getElementById("inpTodoIco").value.trim() || "✅" });
          Store.set("dailyTodos", todos);
        }
        closeModal();
        const view = document.getElementById("moduleView");
        view.innerHTML = Modules.dashboard.render();
        Modules.dashboard.after();
        renderSidebar();
      };
    });
    document.querySelector("[data-act=todo-reset]")?.addEventListener("click", () => {
      Store.set("dailyDone", {});
      const view = document.getElementById("moduleView");
      view.innerHTML = Modules.dashboard.render();
      Modules.dashboard.after();
      renderSidebar();
      toast("今日待办已重置");
    });
    document.querySelector("[data-act=dash-goto-att]")?.addEventListener("click", () => {
      renderModule("class", "attendance");
      activeTaskId = Store.get("tasks", defaultTasks()).find(t => t.type === "class")?.id;
      activeSubKey = "attendance";
      renderSidebar();
    });
    document.querySelector("[data-act=dash-goto-disc]")?.addEventListener("click", () => {
      renderModule("discipline");
      activeTaskId = Store.get("tasks", defaultTasks()).find(t => t.type === "discipline")?.id;
      activeSubKey = "";
      renderSidebar();
    });
    document.querySelector("[data-act=dash-goto-hw]")?.addEventListener("click", () => {
      renderModule("homework", "hw");
      activeTaskId = Store.get("tasks", defaultTasks()).find(t => t.type === "homework")?.id;
      activeSubKey = "hw";
      renderSidebar();
    });
    document.querySelector("[data-act=dash-goto-leave]")?.addEventListener("click", () => {
      renderModule("leave");
      activeTaskId = Store.get("tasks", defaultTasks()).find(t => t.type === "leave")?.id;
      activeSubKey = "";
      renderSidebar();
    });
    document.querySelector("[data-act=dash-goto-quote]")?.addEventListener("click", () => {
      renderModule("homework", "quote");
      activeTaskId = Store.get("tasks", defaultTasks()).find(t => t.type === "homework")?.id;
      activeSubKey = "quote";
      renderSidebar();
    });
  }
});

/* ---- 首页工具函数 ---- */
function isWeekendToday() {
  const d = new Date().getDay();
  return d === 0 || d === 6;
}

/* 首页额外统计：本周违纪次数/今日作业未交人数/今日请假人数 */
function getDashboardExtraStats() {
  const today = Today.now();
  const now = new Date();

  /* 本周违纪次数（周一至今天） */
  const discList = Store.get("disciplineRecords", []);
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);
  const mondayStr = Today.fmt(monday);
  const weekDiscCount = discList.filter(r => {
    const d = r.date || "";
    return d >= mondayStr && d <= today;
  }).length;

  /* 今日作业未交人数（遍历各班今日记录的 unfinished 数组） */
  const hw = Store.get("hwRecords", {});
  const classes = Store.get("classes", defaultClasses());
  let hwUnfinCount = 0;
  classes.forEach(c => {
    const rec = hw[c.id];
    if (rec && rec[today]) {
      const tr = rec[today];
      let unfinished = tr.unfinished;
      if (!Array.isArray(unfinished) && typeof tr.missing === "string") {
        unfinished = tr.missing.split(/[,，、\s]+/).filter(Boolean);
      }
      if (Array.isArray(unfinished)) hwUnfinCount += unfinished.length;
    }
  });

  /* 今日请假人数（start <= today <= end，排除已销假） */
  const leaveList = Store.get("leaveRecords", []);
  const todayLeaveCount = leaveList.filter(r => {
    if (r.status === "已销假") return false;
    const s = r.start || "", e = r.end || "";
    return s <= today && today <= e;
  }).length;

  return { weekDiscCount, hwUnfinCount, todayLeaveCount };
}
/* 合并今日待办：校历备注 + 每日清单 */
function getTodayTodoList() {
  const today = Today.now();
  const todos = Store.get("dailyTodos", defaultDailyTodos()).map(t => Object.assign({}, t, { src: "task" }));
  const notes = Store.get("calendarNotes", {});
  const noteList = (notes[today] || []).map(n => ({ id: "note:" + today + ":" + n, name: n, ico: "📌", src: "note" }));
  return noteList.concat(todos);
}
function getTodayDoneMap(todoList) {
  const today = Today.now();
  const done = Store.get("dailyDone", {});
  const map = {};
  (done[today] || []).forEach((v, i) => { if (v) map[todoList[i]?.id] = true; });
  // 校历备注完成状态
  const noteDone = Store.get("calendarNoteDone", {});
  Object.keys(noteDone[today] || {}).forEach(k => { if (noteDone[today][k]) map[k] = true; });
  return map;
}
function saveTodayDoneMap(todoList, map) {
  const today = Today.now();
  // 清单部分存回数组
  const done = Store.get("dailyDone", {});
  done[today] = done[today] || [];
  todoList.forEach((t, i) => {
    if (t.src === "task") done[today][i] = !!map[t.id];
  });
  Store.set("dailyDone", done);
  // 校历备注部分
  const noteDone = Store.get("calendarNoteDone", {});
  noteDone[today] = noteDone[today] || {};
  todoList.forEach(t => { if (t.src === "note") noteDone[today][t.id] = !!map[t.id]; });
  Store.set("calendarNoteDone", noteDone);
}
/* =========================================================
   生日提醒 · 首页卡片 + 每人专属暖心祝福语
   ========================================================= */
function calcAge(birthStr) {
  if (!birthStr) return 0;
  const b = Today.parse(birthStr);
  if (isNaN(b.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const bd = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  if (now < bd) age--;
  return Math.max(0, age);
}
/* 今天过生日的学生：[{name, cls, birthday, age, gender}] */
function getTodayBirthdays() {
  const now = new Date();
  const md = (now.getMonth() + 1) + "-" + now.getDate();
  const students = Store.get("students", {});
  const out = [];
  Object.keys(students).forEach(cls => {
    (students[cls] || []).forEach(s => {
      if (!s || !s.birthday) return;
      const parts = String(s.birthday).split("-");
      if (parts.length < 3) return;
      const smd = (+parts[1]) + "-" + (+parts[2]);
      if (smd === md) out.push({ name: s.name, cls, birthday: s.birthday, age: calcAge(s.birthday), gender: s.gender === "女" ? "女" : "男" });
    });
  });
  return out;
}
/* 姓名稳定 hash：保证同一位学生每次拿到同一条祝福，不同学生祝福不同 */
function nameHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h;
}
/* 祝福语模板池（按性别分组，含 {name}/{age}/{cls} 占位） */
const BIRTHDAY_TEMPLATES = {
  F: [
    "{name},今天是你的{age}岁生日呀!愿你的眼里永远有星光,笑容永远像阳光,做那个闪闪发光的小姑娘!🎂",
    "亲爱的{name},{age}岁生日快乐!愿你被世界温柔以待,也愿你温柔对待每一天,老师永远为你骄傲!🌷",
    "{name}小可爱,{age}岁生日快乐!愿你心里有梦、眼里有光,把日子过成诗,把每天过成礼物!🎁",
    "{name},祝你{age}岁生日快乐!愿你像春天的花一样绽放,像夏天的风一样自由,快乐成长!🌸",
    "今天的风都是甜的,因为{name}过生日啦!祝你{age}岁生日快乐,愿好运和快乐永远黏着你!🍭",
    "{name},{age}岁生日快乐!愿你读很多书、走很远路,心里始终住着那个爱笑的女孩!📚"
  ],
  M: [
    "{name},今天是你的{age}岁生日!愿你像追风少年一样勇敢,像小树苗一样向上生长,生日快乐!🎂",
    "嘿{name},{age}岁生日快乐!愿你心中有火、眼里有光,奔跑起来像风一样,老师和同学都为你加油!⚽",
    "{name},祝你{age}岁生日快乐!愿你成为自己的太阳,无需凭借谁的光,自信又阳光地长大!☀️",
    "{name}小勇士,{age}岁生日快乐!愿你永远保持好奇和勇气,去探索更大的世界!🚀",
    "{name},{age}岁生日快乐!愿你像超人一样勇敢,像海绵一样吸收知识,快乐每一天!🦸",
    "今天是最棒的一天,因为{name}长大一岁啦!祝你{age}岁生日快乐,梦想一步步实现!🎯"
  ],
  C: [
    "{name},{age}岁生日快乐!愿新的一岁,好事连连,快乐加倍,老师和同学们都在为你祝福!🎉",
    "{name},祝你{age}岁生日快乐!愿你每天都有小确幸,每天都有新收获,健康快乐地长大!🌻",
    "{name},{age}岁生日快乐!愿你的世界阳光满溢,愿你的努力都有回响,生日快乐呀!🎈",
    "{name},今天是你的{age}岁生日!愿你所有的愿望都能实现,所有的努力都有回报,生日快乐!✨",
    "{name},{age}岁生日快乐!愿你被爱包围,被快乐环绕,每一天都值得期待!🍰",
    "🎂叮!{name}的{age}岁生日到啦!愿你在新的一岁里,快乐学习、健康成长,收获满满的幸福!"
  ]
};
function birthdayBlessing(name, birth, gender) {
  const g = gender === "女" ? "F" : gender === "男" ? "M" : "C";
  const pool = BIRTHDAY_TEMPLATES[g] || BIRTHDAY_TEMPLATES.C;
  const tpl = pool[nameHash(name) % pool.length];
  const age = calcAge(birth);
  return tpl.replace(/\{name\}/g, name).replace(/\{age\}/g, age || "").replace(/\{cls\}/g, "");
}
/* 首页生日卡片（当天有人过生日才显示） */
function renderBirthdayCard() {
  const list = getTodayBirthdays();
  if (!list.length) return "";
  const card = list.map(b => {
    const bless = birthdayBlessing(b.name, b.birthday, b.gender);
    return `
      <div class="bday-item">
        <div class="bday-head"><span class="bday-ico">🎂</span>
          <div class="bday-who"><b>${esc(b.name)}</b><span class="bday-cls">${esc(b.cls)} · ${b.age} 岁</span></div>
          <button class="btn btn-ghost btn-sm bday-copy" data-bless="${esc(bless)}" title="复制祝福语">📋 复制祝福</button>
        </div>
        <div class="bday-bless">“${esc(bless)}”</div>
      </div>`;
  }).join("");
  return `
    <div class="card bday-card" id="sub-birthday">
      <div class="card-title">🎂 今日生日 <span class="sub">${list.length} 位小寿星 · 别忘了送上一句祝福</span>
        <button class="btn btn-ghost btn-sm" data-act="bday-goto-roster">🎂 去花名册看看</button>
      </div>
      ${card}
    </div>`;
}
/* 考勤统计 */
function getAttendanceStats() {
  const info = classInfo();
  let total = info.studentCount || 0;
  if (!total) {
    const all = Store.get("students", {});
    const first = Object.values(all)[0];
    if (first && first.length) total = first.length;
  }
  const att = Store.get("attendance", {});
  const rec = att[Today.now()] || {};
  let late = 0, leave = 0, absent = 0;
  Object.values(rec).forEach(v => {
    if (v === "late") late++;
    else if (v === "leave") leave++;
    else if (v === "absent") absent++;
  });
  const present = Math.max(0, total - leave - absent);
  const rate = total ? Math.round((present / total) * 100) : 0;
  return { total, present, late, leave, absent, rate };
}
/* 倒计时：距开学 / 距周末 / 距最近节假日 */
function getCountdown() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const data = Store.get("retirement", {});
  const semesterStart = data.semesterStart || "2026-09-01";
  const semesterName = data.semesterName || "2026年秋季学期";
  const openDays = Math.ceil((Today.parse(semesterStart) - today) / 86400000);
  // 距离周末
  let weekendDays = -1, weekendDow = 0;
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const dow = d.getDay();
    if ((dow === 0 || dow === 6) && i > 0) { weekendDays = i; weekendDow = dow; break; }
  }
  const isRestToday = isWeekendToday() || !!Store.get("holidays", defaultHolidays())[Today.now()];
  // 距离最近节假日
  const holidays = Store.get("holidays", defaultHolidays());
  let nextHoliday = null;
  Object.keys(holidays).sort().forEach(ds => {
    if (!nextHoliday && ds >= Today.now()) nextHoliday = { date: ds, name: holidays[ds], days: Math.ceil((Today.parse(ds) - today) / 86400000) };
  });
  return { openDays, semesterName, weekendDays, weekendDow, nextHoliday, isRestToday };
}
function renderCdCard(cd) {
  let html = "";
  if (cd.isRestToday) {
    html += `<div class="dash-cd cd-today-rest">
      <span class="dc-ico">🎉</span>
      <div class="dc-label">今天</div>
      <div class="dc-days">休息日！<small></small></div>
      <div class="dc-sub">好好享受，攒满能量再出发</div>
    </div>`;
  } else {
    html += `<div class="dash-cd cd-weekend">
      <span class="dc-ico">🌤️</span>
      <div class="dc-label">距离周末</div>
      <div class="dc-days">${cd.weekendDays}<small> 天</small></div>
      <div class="dc-sub">${cd.weekendDow === 6 ? "再撑一下，周六到" : "坚持住，周日就来"}</div>
    </div>`;
  }
  if (cd.openDays >= 0) {
    html += `<div class="dash-cd cd-open">
      <span class="dc-ico">🎒</span>
      <div class="dc-label">距离「${esc(cd.semesterName)}」开学</div>
      <div class="dc-days">${cd.openDays}<small> 天</small></div>
      <div class="dc-sub">假期余额不足，且行且珍惜</div>
    </div>`;
  } else {
    html += `<div class="dash-cd cd-open">
      <span class="dc-ico">📚</span>
      <div class="dc-label">本学期已开学</div>
      <div class="dc-days">${Math.abs(cd.openDays)}<small> 天</small></div>
      <div class="dc-sub">忙碌中也要记得照顾好自己</div>
    </div>`;
  }
  if (cd.nextHoliday) {
    html += `<div class="dash-cd cd-holiday">
      <span class="dc-ico">🏮</span>
      <div class="dc-label">距离${esc(cd.nextHoliday.name)}</div>
      <div class="dc-days">${cd.nextHoliday.days}<small> 天</small></div>
      <div class="dc-sub">${esc(cd.nextHoliday.date)} · 期待一下吧</div>
    </div>`;
  } else {
    html += `<div class="dash-cd cd-holiday">
      <span class="dc-ico">🏮</span>
      <div class="dc-label">下一个假期</div>
      <div class="dc-days">—<small></small></div>
      <div class="dc-sub">可在校历中添加节假日标记</div>
    </div>`;
  }
  if (!cd.isRestToday) {
    html += `<div class="dash-cd cd-weekend" style="grid-column:1/-1">
      <span class="dc-ico">🌿</span>
      <div class="dc-label">今日小确幸</div>
      <div class="dc-sub" style="font-size:13px;line-height:1.9">完成待办就奖励自己一杯茶，你值得！</div>
    </div>`;
  }
  return html;
}
function getMotivationForCd(cd) {
  const mot = getDailyMotivation(new Date());
  return mot;
}

/* ---------- 侧边栏渲染 ---------- */
let activeTaskId = null;
let activeSubKey = null;

function renderSidebar() {
  const tasks = Store.get("tasks", defaultTasks());
  const nav = document.getElementById("taskNav");
  const done = Store.get("dailyDone", {});
  const today = Today.now();
  const todos = Store.get("dailyTodos", defaultDailyTodos());
  const list = done[today] || [];
  const count = todos.filter((_, i) => list[i]).length;

  // 分组：内置 vs 自定义
  const builtinIds = ["daily", "dashboard", "student", "grade", "discipline", "homework", "leave", "class", "retirement", "timetable", "lesson", "comm", "honor", "ideas", "study", "vault", "monthly"];
  const builtin = tasks.filter(t => builtinIds.includes(t.type));
  const custom = tasks.filter(t => !builtinIds.includes(t.type));

  let html = "";
  html += `<div class="nav-group-title">✦ 我的工作台</div>`;
  builtin.forEach(t => {
    html += renderNavItem(t);
    const subs = TASK_SUB[t.type];
    if (subs && activeTaskId === t.id) {
      html += `<div class="nav-sub open">${subs.map(s => `
        <div class="nav-sub-item ${activeSubKey === s.key ? "active" : ""}" data-subkey="${s.key}">
          <span class="ns-dot"></span>${esc(s.ico)} ${esc(s.name)}
        </div>`).join("")}</div>`;
    }
  });
  if (custom.length) {
    html += `<div class="nav-group-title">📌 自定义任务</div>`;
    custom.forEach(t => html += renderNavItem(t));
  }
  nav.innerHTML = html;

  // 绑定主任务点击
  nav.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest("[data-navop]")) return;
      const id = item.dataset.id;
      const isOpen = activeTaskId === id;
      activeTaskId = id;
      activeSubKey = null;
      if (!isOpen) renderModule(item.dataset.type);
      renderSidebar();
    });
  });
  // 绑定子菜单点击
  nav.querySelectorAll(".nav-sub-item").forEach(sub => {
    sub.addEventListener("click", (e) => {
      e.stopPropagation();
      const item = sub.closest(".nav-item") || document.querySelector(`.nav-item[data-id="${activeTaskId}"]`);
      activeSubKey = sub.dataset.subkey;
      renderSidebar();
      renderModule(item ? item.dataset.type : activeTaskId, activeSubKey);
    });
  });
  // 操作按钮
  nav.querySelectorAll("[data-navop]").forEach(op => {
    op.addEventListener("click", (e) => {
      e.stopPropagation();
      const act = op.dataset.navop;
      const id = op.closest(".nav-item").dataset.id;
      const tasks2 = Store.get("tasks", defaultTasks());
      const t = tasks2.find(x => x.id === id);
      if (act === "edit") {
        openModal(`<input class="inp" id="inpEditTask" value="${esc(t.name)}" maxlength="20">`, "修改任务名称");
        const ok = document.querySelector("[data-act=modal-ok]");
        ok.onclick = () => {
          const v = document.getElementById("inpEditTask").value.trim();
          if (v) { t.name = v; Store.set("tasks", tasks2); renderSidebar(); }
          closeModal();
        };
      } else if (act === "del") {
        if (confirm(`确定删除任务「${t.name}」吗？`)) {
          Store.set("tasks", tasks2.filter(x => x.id !== id));
          if (activeTaskId === id) { activeTaskId = null; renderModule("daily"); }
          renderSidebar();
        }
      }
    });
  });

  // 进度
  const dpCount = document.getElementById("dpCount");
  const dpBar = document.getElementById("dpBar");
  if (dpCount) dpCount.textContent = `${count}/${todos.length}`;
  if (dpBar) dpBar.style.width = todos.length ? (count / todos.length * 100) + "%" : "0%";
}

function renderNavItem(t) {
  const subs = TASK_SUB[t.type];
  return `<div class="nav-item ${activeTaskId === t.id ? "active" : ""} ${subs ? "has-sub" : ""}" data-id="${t.id}" data-type="${t.type}"
    data-tip="${esc(TASK_TIP[t.type] || "自定义任务 · 点击查看")}">
    <span class="nav-ico">${esc(t.ico || "📌")}</span>
    <span class="nav-name">${esc(t.name)}</span>
    ${subs ? `<span class="nav-caret">▶</span>` : ""}
    <span class="nav-ops">
      <button class="nav-op" data-navop="edit" title="编辑名称">✏️</button>
      <button class="nav-op" data-navop="del" title="删除">🗑️</button>
    </span>
  </div>`;
}

/* ---------- 模块渲染 ---------- */
function renderModule(type, sub) {
  const view = document.getElementById("moduleView");
  // 自定义任务统一走 custom 模块
  const realType = (type || "").startsWith("custom") ? "custom" : type;
  const mod = Modules[realType];
  if (!mod) { view.innerHTML = `<div class="empty"><span class="e-ico">📌</span>模块加载失败</div>`; return; }
  view.innerHTML = mod.render();
  if (mod.after) mod.after();
  view.scrollTop = 0;
  if (sub) jumpToSub(realType, sub);
}

/* 子菜单跳转到模块内对应板块 */
function jumpToSub(type, sub) {
  setTimeout(() => {
    if (type === "class") {
      const tab = document.querySelector(`#classTabs [data-tab="${sub}"]`);
      if (tab) tab.click();
    } else if (type === "homework") {
      const tab = document.querySelector(`#hwTabs [data-hwtab="${sub}"]`);
      if (tab) tab.click();
    } else if (type === "student") {
      const tab = document.querySelector(`#stuTabs [data-stutab="${sub}"]`);
      if (tab) tab.click();
    } else if (type === "grade") {
      const tab = document.querySelector(`#gaTabs [data-gatab="${sub}"], #gaSubTabs [data-gasubtab="${sub}"]`);
      if (tab) tab.click();
      const el = document.getElementById("sub-" + sub);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (type === "timetable") {
      const tab = document.querySelector(`#ttTabs [data-tttab="${sub}"]`);
      if (tab) tab.click();
    } else if (type === "ideas") {
      jumpIdeaFilter(sub);
    } else if (type === "monthly") {
      jumpMonthlyTab(sub);
    } else {
      const el = document.getElementById("sub-" + sub);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 30);
}

/* ---------- 全局模态框事件 ---------- */
function bindGlobalEvents() {
  // 新增任务
  document.getElementById("btnAddTask").addEventListener("click", () => {
    openModal(`<input class="inp" id="inpTaskName" placeholder="任务名称（如：运动会筹备）" maxlength="20">`, "新增自定义任务");
    const ok = document.querySelector("[data-act=modal-ok]");
    ok.onclick = () => {
      const name = document.getElementById("inpTaskName").value.trim();
      if (!name) { toast("请输入任务名称"); return; }
      const tasks = Store.get("tasks", defaultTasks());
      const t = { id: uid(), name, type: "custom-" + uid(), ico: "📌" };
      tasks.push(t);
      Store.set("tasks", tasks);
      activeTaskId = t.id;
      closeModal();
      renderSidebar();
      renderModule("custom");
    };
  });

  // 模态框关闭
  document.addEventListener("click", (e) => {
    if (e.target.dataset.act === "modal-close") closeModal();
    if (e.target.classList.contains("modal-mask") && !e.target.closest(".modal")) closeModal();
    // 通用导出/打印工具条
    if (e.target.dataset.act === "mod-export") exportModuleView(e.target.dataset.name || "工作台");
    if (e.target.dataset.act === "mod-print") window.print();
  });

  // 导出备份（含全部业务数据；不含保险库快照，快照在保险库内单独管理）
  document.getElementById("btnExport").addEventListener("click", () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("teacher_workbench_") && !k.startsWith("teacher_workbench_vault_")) keys.push(k);
    }
    const data = {};
    keys.forEach(k => data[k.replace("teacher_workbench_", "")] = Store.get(k.replace("teacher_workbench_", ""), null));
    downloadFile("啊敏的兵备份_" + Today.now() + ".json", JSON.stringify(data, null, 2), "application/json");
    toast("💾 数据备份已下载（手机/电脑互传此文件即可同步）");
  });

  // 恢复备份（手机/电脑数据互通）
  document.getElementById("btnImport").addEventListener("click", () => {
    document.getElementById("inpImport").click();
  });
  document.getElementById("inpImport").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const keys = Object.keys(data);
        if (keys.length === 0) { toast("⚠️ 备份文件为空"); return; }
        keys.forEach(k => Store.set(k, data[k]));
        toast("✅ 已恢复 " + keys.length + " 项数据，正在刷新…");
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        toast("⚠️ 备份文件格式不正确，无法恢复");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // 快捷键
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/* ---------- 通用模块工具条（导出 / 打印） ---------- */
function modToolbar(name) {
  return `<div class="mv-toolbar no-print">
    <span class="tb-hint">🌿 数据自动保存到本地 · 随时导出打印</span>
    <button class="toolbar-btn" data-act="mod-export" data-name="${esc(name)}">⬇️ 导出本页</button>
    <button class="toolbar-btn" data-act="mod-print">🖨️ 打印本页</button>
  </div>`;
}

/* 导出当前模块视图（表格转CSV + 文本收集） */
function exportModuleView(name) {
  const view = document.getElementById("moduleView");
  if (!view) return;
  const parts = [];
  const h = view.querySelector(".mv-title");
  if (h) parts.push("【" + h.textContent.trim() + "】");
  const now = new Date();
  parts.push("导出时间：" + Today.now() + " " + now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  view.querySelectorAll("table.tbl, table.timetable").forEach((tbl, ti) => {
    const rows = [];
    tbl.querySelectorAll("tr").forEach(tr => {
      const cells = [];
      tr.querySelectorAll("th, td").forEach(c => {
        const inp = c.querySelector("input, textarea, select");
        let txt = inp ? inp.value : c.textContent.trim();
        txt = txt.replace(/\s+/g, " ").replace(/"/g, '""');
        cells.push('"' + txt + '"');
      });
      if (cells.length) rows.push(cells.join(","));
    });
    if (rows.length) parts.push("\n== 表格" + (ti + 1) + " ==\n" + rows.join("\n"));
  });
  view.querySelectorAll(".dash-todo-item, .comm-item, .comment-card, .quote-card, .dash-cd, .scrap-card, .score-row, .duty-group, .wish-item").forEach(el => {
    const t = el.textContent.trim().replace(/\s+/g, " ");
    if (t) parts.push("· " + t);
  });
  if (parts.length <= 2) parts.push(view.innerText);
  downloadFile(name + "_" + Today.now() + ".txt", parts.join("\n"), "text/plain;charset=utf-8");
  toast("⬇️ 已导出「" + name + "」");
}

/* 导出指定作用域内的表格为 CSV（带 BOM，Excel 可直接打开） */
function exportScopeToCSV(name, scopeSel) {
  const scope = typeof scopeSel === "string" ? document.querySelector(scopeSel) : scopeSel;
  if (!scope) { toast("未找到可导出的表格"); return; }
  const rows = [];
  scope.querySelectorAll("table.tbl, table.timetable, table.hw-sheet").forEach(tbl => {
    tbl.querySelectorAll("tr").forEach(tr => {
      const cells = [];
      tr.querySelectorAll("th, td").forEach(c => {
        const inp = c.querySelector("input, textarea, select");
        let txt = inp ? inp.value : c.textContent.trim();
        txt = txt.replace(/\s+/g, " ").replace(/"/g, '""');
        cells.push('"' + txt + '"');
      });
      if (cells.length) rows.push(cells.join(","));
    });
  });
  if (!rows.length) { toast("暂无可导出的数据"); return; }
  downloadFile(name + "_" + Today.now() + ".csv", "\ufeff" + rows.join("\n"), "text/csv;charset=utf-8");
  toast("⬇️ 已下载「" + name + "」");
}

/* 打印当前模块视图（CSS 已隐藏侧边栏/按钮） */
function printModule() {
  window.print();
}

/* ---------- 顶部日期 ---------- */
function renderTodayDate() {
  const el = document.getElementById("todayDate");
  const now = new Date();
  const week = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];
  const weekNo = getWeekOfSemester(now);
  el.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 周${week} · 本学期第${weekNo}周`;
}

function getWeekOfSemester(now) {
  const start = Store.get("retirement", {}).semesterStart || "2026-09-01";
  const s = Today.parse(start);
  const diff = Math.floor((now - s) / 86400000);
  return diff < 0 ? 0 : Math.floor(diff / 7) + 1;
}

/* ---------- 自定义任务模块 ---------- */
registerModule("custom", {
  title: "📌 自定义任务",
  sub: "您创建的任务 · 在此添加内容备注",
  render() {
    const tasks = Store.get("tasks", defaultTasks());
    const t = tasks.find(x => x.id === activeTaskId);
    const notes = Store.get("customNotes", {});
    const note = t ? notes[t.id] || "" : "";
    const checks = Store.get("customChecks", {});
    const today = Today.now();
    const list = checks[today] || {};
    const doneCount = t ? Object.values(list).filter(Boolean).length : 0;
    const subTasks = t ? Store.get("customSub_" + t.id, []) : [];
    let html = `<div class="mv-header"><h2 class="mv-title">📌 ${t ? esc(t.name) : "自定义任务"}</h2>
      <p class="mv-sub">${today} · 已完成子任务 ${doneCount}/${subTasks.length}</p></div>
    ${modToolbar(t ? t.name : "自定义任务")}`;
    if (!t) return html + `<div class="empty"><span class="e-ico">📌</span>请从左侧选择一个任务</div>`;
    html += `
    <div class="card">
      <div class="card-title">🗒️ 任务备注 <span class="sub">记录这个任务的内容、要点</span></div>
      <textarea class="tarea" id="inpCustomNote" rows="6" style="width:100%" placeholder="在这里写下任务的详细内容、注意事项...">${esc(note)}</textarea>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn btn-primary btn-sm" data-act="custom-save-note">💾 保存备注</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">✅ 子任务清单 <span class="sub">拆解任务，每日打勾</span>
        <button class="btn btn-primary btn-sm" data-act="custom-add">＋ 添加子任务</button>
      </div>
      <div id="customSubList">
        ${subTasks.length === 0 ? `<div class="empty"><span class="e-ico">📌</span>暂无子任务，点击「＋ 添加子任务」拆解你的任务</div>` :
        subTasks.map((st, i) => `
        <div class="score-row">
          <input type="checkbox" data-act="custom-check" data-i="${i}" ${list[st.id] ? "checked" : ""} style="width:17px;height:17px;accent-color:var(--green-600)">
          <input class="inline-edit" data-custom-name data-i="${i}" value="${esc(st.name)}" style="font-weight:600;flex:1" ${list[st.id] ? 'style="text-decoration:line-through"' : ""}>
          <button class="btn btn-danger btn-sm" data-act="custom-del" data-i="${i}">✕</button>
        </div>`).join("")}
      </div>
    </div>`;
    return html;
  },
  after() {
    const t = Store.get("tasks", defaultTasks()).find(x => x.id === activeTaskId);
    if (!t) return;
    const body = document.getElementById("moduleView");
    document.querySelector("[data-act=custom-save-note]")?.addEventListener("click", () => {
      const notes = Store.get("customNotes", {});
      notes[t.id] = document.getElementById("inpCustomNote").value;
      Store.set("customNotes", notes);
      toast("💾 备注已保存");
    });
    document.querySelector("[data-act=custom-add]")?.addEventListener("click", () => {
      openModal(`<input class="inp" id="inpCustomSub" placeholder="子任务名称" maxlength="30">`, "添加子任务");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const name = document.getElementById("inpCustomSub").value.trim();
        if (name) {
          const sub = Store.get("customSub_" + t.id, []);
          sub.push({ id: uid(), name });
          Store.set("customSub_" + t.id, sub);
        }
        closeModal();
        body.innerHTML = Modules.custom.render();
        Modules.custom.after();
      };
    });
    body.querySelectorAll("[data-custom-name]").forEach(inp => {
      inp.onchange = () => {
        const sub = Store.get("customSub_" + t.id, []);
        sub[+inp.dataset.i].name = inp.value;
        Store.set("customSub_" + t.id, sub);
      };
    });
    body.querySelectorAll("[data-act=custom-check]").forEach(cb => {
      cb.onchange = () => {
        const checks = Store.get("customChecks", {});
        const today = Today.now();
        checks[today] = checks[today] || {};
        const sub = Store.get("customSub_" + t.id, []);
        const st = sub[+cb.dataset.i];
        checks[today][st.id] = cb.checked;
        Store.set("customChecks", checks);
        if (cb.checked) { addCatXp(5); toast("✅ +5XP 小猫成长中..."); }
        body.innerHTML = Modules.custom.render();
        Modules.custom.after();
      };
    });
    body.querySelectorAll("[data-act=custom-del]").forEach(b => {
      b.onclick = () => {
        const sub = Store.get("customSub_" + t.id, []);
        sub.splice(+b.dataset.i, 1);
        Store.set("customSub_" + t.id, sub);
        body.innerHTML = Modules.custom.render();
        Modules.custom.after();
      };
    });
  }
});

/* ---------- 初始化 ---------- */
function init() {
  // 首次初始化默认数据
  if (!Store.get("tasks")) Store.set("tasks", defaultTasks());
  if (!Store.get("retirement", null)) Store.set("retirement", { semesterStart: "2026-09-01", semesterName: "2026年秋季学期" });
  if (!Store.get("holidays", null)) Store.set("holidays", defaultHolidays());
  if (!Store.get("schedule", null)) Store.set("schedule", defaultSchedule());
  if (!Store.get("classSchedule", null)) Store.set("classSchedule", defaultSchedule());
  if (!Store.get("subjectSchedule", null)) Store.set("subjectSchedule", defaultSubjectSchedule());
  if (!Store.get("tempChanges", null)) Store.set("tempChanges", defaultTempChanges());
  if (!Store.get("cat", null)) Store.set("cat", defaultCat());
  if (!Store.get("bottle", null)) Store.set("bottle", defaultBottle());
  if (!Store.get("coupons", null)) Store.set("coupons", defaultCoupons());
  if (!Store.get("dutyRoles", null)) Store.set("dutyRoles", defaultDutyRoles());
  if (!Store.get("committee", null)) Store.set("committee", defaultCommittees());
  if (!Store.get("scoreCols", null)) Store.set("scoreCols", defaultScoreCols());
  if (!Store.get("classes", null)) Store.set("classes", defaultClasses());
  if (!Store.get("dailyTodos", null)) Store.set("dailyTodos", defaultDailyTodos());
  if (!Store.get("links", null)) Store.set("links", defaultLinks());

  // V8 兼容：检查是否有新增模块（grade/discipline/leave），若缺失则重建内置任务顺序
  let tasks = Store.get("tasks", defaultTasks());
  const v8NewTypes = ["grade", "discipline", "leave"];
  const needRebuild = v8NewTypes.some(t => !tasks.some(x => x.type === t));
  if (needRebuild) {
    const defaults = defaultTasks();
    const builtinTypes = defaults.map(d => d.type);
    const customTasks = tasks.filter(t => !builtinTypes.includes(t.type));
    const nameMap = {};
    tasks.forEach(t => {
      const def = defaults.find(d => d.type === t.type);
      if (def && t.name !== def.name) nameMap[t.type] = t.name;
    });
    tasks = defaults.map(d => ({ id: d.id, name: nameMap[d.type] || d.name, type: d.type }));
    tasks.push(...customTasks);
    Store.set("tasks", tasks);
  }

  renderTodayDate();
  renderSidebar();
  bindGlobalEvents();

  // 默认打开首页看板
  const first = tasks.find(t => t.type === "dashboard") || tasks[0];
  activeTaskId = first.id;
  activeSubKey = null;
  renderModule(first.type);
  renderSidebar();

  // 保存续命表
  document.addEventListener("click", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.act === "save-semester") {
      const data = Store.get("retirement", {});
      data.semesterStart = document.getElementById("inpSemesterStart").value || data.semesterStart;
      data.semesterName = document.getElementById("inpSemesterName").value.trim() || data.semesterName;
      Store.set("retirement", data);
      toast("✅ 续命表已更新");
      renderTodayDate();
      renderModule("retirement");
    }
  });

  // 添加假期
  document.addEventListener("click", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.act === "add-holiday") {
      const date = document.getElementById("inpHoliday").value;
      const name = document.getElementById("inpHolidayName").value.trim();
      if (!date || !name) { toast("请选择日期并填写名称"); return; }
      const holidays = Store.get("holidays", defaultHolidays());
      holidays[date] = name;
      Store.set("holidays", holidays);
      document.getElementById("inpHolidayName").value = "";
      rerenderCal();
      toast(`✅ 已标记 ${date}：${name}`);
    }
    if (e.target && e.target.dataset && e.target.dataset.act === "reset-holidays") {
      Store.set("holidays", defaultHolidays());
      rerenderCal();
      toast("已重置为默认校历");
    }
    if (e.target && e.target.dataset && e.target.dataset.act === "reset-schedule") {
      Store.set("schedule", defaultSchedule());
      rerenderSchedule();
      toast("已重置为默认课程表");
    }
  });

  // 四象限
  document.addEventListener("click", (e) => {
    const act = e.target.dataset && e.target.dataset.act;
    if (act === "quad-add") {
      const q = e.target.dataset.q;
      const inp = document.getElementById("inpQuad-" + q);
      const val = inp.value.trim();
      if (!val) return;
      const quads = Store.get("quads", { q1: [], q2: [], q3: [], q4: [] });
      quads[q].push({ text: val, done: false });
      Store.set("quads", quads);
      const body = document.getElementById("moduleView");
      if (body) { body.innerHTML = Modules.retirement.render(); Modules.retirement.after(); }
    }
    if (act === "quad-check") {
      const q = e.target.dataset.q, i = +e.target.dataset.i;
      const quads = Store.get("quads", { q1: [], q2: [], q3: [], q4: [] });
      quads[q][i].done = e.target.checked;
      Store.set("quads", quads);
      if (e.target.checked) { addCatXp(3); toast("✅ +3XP"); }
    }
    if (act === "quad-del") {
      const q = e.target.dataset.q, i = +e.target.dataset.i;
      const quads = Store.get("quads", { q1: [], q2: [], q3: [], q4: [] });
      quads[q].splice(i, 1);
      Store.set("quads", quads);
      const body = document.getElementById("moduleView");
      if (body) { body.innerHTML = Modules.retirement.render(); Modules.retirement.after(); }
    }
    if (act === "cat-feed" || act === "cat-pet") {
      const cat = Store.get("cat", defaultCat());
      if (act === "cat-feed") { cat.fed++; cat.xp += 5; toast("🍖 猫咪吃饱啦！+5XP"); }
      else { cat.pet++; cat.xp += 2; toast("✋ 猫咪好开心！+2XP"); }
      Store.set("cat", cat);
      const body = document.getElementById("moduleView");
      if (body) { body.innerHTML = Modules.retirement.render(); Modules.retirement.after(); }
    }
    if (act === "add-link") {
      openModal(`
        <input class="inp" id="inpLinkName" placeholder="名称" style="margin-bottom:8px">
        <input class="inp" id="inpLinkUrl" placeholder="网址 https://..." style="margin-bottom:8px">
        <select class="inp" id="inpLinkCat" style="margin-bottom:8px">
          <option>资源网站</option><option>AI备课</option><option>公开课工具</option><option>自定义</option>
        </select>
        <input class="inp" id="inpLinkIco" placeholder="图标 emoji（如 📖）" maxlength="4">`, "添加链接");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const links = Store.get("links", defaultLinks());
        links.push({
          id: uid(),
          name: document.getElementById("inpLinkName").value.trim(),
          url: document.getElementById("inpLinkUrl").value.trim(),
          cat: document.getElementById("inpLinkCat").value,
          ico: document.getElementById("inpLinkIco").value.trim() || "🔗"
        });
        Store.set("links", links);
        closeModal();
        renderModule("lesson");
      };
    }
    if (act === "del-link") {
      const id = e.target.dataset.id;
      const links = Store.get("links", defaultLinks());
      Store.set("links", links.filter(l => l.id !== id));
      renderModule("lesson");
      toast("链接已删除");
    }
    if (act === "quick-add") {
      const cat = e.target.dataset.cat;
      openModal(`
        <input class="inp" id="inpLinkName" placeholder="名称" style="margin-bottom:8px">
        <input class="inp" id="inpLinkUrl" placeholder="网址 https://..." style="margin-bottom:8px">
        <input class="inp" id="inpLinkIco" placeholder="图标 emoji" maxlength="4">`, `添加到「${cat}」`);
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const links = Store.get("links", defaultLinks());
        links.push({ id: uid(), name: document.getElementById("inpLinkName").value.trim(), url: document.getElementById("inpLinkUrl").value.trim(), cat, ico: document.getElementById("inpLinkIco").value.trim() || "🔗" });
        Store.set("links", links);
        closeModal();
        renderModule("lesson");
      };
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
