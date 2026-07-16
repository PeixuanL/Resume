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
