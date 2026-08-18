/* =========================================================
   📆 每月小结 · 班级月度成长报告
   四大板块：出勤 / 表扬 / 作业 / 活动 → AI 汇总 → 家长版 PPT
   正能量原则：PPT 只展示整体数据 + 正向表扬名单
   ========================================================= */

const MONTHLY_MAX_PHOTOS = 40;

/* 存储结构 monthlyNotes: { "2026-08": { photos: [{id,data,cap,date}], summary, updatedAt } } */
function monthlyKey(y, m) { return y + "-" + String(m).padStart(2, "0"); }
function currentMonthKey() { const n = new Date(); return monthlyKey(n.getFullYear(), n.getMonth() + 1); }
function getMonthly(key) {
  const all = Store.get("monthlyNotes", {});
  return all[key] || { photos: [], summary: "", updatedAt: "" };
}
function saveMonthly(key, data) {
  const all = Store.get("monthlyNotes", {});
  data.updatedAt = Today.now();
  all[key] = data;
  Store.set("monthlyNotes", all);
}

/* 图片压缩：canvas 等比缩放 → JPEG；无 canvas 环境降级返回原图 */
function compressImage(dataUrl, maxW, quality, cb) {
  try {
    const img = new Image();
    img.onload = function () {
      try {
        const scale = Math.min(1, (maxW || 900) / img.width);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL("image/jpeg", quality || 0.72));
      } catch (e) { cb(dataUrl); }
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  } catch (e) { cb(dataUrl); }
}

/* 聚合一个月数据 → 四大板块模型（纯函数，可测试） */
function monthlyAggregate(y, m) {
  const prefix = monthlyKey(y, m);
  const students = Store.get("students", {});
  const allNames = [];
  Object.values(students).forEach(function (list) {
    (list || []).forEach(function (s) { if (s && s.name) allNames.push(s.name); });
  });

  /* ① 出勤 */
  const att = Store.get("attendance", {});
  let attDays = 0, lateCnt = 0, leaveCnt = 0, absentCnt = 0, totalMarks = 0;
  const marked = {}; /* 学生名 -> 是否出现过异常 */
  const attNameSet = {};
  Object.keys(att).forEach(function (d) {
    if (!d || d.indexOf(prefix) !== 0) return;
    attDays++;
    const rec = att[d] || {};
    Object.keys(rec).forEach(function (nm) {
      totalMarks++;
      attNameSet[nm] = true;
      if (rec[nm] === "late") { lateCnt++; marked[nm] = true; }
      else if (rec[nm] === "leave") { leaveCnt++; marked[nm] = true; }
      else if (rec[nm] === "absent") { absentCnt++; marked[nm] = true; }
    });
  });
  const fullAttendance = Object.keys(attNameSet).filter(function (nm) { return !marked[nm]; }).sort();
  const attRate = totalMarks ? Math.round((1 - (lateCnt + leaveCnt + absentCnt) / totalMarks) * 100) : 0;

  /* ② 表扬（荣誉登记中学生获奖，日期落在本月） */
  const honors = Store.get("honors", []);
  const praiseList = [];
  const praiseAgg = {};
  (honors || []).forEach(function (h) {
    if (h.type === "teacher") return;
    if (!h.date || h.date.indexOf(prefix) !== 0) return;
    const nm = h.name || (h.title || "").split("·")[0] || "";
    praiseList.push({ name: nm, title: h.title, date: h.date });
    praiseAgg[nm] = (praiseAgg[nm] || 0) + 1;
  });

  /* ③ 作业 */
  const hw = Store.get("hwRecords", {});
  let hwDays = 0, unfinTotal = 0, lateTotal = 0, reciteTotal = 0, dictTotal = 0;
  const unfinSet = {};
  Object.keys(hw).forEach(function (d) {
    if (!d || d.indexOf(prefix) !== 0) return;
    hwDays++;
    Object.values(hw[d] || {}).forEach(function (r) {
      const nr = normHwRecord(r);
      unfinTotal += nr.unfinished.length;
      lateTotal += nr.late.length;
      reciteTotal += nr.recite.length;
      dictTotal += nr.dictation.length;
      nr.unfinished.forEach(function (nm) { unfinSet[nm] = true; });
    });
  });
  const zeroUnfinished = allNames.filter(function (nm) { return !unfinSet[nm]; });

  /* ④ 活动（照片 + 说明） */
  const photos = getMonthly(prefix).photos || [];

  return {
    key: prefix, y: y, m: m,
    attend: { days: attDays, totalMarks, late: lateCnt, leave: leaveCnt, absent: absentCnt, rate: attRate, full: fullAttendance },
    praise: { list: praiseList, agg: praiseAgg, count: praiseList.length },
    hw: { days: hwDays, unfin: unfinTotal, late: lateTotal, recite: reciteTotal, dict: dictTotal, zeroUnfinished: zeroUnfinished },
    activity: { photos: photos, count: photos.length },
    studentTotal: allNames.length
  };
}

