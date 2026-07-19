const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const { INTERVIEW_PREP_DATA } = require("./data.js");
const { normalizeEditsPayload, renderEditsMarkdown } = require("./server.js");

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("questions are bilingual and map to reusable frameworks", () => {
  assert.ok(INTERVIEW_PREP_DATA.questions.length >= 8);
  const frameworkIds = new Set(INTERVIEW_PREP_DATA.questionFrameworks.map((item) => item.id));
  for (const question of INTERVIEW_PREP_DATA.questions) {
    assert.ok(question.id);
    assert.ok(frameworkIds.has(question.framework));
    assert.ok(question.zh.question.length > 8);
    assert.ok(question.en.question.length > 8);
    assert.ok(question.zh.simple.length > 20);
    assert.ok(question.en.simple.length > 20);
    assert.ok(Array.isArray(question.zh.followups));
    assert.ok(Array.isArray(question.en.followups));
    for (const followup of question.zh.followups) {
      assert.ok(followup.question.length > 4);
      assert.ok(followup.intent.length > 4);
      assert.ok(followup.simple.length > 10);
    }
    for (const followup of question.en.followups) {
      assert.ok(followup.question.length > 4);
      assert.ok(followup.intent.length > 4);
      assert.ok(followup.simple.length > 10);
    }
  }
});

test("top-level views are mutually exclusive app destinations", () => {
  assert.deepEqual(
    INTERVIEW_PREP_DATA.views.map((view) => view.id),
    ["practice", "review", "company", "map"],
  );
  for (const view of INTERVIEW_PREP_DATA.views) {
    assert.ok(view.zh.length > 1);
    assert.ok(view.en.length > 1);
  }
});

test("global navigation is top-level while practice filtering stays compact", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.match(html, /class="top-heading"/);
  assert.match(html, /class="utility-cluster"/);
  assert.match(html, /id="viewNav"/);
  assert.match(html, /id="modeSelect"/);
  assert.match(html, /id="sidebarQuestionSearch"/);
  assert.match(html, /id="sidebarQuestionList"/);
  assert.doesNotMatch(html, /class="top-switches"/);
  assert.doesNotMatch(html, /id="modeFilterNav"/);
  assert.doesNotMatch(html, /class="question-list-section"/);
  assert.ok(
    html.indexOf('id="modeSelect"') < html.indexOf('id="sidebarQuestionSearch"'),
    "mode dropdown should sit immediately above the question bank search",
  );
  assert.ok(
    html.indexOf('id="questionNavPanel"') < html.indexOf('class="quick-panel"'),
    "question bank should appear before the quick phrase panel",
  );

  const script = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
  assert.match(script, /function countForMode/);
  assert.match(script, /function renderModeOptions/);
  assert.match(script, /function setPracticeSidebarVisible/);
  assert.match(script, /modeSelect/);
  assert.doesNotMatch(script, /renderModeFilters/);
  assert.doesNotMatch(script, /modeFilterNav/);
  assert.match(script, /sidebarQuestionList/);

  const styles = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
  assert.match(styles, /\.topbar\s*{[^}]*grid-template-columns:\s*minmax\(150px,\s*0\.75fr\)\s*auto\s*minmax\(250px,\s*1fr\)/s);
  assert.match(styles, /\.view-nav\s*{[^}]*flex-wrap:\s*nowrap/s);
  assert.match(styles, /\.utility-cluster\s*{[^}]*flex-wrap:\s*nowrap/s);
  assert.match(styles, /\.top-actions\s*{[^}]*flex-wrap:\s*nowrap/s);
});

