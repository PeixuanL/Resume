const data = window.INTERVIEW_PREP_DATA;
const STORAGE_KEY = "mobvoi_ai_agent_interview_prep_edits_v1";
const FILE_SYNC_URL = "/api/edits";

const state = {
  lang: data.meta.defaultLanguage || "zh",
  view: "practice",
  mode: "warmup",
  selectedId: data.questions[0].id,
  tab: "intent",
  edits: {},
  timer: null,
  timerRemaining: 0,
};

const labels = {
  zh: {
    mode: "题目筛选",
    random: "随机抽题",
    coreTitle: "今天只背这句",
    speak: "朗读",
    export: "导出",
    import: "导入",
    reset: "重置",
    boundaryPrefix: "事实边界",
    intent: "意图",
    simple: "简短",
    full: "完整",
    followups: "追问",
    shadow: "跟读训练",
    speakAnswer: "朗读当前答案",
    builder: "回答搭建器",
    simpleLabel: "简短回答",
    fullLabel: "完整回答",
    notesLabel: "备注",
    save: "保存修改",
    copy: "复制简短版",
    questionList: "题库",
    questionSearch: "搜索问题、能力、关键词...",
    reviewTitle: "集中复习",
    reviewSubtitle: "高频句、STAR/CAR、宝洁八大问和临场表达。",
    reviewSearch: "搜索复习内容...",
    companyTitle: "公司背景",
    companySubtitle: "公开信息、事实边界、岗位启发和可直接复述的判断。",
    companySearch: "搜索公司背景...",
    mapTitle: "题库地图",
    mapSubtitle: "按出题方式查看题库结构。",
    importTitle: "导入修改",
    cancel: "取消",
    imported: "已导入修改。",
    savedBrowser: "已保存到本浏览器；如使用 node server.js 启动，会尝试写入文件。",
    savedFile: "已保存到浏览器和 saved-edits.json / saved-edits.md。",
    fileUnavailable: "当前未连接本地保存服务，修改只保存在浏览器。",
    copied: "已复制。",
    noResult: "没有匹配结果。",
    sourceDate: "搜索日期",
    sources: "来源",
    interviewUse: "面试用法",
    intentBoardKicker: "评分维度",
    intentBoardTitle: "这题在考什么能力信号",
    intentBoardSubtitle: "先判断面试官的标准，再选择答案里的证据。",
    intentCardTitle: "考察信号",
    intentEvidenceTitle: "回答证据",
    intentEvidenceFallback: "回到简短答案里的核心证据",
    intentCueTitle: "答案提示钩子",
    intentCueBody: "开口可以先说",
    followupIntent: "回答思路",
    followupSimple: "简短回答",
    followupFull: "完整回答",
  },
  en: {
    mode: "Question filters",
    random: "Random",
    coreTitle: "One line to remember",
    speak: "Speak",
    export: "Export",
    import: "Import",
    reset: "Reset",
    boundaryPrefix: "Fact boundary",
    intent: "Intent",
    simple: "Short",
    full: "Full",
    followups: "Follow-ups",
    shadow: "Shadowing",
    speakAnswer: "Read current answer",
    builder: "Answer builder",
    simpleLabel: "Short answer",
    fullLabel: "Full answer",
    notesLabel: "Notes",
    save: "Save edits",
    copy: "Copy short answer",
    questionList: "Question bank",
    questionSearch: "Search questions, skills, keywords...",
    reviewTitle: "Focused review",
    reviewSubtitle: "High-priority lines, STAR/CAR, P&G-style families, and live phrasing.",
    reviewSearch: "Search review content...",
    companyTitle: "Company background",
    companySubtitle: "Public facts, boundaries, role implications, and reusable talking points.",
    companySearch: "Search company context...",
    mapTitle: "Question map",
    mapSubtitle: "Explore questions by interview pattern.",
    importTitle: "Import edits",
    cancel: "Cancel",
    imported: "Edits imported.",
    savedBrowser: "Saved to this browser; if served with node server.js, file save will be attempted.",
    savedFile: "Saved to browser and saved-edits.json / saved-edits.md.",
    fileUnavailable: "Local save service is unavailable; edits are stored in this browser only.",
    copied: "Copied.",
    noResult: "No matching result.",
    sourceDate: "Research date",
    sources: "Sources",
    interviewUse: "Interview use",
    intentBoardKicker: "Rubric lens",
    intentBoardTitle: "What capability signal this question tests",
    intentBoardSubtitle: "Read the standard first, then choose evidence from your answer.",
    intentCardTitle: "Signal",
    intentEvidenceTitle: "Answer evidence",
    intentEvidenceFallback: "Use the strongest evidence from the short answer",
    intentCueTitle: "Answer hook",
    intentCueBody: "Open with",
    followupIntent: "Answer strategy",
    followupSimple: "Short answer",
    followupFull: "Full answer",
  },
};

