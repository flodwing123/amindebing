/* =========================================================
   功能模块 · 第二部分
   班级管理事件绑定 / 模块4 作业提效 / 模块5 学生信息
   模块6 家校沟通 / 模块7 荣誉登记
   ========================================================= */

/* ---------- 学生数据工具（与模块5共享） ---------- */
let currentQuotes = null; // 每日金句面板当前展示的 50 条（"换一批"后同步更新）
function getStudents() {
  const all = Store.get("students", {});
  const cls = (Store.get("classes", defaultClasses())[0] || { name: "701班" }).name;
  return all[cls] || [];
}
function getStudentNames() { return getStudents().map(s => s.name); }
function allStudents() {
  return Object.values(Store.get("students", {})).flat();
}
function saveStudents(list, className) {
  const all = Store.get("students", {});
  all[className] = list;
  Store.set("students", all);
}

/* =========================================================
   班级管理 · 各 Tab 事件绑定
   ========================================================= */
function bindTabActions(tab) {
  const body = document.getElementById("classTabBody");
  if (!body) return;

  /* ---- 课程表 ---- */
  if (tab === "timetable") {
    bindScheduleEvents("classSchedule");
    document.querySelector("[data-act=reset-class-schedule]")?.addEventListener("click", () => {
      Store.del("classSchedule");
      toast("已重置为默认课程表");
      body.innerHTML = renderClassTimetable();
      bindScheduleEvents("classSchedule");
    });
    document.querySelector("[data-act=ctt-download]")?.addEventListener("click", () => exportScopeToCSV("班级课程表", "#classTabBody"));
    document.querySelector("[data-act=ctt-print]")?.addEventListener("click", () => window.print());
  }

  /* ---- 考勤 ---- */
  if (tab === "attendance") {
    body.querySelectorAll("[data-act=att-set]").forEach(btn => {
      btn.onclick = () => {
        const att = Store.get("attendance", {});
        const today = Today.now();
        att[today] = att[today] || {};
        const name = btn.dataset.name;
        const k = btn.dataset.k;
        if (att[today][name] === k) delete att[today][name];
        else att[today][name] = k;
        Store.set("attendance", att);
        body.innerHTML = renderAttendance();
        bindTabActions("attendance");
        toast("考勤已更新");
      };
    });
    document.querySelector("[data-act=att-save]")?.addEventListener("click", () => {
      toast("✅ 考勤记录已保存到本地");
    });
    document.querySelector("[data-act=att-clear]")?.addEventListener("click", () => {
      const att = Store.get("attendance", {});
      delete att[Today.now()];
      Store.set("attendance", att);
      body.innerHTML = renderAttendance();
      bindTabActions("attendance");
      toast("已清除今日考勤");
    });
    document.querySelector("[data-act=att-download]")?.addEventListener("click", () => exportScopeToCSV("考勤记录_" + Today.now(), "#classTabBody"));
    document.querySelector("[data-act=att-print]")?.addEventListener("click", () => window.print());
  }

  /* ---- 分贝 ---- */
  if (tab === "decibel") bindDecibel();

  /* ---- 心愿瓶 ---- */
  if (tab === "bottle") {
    const b = Store.get("bottle", defaultBottle());
    const prog = document.getElementById("bottleProg");
    if (prog) {
      const next = b.wishes.filter(w => !w.unlocked).sort((x, y) => x.cost - y.cost)[0];
      const target = next ? next.cost : 1;
      prog.style.width = Math.min(100, Math.round(b.stars / target * 100)) + "%";
    }
    document.querySelector("[data-act=bottle-add-star]")?.addEventListener("click", () => addBottleStars(1));
    document.querySelector("[data-act=bottle-add5]")?.addEventListener("click", () => addBottleStars(5));
    document.querySelector("[data-act=bottle-add-wish]")?.addEventListener("click", () => {
      openModal(`<p style="font-size:13px;color:var(--ink-light);margin-bottom:10px">设置新心愿</p>
        <input class="inp" id="inpWishName" placeholder="心愿名称（如：免一次作业）" style="margin-bottom:8px">
        <input class="inp" type="number" id="inpWishCost" placeholder="所需星星数" min="1" value="10">`, "添加心愿");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const name = document.getElementById("inpWishName").value.trim();
        const cost = parseInt(document.getElementById("inpWishCost").value) || 10;
        if (name) {
          const b2 = Store.get("bottle", defaultBottle());
          b2.wishes.push({ id: uid(), name, cost, unlocked: false });
          Store.set("bottle", b2);
          toast("心愿已添加");
        }
        closeModal();
        body.innerHTML = renderBottle();
        bindTabActions("bottle");
      };
    });
    body.querySelectorAll("[data-act=bottle-toggle]").forEach(btn => {
      btn.onclick = () => {
        const i = btn.dataset.i;
        const b2 = Store.get("bottle", defaultBottle());
        const w = b2.wishes[i];
        if (w.unlocked) { w.unlocked = false; toast("已重新锁定"); }
        else {
          if (b2.stars < w.cost) { toast("星星不足，继续加油！"); return; }
          w.unlocked = true;
          b2.stars -= w.cost;
          toast("🎉 心愿解锁：" + w.name);
        }
        Store.set("bottle", b2);
        body.innerHTML = renderBottle();
        bindTabActions("bottle");
      };
    });
    body.querySelectorAll("[data-act=bottle-del]").forEach(btn => {
      btn.onclick = () => {
        const i = btn.dataset.i;
        const b2 = Store.get("bottle", defaultBottle());
        b2.wishes.splice(i, 1);
        Store.set("bottle", b2);
        body.innerHTML = renderBottle();
        bindTabActions("bottle");
      };
    });
  }

  /* ---- 奖券 ---- */
  if (tab === "coupon") {
    body.querySelectorAll("[data-act=coupon-add]").forEach(b => b.onclick = couponEdit(-1));
    body.querySelectorAll("[data-act=coupon-edit]").forEach(b => b.onclick = () => couponEdit(+b.dataset.i));
    body.querySelectorAll("[data-act=coupon-del]").forEach(b => {
      b.onclick = () => {
        const coupons = Store.get("coupons", defaultCoupons());
        coupons.splice(+b.dataset.i, 1);
        Store.set("coupons", coupons);
        body.innerHTML = renderCoupon();
        bindTabActions("coupon");
      };
    });
    document.querySelector("[data-act=coupon-print]")?.addEventListener("click", () => window.print());
  }

  /* ---- 座次 ---- */
  if (tab === "seats-edit") {
    bindSeatEvents();
    document.querySelector("[data-act=seat-print]")?.addEventListener("click", () => window.print());
  }
  if (tab === "seats-ai") bindSeatAIEvents();

  /* ---- 值日 ---- */
  if (tab === "duty") bindDutyEvents();

  /* ---- 班委 ---- */
  if (tab === "committee") {
    document.querySelector("[data-act=committee-add]")?.addEventListener("click", () => {
      const list = Store.get("committee", defaultCommittees());
      list.push({ role: "新职位", person: "", duty: "填写职责" });
      Store.set("committee", list);
      body.innerHTML = renderCommittee();
      bindTabActions("committee");
    });
    body.querySelectorAll("[data-committee-field]").forEach(inp => {
      inp.onchange = () => {
        const list = Store.get("committee", defaultCommittees());
        list[+inp.dataset.i][inp.dataset.f] = inp.value;
        Store.set("committee", list);
      };
    });
    body.querySelectorAll("[data-act=committee-del]").forEach(b => {
      b.onclick = () => {
        const list = Store.get("committee", defaultCommittees());
        list.splice(+b.dataset.i, 1);
        Store.set("committee", list);
        body.innerHTML = renderCommittee();
        bindTabActions("committee");
      };
    });
    document.querySelector("[data-act=com-download]")?.addEventListener("click", () => exportScopeToCSV("班委分工", "#classTabBody"));
    document.querySelector("[data-act=com-print]")?.addEventListener("click", () => window.print());
  }

  /* ---- 家长联系 ---- */
  if (tab === "parent") {
    bindParentEvents();
    document.querySelector("[data-act=par-download]")?.addEventListener("click", () => exportScopeToCSV("家长联系方式", "#classTabBody"));
    document.querySelector("[data-act=par-print]")?.addEventListener("click", () => window.print());
  }

  /* ---- 台账 ---- */
  if (tab === "ledger") {
    document.querySelector("[data-act=ledger-add]")?.addEventListener("click", () => {
      openModal(`
        <select class="inp" id="inpLedgerType" style="margin-bottom:8px">
          <option value="talk">💬 沟通</option><option value="habit">📌 习惯问题</option>
          <option value="conflict">⚡ 冲突</option><option value="criticize">⚠️ 批评</option>
          <option value="praise">🌟 表扬</option>
        </select>
        <input class="inp" id="inpLedgerStudent" placeholder="学生姓名" style="margin-bottom:8px">
        <input class="inp" id="inpLedgerDate" type="date" value="${Today.now()}" style="margin-bottom:8px">
        <textarea class="tarea" id="inpLedgerText" placeholder="记录内容..." rows="3" style="width:100%"></textarea>`, "添加台账记录");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const r = {
          id: uid(),
          type: document.getElementById("inpLedgerType").value,
          student: document.getElementById("inpLedgerStudent").value.trim(),
          date: document.getElementById("inpLedgerDate").value,
          text: document.getElementById("inpLedgerText").value.trim()
        };
        if (r.text || r.student) {
          const records = Store.get("ledger", []);
          records.push(r);
          Store.set("ledger", records);
          toast("台账已添加");
        }
        closeModal();
        body.innerHTML = renderLedger();
        bindTabActions("ledger");
      };
    });
    body.querySelectorAll("[data-act=ledger-filter]").forEach(b => {
      b.onclick = () => {
        const t = b.dataset.t;
        body.querySelectorAll("[data-ledger-type]").forEach(el => {
          el.style.display = (t === "all" || el.dataset.ledgerType === t) ? "" : "none";
        });
      };
    });
    body.querySelectorAll("[data-act=ledger-del]").forEach(b => {
      b.onclick = () => {
        const records = Store.get("ledger", []);
        Store.set("ledger", records.filter(r => r.id !== b.dataset.id));
        body.innerHTML = renderLedger();
        bindTabActions("ledger");
      };
    });
  }

  /* ---- 小组积分 ---- */
  if (tab === "score") bindScoreEvents();
  if (tab === "meeting") bindMeetingEvents();
  if (tab === "parentsmeeting") bindParentsMeetingEvents();
}

function addBottleStars(n) {
  const b = Store.get("bottle", defaultBottle());
  b.stars += n;
  Store.set("bottle", b);
  const body = document.getElementById("classTabBody");
  if (body) { body.innerHTML = renderBottle(); bindTabActions("bottle"); }
  toast(`⭐ +${n} 星星`);
}

/* ---- 奖券编辑 ---- */
function couponEdit(idx) {
  return () => {
    const coupons = Store.get("coupons", defaultCoupons());
    const c = idx >= 0 ? coupons[idx] : { title: "", desc: "", tag: "奖励" };
    openModal(`
      <input class="inp" id="inpCpTitle" placeholder="奖券名称（如：免作业券）" value="${esc(c.title)}" style="margin-bottom:8px">
      <input class="inp" id="inpCpDesc" placeholder="用途说明" value="${esc(c.desc)}" style="margin-bottom:8px">
      <input class="inp" id="inpCpTag" placeholder="标签（如：特惠/特权/奖励）" value="${esc(c.tag)}">`, idx >= 0 ? "编辑奖券" : "新建奖券");
    const ok = document.querySelector("[data-act=modal-ok]");
    ok.onclick = () => {
      const nc = {
        id: c.id || uid(),
        title: document.getElementById("inpCpTitle").value.trim(),
        desc: document.getElementById("inpCpDesc").value.trim(),
        tag: document.getElementById("inpCpTag").value.trim() || "奖励"
      };
      if (!nc.title) { toast("请输入奖券名称"); return; }
      if (idx >= 0) coupons[idx] = nc; else coupons.push(nc);
      Store.set("coupons", coupons);
      closeModal();
      const body = document.getElementById("classTabBody");
      body.innerHTML = renderCoupon();
      bindTabActions("coupon");
    };
  };
}

/* ---- 座次表事件 ---- */
function bindSeatEvents() {
  const body = document.getElementById("classTabBody");
  const grid = document.getElementById("seatGrid");
  if (!grid) return;

  // 拖拽
  let dragEl = null;
  grid.querySelectorAll(".seat-cell").forEach(cell => {
    cell.addEventListener("dragstart", e => { dragEl = cell; cell.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; });
    cell.addEventListener("dragend", () => { cell.classList.remove("dragging"); dragEl = null; });
    cell.addEventListener("dragover", e => e.preventDefault());
    cell.addEventListener("drop", e => {
      e.preventDefault();
      if (dragEl && dragEl !== cell) {
        const saved = Store.get("seatLayout", { order: Store.get("seats", []) });
        const order = saved.order;
        const i1 = +dragEl.dataset.idx, i2 = +cell.dataset.idx;
        [order[i1], order[i2]] = [order[i2], order[i1]];
        saved.order = order;
        Store.set("seatLayout", saved);
        body.innerHTML = renderSeatsEdit();
        bindSeatEvents();
      }
    });
  });

  document.querySelector("[data-act=seat-import]")?.addEventListener("click", () => {
    const students = getStudents();
    if (!students.length) {
      toast("请先在「学生信息」导入花名册和成绩");
      return;
    }
    generateSeatsFromScores();
  });
  document.querySelector("[data-act=seat-save]")?.addEventListener("click", () => {
    const saved = Store.get("seatLayout", {});
    const order = [];
    grid.querySelectorAll(".seat-cell").forEach(c => {
      const name = c.dataset.name;
      const stu = studentsOfName(name);
      order.push(stu);
    });
    saved.order = order;
    Store.set("seatLayout", saved);
    toast("💾 座次布局已保存");
  });
  document.querySelector("[data-act=seat-download]")?.addEventListener("click", () => {
    const saved = Store.get("seatLayout", { order: Store.get("seats", []) });
    const cols = Store.get("seatCols", 6);
    let txt = "第" + (grid ? 1 : 1) + "排\t";
    const rows = [];
    saved.order.forEach((s, i) => {
      if (i % cols === 0) rows.push([]);
      rows[rows.length - 1].push(`${s.name}(${s.gender || ""}${s.score != null ? "," + s.score : ""})`);
    });
    const lines = rows.map((r, ri) => `第${ri + 1}排：` + r.join("　"));
    downloadFile("座次表.txt", "【座次表】\n" + lines.join("\n"));
    toast("已下载座次表");
  });
  document.querySelector("[data-act=seat-reset]")?.addEventListener("click", () => {
    if (confirm("确定清空座次表吗？")) {
      Store.del("seatLayout");
      Store.del("seats");
      body.innerHTML = renderSeatsEdit();
      bindSeatEvents();
    }
  });
}
function studentsOfName(name) {
  return allStudents().find(s => s.name === name) || { name, gender: "", score: null, grade: "" };
}
/* 成绩自动排座：好中差四人一组（首尾蛇形） */
function generateSeatsFromScores() {
  const students = getStudents().filter(s => s.score != null && s.score !== "");
  if (students.length < 4) { toast("成绩数据不足4人，无法分组"); return; }
  const sorted = students.slice().sort((a, b) => b.score - a.score);
  // 分档
  const n = sorted.length;
  const gradeOf = (i) => {
    const p = i / n;
    if (p < 0.25) return "A";
    if (p < 0.5) return "B";
    if (p < 0.75) return "C";
    return "D";
  };
  sorted.forEach((s, i) => { s.grade = gradeOf(i); });
  // 首尾蛇形配对成4人组：第1名、第2名(中)、倒数第1、倒数第2...
  const groups = [];
  const used = new Set();
  let front = 0, back = n - 1;
  const mids = sorted.slice(Math.floor(n / 4), Math.ceil(n * 3 / 4)).map(s => s.name);
  let midIdx = 0;
  while (front <= back) {
    const g = [];
    if (front <= back) g.push(sorted[front++]);
    if (front <= back) g.push(sorted[back--]);
    // 补2个中等生
    let added = 0;
    while (midIdx < mids.length && added < 2) {
      const mn = mids[midIdx++];
      if (!g.some(x => x.name === mn)) { const ms = sorted.find(s => s.name === mn); if (ms) g.push(ms); added++; }
    }
    while (g.length < 4 && front <= back) g.push(sorted[front++]);
    groups.push(g);
  }
  // 组内蛇形排布
  let final = [];
  groups.forEach((g, gi) => {
    if (gi % 2 === 1) g = g.slice().reverse();
    final = final.concat(g);
  });
  Store.set("seats", final);
  Store.del("seatLayout");
  const body = document.getElementById("classTabBody");
  body.innerHTML = renderSeatsEdit();
  bindSeatEvents();
  toast("✅ 已按成绩好中差自动排座（四人一组）");
}

