(function () {
  const bi = (zh, en) => ({ zh, en });
  const fu = (question, intent, simple, full = "") => ({ question, intent, simple, full });
  const ans = (question, intent, simple, full, notes, followups) => ({
    question,
    intent,
    simple,
    full: full || simple,
    notes: notes || "按结论 -> 真实项目 -> 岗位落点回答；所有数字只用已确认口径。",
    followups: followups || [
      fu("能再压缩成 30 秒吗？", "测试临场抓重点。", "可以。我会先说这个岗位本质是在把星辰智能体能力包装成可买、可交付、可推广的产品方案；我最匹配的是 AI Agent 闭环拆解、B 端标品化和售前交付协同。")
    ],
  });
  const q = (id, framework, category, mode, difficulty, zh, en) => ({
    id,
    framework,
    category: bi(category, category),
    mode,
    difficulty: bi(difficulty, difficulty),
    zh,
    en,
  });

  const INTERVIEW_PREP_DATA = {
    meta: {
      company: "中电信人工智能公司",
      role: "产品解决方案经理",
      round: "岗位准备 · 星辰智能体 / B端AI方案 / 商业化推广",
      defaultLanguage: "zh",
      generatedAt: "2026-07-23",
      coreLine: bi(
        "这个岗位不是只写功能需求，而是把星辰智能体的技术能力转成客户听得懂、渠道卖得动、交付接得住的产品方案。",
        "This role is not only about writing requirements; it is about turning Xingchen Agent capabilities into product solutions customers understand, channels can sell, and delivery teams can implement."
      ),
      boundary: bi(
        "答案基于用户截图、当前简历与面试材料，以及 2026-07-23 可检索公开资料。AI 项目按产品侧方案验证、Demo、POC 和可交付规划表达，不虚构全量上线指标或模型训练职责。",
        "Answers are based on screenshots, the current resume and interview materials, plus public research available on 2026-07-23. AI work is framed as product-side validation, demo, POC, and deliverable planning, without inventing full rollout metrics or model-training ownership."
      ),
    },
    views: [
      { id: "practice", zh: "练习", en: "Practice" },
      { id: "review", zh: "集中复习", en: "Review" },
      { id: "company", zh: "公司背景", en: "Company" },
      { id: "map", zh: "题库地图", en: "Question Map" },
    ],
    modes: [
      { id: "warmup", zh: "快速热身", en: "Warm-up" },
      { id: "role", zh: "岗位匹配", en: "Role Fit" },
      { id: "product", zh: "产品与方案", en: "Product Solution" },
      { id: "ai", zh: "AI Agent深挖", en: "AI Agent" },
      { id: "commercial", zh: "商业化/GTM", en: "Commercialization" },
      { id: "pressure", zh: "压力追问", en: "Pressure" },
      { id: "reverse", zh: "反问准备", en: "Reverse Questions" },
    ],
    questionFrameworks: [
      { id: "opening", zh: "开场与主线", en: "Opening", guide: bi("先把岗位本质说清：技术产品化、方案包装、渠道推广、交付边界。", "Open with the essence: technical productization, solution packaging, channel promotion, and delivery boundaries.") },
      { id: "role", zh: "岗位匹配", en: "Role Fit", guide: bi("围绕 AI/SaaS/B端/政企/商业化，而不是只讲工业数字孪生。", "Anchor in AI, SaaS, B2B, government-enterprise, and commercialization, not only digital twins.") },
      { id: "product", zh: "产品理解", en: "Product Understanding", guide: bi("把星辰智能体理解成企业智能体开发、运营、私有化交付和行业方案平台。", "Understand Xingchen Agent as an enterprise platform for agent development, operations, private deployment, and industry solutions.") },
      { id: "ai", zh: "AI Agent 深挖", en: "AI Agent Deep Dive", guide: bi("复用 Inspector：知识源、RAG、Agent 分工、准确性、人审、bad case、交付边界。", "Reuse Inspector: sources, RAG, agent roles, accuracy, human review, bad cases, and delivery boundaries.") },
      { id: "commercial", zh: "商业化与GTM", en: "Commercialization", guide: bi("重点讲产品包装、定价分层、渠道话术、客户场景转方案。", "Focus on packaging, pricing tiers, channel enablement, and translating scenarios into solutions.") },
      { id: "pressure", zh: "压力追问", en: "Pressure", guide: bi("承认短板但给出补齐路径，始终守住真实项目和事实边界。", "Acknowledge gaps, give a learning path, and keep real-project and fact boundaries.") },
      { id: "reverse", zh: "反问问题", en: "Reverse Questions", guide: bi("问目标、指标、团队边界、行业模板沉淀，不问空泛文化。", "Ask about goals, metrics, team boundaries, and industry-template assets.") },
    ],
    questions: [
      q("self_intro_60", "opening", "开场定位", ["warmup", "role"], "必练",
        ans("请做一个 60 秒自我介绍，重点贴合这个 AI 产品经理岗位。", ["快速建立岗位匹配", "证明 AI Agent 和 B 端方案能力", "不要讲成纯交付或纯技术"],
          `面试官您好，我是李沛宣，目前在 DataMesh 做 B 端产品经理，主要负责数字孪生、设施运维和 AI 产品化方向。

我和这个产品解决方案经理岗位最相关的能力，是把一个复杂 AI 能力从技术概念拆成客户可理解、研发可实现、售前可推广、交付可承接的产品方案。过去在 Inspector 设施运维 Agent 项目里，我不是只做一个 AI 聊天入口，而是把告警、设备台账、空间位置、SOP、历史工单、诊断建议、工单草稿、人工确认和结果回写串起来，并定义每一步的输入、输出、边界和验收方式。

结合中电信人工智能公司的岗位，我理解它要做的不只是功能规划，而是把星辰智能体的能力矩阵包装成不同客户群体能买单的 SaaS 订阅、私有化部署和行业解决方案。我过去做过 0 到 1 产品底座、70% 定制需求标品化、10+ 份售前方案和 POC 交付协同，所以我能比较快地进入产品能力架构、产品包装、定价分层、渠道推广和客户方案输出这条链路。`,
          `面试官您好，我是李沛宣，目前在 DataMesh 做 B 端产品经理，主要负责数字孪生、设施运维和 AI 产品化方向。

如果结合贵司这个产品解决方案经理岗位，我觉得自己最匹配的不是单点功能经验，而是三类能力的组合。

第一是 AI 产品化能力。我在 Inspector 设施运维 Agent 项目里，做的不是一个开放式聊天框，而是把告警到工单的业务闭环拆成告警理解、上下文检索、诊断建议、处置方案、工单草稿、人工确认和结果回写，并定义知识源、输出结构、置信度、人审和 bad case 归类。

第二是 B 端产品包装和标品化能力。我过去需要把大客户项目里的高频诉求沉淀成可复用模块，比如资产台账、3D 沙盘、告警、工单、SOP 模板和实施基线。这个过程和贵司 JD 里提到的产品能力矩阵、SaaS/私有化包装、功能版本和渠道方案非常相似。

第三是商业化协同能力。我不是只在内部写 PRD，也会输出客户方案、演示材料、POC 成功标准和交付边界，协同研发、售前、渠道和客户沟通。这个经验迁移到星辰智能体，就是我能把底层模型和 Agent 平台能力翻译成客户可感知、可理解、可购买、可交付的产品方案。`,
          "开场不要堆所有数字。先讲岗位本质，再用 Inspector Agent + 标品化 + 售前方案证明。",
          [
            fu("你最匹配这个岗位的一点是什么？", "要求一句话定位。", "我最匹配的是把 AI Agent 技术能力转成产品方案和商业化路径：既能拆 Agent/RAG/人机边界，也能做版本包装、定价分层、渠道话术和交付边界。"),
            fu("你不是解决方案经理出身，为什么能做？", "防守 title 差异。", "我现在的工作虽然 title 是 B 端产品经理，但实际长期做产品能力抽象、售前方案、POC 范围、交付基线和跨部门推进，所以不是从零转到解决方案，而是把产品和方案这两边更系统地结合起来。")
          ]),
        ans("Please give a 60-second self-introduction tailored to this AI product role.", ["Establish fit quickly", "Show AI Agent and B2B solution capability", "Avoid sounding only technical"],
          `Hi, I am Jane Li, currently a B2B product manager at DataMesh, focusing on digital twins, facility operations, and AI productization.

My strongest fit for this role is turning complex AI capabilities into product solutions that customers can understand, engineering can implement, sales can promote, and delivery teams can support. In the Inspector facility-operations Agent project, I did not treat AI as a chatbot. I connected alerts, equipment records, spatial context, SOPs, historical work orders, diagnostic suggestions, work-order drafts, human confirmation, and result writeback into one workflow.

For China Telecom AI, I understand this role as packaging Xingchen Agent capabilities into SaaS subscriptions, private deployment solutions, pricing tiers, channel materials, and industry offerings. My experience in AI Agent workflow design, B2B productization, presales materials, and POC delivery makes me a strong fit.`,
          `Hi, I am Jane Li. I am currently a B2B product manager at DataMesh, working on digital twins, facility operations, and AI productization.

For this Product Solution Manager role, I see three relevant strengths. First, I have hands-on product experience breaking down AI Agent workflows. In Inspector, I translated alert handling into a product loop: alert understanding, context retrieval, diagnostic suggestions, action plans, work-order drafts, human confirmation, and result writeback.

Second, I have B2B product packaging experience. I worked on turning customer-specific needs into reusable modules and delivery baselines. Third, I have commercial collaboration experience, including customer solution materials, demo scripts, POC success criteria, and delivery boundaries. These map well to packaging Xingchen Agent capabilities into customer-facing, sellable, and deliverable solutions.`)
      ),
      q("jd_decode", "role", "岗位解读", ["warmup", "role", "product"], "必练",
        ans("你怎么理解这个岗位到底在招什么人？", ["证明读懂 JD", "把职责翻译成人才画像", "建立后续所有答案的标准"],
          `我会把这个岗位理解成一个 AI Agent 产品解决方案经理，而不是传统意义上只写 PRD 的产品经理。

从截图 JD 看，它有五层要求。第一是产品能力架构设计，要能把星辰智能体的能力矩阵拆成不同客户群体可理解的产品方案。第二是产品包装和定价，既要有 SaaS 订阅、功能版本和价格分层，也要能支持私有化部署。第三是推广模式和渠道架构，要面向 C 端个人、B 端企业、团体内部、省专私有化等不同场景设计差异化推广路径。第四是市场洞察和竞品分析，要持续跟 AI 智能体行业动态，把行业趋势转成产品能力和销售话术。第五是客户需求转化，要能把业务场景调研变成产品需求文档、客户方案和演示材料。

所以它要招的人不是纯技术 PM，也不是纯售前，而是中间那类人：懂 AI Agent 产品机制，懂 B 端客户和政企采购，能把复杂能力包装成可卖的方案，还能和研发、销售、渠道、运营一起把结果推下去。`,
          `我理解这个岗位有三个关键词：能力产品化、方案商业化、推广规模化。

能力产品化，是把星辰大模型、星辰智能体、知识库、工作流编排、工具调用、团队空间、用量统计、全链路追踪这些能力，拆成客户听得懂的功能版本和场景包。方案商业化，是把不同客户的使用方式区分清楚：SaaS 订阅适合低门槛试用和快速开通；私有化部署适合政企客户的数据安全、权限和审计要求；行业方案适合政务、工业、教育、交通等有明确场景的客户。推广规模化，是让渠道和前端销售不需要每次重新讲技术，而是有标准产品包、价值话术、演示材料、竞品对比和客户案例。

所以这个岗位真正要招的，是能在产品、解决方案、GTM 和交付之间搭桥的人。`,
          "这题是全页面底层判断：岗位类型属于 AI Agent / B 端 AI / 政企 SaaS 与私有化方案。",
          [
            fu("为什么不是普通 B 端产品经理？", "区分岗位特殊性。", "因为 JD 里明确有产品包装、定价、推广模式、渠道架构和客户方案输出，说明它要求产品经理对商业化和前台协同负责，而不只是内部需求管理。"),
            fu("为什么你能胜任政企方向？", "补政企客户理解。", "我过去做过头部通信运营商、海外标杆客户和大客售前交付，理解 B 端采购里方案可信、数据前置、交付边界和客户决策链的重要性。政企细分规则我需要入职后补，但方法是相通的。")
          ]),
        ans("How do you understand what kind of person this role is hiring?", ["Show JD understanding", "Translate responsibilities into profile", "Set the answer standard"],
          `I see this as an AI Agent product-solution role, not a pure PRD-writing PM role. The JD signals five needs: product capability architecture, product packaging and pricing, SaaS and private deployment, channel and promotion models, market and competitor analysis, and customer-scenario translation.

So the company needs someone who understands AI Agent mechanisms, B2B and government-enterprise customers, solution packaging, and cross-functional execution with engineering, sales, channel, and delivery teams.`,
          `I would summarize this role as capability productization, solution commercialization, and scalable go-to-market. It needs someone who can turn Xingchen Agent's platform capabilities into product editions, pricing tiers, industry packages, demo materials, and delivery boundaries. That is why my AI Agent workflow design and B2B solution experience are relevant.`)
      ),
      q("why_ctai", "role", "投递动机", ["warmup", "role", "pressure"], "必练",
        ans("为什么投中电信人工智能公司这个岗位？", ["说明不是随机投递", "连接公司产品与个人经历", "体现国央企 AI 平台机会"],
          `我投这个岗位主要有三个原因。

第一，贵司的 AI 方向不是停留在通用问答，而是在星辰大模型、星辰智能体平台、TeleAgent、星辰慧记、数字人和行业解决方案之间形成了比较完整的产品矩阵。公开资料里也能看到，星辰智能体平台正在从开发编排扩展到测试评估、运行托管、运维治理和闭环迭代，这和我对 AI 产品落地的理解很一致。

第二，这个岗位的职责非常贴合我现阶段想放大的能力。我过去做的是把设施运维 Agent 从概念拆成告警到工单的闭环，现在这个岗位要做的是把星辰智能体的产品能力拆成面向客户、渠道和交付的方案。底层方法相似，只是对象从一个行业产品扩大到一个 AI 平台和多行业方案。

第三，我对国央企 AI 平台的机会比较感兴趣。政企客户不会只买一个好玩的 AI 功能，他们更关心安全可控、私有化部署、权限、审计、数据治理、行业模板和可持续运营。这个方向正好需要既懂 AI 产品机制、又懂 B 端交付边界的人。`,
          "",
          "不要只说看好中国电信品牌。重点说星辰智能体平台、政企安全可控、SaaS/私有化双路径。",
          [
            fu("你为什么不继续做数字孪生？", "解释职业迁移。", "我不是放弃数字孪生，而是希望把过去在复杂 B 端场景里做 AI 闭环、标品化和商业化协同的方法，迁移到更大的 AI Agent 平台上。"),
            fu("你对国央企节奏适应吗？", "防守组织风格。", "我过去服务的客户里有头部运营商和大型企业，已经习惯多角色决策、方案严谨、边界清晰和长期交付。我的优势不是只追快，而是能在约束下把产品方案做可控。")
          ]),
        ans("Why are you interested in China Telecom AI and this role?", ["Targeted motivation", "Connect product matrix to experience", "Show platform opportunity"],
          `I am interested for three reasons. First, China Telecom AI is building a full AI product matrix around Xingchen models, agent platforms, TeleAgent, meeting and writing tools, digital humans, and industry solutions. Second, the role matches my experience in turning AI capabilities into B2B product solutions. Third, government-enterprise AI requires security, private deployment, permissions, auditability, industry templates, and operational governance. That is exactly where AI product and solution thinking must work together.`,
          `I am not looking for a generic AI label. I am interested in the specific challenge of turning Xingchen Agent capabilities into customer-facing SaaS editions, private deployment solutions, pricing tiers, channel materials, and industry packages. My Inspector Agent experience gives me a concrete method for this transition.`)
      ),
      q("product_understanding", "product", "产品定位", ["product", "role", "commercial"], "必练",
        ans("你怎么理解星辰智能体平台和这个岗位对应的产品定位？", ["考产品理解", "区分平台、应用、方案", "讲清能卖什么"],
          `我会把星辰智能体平台理解成企业智能体的创建、运行和运营底座。它不是单一聊天助手，而是让企业低代码或零代码创建智能体，把知识库、数据库、工具、API、工作流、团队空间、用量统计和全链路追踪组合起来，形成能在业务里运行的 AI 应用。

对应到这个岗位，我觉得产品定位要分三层讲。

第一层是平台能力：模型接入、智能体创建、RAG 知识库、工作流编排、工具调用、评测、发布、监控和权限。第二层是场景产品：比如办公助手、政务材料审核、客服客户画像、知识问答、数据分析、报告生成、巡检辅助等。第三层是行业解决方案：面向政务、交通、工业、教育、政法公安等行业，把平台能力和客户业务流程结合，形成可销售、可交付的方案包。

所以这个岗位要做的不是把星辰智能体讲成一个技术平台，而是把它讲成客户能买的结果：更快创建 AI 应用、更安全地纳管企业知识、更低门槛完成业务流程自动化，并且有 SaaS 和私有化两种交付路径。`,
          "",
          "回答时要把“技术能力 -> 产品包 -> 行业方案 -> 交付边界”串起来。",
          [
            fu("SaaS 和私有化你会怎么区分？", "考商业包装。", "SaaS 适合低门槛试用、快速开通、标准模板和资源点计费；私有化适合政企客户的数据安全、内网部署、权限审计、系统对接和专属行业知识库。两者功能可以同源，但包装、定价和交付前置条件不同。"),
            fu("它和普通大模型开放平台有什么区别？", "考定位差异。", "开放平台更偏模型和 API 能力调用，智能体平台更偏把模型、知识库、工具、工作流和运营管理组合成可运行的业务应用，价值从“能调用模型”变成“能完成业务任务”。")
          ]),
        ans("How do you understand Xingchen Agent Platform and the product positioning behind this role?", ["Product understanding", "Separate platform, apps, and solutions", "Clarify what can be sold"],
          `I understand Xingchen Agent Platform as an enterprise agent creation, runtime, and operations platform. It combines models, RAG knowledge bases, databases, tools, APIs, workflows, team spaces, usage statistics, tracing, and permissions into deployable AI applications.

For this role, the positioning has three layers: platform capabilities, scenario products, and industry solutions. The job is to translate technical capabilities into sellable outcomes: faster AI application creation, safer enterprise knowledge governance, lower-cost workflow automation, and both SaaS and private deployment options.`,
          `The key is not to describe it only as a technical platform. It should be packaged into product editions, scenario templates, industry solution kits, demo stories, pricing, and delivery requirements.`)
      ),
      q("inspector_agent_story", "ai", "核心项目故事", ["ai", "product", "role", "pressure"], "必练",
        ans("讲一个你做 AI Agent 或 AI 产品化最有代表性的项目。", ["主故事", "证明真实参与", "迁移到星辰智能体"],
          `我最适合讲 Inspector 设施运维 Agent。

背景是客户现场不是没有系统，而是系统很多但信息分散。告警系统知道异常，设备台账知道是哪台设备，空间系统知道它在哪个区域，知识库里有 SOP，历史工单里有以前怎么修过。但一线人员处理告警时，还是要自己翻资料、问资深工程师，再判断要不要派工。

我的任务不是做一个独立聊天框，而是把 AI 放进告警到工单的主流程，形成可验证、可解释、可回写的闭环。我具体做了四件事：第一，拆业务流，把链路定义成告警理解、上下文补全、知识检索、诊断建议、处置方案、工单草稿、人工确认和结果回写。第二，拆业务对象，包括设备、空间、告警、SOP、历史工单、知识源、工单字段和状态。第三，定义 AI 输出结构，包括可能原因、依据、置信度、缺失信息和建议检查项。第四，和研发对齐字段、接口、异常路径和场景验收脚本。

最后结果我会谨慎表达：AI 部分是产品侧方案验证、Demo/POC 和可交付规划，不包装成大规模全量上线。但它证明我能把一个很虚的“大模型诊断”拆成研发能做、测试能验、客户能理解、现场人员敢用的产品闭环。迁移到星辰智能体，就是我能把 Agent 能力从技术模块拆到场景模板、输出协议、人审边界和交付前置条件。`,
          `面试官您好，我具体讲一个真实项目：Inspector 设施运维 Agent。

背景是，设施运维客户现场其实有很多系统。告警系统会告诉你设备异常，资产台账能告诉你设备型号和位置，SOP 在文档库里，历史工单里有过往处理经验，3D 场景能告诉你设备在哪个空间。但问题是，这些信息没有在告警处置时自动形成上下文。一线人员看到一个告警，还是要自己判断影响范围、查标准流程、问资深工程师，再决定是否派工。

所以当时真正的问题不是“要不要接大模型”，而是“怎么让 AI 进入一个可追责的运维闭环”。我的任务也不是写一个聊天框需求，而是把告警到工单的链路拆成产品可实现的流程。

我具体做了几件事。第一，我拆知识源：实时告警、传感器和设备状态用于判断现在发生了什么；设备台账和空间位置用于确认对象是谁、在哪里；SOP 和厂商手册作为标准依据；历史工单只能作为类似经验参考。第二，我拆 Agent 职责：告警理解负责把原始告警结构化，RAG 负责找 SOP、历史工单和设备资料，诊断 Agent 输出可能原因、依据和置信度，方案生成 Agent 给建议检查项，工单 Agent 只生成草稿，不自动派发。第三，我定义输出结构：可能原因、判断依据、置信度、缺失信息、建议动作和人工确认标记。第四，我和研发、测试对齐验收脚本，比如一个 B3 层空调机组温度异常告警，应该召回哪类 SOP、哪些历史工单，不能召回哪些跨楼层或跨设备资料。

这个项目没有被我包装成模型训练或全量线上指标。我会诚实说，它处在产品方案验证、Demo/POC 和可交付规划阶段。但它的价值是把 AI 能力拆成了可评审、可演示、可验收、可复用的业务闭环。`,
          "这是主故事。岗位落点必须从运维 Agent 收到星辰智能体平台：行业模板、知识源治理、评测、人审、交付边界。",
          [
            fu("你个人到底做了什么？", "防团队成果模糊。", "我个人核心是产品侧拆解：流程、对象、Agent 职责、输入输出、知识源优先级、人审边界、验收脚本和 bad case 分类。"),
            fu("AI 有真实上线指标吗？", "守住事实边界。", "我会诚实说 AI 能力是方案验证、Demo/POC 和可交付规划，不包装成全量线上效果；但产品经理在这个阶段的价值，就是把它变成研发能实现、测试能验、客户能理解的闭环。"),
            fu("这个项目怎么迁移到星辰智能体？", "拉回 JD。", "星辰智能体面对的是更多行业场景，方法仍然相同：先拆业务任务和知识源，再拆 Agent 工作流、输出结构、评测口径、人审边界和交付前置条件，最后沉淀为行业模板和方案包。")
          ]),
        ans("Tell me about your most representative AI Agent or AI productization project.", ["Main story", "Personal contribution", "Transfer to Xingchen Agent"],
          `My most relevant project is the Inspector facility-operations Agent. The problem was not lack of systems, but scattered context. Alerts, equipment records, spatial context, SOPs, and historical work orders existed in different places. Operators still had to manually judge the cause, risk, and next action.

My task was not to build a chatbot. I broke the alert-to-work-order loop into alert understanding, context enrichment, knowledge retrieval, diagnostic suggestions, action planning, work-order drafts, human confirmation, and result writeback. I also defined knowledge-source priority, output structure, confidence, missing information, human review, and acceptance scripts.

I would frame the result carefully: it was product-side validation, demo/POC, and deliverable planning, not full production metrics. But it proves I can turn vague AI capability into a reviewable, testable, and customer-understandable workflow.`,
          `The transfer to Xingchen Agent is direct: for each industry scenario, I would define the business task, knowledge sources, agent workflow, output protocol, evaluation criteria, human review, bad-case taxonomy, and delivery prerequisites.`)
      ),
      q("rag_accuracy", "ai", "RAG与准确性", ["ai", "pressure", "product"], "高频",
        ans("RAG 怎么设计？你怎么判断召回和 AI 回复是准确的？", ["复用答案库核心", "讲清验收口径", "体现产品经理能和研发对齐"],
          `我不会把 RAG 理解成上传一堆文档让模型回答，而是把它当成业务任务里的上下文检索层。

在 Inspector 里，我先把知识源分成四类：设备台账负责说明对象是谁，空间和关系数据负责说明它在哪里、上下游是什么，SOP 和厂商手册是标准处理依据，历史工单是类似经验参考。判断召回正确，我不会只看语义相似度，而是看它有没有命中当前告警真正需要的证据。比如 B3 层空调机组温度异常，正确召回应包括当前设备资料、HVAC 温度异常 SOP、同类型设备或同区域历史工单；如果只召回了普通空调保养 SOP，或者召回了别的楼层设备，我会认为不合格。

AI 回复准确我分两层看。第一是 grounded，有没有基于召回材料回答。第二是 cautious，不确定时有没有说明边界。比如缺少阀门开度和管路压力时，它不能说“就是阀门坏了”，而应该说“中置信，建议先检查阀门开度、过滤器和管路压力”。

迁移到星辰智能体，我会把这个标准转成平台和方案材料里的评测口径：召回命中正确知识源、回答标注依据、输出缺失信息、低置信不下确定结论、高风险任务必须人工确认。`,
          `我具体会分三步回答。

第一，先拆知识源。事实类数据、标准依据类资料和经验类资料不能混在一起。事实类比如设备台账、客户系统数据、数据库记录；标准依据比如 SOP、政策、规则、产品手册；经验参考比如历史工单、过往问答、客户案例。不同来源在 AI 输出里的权重和表达方式不一样。

第二，拆召回正确。不是 Top5 里有相似词就算对，而是要看是否命中正确业务对象、正确任务类型、正确知识源和有效证据。错对象、错场景、错版本、错权限的召回都不能当依据。

第三，拆生成准确。AI 必须基于材料回答，不能乱引用；不确定时要说缺什么信息；高风险结果要给人工确认标记；输出最好结构化成结论、依据、置信度、缺失信息、建议动作。

这套口径用于中电信智能体平台时，可以直接变成产品评测和客户方案里的可信能力：平台不仅能搭 Agent，还能解释 Agent 为什么这么答、哪里不确定、什么时候需要人审。`,
          "这是 AI 深挖必练题。不要说“提升准确率”，要说召回、生成、边界和验收。",
          [
            fu("如果 SOP 和历史工单冲突怎么办？", "考知识源优先级。", "我会让标准 SOP 优先于历史经验。历史工单只能提示类似处理路径，不能覆盖标准流程；如果冲突，AI 应该标明冲突并要求人工确认。"),
            fu("如果客户知识库质量很差怎么办？", "考交付边界。", "我会把知识库治理列为 POC 前置条件，先做资料盘点、版本清理、元数据标签和样例问题集；否则不能承诺交付级准确性，只能先做 Demo 或小范围验证。"),
            fu("怎么和研发协作调优？", "考产品技术协同。", "我会按知识缺失、切片问题、标签问题、检索问题、生成问题分类 bad case，给研发可复现样例、期望召回、禁止召回和期望输出结构。")
          ]),
        ans("How would you design RAG and judge retrieval and answer accuracy?", ["Reusable AI deep dive", "Acceptance criteria", "PM-engineering collaboration"],
          `I do not see RAG as simply uploading documents for a model to answer. I see it as the context-retrieval layer for a business task. First, knowledge sources must be separated into facts, standard references, and historical experience. Second, retrieval accuracy means hitting the right business object, task type, source, version, and evidence, not just semantic similarity. Third, generation accuracy means the answer is grounded, cautious, structured, and clear about missing information and human review.`,
          `For Xingchen Agent, I would translate this into evaluation criteria and customer-facing trust messaging: correct source retrieval, evidence-based answers, missing information, low-confidence fallback, and human confirmation for risky tasks.`)
      ),
      q("bad_case_tuning", "ai", "Bad case调优", ["ai", "pressure", "product"], "高频",
        ans("如果客户说智能体回答不稳定、不可信，你会怎么排查？", ["考调优方法", "证明不是泛泛说模型不准", "连接平台评测和运营"],
          `我不会先把问题归因成模型不够好，而会把 bad case 分层。

第一类是知识缺失：知识库里没有对应规则、SOP 或业务资料，那就先补资料，并明确 MVP 必需知识范围。第二类是切片问题：SOP 被切得太碎，召回了步骤但丢了适用条件，那就调整 chunk、标题层级和上下文窗口。第三类是标签问题：缺少客户、行业、设备类型、空间、告警类型或版本标签，导致跨场景误召回，那就补 metadata 和过滤条件。第四类是检索问题：Top3/Top5 没有正确材料，需要调召回权重、重排或工具调用策略。第五类是生成问题：材料召回对了，但模型表达太确定、乱引用或没有下一步动作，那就收紧输出 Schema、prompt 和兜底规则。

如果放到星辰智能体平台，我会把这些 bad case 不只当成单次修复，而是沉淀成评测集、行业模板、知识库治理规范和客户交付验收表。这样渠道在卖方案时也能讲清楚：平台不是承诺永远不出错，而是有发现问题、定位问题、修复问题和持续运营的机制。`,
          "",
          "重点落到“平台运营能力”：评测、追踪、治理、持续迭代。",
          [
            fu("你怎么定义问题是否收敛？", "考察指标判断。", "我会看同类 bad case 重复率、正确召回率、人工修改量、结果采纳率、二次追问率、客户验收样例通过率，而不是只看一次演示效果。"),
            fu("客户只说不好用，不给细节怎么办？", "考需求澄清。", "我会反向设计任务样例，让客户提供 10 到 20 个真实问题、期望答案和业务资料，再把反馈拆到知识源、检索、生成、权限、交互和预期管理。"),
            fu("销售已经承诺效果怎么办？", "考协作边界。", "我会先把当前能力边界和风险讲清，再给替代方案：缩小 POC 场景、限定知识源范围、增加人工确认，避免把不可控承诺带到交付。")
          ]),
        ans("If a customer says the agent is unstable and untrustworthy, how would you diagnose it?", ["Tuning method", "Avoid vague model blaming", "Connect to platform operations"],
          `I would not simply blame the model. I would classify bad cases into knowledge gaps, chunking issues, metadata issues, retrieval issues, and generation issues. Each type maps to a different product and engineering action: add documents, adjust chunks, improve metadata filters, tune retrieval and reranking, or tighten output schema and fallback rules.

For Xingchen Agent, I would turn these bad cases into evaluation sets, industry templates, knowledge-base governance rules, and customer acceptance sheets.`,
          `The message to customers should be realistic: the platform does not promise zero errors; it provides mechanisms to detect, locate, fix, and continuously operate AI agent quality.`)
      ),
      q("packaging_pricing", "commercial", "产品包装与定价", ["commercial", "product", "role"], "必练",
        ans("如果让你设计星辰智能体的产品包装和定价分层，你会怎么做？", ["贴 JD 定价包装", "体现商业化思维", "避免拍脑袋报价"],
          `我会先按客户成熟度和部署诉求分层，而不是直接按功能堆套餐。

第一层是个人或小团队 SaaS 试用包，目标是低门槛体验，适合知识问答、会议纪要、文档总结、个人办公助手这类标准场景。包装重点是模板、资源点、调用额度、基础知识库和简单工作流。

第二层是企业团队版，目标是部门级复用，适合客服、销售、运营、知识管理、项目协作。包装重点是团队空间、权限、用量统计、流程模板、工具/API 接入和基础评测。

第三层是行业解决方案版，面向政务、工业、交通、教育等客户，重点不是多给几个功能，而是给行业模板、私有知识库治理、业务系统对接、验收样例、交付服务和安全合规材料。

第四层是私有化部署或省专版本，重点是内网部署、数据不出域、权限审计、模型和知识库治理、运维监控、定制集成和专属服务。

定价上我不会拍一个数字，而会拆成平台订阅、资源消耗、行业模板包、私有化部署服务、二次集成和持续运营几部分。这样销售能按客户预算组合，交付也知道边界在哪里。`,
          "",
          "可以主动说明：具体价格要看公司现有定价策略，这里讲产品经理拆分方法。",
          [
            fu("功能版本怎么避免太复杂？", "考产品包装取舍。", "我会让套餐差异围绕客户决策点，而不是围绕内部功能树。比如个人看低门槛，企业看权限和协作，行业客户看模板和验收，私有化客户看安全和运维。"),
            fu("渠道怎么卖得动？", "考渠道架构。", "要给渠道标准话术：客户痛点、适用行业、演示脚本、竞品差异、部署条件、价格组成、常见异议和成功案例，避免渠道只会说大模型很强。"),
            fu("私有化交付怎么控边界？", "考交付风险。", "要把数据源、系统接口、权限、知识库治理、硬件资源、评测样例、验收标准和运维责任写进方案前置条件，不能只承诺一个 AI 效果。")
          ]),
        ans("How would you design product packaging and pricing tiers for Xingchen Agent?", ["Match packaging and pricing duties", "Show commercial thinking", "Avoid guessing prices"],
          `I would segment by customer maturity and deployment needs. A personal or small-team SaaS plan focuses on low-friction trials and standard templates. An enterprise team plan focuses on team spaces, permissions, usage statistics, APIs, workflows, and evaluation. An industry solution plan focuses on templates, private knowledge governance, system integration, acceptance samples, and delivery services. A private deployment plan focuses on data security, audit, on-premise deployment, monitoring, and custom integration.

Pricing should be decomposed into platform subscription, resource consumption, industry template packages, private deployment service, custom integration, and ongoing operations.`,
          `The principle is to make the tiers map to customer buying decisions, not the internal feature tree.`)
      ),
      q("customer_solution", "commercial", "客户方案输出", ["commercial", "role", "pressure"], "高频",
        ans("如果客户说想做一个政企智能体方案，你会怎么从需求到方案？", ["考客户需求转化", "贴政企/行业方案", "体现交付边界"],
          `我会按六步走。

第一，先明确业务场景，不会一上来就问要什么模型。比如是政务材料审核、政策问答、热线辅助、知识库检索、跨系统办事，还是内部办公提效。第二，拆用户和决策链：一线使用者、业务负责人、信息化部门、安全合规、采购和领导层分别关心什么。第三，盘点数据和系统：已有文档、数据库、业务系统、权限体系、接口、数据更新频率和敏感等级。第四，设计最小闭环：用户输入什么，智能体查什么知识、调什么工具、输出什么结果，哪些地方要人工确认，结果写回哪里。第五，定义验收：样例问题集、正确召回标准、输出结构、人工修改量、响应时间、失败兜底和安全边界。第六，输出方案材料：产品架构、功能版本、部署方式、实施计划、交付清单、风险和报价组成。

我会特别注意不要把方案写成“我们有大模型，所以都能做”。政企客户真正需要的是能解释、可审计、能交付、出问题有人兜底。`,
          "",
          "这题可复用你的 POC/售前经历，但不要虚构电信客户案例。",
          [
            fu("客户需求很散怎么办？", "考需求抽象。", "我会先用场景优先级收敛：高频、高价值、知识源可用、系统接口可行、风险可控的场景先做 POC，其余放进后续路线图。"),
            fu("客户要一次做很多行业场景怎么办？", "考范围管理。", "我会建议先选一个可验收样板间，跑通知识源、工作流、人审和评测，再复制到其他场景，避免第一阶段变成大而全项目。"),
            fu("方案怎么让领导层听得懂？", "考察高层表达。", "我会从业务结果讲起：降重复咨询、缩短材料审核、减少人工查资料、沉淀组织知识，再讲产品链路和技术能力，而不是先讲模型参数。")
          ]),
        ans("If a government-enterprise customer wants an agent solution, how would you go from requirements to proposal?", ["Customer-scenario translation", "Industry solution", "Delivery boundary"],
          `I would follow six steps: clarify the business scenario, map users and decision makers, audit data and systems, design the minimum task loop, define acceptance criteria, and produce solution materials. The key is not to say the model can do everything. Government-enterprise customers need explainability, auditability, deliverability, and clear fallback responsibilities.`,
          `For POC scope, I would choose scenarios that are high-frequency, high-value, data-ready, integration-feasible, and risk-controllable.`)
      ),
      q("first_90_days_plan", "role", "90天计划", ["role", "product", "commercial"], "高频",
        ans("如果你入职，前 90 天会怎么开展工作？", ["证明上手路径", "把 JD 变成计划", "体现产品和方案两手抓"],
          `我会分三阶段。

前 30 天先建立产品和市场底图。我会深用星辰智能体平台、TeleAgent、星辰慧记等产品，梳理能力矩阵、版本包装、客户群体、现有渠道材料和典型交付流程；同时拆竞品，比如 Coze、Dify、百度/阿里/腾讯的智能体平台，看它们在应用创建、知识库、工作流、评测、发布、私有化和行业模板上的差异。

31 到 60 天，我会选 1 到 2 个重点客户群体或场景做产品包装优化，比如政企知识问答、客服客户画像、办公工作助手或工业质检方案。输出内容包括产品能力矩阵、版本分层、演示脚本、客户方案模板、竞品对比和 POC 验收口径。

61 到 90 天，我会和研发、销售、渠道、运营一起跑小闭环。不是只交一份 PPT，而是看前端销售是否讲得清、客户是否愿意试用、POC 前置条件是否明确、交付是否接得住，再根据反馈调整版本包装、定价结构、行业模板和产品 Roadmap。`,
          "",
          "这题回答要有交付件：能力矩阵、版本分层、演示脚本、方案模板、竞品对比、验收口径。",
          [
            fu("前 30 天你会优先看什么？", "考上手优先级。", "我会先看产品能力矩阵、客户分类、当前销售材料、典型项目复盘和竞品，因为这个岗位不是单纯熟悉功能，而是要知道功能怎么被卖出去和交付下去。"),
            fu("90 天怎么证明你产生价值？", "考结果定义。", "我会用可交付资产证明：一套场景方案包、一套版本包装建议、一套竞品对比、一套 POC 验收模板，以及至少一次和销售/渠道共同验证后的反馈闭环。"),
            fu("如果团队已有材料，你还做什么？", "考协作方式。", "我会先复用已有材料，再补缺口：统一产品能力口径、补客户视角价值、补交付边界、补竞品差异和常见异议，而不是推倒重来。")
          ]),
        ans("If you joined, how would you approach the first 90 days?", ["Onboarding path", "Turn JD into plan", "Balance product and solutions"],
          `I would split it into three stages. In the first 30 days, I would build a product and market map: deeply use Xingchen Agent, TeleAgent, and related products; review capability matrix, editions, customer segments, sales materials, and delivery workflows; and benchmark competitors.

From day 31 to 60, I would choose one or two priority scenarios and produce packaging assets: capability matrix, edition structure, demo script, solution template, competitor comparison, and POC acceptance criteria.

From day 61 to 90, I would validate the assets with engineering, sales, channel, and operations, then iterate based on customer and delivery feedback.`,
          `My goal is not only to make slides, but to make sales explanations clearer, POC boundaries sharper, and product packaging easier to scale.`)
      ),
      q("fit_gap", "pressure", "岗位匹配与短板", ["pressure", "role"], "必练",
        ans("你觉得自己和这个岗位的匹配点与短板是什么？", ["主动管理风险", "不躲短板", "给补齐路径"],
          `匹配点我会说三点。

第一，我懂 AI Agent 产品化，不会把 AI 讲成单纯问答，而会拆知识源、工作流、输出结构、置信度、人审和 bad case。第二，我有 B 端平台化和方案经验，做过 0 到 1 产品底座、70% 定制需求标品化、10+ 份售前方案和 POC 交付协同。第三，我理解客户需求转产品方案的过程，能把复杂场景拆成能力矩阵、版本规划、交付边界和演示材料。

短板也有。我不是从电信 AI 平台内部成长起来的，对星辰产品矩阵、政企渠道打法、省专合作机制和现有定价策略，需要入职后快速补齐。另外我过去更多在工业/设施运维场景，对政务、教育、交通等行业模板需要继续学习。

我的补齐方式会很具体：先深用产品、读现有方案、跟销售和交付复盘典型项目，再选一个场景做方案包小闭环。我的优势是学习不是停留在看资料，而是会很快转成可复用的产品材料和验收标准。`,
          "",
          "短板要承认但可控，不能说自己没有短板。",
          [
            fu("你没有 AI 平台经验怎么办？", "防守经验缺口。", "我没有在通用 AI 平台做过完整岗位，但 Inspector Agent 已经覆盖了 Agent 工作流、RAG、知识源、人审和交付边界。平台层面的产品矩阵和商业包装，我会通过产品深用、竞品分析和内部项目复盘快速补齐。"),
            fu("你没有定价经验怎么办？", "防守商业化缺口。", "我没有独立拍板过最终价格，但我做过产品包装、POC 范围和方案价值表达。定价我会先遵循公司现有策略，再从客户分层、价值差异、资源消耗和交付成本角度提出结构化建议。"),
            fu("你偏产品还是偏方案？", "明确定位。", "我是产品底色更强的解决方案型 PM。优势是不会只做客户定制，也不会只讲技术，而是能把客户需求反推到可复用产品能力。")
          ]),
        ans("What are your fit points and gaps for this role?", ["Manage risk proactively", "Acknowledge gaps", "Give learning path"],
          `My fit has three parts: AI Agent productization, B2B platform and solution experience, and customer-scenario translation. My gaps are also clear: I need to learn Xingchen's full product matrix, government-enterprise channel mechanisms, provincial cooperation models, and current pricing strategy. I would close these gaps by deeply using the products, reviewing existing solution materials, shadowing sales and delivery project reviews, and turning one priority scenario into a reusable solution package.`,
          `I would position myself as a product-led solution PM: strong enough in product abstraction to avoid pure customization, and practical enough in customer communication to make solutions sellable and deliverable.`)
      ),
      q("reverse_questions", "reverse", "反问", ["reverse", "warmup"], "必练",
        ans("最后你准备反问面试官什么？", ["关注真实工作", "围绕成功标准", "避免空泛"],
          `我会优先问四类问题，根据现场时间选两到三个。

第一，关于目标：这个岗位前 90 天最希望解决的问题是什么？是产品能力包装、某个行业方案、渠道材料，还是私有化交付方案？

第二，关于指标：团队现在判断产品解决方案经理做得好，主要看客户线索转化、POC 推进、渠道复用率、方案交付质量，还是产品 Roadmap 贡献？

第三，关于协作边界：这个岗位和研发产品经理、售前、渠道、运营、交付之间怎么分工？产品方案需要定义到功能版本、报价结构和验收口径吗？

第四，关于星辰智能体主线：未来半年更优先做平台通用能力升级，还是沉淀政务、工业、教育、交通等行业模板？`,
          "",
          "反问要贴岗位目标、指标和协作，不问泛泛文化。",
          [
            fu("只能问一个问题怎么办？", "选择最关键问题。", "我会问：这个岗位前 90 天最希望我交付的可见成果是什么？这样能直接对齐岗位成功标准。"),
            fu("如果面试官反问你更想做哪块？", "表达偏好。", "我会说我最想做星辰智能体的行业方案产品化：把客户高频场景沉淀成模板、演示、版本包装和验收标准。"),
            fu("反问时怎么显得不功利？", "语气控制。", "可以说我想确认岗位成功标准和协作边界，这样如果加入团队，可以更快把工作产出对齐到团队最需要的地方。")
          ]),
        ans("What questions would you ask the interviewer at the end?", ["Real work", "Success criteria", "Avoid generic questions"],
          `I would ask about four areas and choose two or three based on time: the first-90-day goal, success metrics for this role, collaboration boundaries with product, sales, channel, operations, and delivery, and whether the next priority is general platform capability or industry-solution templates.`,
          `If I could ask only one question, I would ask: what visible outcome should this role deliver in the first 90 days?`)
      ),
    ],
    reviewFocus: [
      bi("岗位本质：AI Agent 平台能力 -> 产品包装 -> 定价分层 -> 渠道推广 -> 客户方案 -> 交付边界。", "Role essence: AI Agent platform capabilities -> packaging -> pricing tiers -> channel promotion -> customer solutions -> delivery boundaries."),
      bi("主项目只讲 Inspector Agent，但收口到星辰智能体平台：行业模板、RAG、评测、人审、私有化交付。", "Use Inspector Agent as the main story, but close with Xingchen Agent: industry templates, RAG, evaluation, human review, and private deployment."),
      bi("事实边界：AI 部分是方案验证、Demo/POC、可交付规划；不要说训练模型、全量上线、真实准确率提升。", "Fact boundary: AI work is validation, demo/POC, and deliverable planning; do not claim model training, full rollout, or real accuracy uplift."),
      bi("商业化主线：SaaS 低门槛，企业团队版重协作和权限，行业方案重模板和验收，私有化重安全、审计和运维。", "Commercial line: SaaS for low friction, enterprise team edition for collaboration and permissions, industry solutions for templates and acceptance, private deployment for security, audit, and operations."),
      bi("压力题打法：承认不熟电信内部产品矩阵和定价，但用产品深用、竞品分析、销售/交付复盘和方案包小闭环补齐。", "Pressure tactic: acknowledge gaps in internal product matrix and pricing, then close them through product immersion, competitor analysis, sales/delivery reviews, and solution-package validation."),
      bi("反问优先级：前 90 天目标、成功指标、协作边界、星辰智能体行业模板沉淀。", "Reverse-question priorities: first-90-day goal, success metrics, collaboration boundaries, and Xingchen Agent industry-template assets."),
    ],
    phraseBank: [
      { title: bi("开场高频句", "Opening lines"), items: [
        bi("我理解这个岗位是在产品、解决方案和商业化之间搭桥。", "I understand this role as a bridge between product, solutions, and commercialization."),
        bi("我不会把智能体只讲成问答工具，而会讲成可创建、可运行、可评测、可交付的业务应用。", "I would not describe agents only as Q&A tools, but as business applications that can be created, run, evaluated, and delivered."),
        bi("我最擅长的是把复杂能力拆成客户可理解、研发可实现、销售可推广、交付可承接的方案。", "My strength is turning complex capabilities into solutions customers understand, engineers can implement, sales can promote, and delivery teams can support."),
      ] },
      { title: bi("产品判断句", "Product judgment"), items: [
        bi("产品包装不能按内部功能树来拆，要按客户购买决策来拆。", "Packaging should follow customer buying decisions, not the internal feature tree."),
        bi("政企 AI 客户买的不是一个神奇答案，而是安全可控、可审计、可交付和持续运营。", "Government-enterprise AI customers buy security, auditability, deliverability, and ongoing operations, not a magic answer."),
        bi("RAG 的正确不是相似，而是命中正确对象、正确知识源和有效证据。", "RAG correctness is not similarity; it is hitting the right object, source, and evidence."),
      ] },
      { title: bi("面试防守句", "Defensive lines"), items: [
        bi("这部分我会谨慎表达为方案验证、Demo/POC 和可交付规划，不包装成全量线上指标。", "I would carefully frame this as validation, demo/POC, and deliverable planning, not full production metrics."),
        bi("我没有独立拍板过最终价格，但可以从客户分层、资源消耗、交付成本和价值差异提出结构化定价建议。", "I have not independently finalized pricing, but I can structure pricing suggestions by customer segment, resource usage, delivery cost, and value difference."),
        bi("我不是纯售前，也不是纯内部产品经理，我的优势是把客户需求反推到可复用产品能力。", "I am neither pure presales nor a purely internal PM; my strength is translating customer needs back into reusable product capabilities."),
      ] },
    ],
    companyResearch: {
      researchedAt: "2026-07-23",
      factBoundary: bi(
        "公开资料显示，中电信人工智能科技（北京）有限公司运营天翼AI开放平台，产品包括星辰大模型、星辰智能体平台、TeleAgent、星辰慧记、数字人平台等；岗位 JD 来自用户截图，具体团队目标以后续面试官说明为准。",
        "Public sources show China Telecom AI operates Tianyi AI Open Platform, with products such as Xingchen models, Xingchen Agent Platform, TeleAgent, Xingchen Meeting Notes, and digital human products. The JD comes from user screenshots; exact team goals should be confirmed in interviews."
      ),
      sources: [
        { label: "天翼AI开放平台", url: "https://www.teleai.com.cn/", accessedAt: "2026-07-23" },
        { label: "中国电信 · 星辰超级智能体", url: "https://www.chinatelecom.com.cn/ct/news/jtxw/160252.html", accessedAt: "2026-07-23" },
        { label: "中国电信 · 智能体开发平台私有化市场份额", url: "https://www.chinatelecom.com.cn/ct/news/jtxw/167315.html", accessedAt: "2026-07-23" },
        { label: "天翼云文档 · 星辰MaaS智能体平台产品介绍", url: "https://www.ctyun.cn/document/11094224/11094239", accessedAt: "2026-07-23" },
        { label: "用户提供 BOSS 直聘截图；公开平台入口", url: "https://www.zhipin.com/", accessedAt: "2026-07-23" },
      ],
      cards: [
        { title: bi("公司一句话", "Company in one line"), body: bi("中电信人工智能公司可以理解为中国电信 AI 能力的专业化平台公司，围绕星辰大模型、智能体平台、语音、多模态和行业解决方案，把 AI 能力提供给政企客户、开发者和行业场景。", "China Telecom AI can be understood as the specialized AI platform company of China Telecom, building Xingchen models, agent platforms, voice, multimodal, and industry solutions for government-enterprise customers, developers, and industry scenarios."), interviewUse: bi("面试里不要只说中国电信品牌大，要说它在把全栈 AI 能力平台化、产品化、行业化。", "Do not only mention China Telecom's brand; say it is platformizing, productizing, and industry-packaging full-stack AI capabilities.") },
        { title: bi("星辰智能体平台", "Xingchen Agent Platform"), body: bi("公开文档显示，星辰MaaS智能体平台提供智能体创建、工作流编排、RAG 引擎、知识库管理、模型管理、团队管理、评测、API 服务化等能力，适合被包装成 SaaS、企业团队版、行业方案和私有化部署。", "Public documentation shows Xingchen MaaS Agent Platform provides agent creation, workflow orchestration, RAG, knowledge-base management, model management, team management, evaluation, and API service capabilities, suitable for SaaS, enterprise, industry solution, and private deployment packaging."), interviewUse: bi("把岗位理解为“平台能力 -> 产品包 -> 行业方案”的转换器。", "Understand the role as a converter from platform capabilities to product packages and industry solutions.") },
        { title: bi("超级智能体 TeleAgent", "TeleAgent"), body: bi("公开资料强调星辰超级智能体从简单问答走向复杂任务执行，关注自主规划、多模态感知、跨系统操作、任务协同和安全可控。", "Public sources emphasize TeleAgent moving from simple Q&A toward complex task execution, autonomous planning, multimodal perception, cross-system operation, task collaboration, and security control."), interviewUse: bi("可以迁移 Inspector 口径：Agent 不是聊天框，而是任务拆解、工具调用、执行状态、结果确认和人审边界。", "Transfer the Inspector framing: an agent is not a chat box; it is task decomposition, tool use, execution state, result confirmation, and human-review boundaries.") },
        { title: bi("JD 能力信号", "JD signals"), body: bi("截图 JD 强调产品能力矩阵设计、SaaS/私有化包装、版本和定价、推广模式、渠道架构、竞品分析、客户需求转方案、文档与演示材料、政企市场理解。", "The screenshot JD emphasizes product capability matrix design, SaaS/private deployment packaging, editions and pricing, promotion model, channel architecture, competitor analysis, customer-scenario solutions, documents and demo materials, and government-enterprise market understanding."), interviewUse: bi("回答每题尽量落到产品包装、商业化、渠道、交付边界，而不是只讲 AI 技术。", "Anchor answers in packaging, commercialization, channels, and delivery boundaries, not only AI technology.") },
        { title: bi("匹配画像", "Fit profile"), body: bi("强匹配：AI Agent 闭环、RAG/人审/评测、B端标品化、售前方案、POC 边界、跨研发销售交付协同。需补齐：星辰产品矩阵、政企渠道、省专合作、公司现有定价策略。", "Strong fit: AI Agent loops, RAG/human review/evaluation, B2B productization, solution materials, POC boundaries, and engineering-sales-delivery collaboration. Gaps: Xingchen product matrix, government-enterprise channels, provincial cooperation, and existing pricing strategy."), interviewUse: bi("压力题按“承认差距 -> 方法迁移 -> 30/60/90 天补齐”回答。", "For pressure questions, use acknowledge gap -> transferable method -> 30/60/90-day plan.") },
        { title: bi("首轮打法", "First-round playbook"), body: bi("建议所有回答收束到四个钩子：星辰智能体产品化、Inspector Agent 真实项目、SaaS/私有化双包装、行业方案可交付。", "Anchor all answers in four hooks: Xingchen Agent productization, the Inspector Agent real project, SaaS/private deployment packaging, and deliverable industry solutions."), interviewUse: bi("开放题先讲岗位本质，再选一个项目证据，最后落到贵司场景。", "For open questions, start with role essence, use one project proof, and close with the company's scenario.") },
      ],
    },
  };

  if (typeof window !== "undefined") window.INTERVIEW_PREP_DATA = INTERVIEW_PREP_DATA;
  if (typeof module !== "undefined") module.exports = { INTERVIEW_PREP_DATA };
})();
