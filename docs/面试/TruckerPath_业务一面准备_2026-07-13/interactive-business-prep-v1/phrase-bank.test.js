const assert = require("node:assert/strict");
const { PHRASE_BANK, REVIEW_FOCUS } = require("./phrase-bank.js");

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("phrase bank includes business-round sections", () => {
  const titles = PHRASE_BANK.map((section) => section.title);
  assert.deepEqual(titles, [
    "开场定位句",
    "项目故事句",
    "产品理解句",
    "用户路径句",
    "信息可信度 / UGC",
    "设计协作句",
    "指标 / 取舍句",
    "缺口救场句",
    "紧张时的缓冲句",
    "产品指标词",
    "卡车 / 地图 / 社区词",
    "反问句",
  ]);
});

test("phrase bank contains next-round critical language", () => {
  const flatItems = PHRASE_BANK.flatMap((section) => section.items);
  assert(flatItems.some((item) => item.text === "我的核心经验，是把复杂的真实业务流程拆成清晰的产品方案。"));
  assert(flatItems.some((item) => item.text === "Trucker Path 的核心价值不是单纯做导航，而是帮助司机和车队减少出发前和路上的不确定性。"));
  assert(flatItems.some((item) => item.text === "我和设计师协作时，一般不会直接从页面开始，而是先回到用户路径和关键决策点。"));
  assert(flatItems.some((item) => item.text === "这里的 UGC 是 operational UGC，不是泛内容社区。"));
  assert(flatItems.some((item) => item.term === "数据新鲜度"));
  assert(flatItems.some((item) => item.term === "卡车安全路线规划"));
});

test("review hub has a focused business-round cram list", () => {
  assert(REVIEW_FOCUS.length >= 10);
  assert(REVIEW_FOCUS.length <= 15);
  assert(REVIEW_FOCUS.some((item) => item.text.includes("减少出发前和路上的不确定性")));
  assert(REVIEW_FOCUS.some((item) => item.text.includes("新鲜度和可信度")));
  assert(REVIEW_FOCUS.some((item) => item.text.includes("operational UGC")));
  assert(REVIEW_FOCUS.some((item) => item.text.includes("不会把自己包装成行业专家")));
});
