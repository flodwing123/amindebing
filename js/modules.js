/* =========================================================
   功能模块 · 第一部分
   模块1 早日退休 / 模块2 备课助手 / 模块3 班级管理
   ========================================================= */

/* ---------- 通用工具 ---------- */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 1800);
}
function openModal(html, title) {
  const m = document.getElementById("modalTask");
  m.style.display = "flex";
  m.dataset.custom = "1";
  m.innerHTML = `<div class="modal"><h3>${title}</h3>${html}<div class="modal-actions">
    <button class="btn btn-ghost" data-act="modal-close">取消</button>
    <button class="btn btn-primary" data-act="modal-ok">确定</button></div></div>`;
  return m;
}
function closeModal() {
  const m = document.getElementById("modalTask");
  m.style.display = "none";
}
function downloadFile(name, content, type) {
  const blob = new Blob([content], { type: type || "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- 模块注册表 ---------- */
const Modules = {};
function registerModule(type, def) {
  Modules[type] = Object.assign({ sub: "", after: null }, def);
}

/* =========================================================
   模块1 · 早日退休
   ========================================================= */
registerModule("retirement", {
  title: "🌿 早日退休",
  sub: "教师续命表 · 校历 · 课程表 · 养小猫 · 四象限待办",
  render() {
    const data = Store.get("retirement", {});
    const semesterStart = data.semesterStart || "2026-09-01";
    const semesterName = data.semesterName || "2026年秋季学期";
    // 倒计时
    const target = Today.parse(semesterStart);
    const diffDays = Math.max(0, Math.ceil((target - new Date()) / 86400000));

    // 小猫
    const cat = Store.get("cat", defaultCat());
    const catLevels = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
    const curLevel = catLevels.indexOf(Math.max(...catLevels.filter(v => v <= cat.xp)));
    const level = curLevel === -1 ? 1 : curLevel + 1;
    const nextXp = catLevels[level] || 999999;
    const prevXp = catLevels[level - 1] || 0;
    const pct = Math.min(100, Math.round(((cat.xp - prevXp) / (nextXp - prevXp)) * 100));
    const catEmojis = ["🐣", "🐥", "🐱", "🐈", "😺", "😸", "😻", "🐆", "🦁", "🐯"];
    const catEmoji = catEmojis[level - 1] || "🐯";

    // 四象限待办
    const quads = Store.get("quads", { q1: [], q2: [], q3: [], q4: [] });

    // 周末/节假日倒计时（与首页共用）
    const cd = getCountdown();
    const cdSub = cd.isRestToday ? "今天休息日！好好享受 🎉"
      : `距周末还有 <b style="color:var(--green-600)">${cd.weekendDays}</b> 天${cd.nextHoliday ? ` · 距${esc(cd.nextHoliday.name)}还有 <b style="color:var(--gold)">${cd.nextHoliday.days}</b> 天` : ""}`;

    return `
    <div class="mv-header">
      <h2 class="mv-title">🌿 早日退休</h2>
      <p class="mv-sub">${esc(semesterName)} · 距开学 <b style="color:var(--green-600);font-size:16px">${diffDays}</b> 天 · ${cdSub} · 加油搬砖人！</p>
    </div>
    ${modToolbar("早日退休")}

    <div class="grid-2">
      <!-- 续命表 -->
      <div class="card" id="sub-countdown">
        <div class="card-title">🧘 教师续命表 <span class="sub">距离开学倒计时</span></div>
        <div style="text-align:center;padding:12px 0">
          <div style="font-size:52px;font-weight:800;color:var(--green-700);line-height:1.2">${diffDays}<small style="font-size:18px"> 天</small></div>
          <div style="font-size:13px;color:var(--ink-light);margin-top:4px">距离「${esc(semesterName)}」开学还有 ${diffDays} 天</div>
        </div>
        <div class="dash-countdown" style="margin-top:8px">
          ${cd.isRestToday ? `<div class="dash-cd cd-today-rest" style="grid-column:1/-1"><span class="dc-ico">🎉</span><div class="dc-label">今天</div><div class="dc-days">休息日！</div><div class="dc-sub">好好享受假期时光</div></div>`
          : `<div class="dash-cd cd-weekend"><span class="dc-ico">🌤️</span><div class="dc-label">距离周末</div><div class="dc-days">${cd.weekendDays}<small> 天</small></div><div class="dc-sub">撑一撑，周末就在眼前</div></div>`}
          ${cd.nextHoliday ? `<div class="dash-cd cd-holiday"><span class="dc-ico">🏮</span><div class="dc-label">距离${esc(cd.nextHoliday.name)}</div><div class="dc-days">${cd.nextHoliday.days}<small> 天</small></div><div class="dc-sub">${esc(cd.nextHoliday.date)} · 值得期待</div></div>` : ""}
        </div>
        <div style="margin-top:10px;font-size:12px;color:var(--ink-light)">🌿 ${esc(getDailyMotivation(new Date()))}</div>
        <div class="grid-2" style="margin-top:8px">
          <div><label style="font-size:12px;color:var(--ink-light)">开学日期</label>
            <input type="date" class="inp" id="inpSemesterStart" value="${esc(semesterStart)}" style="width:100%"></div>
          <div><label style="font-size:12px;color:var(--ink-light)">学期名称</label>
            <input class="inp" id="inpSemesterName" value="${esc(semesterName)}" style="width:100%"></div>
        </div>
        <button class="btn btn-primary btn-sm" data-act="save-semester" style="margin-top:10px">保存续命表</button>
      </div>

      <!-- 养小猫 -->
      <div class="card" id="sub-cat">
        <div class="card-title">🐱 养小猫 <span class="sub">完成任务获得经验值</span></div>
        <div class="cat-area">
          <div class="cat-box">
            <span class="cat-emoji">${catEmoji}</span>
            <div class="cat-name">${esc(cat.name)} Lv.${level}</div>
            <div class="cat-xp">经验 ${cat.xp} / ${nextXp}</div>
            <div class="xp-bar"><div class="xp-bar-in" style="width:${pct}%"></div></div>
            <div class="cat-stats">
              <span>🍖 喂食 ${cat.fed}</span><span>✋ 摸摸 ${cat.pet}</span>
            </div>
            <div style="display:flex;gap:6px;justify-content:center;margin-top:10px">
              <button class="btn btn-green-soft btn-sm" data-act="cat-feed">🍖 喂食 +5</button>
              <button class="btn btn-green-soft btn-sm" data-act="cat-pet">✋ 摸摸 +2</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 四象限待办 -->
    <div class="card" id="sub-quad">
      <div class="card-title">🗂️ 四象限待办 <span class="sub">重要紧急 → 不重要不紧急</span></div>
      <div class="quad-grid">
        ${renderQuad("q1", "🔴 重要且紧急", quads.q1)}
        ${renderQuad("q2", "🟢 重要不紧急", quads.q2)}
        ${renderQuad("q3", "🟡 紧急不重要", quads.q3)}
        ${renderQuad("q4", "⚪ 不重要不紧急", quads.q4)}
      </div>
    </div>

    <!-- 校历日历 -->
    <div class="card" id="sub-calendar">
      <div class="card-title">📅 学校校历 <span class="sub">点击日期设置假期/备注（备注会出现在首页待办）</span></div>
      <div id="calContainer">${renderCalendar(Store.get("holidays", defaultHolidays()))}</div>
      <div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span style="font-size:12px;color:var(--ink-light)">批量添加放假日期：</span>
        <input type="date" class="inp" id="inpHoliday" style="width:140px">
        <input class="inp" id="inpHolidayName" placeholder="放假名称（如中秋节）" style="width:150px">
        <button class="btn btn-green-soft btn-sm" data-act="add-holiday">添加</button>
        <button class="btn btn-ghost btn-sm" data-act="reset-holidays">重置默认</button>
      </div>
    </div>

    <!-- 课程表 -->
    <div class="card" id="sub-timetable" data-sch-key="schedule">
      <div class="card-title">⏰ 作息课程表 <span class="sub">点击单元格编辑课程，点击时间编辑节次（课表独立栏目在侧边栏「课程表」）</span>
        <button class="btn btn-ghost btn-sm" data-act="reset-schedule">重置</button>
      </div>
      ${renderSchedule(Store.get("schedule", defaultSchedule()), Store.get("tempChanges", defaultTempChanges()))}
    </div>
    `;
  },
  after() {
    // 退休进度条（兼容旧版）
    const done = Store.get("dailyDone", {});
    const todos = Store.get("dailyTodos", defaultDailyTodos());
    const today = Today.now();
    const list = done[today] || [];
    const pct = todos.length ? Math.round(list.filter(x => x).length / todos.length * 100) : 0;
    const bar = document.getElementById("retireBar");
    if (bar) { bar.style.width = pct + "%"; document.getElementById("retirePct").textContent = pct + "%"; }

    bindCalEvents();
    bindScheduleEvents("schedule");
  }
});

function renderQuad(key, title, items) {
  return `<div class="quad ${key}">
    <h5>${title}</h5>
    <div id="quad-${key}">
      ${(items || []).map((it, i) => `<div class="quad-item ${it.done ? "done" : ""}">
        <input type="checkbox" data-act="quad-check" data-q="${key}" data-i="${i}" ${it.done ? "checked" : ""}>
        <span class="q-text">${esc(it.text)}</span>
        <span class="q-x" data-act="quad-del" data-q="${key}" data-i="${i}">✕</span></div>`).join("")}
    </div>
    <div class="quad-add">
      <input class="inp" id="inpQuad-${key}" placeholder="添加待办...">
      <button class="btn btn-primary btn-sm" data-act="quad-add" data-q="${key}">＋</button>
    </div>
  </div>`;
}

/* ---------- 校历日历 ---------- */
function renderCalendar(holidays) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y, m, 1);
  const startDow = first.getDay(); // 0=周日
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const weekNames = ["日", "一", "二", "三", "四", "五", "六"];
  const todayStr = Today.now();
  const notes = Store.get("calendarNotes", {});

  let html = `<div class="cal-head">
    <h4>${y}年${m + 1}月 · 校历</h4>
    <button class="btn btn-ghost btn-sm" data-act="cal-prev">◀ 上月</button>
    <span style="font-size:12px;color:var(--ink-light)">点击日期设置假期 / 备注</span>
    <button class="btn btn-ghost btn-sm" data-act="cal-next">下月 ▶</button>
  </div>`;
  html += `<div class="cal-grid">
    ${weekNames.map((w, i) => `<div class="cal-dow ${i === 0 || i === 6 ? "wk" : ""}">${w}</div>`).join("")}`;
  for (let i = 0; i < startDow; i++) html += `<div></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(y, m, d).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const hol = holidays[ds];
    const dayNotes = notes[ds] || [];
    const isToday = ds === todayStr;
    html += `<div class="cal-day ${isWeekend ? "weekend" : ""} ${hol ? "holiday" : ""} ${isToday ? "today" : ""}" data-date="${ds}">
      <span class="d-num">${d}</span>
      ${hol ? `<div class="d-tag hl">${esc(hol)}</div>` : isWeekend ? `<div class="d-tag">周末</div>` : ""}
      ${dayNotes.length ? `<div class="d-tag">📌 ${esc(dayNotes[0])}${dayNotes.length > 1 ? " +" + (dayNotes.length - 1) : ""}</div>` : ""}
      ${isToday ? `<div class="d-tag">今天</div>` : ""}
    </div>`;
  }
  html += `</div>`;
  return html;
}

let calOffset = 0;
function bindCalEvents() {
  document.querySelectorAll(".cal-day").forEach(el => {
    el.onclick = () => {
      const date = el.dataset.date;
      const holidays = Store.get("holidays", defaultHolidays());
      const notes = Store.get("calendarNotes", {});
      const curHol = holidays[date] || "";
      const curNotes = (notes[date] || []).join("、");
      openModal(`
        <p style="font-size:13px;color:var(--ink-light);margin-bottom:10px">📅 ${date} 校历设置</p>
        <label style="font-size:12px;color:var(--ink-light)">🏮 假期 / 节日标记</label>
        <input class="inp" id="inpCalHol" value="${esc(curHol)}" placeholder="如：中秋节 / 放假" style="margin-bottom:8px">
        <label style="font-size:12px;color:var(--ink-light)">📌 当日备注（自动进入首页待办）</label>
        <input class="inp" id="inpCalNote" value="${esc(curNotes)}" placeholder="如：开学典礼、交表截止" style="margin-bottom:4px">
        <p style="font-size:11.5px;color:var(--ink-light)">多条备注用顿号（、）分隔</p>`, "校历设置");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const hol = document.getElementById("inpCalHol").value.trim();
        const noteStr = document.getElementById("inpCalNote").value.trim();
        if (hol) holidays[date] = hol; else delete holidays[date];
        Store.set("holidays", holidays);
        if (noteStr) notes[date] = noteStr.split(/[、,，;；]/).map(x => x.trim()).filter(Boolean);
        else delete notes[date];
        Store.set("calendarNotes", notes);
        closeModal();
        rerenderCal();
        toast("✅ 校历已更新（备注已同步首页待办）");
      };
    };
  });
}
function rerenderCal() {
  const c = document.getElementById("calContainer");
  if (c) { c.innerHTML = renderCalendar(Store.get("holidays", defaultHolidays())); bindCalEvents(); }
}

/* ---------- 课程表（支持临时换课标注） ---------- */
function renderSchedule(sch, tempList) {
  const periods = sch.periods || [];
  const days = sch.days || [];
  const cells = sch.cells || {};
  const temps = (tempList || []).filter(t => t.date === Today.now());
  let html = `<div class="tbl-wrap"><table class="timetable"><tr><th style="width:110px">节次</th>`;
  days.forEach(d => html += `<th>${d}</th>`);
  html += `</tr>`;
  periods.forEach((p, pi) => {
    html += `<tr><td class="period" data-act="edit-period" data-i="${pi}" title="点击编辑时间">
      <div style="font-weight:700;font-size:13px">${esc(p.name)}</div><div style="font-size:10px;opacity:.85">${esc(p.start)}-${esc(p.end)}</div></td>`;
    days.forEach((d, di) => {
      const key = `${pi}-${di}`;
      const temp = temps.find(t => t.key === key);
      const val = temp ? temp.to : (cells[key] || "");
      html += `<td class="${temp ? "temp-cell temp-today" : val ? "" : "empty-cell"}" data-cell="${key}" data-pi="${pi}" data-di="${di}" title="点击编辑课程">
        ${temp ? `<div style="font-weight:700;font-size:14px">${esc(val)}</div><span class="tc-badge">🔁 换课</span>` : (val ? `<b style="font-size:14px">${esc(val)}</b>` : "＋")}</td>`;
    });
    html += `</tr>`;
  });
  html += `</table></div>`;
  return html;
}
/* 课程表图片参考（上传显示，对照手动填写，不自动识别） */
function renderScheduleImg(key) {
  const images = Store.get("scheduleImages", {});
  const img = images[key] || "";
  return `<div style="margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
      <span style="font-size:12px;color:var(--ink-light)">📷 课表图片参考（上传后对照手动填写）：</span>
      <label class="btn btn-ghost btn-sm" style="cursor:pointer">📤 上传图片
        <input type="file" accept="image/*" style="display:none" data-act="sch-img-upload" data-key="${key}">
      </label>
      ${img ? `<button class="btn btn-ghost btn-sm" data-act="sch-img-del" data-key="${key}">✕ 移除</button>` : ""}
    </div>
    ${img ? `<img src="${img}" style="max-width:100%;max-height:320px;border-radius:8px;border:1px solid var(--line);display:block;cursor:zoom-in" data-act="sch-img-view" data-src="${img}">` : ""}
  </div>`;
}
/* 课表图片上传/移除/放大事件 */
function bindScheduleImgEvents() {
  document.querySelectorAll("[data-act=sch-img-upload]").forEach(inp => {
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const key = inp.dataset.key;
      const rd = new FileReader();
      rd.onload = () => {
        compressImage(rd.result, 900, 0.72, (data) => {
          const images = Store.get("scheduleImages", {});
          images[key] = data;
          Store.set("scheduleImages", images);
          toast("✅ 课表图片已上传（对照手动填写）");
          rerenderTt();
        });
      };
      rd.readAsDataURL(f);
    };
  });
  document.querySelectorAll("[data-act=sch-img-del]").forEach(btn => {
    btn.onclick = () => {
      const images = Store.get("scheduleImages", {});
      delete images[btn.dataset.key];
      Store.set("scheduleImages", images);
      rerenderTt();
      toast("已移除课表图片");
    };
  });
  document.querySelectorAll("[data-act=sch-img-view]").forEach(img => {
    img.onclick = () => shViewImage(img.dataset.src);
  });
}
function bindScheduleEvents(key) {
  const k = key || "schedule";
  // 编辑课程
  document.querySelectorAll(`[data-sch-key="${k}"] td[data-cell]`).forEach(td => {
    td.onclick = () => {
      const cellKey = td.dataset.cell;
      const sch = Store.get(k, defaultSchedule());
      const cur = (sch.cells && sch.cells[cellKey]) || "";
      openModal(`<p style="font-size:13px;color:var(--ink-light);margin-bottom:10px">编辑课程内容（临时换课请在「课程表 → 临时换课」登记）</p>
        <input class="inp" id="inpCell" placeholder="如：道德与法治" value="${esc(cur)}" maxlength="12">`, "编辑课程");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const v = document.getElementById("inpCell").value.trim();
        if (v) { sch.cells = sch.cells || {}; sch.cells[cellKey] = v; }
        else if (sch.cells) delete sch.cells[cellKey];
        Store.set(k, sch);
        closeModal();
        rerenderSchedule(k);
      };
    };
  });
  // 编辑节次时间
  document.querySelectorAll(`[data-sch-key="${k}"] [data-act=edit-period]`).forEach(td => {
    td.onclick = (e) => {
      e.stopPropagation();
      const i = td.dataset.i;
      const sch = Store.get(k, defaultSchedule());
      const p = sch.periods[i];
      openModal(`
        <div class="grid-2" style="margin-bottom:8px">
          <div><label style="font-size:12px;color:var(--ink-light)">名称</label><input class="inp" id="inpPName" value="${esc(p.name)}"></div>
          <div><label style="font-size:12px;color:var(--ink-light)">开始</label><input class="inp" type="time" id="inpPStart" value="${esc(p.start)}"></div>
        </div>
        <div><label style="font-size:12px;color:var(--ink-light)">结束</label><input class="inp" type="time" id="inpPEnd" value="${esc(p.end)}"></div>`, "编辑节次");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        p.name = document.getElementById("inpPName").value.trim() || p.name;
        p.start = document.getElementById("inpPStart").value || p.start;
        p.end = document.getElementById("inpPEnd").value || p.end;
        Store.set(k, sch);
        closeModal();
        rerenderSchedule(k);
      };
    };
  });
}
function rerenderSchedule(key) {
  const k = key || "schedule";
  const sch = Store.get(k, defaultSchedule());
  const temps = Store.get("tempChanges", defaultTempChanges());
  document.querySelectorAll(`[data-sch-key="${k}"] .timetable`).forEach(tbl => {
    const wrap = tbl.closest(".tbl-wrap");
    if (wrap) {
      wrap.innerHTML = renderSchedule(sch, temps);
      bindScheduleEvents(k);
    }
  });
}

/* =========================================================
   模块2 · 备课助手
   ========================================================= */
registerModule("lesson", {
  title: "📚 备课助手",
  sub: "资源网站 · AI备课 · 公开课工具 · 一键直达",
  render() {
    const links = Store.get("links", defaultLinks());
    const cats = ["资源网站", "AI备课", "公开课工具", "自定义"];
    const byCat = {};
    cats.forEach(c => byCat[c] = links.filter(l => l.cat === c));
    let html = `
    <div class="mv-header"><h2 class="mv-title">📚 备课助手</h2>
      <p class="mv-sub">点击卡片一键打开网页，可自由添加常用工具</p></div>
    ${modToolbar("备课助手")}
    <div class="card" id="sub-links">
      <div class="card-title">🔗 快捷链接
        <button class="btn btn-primary btn-sm" data-act="add-link">＋ 添加链接</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        ${cats.map(c => `<button class="btn btn-ghost btn-sm" data-act="quick-add" data-cat="${c}">${c}</button>`).join("")}
      </div>`;
    cats.forEach(c => {
      const list = byCat[c] || [];
      html += `<h5 style="font-size:13px;color:var(--green-700);margin:14px 0 8px">▍${c}（${list.length}）</h5>`;
      html += `<div class="link-grid">`;
      list.forEach(l => html += `<div class="link-card" data-url="${esc(l.url)}" title="打开 ${esc(l.url)}">
        <span class="l-del" data-act="del-link" data-id="${l.id}">✕</span>
        <div class="l-ico">${esc(l.ico)}</div>
        <div class="l-name">${esc(l.name)}</div>
        <div class="l-cat">${esc(l.cat)}</div>
      </div>`);
      html += `</div>`;
    });
    html += `</div>`;
    return html;
  },
  after() {
    document.querySelectorAll(".link-card").forEach(card => {
      const open = (e) => {
        if (e.target.closest("[data-act=del-link]")) return;
        window.open(card.dataset.url, "_blank");
      };
      card.onclick = open;
    });
  }
});

/* =========================================================
   模块3 · 班级管理
   ========================================================= */
registerModule("class", {
  title: "🏫 班级管理",
  sub: "课程表 · 考勤 · 分贝 · 心愿瓶 · 座次 · 值日 · 班委 · 台账 · 积分",
  render() {
    return `
    <div class="mv-header"><h2 class="mv-title">🏫 班级管理</h2>
      <p class="mv-sub">${esc(classInfo().name)} · 学生 ${classInfo().studentCount} 人 · 14 项管理工具</p></div>
    ${modToolbar("班级管理")}
    <div class="big-tab-grid g3" id="classTabs">
      <div class="big-tab theme-teal active" data-tab="timetable"><span class="bt-ico">⏰</span><div><div class="bt-name">班级课程表</div><div class="bt-desc">一周课程 · 点击编辑</div></div></div>
      <div class="big-tab theme-blue" data-tab="attendance"><span class="bt-ico">📋</span><div><div class="bt-name">考勤记录</div><div class="bt-desc">迟到/缺勤/请假标记</div></div></div>
      <div class="big-tab theme-coral" data-tab="special-health"><span class="bt-ico">🚨</span><div><div class="bt-name">特异体质提醒</div><div class="bt-desc">病史 · 注意事项 · 诊断证明</div></div></div>
      <div class="big-tab theme-coral" data-tab="decibel"><span class="bt-ico">📢</span><div><div class="bt-name">早读分贝</div><div class="bt-desc">麦克风实时监测朗读</div></div></div>
      <div class="big-tab theme-gold" data-tab="bottle"><span class="bt-ico">🍯</span><div><div class="bt-name">班级心愿瓶</div><div class="bt-desc">星星解锁心愿</div></div></div>
      <div class="big-tab theme-rose" data-tab="coupon"><span class="bt-ico">🎟️</span><div><div class="bt-name">奖券打印</div><div class="bt-desc">自定义奖券卡片</div></div></div>
      <div class="big-tab theme-lav" data-tab="seats-edit"><span class="bt-ico">🪑</span><div><div class="bt-name">座位表编辑</div><div class="bt-desc">拖动排座 · 成绩分组</div></div></div>
      <div class="big-tab theme-lav" data-tab="seats-ai"><span class="bt-ico">🤖</span><div><div class="bt-name">AI自动排座</div><div class="bt-desc">输入需求智能排座</div></div></div>
      <div class="big-tab theme-teal" data-tab="duty"><span class="bt-ico">🧹</span><div><div class="bt-name">值日表</div><div class="bt-desc">8人一组 · 六岗分工</div></div></div>
      <div class="big-tab theme-blue" data-tab="committee"><span class="bt-ico">👥</span><div><div class="bt-name">班委分工</div><div class="bt-desc">名单与职责</div></div></div>
      <div class="big-tab theme-coral" data-tab="parent"><span class="bt-ico">📞</span><div><div class="bt-name">家长联系</div><div class="bt-desc">联系方式管理</div></div></div>
      <div class="big-tab theme-gold" data-tab="ledger"><span class="bt-ico">📓</span><div><div class="bt-name">学生台账</div><div class="bt-desc">沟通/习惯/表扬记录</div></div></div>
      <div class="big-tab theme-rose" data-tab="score"><span class="bt-ico">⭐</span><div><div class="bt-name">小组积分</div><div class="bt-desc">卫生/作业/课堂统计</div></div></div>
      <div class="big-tab theme-gold" data-tab="meeting"><span class="bt-ico">🎤</span><div><div class="bt-name">每周班会</div><div class="bt-desc">25节主题 · AI备课 · 生成PPT</div></div></div>
      <div class="big-tab theme-blue" data-tab="parentsmeeting"><span class="bt-ico">👨‍👩‍👧</span><div><div class="bt-name">家长会</div><div class="bt-desc">3场议程 · AI备课 · 成绩分析PPT</div></div></div>
    </div>
    <div id="classTabBody">${renderClassTimetable()}</div>
    `;
  },
  after() {
    bindClassTabs();
  }
});

function classInfo() {
  // 班主任班 = classes 里第一个（isHome 班），班级人数直接取该班花名册真实人数
  const home = (Store.get("classes", defaultClasses())[0] || { name: "1班" });
  const all = Store.get("students", {});
  const homeList = all[home.name] || [];
  const saved = Store.get("classInfo", {});
  return {
    name: saved.name || home.name,
    studentCount: saved.studentCount || homeList.length || 0
  };
}

function bindClassTabs() {
  const tabs = document.querySelectorAll("#classTabs .big-tab");
  tabs.forEach(t => {
    t.onclick = () => {
      tabs.forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      const body = document.getElementById("classTabBody");
      const map = {
        timetable: renderClassTimetable,
        attendance: renderAttendance,
        "special-health": renderSpecialHealth,
        decibel: renderDecibel,
        bottle: renderBottle,
        coupon: renderCoupon,
        "seats-edit": renderSeatsEdit,
        "seats-ai": renderSeatsAI,
        duty: renderDuty,
        committee: renderCommittee,
        parent: renderParentContacts,
        ledger: renderLedger,
        score: renderGroupScore,
        meeting: renderMeeting,
        parentsmeeting: renderParentsMeeting
      };
      body.innerHTML = map[t.dataset.tab]();
      bindTabActions(t.dataset.tab);
    };
  });
}

/* ---- 班级课程表（独立数据） ---- */
function renderClassTimetable() {
  const sch = Store.get("classSchedule", defaultSchedule());
  const temps = Store.get("tempChanges", defaultTempChanges());
  return `<div class="card">
    <div class="card-title">⏰ 班级课程表 <span class="sub">点击单元格编辑，临时换课自动高亮</span>
      <button class="btn btn-ghost btn-sm" data-act="ctt-download">⬇️ 下载</button>
      <button class="btn btn-ghost btn-sm" data-act="ctt-print">🖨️ 打印</button>
      <button class="btn btn-ghost btn-sm" data-act="reset-class-schedule">重置</button></div>
    <div class="timetable-wrap" data-sch-key="classSchedule">${renderSchedule(sch, temps)}</div>
  </div>`;
}

/* =========================================================
   模块2.5 · 课程表（独立侧边栏栏目）
   班主任课表 / 科任课表 / 临时换课管理
   ========================================================= */
registerModule("timetable", {
  title: "⏰ 课程表",
  sub: "班主任课表 · 科任课表 · 临时换课",
  render() {
    return `
    <div class="mv-header"><h2 class="mv-title">⏰ 课程表</h2>
      <p class="mv-sub">班主任课表与科任课表分开维护 · 临时换课暖色高亮、过期自动恢复</p></div>
    ${modToolbar("课程表")}
    <div class="big-tab-grid g3" id="ttTabs">
      <div class="big-tab theme-teal active" data-tttab="home"><span class="bt-ico">🏠</span><div><div class="bt-name">班主任课表</div><div class="bt-desc">本班一周课程 · 点击编辑</div></div></div>
      <div class="big-tab theme-blue" data-tttab="subject"><span class="bt-ico">📖</span><div><div class="bt-name">科任课表</div><div class="bt-desc">道法等任课安排 · 可编辑</div></div></div>
      <div class="big-tab theme-coral" data-tttab="temp"><span class="bt-ico">🔁</span><div><div class="bt-name">临时换课</div><div class="bt-desc">登记换课 · 到期自动恢复</div></div></div>
    </div>
    <div id="ttTabBody">${renderTtHome()}</div>`;
  },
  after() {
    const tabs = document.querySelectorAll("#ttTabs .big-tab");
    tabs.forEach(t => {
      t.onclick = () => {
        tabs.forEach(x => x.classList.remove("active"));
        t.classList.add("active");
        const body = document.getElementById("ttTabBody");
        const map = { home: renderTtHome, subject: renderTtSubject, temp: renderTtTemp };
        body.innerHTML = map[t.dataset.tttab]();
        bindTtTab(t.dataset.tttab);
      };
    });
    bindTtTab("home");
  }
});

/* 班主任课表（classSchedule + 临时换课高亮） */
function renderTtHome() {
  const sch = Store.get("classSchedule", defaultSchedule());
  const temps = Store.get("tempChanges", defaultTempChanges());
  return `<div class="card">
    <div class="card-title">🏠 班主任课表 <span class="sub">本班每天上什么课 · 点击单元格直接改课，点节次可改时间</span></div>
    ${renderScheduleImg("classSchedule")}
    <div class="timetable-wrap" data-sch-key="classSchedule">${renderSchedule(sch, temps)}</div>
    <div style="margin-top:10px;font-size:12px;color:var(--ink-light)">💡 老师临时换课会在当天单元格以 <span style="color:var(--coral);font-weight:700">🔁 换课</span> 暖色标注，日期过后自动恢复原课表。</div>
  </div>`;
}

/* 科任课表（subjectSchedule + 临时换课高亮） */
function renderTtSubject() {
  const sch = Store.get("subjectSchedule", defaultSubjectSchedule());
  const temps = Store.get("tempChanges", defaultTempChanges());
  return `<div class="card">
    <div class="card-title">📖 科任老师课表 <span class="sub">道法课分布（示例，可自行修改） · 点击单元格改课</span></div>
    ${renderScheduleImg("subjectSchedule")}
    <div class="timetable-wrap" data-sch-key="subjectSchedule">${renderSchedule(sch, temps)}</div>
    <div style="margin-top:10px;font-size:12px;color:var(--ink-light)">💡 此课表与班主任课表相互独立，分别编辑、互不影响。</div>
  </div>`;
}

/* 临时换课管理 */
function renderTtTemp() {
  const temps = Store.get("tempChanges", defaultTempChanges());
  const sch = Store.get("classSchedule", defaultSchedule());
  const periods = sch.periods || [];
  const days = sch.days || [];
  const today = Today.now();
  const periodOpts = periods.map((p, i) => `<option value="${i}">${esc(p.name)} ${esc(p.start)}</option>`).join("");
  const dayOpts = days.map((d, i) => `<option value="${i}">${esc(d)}</option>`).join("");
  return `<div class="card">
    <div class="card-title">🔁 临时换课登记 <span class="sub">填写后当天课表自动高亮显示</span></div>
    <div class="grid-2" style="margin-bottom:10px">
      <div><label style="font-size:12px;color:var(--ink-light)">换课日期</label>
        <input type="date" class="inp" id="inpTempDate" value="${today}" style="width:100%"></div>
      <div><label style="font-size:12px;color:var(--ink-light)">星期</label>
        <select class="sel" id="inpTempDow" style="width:100%">${dayOpts}</select></div>
      <div><label style="font-size:12px;color:var(--ink-light)">节次</label>
        <select class="sel" id="inpTempPeriod" style="width:100%">${periodOpts}</select></div>
      <div><label style="font-size:12px;color:var(--ink-light)">临时改为</label>
        <input class="inp" id="inpTempTo" placeholder="如：体育（老师开会）" style="width:100%"></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" data-act="temp-add">＋ 登记换课</button>
      <button class="btn btn-ghost btn-sm" data-act="temp-clear-past">🗑️ 清理已过期</button>
    </div>
    <div id="tempList" style="margin-top:12px">
      ${temps.length === 0 ? `<div class="empty"><span class="e-ico">🔁</span>暂无临时换课记录</div>` :
        temps.slice().reverse().map(t => {
          const [pi, di] = t.key.split("-");
          const p = periods[+pi], d = days[+di];
          return `<div class="temp-item ${t.date === today ? "today" : ""}">
            <span class="ti-date">${esc(t.date)}</span>
            <span style="min-width:110px;color:var(--green-800);font-weight:600">${esc(d || "?")} ${esc(p ? p.name : "?")}</span>
            <span class="ti-info">${esc(t.from || "原课")} <span class="ti-arrow">→</span> <b>${esc(t.to)}</b></span>
            ${t.note ? `<span class="badge badge-amber">${esc(t.note)}</span>` : ""}
            <button class="btn btn-danger btn-sm" data-act="temp-del" data-id="${esc(t.id)}">✕</button>
          </div>`;
        }).join("")}
    </div>
    <div style="margin-top:10px;font-size:12px;color:var(--ink-light);line-height:1.8">💡 登记的换课<b>只在当天</b>生效并高亮；日期一过自动恢复原课程，无需手动清理（也可用「清理已过期」一键删除）。</div>
  </div>`;
}

function bindTtTab(tab) {
  if (tab === "home") { bindScheduleEvents("classSchedule"); bindScheduleImgEvents(); }
  if (tab === "subject") { bindScheduleEvents("subjectSchedule"); bindScheduleImgEvents(); }
  if (tab === "temp") {
    document.querySelector("[data-act=temp-add]")?.addEventListener("click", () => {
      const date = document.getElementById("inpTempDate").value;
      const dow = document.getElementById("inpTempDow").value;
      const pi = document.getElementById("inpTempPeriod").value;
      const to = document.getElementById("inpTempTo").value.trim();
      if (!date || !to) { toast("请选择日期并填写「临时改为」内容"); return; }
      const key = pi + "-" + dow;
      const csch = Store.get("classSchedule", defaultSchedule());
      const ssch = Store.get("subjectSchedule", defaultSubjectSchedule());
      const from = (csch.cells && csch.cells[key]) || (ssch.cells && ssch.cells[key]) || "";
      const temps = Store.get("tempChanges", defaultTempChanges());
      temps.push({ id: uid(), date, key, from, to, note: "" });
      Store.set("tempChanges", temps);
      toast("🔁 换课已登记，当天课表自动高亮");
      rerenderTt();
    });
    document.querySelector("[data-act=temp-clear-past]")?.addEventListener("click", () => {
      const today = Today.now();
      const temps = Store.get("tempChanges", defaultTempChanges());
      const kept = temps.filter(t => t.date >= today);
      Store.set("tempChanges", kept);
      toast("已清理 " + (temps.length - kept.length) + " 条过期换课");
      rerenderTt();
    });
    document.querySelectorAll("[data-act=temp-del]").forEach(b => {
      b.onclick = () => {
        const temps = Store.get("tempChanges", defaultTempChanges());
        Store.set("tempChanges", temps.filter(t => t.id !== b.dataset.id));
        toast("已删除该换课记录");
        rerenderTt();
      };
    });
  }
}
function rerenderTt() {
  const body = document.getElementById("moduleView");
  if (body) { body.innerHTML = Modules.timetable.render(); Modules.timetable.after(); }
}

/* ---- 考勤记录 ---- */
function renderAttendance() {
  const att = Store.get("attendance", {});
  const today = Today.now();
  const students = getStudentNames();
  const rec = att[today] || {};
  const statusMap = { "": "未标", late: "迟到", absent: "缺勤", leave: "请假" };
  const colorMap = { "": "", late: "#F6A623", absent: "#C0564D", leave: "#3A6B9B" };
  let html = `<div class="card">
    <div class="card-title">📋 学生考勤记录 <span class="sub">${today} · 点击学生标记状态</span>
      <button class="btn btn-primary btn-sm" data-act="att-save">保存记录</button>
      <button class="btn btn-ghost btn-sm" data-act="att-download">⬇️ 下载</button>
      <button class="btn btn-ghost btn-sm" data-act="att-print">🖨️ 打印</button>
    </div>
    <div style="display:flex;gap:14px;margin-bottom:12px;font-size:12.5px;flex-wrap:wrap">
      <span><span style="display:inline-block;width:12px;height:12px;background:#F6A623;border-radius:3px"></span> 迟到</span>
      <span><span style="display:inline-block;width:12px;height:12px;background:#C0564D;border-radius:3px"></span> 缺勤</span>
      <span><span style="display:inline-block;width:12px;height:12px;background:#3A6B9B;border-radius:3px"></span> 请假</span>
      <button class="btn btn-ghost btn-sm" data-act="att-clear">清除今日</button>
    </div>
    <div class="tbl-wrap"><table class="tbl"><tr><th class="num" style="width:40px">#</th><th>姓名</th><th>状态</th></tr>`;
  const names = students.length ? students : ["（请先在「学生信息」中导入花名册）"];
  names.forEach((n, i) => {
    const st = rec[n] || "";
    html += `<tr><td class="num">${i + 1}</td><td>${esc(n)}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">${["late", "absent", "leave"].map(k => `
        <button class="btn btn-sm ${st === k ? "btn-primary" : "btn-ghost"}" data-act="att-set" data-name="${esc(n)}" data-k="${k}">${statusMap[k]}</button>`).join("")}
        ${st ? `<span class="badge" style="background:${colorMap[st]};color:#fff">已标记：${statusMap[st]}</span>` : ""}
      </td></tr>`;
  });
  html += `</table></div></div>`;
  return html;
}

/* ---- 特异体质提醒 ---- */
function getSpecialHealth() {
  const list = Store.get("specialHealth", []);
  return Array.isArray(list) ? list : [];
}
function saveSpecialHealth(list) {
  Store.set("specialHealth", Array.isArray(list) ? list : []);
}
/* 渲染某学生的图片组（家长说明 / 诊断证明），返回缩略图网格 */
function renderShImgs(imgs, label) {
  const arr = Array.isArray(imgs) ? imgs : [];
  if (!arr.length) {
    return `<div style="margin:5px 0;font-size:12px;color:var(--ink-light)">📎 ${label}：暂无</div>`;
  }
  return `<div style="margin:6px 0">
    <div style="font-size:12px;color:var(--ink-light);margin-bottom:4px">📎 ${label}（${arr.length} 张）：</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${arr.map(src => `<img src="${src}" data-act="sh-img" alt="${label}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--line);cursor:zoom-in;background:#f0f0f0">`).join("")}
    </div>
  </div>`;
}
/* 渲染某学生的全部请假记录（同步请假登记 leaveRecords） */
function renderShLeave(name) {
  const list = (Store.get("leaveRecords", []) || []).filter(r => r && r.name === name);
  if (!list.length) return "";
  const rows = list.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .map(r => `<div style="font-size:12.5px;color:var(--ink-light)">📮 ${esc(r.start || "")} ~ ${esc(r.end || "")} · ${esc(r.type || "")} · ${esc(r.status || "")}${r.reason ? " · " + esc(r.reason) : ""}</div>`)
    .join("");
  return `<div style="margin:6px 0;padding:8px 10px;background:#FBF7F0;border-radius:8px;font-size:12px"><b>📮 请假记录（同步考勤数据 · 共 ${list.length} 条）：</b>${rows}</div>`;
}
function renderSpecialHealth() {
  const list = getSpecialHealth();
  let cards = "";
  list.forEach(r => {
    cards += `
    <div class="card sh-card" style="border:1px solid #F3D3CF;margin-bottom:12px;box-shadow:0 1px 4px rgba(192,57,43,.06)">
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px">
        <b style="font-size:16px;color:#C0392B">🚨 ${esc(r.name || "")}</b>
        <span class="badge" style="background:#C0392B;color:#fff">${esc(r.cls || "")}</span>
        <span class="badge" style="background:#FBE9E7;color:#C0392B">${esc(r.illness || "")}</span>
        <span style="margin-left:auto;display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" data-act="sh-edit" data-id="${esc(r.id)}">编辑</button>
          <button class="btn btn-danger btn-sm" data-act="sh-del" data-id="${esc(r.id)}">删除</button>
        </span>
      </div>
      ${r.note ? `<div style="margin:8px 0 2px;font-size:13.5px;line-height:1.7"><b>⚠️ 注意事项：</b>${esc(r.note)}</div>` : ""}
      ${renderShImgs(r.parentImgs, "家长手写情况说明")}
      ${renderShImgs(r.hospitalImgs, "医院诊断证明")}
      ${renderShLeave(r.name)}
    </div>`;
  });
  return `<div class="card">
    <div class="card-title">🚨 特异体质提醒 <span class="sub">病史 · 注意事项 · 家长说明 · 诊断证明 · 长期保存</span>
      <button class="btn btn-primary btn-sm" data-act="sh-add">＋ 新增记录</button>
      <button class="btn btn-ghost btn-sm" data-act="sh-print">🖨️ 打印</button>
    </div>
    <div style="font-size:12.5px;color:#C0564D;margin-bottom:12px;line-height:1.7">⚠️ 以下学生有特殊体质，请在教学、体育、活动、饮食等场景特别留意。点击图片可放大、下载；「🖨️ 打印」可导出全部记录（图片自动放大）。</div>
    ${cards || `<div class="empty"><span class="e-ico">🍃</span>暂无记录 · 点击「＋ 新增记录」添加</div>`}
  </div>`;
}

/* ---- 早读分贝 ---- */
function renderDecibel() {
  const hist = Store.get("dbHistory", []);
  return `<div class="card">
    <div class="card-title">📢 早读分贝监测 <span class="sub">开启麦克风检测班级朗读声音</span></div>
    <div class="db-meter">
      <div class="db-status" id="dbStatus">● 未开始监测</div>
      <div class="db-value"><span id="dbValue">0</span><small> dB</small></div>
      <div class="db-bar"><div class="db-bar-in" id="dbBarIn" style="width:0%"></div></div>
      <div class="db-btns">
        <button class="db-btn start" id="dbStart">▶ 开始监测</button>
        <button class="db-btn stop" id="dbStop" disabled>⏹ 停止监测</button>
      </div>
      <div class="db-history" id="dbHistory"></div>
    </div>
    <div style="margin-top:10px;font-size:12px;color:var(--ink-light)">
      💡 参考：< 40dB 太安静了 · 40-60dB 正常朗读 · 60-75dB 声音洪亮 · > 75dB 注意不要喧哗
    </div>
  </div>`;
}

/* ---- 心愿瓶 ---- */
function renderBottle() {
  const b = Store.get("bottle", defaultBottle());
  const unlockedCount = b.wishes.filter(w => w.unlocked).length;
  return `<div class="card">
    <div class="card-title">🍯 班级心愿瓶 <span class="sub">集星星解锁心愿</span></div>
    <div class="bottle-box" style="margin:0 auto;max-width:300px">
      <span class="bottle-emoji">${unlockedCount >= b.wishes.filter(w=>w.unlocked).length && b.wishes.length>0 && unlockedCount===b.wishes.length ? "🎉🍯" : "🍯"}</span>
      <div class="bottle-stars">⭐ 星星总数：<b style="font-size:18px">${b.stars}</b></div>
      <div class="bottle-progress"><div class="bottle-progress-in" id="bottleProg"></div></div>
      <div style="font-size:11.5px;color:var(--ink-light)">已解锁 ${unlockedCount} / ${b.wishes.length} 个心愿</div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:10px">
        <button class="btn btn-primary btn-sm" data-act="bottle-add-star">＋星星 +1</button>
        <button class="btn btn-ghost btn-sm" data-act="bottle-add5">＋星星 +5</button>
        <button class="btn btn-ghost btn-sm" data-act="bottle-add-wish">＋心愿</button>
      </div>
    </div>
    <div class="bottle-wishes" id="bottleWishes">
      ${b.wishes.map((w, i) => `
      <div class="wish-item ${w.unlocked ? "" : "locked"}">
        <span class="wish-name">${w.unlocked ? "🔓" : "🔒"} ${esc(w.name)}</span>
        <span class="wish-cost">${w.cost}⭐</span>
        <span style="display:flex;gap:4px">
          <button class="btn btn-sm ${w.unlocked ? "btn-primary" : "btn-ghost"}" data-act="bottle-toggle" data-i="${i}" ${w.cost > b.stars && !w.unlocked ? "disabled" : ""}>${w.unlocked ? "已解锁" : "解锁"}</button>
          <button class="btn btn-sm btn-danger" data-act="bottle-del" data-i="${i}">✕</button>
        </span>
      </div>`).join("")}
    </div>
  </div>`;
}

/* ---- 奖券打印 ---- */
function renderCoupon() {
  const coupons = Store.get("coupons", defaultCoupons());
  return `<div class="card">
    <div class="card-title">🎟️ 自定义奖券卡片 <span class="sub">可打印发放给学生</span>
      <button class="btn btn-primary btn-sm" data-act="coupon-add">＋ 新建奖券</button>
      <button class="btn btn-ghost btn-sm" data-act="coupon-print">🖨️ 打印</button>
    </div>
    <div class="grid-3" id="couponGrid">
      ${coupons.map((c, i) => `
      <div class="coupon-card">
        <span class="cp-tag">${esc(c.tag)}</span>
        <div class="cp-title">${esc(c.title)}</div>
        <div class="cp-desc">${esc(c.desc)}</div>
        <div style="margin-top:8px;font-size:10.5px;color:#B7791F">★ 品德银行 · 以币换券 ★</div>
        <div style="display:flex;gap:6px;justify-content:center;margin-top:8px">
          <button class="btn btn-ghost btn-sm" data-act="coupon-edit" data-i="${i}">编辑</button>
          <button class="btn btn-danger btn-sm" data-act="coupon-del" data-i="${i}">删除</button>
        </div>
      </div>`).join("")}
    </div>
  </div>`;
}

/* ---- 座位表编辑（拖动模式） ---- */
function renderSeatsEdit() {
  const seats = Store.get("seats", []);
  const saved = Store.get("seatLayout", {});
  const students = getStudents();
  const cols = Store.get("seatCols", 6);
  if (seats.length === 0 && students.length === 0) {
    return `<div class="card"><div class="card-title">🪑 座次表
      <button class="btn btn-primary btn-sm" data-act="seat-import">📊 导入 Excel 排座</button>
      <button class="btn btn-ghost btn-sm" data-act="seat-reset">清空</button></div>
      <div class="empty"><span class="e-ico">🪑</span>
      还没有座次数据。点击「导入 Excel 排座」，上传含<b>姓名、性别、成绩、学习小组</b>的表格，即可按<b>成绩 / 学习小组 / 男女搭配</b>自动排座。<br>
      排好后可拖动学生卡片微调，男生蓝色、女生粉色区分。</div>
    </div>`;
  }
  // 用保存的布局或默认顺序
  const order = saved.order || seats;
  const rows = Math.ceil(order.length / cols);
  const gList = seatGroupOrderList(order);
  const gChips = gList.map(g => {
    const c = groupColorOf(g) || { bg: "#F0F0F0", border: "#999" };
    return `<span class="grp-chip" style="background:${c.bg};border:1.5px solid ${c.border};color:${c.border}">${esc(g)}</span>`;
  }).join("");
  let html = `<div class="card">
    <div class="card-title">🪑 座次表 <span class="sub">${order.length} 人 · ${gList.length} 个小组</span>
      <button class="btn btn-primary btn-sm" data-act="seat-import">📊 导入 Excel</button>
      <button class="btn btn-ghost btn-sm" data-act="seat-save">💾 保存布局</button>
      <button class="btn btn-primary btn-sm" data-act="seat-rotate">🔄 滚动换座</button>
      <button class="btn btn-ghost btn-sm" data-act="seat-rotate-all">🚚 仅组间</button>
      <button class="btn btn-ghost btn-sm" data-act="seat-rotate-in">🔁 仅组内</button>
      <button class="btn btn-ghost btn-sm" data-act="seat-image">📷 导出图片</button>
      <button class="btn btn-ghost btn-sm" data-act="seat-download">⬇️ 下载</button>
      <button class="btn btn-ghost btn-sm" data-act="seat-print">🖨️ 打印</button>
      <button class="btn btn-ghost btn-sm" data-act="seat-reset">清空</button>
    </div>
    <div style="font-size:11.5px;color:var(--ink-light);margin-bottom:10px;line-height:2">
      <span style="color:#3A6B9B">■ 男生</span> <span style="color:#C0668A;margin-left:8px">■ 女生</span>
      <span style="margin-left:12px">小组颜色：</span>${gChips || "<span>暂无（导入含「小组」列的表格自动着色）</span>"}
    </div>
    <div style="text-align:center;margin:0 auto 10px;max-width:420px">
      <div style="background:#F6EEDD;border:1px solid #DCC99A;border-radius:8px;padding:8px;font-size:13px;font-weight:700;color:#8A6D3B">📚 讲 台</div>
    </div>
    <div class="seat-grid" id="seatGrid" style="grid-template-columns:repeat(${cols},1fr)">
      ${order.map((s, i) => renderSeatCell(s, i)).join("")}
    </div>
    <div style="font-size:12px;color:var(--ink-light);margin-top:10px">💡 「🔄 滚动换座」= 小组整体平移到下一组位置 + 组内成员轮换（小组永不打散）；也可单独点「仅组间」或「仅组内」。手机上<b>长按学生卡片</b>即可拖动换座。</div>
  </div>`;
  return html;
}
/* 学习小组 → 颜色（10 色调色板，按组序稳定分配：9 个小组 9 种颜色不重复） */
const SEAT_PALETTE = [
  { bg: "#EAF3FB", border: "#3E7CB1" }, { bg: "#FDF3E3", border: "#D98E23" },
  { bg: "#E9F7EC", border: "#3E9B63" }, { bg: "#F3EAFB", border: "#8657C9" },
  { bg: "#FDECEC", border: "#D2504E" }, { bg: "#FFF6DA", border: "#A8871B" },
  { bg: "#E4F5F5", border: "#289494" }, { bg: "#FBEAF2", border: "#C64E8D" },
  { bg: "#EEEAF6", border: "#6B5B95" }, { bg: "#EAF0F4", border: "#5C7A99" }
];
/* 当前座位数据里出现的小组，按稳定顺序排列（优先用导入时保存的组序） */
function seatGroupOrderList(order) {
  const arr = order || [];
  const seen = new Set();
  arr.forEach(s => { if (s && s.group) seen.add(s.group); });
  const out = [];
  (Store.get("seatGroupList", []) || []).forEach(g => {
    if (seen.has(g)) { out.push(g); seen.delete(g); }
  });
  arr.forEach(s => { if (s && s.group && seen.has(s.group)) { out.push(s.group); seen.delete(s.group); } });
  return out;
}
function groupColorOf(group) {
  if (!group) return null;
  const order = (Store.get("seatLayout", { order: [] }).order) || Store.get("seats", []);
  const idx = seatGroupOrderList(order).indexOf(group);
  if (idx >= 0) return SEAT_PALETTE[idx % SEAT_PALETTE.length];
  let h = 0;
  for (let i = 0; i < group.length; i++) h = (h * 31 + group.charCodeAt(i)) % 9973;
  return SEAT_PALETTE[h % SEAT_PALETTE.length];
}
function renderSeatCell(s, idx) {
  const gradeClass = s.grade ? `grade-${s.grade}` : "";
  const genderClass = s.gender === "男" ? "male" : s.gender === "女" ? "female" : "";
  const gb = { A: "gb-A", B: "gb-B", C: "gb-C", D: "gb-D" }[s.grade] || "";
  const gc = groupColorOf(s.group);
  const groupStyle = gc ? `border:2px solid ${gc.border};background:${gc.bg}` : "";
  return `<div class="seat-cell ${gradeClass} ${genderClass}" draggable="true" data-idx="${idx}" data-name="${esc(s.name)}" style="${groupStyle}">
    ${s.grade ? `<span class="s-grade-badge ${gb}">${s.grade}</span>` : ""}
    ${s.group ? `<div style="font-size:9px;font-weight:700;color:${gc.border}">${esc(s.group)}</div>` : ""}
    <div class="s-name">${esc(s.name)}</div>
    <div class="s-info">${esc(s.gender || "")}${s.score != null ? " · " + s.score + "分" : ""}</div>
  </div>`;
}

/* ---- AI自动排座（需求输入 + 智能排座） ---- */
function renderSeatsAI() {
  const students = getStudents();
  const seats = Store.get("aiSeats", []);
  const cols = Store.get("seatCols", 6);
  const lastReq = Store.get("aiSeatReq", "");
  if (students.length === 0) {
    return `<div class="card"><div class="card-title">🤖 AI自动排座</div>
      <div class="empty"><span class="e-ico">🪑</span>
      还没有学生数据。请先在「学生信息」导入花名册（含姓名、性别、成绩），AI 排座会根据您的需求自动生成座位表。</div>
    </div>`;
  }
  let seatsHtml = "";
  if (seats.length > 0) {
    const rows = Math.ceil(seats.length / cols);
    seatsHtml = `<div style="margin-top:16px">
      <div style="font-size:11.5px;color:var(--ink-light);margin-bottom:10px">
        <span style="color:#3A6B9B">■ 男生</span> <span style="color:#C0668A;margin-left:8px">■ 女生</span>
        <span class="badge badge-green" style="margin-left:12px">优秀</span>
        <span class="badge badge-blue" style="margin-left:4px">良好</span>
        <span class="badge badge-amber" style="margin-left:4px">中等</span>
        <span class="badge badge-red" style="margin-left:4px">待提升</span>
      </div>
      <div class="seat-grid" id="aiSeatGrid" style="grid-template-columns:repeat(${cols},1fr)">
        ${seats.map((s, i) => renderSeatCell(s, i)).join("")}
      </div>
    </div>`;
  }
  return `<div class="card">
    <div class="card-title">🤖 AI自动排座 <span class="sub">输入排座需求 · 智能生成座位表</span>
      <button class="btn btn-ghost btn-sm" data-act="ai-seat-download">⬇️ 下载</button>
      <button class="btn btn-ghost btn-sm" data-act="ai-seat-print">🖨️ 打印</button>
      <button class="btn btn-ghost btn-sm" data-act="ai-seat-reset">清空</button>
    </div>
    <div style="background:var(--green-50);border-radius:10px;padding:14px;margin-bottom:14px">
      <label class="lbl" style="display:block;font-size:13px;margin-bottom:6px;color:var(--ink-soft)">📝 输入您的排座需求</label>
      <textarea class="tarea" id="aiSeatReq" rows="3" style="width:100%;margin-bottom:10px" placeholder="例如：按身高从低到高排列、成绩好中差四人一组搭配、男女交替、纪律差的学生放前排、好朋友不要坐在一起...">${esc(lastReq)}</textarea>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <button class="btn btn-ghost btn-sm" data-act="ai-req-tpl" data-tpl="按身高从低到高排列">📏 按身高</button>
        <button class="btn btn-ghost btn-sm" data-act="ai-req-tpl" data-tpl="成绩好中差四人一组搭配">📊 成绩分组</button>
        <button class="btn btn-ghost btn-sm" data-act="ai-req-tpl" data-tpl="男女交替排列">👫 男女交替</button>
        <button class="btn btn-ghost btn-sm" data-act="ai-req-tpl" data-tpl="纪律差的学生放前排，成绩好的和成绩差的搭配">⚠️ 纪律+帮扶</button>
        <button class="btn btn-ghost btn-sm" data-act="ai-req-tpl" data-tpl="按成绩排名蛇形排列，第一名和最后一名同桌">🐍 蛇形排座</button>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:12px;color:var(--ink-light)">每排人数：</span>
        <input type="number" class="inp" id="aiSeatCols" value="${cols}" min="3" max="12" style="width:70px">
        <button class="btn btn-primary btn-sm" data-act="ai-seat-go" style="margin-left:auto">🤖 开始排座</button>
      </div>
    </div>
    <div style="font-size:12px;color:var(--ink-light);margin-bottom:10px">
      💡 共 ${students.length} 名学生 · AI 会根据您的需求自动排座，生成后可在「座位表编辑」中拖动微调
    </div>
    ${seatsHtml}
  </div>`;
}

/* ---- 值日表 ---- */
function renderDuty() {
  const roles = Store.get("dutyRoles", defaultDutyRoles());
  const groups = Store.get("dutyGroups", []);
  const students = getStudentNames();
  const allPeople = groups.length ? groups : [students];
  let html = `<div class="card">
    <div class="card-title">🧹 值日表 <span class="sub">每组8人 · 按职责分工</span>
      <button class="btn btn-primary btn-sm" data-act="duty-auto">⚡ 自动生成</button>
      <button class="btn btn-ghost btn-sm" data-act="duty-print">🖨️ 打印</button>
    </div>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <span style="font-size:12px;color:var(--ink-light)">每组人数：</span>
      <input type="number" class="inp" id="inpDutySize" value="${roles.reduce((a, r) => a + r.count, 0)}" style="width:70px" min="1">
      <span style="font-size:12px;color:var(--ink-light)">职责说明：</span>
      <span style="font-size:12px;color:var(--ink-light)">${roles.map(r => `${r.ico}${r.role}×${r.count}`).join(" · ")}</span>
    </div>
    <div class="duty-grid">
      ${allPeople.map((g, gi) => `
      <div class="duty-group">
        <div class="dg-head">第 ${gi + 1} 组${gi === 0 ? "（本周）" : ""}</div>
        <div class="dg-body">
          ${roles.map((r, ri) => {
            const personIdx = roles.slice(0, ri).reduce((a, x) => a + x.count, 0);
            const persons = [];
            for (let k = 0; k < r.count; k++) {
              const p = g[personIdx + k];
              persons.push(p ? `<input class="inline-edit" style="width:100%;text-align:left" data-duty-person data-g="${gi}" data-ri="${ri}" data-k="${k}" value="${esc(p)}">` : `<input class="inline-edit" style="width:100%;text-align:left" data-duty-person data-g="${gi}" data-ri="${ri}" data-k="${k}" placeholder="—">`);
            }
            return `<div class="duty-role"><span class="r-name">${r.ico} ${r.role}</span><span style="flex:1;margin-left:8px;display:flex;flex-direction:column;gap:1px">${persons.join("")}</span></div>`;
          }).join("")}
        </div>
      </div>`).join("")}
    </div>
  </div>`;
  return html;
}

/* ---- 班委 ---- */
function renderCommittee() {
  const list = Store.get("committee", defaultCommittees());
  return `<div class="card">
    <div class="card-title">👥 班委名单及职责分工
      <button class="btn btn-primary btn-sm" data-act="committee-add">＋ 添加职位</button>
      <button class="btn btn-ghost btn-sm" data-act="com-download">⬇️ 下载</button>
      <button class="btn btn-ghost btn-sm" data-act="com-print">🖨️ 打印</button>
    </div>
    <div class="tbl-wrap"><table class="tbl"><tr><th style="width:60px">#</th><th style="width:120px">职位</th><th style="width:110px">姓名</th><th>职责分工</th><th style="width:70px">操作</th></tr>
      ${list.map((c, i) => `<tr>
        <td class="num">${i + 1}</td>
        <td><input class="inline-edit" data-committee-field data-i="${i}" data-f="role" value="${esc(c.role)}"></td>
        <td><input class="inline-edit" data-committee-field data-i="${i}" data-f="person" value="${esc(c.person)}" placeholder="填写姓名"></td>
        <td><input class="inline-edit" data-committee-field data-i="${i}" data-f="duty" value="${esc(c.duty)}"></td>
        <td><button class="btn btn-danger btn-sm" data-act="committee-del" data-i="${i}">✕</button></td>
      </tr>`).join("")}
    </table></div>
    <div style="margin-top:8px;font-size:12px;color:var(--ink-light)">💡 直接修改表格内容自动保存</div>
  </div>`;
}

/* ---- 家长联系方式 ---- */
function renderParentContacts() {
  const list = Store.get("parentContacts", []);
  return `<div class="card">
    <div class="card-title">📞 家长联系方式
      <button class="btn btn-primary btn-sm" data-act="parent-add">＋ 添加</button>
      <button class="btn btn-ghost btn-sm" data-act="parent-import">📥 粘贴导入</button>
      <button class="btn btn-ghost btn-sm" data-act="par-download">⬇️ 下载</button>
      <button class="btn btn-ghost btn-sm" data-act="par-print">🖨️ 打印</button>
    </div>
    ${list.length === 0 ? `<div class="empty"><span class="e-ico">📞</span>暂无家长联系方式，点击「＋ 添加」或「粘贴导入」批量添加</div>` : `
    <div class="tbl-wrap"><table class="tbl"><tr><th>学生</th><th>家长姓名</th><th>关系</th><th>电话</th><th>备注</th><th style="width:70px">操作</th></tr>
      ${list.map((p, i) => `<tr>
        <td><input class="inline-edit" data-parent-field data-i="${i}" data-f="student" value="${esc(p.student)}"></td>
        <td><input class="inline-edit" data-parent-field data-i="${i}" data-f="name" value="${esc(p.name)}"></td>
        <td><input class="inline-edit" data-parent-field data-i="${i}" data-f="rel" value="${esc(p.rel || "")}" style="width:60px"></td>
        <td><input class="inline-edit" data-parent-field data-i="${i}" data-f="phone" value="${esc(p.phone)}"></td>
        <td><input class="inline-edit" data-parent-field data-i="${i}" data-f="note" value="${esc(p.note || "")}"></td>
        <td><button class="btn btn-danger btn-sm" data-act="parent-del" data-i="${i}">✕</button></td>
      </tr>`).join("")}
    </table></div>`}
  </div>`;
}

/* ---- 学生台账 ---- */
function renderLedger() {
  const records = Store.get("ledger", []);
  const typeMap = { talk: "沟通", habit: "习惯问题", conflict: "冲突", criticize: "批评", praise: "表扬" };
  const typeColor = { talk: "badge-blue", habit: "badge-amber", conflict: "badge-red", criticize: "badge-red", praise: "badge-green" };
  return `<div class="card">
    <div class="card-title">📓 学生台账 <span class="sub">记录沟通、习惯问题、冲突、批评、表扬</span>
      <button class="btn btn-primary btn-sm" data-act="ledger-add">＋ 添加记录</button>
    </div>
    ${records.length === 0 ? `<div class="empty"><span class="e-ico">📓</span>暂无台账记录</div>` : `
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      ${["talk", "habit", "conflict", "criticize", "praise"].map(t => `
        <button class="btn btn-sm btn-ghost" data-act="ledger-filter" data-t="${t}">${typeMap[t]}</button>`).join("")}
      <button class="btn btn-sm btn-ghost" data-act="ledger-filter" data-t="all">全部</button>
    </div>
    <div id="ledgerList">
      ${records.slice().reverse().map((r, ri) => `
      <div class="comm-item" data-ledger-type="${r.type}">
        <div class="ci-head">
          <span><span class="badge ${typeColor[r.type]}">${typeMap[r.type] || r.type}</span> ${esc(r.student || "")}</span>
          <span>${esc(r.date || "")}<button class="btn btn-danger btn-sm" style="margin-left:8px" data-act="ledger-del" data-id="${r.id}">✕</button></span>
        </div>
        <div class="ci-text">${esc(r.text)}</div>
      </div>`).join("")}
    </div>`}
  </div>`;
}

/* ---- 小组积分 ---- */
function renderGroupScore() {
  const groups = Store.get("scoreGroups", []);
  const cols = Store.get("scoreCols", defaultScoreCols());
  let html = `<div class="card">
    <div class="card-title">⭐ 小组积分统计 <span class="sub">从卫生、作业、课堂、纪律等维度统计</span>
      <button class="btn btn-primary btn-sm" data-act="score-add-group">＋ 添加小组</button>
      <button class="btn btn-ghost btn-sm" data-act="score-add-col">＋ 添加维度</button>
      <button class="btn btn-ghost btn-sm" data-act="score-reset">清零</button>
    </div>`;
  if (!groups.length) {
    html += `<div class="empty"><span class="e-ico">⭐</span>暂无小组，点击「＋ 添加小组」开始统计</div>`;
  } else {
    html += `<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      ${cols.map((c, ci) => `<span class="badge badge-green">${esc(c)}</span>`).join("")}
    </div>`;
    groups.forEach((g, gi) => {
      const total = cols.reduce((a, c) => a + (g[c] || 0), 0);
      html += `<div class="score-row">
        <input class="inline-edit" data-score-name data-i="${gi}" value="${esc(g.name)}" style="min-width:80px;font-weight:700">
        <div class="g-cols">
          ${cols.map(c => `<span class="g-col">${esc(c)} <b>${g[c] || 0}</b>
            <button class="g-plus" data-act="score-plus" data-g="${gi}" data-c="${esc(c)}">＋</button>
            <button class="g-min" data-act="score-min" data-g="${gi}" data-c="${esc(c)}">－</button></span>`).join("")}
        </div>
        <span class="badge badge-green" style="font-size:13px">总分 <b>${total}</b></span>
        <button class="btn btn-danger btn-sm" data-act="score-del-group" data-i="${gi}">✕</button>
      </div>`;
    });
    html += `<div style="margin-top:10px;font-size:12px;color:var(--ink-light)">💡 点击 ＋/－ 增减积分，自动保存</div>`;
  }
  html += `</div>`;
  return html;
}