/* ---- AI自动排座事件 + 逻辑 ---- */
function bindSeatAIEvents() {
  const body = document.getElementById("classTabBody");

  /* 需求模板快速填入 */
  body.querySelectorAll("[data-act=ai-req-tpl]").forEach(btn => {
    btn.onclick = () => {
      const ta = document.getElementById("aiSeatReq");
      if (ta) ta.value = btn.dataset.tpl;
    };
  });

  /* 开始排座 */
  document.querySelector("[data-act=ai-seat-go]")?.addEventListener("click", () => {
    const req = (document.getElementById("aiSeatReq") || {}).value || "";
    const cols = parseInt((document.getElementById("aiSeatCols") || {}).value) || 6;
    const students = getStudents();
    if (!students.length) { toast("请先在「学生信息」导入花名册"); return; }
    Store.set("aiSeatReq", req);
    Store.set("seatCols", cols);
    const result = aiArrangeSeats(students, req, cols);
    Store.set("aiSeats", result);
    body.innerHTML = renderSeatsAI();
    bindSeatAIEvents();
    toast("🤖 AI 排座完成！可在「座位表编辑」中拖动微调");
  });

  /* 下载 / 打印 / 清空 */
  document.querySelector("[data-act=ai-seat-download]")?.addEventListener("click", () => {
    const seats = Store.get("aiSeats", []);
    const cols = Store.get("seatCols", 6);
    if (!seats.length) { toast("请先生成排座结果"); return; }
    const rows = [];
    seats.forEach((s, i) => {
      if (i % cols === 0) rows.push([]);
      rows[rows.length - 1].push(s.name + (s.gender ? "(" + s.gender + ")" : "") + (s.score != null ? "," + s.score + "分" : ""));
    });
    const lines = rows.map((r, ri) => "第" + (ri + 1) + "排：" + r.join("  "));
    downloadFile("AI排座表.txt", "【AI自动排座表】\n排座需求：" + (Store.get("aiSeatReq", "") || "无") + "\n\n" + lines.join("\n"));
    toast("已下载 AI 排座表");
  });
  document.querySelector("[data-act=ai-seat-print]")?.addEventListener("click", () => window.print());
  document.querySelector("[data-act=ai-seat-reset]")?.addEventListener("click", () => {
    if (confirm("确定清空 AI 排座结果吗？")) {
      Store.del("aiSeats");
      Store.del("aiSeatReq");
      body.innerHTML = renderSeatsAI();
      bindSeatAIEvents();
      toast("已清空");
    }
  });
}

/* AI 排座核心算法：根据需求文本智能排座 */
function aiArrangeSeats(students, req, cols) {
  /* 克隆学生数据，添加排序辅助字段 */
  let arr = students.map(s => ({
    name: s.name || "",
    gender: s.gender || "",
    score: (s.score != null && s.score !== "") ? Number(s.score) : null,
    grade: s.grade || ""
  }));

  /* 获取违纪记录，计算每人违纪次数 */
  const disc = Store.get("disciplineRecords", []);
  const discCount = {};
  disc.forEach(r => {
    if (r.name) discCount[r.name] = (discCount[r.name] || 0) + 1;
  });
  arr.forEach(s => { s.discCount = discCount[s.name] || 0; });

  const r = req.toLowerCase();
  const has = (kw) => r.indexOf(kw) >= 0;

  /* 策略1：成绩好中差分组搭配 */
  if (has("成绩") && (has("分组") || has("搭配") || has("好中差") || has("一组"))) {
    return aiSeatByGrade(arr, cols);
  }

  /* 策略2：蛇形排列（按成绩排名） */
  if (has("蛇形") || has("蛇")) {
    return aiSeatSnake(arr, cols);
  }

  /* 策略3：男女交替 */
  if (has("男女") && (has("交替") || has("排列"))) {
    return aiSeatGenderAlt(arr, cols);
  }

  /* 策略4：纪律差的前排 + 帮扶搭配 */
  if (has("纪律") || has("前排")) {
    return aiSeatDiscipline(arr, cols);
  }

  /* 策略5：按身高（无身高数据时按成绩倒序，成绩好 = 坐后面） */
  if (has("身高")) {
    arr.sort((a, b) => (b.score || 0) - (a.score || 0));
    assignGrades(arr);
    return arr;
  }

  /* 策略6：按成绩排名（默认） */
  if (has("成绩") || has("排名") || has("排序")) {
    arr.sort((a, b) => (b.score || 0) - (a.score || 0));
    assignGrades(arr);
    return arr;
  }

  /* 默认：成绩好中差分组搭配 */
  return aiSeatByGrade(arr, cols);
}

/* 成绩分档 */
function assignGrades(arr) {
  const n = arr.length;
  arr.forEach((s, i) => {
    const p = i / n;
    s.grade = p < 0.25 ? "A" : p < 0.5 ? "B" : p < 0.75 ? "C" : "D";
  });
}

/* 策略1：成绩好中差四人一组搭配 */
function aiSeatByGrade(arr, cols) {
  const sorted = arr.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
  assignGrades(sorted);
  const n = sorted.length;
  const groups = [];
  let front = 0, back = n - 1;
  const mids = sorted.slice(Math.floor(n / 4), Math.ceil(n * 3 / 4));
  let midIdx = 0;
  while (front <= back) {
    const g = [];
    if (front <= back) g.push(sorted[front++]);
    if (front <= back) g.push(sorted[back--]);
    let added = 0;
    while (midIdx < mids.length && added < 2) {
      const ms = mids[midIdx++];
      if (!g.some(x => x.name === ms.name)) { g.push(ms); added++; }
    }
    while (g.length < 4 && front <= back) g.push(sorted[front++]);
    groups.push(g);
  }
  let final = [];
  groups.forEach((g, gi) => {
    if (gi % 2 === 1) g = g.slice().reverse();
    final = final.concat(g);
  });
  return final;
}

/* 策略2：蛇形排列 */
function aiSeatSnake(arr, cols) {
  const sorted = arr.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
  assignGrades(sorted);
  const n = sorted.length;
  const rows = Math.ceil(n / cols);
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx < n) row.push(sorted[idx]);
    }
    /* 偶数行正序，奇数行逆序（蛇形） */
    if (r % 2 === 1) row.reverse();
    grid.push(row);
  }
  return grid.flat();
}

/* 策略3：男女交替排列 */
function aiSeatGenderAlt(arr, cols) {
  const males = arr.filter(s => s.gender === "男").sort((a, b) => (b.score || 0) - (a.score || 0));
  const females = arr.filter(s => s.gender === "女").sort((a, b) => (b.score || 0) - (a.score || 0));
  const result = [];
  let mi = 0, fi = 0;
  while (mi < males.length || fi < females.length) {
    if (mi < males.length) result.push(males[mi++]);
    if (fi < females.length) result.push(females[fi++]);
  }
  assignGrades(result);
  return result;
}

/* 策略4：纪律差的前排 + 成绩帮扶搭配 */
function aiSeatDiscipline(arr, cols) {
  /* 违纪多的坐前排，成绩好的和差的搭配 */
  arr.sort((a, b) => (b.discCount || 0) - (a.discCount || 0));
  /* 前1/3纪律多的，后2/3按成绩好中差搭配 */
  const n = arr.length;
  const front = arr.slice(0, Math.ceil(n / 3));
  const rest = arr.slice(Math.ceil(n / 3));
  const mixed = aiSeatByGrade(rest, cols);
  assignGrades(front);
  return front.concat(mixed);
}

/* ---- 值日表事件 ---- */
function bindDutyEvents() {
  const body = document.getElementById("classTabBody");
  // 行内编辑保存
  body.querySelectorAll("[data-duty-person]").forEach(inp => {
    inp.onchange = () => {
      const groups = Store.get("dutyGroups", []);
      const g = groups[+inp.dataset.g];
      if (g) {
        const roles = Store.get("dutyRoles", defaultDutyRoles());
        let idx = 0;
        for (let r = 0; r < +inp.dataset.ri; r++) idx += roles[r].count;
        idx += +inp.dataset.k;
        g[idx] = inp.value.trim();
        Store.set("dutyGroups", groups);
      }
    };
  });
  document.querySelector("[data-act=duty-auto]")?.addEventListener("click", () => {
    const students = getStudentNames();
    if (!students.length) { toast("请先在「学生信息」导入花名册"); return; }
    const roles = Store.get("dutyRoles", defaultDutyRoles());
    const size = roles.reduce((a, r) => a + r.count, 0);
    const shuffled = students.slice().sort(() => Math.random() - 0.5);
    const groups = [];
    for (let i = 0; i < shuffled.length; i += size) {
      groups.push(shuffled.slice(i, i + size));
    }
    Store.set("dutyGroups", groups);
    body.innerHTML = renderDuty();
    bindDutyEvents();
    toast("⚡ 值日表已自动生成（随机分组）");
  });
  document.querySelector("[data-act=duty-print]")?.addEventListener("click", () => window.print());
}

/* ---- 家长联系事件 ---- */
function bindParentEvents() {
  const body = document.getElementById("classTabBody");
  document.querySelector("[data-act=parent-add]")?.addEventListener("click", () => {
    const list = Store.get("parentContacts", []);
    list.push({ student: "", name: "", rel: "爸爸", phone: "", note: "" });
    Store.set("parentContacts", list);
    body.innerHTML = renderParentContacts();
    bindParentEvents();
  });
  document.querySelector("[data-act=parent-import]")?.addEventListener("click", () => {
    openModal(`<p style="font-size:12.5px;color:var(--ink-light);margin-bottom:8px">每行一条：学生姓名,家长姓名,关系,电话,备注（逗号分隔）</p>
      <textarea class="tarea" id="inpParentCSV" rows="8" style="width:100%" placeholder="张三,张爸爸,爸爸,13800000000,&#10;李四,李妈妈,妈妈,13900000000,"></textarea>`, "粘贴导入家长联系方式");
    const ok = document.querySelector("[data-act=modal-ok]");
    ok.onclick = () => {
      const raw = document.getElementById("inpParentCSV").value.trim();
      if (!raw) return;
      const list = Store.get("parentContacts", []);
      raw.split("\n").forEach(line => {
        const parts = line.split(/[,，\t]/).map(x => x.trim());
        if (parts[0]) list.push({ student: parts[0], name: parts[1] || "", rel: parts[2] || "", phone: parts[3] || "", note: parts[4] || "" });
      });
      Store.set("parentContacts", list);
      closeModal();
      body.innerHTML = renderParentContacts();
      bindParentEvents();
      toast("✅ 已导入 " + list.length + " 条家长信息");
    };
  });
  body.querySelectorAll("[data-parent-field]").forEach(inp => {
    inp.onchange = () => {
      const list = Store.get("parentContacts", []);
      list[+inp.dataset.i][inp.dataset.f] = inp.value;
      Store.set("parentContacts", list);
    };
  });
  body.querySelectorAll("[data-act=parent-del]").forEach(b => {
    b.onclick = () => {
      const list = Store.get("parentContacts", []);
      list.splice(+b.dataset.i, 1);
      Store.set("parentContacts", list);
      body.innerHTML = renderParentContacts();
      bindParentEvents();
    };
  });
}

/* ---- 小组积分事件 ---- */
function bindScoreEvents() {
  const body = document.getElementById("classTabBody");
  const cols = Store.get("scoreCols", defaultScoreCols());
  const groups = Store.get("scoreGroups", []);
  document.querySelector("[data-act=score-add-group]")?.addEventListener("click", () => {
    const gs = Store.get("scoreGroups", []);
    const obj = { name: `第${gs.length + 1}组` };
    cols.forEach(c => obj[c] = 0);
    gs.push(obj);
    Store.set("scoreGroups", gs);
    body.innerHTML = renderGroupScore();
    bindScoreEvents();
  });
  document.querySelector("[data-act=score-add-col]")?.addEventListener("click", () => {
    openModal(`<input class="inp" id="inpScoreCol" placeholder="维度名称（如：阅读）">`, "添加统计维度");
    const ok = document.querySelector("[data-act=modal-ok]");
    ok.onclick = () => {
      const name = document.getElementById("inpScoreCol").value.trim();
      if (name) {
        const cs = Store.get("scoreCols", defaultScoreCols());
        if (!cs.includes(name)) cs.push(name);
        Store.set("scoreCols", cs);
        const gs = Store.get("scoreGroups", []);
        gs.forEach(g => { if (g[name] === undefined) g[name] = 0; });
        Store.set("scoreGroups", gs);
      }
      closeModal();
      body.innerHTML = renderGroupScore();
      bindScoreEvents();
    };
  });
  document.querySelector("[data-act=score-reset]")?.addEventListener("click", () => {
    const gs = Store.get("scoreGroups", []);
    gs.forEach(g => Object.keys(g).forEach(k => { if (k !== "name") g[k] = 0; }));
    Store.set("scoreGroups", gs);
    body.innerHTML = renderGroupScore();
    bindScoreEvents();
    toast("已清零");
  });
  body.querySelectorAll("[data-score-name]").forEach(inp => {
    inp.onchange = () => {
      const gs = Store.get("scoreGroups", []);
      gs[+inp.dataset.i].name = inp.value;
      Store.set("scoreGroups", gs);
    };
  });
  body.querySelectorAll("[data-act=score-plus],[data-act=score-min]").forEach(b => {
    b.onclick = () => {
      const gs = Store.get("scoreGroups", []);
      const g = gs[+b.dataset.g];
      if (!g) return;
      const c = b.dataset.c;
      g[c] = (g[c] || 0) + (b.dataset.act === "score-plus" ? 1 : -1);
      Store.set("scoreGroups", gs);
      body.innerHTML = renderGroupScore();
      bindScoreEvents();
    };
  });
  body.querySelectorAll("[data-act=score-del-group]").forEach(b => {
    b.onclick = () => {
      const gs = Store.get("scoreGroups", []);
      gs.splice(+b.dataset.i, 1);
      Store.set("scoreGroups", gs);
      body.innerHTML = renderGroupScore();
      bindScoreEvents();
    };
  });
}