/* 生成四板块文本摘要（AI 汇总，可编辑保存） */
function buildMonthlyText(agg) {
  const L = [];
  L.push("【" + agg.key + " 班级月度小结】\n");
  L.push("一、出勤表现");
  if (agg.attend.days === 0) {
    L.push("本月暂无考勤登记。建议在「班级管理 → 考勤」每天登记，月度小结才能自动统计。");
  } else {
    L.push("本月共登记 " + agg.attend.days + " 天考勤，整体出勤率约 " + agg.attend.rate + "%。");
    const parts = [];
    if (agg.attend.late) parts.push("迟到 " + agg.attend.late + " 人次");
    if (agg.attend.leave) parts.push("请假 " + agg.attend.leave + " 人次");
    if (agg.attend.absent) parts.push("缺勤 " + agg.attend.absent + " 人次");
    L.push("其中" + (parts.length ? parts.join("、") : "无迟到、请假、缺勤记录，出勤非常稳定") + "。");
    if (agg.attend.full.length) L.push("全勤之星（本月无迟到/请假/缺勤）：" + agg.attend.full.join("、") + "。");
  }
  L.push("");
  L.push("二、表扬与荣誉");
  if (!agg.praise.count) {
    L.push("本月暂未登记学生荣誉。可在「荣誉登记」补充，让家长看到孩子的闪光点。");
  } else {
    const names = Object.keys(agg.praise.agg).map(function (nm) { return nm + (agg.praise.agg[nm] > 1 ? "×" + agg.praise.agg[nm] : ""); });
    L.push("本月共有 " + agg.praise.count + " 条学生荣誉记录，获奖同学：" + names.join("、") + "。");
    agg.praise.list.slice(0, 6).forEach(function (p) { L.push("· " + p.name + "：" + p.title + "（" + p.date + "）"); });
  }
  L.push("");
  L.push("三、作业表现");
  if (agg.hw.days === 0) {
    L.push("本月暂无作业登记。可在「作业提效 → 作业登记」记录，月度小结会自动汇总。");
  } else {
    L.push("本月共登记 " + agg.hw.days + " 天作业。未交 " + agg.hw.unfin + " 人次、补交 " + agg.hw.late + " 人次、背书过关 " + agg.hw.recite + " 人次、默写过关 " + agg.hw.dict + " 人次。");
    if (agg.hw.zeroUnfinished.length) L.push("作业全勤（本月从未缺交）：" + agg.hw.zeroUnfinished.slice(0, 20).join("、") + (agg.hw.zeroUnfinished.length > 20 ? " 等" : "") + "。");
  }
  L.push("");
  L.push("四、活动剪影");
  if (!agg.activity.count) {
    L.push("本月尚未上传活动照片。上传照片后，家长版 PPT 会自动生成活动回顾页。");
  } else {
    L.push("本月共上传 " + agg.activity.count + " 张活动照片，记录班级生活的精彩瞬间。");
    const caps = agg.activity.photos.filter(function (p) { return p.cap; });
    if (caps.length) L.push("活动说明：" + caps.map(function (p) { return p.cap; }).join("；") + "。");
  }
  L.push("");
  L.push("五、班主任寄语");
  L.push("孩子的每一次进步都值得被看见。感谢各位家长的信任与配合，让我们继续家校同心，陪伴孩子健康快乐地成长。");
  return L.join("\n");
}

