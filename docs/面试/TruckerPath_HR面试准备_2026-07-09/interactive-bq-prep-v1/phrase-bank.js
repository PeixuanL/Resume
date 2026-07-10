const PHRASE_BANK = [
  {
    title: "万能句：迁移能力",
    type: "phrase",
    items: [
      { text: "My previous experience is more B2B and industrial, but the transferable part is strong: user research, workflow analysis, PRD and prototype design, cross-functional delivery, and product iteration." },
      { text: "I’m good at turning complex real-world workflows into clear product requirements and actionable delivery plans." },
      { text: "The users are different, but the product thinking is connected." },
      { text: "I may not have direct trucking industry experience, but I’m familiar with complex workflows, location-based scenarios, and products where data quality affects user decisions." },
    ],
  },
  {
    title: "万能句：产品兴趣",
    type: "phrase",
    items: [
      { text: "What I’m really interested in is solving real-world operational problems through product design." },
      { text: "I like products where user value is concrete and measurable." },
      { text: "For Trucker Path, I think trust and real-time information are very important, because drivers make time-sensitive decisions on the road." },
      { text: "I’m interested in products that combine user needs, location data, workflow efficiency, and industry-specific scenarios." },
    ],
  },
  {
    title: "万能句：承认缺口但不示弱",
    type: "phrase",
    items: [
      { text: "I know this role is more consumer-facing, so I’m ready to learn more about user growth, community engagement, and UGC mechanisms." },
      { text: "This is an area I want to grow in, and I believe my structured product thinking gives me a strong foundation to ramp up quickly." },
      { text: "I don’t want to overclaim industry experience, but I’m confident in my ability to learn users and scenarios quickly." },
    ],
  },
  {
    title: "万能句：Trucker Path 产品理解",
    type: "phrase",
    items: [
      { text: "Trucker Path is not just a navigation app. It is a workflow and community platform for North American truck drivers." },
      { text: "The key value is helping drivers make better decisions before and during a trip." },
      { text: "For truck drivers, outdated information is not just inconvenient. It can affect time, cost, safety, and income." },
      { text: "I would be very interested in understanding how the product encourages drivers to contribute real-time updates and how the team verifies user-generated information." },
    ],
  },
  {
    title: "产品常见词",
    type: "vocabulary",
    items: [
      { term: "user journey", translation: "用户旅程" },
      { term: "pain point", translation: "痛点" },
      { term: "use case", translation: "使用场景" },
      { term: "requirement", translation: "需求" },
      { term: "PRD", translation: "产品需求文档" },
      { term: "prototype", translation: "原型" },
      { term: "roadmap", translation: "路线图" },
      { term: "prioritization", translation: "优先级" },
      { term: "iteration", translation: "迭代" },
      { term: "launch", translation: "上线" },
      { term: "retention", translation: "留存" },
      { term: "activation", translation: "激活" },
      { term: "engagement", translation: "活跃 / 参与度" },
      { term: "conversion", translation: "转化" },
      { term: "feedback loop", translation: "反馈闭环" },
      { term: "product-market fit", translation: "产品市场匹配" },
      { term: "onboarding", translation: "新用户引导" },
      { term: "user research", translation: "用户调研" },
      { term: "competitive analysis", translation: "竞品分析" },
      { term: "product requirement", translation: "产品需求" },
    ],
  },
  {
    title: "社区 / UGC 常见词",
    type: "vocabulary",
    items: [
      { term: "UGC / user-generated content", translation: "用户生成内容" },
      { term: "contribution", translation: "用户贡献" },
      { term: "community engagement", translation: "社区参与" },
      { term: "data freshness", translation: "数据新鲜度" },
      { term: "trust and safety", translation: "信任与安全" },
      { term: "verification", translation: "验证" },
      { term: "moderation", translation: "审核 / 治理" },
      { term: "reputation system", translation: "声誉体系" },
      { term: "incentive mechanism", translation: "激励机制" },
      { term: "network effect", translation: "网络效应" },
      { term: "content quality", translation: "内容质量" },
      { term: "real-time update", translation: "实时更新" },
      { term: "crowdsourced data", translation: "众包数据" },
    ],
  },
  {
    title: "卡车 / 货运 / 导航常见词",
    type: "vocabulary",
    items: [
      { term: "truck driver", translation: "卡车司机" },
      { term: "owner-operator", translation: "独立车主司机" },
      { term: "fleet", translation: "车队" },
      { term: "carrier", translation: "承运方" },
      { term: "broker", translation: "货运经纪" },
      { term: "shipper", translation: "发货方" },
      { term: "dispatcher", translation: "调度员" },
      { term: "freight", translation: "货运 / 货物" },
      { term: "load board", translation: "货源板" },
      { term: "truck-safe navigation", translation: "卡车安全导航" },
      { term: "route planning", translation: "路线规划" },
      { term: "parking availability", translation: "停车可用性" },
      { term: "weigh station", translation: "称重站" },
      { term: "fuel stop", translation: "加油站" },
      { term: "rest area", translation: "休息区" },
      { term: "truck stop", translation: "卡车停靠站" },
      { term: "POI / point of interest", translation: "兴趣点 / 地图点位" },
      { term: "low clearance", translation: "低桥 / 限高" },
      { term: "weight restriction", translation: "重量限制" },
      { term: "ETA / estimated time of arrival", translation: "预计到达时间" },
    ],
  },
  {
    title: "紧张时的缓冲句",
    type: "phrase",
    items: [
      { text: "That’s a good question. Let me think for a second." },
      { text: "I would answer this from two perspectives." },
      { text: "Based on my current understanding, I would say..." },
      { text: "I may need to learn more about the specific context, but my initial thought is..." },
      { text: "Could I clarify one thing before I answer?" },
    ],
  },
  {
    title: "收尾句",
    type: "phrase",
    items: [
      { text: "Overall, I believe my strength is bringing structured product thinking into complex real-world scenarios, and I’m excited about the opportunity to apply that to a global product like Trucker Path." },
    ],
  },
];


const REVIEW_FOCUS = [
  { text: "I’m good at turning complex real-world workflows into clear product requirements and actionable delivery plans." },
  { text: "The users are different, but the product thinking is connected." },
  { text: "What I’m really interested in is solving real-world operational problems through product design." },
  { text: "I don’t want to overclaim industry experience, but I’m confident in my ability to learn users and scenarios quickly." },
  { text: "Trucker Path is not just a navigation app. It is a workflow and community platform for North American truck drivers." },
  { text: "The key value is helping drivers make better decisions before and during a trip." },
  { text: "For truck drivers, outdated information is not just inconvenient. It can affect time, cost, safety, and income." },
  { text: "That’s a good question. Let me think for a second." },
  { text: "Based on my current understanding, I would say..." },
  { text: "Overall, I believe my strength is bringing structured product thinking into complex real-world scenarios, and I’m excited about the opportunity to apply that to a global product like Trucker Path." },
];
if (typeof window !== "undefined") {
  window.PHRASE_BANK = PHRASE_BANK;
  window.REVIEW_FOCUS = REVIEW_FOCUS;
}
if (typeof module !== "undefined") module.exports = { PHRASE_BANK, REVIEW_FOCUS };