/* ---- 分贝计（Web Audio API） ---- */
let dbCtx = null, dbAnalyser = null, dbRaf = null, dbStream = null;
function bindDecibel() {
  const startBtn = document.getElementById("dbStart");
  const stopBtn = document.getElementById("dbStop");
  const status = document.getElementById("dbStatus");
  const valueEl = document.getElementById("dbValue");
  const barEl = document.getElementById("dbBarIn");
  const histEl = document.getElementById("dbHistory");
  const hist = Store.get("dbHistory", []);
  if (histEl) {
    histEl.innerHTML = hist.slice(-8).map(h => `<div>${esc(h.t)} ｜ ${h.db} dB ｜ ${esc(h.label)}</div>`).join("");
  }
  if (!startBtn) return;
  startBtn.onclick = async () => {
    try {
      dbStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      dbCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = dbCtx.createMediaStreamSource(dbStream);
      dbAnalyser = dbCtx.createAnalyser();
      dbAnalyser.fftSize = 1024;
      src.connect(dbAnalyser);
      status.textContent = "● 监测中...";
      status.style.color = "#D8F3DC";
      startBtn.disabled = true;
      stopBtn.disabled = false;
      const data = new Uint8Array(dbAnalyser.frequencyBinCount);
      let quietTime = 0;
      const tick = () => {
        dbAnalyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const db = Math.round(20 * Math.log10(Math.max(avg, 1)) + 40);
        const clamped = Math.max(0, Math.min(100, db));
        valueEl.textContent = db;
        barEl.style.width = clamped + "%";
        // 状态判断
        if (db < 30) { status.textContent = "🔇 太安静了，请大声朗读！"; quietTime++; }
        else if (db < 55) { status.textContent = "🔉 朗读声有点小，再大声些！"; quietTime++; }
        else if (db < 75) { status.textContent = "🔊 声音洪亮，继续加油！"; quietTime = 0; }
        else { status.textContent = "📢 非常棒！注意不要变成喧哗哦"; quietTime = 0; }
        if (quietTime >= 30 && quietTime % 30 === 0) {
          const h = Store.get("dbHistory", []);
          h.push({ t: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), db, label: "提醒朗读" });
          Store.set("dbHistory", h.slice(-30));
          if (histEl) histEl.innerHTML = h.slice(-8).map(x => `<div>${esc(x.t)} ｜ ${x.db} dB ｜ ${esc(x.label)}</div>`).join("");
        }
        dbRaf = requestAnimationFrame(tick);
      };
      tick();
      toast("🎤 麦克风已开启");
    } catch (e) {
      toast("⚠️ 无法访问麦克风，请检查权限");
      console.error(e);
    }
  };
  stopBtn.onclick = () => {
    if (dbRaf) cancelAnimationFrame(dbRaf);
    if (dbStream) { dbStream.getTracks().forEach(t => t.stop()); dbStream = null; }
    if (dbCtx) { dbCtx.close(); dbCtx = null; }
    startBtn.disabled = false;
    stopBtn.disabled = true;
    status.textContent = "● 已停止监测";
    valueEl.textContent = "0";
    barEl.style.width = "0%";
    const h = Store.get("dbHistory", []);
    h.push({ t: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), db: 0, label: "监测结束" });
    Store.set("dbHistory", h.slice(-30));
    toast("⏹ 已停止监测");
  };
}

/* =========================================================
   模块4 · 作业提效
   ========================================================= */
registerModule("homework", {
  title: "📝 作业提效",
  sub: "5个班作业/背书/默写登记 · 家校批改 · 每日50条反馈金句",
  render() {
    const classes = Store.get("classes", defaultClasses());
    const hw = Store.get("hwRecords", {});
    const today = Today.now();
    const date = new Date(today);
    const quotes = getDailyQuotes(date);
    let html = `
    <div class="mv-header"><h2 class="mv-title">📝 作业提效</h2>
      <p class="mv-sub">${esc(today)} · 今天是 ${quotes.length} 条金句可供反馈</p></div>
    ${modToolbar("作业提效")}
    <div class="big-tab-grid g2" id="hwTabs">
      <div class="big-tab theme-teal active" data-hwtab="hw"><span class="bt-ico">📚</span><div><div class="bt-name">作业登记</div><div class="bt-desc">5班勾选表</div></div></div>
      <div class="big-tab theme-blue" data-hwtab="board"><span class="bt-ico">📊</span><div><div class="bt-name">统计看板</div><div class="bt-desc">3次不交/全勤</div></div></div>
      <div class="big-tab theme-gold" data-hwtab="recite"><span class="bt-ico">📖</span><div><div class="bt-name">背书登记</div><div class="bt-desc">背诵过关记录</div></div></div>
      <div class="big-tab theme-coral" data-hwtab="dict"><span class="bt-ico">✍️</span><div><div class="bt-name">默写登记</div><div class="bt-desc">默写过关记录</div></div></div>
      <div class="big-tab theme-lav" data-hwtab="quote"><span class="bt-ico">💬</span><div><div class="bt-name">每日金句</div><div class="bt-desc">50条正能量</div></div></div>
    </div><div class="bt-desc">5个班作业/背书/默写/家校批改</div></div></div>
      <div class="big-tab theme-gold" data-hwtab="quote"><span class="bt-ico">💬</span><div><div class="bt-name">每日金句</div><div class="bt-desc">50条鼓励文案 ×${quotes.length} 可复制</div></div></div>
    </div>
    <div id="hwTabBody">${renderHwReg()}</div>`;
    return html;
  },
  after() {
    const tabs = document.querySelectorAll("#hwTabs .big-tab");
    tabs.forEach(t => {
      t.onclick = () => {
        tabs.forEach(x => x.classList.remove("active"));
        t.classList.add("active");
        const body = document.getElementById("hwTabBody");
        const hwMap = { hw: renderHwReg, board: renderHwBoard, recite: renderHwRecite, dict: renderHwDict, quote: renderQuotePanel };
        body.innerHTML = hwMap[t.dataset.hwtab] ? hwMap[t.dataset.hwtab]() : renderHwReg();
        bindHwTab(t.dataset.hwtab);
      };
    });
    bindHwTab("hw");
  }
});

/* 兼容旧版作业记录：missing 字符串 → unfinished 数组；数字 recite/dictation 忽略 */
function normHwRecord(r) {
  r = r || {};
  const split = (v) => Array.isArray(v) ? v : (typeof v === "string" && v.trim() ? v.split(/[,，、\s]+/).filter(Boolean) : []);
  return {
    content: r.content || "",
    jx: r.jx || "",
    unfinished: split(r.unfinished || r.missing),
    late: split(r.late),
    recite: split(r.recite),
    dictation: split(r.dictation)
  };
}

/* 单个班级的 Excel 风格勾选表 */
function renderHwSheet(c, r, students) {
  const list = students[c.name] || [];
  const count = (k) => (r[k] || []).length;
  const counts = `未交 <b class="c-unfin">${count("unfinished")}</b> · 补交 <b class="c-late">${count("late")}</b> · 背书 <b class="c-recite">${count("recite")}</b> · 默写 <b class="c-dict">${count("dictation")}</b>`;
  if (!list.length) {
    return `<details class="details-box">
      <summary>${esc(c.name)} ${c.isHome ? '<span class="badge badge-green">班主任班</span>' : ""} <span class="hw-empty-tag">未导入花名册</span></summary>
      <div class="db-body">
        <div class="empty"><span class="e-ico">📋</span>该班还没有学生名单。<br>
          请到「学生信息 → 花名册」粘贴导入，或
          <button class="btn btn-primary btn-sm" style="margin-top:8px" data-act="hw-import" data-cid="${c.id}" data-cname="${esc(c.name)}">📥 快速导入 ${esc(c.name)} 名单</button></div>
      </div></details>`;
  }
  return `<details class="details-box" open>
    <summary>${esc(c.name)}（${list.length}人）${c.isHome ? ' <span class="badge badge-green">班主任班</span>' : ""} <span class="hw-summary">${counts}</span></summary>
    <div class="db-body">
      <div class="hw-sheet-bar">
        <input class="inline-edit hw-content-inp" data-hw-field data-c="${c.id}" data-f="content" value="${esc(r.content)}" placeholder="📝 今日作业内容，如：练习册P23-25 + 背诵第2课">
        ${c.isHome ? `<span class="hw-jx">家校批改本数 <input type="number" min="0" class="inline-edit" style="width:64px" data-hw-field data-c="${c.id}" data-f="jx" value="${esc(r.jx)}"></span>` : ""}
        <button class="btn btn-ghost btn-sm" data-act="hw-class-download" data-cid="${c.id}" data-cname="${esc(c.name)}">⬇️ 下载本班</button>
      </div>
      <div class="tbl-wrap"><table class="tbl hw-sheet">
        <thead><tr>
          <th class="num" style="width:44px">#</th><th>姓名</th><th style="width:60px">性别</th>
          <th class="hw-col-unfin" style="width:64px">📕 未交</th>
          <th class="hw-col-late" style="width:64px">✅ 补交</th>
          <th class="hw-col-recite" style="width:72px">📖 背书</th>
          <th class="hw-col-dict" style="width:72px">✍️ 默写</th>
        </tr></thead>
        <tbody>
        ${list.map((s, i) => {
          const u = (r.unfinished || []).includes(s.name);
          const la = (r.late || []).includes(s.name);
          const re = (r.recite || []).includes(s.name);
          const di = (r.dictation || []).includes(s.name);
          const cls = [u ? "hw-unfin" : "", la ? "hw-late" : ""].filter(Boolean).join(" ");
          return `<tr class="${cls}">
            <td class="num">${i + 1}</td>
            <td class="hw-name">${esc(s.name)}${u ? '<span class="hw-tag-unfin">未交</span>' : ""}${la ? '<span class="hw-tag-late">已补</span>' : ""}</td>
            <td style="color:${s.gender === "女" ? "#C0668A" : "#3A6B9B"}">${esc(s.gender || "")}</td>
            <td class="hw-check"><input type="checkbox" data-hw-check data-c="${c.id}" data-k="unfinished" data-name="${esc(s.name)}" ${u ? "checked" : ""}></td>
            <td class="hw-check"><input type="checkbox" data-hw-check data-c="${c.id}" data-k="late" data-name="${esc(s.name)}" ${la ? "checked" : ""}></td>
            <td class="hw-check"><input type="checkbox" data-hw-check data-c="${c.id}" data-k="recite" data-name="${esc(s.name)}" ${re ? "checked" : ""}></td>
            <td class="hw-check"><input type="checkbox" data-hw-check data-c="${c.id}" data-k="dictation" data-name="${esc(s.name)}" ${di ? "checked" : ""}></td>
          </tr>`;
        }).join("")}
        </tbody>
      </table></div>
    </div></details>`;
}

/* 月度作业反馈报告生成 */
function buildHwMonthReport(year, month) {
  const classes = Store.get("classes", defaultClasses());
  const hw = Store.get("hwRecords", {});
  const students = Store.get("students", {});
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const days = Object.keys(hw).filter(d => d.startsWith(prefix)).sort();
  const lines = [];
  lines.push(`【${year}年${month}月 班级作业情况反馈】`);
  lines.push(`统计范围：${prefix}-01 至 ${prefix}-${days.length ? days[days.length - 1].slice(8) : "??"} · 共登记 ${days.length} 天`);
  lines.push("");
  if (!days.length) {
    lines.push("本月暂未登记作业数据。");
    return lines.join("\n");
  }
  classes.forEach(c => {
    const rosterN = (students[c.name] || []).length;
    let dates = 0, unfinN = 0, lateN = 0;
    const who = {};
    days.forEach(d => {
      const r = normHwRecord(hw[d][c.id]);
      if (!r.unfinished.length && !r.late.length && !r.content) return;
      dates++;
      r.unfinished.forEach(n => { who[n] = (who[n] || 0) + 1; unfinN++; });
      lateN += r.late.length;
    });
    if (!dates) return;
    const avgUnfin = (unfinN / dates).toFixed(1);
    const rate = rosterN && dates ? Math.round((1 - unfinN / (dates * rosterN)) * 100) : null;
    lines.push(`◆ ${c.name}${c.isHome ? "（班主任班）" : ""}`);
    lines.push(`　登记作业 ${dates} 次 · 平均每次未交 ${avgUnfin} 人${rate != null ? ` · 完成率 ${rate}%` : "（未导入名单）"}`);
    lines.push(`　累计未交 ${unfinN} 人次 · 累计补交 ${lateN} 人次`);
    const top = Object.entries(who).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (top.length) lines.push(`　未交涉及学生：${top.map(([n, t]) => `${n}${t > 1 ? t + "次" : ""}`).join("、")}`);
    if (unfinN === 0) lines.push(`　👍 全班作业完成率 100%，非常棒！感谢各位家长的配合。`);
    else if (rate != null && rate >= 97) lines.push(`　🌿 绝大多数同学都能按时完成作业，值得表扬！`);
    else if (rate != null && rate >= 90) lines.push(`　📌 整体表现良好，个别同学需要家长多多督促。`);
    else lines.push(`　⚠️ 近期作业完成情况需重点关注，建议家长与孩子聊聊作业习惯，有困难随时联系老师。`);
    lines.push("");
  });
  lines.push("—— 啊敏的兵 · 自动生成 ——");
  return lines.join("\n");
}

function renderHwReg() {
  const classes = Store.get("classes", defaultClasses());
  const hw = Store.get("hwRecords", {});
  const students = Store.get("students", {});
  const today = Today.now();
  const rec = hw[today] || {};
  // 自动检测：上个月有记录且未反馈过 → 提示
  try {
    const dt = new Date(today);
    const py = dt.getFullYear(), pm = dt.getMonth(); // getMonth() 0-based
    const lastPrefix = `${pm === 0 ? py - 1 : py}-${String(pm === 0 ? 12 : pm).padStart(2, "0")}`;
    const hasLast = Object.keys(hw).some(d => d.startsWith(lastPrefix));
    const reported = Store.get("hwReportedMonths", []);
    if (hasLast && !reported.includes(lastPrefix) && !window.__hwMonthTipShown) {
      window.__hwMonthTipShown = true;
      setTimeout(() => toast("📊 检测到上月作业记录，可点「月度反馈」一键生成家长通知"), 900);
    }
  } catch (e) { /* 忽略检测异常 */ }
  let html = `<div class="card">
    <div class="card-title">📚 作业收缴登记 <span class="sub">${today} · 按班勾选未交 / 补交 / 背书 / 默写</span>
      <button class="btn btn-primary btn-sm" data-act="hw-save">💾 保存今日</button>
      <button class="btn btn-ghost btn-sm" data-act="hw-month-report">📊 月度反馈</button>
      <button class="btn btn-ghost btn-sm" data-act="hw-history">📜 历史记录</button>
    </div>
    <div style="display:flex;gap:14px;margin-bottom:12px;font-size:12.5px;flex-wrap:wrap">
      <span><span class="hw-legend unfin"></span> 未交（红）</span>
      <span><span class="hw-legend late"></span> 补交（绿）</span>
      <span><span class="hw-legend recite"></span> 背书过关</span>
      <span><span class="hw-legend dict"></span> 默写过关</span>
      <span style="color:var(--ink-light)">勾选即自动保存 · 每班可单独下载</span>
    </div>
    ${classes.map(c => renderHwSheet(c, normHwRecord(rec[c.id]), students)).join("")}
  </div>`;
  return html;
}