test("intent tab renders rubric dimensions with an answer hook", () => {
  const script = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
  assert.match(script, /function renderIntentPoints/);
  assert.match(script, /function buildIntentEvidence/);
  assert.match(script, /function buildAnswerHook/);
  assert.match(script, /function splitEvidenceSentences/);
  assert.match(script, /match\(\/\[\^。！？\.!\?\]\+\[。！？\.!\?\]\?\//);
  assert.match(script, /class="intent-board"/);
  assert.match(script, /class="intent-board-head"/);
  assert.match(script, /class="intent-rubric-list"/);
  assert.match(script, /class="intent-rubric-card"/);
  assert.match(script, /class="intent-index"/);
  assert.match(script, /class="intent-card-title"/);
  assert.match(script, /class="intent-signal"/);
  assert.match(script, /class="intent-cue"/);
  assert.match(script, /class="intent-hook-steps"/);
  assert.match(script, /intentBoardTitle/);
  assert.match(script, /intentEvidenceFallback/);
  assert.match(script, /intentCueBody/);
  assert.doesNotMatch(script, /用一个具体例子支撑这个信号/);
  assert.doesNotMatch(script, /Use one concrete example to support this signal/);
  assert.doesNotMatch(script, /结论 → 例子 → 岗位/);
  assert.doesNotMatch(script, /Conclusion → Example → Role fit/);

  const styles = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
  assert.match(styles, /\.intent-board\s*{/);
  assert.match(styles, /\.intent-board-head\s*{/);
  assert.match(styles, /\.intent-rubric-list\s*{/);
  assert.match(styles, /\.intent-rubric-card\s*{/);
  assert.match(styles, /\.intent-index\s*{/);
  assert.match(styles, /\.intent-card-title\s*{/);
  assert.match(styles, /\.intent-signal\s*{/);
  assert.match(styles, /\.intent-cue\s*{/);
  assert.match(styles, /\.intent-hook-steps\s*{/);
});

test("company research carries source dates and public urls", () => {
  assert.match(INTERVIEW_PREP_DATA.companyResearch.researchedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(INTERVIEW_PREP_DATA.companyResearch.sources.length >= 1);
  for (const source of INTERVIEW_PREP_DATA.companyResearch.sources) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.label.length > 2);
  }
});

test("draft files do not contain API credentials", () => {
  const credentialPattern = /(sk-[A-Za-z0-9_-]{20,}|api[_-]?key\s*[:=]|authorization\s*[:=]|bearer\s+[A-Za-z0-9._-]{20,})/i;
  const files = fs.readdirSync(ROOT).filter((file) => /\.(html|css|js|md|json)$/.test(file));
  for (const file of files) {
    const content = fs.readFileSync(path.join(ROOT, file), "utf8");
    assert.equal(credentialPattern.test(content), false, `${file} appears to contain a credential-like string`);
  }
});

test("server normalizes bilingual edit payloads", () => {
  const payload = normalizeEditsPayload({
    edits: {
      self_intro: {
        zh: { simple: "中文简短", full: "中文完整", notes: "中文备注" },
        en: { simple: "English simple", full: "English full", notes: "English notes" },
        ignored: "drop me",
      },
      invalid: null,
    },
  }, "2026-07-16T00:00:00.000Z");

  assert.deepEqual(payload, {
    savedAt: "2026-07-16T00:00:00.000Z",
    edits: {
      self_intro: {
        zh: { simple: "中文简短", full: "中文完整", notes: "中文备注" },
        en: { simple: "English simple", full: "English full", notes: "English notes" },
      },
    },
  });
});

test("server renders saved edits as reviewable markdown", () => {
  const markdown = renderEditsMarkdown({
    savedAt: "2026-07-16T00:00:00.000Z",
    edits: {
      self_intro: {
        zh: { simple: "中文简短", full: "中文完整", notes: "中文备注" },
        en: { simple: "English simple", full: "English full", notes: "English notes" },
      },
    },
  }, INTERVIEW_PREP_DATA.questions);

  assert.match(markdown, /# Interview Prep Saved Edits/);
  assert.match(markdown, /## 请做一个 60 秒自我介绍。/);
  assert.match(markdown, /### 中文简短回答/);
  assert.match(markdown, /English full/);
});
