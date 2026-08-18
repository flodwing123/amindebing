/* =========================================================
   「💡 奇思妙想」· 随手记录
   班级管理小妙招 / 班级小随笔 / 论文小火花 · 可自定义分类
   数据 key: ideas -> { list: [], archived: [] }
   原则：所有记录只归档、不丢数据（数据保险库另有快照兜底）
   ========================================================= */

const IDEA_CATS = ["管理小妙招", "班级小随笔", "论文小火花"];
const IDEA_CAT_ICONS = { "管理小妙招": "💡", "班级小随笔": "✍️", "论文小火花": "🔥" };
const IDEA_CAT_CLASS = { "管理小妙招": "ic-manage", "班级小随笔": "ic-essay", "论文小火花": "ic-paper" };

let ideaFilter = "全部"; // 内存态筛选（刷新后回到全部）
let ideaKw = "";         // 内存态搜索词

function defaultIdeas() { return { list: [], archived: [] }; }
function getIdeas() { return Store.get("ideas", defaultIdeas()); }
function saveIdeas(d) { Store.set("ideas", d); }
function ideaIco(cat) { return IDEA_CAT_ICONS[cat] || "📌"; }
function ideaCls(cat) { return IDEA_CAT_CLASS[cat] || "ic-other"; }
function ideaAllCats(d) {
  const s = new Set(IDEA_CATS);
  d.list.concat(d.archived).forEach(it => { if (it.cat) s.add(it.cat); });
  return Array.from(s);
}

/* 子菜单定位：切换分类筛选并重渲染 */
function jumpIdeaFilter(sub) {
  const c = sub === "manage" ? "管理小妙招" : sub === "essay" ? "班级小随笔" : sub === "paper" ? "论文小火花" : "";
  if (c) { ideaFilter = c; renderModule("ideas"); }
}

/* 单条记录渲染卡片 */
function ideaCard(it, archived) {
  return `<div class="idea-card">
    <div class="idea-top">
      <span class="idea-badge ${ideaCls(it.cat)}">${ideaIco(it.cat)} ${esc(it.cat || "其他")}</span>
      <span class="idea-time">🕐 ${esc(it.updated || it.ts)}</span>
    </div>
    <div class="idea-title">${esc(it.title || "(无标题)")}</div>
    <div class="idea-body">${esc(it.body).replace(/\n/g, "<br>")}</div>
    <div class="idea-ops">
      ${archived
        ? `<button class="btn btn-ghost btn-sm" data-idea-restore="${it.id}">↩️ 恢复</button>`
        : `<button class="btn btn-ghost btn-sm" data-idea-edit="${it.id}">✏️ 编辑</button>
           <button class="btn btn-ghost btn-sm" data-idea-archive="${it.id}" title="归档后仍可在归档箱找回，不会丢失">🗄️ 归档</button>
           <button class="btn btn-danger btn-sm" data-idea-del="${it.id}" title="彻底删除（建议先归档）">✕</button>`}
      <button class="btn btn-ghost btn-sm" data-idea-export-one="${it.id}">⬇️</button>
    </div>
  </div>`;
}