const $ = (id) => document.getElementById(id);
const t = (key) => labels[state.lang][key] || key;
const byId = new Map(data.questions.map((question) => [question.id, question]));

function localized(value) {
  if (value && typeof value === "object" && state.lang in value) return value[state.lang];
  return value;
}

function currentQuestion() {
  return byId.get(state.selectedId) || data.questions[0];
}

function getEdit(id = state.selectedId, lang = state.lang) {
  return state.edits[id]?.[lang] || {};
}

function mergedQuestion(id = state.selectedId) {
  const question = byId.get(id) || data.questions[0];
  const edit = getEdit(id, state.lang);
  return {
    ...question,
    localized: {
      ...question[state.lang],
      simple: edit.simple || question[state.lang].simple,
      full: edit.full || question[state.lang].full,
      notes: edit.notes || question[state.lang].notes,
    },
  };
}

function saveLocalEdits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.edits));
}

function loadLocalEdits() {
  try {
    state.edits = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    state.edits = {};
  }
}

async function loadFileEdits() {
  try {
    const response = await fetch(FILE_SYNC_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.edits && typeof payload.edits === "object") {
      state.edits = { ...state.edits, ...payload.edits };
      saveLocalEdits();
      $("saveStatus").textContent = t("savedFile");
      return;
    }
  } catch {
    $("saveStatus").textContent = t("fileUnavailable");
  }
}

async function syncEditsToFile() {
  saveLocalEdits();
  try {
    const response = await fetch(FILE_SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edits: state.edits }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    $("saveStatus").textContent = t("savedFile");
  } catch {
    $("saveStatus").textContent = t("savedBrowser");
  }
}

function filteredQuestions() {
  const search = $("sidebarQuestionSearch")?.value.trim().toLowerCase() || "";
  return data.questions.filter((question) => {
    const matchesMode = matchesQuestionMode(question, state.mode);
    const haystack = [
      question.zh.question,
      question.en.question,
      question.zh.simple,
      question.en.simple,
      question.category.zh,
      question.category.en,
      question.framework,
    ].join(" ").toLowerCase();
    return matchesMode && (!search || haystack.includes(search));
  });
}

function matchesQuestionMode(question, mode) {
  if (mode === "warmup") return question.mode.includes("warmup");
  return question.mode.includes(mode) || question.framework === mode;
}

function countForMode(mode) {
  return data.questions.filter((question) => matchesQuestionMode(question, mode.id)).length;
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.view === view);
  });
  document.querySelectorAll("#viewNav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  $("resetBtn").hidden = view !== "practice";
  setPracticeSidebarVisible(view === "practice");
  $("pageTitle").textContent = localized(data.views.find((item) => item.id === view)) || view;
  $("pageKicker").textContent = view === "practice" ? data.meta.round : data.meta.company;
  if (view === "review") renderReview();
  if (view === "company") renderCompany();
  if (view === "map") renderMap();
}

function setPracticeSidebarVisible(isPractice) {
  $("modeFilterPanel").hidden = !isPractice;
  $("questionNavPanel").hidden = !isPractice;
  $("quickPanel").hidden = !isPractice;
}

