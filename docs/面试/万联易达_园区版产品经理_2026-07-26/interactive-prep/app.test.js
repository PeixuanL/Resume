const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const questionsSource = fs.readFileSync(path.join(root, "questions.js"), "utf8");
const phraseSource = fs.readFileSync(path.join(root, "phrase-bank.js"), "utf8");
const productSource = fs.readFileSync(path.join(root, "product-understanding.js"), "utf8");
const sandbox = { window: {} };

vm.createContext(sandbox);
vm.runInContext(questionsSource, sandbox, { filename: "questions.js" });
vm.runInContext(phraseSource, sandbox, { filename: "phrase-bank.js" });
vm.runInContext(productSource, sandbox, { filename: "product-understanding.js" });

assert.match(html, /万联易达/);
assert.match(html, /questions\.js/);
assert.match(html, /phrase-bank\.js/);
assert.match(html, /product-understanding\.js/);
assert.ok(Array.isArray(sandbox.window.INTERVIEW_QUESTIONS));
assert.ok(sandbox.window.INTERVIEW_QUESTIONS.length >= 18);
assert.ok(sandbox.window.INTERVIEW_QUESTIONS.some((q) => q.id === "main_product_experience_confirmed"));
assert.ok(sandbox.window.INTERVIEW_QUESTIONS.some((q) => q.id === "project_personal_contribution"));
assert.ok(sandbox.window.INTERVIEW_QUESTIONS.some((q) => q.id === "ai_launch_status"));
assert.ok(sandbox.window.REVIEW_FOCUS.length >= 8);
assert.ok(sandbox.window.PHRASE_BANK.length >= 6);
assert.ok(sandbox.window.PRODUCT_UNDERSTANDING.quickLines.length >= 4);

for (const question of sandbox.window.INTERVIEW_QUESTIONS) {
  assert.ok(question.id, "question id is required");
  assert.ok(question.question, `${question.id} question is required`);
  assert.ok(question.chinese, `${question.id} chinese guide is required`);
  assert.ok(question.tests, `${question.id} tests is required`);
  assert.ok(Array.isArray(question.intent), `${question.id} intent must be an array`);
  assert.ok(question.simple.length > 80, `${question.id} simple answer should be useful`);
  assert.ok(question.full, `${question.id} full answer is required`);
  assert.ok(question.notes, `${question.id} notes are required`);
  assert.ok(Array.isArray(question.followups), `${question.id} followups are required`);
}

console.log("wanlian interactive prep smoke test passed");
