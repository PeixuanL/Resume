const STORAGE_KEY = "truckerpath_business_round_prep_cn_v1";
const state = { questions: window.INTERVIEW_QUESTIONS, phraseBank: window.PHRASE_BANK || [], reviewFocus: window.REVIEW_FOCUS || [], productUnderstanding: window.PRODUCT_UNDERSTANDING || null, selectedId: window.INTERVIEW_QUESTIONS[0].id, selectedCategory: "全部", selectedTab: "intent", activeView: "practice", edits: {}, timer: null, timerRemaining: 0 };
const $ = (id) => document.getElementById(id);
const FILE_SYNC_URL = "/api/edits";
const STATIC_SAVE_URL = "saved-edits.json";
let autoSaveTimer = null;
let fileSyncAvailable = false;
const baseQuestionOrder = new Map(state.questions.map((q, index) => [q.id, index]));
const HIGH_FREQUENCY_IDS = [
  "business_intro",
  "main_product_experience",
  "project_personal_contribution",
  "preferred_module_fit",
  "parking_case",
  "similar_experience",
  "mvp_scope_business",
  "truckerpath_product_value",
  "product_matrix_business",
  "design_collaboration",
  "design_disagreement",
  "metrics",
  "first_90_days",
  "questions_to_ask",
];
const CATEGORY_GROUPS = [
  { label: "全部", ids: null, categories: null },
  { label: "高频必练", ids: HIGH_FREQUENCY_IDS, categories: null },
  { label: "开场定位", ids: null, categories: ["开场与定位", "迁移能力"] },
  { label: "核心项目", ids: null, categories: ["项目经历", "项目深挖"] },
  { label: "产品理解", ids: null, categories: ["产品理解", "用户路径", "用户体验"] },
  { label: "Case/UGC", ids: null, categories: ["案例演练", "社区与UGC", "指标与增长"] },
  { label: "设计协作", ids: null, categories: ["设计协作"] },
  { label: "AI与边界", ids: null, categories: ["AI与边界"] },
  { label: "落地反问", ids: null, categories: ["落地计划", "反问问题"] },
  { label: "Mock复盘", ids: null, categories: ["Mock复盘优化"] },
  { label: "简历深挖", ids: null, categories: ["简历深挖与AI边界"] },
];
const MODE_PRIORITY = {
  warmup: [
    "business_intro",
    "main_product_experience",
    "preferred_module_fit",
    "similar_experience",
    "truckerpath_product_value",
    "b2b_to_user_facing",
    "new_domain_learning",
    "questions_to_ask",
  ],
  product: [
    "business_intro",
    "main_product_experience",
    "project_personal_contribution",
    "preferred_module_fit",
    "parking_case",
    "similar_experience",
    "mvp_scope_business",
    "truckerpath_product_value",
    "product_matrix_business",
    "ugc_mechanism",
    "metrics",
    "driver_journey",
    "design_collaboration",
    "design_disagreement",
    "ai_boundary_business",
    "ux_challenge",
    "b2b_to_user_facing",
    "new_domain_learning",
    "first_90_days",
    "questions_to_ask",
  ],
  designer: [
    "business_intro",
    "parking_case",
    "design_collaboration",
    "design_disagreement",
    "ux_challenge",
    "driver_journey",
    "ugc_mechanism",
    "truckerpath_product_value",
    "main_product_experience",
    "similar_experience",
    "questions_to_ask",
  ],
  pressure: [
    "preferred_module_fit",
    "parking_case",
    "project_personal_contribution",
    "mvp_scope_business",
    "similar_experience",
    "metrics",
    "truckerpath_product_value",
    "business_intro",
    "main_product_experience",
    "b2b_to_user_facing",
    "new_domain_learning",
    "questions_to_ask",
  ],
  mock: [
    "mock_q1_business_intro_optimized",
    "mock_q2_parking_reliability_optimized",
    "mock_q3_project_story_optimized",
    "mock_q4_mvp_tradeoff_optimized",
    "mock_q5_priority_truckerpath_optimized",
    "mock_q6_design_collaboration_optimized",
    "mock_q7_first_30_days_optimized",
    "mock_q8_why_hire_you_optimized",
    "mock_q9_questions_to_ask_optimized",
  ],
  resume: [
    "resume_project_pm_actions",
    "resume_ai_pm_boundary",
    "resume_ai_work_order_case",
    "resume_ai_launch_status",
    "resume_ai_bad_output",
    "resume_ai_to_truckerpath_transfer",
  ],
};