/* 生成家长版 PPT（pptxgenjs，含照片墙） */
function downloadMonthlyPPT(y, m) {
  loadPptxGen(function () {
    try {
      const agg = monthlyAggregate(y, m);
      const cls = (Store.get("classes", defaultClasses()).find(function (c) { return c.isHome; }) || {}).name || "班主任班";
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "WIDE", width: 10, height: 5.625 });
      pptx.layout = "WIDE";
      const GREEN = "1F5C4D", GOLD = "D9A441", WHITE = "FFFFFF", INK = "33443F";
      const GREEN2 = "3E9C86", SOFT = "8A9A93";
      let slide;

      /* 封面 */
      slide = pptx.addSlide();
      slide.background = { color: GREEN };
      slide.addText("啊敏的兵 · 每月小结", { x: 0.5, y: 0.4, w: 9, h: 0.5, fontSize: 12, color: "BFE3D5", align: "left", fontFace: "Microsoft YaHei" });
      slide.addText(agg.key, { x: 0.5, y: 1.5, w: 9, h: 1.2, fontSize: 40, bold: true, color: WHITE, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText("班级月度成长报告", { x: 0.5, y: 2.8, w: 9, h: 0.6, fontSize: 20, color: GOLD, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText(cls + " · 出勤 / 表扬 / 作业 / 活动 四大板块", { x: 0.8, y: 3.8, w: 8.4, h: 0.6, fontSize: 13, color: "BFE3D5", align: "center", fontFace: "Microsoft YaHei" });
      slide.addText("让家长看见孩子的每一天", { x: 0.8, y: 4.6, w: 8.4, h: 0.5, fontSize: 12, color: "BFE3D5", align: "center", fontFace: "Microsoft YaHei" });

      /* ① 出勤表现 */
      slide = pptx.addSlide();
      slide.background = { color: WHITE };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
      slide.addText("⏰ 出勤表现", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
      slide.addText("整体数据 · 全勤之星点名表扬", { x: 0.6, y: 1.05, w: 8.8, h: 0.4, fontSize: 12, color: SOFT, fontFace: "Microsoft YaHei" });
      if (agg.attend.days === 0) {
        slide.addText("本月暂无考勤登记数据", { x: 0.9, y: 2.0, w: 8.2, h: 0.8, fontSize: 16, color: INK, fontFace: "Microsoft YaHei" });
      } else {
        slide.addText("本月出勤率 " + agg.attend.rate + "%", { x: 0.9, y: 1.7, w: 4.0, h: 0.9, fontSize: 26, bold: true, color: GREEN2, fontFace: "Microsoft YaHei" });
        slide.addText("登记 " + agg.attend.days + " 天 · 迟到 " + agg.attend.late + " 人次 · 请假 " + agg.attend.leave + " 人次 · 缺勤 " + agg.attend.absent + " 人次", { x: 0.9, y: 2.6, w: 8.2, h: 0.5, fontSize: 12, color: INK, fontFace: "Microsoft YaHei" });
        if (agg.attend.full.length) {
          slide.addText("🌟 全勤之星", { x: 0.9, y: 3.3, w: 8.2, h: 0.4, fontSize: 14, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
          const names = agg.attend.full.slice(0, 24);
          slide.addText(names.join("、") + (agg.attend.full.length > 24 ? " 等" : ""), { x: 0.9, y: 3.75, w: 8.2, h: 1.2, fontSize: 12, color: INK, fontFace: "Microsoft YaHei" });
        } else {
          slide.addText("愿每个孩子都能坚持到校，风雨无阻", { x: 0.9, y: 3.4, w: 8.2, h: 0.5, fontSize: 13, color: SOFT, fontFace: "Microsoft YaHei" });
        }
      }

      /* ② 表扬与荣誉 */
      slide = pptx.addSlide();
      slide.background = { color: WHITE };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GOLD } });
      slide.addText("🌟 表扬与荣誉", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
      slide.addText("为每一位努力的孩子喝彩", { x: 0.6, y: 1.05, w: 8.8, h: 0.4, fontSize: 12, color: SOFT, fontFace: "Microsoft YaHei" });
      if (!agg.praise.count) {
        slide.addText("本月暂无荣誉记录，期待孩子们更多精彩表现", { x: 0.9, y: 2.0, w: 8.2, h: 0.8, fontSize: 15, color: INK, fontFace: "Microsoft YaHei" });
      } else {
        slide.addText("共 " + agg.praise.count + " 条荣誉记录", { x: 0.9, y: 1.6, w: 8.2, h: 0.5, fontSize: 14, bold: true, color: GREEN2, fontFace: "Microsoft YaHei" });
        agg.praise.list.slice(0, 8).forEach(function (p, i) {
          slide.addText("🏅 " + p.name + " · " + p.title + "（" + p.date + "）", { x: 1.0, y: 2.2 + i * 0.38, w: 8.0, h: 0.34, fontSize: 12, color: INK, fontFace: "Microsoft YaHei" });
        });
        if (agg.praise.list.length > 8) slide.addText("…… 等 " + agg.praise.list.length + " 条", { x: 1.0, y: 2.2 + 8 * 0.38, w: 8.0, h: 0.3, fontSize: 11, color: SOFT, fontFace: "Microsoft YaHei" });
      }

      /* ③ 作业表现 */
      slide = pptx.addSlide();
      slide.background = { color: WHITE };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GREEN } });
      slide.addText("📚 作业表现", { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
      slide.addText("整体数据 · 作业全勤点名表扬", { x: 0.6, y: 1.05, w: 8.8, h: 0.4, fontSize: 12, color: SOFT, fontFace: "Microsoft YaHei" });
      if (agg.hw.days === 0) {
        slide.addText("本月暂无作业登记数据", { x: 0.9, y: 2.0, w: 8.2, h: 0.8, fontSize: 16, color: INK, fontFace: "Microsoft YaHei" });
      } else {
        slide.addText("登记 " + agg.hw.days + " 天 · 未交 " + agg.hw.unfin + " 人次 · 补交 " + agg.hw.late + " 人次", { x: 0.9, y: 1.7, w: 8.2, h: 0.5, fontSize: 15, bold: true, color: GREEN2, fontFace: "Microsoft YaHei" });
        slide.addText("背书过关 " + agg.hw.recite + " 人次 · 默写过关 " + agg.hw.dict + " 人次", { x: 0.9, y: 2.25, w: 8.2, h: 0.45, fontSize: 13, color: INK, fontFace: "Microsoft YaHei" });
        if (agg.hw.zeroUnfinished.length) {
          slide.addText("📗 作业全勤（本月从未缺交）", { x: 0.9, y: 2.9, w: 8.2, h: 0.4, fontSize: 14, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
          const names = agg.hw.zeroUnfinished.slice(0, 22);
          slide.addText(names.join("、") + (agg.hw.zeroUnfinished.length > 22 ? " 等" : ""), { x: 0.9, y: 3.35, w: 8.2, h: 1.3, fontSize: 12, color: INK, fontFace: "Microsoft YaHei" });
        } else {
          slide.addText("愿每个孩子都能按时完成作业，养成好习惯", { x: 0.9, y: 3.2, w: 8.2, h: 0.5, fontSize: 13, color: SOFT, fontFace: "Microsoft YaHei" });
        }
      }

      /* ④ 活动剪影（照片墙，每页 4 张） */
      if (agg.activity.count) {
        const photos = agg.activity.photos;
        const perPage = 4;
        const pages = Math.ceil(photos.length / perPage);
        for (let p = 0; p < pages; p++) {
          slide = pptx.addSlide();
          slide.background = { color: WHITE };
          slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GOLD } });
          slide.addText("🎈 活动剪影" + (pages > 1 ? "（" + (p + 1) + "/" + pages + "）" : ""), { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontSize: 24, bold: true, color: GREEN, fontFace: "Microsoft YaHei" });
          slide.addText("记录班级生活的精彩瞬间", { x: 0.6, y: 1.05, w: 8.8, h: 0.4, fontSize: 12, color: SOFT, fontFace: "Microsoft YaHei" });
          const chunk = photos.slice(p * perPage, p * perPage + perPage);
          chunk.forEach(function (ph, i) {
            const col = i % 2, row = Math.floor(i / 2);
            const px = 0.7 + col * 4.45, py = 1.7 + row * 1.95;
            try {
              slide.addImage({ data: ph.data, x: px, y: py, w: 4.2, h: 1.75, sizing: { type: "contain", w: 4.2, h: 1.75 } });
            } catch (e) { /* 图片异常跳过 */ }
            if (ph.cap) slide.addText("· " + ph.cap, { x: px, y: py + 1.78, w: 4.2, h: 0.3, fontSize: 9, color: SOFT, fontFace: "Microsoft YaHei" });
          });
        }
      }

      /* 结尾 */
      slide = pptx.addSlide();
      slide.background = { color: GREEN };
      slide.addText("家校同心 · 见证成长", { x: 0.5, y: 1.9, w: 9, h: 1.2, fontSize: 30, bold: true, color: WHITE, align: "center", fontFace: "Microsoft YaHei" });
      slide.addText("孩子的每一次进步，都离不开您的支持与陪伴。", { x: 0.8, y: 3.3, w: 8.4, h: 0.6, fontSize: 14, color: "BFE3D5", align: "center", fontFace: "Microsoft YaHei" });
      slide.addText("有需要沟通的情况，欢迎随时联系班主任", { x: 0.8, y: 4.1, w: 8.4, h: 0.5, fontSize: 12, color: GOLD, align: "center", fontFace: "Microsoft YaHei" });

      pptx.writeFile({ fileName: "月度小结_" + agg.key + ".pptx" });
      toast("✅ 月度小结 PPT 已生成并下载");
    } catch (e) { toast("⚠️ PPT 生成失败：" + e.message); }
  });
}

/* 打印月度小结（新窗口 16:9 卡片，可打印为 PDF） */
function printMonthly(y, m) {
  const agg = monthlyAggregate(y, m);
  const w = window.open("", "_blank");
  if (!w) { toast("⚠️ 请允许弹出窗口"); return; }
  const escTxt = function (s) { return esc(s || ""); };
  let slides = "";
  slides += '<div class="ps-slide" style="background:#1F5C4D;justify-content:center;align-items:center;text-align:center">' +
    '<div style="color:#BFE3D5;font-size:14px">啊敏的兵 · 每月小结</div>' +
    '<div style="color:#fff;font-size:44px;font-weight:700;margin:16px 0">' + agg.key + '</div>' +
    '<div style="color:#D9A441;font-size:18px">班级月度成长报告</div>' +
    '<div style="color:#BFE3D5;font-size:13px;margin-top:20px">出勤 / 表扬 / 作业 / 活动 四大板块</div></div>';
  slides += '<div class="ps-slide"><div class="ps-head"><span>啊敏的兵 · 每月小结</span><span>⏰ 出勤表现</span></div><div class="ps-body">' +
    '<div class="ps-title">出勤表现</div>' +
    (agg.attend.days === 0 ? '<div class="ps-sub">本月暂无考勤登记数据</div>' :
      '<div class="ps-sub">本月出勤率 ' + agg.attend.rate + '% · 登记 ' + agg.attend.days + ' 天 · 迟到 ' + agg.attend.late + ' 人次 · 请假 ' + agg.attend.leave + ' 人次 · 缺勤 ' + agg.attend.absent + ' 人次</div>' +
      '<div style="font-size:18px;color:#1F5C4D;font-weight:700;margin:14px 0 8px">🌟 全勤之星</div>' +
      '<div style="font-size:16px;color:#33443F;line-height:2">' + escTxt(agg.attend.full.join("、") || "本月无全勤记录") + '</div>') +
    '</div><div class="ps-foot">整体数据 + 全勤点名表扬</div></div>';
  slides += '<div class="ps-slide"><div class="ps-head"><span>啊敏的兵 · 每月小结</span><span>🌟 表扬与荣誉</span></div><div class="ps-body">' +
    '<div class="ps-title">表扬与荣誉</div>' +
    (agg.praise.count === 0 ? '<div class="ps-sub">本月暂无荣誉记录，期待更多精彩表现</div>' :
      '<div class="ps-sub">共 ' + agg.praise.count + ' 条荣誉记录</div>' +
      agg.praise.list.slice(0, 10).map(function (p) { return '<li>🏅 ' + escTxt(p.name) + ' · ' + escTxt(p.title) + '（' + escTxt(p.date) + '）</li>'; }).join("")) +
    '</div><div class="ps-foot">为每一位努力的孩子喝彩</div></div>';
  slides += '<div class="ps-slide"><div class="ps-head"><span>啊敏的兵 · 每月小结</span><span>📚 作业表现</span></div><div class="ps-body">' +
    '<div class="ps-title">作业表现</div>' +
    (agg.hw.days === 0 ? '<div class="ps-sub">本月暂无作业登记数据</div>' :
      '<div class="ps-sub">登记 ' + agg.hw.days + ' 天 · 未交 ' + agg.hw.unfin + ' 人次 · 补交 ' + agg.hw.late + ' 人次 · 背书过关 ' + agg.hw.recite + ' 人次 · 默写过关 ' + agg.hw.dict + ' 人次</div>' +
      '<div style="font-size:18px;color:#1F5C4D;font-weight:700;margin:14px 0 8px">📗 作业全勤（本月从未缺交）</div>' +
      '<div style="font-size:16px;color:#33443F;line-height:2">' + escTxt(agg.hw.zeroUnfinished.slice(0, 22).join("、") || "暂无") + '</div>') +
    '</div><div class="ps-foot">整体数据 + 作业全勤点名表扬</div></div>';
  if (agg.activity.count) {
    slides += '<div class="ps-slide"><div class="ps-head"><span>啊敏的兵 · 每月小结</span><span>🎈 活动剪影</span></div><div class="ps-body" style="overflow:auto">' +
      '<div class="ps-title">活动剪影（' + agg.activity.count + ' 张）</div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px">' +
      agg.activity.photos.slice(0, 12).map(function (ph) {
        return '<div style="width:270px"><img src="' + ph.data + '" style="width:270px;height:160px;object-fit:cover;border-radius:6px"><div style="font-size:11px;color:#8A9A93;margin-top:4px">' + escTxt(ph.cap || "精彩瞬间") + '</div></div>';
      }).join("") + '</div></div><div class="ps-foot">记录班级生活的精彩瞬间</div></div>';
  }
  slides += '<div class="ps-slide" style="background:#1F5C4D;justify-content:center;align-items:center;text-align:center">' +
    '<div style="color:#fff;font-size:34px;font-weight:700">家校同心 · 见证成长</div>' +
    '<div style="color:#D9A441;font-size:16px;margin-top:16px">孩子的每一次进步，都离不开您的支持与陪伴</div></div>';
  w.document.write('<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
    "<title>月度小结_" + agg.key + "</title>" +
    '<style>' +
    'body{background:#EDEDE7;font-family:"Microsoft YaHei",sans-serif;margin:0;padding:20px}' +
    '.ps-slide{width:960px;height:540px;margin:0 auto 20px;background:#fff;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden;page-break-after:always}' +
    '.ps-head{background:#1F5C4D;color:#fff;padding:10px 24px;display:flex;justify-content:space-between;font-size:12px}' +
    '.ps-body{padding:40px 56px;flex:1}.ps-title{font-size:30px;font-weight:700;color:#1F5C4D;margin-bottom:8px}' +
    '.ps-sub{font-size:14px;color:#8A9A93;margin-bottom:14px}.ps-body li{font-size:17px;color:#33443F;line-height:2}' +
    '.ps-foot{background:#F7F5EE;color:#5a6b64;padding:10px 24px;font-size:12px;text-align:right}' +
    '@media print{body{padding:0}.ps-slide{box-shadow:none;border:1px solid #ddd;margin-bottom:0}}' +
    "</style></head><body>" + slides + "</body></html>");
  w.document.close();
  w.focus();
  setTimeout(function () { try { w.print(); } catch (e) {} }, 400);
}

/* 导出月度小结 txt */
function exportMonthlyTxt(y, m) {
  const agg = monthlyAggregate(y, m);
  const saved = getMonthly(monthlyKey(y, m));
  const txt = saved.summary || buildMonthlyText(agg);
  downloadFile("月度小结_" + monthlyKey(y, m) + ".txt", txt);
  toast("📄 月度小结已导出");
}

/* =============== 页面渲染 =============== */
let monthlyView = { y: 0, m: 0 }; /* 当前浏览的年月 */
function renderMonthly() {
  const now = new Date();
  const y = monthlyView.y || now.getFullYear();
  const m = monthlyView.m || now.getMonth() + 1;
  monthlyView.y = y; monthlyView.m = m;
  const mk = monthlyKey(y, m);
  const saved = getMonthly(mk);
  const all = Store.get("monthlyNotes", {});
  const keys = Object.keys(all).sort().reverse();
  const agg = monthlyAggregate(y, m);
  const n = new Date();
  const isCur = y === n.getFullYear() && m === n.getMonth() + 1;

  let html = `
    <div class="mv-header"><h2 class="mv-title">📆 每月小结 <span style="font-size:13px;color:var(--ink-light);font-weight:400">上传照片 → AI 四板块汇总 → 家长版 PPT</span></h2>
      <p class="mv-sub">出勤 · 表扬 · 作业 · 活动 · 让家长看见孩子的每一天</p></div>
    ${modToolbar("每月小结")}
    <div class="card" id="sub-report">
      <div class="card-title">📆 选择月份
        <button class="btn btn-ghost btn-sm" data-act="ml-prev">◀ 上个月</button>
        <span style="font-size:15px;font-weight:700;color:var(--green-800);margin:0 10px">${y} 年 ${m} 月 ${isCur ? '<span class="badge badge-green">本月</span>' : ""}</span>
        <button class="btn btn-ghost btn-sm" data-act="ml-next">下个月 ▶</button>
        <button class="btn btn-ghost btn-sm" data-act="ml-now">回到本月</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
        <span class="stat-chip">👥 全班 ${agg.studentTotal || "-"} 人</span>
        <span class="stat-chip">⏰ 出勤率 ${agg.attend.days ? agg.attend.rate + "%" : "未登记"}</span>
        <span class="stat-chip">🌟 表扬 ${agg.praise.count} 条</span>
        <span class="stat-chip">📚 作业登记 ${agg.hw.days} 天</span>
        <span class="stat-chip">📷 照片 ${agg.activity.count} 张</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📷 本月活动照片 <span class="sub">上传活动照片（自动压缩保存，最多 ${MONTHLY_MAX_PHOTOS} 张）</span>
        <label class="btn btn-primary btn-sm" style="cursor:pointer">📤 上传照片
          <input type="file" accept="image/*" multiple style="display:none" data-act="ml-upload">
        </label>
      </div>
      <div style="font-size:12px;color:var(--ink-light);margin-bottom:12px">💡 上传后可在每张照片下方补充一句话说明（如「校运动会接力赛」），会自动进入 AI 汇总与 PPT 活动页。</div>
      <div class="ml-photos" id="mlPhotos">
        ${agg.activity.photos.length === 0 ? `<div class="empty"><span class="e-ico">📷</span>本月还没有照片，点击「上传照片」开始记录班级生活</div>` :
        agg.activity.photos.map(function (p, i) { return `
          <div class="ml-photo">
            <img src="${p.data}" alt="活动照片">
            <input class="inline-edit ml-cap" data-id="${esc(p.id)}" value="${esc(p.cap || "")}" placeholder="一句话说明（可选）" style="width:100%;box-sizing:border-box">
            <button class="btn btn-ghost btn-sm ml-del" data-id="${esc(p.id)}" style="width:100%;margin-top:6px">🗑️ 删除</button>
          </div>`; }).join("")}
      </div>
      ${agg.activity.photos.length >= MONTHLY_MAX_PHOTOS ? '<div style="font-size:12px;color:#C0564D;margin-top:8px">已达到本月照片上限，可删除部分后继续上传</div>' : ""}
    </div>

    <div class="card">
      <div class="card-title">🤖 AI 四板块汇总 <span class="sub">自动统计本月出勤/表扬/作业/活动，生成可编辑摘要</span>
        <button class="btn btn-primary btn-sm" data-act="ml-gen">✨ 智能汇总本月表现</button>
        <button class="btn btn-ghost btn-sm" data-act="ml-save">💾 保存摘要</button>
        <button class="btn btn-ghost btn-sm" data-act="ml-txt">📄 导出 txt</button>
      </div>
      <textarea class="tarea" id="mlSummary" rows="12" style="width:100%;box-sizing:border-box;line-height:1.9" placeholder="点击「智能汇总本月表现」，AI 将根据考勤/荣誉/作业记录自动生成四板块小结…">${esc(saved.summary || "")}</textarea>
      <div style="margin-top:6px;font-size:12px;color:var(--ink-light)">💡 摘要可自由修改，保存后进入历史小结；再次生成会覆盖未保存的修改。</div>
    </div>

    <div class="card">
      <div class="card-title">📊 生成家长版 PPT <span class="sub">4~6 页 · 发送给家长了解孩子在校情况</span>
        <button class="btn btn-primary btn-sm" data-act="ml-ppt">📊 生成家长版 PPT</button>
        <button class="btn btn-ghost btn-sm" data-act="ml-print">🖨️ 打印/导出 PDF</button>
      </div>
      <div class="ml-guard">
        <div>🛡️ <b>正能量原则</b>：PPT 只展示整体数据与表扬名单（全勤之星 / 荣誉时刻 / 作业全勤），不出现批评性点名</div>
        <div>🎈 活动页自动排版照片墙（每页 4 张），配一句话说明</div>
        <div>💬 结尾附家校寄语，方便直接发送家长群</div>
      </div>
    </div>

    <div class="card" id="sub-history">
      <div class="card-title">🗂️ 历史月度小结 <span class="sub">全部月份记录 · 永不删除（保险库另有自动快照兜底）</span></div>
      <div class="ml-history">
        ${keys.length === 0 ? `<div class="empty"><span class="e-ico">🗂️</span>还没有月度小结，从本月开始记录吧</div>` :
        keys.map(function (k) {
          const it = all[k];
          const n2 = (it.photos || []).length;
          const prev = (it.summary || "").split("\n")[0] || "未生成摘要";
          return `
          <div class="ml-hist-row">
            <div class="ml-hist-date">${k}</div>
            <div class="ml-hist-meta">📷 ${n2} 张照片 · ${it.updatedAt ? "更新于 " + it.updatedAt : "未更新"}</div>
            <div class="ml-hist-prev">${esc(prev)}</div>
            <div class="ml-hist-ops">
              <button class="btn btn-ghost btn-sm" data-act="ml-open" data-k="${k}">👀 打开</button>
              <button class="btn btn-ghost btn-sm" data-act="ml-hist-txt" data-k="${k}">📄 导出</button>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  return html;
}

/* 子菜单定位 */
function jumpMonthlyTab(sub) {
  const el = document.getElementById(sub === "history" ? "sub-history" : "sub-report");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function bindMonthlyEvents() {
  const body = document;
  const reRender = function () {
    const view = document.getElementById("moduleView");
    view.innerHTML = renderMonthly();
    bindMonthlyEvents();
  };
  body.querySelector("[data-act=ml-prev]")?.addEventListener("click", function () {
    monthlyView.m--; if (monthlyView.m < 1) { monthlyView.m = 12; monthlyView.y--; }
    reRender();
  });
  body.querySelector("[data-act=ml-next]")?.addEventListener("click", function () {
    monthlyView.m++; if (monthlyView.m > 12) { monthlyView.m = 1; monthlyView.y++; }
    reRender();
  });
  body.querySelector("[data-act=ml-now]")?.addEventListener("click", function () {
    const n = new Date(); monthlyView.y = n.getFullYear(); monthlyView.m = n.getMonth() + 1;
    reRender();
  });

  /* 照片上传（多张 + 自动压缩） */
  body.querySelector("[data-act=ml-upload]")?.addEventListener("change", function () {
    const files = Array.from(this.files || []);
    if (!files.length) return;
    const mk = monthlyKey(monthlyView.y, monthlyView.m);
    const saved = getMonthly(mk);
    if (saved.photos.length + files.length > MONTHLY_MAX_PHOTOS) { toast("⚠️ 照片数量超出上限（" + MONTHLY_MAX_PHOTOS + " 张）"); return; }
    let pending = files.length;
    files.forEach(function (f) {
      const rd = new FileReader();
      rd.onload = function () {
        compressImage(rd.result, 900, 0.72, function (data) {
          saved.photos.push({ id: uid(), data: data, cap: "", date: Today.now() });
          pending--;
          if (pending === 0) {
            saveMonthly(mk, saved);
            reRender();
            toast("✅ 已上传并压缩保存 " + files.length + " 张照片");
          }
        });
      };
      rd.readAsDataURL(f);
    });
    this.value = "";
  });

  /* 删除照片 */
  body.querySelectorAll(".ml-del").forEach(function (b) {
    b.onclick = function () {
      if (!confirm("确定删除这张照片吗？（历史快照中仍可找回）")) return;
      const mk = monthlyKey(monthlyView.y, monthlyView.m);
      const saved = getMonthly(mk);
      saved.photos = saved.photos.filter(function (p) { return p.id !== b.dataset.id; });
      saveMonthly(mk, saved);
      reRender();
      toast("🗑️ 照片已删除");
    };
  });

  /* 照片说明实时保存 */
  body.querySelectorAll(".ml-cap").forEach(function (inp) {
    inp.onchange = function () {
      const mk = monthlyKey(monthlyView.y, monthlyView.m);
      const saved = getMonthly(mk);
      saved.photos.forEach(function (p) { if (p.id === inp.dataset.id) p.cap = inp.value.trim(); });
      saveMonthly(mk, saved);
    };
  });

  /* AI 智能汇总 */
  body.querySelector("[data-act=ml-gen]")?.addEventListener("click", function () {
    const agg = monthlyAggregate(monthlyView.y, monthlyView.m);
    document.getElementById("mlSummary").value = buildMonthlyText(agg);
    toast("🤖 已根据本月考勤/荣誉/作业记录生成四板块汇总，可编辑后保存");
  });

  /* 保存摘要 */
  body.querySelector("[data-act=ml-save]")?.addEventListener("click", function () {
    const mk = monthlyKey(monthlyView.y, monthlyView.m);
    const saved = getMonthly(mk);
    saved.summary = document.getElementById("mlSummary").value;
    saveMonthly(mk, saved);
    reRender();
    toast("✅ 月度小结摘要已保存");
  });

  /* 导出 txt */
  body.querySelector("[data-act=ml-txt]")?.addEventListener("click", function () {
    exportMonthlyTxt(monthlyView.y, monthlyView.m);
  });

  /* 生成 PPT */
  body.querySelector("[data-act=ml-ppt]")?.addEventListener("click", function () {
    downloadMonthlyPPT(monthlyView.y, monthlyView.m);
  });
  body.querySelector("[data-act=ml-print]")?.addEventListener("click", function () {
    printMonthly(monthlyView.y, monthlyView.m);
  });

  /* 历史列表 */
  body.querySelectorAll("[data-act=ml-open]").forEach(function (b) {
    b.onclick = function () {
      const k = b.dataset.k;
      const parts = k.split("-");
      monthlyView.y = +parts[0]; monthlyView.m = +parts[1];
      reRender();
      toast("已切换到 " + k);
    };
  });
  body.querySelectorAll("[data-act=ml-hist-txt]").forEach(function (b) {
    b.onclick = function () {
      const k = b.dataset.k;
      const parts = k.split("-");
      exportMonthlyTxt(+parts[0], +parts[1]);
    };
  });
}

/* 模块注册 */
registerModule("monthly", {
  title: "📆 每月小结",
  sub: "照片上传 · AI四板块汇总 · 家长版PPT",
  render() { return renderMonthly(); },
  after() { bindMonthlyEvents(); }
});