function renderMeta() {
  $("roundLabel").textContent = data.meta.round;
  $("companyName").textContent = data.meta.company;
  $("roleName").textContent = data.meta.role;
  $("modeLabel").textContent = t("mode");
  $("randomBtn").textContent = t("random");
  $("coreLineTitle").textContent = t("coreTitle");
  $("coreLine").textContent = localized(data.meta.coreLine);
  $("speakCoreBtn").textContent = t("speak");
  $("exportBtn").textContent = t("export");
  $("importBtn").textContent = t("import");
  $("resetBtn").textContent = t("reset");
  $("boundaryText").innerHTML = `<strong>${t("boundaryPrefix")}:</strong> ${escapeHtml(localized(data.meta.boundary))}`;
  $("builderTitle").textContent = t("builder");
  $("simpleLabel").textContent = t("simpleLabel");
  $("fullLabel").textContent = t("fullLabel");
  $("notesLabel").textContent = t("notesLabel");
  $("saveEditBtn").textContent = t("save");
  $("copySimpleBtn").textContent = t("copy");
  $("questionListTitle").textContent = t("questionList");
  $("sidebarQuestionSearch").placeholder = t("questionSearch");
  $("reviewTitle").textContent = t("reviewTitle");
  $("reviewSubtitle").textContent = t("reviewSubtitle");
  $("reviewSearchInput").placeholder = t("reviewSearch");
  $("companyTitle").textContent = t("companyTitle");
  $("companySubtitle").textContent = t("companySubtitle");
  $("companySearchInput").placeholder = t("companySearch");
  $("mapTitle").textContent = t("mapTitle");
  $("mapSubtitle").textContent = t("mapSubtitle");
  $("importTitle").textContent = t("importTitle");
  $("cancelImportBtn").textContent = t("cancel");
  $("confirmImportBtn").textContent = t("import");
  $("shadowTitle").textContent = t("shadow");
  $("speakAnswerBtn").textContent = t("speakAnswer");
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
}

function renderViewNav() {
  $("viewNav").innerHTML = "";
  for (const view of data.views) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.view = view.id;
    button.textContent = localized(view);
    button.className = view.id === state.view ? "active" : "";
    button.addEventListener("click", () => setView(view.id));
    $("viewNav").appendChild(button);
  }
}

function renderModeOptions() {
  $("modeSelect").innerHTML = "";
  for (const mode of data.modes) {
    const option = document.createElement("option");
    option.value = mode.id;
    option.textContent = `${localized(mode)} (${countForMode(mode)})`;
    option.selected = mode.id === state.mode;
    $("modeSelect").appendChild(option);
  }
}

function renderTabs() {
  const tabNames = ["intent", "simple", "full", "followups"];
  $("answerTabs").innerHTML = "";
  for (const tab of tabNames) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.tab = tab;
    button.className = `tab${state.tab === tab ? " active" : ""}`;
    button.textContent = t(tab);
    button.addEventListener("click", () => {
      state.tab = tab;
      renderQuestion();
    });
    $("answerTabs").appendChild(button);
  }
}

function renderQuestion() {
  const question = mergedQuestion();
  const item = question.localized;
  $("categoryPill").textContent = localized(question.category);
  $("difficultyPill").textContent = localized(question.difficulty);
  $("questionText").textContent = item.question;
  $("questionIntent").textContent = item.intent.join(" / ");
  $("editableSimple").value = item.simple;
  $("editableFull").value = item.full;
  $("editableNotes").value = item.notes;

  if (state.tab === "intent") {
    $("tabContent").innerHTML = renderIntentPoints(item.intent, item);
  } else if (state.tab === "followups") {
    $("tabContent").innerHTML = renderFollowups(item.followups);
  } else {
    $("tabContent").textContent = item[state.tab];
  }

  const shadowSource = state.tab === "full" ? item.full : item.simple;
  $("shadowLines").innerHTML = splitLines(shadowSource)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
}