function renderQuotePanel() {
  currentQuotes = getDailyQuotes(new Date());
  const quotes = currentQuotes;
  const cats = [...new Set(quotes.map(q => q.cat))];
  let html = `
  <div class="quote-day">
    <div><div class="qd-label">📅 ${Today.now()} · 今日反馈金句</div>
      <div class="qd-content">"${esc(quotes[0].text)}" — ${esc(quotes[0].cat)}</div></div>
    <button class="btn btn-ghost" data-act="quote-reshuffle">🔄 换一批</button>
  </div>
  <div class="card">
    <div class="card-title">💬 50条金句池 <span class="sub">点击「复制」即可发给学生/家长</span></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      ${cats.map(c => `<button class="btn btn-sm btn-ghost" data-act="quote-filter" data-c="${c}">${c}</button>`).join("")}
      <button class="btn btn-sm btn-ghost" data-act="quote-filter" data-c="all">全部</button>
      <button class="btn btn-sm btn-green-soft" data-act="quote-export">⬇️ 导出全部</button>
    </div>
    <div class="quote-grid" id="quoteGrid">
      ${quotes.map((q, i) => `
      <div class="quote-card" data-quote-cat="${q.cat}">
        <span class="q-cat">${q.cat}</span>
        <div style="padding-right:8px">${esc(q.text)}</div>
        <button class="q-copy" data-act="quote-copy" data-i="${i}">📋 复制</button>
      </div>`).join("")}
    </div>
  </div>`;
  return html;
}

function bindHwTab(tab) {
  const body = document.getElementById("hwTabBody");
  if (tab === "hw") {
    const hw = Store.get("hwRecords", {});
    const today = Today.now();
    hw[today] = hw[today] || {};
    const saveNow = (silent) => {
      Store.set("hwRecords", hw);
      if (!silent) toast("✅ 今日作业登记已保存");
    };
    // 作业内容 / 家校批改本数 输入 → 自动保存
    body.querySelectorAll("[data-hw-field]").forEach(inp => {
      inp.oninput = () => {
        const c = inp.dataset.c, f = inp.dataset.f;
        hw[today][c] = hw[today][c] || {};
        hw[today][c][f] = inp.value;
        saveNow(true);
      };
    });
    // 勾选 未交/补交/背书/默写 → 更新名单数组 + 自动保存 + 刷新汇总
    body.querySelectorAll("[data-hw-check]").forEach(cb => {
      cb.onchange = () => {
        const c = cb.dataset.c, k = cb.dataset.k, name = cb.dataset.name;
        hw[today][c] = hw[today][c] || {};
        hw[today][c][k] = hw[today][c][k] || [];
        const arr = hw[today][c][k];
        const i = arr.indexOf(name);
        if (cb.checked && i < 0) arr.push(name);
        if (!cb.checked && i >= 0) arr.splice(i, 1);
        // 行配色
        const tr = cb.closest("tr");
        if (tr) tr.classList.toggle("hw-unfin", (hw[today][c].unfinished || []).includes(name));
        if (tr) tr.classList.toggle("hw-late", (hw[today][c].late || []).includes(name));
        // 姓名徽章
        const tag = tr && tr.querySelector(".hw-tag-unfin");
        const tag2 = tr && tr.querySelector(".hw-tag-late");
        if (tag) tag.remove();
        if (tag2) tag2.remove();
        if (tr) {
          const nm = tr.querySelector(".hw-name");
          if ((hw[today][c].unfinished || []).includes(name)) nm.insertAdjacentHTML("beforeend", '<span class="hw-tag-unfin">未交</span>');
          if ((hw[today][c].late || []).includes(name)) nm.insertAdjacentHTML("beforeend", '<span class="hw-tag-late">已补</span>');
        }
        // 刷新班级汇总
        const details = cb.closest("details");
        const sum = details && details.querySelector(".hw-summary");
        if (sum) {
          const n = (k) => (hw[today][c][k] || []).length;
          sum.innerHTML = `未交 <b class="c-unfin">${n("unfinished")}</b> · 补交 <b class="c-late">${n("late")}</b> · 背书 <b class="c-recite">${n("recite")}</b> · 默写 <b class="c-dict">${n("dictation")}</b>`;
        }
        saveNow(true);
      };
    });
    document.querySelector("[data-act=hw-save]")?.addEventListener("click", () => saveNow(false));
    // 月度反馈（支持切换月份，月初可回看上月）
    const openHwMonthReport = (y, m) => {
      const text = buildHwMonthReport(y, m);
      const reported = Store.get("hwReportedMonths", []);
      const prefix = `${y}-${String(m).padStart(2, "0")}`;
      const now = new Date();
      const isCurrent = (y === now.getFullYear() && m === now.getMonth() + 1);
      openModal(`<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
          <button class="btn btn-ghost btn-sm" data-act="hw-report-prev">⬅ 上月</button>
          <b style="flex:1;text-align:center">${y}年${m}月 作业反馈</b>
          <button class="btn btn-ghost btn-sm" data-act="hw-report-next" ${isCurrent ? "disabled" : ""}>下月 ➡</button>
        </div>
        <div style="font-size:13px;line-height:1.9;white-space:pre-wrap;max-height:360px;overflow-y:auto">${esc(text)}</div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary btn-sm" data-act="hw-report-copy">📋 复制</button>
          <button class="btn btn-ghost btn-sm" data-act="hw-report-dl">⬇️ 导出txt</button>
          <button class="btn btn-ghost btn-sm" data-act="hw-report-done" ${reported.includes(prefix) ? "disabled" : ""}>✅ 标记已反馈</button>
        </div>`, "📊 月度作业反馈");
      const ok = document.querySelector("[data-act=modal-ok]");
      if (ok) ok.onclick = closeModal;
      const prev = document.querySelector("[data-act=hw-report-prev]");
      if (prev) prev.onclick = () => { closeModal(); const d2 = new Date(y, m - 2, 1); openHwMonthReport(d2.getFullYear(), d2.getMonth() + 1); };
      const next = document.querySelector("[data-act=hw-report-next]");
      if (next && !isCurrent) next.onclick = () => { closeModal(); const d3 = new Date(y, m, 1); openHwMonthReport(d3.getFullYear(), d3.getMonth() + 1); };
      document.querySelector("[data-act=hw-report-copy]").onclick = async () => {
        try { await navigator.clipboard.writeText(text); toast("📋 已复制，可直接粘贴给家长"); }
        catch (e) { prompt("请手动复制：", text); }
      };
      document.querySelector("[data-act=hw-report-dl]").onclick = () => {
        downloadFile("作业月度反馈_" + prefix + ".txt", text);
        toast("已导出");
      };
      document.querySelector("[data-act=hw-report-done]").onclick = function () {
        if (!reported.includes(prefix)) { reported.push(prefix); Store.set("hwReportedMonths", reported); }
        this.disabled = true; this.textContent = "✅ 已标记";
        toast("已标记：本月反馈完成");
      };
    };
    document.querySelector("[data-act=hw-month-report]")?.addEventListener("click", () => {
      const now = new Date();
      openHwMonthReport(now.getFullYear(), now.getMonth() + 1);
    });
    // 下载本班当天数据 CSV
    body.querySelectorAll("[data-act=hw-class-download]").forEach(btn => {
      btn.onclick = () => {
        const cid = btn.dataset.cid, cname = btn.dataset.cname;
        const r = normHwRecord(hw[today][cid]);
        const classes = Store.get("classes", defaultClasses());
        const c = classes.find(x => x.id === cid);
        const students = Store.get("students", {});
        const list = students[cname] || [];
        const rows = [["#", "姓名", "性别", "未交", "补交", "背书过关", "默写过关"]];
        list.forEach((s, i) => rows.push([i + 1, s.name, s.gender || "", (r.unfinished || []).includes(s.name) ? "✔" : "", (r.late || []).includes(s.name) ? "✔" : "", (r.recite || []).includes(s.name) ? "✔" : "", (r.dictation || []).includes(s.name) ? "✔" : ""]));
        if (r.content) rows.unshift(["作业内容", r.content]);
        const csv = rows.map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
        downloadFile("作业登记_" + cname + "_" + today + ".csv", "\ufeff" + csv, "text/csv;charset=utf-8");
        toast("⬇️ 已下载 " + cname + " 作业登记");
      };
    });
    // 快速导入该班花名册
    body.querySelectorAll("[data-act=hw-import]").forEach(btn => {
      btn.onclick = () => {
        const cname = btn.dataset.cname;
        openModal(`<p style="font-size:13px;color:var(--ink-light);margin-bottom:8px">粘贴 ${esc(cname)} 名单，每行一个学生，格式：<b>姓名,性别</b>（如：张三,男）</p>
          <textarea class="inp" id="inpHwRoster" rows="10" placeholder="张三,男&#10;李四,女"></textarea>
          <div style="margin-top:8px;font-size:12px;color:var(--ink-light)">也可以从 Excel 整列复制粘贴（自动跳过表头行）</div>`, "📥 导入 " + cname + " 花名册");
        const ok = document.querySelector("[data-act=modal-ok]");
        if (ok) ok.onclick = () => {
          const raw = document.getElementById("inpHwRoster").value;
          const list = [];
          raw.split(/\n+/).forEach(line => {
            line = line.trim();
            if (!line) return;
            const parts = line.split(/[,，\t]/).map(x => x.trim()).filter(Boolean);
            if (!parts.length) return;
            const name = parts[0];
            if (/^(姓名|学生|名字)$/.test(name)) return; // 跳过表头
            list.push({ name, gender: parts[1] === "女" ? "女" : "男" });
          });
          if (!list.length) { toast("未识别到名单，请检查格式"); return; }
          const all = Store.get("students", {});
          all[cname] = list;
          Store.set("students", all);
          closeModal();
          const bodyEl = document.getElementById("hwTabBody");
          if (bodyEl) { bodyEl.innerHTML = renderHwReg(); bindHwTab("hw"); }
          toast(`✅ 已导入 ${cname} 名单 ${list.length} 人`);
        };
      };
    });
    // 历史记录（兼容旧数据格式）
    document.querySelector("[data-act=hw-history]")?.addEventListener("click", () => {
      const keys = Object.keys(hw).sort().reverse().slice(0, 30);
      openModal(`<div style="max-height:320px;overflow-y:auto">
        ${keys.length === 0 ? '<p style="color:var(--ink-light)">暂无历史记录</p>' : keys.map(k => `
          <div style="padding:8px 0;border-bottom:1px dashed var(--line)">
            <b style="color:var(--green-700)">${k}</b><br>
            ${Object.values(hw[k]).map(r => {
              const nr = normHwRecord(r);
              const parts = [];
              if (nr.content) parts.push(`作业：${nr.content}`);
              if (nr.unfinished.length) parts.push(`未交：${nr.unfinished.join("、")}`);
              if (nr.late.length) parts.push(`补交：${nr.late.join("、")}`);
              if (nr.recite.length) parts.push(`背书${nr.recite.length}人`);
              if (nr.dictation.length) parts.push(`默写${nr.dictation.length}人`);
              return parts.join("；");
            }).filter(x => x).join("<br>") || '<span style="color:#B8C8BE">无记录</span>'}
          </div>`).join("")}
      </div>`, "📜 历史记录");
      const ok = document.querySelector("[data-act=modal-ok]");
      if (ok) ok.onclick = closeModal;
    });
  }
  if (tab === "quote") {
    document.querySelector("[data-act=quote-reshuffle]")?.addEventListener("click", () => {
      currentQuotes = getDailyQuotes(new Date(), true); // 随机种子 → 每次换一批都不同
      body.innerHTML = renderQuotePanel();
      bindHwTab("quote");
      toast("🔄 已换一批新的金句");
    });
    document.querySelector("[data-act=quote-export]")?.addEventListener("click", () => {
      const quotes = currentQuotes || getDailyQuotes(new Date());
      const lines = quotes.map(q => `【${q.cat}】${q.text}`);
      downloadFile("每日金句_" + Today.now() + ".txt", lines.join("\n"));
      toast("已导出金句");
    });
    body.querySelectorAll("[data-act=quote-filter]").forEach(b => {
      b.onclick = () => {
        const c = b.dataset.c;
        body.querySelectorAll("[data-quote-cat]").forEach(el => {
          el.style.display = (c === "all" || el.dataset.quoteCat === c) ? "" : "none";
        });
      };
    });
    body.querySelectorAll("[data-act=quote-copy]").forEach(b => {
      b.onclick = async () => {
        const quotes = currentQuotes || getDailyQuotes(new Date());
        const text = quotes[+b.dataset.i].text;
        try {
          await navigator.clipboard.writeText(text);
          toast("📋 已复制：" + text);
        } catch (e) {
          prompt("请手动复制：", text);
        }
      };
    });
  }
}

/* =========================================================
   模块5 · 学生信息
   ========================================================= */
registerModule("student", {
  title: "👩‍🎓 学生信息",
  sub: "花名册 · 成绩分析 · 排名 · 期末评语",
  render() {
    const classes = Store.get("classes", defaultClasses());
    const students = Store.get("students", {});
    const names = classes.map(c => c.name);
    let html = `
    <div class="mv-header"><h2 class="mv-title">👩‍🎓 学生信息</h2>
      <p class="mv-sub">${names.length} 个班 · ${allStudents().length} 名学生</p></div>
    ${modToolbar("学生信息")}
    <div class="big-tab-grid g4" id="stuTabs">
      <div class="big-tab theme-teal active" data-stutab="roster"><span class="bt-ico">📋</span><div><div class="bt-name">花名册</div><div class="bt-desc">5班名单 · 导入</div></div></div>
      <div class="big-tab theme-blue" data-stutab="profile"><span class="bt-ico">📁</span><div><div class="bt-name">个人档案</div><div class="bt-desc">学生信息详情</div></div></div>
      <div class="big-tab theme-coral" data-stutab="io"><span class="bt-ico">📦</span><div><div class="bt-name">导入导出</div><div class="bt-desc">批量导入导出</div></div></div>
      <div class="big-tab theme-gold" data-stutab="report"><span class="bt-ico">📄</span><div><div class="bt-name">个人报告</div><div class="bt-desc">导出学生报告</div></div></div>
      <div class="big-tab theme-rose" data-stutab="rank"><span class="bt-ico">🏆</span><div><div class="bt-name">个人排名</div><div class="bt-desc">总分从高到低</div></div></div>
    </div>
    <div id="stuTabBody">${renderRoster()}</div>`;
    return html;
  },
  after() {
    const tabs = document.querySelectorAll("#stuTabs .big-tab");
    tabs.forEach(t => {
      t.onclick = () => {
        tabs.forEach(x => x.classList.remove("active"));
        t.classList.add("active");
        const body = document.getElementById("stuTabBody");
        const map = { roster: renderRoster, profile: renderStuProfile, io: renderStuIO, report: renderStuReport, rank: renderRanking };
        body.innerHTML = map[t.dataset.stutab]();
        bindStuTab(t.dataset.stutab);
      };
    });
    bindStuTab("roster");
  }
});

