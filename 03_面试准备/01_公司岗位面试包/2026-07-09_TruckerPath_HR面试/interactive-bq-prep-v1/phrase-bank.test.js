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

test("phrase bank includes every section from the source markdown", () => {
  const titles = PHRASE_BANK.map((section) => section.title);
  assert.deepEqual(titles, [
    "万能句：迁移能力",
    "万能句：产品兴趣",
    "万能句：承认缺口但不示弱",
    "万能句：Trucker Path 产品理解",
    "产品常见词",
    "产品红词唤醒",
    "产品协作 / 部门常见词",
    "产品价值 / 生命周期常见词",
    "社区 / UGC 常见词",
    "卡车 / 货运 / 导航常见词",
    "紧张时的缓冲句",
    "产品词开口句",
    "收尾句",
  ]);
});

test("phrase bank keeps memorable phrases and vocabulary pairs", () => {
  const flatItems = PHRASE_BANK.flatMap((section) => section.items);
  assert(flatItems.some((item) => item.text === "I’m good at turning complex real-world workflows into clear product requirements and actionable delivery plans."));
  assert(flatItems.some((item) => item.text === "That’s a good question. Let me think for a second."));
  assert(flatItems.some((item) => item.term === "constraint" && item.translation.includes("约束")));
  assert(flatItems.some((item) => item.term === "engineering team" && item.translation.includes("研发")));
  assert(flatItems.some((item) => item.term === "Customer Success team" && item.translation.includes("客户成功")));
  assert(flatItems.some((item) => item.term === "full product lifecycle" && item.translation === "产品全生命周期"));
  assert(flatItems.some((item) => item.term === "on-premise deployment / on-prem deployment" && item.translation.includes("私有化部署")));
  assert(flatItems.some((item) => item.term === "customized requirements" && item.translation === "定制化需求"));
  assert(flatItems.some((item) => item.term === "common industry requirements" && item.translation === "行业通用需求"));
  assert(flatItems.some((item) => item.term === "take over" && item.translation.includes("接手")));
  assert(flatItems.some((item) => item.text === "I participated in the full product lifecycle, from identifying user needs to launching and iterating the product."));
  assert(flatItems.some((item) => item.text === "I took over the project in the middle, so my first step was to understand the current status, key risks, and next steps."));
  assert(flatItems.some((item) => item.text === "My work was about turning customized client requirements into more standardized product capabilities for common industry needs."));
  assert(flatItems.some((item) => item.term === "data freshness" && item.translation === "数据新鲜度"));
  assert(flatItems.some((item) => item.term === "truck-safe navigation" && item.translation === "卡车安全导航"));
});

test("review hub has a focused 5-minute cram list", () => {
  assert(REVIEW_FOCUS.length >= 8);
  assert(REVIEW_FOCUS.length <= 15);
  assert(REVIEW_FOCUS.some((item) => item.text.includes("turning complex real-world workflows")));
  assert(REVIEW_FOCUS.some((item) => item.text.includes("overclaim industry experience")));
  assert(REVIEW_FOCUS.some((item) => item.text.includes("Trucker Path is not just a navigation app")));
  assert(REVIEW_FOCUS.some((item) => item.text.includes("Let me think for a second")));
});