function renderIntentPoints(points, item) {
  const evidence = buildIntentEvidence(item, points);
  const answerHook = buildAnswerHook(item);
  return `
    <div class="intent-board">
      <div class="intent-board-head">
        <span>${t("intentBoardKicker")}</span>
        <strong>${t("intentBoardTitle")}</strong>
        <p>${t("intentBoardSubtitle")}</p>
      </div>
      <div class="intent-rubric-list">
        ${points.map((point, index) => `
          <div class="intent-rubric-card">
            <span class="intent-index">${String(index + 1).padStart(2, "0")}</span>
            <div class="intent-rubric-copy">
              <strong class="intent-card-title">${t("intentCardTitle")}</strong>
              <p>${escapeHtml(point)}</p>
            </div>
            <div class="intent-signal">
              <strong>${t("intentEvidenceTitle")}</strong>
              <span>${escapeHtml(evidence[index])}</span>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="intent-cue">
        <strong>${t("intentCueTitle")}</strong>
        <span class="intent-hook-steps">${escapeHtml(answerHook)}</span>
      </div>
    </div>
  `;
}

function buildIntentEvidence(item, points) {
  const sentences = splitEvidenceSentences(item.simple || item.full || "");
  return points.map((_, index) => {
    return sentences[index] || sentences[sentences.length - 1] || item.notes || t("intentEvidenceFallback");
  });
}

function buildAnswerHook(item) {
  const [opening] = splitEvidenceSentences(item.simple || item.full || item.question || "");
  if (!opening) return t("intentCueBody");
  return `${t("intentCueBody")}: ${opening}`;
}

function splitEvidenceSentences(text) {
  const compactText = String(text)
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!compactText) return [];
  return (compactText.match(/[^。！？.!?]+[。！？.!?]?/g) || [])
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function renderFollowups(followups) {
  return `
    <div class="followup-list">
      ${followups.map((followup, index) => `
        <details class="followup-card"${index === 0 ? " open" : ""}>
          <summary>${escapeHtml(followup.question)}</summary>
          <div class="followup-body">
            <div>
              <strong>${t("followupIntent")}</strong>
              <p>${escapeHtml(followup.intent)}</p>
            </div>
            <div>
              <strong>${t("followupSimple")}</strong>
              <p>${escapeHtml(followup.simple)}</p>
            </div>
            ${followup.full ? `
              <div>
                <strong>${t("followupFull")}</strong>
                <p>${escapeHtml(followup.full)}</p>
              </div>
            ` : ""}
          </div>
        </details>
      `).join("")}
    </div>
  `;
}

function renderQuestionList() {
  const questions = filteredQuestions();
  $("sidebarQuestionList").innerHTML = "";
  if (!questions.length) {
    $("sidebarQuestionList").innerHTML = `<div class="sidebar-question-empty">${t("noResult")}</div>`;
    return;
  }
  const selectedIndex = questions.findIndex((question) => question.id === state.selectedId);
  for (const question of questions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `sidebar-question-item${question.id === state.selectedId ? " active" : ""}`;
    button.innerHTML = `
      <div class="item-title">${escapeHtml(question[state.lang].question)}</div>
      <div class="item-meta">${escapeHtml(localized(question.category))} · ${escapeHtml(localized(question.difficulty))}</div>
    `;
    button.addEventListener("click", () => {
      state.selectedId = question.id;
      renderPractice();
    });
    $("sidebarQuestionList").appendChild(button);
  }
  if (selectedIndex >= 0) {
    $("questionListTitle").textContent = `${t("questionList")} ${selectedIndex + 1}/${questions.length}`;
  } else {
    $("questionListTitle").textContent = `${t("questionList")} 0/${questions.length}`;
  }
}

function renderPractice() {
  renderTabs();
  renderModeOptions();
  if (!filteredQuestions().some((question) => question.id === state.selectedId)) {
    state.selectedId = filteredQuestions()[0]?.id || data.questions[0].id;
  }
  renderQuestion();
  renderQuestionList();
}

function renderReview() {
  const search = $("reviewSearchInput").value.trim().toLowerCase();
  const matches = (text) => !search || text.toLowerCase().includes(search);
  const focusItems = data.reviewFocus.filter((item) => matches(localized(item)));
  $("reviewFocusList").innerHTML = focusItems.map((item) => `
    <div class="review-item">
      <strong>${escapeHtml(localized(item))}</strong>
      <button type="button" class="phrase-chip" data-speak="${escapeHtml(localized(item))}">${t("speak")}</button>
    </div>
  `).join("") || `<div class="review-item">${t("noResult")}</div>`;

  $("frameworkList").innerHTML = data.questionFrameworks.map((framework) => `
    <div class="framework-item">
      <strong>${escapeHtml(localized(framework))}</strong>
      <span>${escapeHtml(localized(framework.guide))}</span>
    </div>
  `).join("");

  $("phraseBank").innerHTML = data.phraseBank.map((group) => `
    <div class="phrase-group">
      <strong>${escapeHtml(localized(group.title))}</strong>
      <div class="phrase-chips">
        ${group.items.map((item) => {
          const text = localized(item);
          return `<button type="button" class="phrase-chip" data-copy="${escapeHtml(text)}">${escapeHtml(text)}</button>`;
        }).join("")}
      </div>
    </div>
  `).join("");
}

function renderCompany() {
  const research = data.companyResearch;
  const search = $("companySearchInput").value.trim().toLowerCase();
  const matches = (text) => !search || text.toLowerCase().includes(search);
  $("sourceStrip").innerHTML = `
    <div class="source-item">
      <strong>${t("sourceDate")}: ${escapeHtml(research.researchedAt)}</strong>
      <p>${escapeHtml(localized(research.factBoundary))}</p>
    </div>
    <div class="source-item">
      <strong>${t("sources")}</strong>
      ${research.sources.map((source) => `<p><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)}</a> · ${escapeHtml(source.accessedAt)}</p>`).join("")}
    </div>
  `;
  const cards = research.cards.filter((card) => {
    const haystack = [localized(card.title), localized(card.body), localized(card.interviewUse)].join(" ").toLowerCase();
    return matches(haystack);
  });
  $("companyCards").innerHTML = cards.map((card) => `
    <article class="company-item">
      <strong>${escapeHtml(localized(card.title))}</strong>
      <p>${escapeHtml(localized(card.body))}</p>
      <p><b>${t("interviewUse")}:</b> ${escapeHtml(localized(card.interviewUse))}</p>
    </article>
  `).join("") || `<div class="company-item">${t("noResult")}</div>`;
}

function renderMap() {
  $("questionMap").innerHTML = data.questionFrameworks.map((framework) => {
    const questions = data.questions.filter((question) => question.framework === framework.id);
    return `
      <section class="map-group">
        <strong>${escapeHtml(localized(framework))}</strong>
        <p>${escapeHtml(localized(framework.guide))}</p>
        <div class="question-list">
          ${questions.map((question) => `
            <button type="button" class="list-item" data-question="${escapeHtml(question.id)}">
              <div class="item-title">${escapeHtml(question[state.lang].question)}</div>
              <div class="item-meta">${escapeHtml(localized(question.category))}</div>
            </button>
          `).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderAll() {
  renderMeta();
  renderViewNav();
  renderModeOptions();
  renderPractice();
  setView(state.view);
}

function splitLines(text) {
  return String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function updateCurrentEdit() {
  const id = state.selectedId;
  state.edits[id] = state.edits[id] || {};
  state.edits[id][state.lang] = {
    simple: $("editableSimple").value,
    full: $("editableFull").value,
    notes: $("editableNotes").value,
  };
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  $("saveStatus").textContent = t("copied");
}

function speak(text) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.lang === "zh" ? "zh-CN" : "en-US";
  window.speechSynthesis.speak(utterance);
}

function startTimer(seconds) {
  clearInterval(state.timer);
  state.timerRemaining = seconds;
  updateTimerDisplay();
  state.timer = setInterval(() => {
    state.timerRemaining -= 1;
    updateTimerDisplay();
    if (state.timerRemaining <= 0) clearInterval(state.timer);
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(state.timerRemaining / 60);
  const seconds = state.timerRemaining % 60;
  $("timerDisplay").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function exportEdits() {
  const payload = {
    exportedAt: new Date().toISOString(),
    meta: data.meta,
    edits: state.edits,
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "interview-prep-edits.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importEdits() {
  try {
    const payload = JSON.parse($("importText").value);
    if (!payload.edits || typeof payload.edits !== "object") throw new Error("Missing edits");
    state.edits = { ...state.edits, ...payload.edits };
    saveLocalEdits();
    $("importDialog").close();
    $("saveStatus").textContent = t("imported");
    renderAll();
  } catch (error) {
    $("saveStatus").textContent = error.message;
  }
}

function bindEvents() {
  $("languageSwitch").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-lang]");
    if (!button) return;
    state.lang = button.dataset.lang;
    document.querySelectorAll("#languageSwitch button").forEach((item) => {
      item.classList.toggle("active", item.dataset.lang === state.lang);
    });
    renderAll();
  });

  $("randomBtn").addEventListener("click", () => {
    const questions = filteredQuestions();
    const next = questions[Math.floor(Math.random() * questions.length)];
    if (next) {
      state.selectedId = next.id;
      renderPractice();
    }
  });

  $("modeSelect").addEventListener("change", () => {
    state.mode = $("modeSelect").value;
    renderPractice();
  });

  $("sidebarQuestionSearch").addEventListener("input", renderQuestionList);
  $("reviewSearchInput").addEventListener("input", renderReview);
  $("companySearchInput").addEventListener("input", renderCompany);

  $("saveEditBtn").addEventListener("click", () => {
    updateCurrentEdit();
    syncEditsToFile();
    renderPractice();
  });

  $("resetBtn").addEventListener("click", () => {
    if (state.edits[state.selectedId]) {
      delete state.edits[state.selectedId][state.lang];
      if (!Object.keys(state.edits[state.selectedId]).length) delete state.edits[state.selectedId];
      saveLocalEdits();
      renderPractice();
    }
  });

  $("copySimpleBtn").addEventListener("click", () => {
    copyText($("editableSimple").value);
  });

  $("speakCoreBtn").addEventListener("click", () => speak(localized(data.meta.coreLine)));
  $("speakAnswerBtn").addEventListener("click", () => {
    const item = mergedQuestion().localized;
    speak(state.tab === "full" ? item.full : item.simple);
  });

  $("timer60").addEventListener("click", () => startTimer(60));
  $("timer90").addEventListener("click", () => startTimer(90));
  $("timer120").addEventListener("click", () => startTimer(120));
  $("stopTimer").addEventListener("click", () => {
    clearInterval(state.timer);
    state.timerRemaining = 0;
    updateTimerDisplay();
  });

  $("exportBtn").addEventListener("click", exportEdits);
  $("importBtn").addEventListener("click", () => $("importDialog").showModal());
  $("confirmImportBtn").addEventListener("click", importEdits);

  document.addEventListener("click", (event) => {
    const speakButton = event.target.closest("[data-speak]");
    if (speakButton) speak(speakButton.dataset.speak);
    const copyButton = event.target.closest("[data-copy]");
    if (copyButton) copyText(copyButton.dataset.copy);
    const mapQuestion = event.target.closest("[data-question]");
    if (mapQuestion) {
      state.selectedId = mapQuestion.dataset.question;
      setView("practice");
      renderPractice();
    }
  });

  window.addEventListener("beforeunload", () => window.speechSynthesis?.cancel());
}

loadLocalEdits();
bindEvents();
renderAll();
loadFileEdits();