registerModule("ideas", {
  title: "💡 奇思妙想",
  sub: "随手记录 · 管理小妙招 / 班级随笔 / 论文火花",
  render() {
    const d = getIdeas();
    const cats = ideaAllCats(d);
    const kw = ideaKw.trim().toLowerCase();
    const show = d.list.slice()
      .sort((a, b) => ((b.updated || b.ts) > (a.updated || a.ts) ? 1 : -1))
      .filter(it => {
        if (ideaFilter !== "全部" && it.cat !== ideaFilter) return false;
        if (kw && !((it.title || "") + (it.body || "")).toLowerCase().includes(kw)) return false;
        return true;
      });
    const archived = d.archived.slice().sort((a, b) => (b.ts > a.ts ? 1 : -1));

    return `
    <div class="mv-header"><h2 class="mv-title">💡 奇思妙想 <span style="font-size:13px;color:var(--ink-light);font-weight:400">随时记录 · 永不清空</span></h2>
      <p class="mv-sub">共 ${d.list.length} 条记录 · 归档 ${d.archived.length} 条 · 全部自动保存，可导出可恢复</p></div>
    ${modToolbar("奇思妙想")}

    <div class="card" id="sub-manage">
      <div class="card-title">🧩 灵感收集箱
        <button class="btn btn-primary btn-sm" data-act="idea-new">＋ 新记录</button>
        <button class="btn btn-ghost btn-sm" data-act="idea-export-all">⬇️ 导出全部</button>
      </div>
      <div class="idea-toolbar">
        <input class="inp" id="inpIdeaKw" placeholder="🔍 搜索标题或内容…" value="${esc(ideaKw)}" style="max-width:280px">
        <div class="idea-chips" id="ideaChips">
          <span class="chip ${ideaFilter === "全部" ? "on" : ""}" data-idea-chip="全部">全部</span>
          ${cats.map(c => `<span class="chip ${ideaFilter === c ? "on" : ""}" data-idea-chip="${esc(c)}">${ideaIco(c)} ${esc(c)}</span>`).join("")}
        </div>
      </div>
      <div id="ideaList">
        ${show.length === 0
          ? `<div class="empty"><span class="e-ico">🍃</span>${kw ? "没有找到匹配的记录" : "还没有记录，点击「＋ 新记录」写下第一个想法吧"}</div>`
          : show.map(it => ideaCard(it, false)).join("")}
      </div>
    </div>

    <div class="card" id="sub-essay" style="display:none"></div>
    <div class="card" id="sub-paper" style="display:none"></div>

    ${archived.length ? `
    <div class="card" style="border-color:#E7DDC4;background:#FDFBF4">
      <div class="card-title">🗄️ 归档箱 <span class="sub">归档≠删除 · 随时可恢复</span>
        <button class="btn btn-ghost btn-sm" data-act="idea-export-arch">⬇️ 导出归档</button>
      </div>
      <div class="idea-grid">
        ${archived.map(it => ideaCard(it, true)).join("")}
      </div>
    </div>` : ""}`;
  },
  after() {
    /* 搜索输入（仅重渲染列表容器，保住输入框焦点） */
    const kwInp = document.getElementById("inpIdeaKw");
    if (kwInp) {
      kwInp.oninput = () => {
        ideaKw = kwInp.value;
        const d = getIdeas();
        const kw = ideaKw.trim().toLowerCase();
        const show = d.list.slice().sort((a, b) => ((b.updated || b.ts) > (a.updated || a.ts) ? 1 : -1))
          .filter(it => (ideaFilter === "全部" || it.cat === ideaFilter) && (!kw || ((it.title || "") + (it.body || "")).toLowerCase().includes(kw)));
        const list = document.getElementById("ideaList");
        if (list) list.innerHTML = show.length === 0
          ? `<div class="empty"><span class="e-ico">🍃</span>没有找到匹配的记录</div>`
          : show.map(it => ideaCard(it, false)).join("");
        bindIdeaListEvents();
      };
    }
    /* 分类 chips */
    document.querySelectorAll("#ideaChips [data-idea-chip]").forEach(chip => {
      chip.onclick = () => {
        ideaFilter = chip.dataset.ideaChip;
        const body = document.getElementById("moduleView");
        body.innerHTML = Modules.ideas.render();
        Modules.ideas.after();
      };
    });
    bindIdeaListEvents();
    document.querySelector("[data-act=idea-new]")?.addEventListener("click", openIdeaEditor);
    document.querySelector("[data-act=idea-export-all]")?.addEventListener("click", () => exportIdeasTxt(false));
    document.querySelector("[data-act=idea-export-arch]")?.addEventListener("click", () => exportIdeasTxt(true));
  }
});

/* 列表内按钮事件（搜索重渲染后也要重新绑定） */
function bindIdeaListEvents() {
  const body = document.getElementById("moduleView");
  body.querySelectorAll("[data-idea-edit]").forEach(b => b.onclick = () => openIdeaEditor(b.dataset.ideaEdit));
  body.querySelectorAll("[data-idea-archive]").forEach(b => b.onclick = () => {
    const d = getIdeas();
    const it = d.list.find(x => x.id === b.dataset.ideaArchive);
    if (it) { d.list = d.list.filter(x => x.id !== it.id); it.ts = it.updated || it.ts; d.archived.unshift(it); saveIdeas(d); toast("🗄️ 已归档（可在归档箱找回）"); }
    const v = document.getElementById("moduleView"); v.innerHTML = Modules.ideas.render(); Modules.ideas.after();
  });
  body.querySelectorAll("[data-idea-restore]").forEach(b => b.onclick = () => {
    const d = getIdeas();
    const it = d.archived.find(x => x.id === b.dataset.ideaRestore);
    if (it) { d.archived = d.archived.filter(x => x.id !== it.id); d.list.unshift(it); saveIdeas(d); toast("↩️ 已恢复到记录列表"); }
    const v = document.getElementById("moduleView"); v.innerHTML = Modules.ideas.render(); Modules.ideas.after();
  });
  body.querySelectorAll("[data-idea-del]").forEach(b => b.onclick = () => {
    if (!confirm("⚠️ 彻底删除后无法撤销！\n\n建议改用「🗄️ 归档」（归档后仍可找回）。\n\n确定要彻底删除这条记录吗？")) return;
    const d = getIdeas();
    d.list = d.list.filter(x => x.id !== b.dataset.ideaDel);
    saveIdeas(d);
    const v = document.getElementById("moduleView"); v.innerHTML = Modules.ideas.render(); Modules.ideas.after();
    toast("已删除（历史快照中仍可恢复）");
  });
  body.querySelectorAll("[data-idea-export-one]").forEach(b => b.onclick = () => {
    const d = getIdeas();
    const it = d.list.concat(d.archived).find(x => x.id === b.dataset.ideaExportOne);
    if (it) downloadFile("奇思妙想_" + it.title + ".txt",
      "【" + it.cat + "】" + it.title + "\n时间：" + (it.updated || it.ts) + "\n\n" + it.body, "text/plain;charset=utf-8");
  });
}