function renderRoster() {
  const classes = Store.get("classes", defaultClasses());
  const students = Store.get("students", {});
  let html = `<div class="card">
    <div class="card-title">📋 花名册 <span class="sub">粘贴表格数据导入（姓名,性别,语文,数学,英语,总分,出生年月...）</span>
      <button class="btn btn-primary btn-sm" data-act="stu-import">📥 导入数据</button>
      <button class="btn btn-ghost btn-sm" data-act="stu-download">⬇️ 下载当前</button>
      <button class="btn btn-ghost btn-sm" data-act="stu-birthdays">🎂 本月生日</button>
    </div>
    <div style="font-size:12px;color:var(--ink-light);margin:-4px 0 12px">💡 导入时第 7 列为<b>出生年月</b>（如 <code>2010-05-12</code>），首页会自动提醒当天生日并生成专属祝福语；也可点姓名旁的 🎂 单独设置。</div>
    ${classes.map(c => {
      const list = students[c.name] || [];
      return `<details class="details-box" ${c.isHome ? "open" : ""}>
      <summary>${esc(c.name)}（${list.length}人）${c.isHome ? ' <span class="badge badge-green">班主任班</span>' : ""}</summary>
      <div class="db-body">
        ${list.length === 0 ? `<div class="empty"><span class="e-ico">📋</span>暂无学生数据，点击「导入数据」粘贴表格</div>` : `
        <div class="tbl-wrap"><table class="tbl"><tr><th class="num">#</th><th>姓名</th><th>性别</th><th>🎂 出生年月</th><th>语文</th><th>数学</th><th>英语</th><th>总分</th><th>排名</th></tr>
        ${list.slice().sort((a, b) => (b.total || 0) - (a.total || 0)).map((s, i) => `
          <tr><td class="num">${i + 1}</td><td>${esc(s.name)} ${s.birthday ? `<button class="bday-edit" data-act="stu-bday" data-name="${esc(s.name)}" data-cls="${esc(c.name)}" title="修改出生年月">🎂</button>` : `<button class="bday-edit bday-empty" data-act="stu-bday" data-name="${esc(s.name)}" data-cls="${esc(c.name)}" title="设置出生年月（开启生日提醒）">🎂</button>`}</td>
          <td style="color:${s.gender === "女" ? "#C0668A" : "#3A6B9B"}">${esc(s.gender)}</td>
          <td>${s.birthday ? esc(s.birthday) : '<span style="color:#B8C8BE">未设置</span>'}</td>
          <td>${esc(s.chinese ?? "-")}</td><td>${esc(s.math ?? "-")}</td><td>${esc(s.english ?? "-")}</td>
          <td><b>${s.total != null ? s.total : "-"}</b></td><td class="num">${s.total != null ? i + 1 : "-"}</td></tr>`).join("")}
        </table></div>`}
      </div></details>`;
    }).join("")}
  </div>`;
  return html;
}

function renderScoreAnalysis() {
  const classes = Store.get("classes", defaultClasses());
  const students = Store.get("students", {});
  let html = `<div class="card">
    <div class="card-title">📊 班级成绩分析 <span class="sub">各科平均分对比</span></div>`;
  classes.forEach(c => {
    const list = (students[c.name] || []).filter(s => s.total != null);
    if (!list.length) { html += `<div class="empty">${esc(c.name)}暂无成绩数据</div>`; return; }
    const avg = (f) => {
      const vals = list.map(s => s[f]).filter(v => v != null && v !== "");
      return vals.length ? (vals.reduce((a, b) => a + +b, 0) / vals.length).toFixed(1) : 0;
    };
    const subjects = ["chinese", "math", "english"];
    const names = { chinese: "语文", math: "数学", english: "英语" };
    const max = Math.max(...subjects.map(s => +avg(s))) || 1;
    html += `<div class="chart-wrap" style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:700;color:var(--green-700);margin-bottom:6px">${esc(c.name)} · 平均分</div>
      <div class="chart-bars">
        ${subjects.map(s => { const v = +avg(s); return `
          <div class="chart-bar"><span class="cb-val">${v}</span>
            <div class="cb-col" style="height:${Math.round(v / max * 100)}%"></div>
            <span class="cb-name">${names[s]}</span></div>`; }).join("")}
        <div class="chart-bar"><span class="cb-val">${avg("total")}</span>
          <div class="cb-col" style="height:${Math.round(avg("total") / (max * 3.3) * 100)}%;background:linear-gradient(180deg,#F6C453,#E0B84F)"></div>
          <span class="cb-name">总分</span></div>
      </div>
      <div style="font-size:11.5px;color:var(--ink-light);margin-top:4px">全班 ${list.length} 人 · 及格率 ${Math.round(list.filter(s => +s.total >= 420).length / list.length * 100)}%</div>
    </div>`;
  });
  html += `</div>`;
  return html;
}

function renderRanking() {
  const classes = Store.get("classes", defaultClasses());
  const students = Store.get("students", {});
  let html = `<div class="card">
    <div class="card-title">🏆 个人排名 <span class="sub">按总分从高到低</span></div>`;
  classes.forEach(c => {
    const list = (students[c.name] || []).filter(s => s.total != null).sort((a, b) => b.total - a.total);
    if (!list.length) { html += `<div class="empty">${esc(c.name)}暂无成绩数据</div>`; return; }
    html += `<div class="tbl-wrap" style="margin-bottom:12px"><table class="tbl"><tr><th class="num" style="width:50px">名次</th><th>姓名</th><th>性别</th><th>语文</th><th>数学</th><th>英语</th><th>总分</th></tr>`;
    list.forEach((s, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
      html += `<tr><td class="num"><b>${medal} ${i + 1}</b></td><td>${esc(s.name)}</td>
        <td style="color:${s.gender === "女" ? "#C0668A" : "#3A6B9B"}">${esc(s.gender)}</td>
        <td>${esc(s.chinese ?? "-")}</td><td>${esc(s.math ?? "-")}</td><td>${esc(s.english ?? "-")}</td>
        <td><b style="color:var(--green-700);font-size:15px">${s.total}</b></td></tr>`;
    });
    html += `</table></div>`;
  });
  html += `</div>`;
  return html;
}

function renderCommentGen() {
  const classes = Store.get("classes", defaultClasses());
  const students = Store.get("students", {});
  const genComments = (list) => {
    return list.map(s => {
      const total = s.total != null ? +s.total : 0;
      const isGirl = s.gender === "女";
      const tpls = {
        A: isGirl ? ["成绩名列前茅，聪慧文静，是班级的榜样。愿你保持热爱，继续闪闪发光。", "学习刻苦认真，各科均衡发展，望百尺竿头更进一步，以更从容的姿态迎接挑战。"]
          : ["成绩优异，思维敏捷，课堂表现突出。愿你戒骄戒躁，做更沉稳的自己。", "学习能力强，目标明确，愿你保持这份冲劲，让优秀成为一种习惯。"],
        B: ["学习态度端正，成绩稳步上升，望继续查漏补缺，向更高目标迈进。", "勤奋踏实，进步明显，老师为你的成长感到欣慰，继续加油！"],
        C: ["基础尚可，但课堂专注度有待提高。愿你静下心来，把每一步走扎实。", "学习潜力很大，需要更多自律。新学期，老师期待一个更专注的你。"],
        D: ["近期学习状态波动，望调整心态，从基础抓起，老师愿意陪你一起努力。", "老师注意到你学习上的困难，别灰心，慢慢来，找到适合自己的节奏。"]
      };
      const grade = total >= 480 ? "A" : total >= 420 ? "B" : total >= 300 ? "C" : "D";
      const pick = tpls[grade][total % 2];
      return { name: s.name, grade, comment: pick };
    });
  };
  let html = `<div class="card">
    <div class="card-title">📝 期末评语一键生成 <span class="sub">基于成绩自动生成个性化评语，可编辑后复制</span>
      <button class="btn btn-primary btn-sm" data-act="comment-copy-all">📋 复制全部</button>
      <button class="btn btn-ghost btn-sm" data-act="comment-export">⬇️ 导出</button>
    </div>`;
  classes.forEach(c => {
    const list = (students[c.name] || []).filter(s => s.total != null);
    if (!list.length) { html += `<div class="empty">${esc(c.name)}暂无成绩数据</div>`; return; }
    const comments = genComments(list);
    html += `<details class="details-box" ${c.isHome ? "open" : ""}><summary>${esc(c.name)} 评语（${comments.length}条）</summary><div class="db-body" style="display:flex;flex-direction:column;gap:8px">`;
    comments.forEach(cm => {
      html += `<div class="comment-card">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <b style="color:var(--green-700)">${esc(cm.name)}</b>
          <span class="badge ${cm.grade === "A" ? "badge-green" : cm.grade === "B" ? "badge-blue" : cm.grade === "C" ? "badge-amber" : "badge-red"}">${cm.grade}</span>
        </div>
        <textarea class="tarea" style="width:100%;border:none;background:transparent;font-size:13px;line-height:1.9" rows="2">${esc(cm.comment)}</textarea>
      </div>`;
    });
    html += `</div></details>`;
  });
  html += `</div>`;
  return html;
}

function bindStuTab(tab) {
  const body = document.getElementById("stuTabBody");
  if (tab === "roster") {
    document.querySelector("[data-act=stu-import]")?.addEventListener("click", () => {
      openModal(`
        <select class="inp" id="inpStuClass" style="margin-bottom:8px">
          ${Store.get("classes", defaultClasses()).map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("")}
        </select>
        <p style="font-size:12px;color:var(--ink-light);margin-bottom:6px">从 Excel/表格复制数据后粘贴到这里（表头：姓名,性别,语文,数学,英语,总分,出生年月；出生年月格式如 2010-05-12，可留空）</p>
        <textarea class="tarea" id="inpStuCSV" rows="10" style="width:100%" placeholder="张三,男,98,100,95,293,2010-05-12&#10;李四,女,95,98,99,292,2010-08-03"></textarea>`, "导入学生数据");
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const cls = document.getElementById("inpStuClass").value;
        const raw = document.getElementById("inpStuCSV").value.trim();
        if (!raw) return;
        const lines = raw.split("\n").filter(l => l.trim());
        const parsed = [];
        lines.forEach(line => {
          const parts = line.split(/[,，\t]/).map(x => x.trim());
          if (!parts[0] || /^(姓名|学生|name)$/i.test(parts[0])) return;
          const s = { name: parts[0], gender: parts[1] || "" };
          const subj = { 3: "chinese", 4: "math", 5: "english", 6: "total" };
          for (let i = 2; i < parts.length; i++) {
            if (subj[i] && parts[i] !== "") s[subj[i]] = +parts[i];
          }
          if (!s.total && parts[2] && (s.chinese || s.math || s.english)) {
            s.total = (+s.chinese || 0) + (+s.math || 0) + (+s.english || 0);
          }
          // 第 7 列（索引7）出生年月：统一转 yyyy-mm-dd，非法则忽略
          if (parts[7]) {
            const bd = parts[7].replace(/[./]/g, "-");
            if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(bd)) {
              const bp = bd.split("-");
              s.birthday = bp[0] + "-" + String(+bp[1]).padStart(2, "0") + "-" + String(+bp[2]).padStart(2, "0");
            }
          }
          parsed.push(s);
        });
        if (!parsed.length) { toast("未解析到有效数据"); return; }
        const all = Store.get("students", {});
        all[cls] = parsed;
        Store.set("students", all);
        closeModal();
        body.innerHTML = renderRoster();
        bindStuTab("roster");
        toast(`✅ 已导入 ${parsed.length} 名学生到 ${cls}`);
      };
    });
    document.querySelector("[data-act=stu-download]")?.addEventListener("click", () => {
      const classes = Store.get("classes", defaultClasses());
      const students = Store.get("students", {});
      const lines = ["班级,姓名,性别,语文,数学,英语,总分,出生年月"];
      classes.forEach(c => (students[c.name] || []).forEach(s => {
        lines.push([c.name, s.name, s.gender, s.chinese ?? "", s.math ?? "", s.english ?? "", s.total ?? "", s.birthday ?? ""].join(","));
      }));
      downloadFile("花名册_" + Today.now() + ".csv", "\ufeff" + lines.join("\n"), "text/csv;charset=utf-8");
      toast("已下载花名册");
    });
    /* 🎂 设置/修改学生出生年月 */
    document.querySelectorAll("[data-act=stu-bday]").forEach(btn => {
      btn.onclick = () => {
        const nm = btn.dataset.name, cls = btn.dataset.cls;
        const all = Store.get("students", {});
        const list = all[cls] || [];
        const stu = list.find(s => s.name === nm);
        const cur = stu && stu.birthday ? stu.birthday : "";
        openModal(`<p style="font-size:13px;color:var(--ink-light);margin-bottom:8px">为 <b style="color:var(--green-700)">${esc(cls)} · ${esc(nm)}</b> 设置出生年月（用于首页生日提醒）</p>
          <input class="inp" id="inpStuBday" type="date" value="${cur}" style="margin-bottom:8px">
          <div style="font-size:12px;color:var(--ink-light)">也可以填写格式：2010-05-12</div>`, "🎂 设置出生年月");
        const ok = document.querySelector("[data-act=modal-ok]");
        ok.onclick = () => {
          const v = document.getElementById("inpStuBday").value;
          if (!v) { toast("请选择日期"); return; }
          if (stu) {
            stu.birthday = v;
            Store.set("students", all);
          }
          closeModal();
          body.innerHTML = renderRoster();
          bindStuTab("roster");
          toast("🎂 " + nm + " 的生日已保存：" + v);
        };
      };
    });
    /* 🎂 本月生日一览 */
    document.querySelector("[data-act=stu-birthdays]")?.addEventListener("click", () => {
      const classes = Store.get("classes", defaultClasses());
      const students = Store.get("students", {});
      const now = new Date();
      const ym = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      const rows = [];
      classes.forEach(c => (students[c.name] || []).forEach(s => {
        if (s.birthday && s.birthday.indexOf(ym) === 0) rows.push({ cls: c.name, name: s.name, bd: s.birthday });
      }));
      rows.sort((a, b) => a.bd.localeCompare(b.bd));
      if (!rows.length) {
        openModal(`<p style="font-size:13px;color:var(--ink-light)">本月（${ym}）暂无学生过生日。可在花名册导入出生年月，或在姓名旁点 🎂 设置。</p>`, "🎂 本月生日");
        const ok = document.querySelector("[data-act=modal-ok]");
        if (ok) ok.onclick = closeModal;
        return;
      }
      openModal(`<div style="max-height:320px;overflow-y:auto">
        ${rows.map(r => `<div style="padding:8px 0;border-bottom:1px dashed var(--line)">
          <b style="color:var(--green-700)">${esc(r.bd)}</b> · ${esc(r.cls)} · ${esc(r.name)}</div>`).join("")}
      </div>`, "🎂 本月生日（" + ym + "）");
      const ok = document.querySelector("[data-act=modal-ok]");
      if (ok) ok.onclick = closeModal;
    });
  }
  if (tab === "comment") {
    document.querySelector("[data-act=comment-copy-all]")?.addEventListener("click", async () => {
      const texts = body.querySelectorAll(".comment-card textarea");
      const all = Array.from(texts).map(t => t.value.trim()).join("\n");
      try { await navigator.clipboard.writeText(all); toast("📋 已复制全部评语"); }
      catch (e) { prompt("请手动复制：", all); }
    });
    document.querySelector("[data-act=comment-export]")?.addEventListener("click", () => {
      const texts = body.querySelectorAll(".comment-card textarea");
      const names = body.querySelectorAll(".comment-card b");
      const lines = [];
      texts.forEach((t, i) => lines.push(`${names[i]?.textContent || ""}：${t.value.trim()}`));
      downloadFile("期末评语_" + Today.now() + ".txt", lines.join("\n"));
      toast("已导出评语");
    });
  }
}