function loadEdits(){ try { state.edits = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { state.edits = {}; } }
function persistEdits(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.edits)); }
function applyLoadedEdits(payload, message, canWriteToFile){
  if (!payload.edits || typeof payload.edits !== "object") return false;
  state.edits = { ...state.edits, ...payload.edits };
  persistEdits();
  fileSyncAvailable = canWriteToFile;
  renderAll();
  $("saveStatus").textContent = message;
  return true;
}
async function loadFileEdits(){
  try {
    const response = await fetch(FILE_SYNC_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (applyLoadedEdits(payload, "已加载仓库文件 saved-edits.json 中的修改。", true)) return;
  } catch {
  }

  try {
    const response = await fetch(STATIC_SAVE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (applyLoadedEdits(payload, "已加载静态 saved-edits.json。当前为手机/Pages 只读复习模式。", false)) return;
  } catch {
  }

  fileSyncAvailable = false;
  $("saveStatus").textContent = "当前未连接文件保存服务：修改只会保存在本浏览器。请用 node server.js 启动。";
}
async function syncEditsToFile(message){
  try {
    const response = await fetch(FILE_SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edits: state.edits }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    fileSyncAvailable = true;
    const suffix = message || "已保存到浏览器和仓库文件 saved-edits.json / saved-edits.md，可随 Git 推送。";
    $("saveStatus").textContent = suffix;
    return true;
  } catch {
    fileSyncAvailable = false;
    $("saveStatus").textContent = "已保存到本浏览器，但未写入仓库文件。请确认用 node server.js 启动。";
    return false;
  }
}
function getQuestion(id = state.selectedId){ return state.questions.find(q => q.id === id) || state.questions[0]; }
function getMergedQuestion(id = state.selectedId){ const q = getQuestion(id); return { ...q, ...(state.edits[id] || {}) }; }
function isMockQuestion(q){ return q.category === "Mock复盘优化" || q.mode.includes("mock"); }
function isResumeQuestion(q){ return q.category === "简历深挖与AI边界" || q.mode.includes("resume"); }
function categoryGroup(label){ return CATEGORY_GROUPS.find(group => group.label === label) || CATEGORY_GROUPS[0]; }
function matchesCategoryGroup(q, group){
  if (!group || group.label === "全部") return true;
  if (group.ids) return group.ids.includes(q.id);
  return group.categories.includes(q.category);
}
function categories(){
  const labels = [];
  for (const group of CATEGORY_GROUPS) {
    const count = countForCategory(group.label);
    if (group.label === "全部" || count > 0) labels.push(group.label);
  }
  return labels;
}
function escapeHtml(value){ return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;"); }
function currentMode(){ return $("modeSelect").value; }
function currentSearch(){ return $("searchInput").value.trim().toLowerCase(); }
function matchesMode(q, mode = currentMode()){
  if (mode !== "mock" && isMockQuestion(q)) return false;
  if (mode !== "resume" && isResumeQuestion(q)) return false;
  if (mode === "warmup") return q.mode.includes("warmup");
  if (mode === "mock") return q.mode.includes("mock") || q.category === "Mock复盘优化";
  if (mode === "resume") return q.mode.includes("resume") || q.category === "简历深挖与AI边界";
  if (mode === "pressure") return q.mode.includes("pressure") || q.difficulty === "高压";
  return q.mode.includes(mode) || q.mode.includes("warmup");
}
function matchesSearch(q, search = currentSearch()){
  const haystack = [q.question, q.chinese, q.category, q.tests, q.simple, q.notes].join(" ").toLowerCase();
  return !search || haystack.includes(search);
}
function matchesCategory(q, category){ return matchesCategoryGroup(q, categoryGroup(category)); }
function sortQuestionsByPriority(items){
  const order = MODE_PRIORITY[currentMode()] || [];
  const priority = new Map(order.map((id, index) => [id, index]));
  return [...items].sort((a, b) => {
    const aRank = priority.has(a.id) ? priority.get(a.id) : 1000 + (baseQuestionOrder.get(a.id) || 0);
    const bRank = priority.has(b.id) ? priority.get(b.id) : 1000 + (baseQuestionOrder.get(b.id) || 0);
    return aRank - bRank;
  });
}
function countForCategory(category){
  const mode = currentMode();
  const search = currentSearch();
  return state.questions.filter(q => matchesCategory(q, category) && matchesMode(q, mode) && matchesSearch(q, search)).length;
}

function filteredQuestions(){
  const mode = currentMode();
  const search = currentSearch();
  return sortQuestionsByPriority(state.questions.filter(q => matchesCategory(q, state.selectedCategory) && matchesMode(q, mode) && matchesSearch(q, search)));
}

function keepSelectionInScope(){
  const visibleCategories = categories();
  if (!visibleCategories.includes(state.selectedCategory)) state.selectedCategory = "全部";
  const items = filteredQuestions();
  if (items.length && !items.some(q => q.id === state.selectedId)) state.selectedId = items[0].id;
}

function setView(view){
  state.activeView = view;
  const isReview = view === "review";
  const isProduct = view === "product";
  const isPractice = view === "practice";
  $("reviewHubSection").hidden = !isReview;
  $("productInsightSection").hidden = !isProduct;
  $("practiceGrid").hidden = !isPractice;
  $("questionListSection").hidden = !isPractice;
  $("reviewHubBtn").hidden = isReview;
  $("productInsightBtn").hidden = isProduct;
  $("practiceHubBtn").hidden = isPractice;
  $("resetBtn").hidden = !isPractice;
  $("pageTitle").textContent = isReview ? "集中复习" : isProduct ? "产品理解" : "面试驾驶舱";
  if (isReview) renderReviewHub();
  if (isProduct) renderProductInsights();
}
window.setView = setView;
function reviewMatches(text, search){ return !search || text.toLowerCase().includes(search); }
function renderReviewAction(text){
  const actions = document.createElement("div");
  actions.className = "review-actions";
  const speakBtn = document.createElement("button");
  speakBtn.type = "button";
  speakBtn.textContent = "朗读";
  speakBtn.addEventListener("click", () => speak(text));
  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.textContent = "复制";
  copyBtn.addEventListener("click", () => copyText(text));
  actions.append(speakBtn, copyBtn);
  return actions;
}
function renderReviewHub(){
  const search = $("reviewSearchInput").value.trim().toLowerCase();
  const focusList = $("reviewFocusList");
  const phraseList = $("reviewPhraseList");
  const vocabList = $("reviewVocabList");
  focusList.innerHTML = "";
  phraseList.innerHTML = "";
  vocabList.innerHTML = "";

  for (const item of state.reviewFocus) {
    if (!reviewMatches(item.text, search)) continue;
    const card = document.createElement("article");
    card.className = "review-card focus-card";
    card.innerHTML = `<p>${escapeHtml(item.text)}</p>`;
    card.appendChild(renderReviewAction(item.text));
    focusList.appendChild(card);
  }

  for (const section of state.phraseBank) {
    const target = section.type === "vocabulary" ? vocabList : phraseList;
    const matchedItems = section.items.filter((item) => {
      const text = item.text || `${item.term} ${item.translation}`;
      return reviewMatches(`${section.title} ${text}`, search);
    });
    if (!matchedItems.length) continue;
    const group = document.createElement("article");
    group.className = "review-group";
    group.innerHTML = `<h4>${escapeHtml(section.title)}</h4>`;
    const list = document.createElement("div");
    list.className = section.type === "vocabulary" ? "review-vocab-items" : "review-phrase-items";
    for (const item of matchedItems) {
      const row = document.createElement("div");
      row.className = "review-card";
      const text = item.text || item.term;
      if (section.type === "vocabulary") {
        row.innerHTML = `<div><strong>${escapeHtml(item.term)}</strong><span>${escapeHtml(item.translation)}</span></div>`;
      } else {
        row.innerHTML = `<p>${escapeHtml(item.text)}</p>`;
      }
      row.appendChild(renderReviewAction(text));
      list.appendChild(row);
    }
    group.appendChild(list);
    target.appendChild(group);
  }

  if (!focusList.childElementCount) focusList.innerHTML = `<div class="phrase-empty">没有匹配的重点句。</div>`;
  if (!phraseList.childElementCount) phraseList.innerHTML = `<div class="phrase-empty">没有匹配的句式。</div>`;
  if (!vocabList.childElementCount) vocabList.innerHTML = `<div class="phrase-empty">没有匹配的词汇。</div>`;
}
function renderProductCard(card){
  const article = document.createElement("article");
  article.className = "product-card";
  const parts = [`<h5>${escapeHtml(card.label)}</h5>`, `<p>${escapeHtml(card.body)}</p>`];
  if (card.solution) parts.push(`<div class="product-card-note"><strong>产品方向</strong><span>${escapeHtml(card.solution)}</span></div>`);
  if (card.remember) parts.push(`<div class="product-card-note"><strong>记忆钩子</strong><span>${escapeHtml(card.remember)}</span></div>`);
  article.innerHTML = parts.join("");
  return article;
}
function productSearchText(){
  return $("productInsightSearchInput")?.value.trim().toLowerCase() || "";
}
function renderProductInsights(){
  const data = state.productUnderstanding;
  if (!data) return;
  const search = productSearchText();
  $("productInsightTitle").textContent = data.title;
  $("productInsightSubtitle").textContent = data.subtitle;
  $("productInsightBoundary").textContent = data.boundary;

  const quickLines = $("productQuickLines");
  quickLines.innerHTML = "";
  for (const line of data.quickLines) {
    if (!reviewMatches(line, search)) continue;
    const item = document.createElement("article");
    item.className = "product-line-card";
    item.innerHTML = `<p>${escapeHtml(line)}</p>`;
    item.appendChild(renderReviewAction(line));
    quickLines.appendChild(item);
  }
  if (!quickLines.childElementCount) quickLines.innerHTML = `<div class="phrase-empty">没有匹配的核心句。</div>`;

  const sectionContainer = $("productInsightSections");
  sectionContainer.innerHTML = "";
  for (const section of data.sections) {
    const matchedCards = section.cards.filter(card => reviewMatches(`${section.title} ${section.intro} ${card.label} ${card.body} ${card.solution || ""} ${card.remember || ""}`, search));
    if (!matchedCards.length && !reviewMatches(`${section.title} ${section.intro}`, search)) continue;
    const block = document.createElement("section");
    block.className = "product-section";
    block.innerHTML = `<div class="section-head compact"><h3>${escapeHtml(section.title)}</h3><span>${escapeHtml(section.intro)}</span></div>`;
    const grid = document.createElement("div");
    grid.className = "product-card-grid";
    for (const card of matchedCards) grid.appendChild(renderProductCard(card));
    if (!matchedCards.length) grid.innerHTML = `<div class="phrase-empty">标题匹配，但本节卡片没有匹配内容。</div>`;
    block.appendChild(grid);
    sectionContainer.appendChild(block);
  }
  if (!sectionContainer.childElementCount) sectionContainer.innerHTML = `<div class="phrase-empty">没有匹配的产品理解内容。</div>`;

  const scripts = $("productScripts");
  scripts.innerHTML = "";
  for (const script of data.scripts) {
    if (!reviewMatches(`${script.title} ${script.text}`, search)) continue;
    const card = document.createElement("article");
    card.className = "product-script-card";
    card.innerHTML = `<h4>${escapeHtml(script.title)}</h4><p>${escapeHtml(script.text)}</p>`;
    card.appendChild(renderReviewAction(script.text));
    scripts.appendChild(card);
  }
  if (!scripts.childElementCount) scripts.innerHTML = `<div class="phrase-empty">没有匹配的表达版本。</div>`;
}
function renderCategories(){
  const nav = $("categoryNav"); nav.innerHTML = "";
  for (const cat of categories()) {
    const count = countForCategory(cat);
    const btn = document.createElement("button"); btn.type = "button";
    btn.className = cat === state.selectedCategory ? "active" : "";
    btn.innerHTML = `<span>${cat}</span><span>${count}</span>`;
    btn.addEventListener("click", () => { state.selectedCategory = cat; renderAll(); });
    nav.appendChild(btn);
  }
}

function renderQuestionList(){
  const list = $("questionList"); const items = filteredQuestions(); list.innerHTML = "";
  for (const q of items) {
    const btn = document.createElement("button"); btn.type = "button";
    btn.className = `question-item ${q.id === state.selectedId ? "active" : ""}`;
    btn.innerHTML = `<strong>${escapeHtml(q.question)}</strong><span>${escapeHtml(q.category)} · ${escapeHtml(q.difficulty)}</span><span>${escapeHtml(q.chinese)}</span>`;
    btn.addEventListener("click", () => selectQuestion(q.id)); list.appendChild(btn);
  }
  if (!items.length) list.innerHTML = `<div class="question-item"><strong>没有匹配题目</strong><span>换一个模式、分类或搜索词。</span></div>`;
}
function renderSelectedQuestion(){
  const q = getMergedQuestion();
  $("categoryPill").textContent = q.category;
  $("difficultyPill").textContent = q.difficulty;
  $("questionText").textContent = q.question;
  $("questionChinese").textContent = q.chinese;
  $("editableSimple").value = q.simple;
  $("editableFull").value = q.full;
  $("editableNotes").value = q.notes || "";
  renderTab(); renderShadowLines();
}

function renderTab(){
  document.querySelectorAll(".tab").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === state.selectedTab));
  const q = getMergedQuestion(); const content = $("tabContent");
  if (state.selectedTab === "intent") {
    content.innerHTML = `<div class="intent-card"><div class="intent-row"><strong>这题考什么</strong>${escapeHtml(q.tests)}</div>${q.intent.map(([t,b]) => `<div class="intent-row"><strong>${escapeHtml(t)}</strong>${escapeHtml(b)}</div>`).join("")}<div class="intent-row"><strong>中文记忆钩子</strong>${escapeHtml(q.notes || "")}</div></div>`;
  }
  if (state.selectedTab === "simple") content.innerHTML = `<div class="answer-text easy-answer">${escapeHtml(q.simple)}</div>`;
  if (state.selectedTab === "full") content.innerHTML = `<div class="answer-text">${escapeHtml(q.full)}</div>`;
  if (state.selectedTab === "followups") content.innerHTML = `<div class="followups">${q.followups.map(f => `<div>${escapeHtml(f)}</div>`).join("")}</div>`;
}

function renderShadowLines(){
  const q = getMergedQuestion();
  const lines = q.simple.split(/(?<=[。！？.!?])\s*/).filter(Boolean);
  $("shadowLines").innerHTML = lines.map(line => `<li>${escapeHtml(line)}</li>`).join("");
}
function selectQuestion(id){ state.selectedId = id; stopTimer(); renderAll(); $("saveStatus").textContent = fileSyncAvailable ? "编辑会保存到浏览器和仓库文件。" : "当前未连接文件保存服务：修改只会保存在本浏览器。"; }
function renderAll(){ keepSelectionInScope(); renderCategories(); renderQuestionList(); renderSelectedQuestion(); }

function captureCurrentEdit(){
  const q = getQuestion();
  state.edits[q.id] = { simple: $("editableSimple").value.trim(), full: $("editableFull").value.trim(), notes: $("editableNotes").value.trim() };
  persistEdits();
}
function saveCurrentEdit(){
  captureCurrentEdit();
  renderSelectedQuestion();
  $("saveStatus").textContent = "正在保存到仓库文件...";
  syncEditsToFile();
}
function scheduleAutoSave(){
  $("saveStatus").textContent = "正在编辑，稍后自动保存...";
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    captureCurrentEdit();
    syncEditsToFile("已自动保存到浏览器和仓库文件 saved-edits.json / saved-edits.md。");
  }, 600);
}
function resetCurrentEdit(){ delete state.edits[state.selectedId]; persistEdits(); renderSelectedQuestion(); syncEditsToFile("当前题已恢复默认，并同步到仓库保存文件。"); }