/* 新建 / 编辑 记录弹窗 */
function openIdeaEditor(id) {
  const d = getIdeas();
  const it = id ? d.list.find(x => x.id === id) : null;
  openModal(`
    <select class="inp" id="inpIdeaCat" style="margin-bottom:8px">
      ${IDEA_CATS.map(c => `<option value="${c}" ${it && it.cat === c ? "selected" : ""}>${IDEA_CAT_ICONS[c]} ${c}</option>`).join("")}
      <option value="__custom">✏️ 自定义分类…</option>
    </select>
    <input class="inp" id="inpIdeaCatCustom" placeholder="自定义分类名称" maxlength="12" style="display:none;margin-bottom:8px">
    <input class="inp" id="inpIdeaTitle" placeholder="标题（一句话概括）" maxlength="40" value="${esc(it ? it.title : "")}" style="margin-bottom:8px">
    <textarea class="tarea" id="inpIdeaBody" rows="9" placeholder="详细内容…">${esc(it ? it.body : "")}</textarea>`,
    it ? "✏️ 编辑记录" : "💡 新记录");
  const sel = document.getElementById("inpIdeaCat");
  const cus = document.getElementById("inpIdeaCatCustom");
  const toggleCus = () => { cus.style.display = sel.value === "__custom" ? "block" : "none"; if (sel.value === "__custom") cus.focus(); };
  sel.onchange = toggleCus;
  if (it && !IDEA_CATS.includes(it.cat)) { sel.value = "__custom"; cus.value = it.cat; toggleCus(); }
  const ok = document.querySelector("[data-act=modal-ok]");
  ok.onclick = () => {
    const title = document.getElementById("inpIdeaTitle").value.trim();
    const body = document.getElementById("inpIdeaBody").value.trim();
    if (!title && !body) { toast("⚠️ 请至少填写标题或内容"); return; }
    const cat = sel.value === "__custom" ? (cus.value.trim() || "其他") : sel.value;
    const now = Today.now() + " " + new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    if (it) {
      it.cat = cat; it.title = title; it.body = body; it.updated = now;
    } else {
      d.list.unshift({ id: uid(), cat, title, body, ts: now });
    }
    saveIdeas(d);
    closeModal();
    const v = document.getElementById("moduleView");
    v.innerHTML = Modules.ideas.render();
    Modules.ideas.after();
    toast(it ? "✅ 记录已更新" : "✅ 记录已保存（自动备份到数据保险库）");
  };
}

/* 导出全部 / 归档 */
function exportIdeasTxt(archOnly) {
  const d = getIdeas();
  const cats = ideaAllCats(d);
  const lines = ["🌿 啊敏的兵 · 奇思妙想", "导出时间：" + Today.now(), ""];
  cats.forEach(cat => {
    const items = (archOnly ? d.archived : d.list).filter(i => i.cat === cat);
    if (!items.length) return;
    lines.push("【" + cat + "】共 " + items.length + " 条");
    items.forEach(it => {
      lines.push("◆ " + (it.title || "(无标题)") + "　（" + (it.updated || it.ts) + "）");
      if (it.body) lines.push(it.body);
      lines.push("");
    });
  });
  if (archOnly && !d.archived.length) lines.push("归档箱为空");
  downloadFile("奇思妙想_" + (archOnly ? "归档" : "全部") + "_" + Today.now() + ".txt", lines.join("\n"), "text/plain;charset=utf-8");
  toast("⬇️ 已导出" + (archOnly ? "归档记录" : "全部记录"));
}