/* =========================================================
   模块6 · 家校沟通
   ========================================================= */
registerModule("comm", {
  title: "💬 家校沟通",
  sub: "高情商回复 · 快速写 · 班级通知 · 问题学生沟通记录",
  render() {
    return `
    <div class="mv-header"><h2 class="mv-title">💬 家校沟通</h2>
      <p class="mv-sub">让每一次沟通都恰到好处</p></div>
    ${modToolbar("家校沟通")}
    <div class="grid-2">
      <div class="card" id="sub-reply">
        <div class="card-title">🤖 高情商回复生成 <span class="sub">粘贴家长消息，生成3种风格</span></div>
        <textarea class="tarea" id="inpParentMsg" rows="4" style="width:100%" placeholder="粘贴家长发来的消息，例如：老师，我家孩子这次考得不好，是不是上课不认真？"></textarea>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" data-act="gen-reply">✨ 生成回复</button>
          <button class="btn btn-ghost btn-sm" data-act="reply-clear">清空</button>
        </div>
        <div id="replyResult" style="margin-top:12px"></div>
      </div>
      <div class="card" id="sub-quick">
        <div class="card-title">✍️ 快速写 <span class="sub">常用文案模板</span></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <button class="btn btn-sm btn-green-soft" data-act="quick-tpl" data-t="progress">成绩反馈</button>
          <button class="btn btn-sm btn-green-soft" data-act="quick-tpl" data-t="encourage">鼓励学生</button>
          <button class="btn btn-sm btn-green-soft" data-act="quick-tpl" data-t="thanks">感谢配合</button>
          <button class="btn btn-sm btn-green-soft" data-act="quick-tpl" data-t="warn">纪律提醒</button>
        </div>
        <textarea class="tarea" id="inpQuickWrite" rows="6" style="width:100%" placeholder="选择模板或直接输入..."></textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary btn-sm" data-act="quick-copy">📋 复制</button>
          <button class="btn btn-ghost btn-sm" data-act="quick-save">💾 存为常用</button>
        </div>
        <div id="quickSaved" style="margin-top:10px"></div>
      </div>
    </div>
    <div class="card" id="sub-notice">
      <div class="card-title">📣 班级通知 <span class="sub">AI 润色让通知更有温度 · 生成后复制发到家长群</span>
        <button class="btn btn-primary btn-sm" data-act="notice-gen">⚡ 一键生成</button>
        <button class="btn btn-ghost btn-sm" data-act="notice-polish" id="btnNoticePolish">✨ AI 润色</button>
        <button class="btn btn-ghost btn-sm" data-act="notice-copy">📋 复制</button>
      </div>
      <div class="grid-3" style="margin-bottom:10px">
        <div><label style="font-size:12px;color:var(--ink-light)">通知类型</label>
          <select class="sel" id="inpNoticeType" style="width:100%">
            <option value="safety">安全提醒</option><option value="meeting">家长会</option>
            <option value="activity">活动通知</option><option value="exam">考试安排</option>
            <option value="custom">自定义</option>
          </select></div>
        <div><label style="font-size:12px;color:var(--ink-light)">日期/时间</label>
          <input class="inp" id="inpNoticeDate" style="width:100%" value="${Today.now()}"></div>
        <div><label style="font-size:12px;color:var(--ink-light)">班级</label>
          <input class="inp" id="inpNoticeClass" style="width:100%" value="${esc(Store.get("classInfo", { name: "701班" }).name)}"></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
        <span style="font-size:12px;color:var(--ink-light)">通知语气：</span>
        <div class="tone-pills">
          <button class="tone-pill t-warm active" data-act="notice-tone" data-tone="warm">😊 温暖贴心</button>
          <button class="tone-pill t-formal" data-act="notice-tone" data-tone="formal">📋 正式严谨</button>
          <button class="tone-pill t-lively" data-act="notice-tone" data-tone="lively">🎈 活泼亲切</button>
        </div>
        <span style="font-size:11.5px;color:var(--ink-light)">💡 先「一键生成」再「AI 润色」，通知瞬间有温度</span>
      </div>
      <textarea class="tarea" id="inpNoticeText" rows="5" style="width:100%" placeholder="通知内容将在此生成..."></textarea>
    </div>
    <div class="card" id="sub-records">
      <div class="card-title">📇 问题学生家长沟通记录 <span class="sub">录音证据留存 · 可回放可下载 · 可添加图片说明</span>
        <button class="btn btn-primary btn-sm" data-act="comm-add">＋ 添加记录</button>
      </div>
      <div id="commRecords">${renderCommRecords()}</div>
    </div>`;
  },
  after() {
    bindCommEvents();
  }
});

function renderCommRecords() {
  const records = Store.get("commRecords", []);
  if (!records.length) return `<div class="empty"><span class="e-ico">📇</span>暂无沟通记录</div>`;
  return records.slice().reverse().map(r => `
    <div class="comm-item">
      <div class="ci-head">
        <span><span class="badge badge-blue">${esc(r.student || "家长")}</span> ${esc(r.date || "")} ${r.time ? "· " + esc(r.time) : ""} ${r.audioData ? '<span class="vr-evidence-tag">🎙️ 含录音证据</span>' : ""}</span>
        <span><button class="btn btn-danger btn-sm" data-act="comm-del" data-id="${esc(r.id)}">✕</button></span>
      </div>
      <div class="ci-text">${esc(r.text)}</div>
      ${r.media ? `<div style="margin-top:6px;font-size:11.5px;color:var(--ink-light)">📎 附件说明：${esc(r.media)}</div>` : ""}
      ${r.audio ? `<div style="margin-top:4px;font-size:11.5px;color:var(--ink-light)">🎙️ 录音整理：${esc(r.audio)}</div>` : ""}
      ${r.audioData ? renderCommAudioPlayer(r.audioData, r.audioDur, r.audioSize) : ""}
    </div>`).join("");
}

/* 渲染家校沟通录音证据播放器 */
function renderCommAudioPlayer(b64, dur, size) {
  var ext = b64.indexOf("audio/mp4") >= 0 ? "m4a" : b64.indexOf("audio/ogg") >= 0 ? "ogg" : "webm";
  var dlName = "沟通录音证据_" + (dur ? Math.floor(dur/60) + "分" + (dur%60) + "秒" : "录音") + "." + ext;
  var durTxt = dur ? (Math.floor(dur/60) + ":" + String(dur%60).padStart(2,"0")) : "—";
  var sizeTxt = size ? (size < 1024 ? size + " B" : size < 1024*1024 ? (size/1024).toFixed(1) + " KB" : (size/1024/1024).toFixed(2) + " MB") : "—";
  return '<div class="vr-audio-player vr-evidence">'
    + '<div class="vr-ap-head">'
    +   '<span class="vr-ap-icon">🎙️</span>'
    +   '<span class="vr-ap-title">录音证据</span>'
    +   '<span class="vr-ap-meta">' + durTxt + ' · ' + sizeTxt + '</span>'
    + '</div>'
    + '<audio controls preload="none" src="' + b64 + '" style="width:100%;margin-top:6px"></audio>'
    + '<div class="vr-ap-actions">'
    +   '<a class="btn btn-ghost btn-sm" href="' + b64 + '" download="' + dlName + '">⬇️ 下载录音证据</a>'
    + '</div>'
    + '</div>';
}

function bindCommEvents() {
  const replyGen = () => {
    const msg = document.getElementById("inpParentMsg").value.trim();
    const out = document.getElementById("replyResult");
    if (!msg) { out.innerHTML = `<div class="empty"><span class="e-ico">✏️</span>请先粘贴家长消息</div>`; return; }
    const replies = generateReplies(msg);
    out.innerHTML = replies.map((r, i) => `
      <div class="comm-item" style="margin-top:8px">
        <div class="ci-head"><span><b style="color:var(--green-700)">${["① 温暖共情", "② 专业理性", "③ 简洁高效"][i]}</b></span>
          <button class="btn btn-sm btn-ghost" data-act="reply-copy" data-i="${i}">📋 复制</button></div>
        <div class="ci-text">${esc(r)}</div>
      </div>`).join("");
    out.querySelectorAll("[data-act=reply-copy]").forEach(b => {
      b.onclick = async () => {
        try { await navigator.clipboard.writeText(replies[+b.dataset.i]); toast("📋 已复制"); }
        catch (e) { prompt("请手动复制：", replies[+b.dataset.i]); }
      };
    });
  };
  document.querySelector("[data-act=gen-reply]")?.addEventListener("click", replyGen);
  document.querySelector("[data-act=reply-clear]")?.addEventListener("click", () => {
    document.getElementById("inpParentMsg").value = "";
    document.getElementById("replyResult").innerHTML = "";
  });

  // 快速写模板
  const tpls = {
    progress: "您好！关于孩子近期学习情况跟您反馈：\n本次{科目}单元练习，孩子成绩{状态}（{分数}分）。\n课堂表现：{课堂表现}。\n建议在家：{建议}。\n咱们家校配合，孩子一定会越来越好。",
    encourage: "您好！想跟您分享一个好消息：\n今天{孩子}在{方面}表现特别棒，我当场表扬了他/她！\n孩子的进步离不开您的陪伴与引导，我们继续一起努力！",
    thanks: "您好！感谢您一直以来对班级工作的支持与配合！\n{具体事项}，特别感谢您的理解与帮助。\n有您这样的家长，是我们班级的幸运！",
    warn: "您好！想跟您沟通一下：\n最近{孩子}在{方面}出现了一些情况（{具体情况}）。\n我们沟通一下，一起帮助孩子调整状态，好吗？\n您看方便约个时间聊聊吗？"
  };
  document.querySelectorAll("[data-act=quick-tpl]").forEach(b => {
    b.onclick = () => {
      document.getElementById("inpQuickWrite").value = tpls[b.dataset.t];
    };
  });
  document.querySelector("[data-act=quick-copy]")?.addEventListener("click", async () => {
    const v = document.getElementById("inpQuickWrite").value;
    try { await navigator.clipboard.writeText(v); toast("📋 已复制"); }
    catch (e) { prompt("请手动复制：", v); }
  });
  document.querySelector("[data-act=quick-save]")?.addEventListener("click", () => {
    const v = document.getElementById("inpQuickWrite").value.trim();
    if (!v) return;
    const saved = Store.get("quickTexts", []);
    saved.push(v);
    Store.set("quickTexts", saved);
    renderQuickSaved();
    toast("已存为常用文案");
  });
  renderQuickSaved();

  // 通知生成
  let noticeTone = "warm";
  document.querySelectorAll("[data-act=notice-tone]").forEach(pill => {
    pill.onclick = () => {
      noticeTone = pill.dataset.tone;
      document.querySelectorAll("[data-act=notice-tone]").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      toast("语气已切换：" + ({ warm: "😊 温暖贴心", formal: "📋 正式严谨", lively: "🎈 活泼亲切" }[noticeTone]));
    };
  });
  document.querySelector("[data-act=notice-gen]")?.addEventListener("click", () => {
    const type = document.getElementById("inpNoticeType").value;
    const date = document.getElementById("inpNoticeDate").value;
    const cls = document.getElementById("inpNoticeClass").value;
    const texts = {
      safety: `【${cls}安全提醒】\n尊敬的各位家长：\n您好！${date}，${"请务必提醒孩子注意以下安全事项：防溺水"}\n1. 上下学注意交通安全；\n2. 不私自下水游泳；\n3. 注意食品卫生。\n感谢您的配合！`,
      meeting: `【${cls}家长会通知】\n尊敬的各位家长：\n您好！本学期家长会定于${date}举行，\n地点：学校${"本班教室"}。\n诚邀您准时参加，共同关注孩子成长！`,
      activity: `【${cls}活动通知】\n尊敬的各位家长：\n您好！${date}将举行${"校园文化活动"}，\n请提醒孩子穿好校服、按时到校。\n期待孩子们的精彩表现！`,
      exam: `【${cls}考试安排】\n尊敬的各位家长：\n您好！${date}将进行${"阶段性检测"}，\n请提醒孩子提前复习、劳逸结合，\n并准备好文具。预祝孩子们取得好成绩！`,
      custom: `【${cls}通知】\n尊敬的各位家长：\n您好！${date}，\n（请填写通知内容）\n感谢您的理解与支持！`
    };
    document.getElementById("inpNoticeText").value = texts[type];
    toast("✅ 通知已生成，点「✨ AI 润色」让语气更温暖");
  });
  document.querySelector("[data-act=notice-polish]")?.addEventListener("click", () => {
    const ta = document.getElementById("inpNoticeText");
    if (!ta.value.trim()) { toast("请先生成或输入通知内容"); return; }
    ta.value = polishNotice(ta.value, noticeTone);
    toast("✨ AI 润色完成！通知更有温度了");
  });
  document.querySelector("[data-act=notice-copy]")?.addEventListener("click", async () => {
    const v = document.getElementById("inpNoticeText").value;
    try { await navigator.clipboard.writeText(v); toast("📋 已复制通知"); }
    catch (e) { prompt("请手动复制：", v); }
  });

  // 沟通记录
  document.querySelector("[data-act=comm-add]")?.addEventListener("click", () => {
    openModal(`
      <input class="inp" id="inpCommStudent" placeholder="学生姓名" style="margin-bottom:8px">
      <input class="inp" id="inpCommDate" type="date" value="${Today.now()}" style="margin-bottom:8px">
      <input class="inp" id="inpCommTime" placeholder="时间（如：14:30）" style="margin-bottom:8px">
      <textarea class="tarea" id="inpCommText" rows="3" placeholder="沟通内容..." style="width:100%;margin-bottom:8px"></textarea>
      <input class="inp" id="inpCommMedia" placeholder="图片/文件说明（可选）" style="margin-bottom:8px">
      <div class="vr-evidence-hint">🎙️ 录音将作为证据留存，可随时回放和下载</div>
      <div id="voiceBarComm" style="margin-bottom:6px"></div>
      <input class="inp" id="inpCommAudio" placeholder="录音转写文字（点击上方录音自动填入，也可手动输入）">`, "添加沟通记录");
    VoiceRecord.bind("voiceBarComm", "inpCommAudio", {});
    const ok = document.querySelector("[data-act=modal-ok]");
    ok.onclick = () => {
      /* 先获取录音信息，再销毁 */
      var audioText = document.getElementById("inpCommAudio").value.trim();
      var audioDur = VoiceRecord.getDuration();
      var audioSize = VoiceRecord.getAudioSize();
      VoiceRecord.getAudioBase64(function (b64) {
        VoiceRecord.destroy();
        var r = {
          id: uid(),
          student: document.getElementById("inpCommStudent").value.trim(),
          date: document.getElementById("inpCommDate").value,
          time: document.getElementById("inpCommTime").value.trim(),
          text: document.getElementById("inpCommText").value.trim(),
          media: document.getElementById("inpCommMedia").value.trim(),
          audio: audioText,
          audioData: b64,
          audioDur: audioDur,
          audioSize: audioSize
        };
        if (r.student || r.text) {
          var records = Store.get("commRecords", []);
          records.push(r);
          Store.set("commRecords", records);
          document.getElementById("commRecords").innerHTML = renderCommRecords();
          bindCommDel();
          toast("✅ 沟通记录已保存" + (b64 ? "（含录音证据）" : ""));
        }
        closeModal();
      });
    };
  });
  bindCommDel();
}
function bindCommDel() {
  document.querySelectorAll("[data-act=comm-del]").forEach(b => {
    b.onclick = () => {
      const records = Store.get("commRecords", []);
      Store.set("commRecords", records.filter(r => r.id !== b.dataset.id));
      document.getElementById("commRecords").innerHTML = renderCommRecords();
      bindCommDel();
    };
  });
}
function renderQuickSaved() {
  const saved = Store.get("quickTexts", []);
  const el = document.getElementById("quickSaved");
  if (!el) return;
  if (!saved.length) { el.innerHTML = ""; return; }
  el.innerHTML = `<div style="font-size:12px;color:var(--ink-light);margin-bottom:6px">📌 我的常用文案：</div>` +
    saved.slice().reverse().map((t, i) => `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
      <button class="btn btn-sm btn-ghost" data-act="use-saved" data-i="${saved.length - 1 - i}" style="flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.slice(0, 30))}${t.length > 30 ? "…" : ""}</button>
      <button class="btn btn-sm btn-danger" data-act="del-saved" data-i="${saved.length - 1 - i}">✕</button>
    </div>`).join("");
  el.querySelectorAll("[data-act=use-saved]").forEach(b => {
    b.onclick = () => { document.getElementById("inpQuickWrite").value = saved[+b.dataset.i]; };
  });
  el.querySelectorAll("[data-act=del-saved]").forEach(b => {
    b.onclick = () => {
      saved.splice(+b.dataset.i, 1);
      Store.set("quickTexts", saved);
      renderQuickSaved();
    };
  });
}

