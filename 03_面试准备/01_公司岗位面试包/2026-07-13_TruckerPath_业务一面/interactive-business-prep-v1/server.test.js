const assert = require("node:assert/strict");
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

test("normalizes browser edits into a git-trackable payload", () => {
  const payload = normalizeEditsPayload({
    edits: {
      self_intro: {
        simple: "简短回答",
        full: "完整回答",
        notes: "中文钩子",
        ignored: "nope",
      },
    },
  }, "2026-07-10T12:00:00.000Z");

  assert.equal(payload.savedAt, "2026-07-10T12:00:00.000Z");
  assert.deepEqual(payload.edits, {
    self_intro: { simple: "简短回答", full: "完整回答", notes: "中文钩子" },
  });
});

test("renders saved edits as markdown for review and git diffs", () => {
  const markdown = renderEditsMarkdown({
    savedAt: "2026-07-10T12:00:00.000Z",
    edits: {
      self_intro: { simple: "简短回答", full: "完整回答", notes: "中文钩子" },
    },
  }, [{ id: "self_intro", question: "请做一个 60 秒业务一面自我介绍。", chinese: "目标：中文说清背景、迁移能力和对 Trucker Path 的理解。" }]);

  assert.match(markdown, /# Trucker Path 业务一面互动练习保存稿/);
  assert.match(markdown, /## 请做一个 60 秒业务一面自我介绍。/);
  assert.match(markdown, /### 简短回答/);
  assert.match(markdown, /简短回答/);
  assert.match(markdown, /中文钩子/);
});
