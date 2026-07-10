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
        simple: "Short answer",
        full: "Full answer",
        notes: "Memory hook",
        ignored: "nope",
      },
    },
  }, "2026-07-10T12:00:00.000Z");

  assert.equal(payload.savedAt, "2026-07-10T12:00:00.000Z");
  assert.deepEqual(payload.edits, {
    self_intro: { simple: "Short answer", full: "Full answer", notes: "Memory hook" },
  });
});

test("renders saved edits as markdown for review and git diffs", () => {
  const markdown = renderEditsMarkdown({
    savedAt: "2026-07-10T12:00:00.000Z",
    edits: {
      self_intro: { simple: "Short answer", full: "Full answer", notes: "Memory hook" },
    },
  }, [{ id: "self_intro", question: "Tell me about yourself.", chinese: "请介绍一下你自己。" }]);

  assert.match(markdown, /# Moatable \/ Trucker Path 互动面试练习保存稿/);
  assert.match(markdown, /## Tell me about yourself\./);
  assert.match(markdown, /Short answer/);
  assert.match(markdown, /Memory hook/);
});