/* 高情商回复生成器（本地规则） */
function generateReplies(msg) {
  const hasExam = /考|成绩|分数|排名/.test(msg);
  const hasBad = /不好|差|退步|下滑|不认真|不听话|调皮|玩手机|迟到|打架|闹矛盾|被批评/.test(msg);
  const hasGood = /进步|表扬|表现好|认真|懂事/.test(msg);
  const hasAngry = /气死|怎么办|着急|生气|不管|放弃|没办法/.test(msg);
  const hasQ = /\?|？|吗|呢/.test(msg);

  const warm = `您好！收到您的消息，我非常理解您的心情。${hasBad ? "孩子这个阶段出现波动是很正常的，我们正好可以一起帮他调整。今天我会在课堂上多关注他，及时跟您同步情况。" : hasGood ? "孩子的努力我都看在眼里，您在家里的引导功不可没！" : "咱们一起想办法，肯定能帮孩子越来越好。"}您有任何想法都可以随时和我沟通，我们一起配合。`;
  const prof = `您好！关于您提到的情况，我简单说明一下：${hasBad ? "孩子近期在校表现我会持续关注，并已记录台账，计划本周内进行一对一沟通疏导，届时再向您反馈具体进展。" : hasGood ? "孩子近期在校表现良好，我会继续跟进并给予肯定。" : "我会进一步了解情况后与您沟通。"}建议我们保持定期沟通，共同帮助孩子成长。`;
  const brief = `您好！收到，已了解。${hasBad ? "我会找孩子谈谈，稍后向您反馈。" : hasGood ? "孩子表现很好，请放心！" : "我会跟进处理，有进展及时联系您。"}谢谢您的信任！`;

  return [warm, prof, brief].map(s => s.replace(/\{孩子\}/g, "孩子"));
}

/* 班级通知 AI 润色：让冰冷的通知有温度（本地规则引擎） */
const TONE_SETS = {
  warm: {
    greet: "亲爱的家长朋友们：\n大家晚上好呀～🌙",
    please: "想麻烦大家",
    kid: "宝贝们",
    attend: "诚邀大家",
    closing: "\n\n孩子的每一步成长，都离不开咱们共同的用心。有任何情况，随时欢迎私信我，我们一起想办法。💚"
  },
  formal: {
    greet: "尊敬的各位家长：\n您好！",
    please: "请各位家长",
    kid: "学生",
    attend: "诚邀您",
    closing: "\n\n感谢您的理解与配合！如有疑问，欢迎随时与班主任联系。"
  },
  lively: {
    greet: "各位亲爱的家长：\n见信如面～✨",
    please: "麻烦家长们",
    kid: "小可爱们",
    attend: "诚邀大家",
    closing: "\n\n老师一直在班里守着，有任何事随时找我！比心❤️"
  }
};
function polishNotice(text, tone) {
  const s = TONE_SETS[tone] || TONE_SETS.warm;
  let t = (text || "").trim();
  if (!t) return "";
  const lines = t.split("\n").map(l => l.trim());
  // 标题：取第一行带【】的
  let title = "";
  const ti = lines.findIndex(l => /^【.+】/.test(l));
  if (ti >= 0) { title = lines[ti]; lines.splice(ti, 1); }
  // 去掉原文的客套问候（仅当整行都是问候语时才删，避免误删带正文的行）
  const greetRe = /^(尊敬的|亲爱的|各位家长|家长朋友们|您好|大家好|见信如面|见信|大家晚上好)[！!。.~～，,：:…]?\s*$/;
  const body = lines.filter(l => !greetRe.test(l)).join("\n").trim();
  // 行首残留的问候前缀也替换掉
  let b = body
    .replace(/^尊敬的各位家长[：:]\s*/m, "")
    .replace(/^亲爱的家长朋友们[：:]\s*/m, "")
    .replace(/^您好[！!，,]\s*/m, "")
    .replace(/^大家晚上好[呀啊]?[～~]?\s*/m, "")
    // 温度化替换
    .replace(/请务必提醒孩子/g, s.please + "提醒" + s.kid)
    .replace(/请提醒孩子/g, s.please + "提醒" + s.kid)
    .replace(/请提醒/g, s.please + "提醒")
    .replace(/诚邀您准时参加/g, s.attend + "准时来参加")
    .replace(/感谢您的配合/g, "谢谢大家的配合")
    .replace(/感谢您的理解与支持/g, "谢谢大家的理解与支持")
    .replace(/预祝孩子们取得好成绩/g, "祝" + s.kid + "都能发挥出自己的水平");
  const emoji = tone === "formal" ? "" : tone === "warm" ? " 😊" : " 🎉";
  return `${title}\n${s.greet}\n${b}${emoji}${s.closing}`;
}

/* =========================================================
   模块7 · 荣誉登记
   ========================================================= */
registerModule("honor", {
  title: "🏅 荣誉登记",
  sub: "学生获奖 · 教师荣誉 · 自动生成标本手账",
  render() {
    const honors = Store.get("honors", []);
    const images = Store.get("honorImages", {});
    let html = `
    <div class="mv-header"><h2 class="mv-title">🏅 荣誉登记</h2>
      <p class="mv-sub">记录每一份荣耀 · 支持照片 · 自动生成标本手账</p></div>
    ${modToolbar("荣誉登记")}
    <div class="card" id="sub-add">
      <div class="card-title">➕ 登记新荣誉
        <button class="btn btn-primary btn-sm" data-act="honor-add">＋ 添加荣誉</button>
        <button class="btn btn-ghost btn-sm" data-act="honor-print">🖨️ 打印手账</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <button class="btn btn-sm btn-ghost" data-act="honor-filter" data-t="all">全部</button>
        <button class="btn btn-sm btn-ghost" data-act="honor-filter" data-t="student">👧 学生获奖</button>
        <button class="btn btn-sm btn-ghost" data-act="honor-filter" data-t="teacher">🧑‍🏫 教师荣誉</button>
      </div>
      <div style="font-size:12px;color:var(--ink-light);margin-bottom:10px">💡 添加荣誉后，可在卡片上「📷 加照片」上传奖状/领奖照片，长按手账可下载整理。</div>
    </div>
    <div class="card" id="sub-album">
      <div class="card-title">📖 荣誉标本手账 <span class="sub">自动排版 · 点击照片可下载</span></div>
      <div class="scrapbook ${honors.length ? "scrap-grid-big" : ""}" id="scrapGrid">
        ${honors.length === 0 ? `<div class="empty" style="grid-column:1/-1"><span class="e-ico">🏅</span>还没有荣誉记录，点击「＋ 添加荣誉」开始收藏荣耀时刻</div>` :
        honors.slice().reverse().map((h, i) => {
          const img = images[h.id];
          return `
          <div class="scrap-card ${img ? "has-img" : ""} scrap-${(i % 5) + 1}" data-honor-type="${h.type}">
            <span class="sc-del" data-act="honor-del" data-id="${esc(h.id)}">✕</span>
            ${img ? `<div class="sc-img-wrap">
                <img class="sc-img" src="${img}" alt="荣誉照片">
                <span class="sc-img-more">🏆</span>
                <button class="sc-dl" data-act="scrap-dl" data-id="${esc(h.id)}">⬇️ 下载</button>
              </div>
              <div class="sc-img-body">` : ""}
              <div class="sc-date">${esc(h.date)} · ${h.type === "teacher" ? "教师荣誉" : "学生获奖"}</div>
              <div class="sc-title">${esc(h.title)}</div>
              <div class="sc-desc">${esc(h.desc)}</div>
              ${img ? `<button class="btn btn-ghost btn-sm" data-act="honor-img" data-id="${esc(h.id)}" style="margin-top:8px;width:100%">📷 更换照片</button>`
                : `<button class="img-upload-btn" data-act="honor-img" data-id="${esc(h.id)}">📷 加照片</button>`}
            ${img ? `</div>` : ""}
          </div>`;
        }).join("")}
      </div>
    </div>`;
    return html;
  },
  after() {
    document.querySelector("[data-act=honor-add]")?.addEventListener("click", () => {
      openModal(`
        <select class="inp" id="inpHonorType" style="margin-bottom:8px">
          <option value="student">🌟 学生获奖</option>
          <option value="teacher">🏆 教师荣誉</option>
        </select>
        <input class="inp" id="inpHonorTitle" placeholder="荣誉名称（如：市三好学生）" style="margin-bottom:8px">
        <input class="inp" id="inpHonorName" placeholder="获奖人（学生姓名/老师姓名）" style="margin-bottom:8px">
        <input class="inp" id="inpHonorDate" type="date" value="${Today.now()}" style="margin-bottom:8px">
        <textarea class="tarea" id="inpHonorDesc" rows="3" placeholder="荣誉详情（如：市级征文比赛一等奖）" style="width:100%;margin-bottom:8px"></textarea>
        <label class="img-upload-btn" style="width:100%;cursor:pointer">📷 上传奖状/照片（可选）
          <input type="file" id="inpHonorImg" accept="image/*" style="display:none">
        </label>
        <div class="img-preview" id="inpHonorImgPrev" style="display:none"><img id="inpHonorImgEl" alt=""><button class="ip-del" type="button" data-act="ip-del">✕ 移除</button></div>`, "登记荣誉");
      let honorImg = null;
      const fileInp = document.getElementById("inpHonorImg");
      const prev = document.getElementById("inpHonorImgPrev");
      fileInp.onchange = () => {
        const f = fileInp.files && fileInp.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          honorImg = rd.result;
          document.getElementById("inpHonorImgEl").src = honorImg;
          prev.style.display = "";
        };
        rd.readAsDataURL(f);
      };
      document.querySelector("[data-act=ip-del]")?.addEventListener("click", () => {
        honorImg = null;
        fileInp.value = "";
        prev.style.display = "none";
      });
      const ok = document.querySelector("[data-act=modal-ok]");
      ok.onclick = () => {
        const type = document.getElementById("inpHonorType").value;
        const title = document.getElementById("inpHonorTitle").value.trim();
        const name = document.getElementById("inpHonorName").value.trim();
        const date = document.getElementById("inpHonorDate").value;
        const desc = document.getElementById("inpHonorDesc").value.trim();
        if (!title) { toast("请输入荣誉名称"); return; }
        const honors = Store.get("honors", []);
        const rec = { id: uid(), type, title: type === "teacher" ? title : `${name}·${title}`, name, desc: desc || `${name} 荣获「${title}」`, date };
        honors.push(rec);
        Store.set("honors", honors);
        if (honorImg) {
          const images = Store.get("honorImages", {});
          images[rec.id] = honorImg;
          Store.set("honorImages", images);
        }
        closeModal();
        refreshHonor();
        toast("🎉 荣誉已登记，手账已更新！");
      };
    });
    document.querySelector("[data-act=honor-print]")?.addEventListener("click", () => window.print());
    document.querySelectorAll("[data-act=honor-filter]").forEach(b => {
      b.onclick = () => {
        const t = b.dataset.t;
        document.querySelectorAll("[data-honor-type]").forEach(el => {
          el.style.display = (t === "all" || el.dataset.honorType === t) ? "" : "none";
        });
      };
    });
    document.querySelectorAll("[data-act=honor-del]").forEach(b => {
      b.onclick = () => {
        if (!confirm("确定删除这条荣誉记录吗？照片将一并删除。")) return;
        const honors = Store.get("honors", []);
        Store.set("honors", honors.filter(h => h.id !== b.dataset.id));
        const images = Store.get("honorImages", {});
        if (images[b.dataset.id]) { delete images[b.dataset.id]; Store.set("honorImages", images); }
        refreshHonor();
      };
    });
    // 上传照片（卡片上的按钮）
    document.querySelectorAll("[data-act=honor-img]").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const fi = document.createElement("input");
        fi.type = "file";
        fi.accept = "image/*";
        fi.onchange = () => {
          const f = fi.files && fi.files[0];
          if (!f) return;
          if (f.size > 8 * 1024 * 1024) { toast("图片过大，请选择 8MB 以内的照片"); return; }
          const rd = new FileReader();
          rd.onload = () => {
            const images = Store.get("honorImages", {});
            images[id] = rd.result;
            Store.set("honorImages", images);
            toast("📷 照片已保存到本地");
            refreshHonor();
          };
          rd.readAsDataURL(f);
        };
        fi.click();
      };
    });
    // 下载照片
    document.querySelectorAll("[data-act=scrap-dl]").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const images = Store.get("honorImages", {});
        const dataUrl = images[btn.dataset.id];
        if (!dataUrl) { toast("暂无照片"); return; }
        const honors = Store.get("honors", []);
        const h = honors.find(x => x.id === btn.dataset.id);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "荣誉_" + (h ? h.title.replace(/[\\/:*?"<>|]/g, "_") : btn.dataset.id) + ".jpg";
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast("⬇️ 照片已下载");
      };
    });
  }
});
function refreshHonor() {
  const body = document.getElementById("moduleView");
  if (body) { body.innerHTML = Modules.honor.render(); Modules.honor.after(); }
}


/* ===================== V8 新增渲染函数 ===================== */

/* 学生个人档案 */
function renderStuProfile() {
  const classes = Store.get("classes", defaultClasses());
  const students = Store.get("students", {});
  const clsSelect = classes.map(c => `<option value="${esc(c.name)}">${esc(c.name)}${c.isHome ? "（班主任班）" : ""}</option>`).join("");
  return `<div class="card">
    <div class="card-title">📁 学生个人档案 <span class="sub">查看学生详细信息</span></div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <select class="inp" id="profCls" style="width:auto"><option value="">选择班级</option>${clsSelect}</select>
      <select class="inp" id="profStu" style="width:auto"><option value="">选择学生</option></select>
    </div>
    <div id="profBody"><div class="empty"><span class="e-ico">📁</span>请选择班级和学生查看个人档案</div></div>
  </div>`;
}