function startTimer(seconds){ stopTimer(); state.timerRemaining = seconds; tickTimer(); state.timer = setInterval(() => { state.timerRemaining -= 1; tickTimer(); if (state.timerRemaining <= 0) stopTimer(false); }, 1000); }
function stopTimer(reset = true){ if (state.timer) clearInterval(state.timer); state.timer = null; if (reset){ state.timerRemaining = 0; $("timerDisplay").textContent = "00:00"; $("timerDisplay").classList.remove("warning"); } }
function tickTimer(){ const m = Math.floor(state.timerRemaining/60).toString().padStart(2,"0"); const s = (state.timerRemaining%60).toString().padStart(2,"0"); $("timerDisplay").textContent = `${m}:${s}`; $("timerDisplay").classList.toggle("warning", state.timerRemaining <= 15 && state.timerRemaining > 0); }
function randomQuestion(){ const items = filteredQuestions(); if (!items.length) return; selectQuestion(items[Math.floor(Math.random()*items.length)].id); }
function speak(text){
  if (!window.speechSynthesis) { $("saveStatus").textContent = "当前浏览器不支持朗读。"; return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text); utter.lang = "zh-CN"; utter.rate = 0.95; utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}
function copyText(text){ navigator.clipboard.writeText(text).then(() => { $("saveStatus").textContent = "已复制。"; }).catch(() => { $("saveStatus").textContent = "复制失败，可以手动选中文本复制。"; }); }
function insertIntoTextarea(textarea, text){
  const value = textarea.value;
  const prefix = value && !value.endsWith("\n") ? "\n" : "";
  textarea.value = `${value}${prefix}${text}`;
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}
function renderPhraseBank(){
  const container = $("phraseBank");
  if (!container) return;
  const search = $("phraseSearchInput").value.trim().toLowerCase();
  container.innerHTML = "";
  for (const section of state.phraseBank) {
    const items = section.items.filter((item) => {
      const text = item.text || `${item.term} ${item.translation}`;
      return !search || `${section.title} ${text}`.toLowerCase().includes(search);
    });
    if (!items.length) continue;
    const details = document.createElement("details");
    details.className = "phrase-section";
    details.open = !search && container.childElementCount < 3;
    details.innerHTML = `<summary><span>${escapeHtml(section.title)}</span><span>${items.length}</span></summary>`;
    const list = document.createElement("div");
    list.className = section.type === "vocabulary" ? "vocab-list" : "phrase-list";
    for (const item of items) {
      const text = item.text || item.term;
      const row = document.createElement("div");
      row.className = section.type === "vocabulary" ? "vocab-item" : "phrase-item";
      if (section.type === "vocabulary") {
        row.innerHTML = `<div><strong>${escapeHtml(item.term)}</strong><span>${escapeHtml(item.translation)}</span></div>`;
      } else {
        row.innerHTML = `<p>${escapeHtml(item.text)}</p>`;
      }
      const actions = document.createElement("div");
      actions.className = "phrase-actions";
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.textContent = "复制";
      copyBtn.addEventListener("click", () => copyText(text));
      const insertBtn = document.createElement("button");
      insertBtn.type = "button";
      insertBtn.textContent = "插入";
      insertBtn.addEventListener("click", () => insertIntoTextarea($("editableFull"), text));
      actions.append(copyBtn, insertBtn);
      row.appendChild(actions);
      list.appendChild(row);
    }
    details.appendChild(list);
    container.appendChild(details);
  }
  if (!container.childElementCount) container.innerHTML = `<div class="phrase-empty">没有匹配内容。</div>`;
}
function downloadFile(filename, content, type){ const blob = new Blob([content], {type}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
function exportMarkdown(){
  const all = state.questions.map(base => getMergedQuestion(base.id));
  const markdown = ["# Trucker Path 业务一面互动练习修改稿", "", "> 来源：interactive-business-prep-v1 浏览器本地编辑导出，不覆盖原资料。", ""];
  for (const q of all) {
    markdown.push(`## ${q.question}`, `- 准备重点：${q.chinese}`, `- 分类：${q.category}`, "", "### 简短回答", q.simple, "", "### 完整回答", q.full, "", "### 备注", q.notes || "", "");
  }
  const payload = { exportedAt: new Date().toISOString(), storageKey: STORAGE_KEY, edits: state.edits };
  downloadFile("truckerpath-business-round-edits.md", markdown.join("\n"), "text/markdown;charset=utf-8");
  downloadFile("truckerpath-business-round-edits.json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}
function importEdits(){
  try { const data = JSON.parse($("importText").value); if (!data.edits || typeof data.edits !== "object") throw new Error("missing edits"); state.edits = data.edits; persistEdits(); $("importDialog").close(); renderAll(); syncEditsToFile("导入成功，并已同步到仓库保存文件。"); }
  catch { $("saveStatus").textContent = "导入失败：请粘贴有效 JSON。"; }
}

function bindEvents(){
  $("modeSelect").addEventListener("change", () => renderAll());
  $("searchInput").addEventListener("input", () => { renderCategories(); renderQuestionList(); });
  $("productInsightSearchInput").addEventListener("input", renderProductInsights);
  $("randomBtn").addEventListener("click", randomQuestion);
  $("saveEditBtn").addEventListener("click", saveCurrentEdit);
  $("editableSimple").addEventListener("input", scheduleAutoSave);
  $("editableFull").addEventListener("input", scheduleAutoSave);
  $("editableNotes").addEventListener("input", scheduleAutoSave);
  $("resetBtn").addEventListener("click", resetCurrentEdit);
  $("copySimpleBtn").addEventListener("click", () => copyText($("editableSimple").value));
  $("exportBtn").addEventListener("click", exportMarkdown);
  $("importBtn").addEventListener("click", () => $("importDialog").showModal());
  $("confirmImportBtn").addEventListener("click", importEdits);
  $("timer60").addEventListener("click", () => startTimer(60)); $("timer90").addEventListener("click", () => startTimer(90)); $("timer120").addEventListener("click", () => startTimer(120)); $("stopTimer").addEventListener("click", () => stopTimer(true));
  $("speakCoreBtn").addEventListener("click", () => speak($("coreLine").textContent));
  $("speakAnswerBtn").addEventListener("click", () => { const q = getMergedQuestion(); speak(state.selectedTab === "full" ? q.full : q.simple); });
  document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => { state.selectedTab = btn.dataset.tab; renderTab(); renderShadowLines(); }));
  window.addEventListener("beforeunload", () => window.speechSynthesis?.cancel());
}
loadEdits(); bindEvents(); renderAll(); renderPhraseBank(); renderReviewHub(); renderProductInsights(); loadFileEdits();
