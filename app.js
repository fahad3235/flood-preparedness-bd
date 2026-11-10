/* flood-preparedness-bd -- UI layer (DOM + localStorage). Pure logic lives in logic.js. */
"use strict";

(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const LS = {
    lang: "fpbd:lang",
    bag: "fpbd:bag",
    guides: "fpbd:guides",
    plans: "fpbd:plans",
    quizAnswers: "fpbd:quizAnswers",
    quizBest: "fpbd:quizBest",
  };
  const readJSON = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  };
  const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} };

  let lang = localStorage.getItem(LS.lang) || "en";
  if (lang !== "en" && lang !== "bn") lang = "en";
  const t = (key) => (window.I18N[lang] && window.I18N[lang][key]) || window.I18N.en[key] || key;
  const fmt = (v) => window.FP.fmtNum(v, lang);

  function applyI18n() {
    document.documentElement.lang = lang === "bn" ? "bn" : "en";
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.getAttribute("data-i18n-ph")); });
    $("#langBtn").textContent = t("langBtn");
    renderAll();
    // Re-render computed results so numbers switch digit scripts too.
    if (lastCalc) doCalc();
    if (!$("#quizResult").hidden) doQuiz();
  }

  // ---- tabs ----
  let activeTab = "calc";
  function showTab(id) {
    activeTab = id;
    $$(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === id));
    $$(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + id));
    renderTab(id);
  }

  // ---- calculator ----
  let lastCalc = null;
  function doCalc() {
    const people = parseInt($("#peopleInput").value, 10);
    const days = parseInt($("#daysInput").value, 10);
    const errs = window.FP.validateCalc(people, days);
    const errBox = $("#calcErrors");
    errBox.innerHTML = "";
    if (errs.length) {
      errs.forEach((e) => {
        const p = document.createElement("p");
        p.className = "error";
        p.textContent = e === "people" ? t("errPeople") : e === "peopleMax" ? t("errPeopleMax") : e === "days" ? t("errDays") : t("errDaysMax");
        errBox.appendChild(p);
      });
      $("#calcResults").hidden = true;
      lastCalc = null;
      return;
    }
    const water = window.FP.waterNeeds(people, days);
    const food = window.FP.foodNeeds(people, days);
    lastCalc = { people, days, water, food, ts: Date.now() };
    $("#waterDrinking").textContent = fmt(water.drinkingLitres) + " L";
    $("#waterHygiene").textContent = fmt(water.hygieneLitres) + " L";
    $("#waterTotal").textContent = fmt(water.totalLitres) + " L";
    const foodBody = $("#foodBody");
    foodBody.innerHTML = "";
    food.forEach((f) => {
      const tr = document.createElement("tr");
      const nameTd = document.createElement("td");
      nameTd.textContent = t("food" + f.id.charAt(0).toUpperCase() + f.id.slice(1));
      const qtyTd = document.createElement("td");
      qtyTd.textContent = fmt(f.qty) + " " + f.unit;
      tr.appendChild(nameTd); tr.appendChild(qtyTd);
      foodBody.appendChild(tr);
    });
    $("#calcResults").hidden = false;
  }

  function renderPlans() {
    const plans = readJSON(LS.plans, []);
    const list = $("#plansList");
    list.innerHTML = "";
    if (!plans.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = t("noPlans");
      list.appendChild(p);
      return;
    }
    plans.forEach((plan, i) => {
      const row = document.createElement("div");
      row.className = "plan-row";
      const label = document.createElement("span");
      const d = new Date(plan.ts);
      label.textContent = fmt(plan.people) + " " + (lang === "bn" ? "জন" : "people") + " × " + fmt(plan.days) + " " + (lang === "bn" ? "দিন" : "days") + " — " + fmt(plan.water.totalLitres) + " L · " + d.toLocaleDateString();
      const loadBtn = document.createElement("button");
      loadBtn.className = "btn small";
      loadBtn.textContent = t("loadBtn");
      loadBtn.addEventListener("click", () => {
        $("#peopleInput").value = plan.people;
        $("#daysInput").value = plan.days;
        doCalc();
      });
      const delBtn = document.createElement("button");
      delBtn.className = "btn small danger";
      delBtn.textContent = t("deleteBtn");
      delBtn.addEventListener("click", () => {
        const ps = readJSON(LS.plans, []);
        ps.splice(i, 1);
        writeJSON(LS.plans, ps);
        renderPlans();
      });
      row.appendChild(label); row.appendChild(loadBtn); row.appendChild(delBtn);
      list.appendChild(row);
    });
  }

  // ---- go-bag ----
  function renderBag() {
    const checked = new Set(readJSON(LS.bag, []));
    const wrap = $("#bagWrap");
    wrap.innerHTML = "";
    window.FP.GO_BAG.forEach((cat) => {
      const sec = document.createElement("section");
      sec.className = "bag-cat";
      const h = document.createElement("h3");
      h.textContent = t("cat" + cat.id.charAt(0).toUpperCase() + cat.id.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase()));
      sec.appendChild(h);
      cat.items.forEach((item) => {
        const label = document.createElement("label");
        label.className = "check-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = checked.has(item.id);
        cb.addEventListener("change", () => {
          const cur = new Set(readJSON(LS.bag, []));
          if (cb.checked) cur.add(item.id); else cur.delete(item.id);
          writeJSON(LS.bag, Array.from(cur));
          updateBagProgress();
        });
        const name = document.createElement("span");
        name.textContent = t("item" + item.id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(""));
        const qty = document.createElement("span");
        qty.className = "qty";
        qty.textContent = lang === "bn" ? item.qtyBn : item.qtyEn;
        label.appendChild(cb); label.appendChild(name); label.appendChild(qty);
        sec.appendChild(label);
      });
      wrap.appendChild(sec);
    });
    updateBagProgress();
  }
  function updateBagProgress() {
    const p = window.FP.goBagProgress(readJSON(LS.bag, []));
    $("#bagBar").style.width = p.pct + "%";
    $("#bagPct").textContent = fmt(p.done) + "/" + fmt(p.total) + " · " + fmt(p.pct) + "% " + t("bagProgress");
    $("#bagDone").hidden = p.pct !== 100;
  }

  // ---- quiz ----
  function renderQuiz() {
    const answers = readJSON(LS.quizAnswers, {});
    const wrap = $("#quizWrap");
    wrap.innerHTML = "";
    window.FP.QUIZ.forEach((q) => {
      const row = document.createElement("div");
      row.className = "quiz-row";
      const qs = document.createElement("span");
      qs.textContent = t("q" + q.id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(""));
      const btns = document.createElement("span");
      btns.className = "quiz-btns";
      ["yes", "no"].forEach((yn) => {
        const b = document.createElement("button");
        b.className = "btn small" + (answers[q.id] === (yn === "yes") ? " selected" : "");
        b.textContent = t(yn === "yes" ? "yesBtn" : "noBtn");
        b.addEventListener("click", () => {
          const cur = readJSON(LS.quizAnswers, {});
          cur[q.id] = yn === "yes";
          writeJSON(LS.quizAnswers, cur);
          renderQuiz();
        });
        btns.appendChild(b);
      });
      row.appendChild(qs); row.appendChild(btns);
      wrap.appendChild(row);
    });
    const best = readJSON(LS.quizBest, null);
    $("#quizBest").textContent = best === null ? "—" : fmt(best);
  }
  function doQuiz() {
    const answers = readJSON(LS.quizAnswers, {});
    const res = window.FP.quizScore(answers);
    const best = readJSON(LS.quizBest, null);
    if (best === null || res.score > best) writeJSON(LS.quizBest, res.score);
    $("#quizScore").textContent = fmt(res.score) + " / 100";
    $("#quizLevel").textContent = t(res.level === "ready" ? "levelReady" : res.level === "getting-there" ? "levelGettingThere" : "levelAtRisk");
    const recList = $("#quizRecs");
    recList.innerHTML = "";
    res.missing.forEach((id) => {
      const li = document.createElement("li");
      li.textContent = t("rec" + id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(""));
      recList.appendChild(li);
    });
    $("#quizFixWrap").hidden = res.missing.length === 0;
    $("#quizResult").hidden = false;
    renderQuiz();
  }

  // ---- guides ----
  function renderGuides() {
    const checked = new Set(readJSON(LS.guides, []));
    const wrap = $("#guidesWrap");
    wrap.innerHTML = "";
    Object.keys(window.FP.GUIDES).forEach((phase) => {
      const sec = document.createElement("section");
      sec.className = "guide-phase";
      const h = document.createElement("h3");
      h.textContent = t(phase === "before" ? "phaseBefore" : phase === "during" ? "phaseDuring" : "phaseAfter");
      const bar = document.createElement("div");
      bar.className = "bar";
      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.id = "guideBar-" + phase;
      bar.appendChild(fill);
      sec.appendChild(h); sec.appendChild(bar);
      window.FP.GUIDES[phase].forEach((step) => {
        const key = phase + ":" + step;
        const label = document.createElement("label");
        label.className = "check-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = checked.has(key);
        cb.addEventListener("change", () => {
          const cur = new Set(readJSON(LS.guides, []));
          if (cb.checked) cur.add(key); else cur.delete(key);
          writeJSON(LS.guides, Array.from(cur));
          updateGuideProgress();
        });
        const name = document.createElement("span");
        name.textContent = t("g" + phase.charAt(0).toUpperCase() + phase.slice(1) + step.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(""));
        label.appendChild(cb); label.appendChild(name);
        sec.appendChild(label);
      });
      wrap.appendChild(sec);
    });
    updateGuideProgress();
  }
  function updateGuideProgress() {
    const p = window.FP.guideProgress(readJSON(LS.guides, []));
    Object.keys(window.FP.GUIDES).forEach((phase) => {
      const fill = $("#guideBar-" + phase);
      if (fill) fill.style.width = p[phase].pct + "%";
    });
    $("#guidesPct").textContent = fmt(p.all.done) + "/" + fmt(p.all.total) + " · " + fmt(p.all.pct) + "%";
  }

  // ---- contacts & warnings ----
  function renderContacts() {
    const wrap = $("#contactsWrap");
    wrap.innerHTML = "";
    window.FP.CONTACTS.forEach((c) => {
      const card = document.createElement("a");
      card.className = "contact-card";
      card.href = "tel:" + c.tel;
      const num = document.createElement("span");
      num.className = "contact-num";
      num.textContent = fmt(c.number);
      const name = document.createElement("span");
      name.className = "contact-name";
      name.textContent = t("c" + c.id + "Name");
      const desc = document.createElement("span");
      desc.className = "contact-desc";
      desc.textContent = t("c" + c.id + "Desc");
      card.appendChild(num); card.appendChild(name); card.appendChild(desc);
      if (c.id === "16263") {
        const warn = document.createElement("span");
        warn.className = "contact-warn";
        warn.textContent = t("c16263Warn");
        card.appendChild(warn);
      }
      wrap.appendChild(card);
    });
    const lv = $("#levelsBody");
    lv.innerHTML = "";
    window.FP.WARNING_LEVELS.forEach((lvl) => {
      const tr = document.createElement("tr");
      const nameTd = document.createElement("td");
      nameTd.textContent = t("level" + lvl.id.charAt(0).toUpperCase() + lvl.id.slice(1));
      const ruleTd = document.createElement("td");
      ruleTd.textContent = lang === "bn" ? lvl.ruleBn : lvl.ruleEn;
      tr.appendChild(nameTd); tr.appendChild(ruleTd);
      lv.appendChild(tr);
    });
  }

  // ---- districts ----
  function renderDistricts() {
    const q = $("#distSearch").value || "";
    const list = window.FP.filterDistricts(q);
    const wrap = $("#distWrap");
    wrap.innerHTML = "";
    list.forEach((d) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = d;
      wrap.appendChild(chip);
    });
    $("#distCount").textContent = fmt(list.length) + " " + t("distCount");
  }

  function renderTab(id) {
    if (id === "calc") renderPlans();
    if (id === "bag") renderBag();
    if (id === "quiz") renderQuiz();
    if (id === "guides") renderGuides();
    if (id === "contacts") renderContacts();
    if (id === "districts") renderDistricts();
  }
  function renderAll() { renderTab(activeTab); }

  // ---- export / import / erase ----
  function buildExport() {
    return {
      app: "flood-preparedness-bd",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        lang,
        bag: readJSON(LS.bag, []),
        guides: readJSON(LS.guides, []),
        plans: readJSON(LS.plans, []),
        quizAnswers: readJSON(LS.quizAnswers, {}),
        quizBest: readJSON(LS.quizBest, null),
      },
    };
  }
  function applyImport(parsed) {
    if (!parsed || parsed.app !== "flood-preparedness-bd" || typeof parsed.data !== "object" || parsed.data === null) return { ok: false };
    const d = parsed.data;
    if (Array.isArray(d.bag)) writeJSON(LS.bag, d.bag);
    if (Array.isArray(d.guides)) writeJSON(LS.guides, d.guides);
    if (Array.isArray(d.plans)) writeJSON(LS.plans, d.plans);
    if (d.quizAnswers && typeof d.quizAnswers === "object") writeJSON(LS.quizAnswers, d.quizAnswers);
    if (typeof d.quizBest === "number" || d.quizBest === null) writeJSON(LS.quizBest, d.quizBest);
    return { ok: true };
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "flood-preparedness-bd-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let parsed = null;
      try { parsed = JSON.parse(reader.result); } catch (e) { parsed = null; }
      const res = parsed ? applyImport(parsed) : { ok: false };
      $("#dataMsg").textContent = res.ok ? t("importOk") : t("importBad");
      if (res.ok) renderAll();
    };
    reader.readAsText(file);
  }
  function clearAllData() {
    Object.values(LS).forEach((k) => localStorage.removeItem(k));
    lastCalc = null;
    $("#calcResults").hidden = true;
    $("#quizResult").hidden = true;
  }
  function eraseAll() {
    const word = window.prompt(t("eraseConfirm"));
    if (word === null) return;
    if (word.trim() !== "DELETE") { $("#dataMsg").textContent = t("eraseWrong"); return; }
    clearAllData();
    $("#dataMsg").textContent = t("eraseDone");
    applyI18n();
  }

  // ---- test hooks (used by tests/smoke.js; harmless in production) ----
  window.__fpbd = {
    exportPayload: () => JSON.stringify(buildExport()),
    importPayload: (str) => {
      try { return applyImport(JSON.parse(str)); } catch (e) { return { ok: false }; }
    },
    eraseAll: () => { clearAllData(); renderAll(); },
    get state() { return { lang }; },
  };

  // ---- wiring ----
  document.addEventListener("DOMContentLoaded", () => {
    $$(".tab-btn").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
    $("#langBtn").addEventListener("click", () => {
      lang = lang === "en" ? "bn" : "en";
      localStorage.setItem(LS.lang, lang);
      applyI18n();
    });
    $("#calcBtn").addEventListener("click", doCalc);
    $("#savePlanBtn").addEventListener("click", () => {
      if (!lastCalc) return;
      const plans = readJSON(LS.plans, []);
      plans.push(lastCalc);
      writeJSON(LS.plans, plans);
      $("#planMsg").textContent = t("planSaved");
      renderPlans();
    });
    $("#bagResetBtn").addEventListener("click", () => {
      writeJSON(LS.bag, []);
      renderBag();
    });
    $("#quizBtn").addEventListener("click", doQuiz);
    $("#distSearch").addEventListener("input", renderDistricts);
    $("#exportBtn").addEventListener("click", exportData);
    $("#importFile").addEventListener("change", (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ""; });
    $("#eraseBtn").addEventListener("click", eraseAll);
    applyI18n();
    showTab("calc");
  });
})();