function showStuProfile(cls, name) {
  const students = Store.get("students", {});
  const list = students[cls] || [];
  const s = list.find(x => x.name === name);
  if (!s) return;
  const age = s.birthday ? calcAge(s.birthday) : null;
  const rank = list.filter(x => x.total != null).sort((a,b) => b.total - a.total).findIndex(x => x.name === name) + 1;
  const honors = (Store.get("honors", []) || []).filter(h => h.person === name);
  const hw = Store.get("hwRecords", {});
  let unfinCount = 0, lateCount = 0;
  Object.values(hw).forEach(days => {
    Object.values(days || {}).forEach(d => {
      if (d && d.unfinished && d.unfinished.includes(name)) unfinCount++;
      if (d && d.late && d.late.includes(name)) lateCount++;
    });
  });
  const att = Store.get("attendance", {});
  let lateAtt = 0, absentAtt = 0, leaveAtt = 0;
  Object.values(att).forEach(dayData => {
    const rec = dayData && dayData[name];
    if (rec === "late") lateAtt++;
    if (rec === "absent") absentAtt++;
    if (rec === "leave") leaveAtt++;
  });
  const body = document.getElementById("profBody");
  if (!body) return;
  body.innerHTML = `<div class="profile-grid">
    <div class="stat-chip"><span class="sc-num">${esc(s.name)}</span><span class="sc-label">姓名</span></div>
    <div class="stat-chip"><span class="sc-num">${esc(s.gender || "—")}</span><span class="sc-label">性别</span></div>
    <div class="stat-chip"><span class="sc-num">${s.birthday ? esc(s.birthday) : "未设置"}</span><span class="sc-label">出生年月${age ? "（" + age + "岁）" : ""}</span></div>
    <div class="stat-chip"><span class="sc-num">${esc(cls)}</span><span class="sc-label">班级</span></div>
    <div class="stat-chip"><span class="sc-num">${s.chinese != null ? s.chinese : "—"}</span><span class="sc-label">语文</span></div>
    <div class="stat-chip"><span class="sc-num">${s.math != null ? s.math : "—"}</span><span class="sc-label">数学</span></div>
    <div class="stat-chip"><span class="sc-num">${s.english != null ? s.english : "—"}</span><span class="sc-label">英语</span></div>
    <div class="stat-chip"><span class="sc-num">${s.total != null ? s.total : "—"}</span><span class="sc-label">总分${rank ? "（第" + rank + "名）" : ""}</span></div>
    <div class="stat-chip"><span class="sc-num">${honors.length}</span><span class="sc-label">获奖次数</span></div>
    <div class="stat-chip"><span class="sc-num">${unfinCount}</span><span class="sc-label">作业未交次数</span></div>
    <div class="stat-chip"><span class="sc-num">${lateCount}</span><span class="sc-label">补交次数</span></div>
    <div class="stat-chip"><span class="sc-num">${lateAtt + absentAtt + leaveAtt}</span><span class="sc-label">考勤异常（迟到${lateAtt}/缺勤${absentAtt}/请假${leaveAtt}）</span></div>
  </div>
  ${honors.length ? `<div class="card" style="margin-top:12px"><div class="card-title">🏅 获奖记录</div><table class="tbl"><tr><th>荣誉名称</th><th>日期</th><th>详情</th></tr>${honors.map(h => `<tr><td>${esc(h.name)}</td><td>${esc(h.date || "—")}</td><td>${esc(h.detail || "—")}</td></tr>`).join("")}</table></div>` : ""}
  <div style="margin-top:12px"><button class="btn btn-ghost btn-sm" data-act="stu-profile-report" data-name="${esc(name)}" data-cls="${esc(cls)}">📄 导出个人报告</button></div>`;
}

/* 信息导入导出 */
function renderStuIO() {
  const classes = Store.get("classes", defaultClasses());
  const students = Store.get("students", {});
  const total = Object.values(students).flat().length;
  return `<div class="card">
    <div class="card-title">📦 信息导入导出 <span class="sub">${total} 名学生</span></div>
    <div style="font-size:13px;color:var(--ink-light);margin-bottom:16px;line-height:1.7">
      <b>导入格式：</b>每行一名学生，用逗号分隔：<code>班级,姓名,性别,语文,数学,英语,总分,出生年月</code><br>
      <b>示例：</b><code>701班,张三,男,85,90,88,263,2010-05-12</code>
    </div>
    <div style="margin-bottom:12px">
      <textarea class="inp" id="ioTextarea" rows="8" placeholder="粘贴学生数据（每行一名学生）&#10;701班,张三,男,85,90,88,263,2010-05-12&#10;701班,李四,女,78,92,85,255,"></textarea>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-primary" data-act="stu-io-import">📥 批量导入</button>
      <button class="btn btn-ghost" data-act="stu-io-export-all">⬇️ 导出全部（CSV）</button>
      <button class="btn btn-ghost" data-act="stu-io-export-cls">⬇️ 按班级导出</button>
    </div>
    <div id="ioResult" style="margin-top:12px"></div>
  </div>`;
}

/* 个人报告导出 */
function renderStuReport() {
  const classes = Store.get("classes", defaultClasses());
  const students = Store.get("students", {});
  const allNames = Object.values(students).flat().map(s => s.name);
  return `<div class="card">
    <div class="card-title">📄 个人报告导出 <span class="sub">生成学生综合报告打印给家长</span></div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <select class="inp" id="repCls" style="width:auto"><option value="">选择班级</option>${classes.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("")}</select>
      <select class="inp" id="repStu" style="width:auto"><option value="">选择学生</option></select>
      <button class="btn btn-primary" data-act="stu-rep-gen">📄 生成报告</button>
    </div>
    <div style="font-size:13px;color:var(--ink-light)">报告包含：基本信息、成绩排名、获奖记录、考勤统计、作业完成情况、期末评语。</div>
    <div id="repBody" style="margin-top:12px"></div>
  </div>`;
}

function genStuReport(name, cls) {
  const students = Store.get("students", {});
  const list = students[cls] || [];
  const s = list.find(x => x.name === name);
  if (!s) { toast("学生不存在"); return; }
  const age = s.birthday ? calcAge(s.birthday) : null;
  const rank = list.filter(x => x.total != null).sort((a,b) => b.total - a.total).findIndex(x => x.name === name) + 1;
  const honors = (Store.get("honors", []) || []).filter(h => h.person === name);
  const avg = list.filter(x => x.total != null).length ? (list.filter(x => x.total != null).reduce((a,x) => a + x.total, 0) / list.filter(x => x.total != null).length).toFixed(1) : "—";
  const level = s.total >= 270 ? "A" : s.total >= 225 ? "B" : s.total >= 180 ? "C" : "D";
  const commentMap = {
    A: s.gender === "女" ? "该生学习优秀，各科均衡发展，是同学们的好榜样。望保持锐气，百尺竿头更进一步。" : "该生成绩优异，勤奋好学，望继续努力，勇攀高峰。",
    B: s.gender === "女" ? "该生学习踏实，成绩稳定。望多些自信与主动，找到属于自己的闪光点。" : "该生态度端正，成绩良好。望在薄弱科目上多下功夫，争取更大突破。",
    C: s.gender === "女" ? "该生性格温和，有进步空间。望端正态度，找到适合自己的学习方法。" : "该生有待努力，潜力尚大。望多问多练，迎头赶上。",
    D: s.gender === "女" ? "该生需加倍努力，望家校配合，树立信心，一步一个脚印向前。" : "该生需要加倍努力，望找到问题根源，坚定信念，奋起直追。"
  };
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(name)} - 个人报告</title>
  <style>body{font-family:"Microsoft YaHei",sans-serif;max-width:600px;margin:20px auto;padding:20px;color:#333}
  h1{text-align:center;color:#1B4332;border-bottom:3px solid #2D6A4F;padding-bottom:10px}
  h2{color:#2D6A4F;border-left:4px solid #52B788;padding-left:10px;margin-top:20px}
  table{width:100%;border-collapse:collapse;margin:10px 0}td,th{border:1px solid #ddd;padding:8px;text-align:center}
  th{background:#52B788;color:#fff}.stat{display:inline-block;background:#f0f7f4;padding:8px 16px;margin:4px;border-radius:8px}
  .comment{background:#f8f9fa;padding:15px;border-radius:8px;line-height:1.8;font-size:15px;margin-top:10px}
  @media print{body{margin:0}}</style></head><body>
  <h1>📊 学生个人成长报告</h1>
  <p style="text-align:center;color:#666">${esc(cls)} · ${new Date().toLocaleDateString("zh-CN")}</p>
  <h2>📋 基本信息</h2>
  <table><tr><th>姓名</th><td>${esc(s.name)}</td><th>性别</th><td>${esc(s.gender || "—")}</td></tr>
  <tr><th>班级</th><td>${esc(cls)}</td><th>出生年月</th><td>${s.birthday ? esc(s.birthday) + (age ? "（" + age + "岁）" : "") : "未设置"}</td></tr></table>
  <h2>📈 成绩信息</h2>
  <table><tr><th>语文</th><th>数学</th><th>英语</th><th>总分</th><th>班级排名</th><th>班级均分</th></tr>
  <tr><td>${s.chinese ?? "—"}</td><td>${s.math ?? "—"}</td><td>${s.english ?? "—"}</td><td>${s.total ?? "—"}</td><td>${rank || "—"}</td><td>${avg}</td></tr></table>
  ${honors.length ? `<h2>🏅 获奖记录</h2><table><tr><th>荣誉名称</th><th>日期</th><th>详情</th></tr>${honors.map(h => `<tr><td>${esc(h.name)}</td><td>${esc(h.date || "—")}</td><td>${esc(h.detail || "—")}</td></tr>`).join("")}</table>` : ""}
  <h2>💬 期末评语</h2>
  <div class="comment">${commentMap[level] || ""}</div>
  <p style="text-align:center;color:#999;margin-top:30px;font-size:12px">啊敏的兵 · 班主任工作台生成</p>
  <script>window.print()</script></body></html>`);
  w.document.close();
}

/* 作业统计看板 */
function renderHwBoard() {
  const classes = Store.get("classes", defaultClasses());
  const hw = Store.get("hwRecords", {});
  const students = Store.get("students", {});
  const unfinCount = {};  // 学生 -> 未交次数
  const allComplete = []; // 全勤学生
  classes.forEach(c => {
    const list = students[c.name] || [];
    list.forEach(s => {
      let cnt = 0;
      Object.values(hw[c.id] || {}).forEach(day => {
        if (day && day.unfinished && day.unfinished.includes(s.name)) cnt++;
      });
      if (cnt > 0) unfinCount[s.name + "（" + c.name + "）"] = cnt;
      else allComplete.push(s.name + "（" + c.name + "）");
    });
  });
  const sortedUnfin = Object.entries(unfinCount).filter(e => e[1] >= 3).sort((a,b) => b[1] - a[1]);
  return `<div class="card">
    <div class="card-title">📊 作业统计看板 <span class="sub">多次未交 & 作业全勤</span></div>
    <div class="stat-chip" style="display:inline-block;margin:8px"><span class="sc-num" style="font-size:24px;color:#e74c3c">${sortedUnfin.length}</span><span class="sc-label">三次以上未交</span></div>
    <div class="stat-chip" style="display:inline-block;margin:8px"><span class="sc-num" style="font-size:24px;color:#27ae60">${allComplete.length}</span><span class="sc-label">作业全勤</span></div>
    ${sortedUnfin.length ? `<h3 style="color:#e74c3c;margin:16px 0 8px">⚠️ 三次以上未交作业的学生</h3>
    <table class="tbl"><tr><th>姓名（班级）</th><th>未交次数</th></tr>${sortedUnfin.map(e => `<tr><td>${esc(e[0])}</td><td style="color:#e74c3c;font-weight:bold">${e[1]}</td></tr>`).join("")}</table>` : `<div class="empty" style="margin:16px 0"><span class="e-ico">✅</span>没有三次以上未交的学生，太棒了！</div>`}
    ${allComplete.length ? `<h3 style="color:#27ae60;margin:16px 0 8px">🎉 作业全勤的学生</h3>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${allComplete.map(n => `<span class="stat-chip" style="display:inline-block"><span class="sc-label">${esc(n)}</span></span>`).join("")}</div>` : ""}
  </div>`;
}

/* 背书登记 */
function renderHwRecite() {
  const classes = Store.get("classes", defaultClasses());
  const hw = Store.get("hwRecords", {});
  const students = Store.get("students", {});
  const today = Today.now();
  return `<div class="card">
    <div class="card-title">📖 背书登记 <span class="sub">勾选已背诵过关的学生</span>
      <button class="btn btn-ghost btn-sm" data-act="hw-recite-export">⬇️ 导出</button>
    </div>
    <div style="font-size:12px;color:var(--ink-light);margin-bottom:12px">💡 背书记录与作业登记共用同一数据源，在作业登记勾选的背书在此同步显示。</div>
    ${classes.map(c => {
      const rec = normHwRecord(hw[c.id]);
      const list = students[c.name] || [];
      if (!list.length) return "";
      const todayRec = rec[today] || { unfinished: [], late: [], recite: [], dictation: [] };
      return `<details class="details-box" ${c.isHome ? "open" : ""}>
        <summary>${esc(c.name)}（${list.length}人）</summary>
        <div class="db-body">
        <table class="tbl"><tr><th class="num">#</th><th>姓名</th><th>背书过关</th></tr>
        ${list.map((s, i) => {
          const passed = (todayRec.recite || []).includes(s.name);
          return `<tr><td class="num">${i+1}</td><td>${esc(s.name)}</td>
            <td><input type="checkbox" data-act="hw-recite-toggle" data-cls="${esc(c.id)}" data-name="${esc(s.name)}" ${passed ? "checked" : ""}></td></tr>`;
        }).join("")}</table>
        </div>
      </details>`;
    }).join("")}
  </div>`;
}

/* 默写登记 */
function renderHwDict() {
  const classes = Store.get("classes", defaultClasses());
  const hw = Store.get("hwRecords", {});
  const students = Store.get("students", {});
  const today = Today.now();
  return `<div class="card">
    <div class="card-title">✍️ 默写登记 <span class="sub">勾选已默写过关的学生</span>
      <button class="btn btn-ghost btn-sm" data-act="hw-dict-export">⬇️ 导出</button>
    </div>
    <div style="font-size:12px;color:var(--ink-light);margin-bottom:12px">💡 默写记录与作业登记共用同一数据源。</div>
    ${classes.map(c => {
      const rec = normHwRecord(hw[c.id]);
      const list = students[c.name] || [];
      if (!list.length) return "";
      const todayRec = rec[today] || { unfinished: [], late: [], recite: [], dictation: [] };
      return `<details class="details-box" ${c.isHome ? "open" : ""}>
        <summary>${esc(c.name)}（${list.length}人）</summary>
        <div class="db-body">
        <table class="tbl"><tr><th class="num">#</th><th>姓名</th><th>默写过关</th></tr>
        ${list.map((s, i) => {
          const passed = (todayRec.dictation || []).includes(s.name);
          return `<tr><td class="num">${i+1}</td><td>${esc(s.name)}</td>
            <td><input type="checkbox" data-act="hw-dict-toggle" data-cls="${esc(c.id)}" data-name="${esc(s.name)}" ${passed ? "checked" : ""}></td></tr>`;
        }).join("")}</table>
        </div>
      </details>`;
    }).join("")}
  </div>`;
}
