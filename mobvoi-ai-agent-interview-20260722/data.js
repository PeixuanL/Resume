(function () {
  const bi = (zh, en) => ({ zh, en });
  const fu = (question, intent, simple, full = "") => ({ question, intent, simple, full });
  const ans = (question, intent, simple, full, notes, followups) => ({ question, intent, simple, full: full || simple, notes: notes || "按结论 -> 证据 -> 岗位落点回答。", followups: followups || [{ question: "能更短吗？", intent: "测试压缩表达。", simple: "可以。我会先给一句结论，再用一个真实项目证明，最后落到这个岗位需要的 Agent 任务闭环能力。", full: "" }] });
  const q = (id, framework, category, mode, difficulty, zh, en) => ({ id, framework, category: bi(category, category), mode, difficulty: bi(difficulty, difficulty), zh, en });

  const INTERVIEW_PREP_DATA = {
    meta: {
      company: "出门问问 / Mobvoi",
      role: "海外产品经理（AI Agent方向）",
      round: "岗位准备 · 海外 Agent 工具与协作产品体验",
      defaultLanguage: "zh",
      generatedAt: "2026-07-22",
      coreLine: bi(
        "我最贴合的是把 AI Agent 从一个概念拆成真实任务闭环：上下文、工具调用、执行状态、结果确认、协作交付和持续迭代。",
        "My strongest fit is turning AI Agents from a concept into real task loops: context, tool use, execution state, result confirmation, collaboration, and iteration."
      ),
      boundary: bi(
        "答案基于当前简历、既有面试材料、JD 截图，以及 2026-07-22 可检索公开资料。AI 经历按产品侧方案验证 / Demo / POC / 可交付规划表达，不包装成模型训练或全量线上效果。",
        "Answers are based on the current resume, previous prep notes, JD screenshots, and public research available on 2026-07-22. AI experience is framed as product-side validation / demo / POC / deliverable planning, not model training or full production metrics."
      )
    },
    views: [
      { id: "practice", zh: "练习", en: "Practice" },
      { id: "review", zh: "集中复习", en: "Review" },
      { id: "company", zh: "公司背景", en: "Company" },
      { id: "map", zh: "题库地图", en: "Question Map" }
    ],
    modes: [
      { id: "warmup", zh: "快速热身", en: "Warm-up" },
      { id: "behavioral", zh: "行为面试", en: "Behavioral" },
      { id: "role", zh: "岗位匹配", en: "Role Fit" },
      { id: "product", zh: "产品理解", en: "Product Sense" },
      { id: "ai", zh: "AI Agent专项", en: "AI Agent" },
      { id: "overseas", zh: "海外与英文", en: "Overseas" },
      { id: "pressure", zh: "压力追问", en: "Pressure" },
      { id: "reverse", zh: "反问准备", en: "Reverse Questions" }
    ],
    questionFrameworks: [
      { id: "behavioral", zh: "行为与开场", en: "Behavioral and opening", guide: bi("用一个主故事反复打多题：Inspector Agent 闭环。", "Reuse one main story: the Inspector Agent loop.") },
      { id: "role", zh: "岗位匹配", en: "Role fit", guide: bi("把 JD 翻译成 Agent 产品规划、体验优化、竞品敏感、英文表达、跨团队推进。", "Translate the JD into Agent planning, UX optimization, competitor sense, English writing, and execution.") },
      { id: "product", zh: "产品理解", en: "Product understanding", guide: bi("把出门问问理解成 AIGC + AI CoPilot 公司，不只做硬件。", "Understand Mobvoi as an AIGC and AI CoPilot company, not only hardware.") },
      { id: "ai", zh: "AI Agent 专项", en: "AI Agent deep dive", guide: bi("重点讲上下文、工具调用、执行状态、结果确认、兜底和反馈。", "Focus on context, tool use, execution state, confirmation, fallback, and feedback.") },
      { id: "overseas", zh: "海外产品与英文", en: "Overseas product and English", guide: bi("把英文能力落到资料阅读、竞品分析、产品文案和社区反馈。", "Make English practical: docs, competitors, copy, and community feedback.") },
      { id: "reverse", zh: "反问问题", en: "Questions to ask", guide: bi("围绕前 90 天目标、Agent 主线、指标和协作边界来问。", "Ask about first-90-day goals, Agent priorities, metrics, and collaboration boundaries.") }
    ],
    questions: [
      q("self_intro_60", "behavioral", "开场定位", ["warmup", "behavioral", "role"], "必练",
        ans("请做一个 60 秒自我介绍，重点贴合这个 AI 产品经理岗位。", ["建立海外 AI Agent 产品匹配", "用 Inspector 证明 Agent 闭环能力", "避免讲成纯工业 PM"],
          `您好，我是李沛宣，目前在 DataMesh 做 B 端产品经理，主要做数字孪生、设施运维和 AI 产品化。

我和这个岗位最相关的能力，是把一个 AI Agent 从概念拆成可落地的任务闭环。过去在 Inspector 设施运维 Agent 里，我不是只做一个聊天入口，而是把告警、设备、空间、SOP、历史工单、诊断建议、工单草稿、人工确认和结果回写串起来，并定义每一步的输入、输出、边界和验收方式。

这个经历和出门问问海外 Agent 产品很贴合。JD 里提到任务创建、上下文管理、Agent 执行、结果确认和协作交付，本质上也是让用户把复杂任务交给 AI，但产品经理要保证它可理解、可控、可复盘、能持续优化。英文方面，我可以阅读海外产品资料和技术文档，也能参与英文产品文案和用户引导。`,
          `您好，我是李沛宣，目前在 DataMesh 做 B 端产品经理，主要负责数字孪生、设施运维和 AI 产品化方向。

结合出门问问这个海外产品经理岗位，我觉得自己有三点比较匹配。第一，我做过 AI Agent 类产品的产品侧拆解。比如 Inspector 设施运维 Agent，一开始客户的问题不是没有告警，而是告警以后还要查设备台账、空间位置、SOP、历史工单，再判断原因和是否派单。我做的事情是把这条链路拆成告警理解、上下文补全、知识检索、诊断建议、处置方案、工单草稿、人工确认和结果回写，并把它转成 PRD、原型、字段、状态和验收脚本。

第二，我比较关注 AI 产品的体验边界。Agent 不能只看回答是否漂亮，还要看用户是否知道它拿了什么上下文、正在执行哪一步、依据是什么、什么时候需要补充信息、结果如何确认。第三，我有跨团队推进经验，能和研发、设计、售前、交付、客户多方对齐。`,
          "能力标签：Ownership / Dealing with Ambiguity / Customer Obsession / Stakeholder Management。",
          [fu("你和岗位最匹配的一点是什么？", "要求一句话定位。", "最匹配的是 Agent 任务闭环拆解：从上下文、执行步骤、输出结构、人工确认到结果回写，而不只是做一个 AI 聊天入口。")]),
        ans("Please give a 60-second self-introduction tailored to this AI Product Manager role.", ["Position for overseas AI Agent products", "Use Inspector as proof", "Avoid sounding like only an industrial PM"],
          `Hi, I am Jane Li, currently a B2B product manager at DataMesh, focusing on digital twins, facility operations, and AI productization.

My strongest fit for this role is turning an AI Agent from a broad concept into a real task workflow. In the Inspector facility-operations Agent project, I did not treat AI as a separate chat box. I connected alerts, equipment, spatial context, SOPs, historical work orders, diagnostic suggestions, work-order drafts, human confirmation, and result writeback into one workflow, then defined inputs, outputs, boundaries, and acceptance criteria for each step.

This maps well to Mobvoi's overseas AI Agent role. The JD mentions task creation, context management, Agent execution, result confirmation, and collaborative delivery.`,
          `Hi, I am Jane Li. I am currently a B2B product manager at DataMesh, working on digital twins, facility operations, and AI productization.

For this overseas AI Agent Product Manager role, I see three relevant strengths. First, I have hands-on product experience breaking down Agent workflows. In Inspector, I translated alert handling into a product loop: alert understanding, context enrichment, knowledge retrieval, diagnostic suggestion, action plan, work-order draft, human confirmation, and result writeback.

Second, I care about AI product boundaries. Users need to know what context the Agent used, what step it is executing, what evidence supports the result, when more information is needed, and how the final result is confirmed. Third, I can turn complex ideas into PRDs, prototypes, demo scripts, product explanations, and acceptance criteria.`)
      ),
      q("why_mobvoi_agent", "role", "投递动机", ["warmup", "role", "pressure"], "必练",
        ans("为什么投出门问问这个海外 AI Agent 产品岗位？", ["说明不是随机投递", "公司产品矩阵和岗位任务连起来", "强调方法迁移"],
          `我投这个岗位主要有两个原因。

第一，出门问问不是只做智能硬件，它现在的公开定位是 AIGC 和 AI CoPilot 公司，产品里既有面向创作者的 DupDub、LivGen，也有 TicNote 这类更偏海外效率工具和 Agentic AI 的产品。这和 JD 里的 AI Agent、任务协作、自动化执行、英文内容建设是能对上的。

第二，我自己的经历也更适合做这种把 AI 放进真实任务流的产品。过去我做 Inspector Agent 时，关注的是上下文、知识源、输出结构、人工确认和结果回写。换到海外 Agent 产品里，场景会从设施运维变成会议记录、内容创作、项目知识库或协作任务，但产品方法仍然是：用户想完成什么任务，AI 需要什么上下文，结果怎么确认，反馈怎么回流。`,
          "", "不要只说看好 AI。说清公司从语音/硬件到 AIGC/CoPilot，岗位从 Agent 体验到海外内容，正好匹配闭环拆解能力。"),
        ans("Why are you interested in Mobvoi's overseas AI Agent product role?", ["Targeted motivation", "Connect products to JD", "Method transfer"],
          `I am interested in this role for two reasons. First, Mobvoi is no longer only a smart-hardware company. Its public positioning is around AIGC and AI CoPilot, with products such as DupDub, LivGen, and TicNote. This connects well with the JD's focus on AI Agents, task collaboration, automated execution, English copy, and overseas product research.

Second, my own experience fits the product challenge of placing AI inside a real task workflow. In Inspector, I worked on context, knowledge sources, structured output, human confirmation, and result writeback. For an overseas Agent product, the domain changes, but the product method is similar.`)
      ),
      q("agent_product_design", "ai", "Agent 产品设计", ["ai", "product", "role"], "必练",
        ans("如果让你优化一个 AI Agent 协作产品，你会从哪里开始？", ["匹配 JD 职责", "拆任务闭环", "避免泛泛说优化页面"],
          `我会先不从页面开始，而是从任务闭环开始。

第一，拆用户任务：用户为什么创建这个任务，输入材料是什么，期望交付物是什么，是否多人协作。第二，拆 Agent 流程：任务创建、上下文补全、计划生成、工具执行、阶段状态、结果确认、协作交付、反馈回流。每一步都要知道用户能不能理解、能不能修改、出错时怎么恢复。

第三，拆体验问题：比如用户不知道该给什么上下文、Agent 执行过程不可见、结果太泛、无法追溯依据、多人协作不知道谁确认。第四，拆指标和迭代：任务创建成功率、执行完成率、用户编辑率、结果采纳率、二次追问率、失败原因分类。`,
          "", "这题是岗位职责压缩版。务必用任务闭环回答。"),
        ans("If you were asked to optimize an AI Agent collaboration product, where would you start?", ["Task-loop thinking", "UX friction", "Metrics"],
          `I would start from the task loop, not isolated UI screens. First, understand the user's task: why they create it, what input materials they have, what output they expect, and whether collaboration is involved.

Second, break down the Agent workflow: task creation, context enrichment, planning, tool execution, progress state, result confirmation, collaboration, and feedback. Third, identify friction: unclear input requirements, invisible execution, generic results, missing evidence, or unclear ownership in collaboration.`)
      ),
      q("inspector_agent_story", "behavioral", "项目 STAR", ["behavioral", "ai", "role", "pressure"], "必练",
        ans("讲一个你做 AI Agent 或 AI 产品化最有代表性的项目。", ["主故事", "证明具体个人贡献", "可打多题"],
          `我最适合讲 Inspector 设施运维 Agent。

背景是客户现场有告警、设备台账、空间位置、SOP、历史工单，但这些信息很分散。一线人员看到告警后，还要自己判断设备、原因、风险和下一步动作。

我的任务不是做一个独立聊天框，而是把 AI 放进告警到工单的主流程，形成可验证、可解释、可回写的闭环。我做了四件事：拆业务流，定义告警触发、上下文补全、知识检索、诊断建议、处置方案、工单草稿、人工确认和结果回写；拆业务对象，包括设备、空间、告警、SOP、历史工单、知识源、工单字段和状态；定义 AI 输出结构，包括可能原因、依据、置信度、缺失信息和建议检查项；和研发对齐字段、接口、异常路径和场景验收脚本。

结果上，这套方案把 AI 从概念变成研发可评审、客户可理解、POC 可验证的产品闭环。`,
          `S：设施运维客户现场不是没有系统，而是系统很多但信息分散。告警系统知道异常，设备台账知道设备信息，SOP 在文档里，历史工单在另一个系统里。一线人员看到告警以后，仍然要自己判断原因、影响范围、处理路径和是否派单。

T：我的任务不是给产品加一个 AI 聊天框，而是把 AI 嵌入告警到处置的主链路，让它能辅助诊断、生成建议和工单草稿，同时有依据、有边界、有人工确认。

A：我拆业务闭环、对象状态、AI 输出规则和验收脚本，并和研发、设计、测试、售前、交付反复对齐。

R：这套方案把 AI 能力从概念变成了研发能实现、测试能验收、客户能理解的产品闭环。边界上我会诚实说，它是产品方案验证、Demo/POC 和可交付规划，不包装成大规模全量上线或模型训练。`,
          "主故事。出门问问面试里要把落点换成 Agent 任务闭环和海外效率工具可迁移。",
          [fu("你个人到底做了什么？", "避免团队成果模糊。", "我个人最核心的是产品侧拆解：流程、对象、Agent 职责、输入输出、兜底规则、验收脚本和 bad case 分类。"), fu("AI 真实上线了吗？", "压力边界题。", "我会诚实说 AI 部分是产品方案验证、Demo/POC 和可交付规划，不包装成全量线上；但我负责的是让它从概念变成可评审、可演示、可验收的闭环。")]),
        ans("Tell me about your most representative AI Agent or AI productization project.", ["Main story", "Personal contribution", "Reusable"],
          `My most relevant project is the Inspector facility-operations Agent. The problem was not lack of data, but scattered data. Operators had alerts, equipment records, spatial context, SOPs, and historical work orders in different places. After seeing an alert, they still had to judge the cause, risk, and next action manually.

My task was not to add a standalone chatbot. It was to embed AI into the alert-to-work-order workflow. I broke the workflow into alert triggering, context enrichment, knowledge retrieval, diagnostic suggestions, action plans, work-order drafts, human confirmation, and result writeback.`,
          `Situation: Customers already had alerts, equipment records, spatial information, SOPs, and historical work orders, but the information was scattered. Task: place AI inside the alert-to-action workflow with evidence, boundaries, and human confirmation. Action: define objects, states, input and output fields, low-confidence fallback, high-risk human confirmation, acceptance scripts, and bad-case categories. Result: AI became a workflow that engineering could implement, QA could test, and customers could understand.`)
      ),
      q("ai_delivery_deep_dive_story", "ai", "AI 落地深挖", ["ai", "pressure", "role"], "必练",
        ans("如果面试官继续深挖 RAG 准确度、Agent 信息来源优先级、效果评估，你怎么讲成一个真实项目故事？", ["补足具体措施", "回答 AI 落地追问", "从技术词变成项目推进故事"],
          `我会先把它讲成一个真实推进过程，而不是直接堆 RAG 和 Agent 术语。

当时客户现场的问题不是没有数据，而是数据分散在很多地方。告警系统知道异常，设备台账知道是哪台设备，空间系统知道它在哪个区域，知识库里有 SOP，历史工单里有以前怎么修过。但一线人员处理告警时，还是要自己翻资料、问资深工程师、再判断要不要派工。

所以我做的第一步，是把 AI 要用的信息源先分层。实时告警、传感器和设备状态用来判断“现在发生了什么”；设备台账和空间位置用来判断“是哪一个对象、在哪儿”；SOP 和厂家手册作为标准处理依据；历史维修记录只能作为类似经验参考。这样如果 SOP 和历史工单冲突，AI 不能直接按历史经验下结论，而是要提示冲突，让工程师确认。

第二步是把 RAG 的准确度拆开看。不是只看最后回答像不像，而是先看召回：Top3 或 Top5 里有没有召回正确设备、正确告警类型、正确 SOP 或相似工单；再看生成：模型有没有基于材料回答，有没有乱引用，有没有把历史经验说成标准流程。

第三步是 bad case 调优。我不会跟研发说“这个不准”就结束，而是拆成几类：知识库缺资料，就补知识；SOP 切片后上下文断了，就调整 chunk 和标题层级；元数据不够导致跨设备、跨楼层误召回，就补设备类型、空间、客户和故障类型标签；材料对但回答太满，就改输出结构，让它必须给证据来源、风险提示和人工确认状态。

最后评估效果时，我会看 AI 有没有真的进入工作流：用户是否打开建议、是否采纳工单草稿、修改量大不大、哪些问题反复被追问、客户是否愿意从演示推进到真实试点。如果还没有完整量化指标，我会把用户反馈继续拆成可改的产品问题，而不是停留在“好用/不好用”。`,
          `这个问题本质上是在问我有没有真的参与 AI 项目落地，所以我会按项目推进顺序讲。

一开始客户并不会说“我要一个 Agent”，他们说的是现场告警太多，新人不知道该先看哪里，资深工程师又经常被重复问。我们看到的问题是，数据并不少，但分散在告警、设备台账、空间定位、SOP、历史工单里，没有形成一个处理问题的工作流。

我先把告警处置拆成几步：发现异常、确认对象和位置、查标准处理办法、参考历史维修经验、生成诊断建议、形成工单草稿、人工确认、结果回写。拆完以后，我和研发对齐，Agent 不是一个聊天框，而是要在这条链路里拿上下文、调工具、给结构化建议。

信息来源优先级是我当时重点定义的。实时数据代表当前事实，设备台账和空间信息代表对象身份，SOP 和手册代表标准依据，历史工单代表经验参考。优先级不是简单谁排第一，而是看这类信息在决策里承担什么角色。比如判断现在是否异常，优先看实时告警和传感器；判断怎么处理，优先看 SOP；历史工单可以补充类似经验，但不能覆盖标准流程。如果来源冲突，AI 不能直接做确定性判断，要暴露冲突并要求人工确认。

RAG 准确度我也拆成两层。第一层是召回正确：它有没有找回对应设备、对应告警类型、对应空间、对应 SOP 或相似维修记录。第二层是生成正确：它有没有按召回材料回答，有没有错误引用，有没有把不确定信息说得过度确定。为了让它能验收，我会整理典型问题作为测试集，每个问题标注应该命中的资料，再和研发一起看是知识缺失、切片问题、标签问题、检索问题，还是生成表达问题。

后面调优就是围绕这些 bad case 做。缺资料就推动实施补知识；切片不合理就调整文档结构和 chunk；召回了相似但不适用的资料，就补设备类型、空间、客户和故障类型这些元数据；材料对但答案不可信，就改 prompt 和输出结构，强制输出问题摘要、依据、建议动作、风险提示和是否需要人工确认。

项目效果上，我不会只说“效率提升”，而是看交付后的真实信号：用户是否打开 AI 建议，工单草稿是否被大量改写，哪些建议被质疑，重复追问集中在哪类问题，客户是否愿意进入下一轮试点。对我来说，这个项目最重要的价值是把 AI 从能回答问题，推进到能辅助真实业务处置，并且它的依据、边界和错误都能被看见、被迭代。`,
          "这张卡专门应对出门问问这类 AI Agent 深挖：不要先讲技术名词，先讲业务现场，再讲具体产品措施。",
          [
            fu("怎么判断 RAG 召回正确？", "面试官会追问可验证性。", "我会看是否命中正确对象、正确问题类型、正确知识源和有效证据。比如设备、空间、告警类型、SOP 或历史工单要匹配当前场景；如果召回了相似但不适用的资料，即使回答流畅，也算不合格。"),
            fu("Agent 来源信息优先级怎么定？", "考察业务判断而不是技术排序。", "我按信息在决策里的角色定优先级：实时数据判断当前事实，台账和空间确认对象，SOP/手册给标准依据，历史工单提供经验参考。冲突时要暴露冲突并人工确认。"),
            fu("怎么评估 AI 功能交付后的效果？", "强调业务结果。", "我会同时看产品信号和业务信号：建议打开率、采纳率、工单草稿修改量、追问率、bad case 收敛，以及诊断时间、新人依赖资深工程师程度、客户是否继续试点。"),
            fu("没有完整指标，只靠用户反馈怎么办？", "考察迭代方法。", "我不会只记录好用或不好用，而是追问具体原因：找不到资料、资料对但结论泛、引用不可信、输出不能进工单、还是不符合现场流程。然后拆成知识补齐、元数据、检索、输出结构或流程改造。")
          ]),
        ans("How would you explain RAG accuracy, Agent source priority, and effect evaluation as a real project story?", ["Concrete delivery actions", "AI deep dive", "Storytelling"],
          `I would not start with technical terms. I would first explain the operational problem: customers had alerts, equipment records, spatial context, SOPs, and historical work orders, but the information was scattered. Operators still had to search, ask senior engineers, and decide whether to create a work order.

My first product action was to classify information sources. Real-time alerts and sensor data described the current facts. Equipment records and spatial data identified the object and location. SOPs and manuals provided the standard procedure. Historical work orders were only experience references. If sources conflicted, the Agent should expose the conflict and ask for human confirmation instead of making a confident decision.

For RAG quality, I split evaluation into retrieval and generation. Retrieval means whether the right equipment, alert type, SOP, and similar work orders appear in Top3 or Top5. Generation means whether the answer is grounded in those materials, cites correctly, and avoids turning historical experience into a standard rule.

For tuning, I classified bad cases: missing knowledge, broken chunks, weak metadata, retrieval mismatch, or overconfident generation. Each category led to a different product or engineering action: add knowledge, adjust chunks, add metadata, improve filters, or tighten the output structure and fallback rules.

For impact, I would look at whether the AI entered the actual workflow: whether users opened suggestions, adopted or heavily edited work-order drafts, challenged certain answers, repeated follow-up questions, and whether the customer moved from demo to pilot.`,
          `I would tell it as a delivery story. The customer did not ask for an Agent directly. They had too many alerts and scattered operational knowledge. Junior operators did not know where to start, while senior engineers were repeatedly asked similar questions.

I broke the workflow into alert detection, object and location confirmation, SOP lookup, historical case reference, diagnostic suggestion, work-order draft, human confirmation, and result writeback. Then I aligned with engineering that the Agent should not be a standalone chatbox. It should use context, call tools, and produce structured suggestions inside the workflow.

I defined source priority based on the role of each source in the decision. Real-time data represents current facts. Asset and spatial data identify the object. SOPs and manuals are standard references. Historical work orders are experience references. When sources conflict, the Agent should make the conflict visible and require confirmation.

I evaluated RAG in two layers: retrieval accuracy and generation accuracy. Retrieval accuracy checks whether the correct object, alert type, location, SOP, or similar work order is retrieved. Generation accuracy checks whether the final answer is grounded, correctly cited, and appropriately cautious.

When tuning, I did not simply say the AI was wrong. I categorized bad cases into missing knowledge, chunking issues, missing metadata, retrieval mismatch, and generation overconfidence. This made the feedback actionable for engineering.

The business result I would emphasize is not that AI sounded smart, but that it became a visible, controllable part of the operational workflow, with evidence, boundaries, human confirmation, and iteration signals.`)
      ),      q("context_management", "ai", "上下文管理", ["ai", "product", "pressure"], "高频",
        ans("AI Agent 产品里的上下文管理，你会怎么设计？", ["JD 明确提到上下文管理", "Agent 不是单轮问答", "讲清用户体验"],
          `我会把上下文管理分成三类：任务上下文、资料上下文和用户/团队上下文。

任务上下文是这次要完成什么、目标是什么、输出格式是什么、限制条件是什么。资料上下文是文档、录音、网页、历史项目、知识库和用户上传材料。用户/团队上下文是语言偏好、角色、项目背景、过去确认过的规则和协作权限。

产品上不能让用户感觉这是黑箱。我会做三件事：任务创建时引导用户补关键上下文；执行前或执行中展示 Agent 使用了哪些材料、缺什么信息；结果里保留引用、依据和可修改入口。这样用户才知道 Agent 为什么这样做，也能纠正它。`,
          "", "结构：任务上下文 / 资料上下文 / 用户团队上下文 / 可见可改可追溯。"),
        ans("How would you design context management for an AI Agent product?", ["Context management", "Not single-turn chat", "UX clarity"],
          `I would split context into task context, material context, and user/team context. Task context includes the goal, expected output, constraints, and success criteria. Material context includes documents, recordings, web pages, historical projects, knowledge bases, and uploaded files. User/team context includes language preference, role, project background, confirmed rules, and collaboration permissions.

Product-wise, context should not be a black box. The product should guide users to provide key context, show what materials the Agent is using or missing, and keep citations, assumptions, and editing controls in the result.`)
      ),
      q("execution_confirmation", "ai", "执行与确认", ["ai", "product", "pressure"], "高频",
        ans("Agent 自动执行和用户确认之间，你会怎么设计边界？", ["人机协同边界", "风险控制", "自动化执行/结果确认"],
          `我会按风险分层设计边界。

低风险动作可以自动执行，比如生成草稿、整理摘要、分类标签、创建待办建议。中风险动作需要用户预览确认，比如发送给团队、改动共享文档、批量生成内容。高风险动作不能自动执行，比如删除数据、对外发布、付费、触发业务系统动作，必须人工确认并留痕。

产品上要让用户看见三件事：Agent 准备做什么、依据是什么、会影响哪些对象。确认之后还要有撤回、版本记录和失败恢复。这样自动化才不会变成失控感。`,
          "", "用低/中/高风险三层回答，迁移 Inspector 高风险人工确认。"),
        ans("How would you design the boundary between Agent automation and user confirmation?", ["Human-AI boundary", "Risk control", "Execution and confirmation"],
          `I would design the boundary by risk level. Low-risk actions can be automated, such as drafts, summaries, labels, and suggested tasks. Medium-risk actions need preview and confirmation, such as syncing to a team workspace or changing shared documents. High-risk actions should not be automatic, such as deletion, external publishing, payments, or critical business actions.

Users should see what the Agent is going to do, why, and what objects will be affected. After confirmation, there should be undo, version history, and failure recovery.`)
      ),
      q("ticnote_review", "product", "产品分析", ["product", "overseas", "ai"], "加分",
        ans("如果面试官问你怎么看 TicNote / 海外 AI 录音 Agent 产品，你怎么答？", ["证明公司研究", "把硬件和 Agent 工作流连起来", "给出产品改进点"],
          `我会把 TicNote 理解成录音硬件 + AI 工作台 + 项目知识库的 Agentic 产品，而不是普通录音笔。

它的价值链路是：低摩擦采集声音 -> 转写和翻译 -> 总结和 action items -> 项目 Wiki / 跨文件问答 -> 形成可复用知识资产。这个方向很适合海外用户的会议、访谈、课程、销售和专业服务场景。

如果从产品优化看，我会重点关注三点：用户第一次录完以后是否马上理解 AI 能做什么；转写、摘要、任务和项目 Wiki 之间有没有形成闭环；订阅和硬件价值是否讲清楚，避免用户觉得买了硬件后还被订阅割裂。`,
          "", "如果没用过真机，开头说基于官网公开信息，我会这样理解。"),
        ans("How would you analyze TicNote or an overseas AI recorder Agent product?", ["Company research", "Hardware and Agent workflow", "Product insight"],
          `Based on public information, I would understand TicNote as a recording hardware entry plus an AI workspace and project knowledge base, not just a recorder.

The value chain is low-friction voice capture, transcription and translation, summaries and action items, project Wiki, and cross-file Q&A. It can serve meetings, interviews, lectures, sales, legal services, and professional services.

Product-wise, I would focus on the first-recording aha moment, the workflow from notes to tasks and project knowledge, and clear communication around subscriptions, privacy, and hardware value.`)
      ),
      q("metrics_iteration", "product", "数据与迭代", ["product", "ai", "role"], "高频",
        ans("一个 AI Agent 功能上线后，你会跟踪哪些数据？", ["用户反馈/数据分析", "指标落到任务节点", "避免只说 DAU"],
          `我会按任务漏斗、结果质量和复用留存三层看。

任务漏斗看：任务创建率、上下文补全率、执行开始率、执行成功率、失败节点。结果质量看：结果采纳率、人工编辑率、重新生成率、追问率、低置信触发率、用户反馈里的 bad case 类型。复用留存看：模板复用率、项目知识库回访率、跨文件问答使用率、7 日或 30 日留存、订阅转化。

重点不是堆指标，而是把数据回到产品动作。比如结果编辑率高，可能是上下文不足、输出结构不对或用户预期没设清楚；执行失败多，可能是工具调用、权限或异常分支问题。`,
          "", "迁移 bad case 分类：数据缺失、检索不准、输出结构不稳、流程缺输入。"),
        ans("What metrics would you track after launching an AI Agent feature?", ["Feedback and data", "Task-node metrics", "Beyond DAU"],
          `I would track three layers: task funnel, result quality, and reuse/retention. Task funnel: task creation, context completion, execution start, execution success, and failure nodes. Result quality: adoption, edit rate, regeneration, follow-up rate, low-confidence fallback, and bad-case categories. Reuse and retention: template reuse, project-Wiki revisit, cross-file Q&A usage, retention, and subscription conversion.`)
      ),
      q("competitor_research", "overseas", "竞品研究", ["overseas", "product", "role"], "高频",
        ans("你会怎么跟踪 AI Agent、AI IDE、效率工具的产品动态？", ["JD 明确要求", "调研方法", "英文资料能力"],
          `我会用产品拆解、用户反馈、技术约束三条线跟踪。

产品拆解看它解决什么任务、核心闭环、onboarding、上下文管理、Agent 执行可见性、结果确认和商业化。比如 Cursor、Windsurf 更偏开发者工作流，Manus/Devin 更强调任务自动化，TicNote 更偏语音输入到知识资产。

用户反馈看海外社区、Product Hunt、Reddit、X、YouTube、App Store/Google Play 评论，重点抓用户为什么爱用、为什么流失、愿意为什么付费。最后我会把观察转成产品改进点，而不是只做竞品功能表。`,
          "", "体现英文阅读和海外社区观察。点名工具但别硬装深度专家。"),
        ans("How would you follow AI Agent, AI IDE, and productivity-tool trends?", ["Research method", "English sources", "Product thinking"],
          `I would track three lines: product teardown, user feedback, and technical constraints. For product teardown, I would look at target users, core task loop, onboarding, context management, execution visibility, result confirmation, and monetization. For user feedback, I would read Product Hunt, Reddit, X, YouTube, App Store and Google Play reviews, and community discussions. The goal is to turn observations into product improvement ideas, not just a feature table.`)
      ),
      q("english_copy", "overseas", "英文表达", ["overseas", "role", "warmup"], "必练",
        ans("这个岗位要求英文阅读和英文产品文案，你怎么证明自己能做？", ["海外岗位关键要求", "英语落到工作场景", "不空泛"],
          `我会从工作场景来证明，而不是只说英语不错。

第一，我硕士阶段在 UCL，英文资料阅读、表达和跨文化沟通是日常能力。第二，我在工作中会读海外产品、AI 工具、技术文档和社区反馈，像 Cursor、Claude、ChatGPT、AI Agent 产品的 release note、帮助文档和用户评论。第三，我过去做过面向客户的英文方案、演示材料和产品说明，知道产品文案不是直译，而是要让用户理解这个功能帮我完成什么任务、需要我怎么开始、结果怎么判断。

如果做出门问问海外产品，我会把英文文案重点放在清晰、自然、任务导向，而不是堆 AI 术语。`,
          "", "避免只说雅思/留学。重点：读资料、写文案、做用户引导。", [fu("现场给一句英文产品文案？", "测试英文输出。", "TicNote: Turn every conversation into searchable notes, tasks, and project knowledge. Record once, work with it anytime.")]),
        ans("This role requires English reading and product copywriting. How can you prove you can do it?", ["English for product work", "Docs and copy", "Avoid empty claims"],
          `I would prove it through work scenarios, not only by saying my English is good. I studied at UCL, so English reading, writing, presentation, and cross-cultural communication were part of daily work. I regularly read overseas AI product docs, release notes, community feedback, and user reviews. In my work I have written and supported customer-facing materials, where product copy needs to explain the task, the starting point, and how users judge results.`)
      ),
      q("consumer_gap", "role", "压力防守", ["pressure", "role", "overseas"], "必练",
        ans("你过去偏 B 端和工业场景，海外 C 端 / 工具产品经验不足，怎么补？", ["正面回应短板", "不防御", "给出学习路径"],
          `这个差距我会承认。我的直接经验确实更多在 B 端工业和复杂交付场景，不是典型海外 C 端增长产品。

但这个岗位不是纯 C 端活动运营，它核心还是 AI Agent 任务体验：任务创建、上下文管理、执行、确认、协作和文案。这部分和我过去做专业任务流 AI 产品化是相通的。

补齐上，我会用三步：快速深用公司产品和主要竞品，做任务流拆解；看海外用户评论和社区，把反馈分类成 onboarding、结果质量、订阅、隐私、协作等问题；用小需求快速验证，比如英文引导、模板、结果确认或新手任务样例。`,
          "", "标准结构：承认差距 -> 拆岗位本质 -> 迁移能力 -> 补齐计划。"),
        ans("Your background is more B2B and industrial. How would you address the gap in overseas consumer or tool products?", ["Acknowledge gap", "Reframe role", "Learning plan"],
          `I would acknowledge the gap. My direct experience is more in B2B industrial and delivery-heavy products, not typical overseas consumer growth. But this role is not only consumer marketing. The core is AI Agent task experience: task creation, context management, execution, confirmation, collaboration, and copy. That connects with my previous AI workflow productization experience. I would close the gap by deeply using Mobvoi products and competitors, reading overseas reviews and communities, and starting with small improvements such as onboarding, templates, result confirmation, subscription explanation, and privacy copy.`)
      ),
      q("reverse_questions", "reverse", "反问", ["reverse", "warmup"], "必练",
        ans("最后你准备反问面试官什么？", ["关注真实工作", "不问空泛问题", "围绕成功标准"],
          `我会优先问三个问题。

第一，这个岗位前 90 天最希望解决的核心问题是什么？是某条 Agent 任务闭环、海外产品体验、英文内容，还是数据迭代？

第二，团队现在判断 AI Agent 产品好不好，最看重任务完成率、结果采纳率、留存复用、订阅转化，还是用户反馈里的 bad case 收敛？

第三，PM 和研发、设计、增长、运营之间的协作边界是什么？产品需要定义到输出结构、执行状态和异常路径，还是更偏需求和原型？`,
          "", "选择最贴合前文的 2-3 个，别全问。优先问前 90 天、Agent 主线、协作边界。"),
        ans("What questions would you ask the interviewer at the end?", ["Real work", "Success criteria", "Collaboration"],
          `I would ask three questions. First, what is the most important problem this role should solve in the first 90 days: an Agent task loop, overseas user experience, English content, or data iteration? Second, how does the team judge whether an AI Agent product is good: task completion, result adoption, retention, subscription conversion, or bad-case reduction? Third, what is the collaboration boundary between PM, engineering, design, growth, and operations?`)
      )
    ],
    reviewFocus: [
      bi("主线：我做过的是专业任务流 AI 产品化，能迁移到海外 Agent 工具的任务创建、上下文、执行、确认和反馈闭环。", "Main line: I have productized AI in professional workflows, transferable to overseas Agent tools through task creation, context, execution, confirmation, and feedback loops."),
      bi("不要说：我训练过模型 / AI 已全量上线。要说：我负责产品侧方案验证、Demo/POC、输出协议、验收脚本和 bad case 迭代。", "Do not claim model training or full rollout. Say product-side validation, demo/POC, output protocol, acceptance scripts, and bad-case iteration."),
      bi("出门问问理解：语音交互和 AIGC 技术底座 + 创作者/企业/消费者产品矩阵 + 海外 AI CoPilot/Agent 工作流。", "Mobvoi lens: voice and AIGC foundation + creator/enterprise/consumer product matrix + overseas AI CoPilot/Agent workflows."),
      bi("Agent 产品回答公式：用户任务 -> 上下文 -> 执行状态 -> 结构化输出 -> 人工确认 -> 协作交付 -> 反馈回流。", "Agent formula: user task -> context -> execution state -> structured output -> human confirmation -> collaboration -> feedback."),
      bi("压力题底线：承认 C 端/海外增长经验不足，但强调岗位本质是 AI 工具任务体验，并给出深用产品、看评论、做小迭代的补齐路径。", "Pressure answer: acknowledge less consumer-growth experience, frame the role as AI tool workflow UX, and give a concrete learning plan.")
    ],
    phraseBank: [
      { title: bi("开场高频句", "Opening lines"), items: [
        bi("我最贴合这个岗位的是 Agent 任务闭环拆解能力，而不是单纯会用 AI 工具。", "My strongest fit is Agent task-loop productization, not just using AI tools."),
        bi("我会先看用户想完成什么任务，再看 Agent 需要什么上下文和确认机制。", "I would first look at the user's task, then the Agent's context and confirmation mechanism."),
        bi("我不把 AI Agent 理解成万能机器人，而是业务链路里的协作角色。", "I do not see an AI Agent as an all-purpose robot, but as a collaborator inside a workflow.")
      ] },
      { title: bi("产品判断句", "Product judgment"), items: [
        bi("P0 不是功能数量，而是能否跑通一个用户愿意复用的最小任务闭环。", "P0 is not feature count; it is whether a reusable minimum task loop works."),
        bi("Agent 产品早期最重要的不是回答漂亮，而是失败可控、结果可确认。", "For early Agent products, controllable failure and confirmable results matter more than polished answers."),
        bi("用户不信任 AI 时，问题通常不只在模型，也在上下文、依据、可见状态和确认机制。", "When users do not trust AI, the issue is often context, evidence, visible state, and confirmation, not only the model.")
      ] },
      { title: bi("英文可直接用", "Reusable English lines"), items: [
        bi("Turn every conversation into searchable notes, tasks, and project knowledge.", "Turn every conversation into searchable notes, tasks, and project knowledge."),
        bi("Record once, work with it anytime.", "Record once, work with it anytime."),
        bi("Make the Agent's context, steps, and results visible enough for users to trust and control.", "Make the Agent's context, steps, and results visible enough for users to trust and control.")
      ] }
    ],
    companyResearch: {
      researchedAt: "2026-07-22",
      factBoundary: bi("公开资料显示出门问问成立于 2012 年，核心是生成式 AI、语音交互、AI CoPilot、AIGC 产品和智能硬件。岗位信息来自用户截图与 BOSS 直聘公开列表片段；具体团队和产品线以后续面试官说明为准。", "Public materials show Mobvoi was founded in 2012 and focuses on generative AI, voice interaction, AI CoPilot, AIGC products, and smart hardware. The JD is based on the user's screenshots and public job-listing snippets; the exact team and product line should be confirmed in the interview."),
      sources: [
        { label: "出门问问官网 · 公司介绍", url: "https://www.chumenwenwen.com/aboutus/intro", accessedAt: "2026-07-22" },
        { label: "Mobvoi About Us", url: "https://www2.mobvoi.com/pages/about-us", accessedAt: "2026-07-22" },
        { label: "Mobvoi TicNote official page", url: "https://www2.mobvoi.com/us/pages/mobvoiticnote", accessedAt: "2026-07-22" },
        { label: "出门问问官网 · 产品矩阵", url: "https://www.chumenwenwen.com/", accessedAt: "2026-07-22" },
        { label: "BOSS 直聘岗位公开列表片段", url: "https://www.zhipin.com/zhaopin/9c4c1bd5370819920n1z39k~/", accessedAt: "2026-07-22" }
      ],
      cards: [
        { title: bi("公司一句话", "Company in one line"), body: bi("出门问问可以理解成以语音交互、生成式 AI 和 AI CoPilot 为核心的公司，业务覆盖创作者 AIGC 产品、企业 AI 解决方案和消费者智能硬件。", "Mobvoi can be understood as a company centered on voice interaction, generative AI, and AI CoPilot, spanning creator AIGC products, enterprise AI solutions, and consumer smart hardware."), interviewUse: bi("可以说：我不会把出门问问只看成智能手表公司，而会看它如何把语音、内容生成和 Agent 工作流做成海外用户能持续使用的产品。", "Say: I would not see Mobvoi only as a smartwatch company; I would look at how it turns voice, content generation, and Agent workflows into products overseas users keep using.") },
        { title: bi("产品矩阵", "Product matrix"), body: bi("官网列出 AIGC 产品矩阵，包括魔音工坊、元创岛、奇妙元、奇妙问、DupDub、LivGen；智能可穿戴包括 TicWatch、TicNote 等；企业解决方案包括车载、私有化、定制音库、智能可穿戴、嵌入式语音交互和语音对话机器人。", "The official site lists an AIGC product matrix including Moyin Workshop, YuanChuangDao, Weta365, AI Ask365, DupDub, and LivGen; wearables including TicWatch and TicNote; and enterprise solutions such as in-vehicle voice, on-premise solutions, customized voice, smart wearables, embedded voice interaction, and conversational systems."), interviewUse: bi("把岗位放进海外 AIGC/Agent 产品体验里讲，不要只围绕硬件展开。", "Place the role inside overseas AIGC/Agent product experience, not only hardware.") },
        { title: bi("TicNote 机会", "TicNote opportunity"), body: bi("TicNote 官方页面强调录音、转写、总结、实时翻译、Smart Templates、Project Wiki、Cross-File Tasking、Podcast Creation 和隐私承诺。它更像从语音输入到知识资产的 Agentic 工作流。", "The TicNote official page emphasizes recording, transcription, summaries, live translation, smart templates, Project Wiki, cross-file tasking, podcast creation, and privacy messaging. It is closer to an Agentic workflow from voice input to knowledge assets."), interviewUse: bi("可迁移你的 Inspector 口径：Inspector 是告警到工单，TicNote 是录音到笔记、任务、项目知识和后续追问。", "Map Inspector to TicNote: Inspector is alert to work order; TicNote is recording to notes, tasks, project knowledge, and follow-up queries.") },
        { title: bi("JD 能力信号", "JD signals"), body: bi("截图 JD 强调 Agent 协作产品体验优化、任务创建、上下文管理、Agent 执行、结果确认、协作交付、AI Agent/AI IDE/效率工具动态、用户反馈、数据分析、英文阅读写作和产品文案。", "The screenshots emphasize Agent collaboration UX, task creation, context management, Agent execution, result confirmation, collaborative delivery, AI Agent/AI IDE/productivity trends, user feedback, data analysis, English reading and writing, and product copy."), interviewUse: bi("每个回答都尽量落到任务闭环、体验卡点、英文表达和跨团队落地。", "Anchor answers in task loops, UX friction, English expression, and cross-functional delivery.") },
        { title: bi("匹配画像", "Fit profile"), body: bi("强匹配：AI 产品化、Agent 闭环、结构化表达、研发协作、英文阅读、AI 工具深用。弱项：海外 C 端增长与具体消费硬件经验，需要用产品深用、社区反馈和小迭代补齐。", "Strong fit: AI productization, Agent loops, structured thinking, engineering collaboration, English reading, and hands-on AI-tool usage. Gap: overseas consumer growth and consumer-hardware experience, to be closed through deep product use, community feedback, and small iterations."), interviewUse: bi("压力题不要躲，按承认差距、岗位本质、迁移能力、补齐计划回答。", "For pressure questions, use acknowledge, role essence, transferable strength, and learning plan.") }
      ]
    }
  };

  if (typeof window !== "undefined") window.INTERVIEW_PREP_DATA = INTERVIEW_PREP_DATA;
  if (typeof module !== "undefined") module.exports = { INTERVIEW_PREP_DATA };
})();
