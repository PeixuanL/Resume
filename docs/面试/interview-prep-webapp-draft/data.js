(function () {
  const INTERVIEW_PREP_DATA = {
    meta: {
      company: "Trucker Path",
      role: "Product Manager",
      round: "Reusable bilingual interview prep draft",
      defaultLanguage: "zh",
      generatedAt: "2026-07-16",
      coreLine: {
        zh: "先说结论，再用一个真实经历证明判断和取舍。",
        en: "Lead with the answer, then prove it with one real story and a clear tradeoff.",
      },
      boundary: {
        zh: "这是草稿版样例数据。正式技能会根据简历、JD、轮次和实时公开信息重新生成。",
        en: "This is sample draft data. The final skill will regenerate content from the resume, JD, interview round, and current public research.",
      },
    },
    views: [
      { id: "practice", zh: "练习", en: "Practice" },
      { id: "review", zh: "集中复习", en: "Review" },
      { id: "company", zh: "公司背景", en: "Company" },
      { id: "map", zh: "题库地图", en: "Question Map" },
    ],
    modes: [
      { id: "warmup", zh: "快速热身", en: "Warm-up" },
      { id: "behavioral", zh: "行为面试", en: "Behavioral" },
      { id: "pg", zh: "宝洁八大问", en: "P&G Eight" },
      { id: "role", zh: "岗位业务", en: "Role Fit" },
      { id: "pressure", zh: "压力追问", en: "Pressure" },
      { id: "reverse", zh: "反问准备", en: "Reverse Questions" },
    ],
    questionFrameworks: [
      {
        id: "behavioral",
        zh: "行为面试高频题",
        en: "Common behavioral interview questions",
        guide: {
          zh: "用 STAR/CAR 回答：场景要短，行动要具体，结果和复盘要清楚。",
          en: "Use STAR/CAR: keep context short, make actions concrete, then show result and learning.",
        },
      },
      {
        id: "pg",
        zh: "宝洁八大问",
        en: "P&G-style eight questions",
        guide: {
          zh: "覆盖领导力、说服、创新、目标达成、冲突、失败、数据判断和主动性。",
          en: "Cover leadership, persuasion, innovation, goal delivery, conflict, failure, data judgment, and initiative.",
        },
      },
      {
        id: "role",
        zh: "岗位与业务题",
        en: "Role and business questions",
        guide: {
          zh: "把简历证据连接到岗位业务，不硬贴没有做过的领域。",
          en: "Connect resume evidence to the role without overstating domain experience.",
        },
      },
      {
        id: "resume",
        zh: "简历深挖",
        en: "Resume deep dive",
        guide: {
          zh: "说明个人贡献、边界、协作对象和可验证结果。",
          en: "Clarify personal contribution, scope, collaborators, and verifiable outcomes.",
        },
      },
      {
        id: "reverse",
        zh: "反问问题",
        en: "Questions to ask",
        guide: {
          zh: "围绕岗位成功标准、用户反馈、团队协作和前 90 天期待来问。",
          en: "Ask about success criteria, user feedback, collaboration, and first-90-day expectations.",
        },
      },
    ],
    questions: [
      {
        id: "self_intro",
        framework: "behavioral",
        category: { zh: "开场定位", en: "Opening" },
        mode: ["warmup", "behavioral", "role"],
        difficulty: { zh: "核心", en: "Core" },
        zh: {
          question: "请做一个 60 秒自我介绍。",
          intent: ["快速定位当前背景", "给一个最相关项目证据", "诚实连接岗位，不包装成行业专家"],
          simple: "您好，我目前是一名 B 端产品经理，主要做复杂业务流程和数字化产品落地。我最核心的经验，是把真实场景里的问题拆成用户路径、产品对象、状态流和可执行的 MVP。虽然我不一定直接做过目标公司的同类行业，但我会用结构化方法快速理解用户任务、信息来源和关键决策点，再把它转成 PRD、原型、验收标准和跨团队协作。",
          full: "您好，我目前是一名 B 端产品经理，主要做复杂业务流程和数字化产品落地。\n\n我最核心的经验，是把真实场景里的问题拆成用户路径、产品对象、状态流和可执行的 MVP。比如在设施运维项目里，一线人员看到异常后，不只是需要一条提醒，而是要判断影响范围、定位设备、找到责任人、进入任务处理，并把结果回写。我会先把这条链路拆清楚，再判断第一版产品要先跑通哪一段闭环。\n\n我也比较重视事实边界。如果目标岗位涉及我没有直接做过的行业，我不会把自己包装成专家，而是说明自己能迁移的是复杂流程拆解、信息质量判断、跨团队推进和新领域学习方法。",
          notes: "控制在 60-90 秒。不要把项目介绍讲太长。",
          followups: [
            {
              question: "你和这个岗位最匹配的能力是什么？",
              intent: "把自我介绍收束到岗位价值，不要散讲经历。",
              simple: "我最匹配的是复杂流程拆解和跨团队落地能力。我能把模糊场景拆成用户任务、信息需求、状态流和 MVP 范围，再推动设计、研发、测试一起落地。",
              full: "我最匹配的是复杂流程拆解和跨团队落地能力。目标岗位如果面对的是任务驱动型产品，真正难点往往不是页面本身，而是用户在什么场景下做判断、需要什么信息、下一步动作是什么。我过去做过这类拆解，也能把它转成 PRD、原型、验收标准和协作节奏。",
            },
            {
              question: "你最大的短板是什么？",
              intent: "诚实承认领域差距，同时给出补齐方法。",
              simple: "我的短板是没有直接做过完全相同的行业，所以行业细节需要补。但我会先从用户任务链路、公开资料、历史需求和用户反馈切入，用一个小任务尽快建立判断。",
              full: "我的短板是没有直接做过完全相同的行业，所以行业细节和用户语境需要补。我不会把自己包装成专家。我的做法是先跑用户任务链路，理解用户是谁、在什么场景下做什么判断、需要什么信息，再通过公开资料、历史需求、用户反馈和竞品快速补上下文。",
            },
            {
              question: "能再短一点吗？",
              intent: "测试你是否能压缩表达，适合开场被打断时使用。",
              simple: "可以。我目前是 B 端产品经理，核心经验是把复杂业务场景拆成清晰的产品流程和 MVP，并推动跨团队落地。虽然行业不完全相同，但我能迁移的是用户路径拆解、信息质量判断和快速学习能力。",
              full: "可以。我目前是 B 端产品经理，主要做复杂业务流程和数字化产品落地。我的核心能力是把真实场景拆成用户路径、产品对象和 MVP，再推动设计、研发、测试协作落地。行业上我需要补课，但方法上我能从用户任务和关键决策点快速切入。",
            },
          ],
        },
        en: {
          question: "Please give a 60-second self-introduction.",
          intent: ["Position current background quickly", "Use one relevant project as evidence", "Connect to the role honestly"],
          simple: "Hi, I am currently a B2B product manager working on complex workflow products and digital product delivery. My strongest experience is turning real operational scenarios into user journeys, product objects, state flows, and a focused MVP. Even when I have not worked in the exact same domain, I can quickly learn the user workflow, identify key decision points, and turn that understanding into PRDs, prototypes, acceptance criteria, and cross-functional execution.",
          full: "Hi, I am currently a B2B product manager working on complex workflow products and digital product delivery.\n\nMy strongest experience is turning real operational scenarios into user journeys, product objects, state flows, and a focused MVP. For example, in a facility operations project, when frontline users see an abnormal alert, they do not only need a notification. They need to understand the impact, locate the asset, find the owner, create or handle a task, and write the result back into the workflow. I start by mapping that full path, then define which part must be included in the first MVP.\n\nI also try to keep a clear boundary. If the target role involves a domain I have not directly worked in, I will not pretend to be a domain expert. What I can transfer is structured workflow thinking, information-quality judgment, cross-functional execution, and a fast learning method.",
          notes: "Keep it to 60-90 seconds. Do not turn it into a full project walkthrough.",
          followups: [
            {
              question: "What is your strongest fit for this role?",
              intent: "Connect the opening to role value instead of listing experience.",
              simple: "My strongest fit is breaking down complex workflows and driving cross-functional execution. I can translate unclear scenarios into user tasks, information needs, state flows, and focused MVP scope.",
              full: "My strongest fit is breaking down complex workflows and driving cross-functional execution. In task-driven products, the challenge is often not the page itself, but what decision the user is making, what information they need, and what action comes next. I have worked through that type of product thinking and can turn it into PRDs, prototypes, acceptance criteria, and delivery alignment.",
            },
            {
              question: "What is your biggest gap?",
              intent: "Acknowledge the domain gap while showing a learning method.",
              simple: "My biggest gap is that I have not worked in the exact same domain. I would close it by mapping the user task flow, reading public material, past requirements and feedback, then contributing through a small concrete task.",
              full: "My biggest gap is that I have not worked in the exact same domain, so I need to learn the domain details and user language. I would not position myself as an expert on day one. I would start with the user workflow, understand who the user is, what decision they make, what information they need, then learn from public materials, past requirements, feedback, and competitors.",
            },
            {
              question: "Can you make it shorter?",
              intent: "Test whether the answer can be compressed when interrupted.",
              simple: "Sure. I am a B2B product manager focused on complex workflow products. My strength is turning real user scenarios into clear product flows and focused MVPs. I would transfer workflow thinking, information-quality judgment, and fast learning to this role.",
              full: "Sure. I am a B2B product manager focused on complex workflow products and digital delivery. My strength is turning real user scenarios into user journeys, product objects, and focused MVPs, then driving design and engineering alignment. I would need to learn the domain, but I can transfer workflow thinking and fast learning.",
            },
          ],
        },
      },
      {
        id: "leadership_story",
        framework: "pg",
        category: { zh: "领导力", en: "Leadership" },
        mode: ["behavioral", "pg"],
        difficulty: { zh: "核心", en: "Core" },
        zh: {
          question: "讲一个你带动他人完成困难目标的例子。",
          intent: ["宝洁八大问领导力", "看你是否能定义方向、推动协作、承担结果"],
          simple: "我会选择一个跨团队推进 MVP 的例子。当时需求范围容易发散，我先把目标收敛为一条最小闭环：用户能发现问题、确认信息、进入处理流程并回写结果。然后我把范围拆成必须做、可后置和只用于演示三类，和设计、研发、测试、售前逐一对齐。最后团队没有陷入功能堆叠，而是先交付了能验证主流程价值的版本。",
          full: "我会选择一个跨团队推进 MVP 的例子。\n\n当时项目里不同角色都希望把更多功能放进第一版，需求范围很容易发散。我先把目标收敛成一条最小闭环：用户能发现问题、确认信息、进入处理流程，并把结果回写。基于这个目标，我把需求拆成三类：必须支撑闭环的功能、可以后置的增强功能、以及短期只用于演示或客户沟通的内容。\n\n接下来我和设计、研发、测试、售前逐一对齐。对设计，我强调用户在关键节点需要什么信息；对研发，我明确状态流和验收边界；对售前，我说明哪些能力可以支撑客户演示，但不一定进入标准产品范围。\n\n最后团队没有陷入功能堆叠，而是先交付了能验证主流程价值的版本。这个例子里，我的领导力不是管理职级，而是帮助团队在复杂目标下形成共同判断。",
          notes: "领导力不等于职位。重点讲定义目标、拆范围、对齐人。",
          followups: [
            {
              question: "如果有人不同意你的优先级怎么办？",
              intent: "看你是否能处理冲突，而不是只强调自己的方案。",
              simple: "我会先回到共同目标和验收标准。如果对方的需求直接影响核心闭环，我会调整优先级；如果更多是展示或增强，我会建议后置或用低成本方案支持。",
              full: "我会先回到共同目标，而不是直接争论谁对。具体会看这个需求是否影响第一版核心闭环和验收标准。如果它直接影响用户完成任务，我会调整优先级；如果它更多是展示、增强或单个客户偏好，我会建议后置，或者用 Demo、配置、项目定制先支持沟通。",
            },
            {
              question: "你怎么证明结果有效？",
              intent: "看结果是否能被验证，而不是只说团队感觉更清楚。",
              simple: "我会看核心流程是否跑通、返工是否减少、评审是否更快对齐，以及用户或客户是否能理解第一版价值。",
              full: "我会从几个层面验证：第一，核心流程是否真的能从起点跑到终点；第二，团队在 PRD、原型、验收上的返工是否减少；第三，评审时争议是否从“要不要加功能”变成“这是否支撑目标”；第四，用户或客户是否能理解第一版产品价值。",
            },
          ],
        },
        en: {
          question: "Tell me about a time you led others to achieve a difficult goal.",
          intent: ["P&G-style leadership question", "Tests direction-setting, alignment, and ownership"],
          simple: "I would use an example where I helped a cross-functional team deliver a focused MVP. The scope was expanding quickly, so I reframed the goal as one minimum workflow: users could identify an issue, confirm key information, enter the handling process, and write the result back. I then grouped requirements into must-have, later, and demo-only items, aligned design, engineering, QA, and pre-sales, and helped the team ship a version that validated the core workflow instead of a pile of features.",
          full: "I would use an example where I helped a cross-functional team deliver a focused MVP.\n\nAt the time, different stakeholders wanted more features in the first version, and the scope was expanding quickly. I reframed the goal as one minimum workflow: users could identify an issue, confirm key information, enter the handling process, and write the result back. Based on that, I grouped requirements into must-have items, later enhancements, and demo-only items.\n\nThen I aligned each function around that structure. With design, I clarified what information users needed at each decision point. With engineering, I defined the state flow and acceptance boundaries. With pre-sales, I explained which capabilities could support customer demos without becoming part of the standard product scope.\n\nThe result was that the team shipped a version that validated the core workflow instead of a pile of features. In this case, leadership was not about title. It was about creating clarity and helping people make the same tradeoff.",
          notes: "Leadership is not job title. Emphasize direction, scope, and alignment.",
          followups: [
            {
              question: "What if someone disagreed with your priority?",
              intent: "Shows conflict handling instead of insisting on your own plan.",
              simple: "I would bring the discussion back to the shared goal and acceptance criteria. If the request affects the core workflow, I would adjust priority. If it is mainly a demo or enhancement need, I would suggest postponing it or using a lower-cost alternative.",
              full: "I would not start by arguing about whose idea is better. I would bring the discussion back to the shared goal and acceptance criteria. If the request directly affects the core workflow, I would adjust the priority. If it is mainly for demonstration, enhancement, or a customer-specific preference, I would suggest postponing it or supporting it with a demo, configuration, or project-specific handling.",
            },
            {
              question: "How did you prove the result worked?",
              intent: "Checks whether the outcome was verifiable.",
              simple: "I would look at whether the core flow worked end to end, whether rework decreased, whether reviews aligned faster, and whether users or customers understood the first-version value.",
              full: "I would verify it at several levels: whether the core flow worked from start to finish, whether PRD/prototype/acceptance rework decreased, whether review discussions became more focused, and whether users or customers could understand the value of the first version.",
            },
          ],
        },
      },
      {
        id: "failure_learning",
        framework: "pg",
        category: { zh: "失败复盘", en: "Failure" },
        mode: ["behavioral", "pg", "pressure"],
        difficulty: { zh: "高压", en: "Pressure" },
        zh: {
          question: "讲一个失败或做得不够好的经历，你学到了什么？",
          intent: ["看诚实度", "看复盘是否具体", "看后续行为是否改变"],
          simple: "我曾经在早期需求沟通里过于关注功能完整度，没有足够早地把验收目标和用户主流程讲清楚，导致后续讨论容易围绕页面细节发散。后来我调整了方法：在进入原型和功能列表前，先和团队确认用户任务、成功标准、必须闭环和暂不解决的问题。这个变化让我后续推进需求时更少返工，也更容易解释为什么某些功能要后置。",
          full: "我曾经在早期需求沟通里做得不够好的一点，是过于关注功能完整度，没有足够早地把验收目标和用户主流程讲清楚。\n\n当时大家很快进入页面和功能讨论，结果不同角色对第一版到底要证明什么理解不一致。设计会关注体验细节，研发会关注实现复杂度，业务方会不断补充希望展示的能力。问题不是大家不配合，而是我没有先把主流程和判断标准定得足够清楚。\n\n后来我调整了方法：在进入原型和功能列表前，先和团队确认四件事：用户任务是什么、成功标准是什么、第一版必须跑通哪条闭环、哪些问题这次明确不解决。之后再讨论页面、字段和实现方案。\n\n这个变化让我后续推进需求时更少返工，也更容易解释为什么某些功能要后置。我学到的是，产品经理不能只负责把需求写完整，更要先把判断标准讲清楚。",
          notes: "不要讲无法挽回的大失败。讲具体行为改变。",
          followups: [
            {
              question: "你怎么避免再次发生？",
              intent: "看复盘有没有转成稳定工作方法。",
              simple: "我现在会在写原型和功能列表前，先对齐用户任务、成功标准、最小闭环和本轮不解决的问题。",
              full: "我现在会把需求讨论前置到判断标准层面。进入原型和功能列表前，我会先和团队确认用户任务是什么、成功标准是什么、第一版必须跑通哪条闭环、哪些问题这轮明确不解决。这样后续即使有新需求，也能放回同一套标准里判断。",
            },
            {
              question: "这件事有没有影响交付？",
              intent: "看你是否诚实说明影响，同时不夸大。",
              simple: "它没有导致项目失败，但确实让早期讨论多了一些返工。我的收获是，范围不清会把协作成本推到后面。",
              full: "它没有导致项目失败，但确实让早期讨论多了一些返工，团队需要反复确认哪些是第一版必须做的、哪些只是增强。我的收获是，范围不清不会消失，只会把协作成本推到后面。所以我后来更早对齐主流程和验收标准。",
            },
          ],
        },
        en: {
          question: "Tell me about a failure or something you could have done better. What did you learn?",
          intent: ["Tests honesty", "Looks for concrete reflection", "Checks behavior change"],
          simple: "Earlier in my work, I sometimes focused too much on feature completeness before aligning the acceptance goal and main user flow. As a result, discussions could easily drift into page details. I changed my approach by aligning four things before prototypes and feature lists: the user task, the success criteria, the minimum workflow, and what we explicitly would not solve in this iteration. That helped reduce rework and made tradeoffs easier to explain.",
          full: "Earlier in my work, one thing I could have done better was focusing too much on feature completeness before aligning the acceptance goal and main user flow.\n\nThe team quickly moved into pages and features, but different roles did not share the same understanding of what the first version needed to prove. Design focused on experience details, engineering focused on implementation complexity, and business stakeholders kept adding things they wanted to show. The problem was not lack of collaboration. It was that I had not made the core workflow and decision criteria clear enough.\n\nI changed my approach. Before prototypes and feature lists, I now align four things with the team: what user task we are solving, what success means, which minimum workflow must work in this iteration, and which problems we will explicitly not solve yet.\n\nThis reduced rework in later projects and made it much easier to explain why some features should be postponed. I learned that a product manager should not only document requirements, but also make the judgment criteria visible.",
          notes: "Choose a recoverable failure and focus on behavior change.",
          followups: [
            {
              question: "How do you avoid this now?",
              intent: "Checks whether reflection became a repeatable method.",
              simple: "Before writing prototypes or feature lists, I align the user task, success criteria, minimum workflow, and what we will not solve in this iteration.",
              full: "I now move the discussion earlier to the judgment criteria. Before prototypes and feature lists, I align the user task, success criteria, minimum workflow, and what this iteration will explicitly not solve. Then when new requests appear, we can evaluate them against the same criteria.",
            },
            {
              question: "Did it affect delivery?",
              intent: "Checks honesty about impact without exaggeration.",
              simple: "It did not make the project fail, but it created extra rework in early discussions. I learned that unclear scope simply moves collaboration cost later.",
              full: "It did not make the project fail, but it did create extra rework in early discussions. The team had to repeatedly clarify what was required for the first version and what was only an enhancement. I learned that unclear scope does not disappear; it moves the collaboration cost later.",
            },
          ],
        },
      },
      {
        id: "conflict_persuasion",
        framework: "pg",
        category: { zh: "说服与冲突", en: "Persuasion" },
        mode: ["behavioral", "pg", "pressure"],
        difficulty: { zh: "核心", en: "Core" },
        zh: {
          question: "讲一个你说服别人接受你方案的例子。",
          intent: ["宝洁八大问说服题", "看你是否用证据、目标和取舍沟通"],
          simple: "我不会只说“我的方案更好”，而是先把争议转成共同目标。比如当功能范围有分歧时，我会回到用户主流程和验收标准，说明哪些功能直接影响闭环，哪些只是展示或增强。然后我会给出低成本替代方案，比如先用 Demo 支持客户沟通，把不适合标品化的部分控制在配置或项目定制里。",
          full: "我说服别人时，一般不会从“我的方案更好”开始，而是先把争议转成共同目标。\n\n比如在功能范围有分歧时，业务侧可能希望第一版展示得更完整，研发侧会担心复杂度和交付风险。我会先把讨论拉回用户主流程和验收标准：如果这个功能不做，核心闭环是否还能跑通；如果做了，它是提高验证价值，还是只是让页面看起来更丰富。\n\n对于必须支持对外沟通但不适合进入标准产品的部分，我会提出低成本替代方案，比如用 Demo、配置或项目定制先支撑客户展示，而不是直接把它变成第一版通用能力。\n\n这样沟通的重点就不是谁赢，而是大家一起判断：怎样用有限资源证明最关键的用户价值。",
          notes: "讲共同目标和替代方案，不要讲成强势压服。",
          followups: [
            {
              question: "如果对方仍然坚持呢？",
              intent: "看你是否能给出下一步，而不是停在分歧。",
              simple: "我会把分歧拆成可验证的问题：目标是什么、风险是什么、资源代价是什么。如果短期必须支持，我会先用低成本方案满足沟通，不轻易扩大标准产品范围。",
              full: "如果对方仍然坚持，我会把分歧拆成可验证的问题：这个需求服务哪个目标，不做的风险是什么，做的资源代价是什么，是否影响主流程。如果业务上短期必须支持，我会考虑低成本 Demo、配置或项目定制，但不会轻易把它扩大成标准产品范围。",
            },
            {
              question: "你怎么判断不是你错了？",
              intent: "看你是否能反向校准自己的判断。",
              simple: "我会看对方是否掌握我没有看到的用户证据、商业约束或交付风险。如果证据更强，我会调整方案。",
              full: "我会主动问自己是否遗漏了信息。比如对方是否有更直接的用户反馈、客户承诺、商业优先级或技术风险。如果这些证据说明我的判断不完整，我会调整方案。说服不是证明自己对，而是让团队基于更完整的信息做判断。",
            },
          ],
        },
        en: {
          question: "Tell me about a time you persuaded someone to accept your proposal.",
          intent: ["P&G persuasion question", "Tests evidence, shared goals, and tradeoff communication"],
          simple: "I do not usually start with 'my idea is better.' I first translate the disagreement into a shared goal. When scope is debated, I bring the team back to the user workflow and acceptance criteria: which features directly support the core loop, and which are mainly demos or enhancements. For needs that are useful for customer communication but not ready for the standard product, I suggest lower-cost alternatives such as demos, configuration, or project-specific handling.",
          full: "When I persuade others, I do not usually start with 'my idea is better.' I first translate the disagreement into a shared goal.\n\nFor example, when the team debates product scope, business stakeholders may want the first version to look more complete, while engineering worries about complexity and delivery risk. I bring the discussion back to the user workflow and acceptance criteria: if we do not build this feature, can the core loop still work; if we build it, does it help validate user value, or does it mainly make the product look richer?\n\nFor needs that are important for external communication but not ready for the standard product, I suggest lower-cost alternatives such as a demo, configuration, or project-specific handling, instead of turning them into first-version platform capabilities.\n\nThis way, the discussion is not about who wins. It becomes a shared judgment about how to prove the most important user value with limited resources.",
          notes: "Emphasize shared goals and alternatives, not force.",
          followups: [
            {
              question: "What if they still disagreed?",
              intent: "Shows a next step beyond disagreement.",
              simple: "I would turn the disagreement into verifiable questions: the goal, the risk of not doing it, and the delivery cost. If short-term support is required, I would use a lower-cost solution without expanding standard scope too early.",
              full: "If they still disagreed, I would turn the disagreement into verifiable questions: what goal the request serves, what risk we take if we do not build it, what delivery cost it creates, and whether it affects the core workflow. If short-term business support is required, I would consider a demo, configuration, or project-specific solution without expanding standard product scope too early.",
            },
            {
              question: "How do you know you were not wrong?",
              intent: "Checks whether you can recalibrate your judgment.",
              simple: "I would check whether the other person had stronger user evidence, business constraints, or delivery risks. If their evidence was stronger, I would adjust my proposal.",
              full: "I would actively check whether I had missed information. The other person may have more direct user feedback, customer commitments, business priorities, or technical risks. If that evidence shows my judgment is incomplete, I would adjust my proposal. Persuasion is not about proving I am right; it is about helping the team decide with better information.",
            },
          ],
        },
      },
      {
        id: "business_understanding",
        framework: "role",
        category: { zh: "公司与业务", en: "Company Fit" },
        mode: ["role", "warmup"],
        difficulty: { zh: "核心", en: "Core" },
        zh: {
          question: "你怎么理解这家公司和这个岗位的业务价值？",
          intent: ["看是否做了公司研究", "看是否能把岗位连接到业务痛点"],
          simple: "我会先把它理解成一个围绕真实工作流的效率产品，而不是单点工具。以 Trucker Path 为例，它公开信息里强调司机和车队的安全、效率和路上便利，产品覆盖 truck-safe navigation、停车/POI、fleet navigation、load board、文档管理、看板报表和 fuel controls。岗位价值不是单纯做页面，而是帮助用户在路线、停车、货源、运营和成本这些不确定场景里更快做判断。",
          full: "我会先把这家公司理解成一个围绕真实工作流的效率产品，而不是单点工具。\n\n以 Trucker Path 为例，它官网公开信息里强调司机和车队的安全、效率和路上便利，产品覆盖 truck-safe navigation、停车/POI、fleet navigation、load board、文档管理、看板报表和 fuel controls。这说明它不是只有 C 端司机 App，也有 fleet、broker 或更偏运营管理的场景。\n\n所以岗位价值不是单纯做页面，而是帮助用户在路线、停车、货源、运营和成本这些不确定场景里更快做判断。对产品经理来说，关键是理解用户任务、信息质量、流程闭环和不同业务线之间的数据含义。",
          notes: "公司研究要加事实边界：基于公开信息和当前理解。",
          followups: [
            {
              question: "你最想做哪个方向？",
              intent: "看你是否能结合背景选择切入点。",
              simple: "从我的背景看，我更适合复杂工作流、信息质量、B2B/Fleet 或 AI 辅助流程方向，但我也愿意接触司机端，因为它同样是任务驱动的实时决策产品。",
              full: "从我的背景看，我更适合复杂工作流、信息质量、B2B/Fleet 或 AI 辅助流程方向。因为我过去做过状态流、信息组织、MVP 范围和跨团队落地。但我也愿意接触司机端，因为它不是泛娱乐 C 端，而是任务驱动的实时决策产品，核心仍然是用户路径和信息可信度。",
            },
            {
              question: "你觉得这家公司最大的产品挑战是什么？",
              intent: "看是否能从公开信息提出产品判断。",
              simple: "基于公开信息，我会猜核心挑战是信息质量和多业务线协同：司机端信息要新且可信，Fleet/Loadboard 又要把这些信息转成运营流程。",
              full: "基于公开信息，我会猜核心挑战是信息质量和多业务线协同。司机端的路线、停车、POI、油价等信息要足够新、可信、可行动；Fleet 和 Loadboard 又要把这些信息转成运营、货源、文档和报表流程。产品难点不是有没有信息，而是信息能不能支持下一步决策。",
            },
          ],
        },
        en: {
          question: "How do you understand this company and the business value of this role?",
          intent: ["Checks company research", "Tests connection between role and business pain"],
          simple: "I would understand it as a workflow-efficiency product, not just a single tool. Taking Trucker Path as an example, its public website emphasizes safety, efficiency, and over-the-road convenience for drivers and fleets. It covers truck-safe navigation, parking and POI information, fleet navigation, load board, document management, dashboards and reports, and fuel controls. The product value is helping users make better decisions under uncertainty around routes, parking, freight, operations, and cost.",
          full: "I would understand the company as a workflow-efficiency product, not just a single tool.\n\nTaking Trucker Path as an example, its public website emphasizes safety, efficiency, and over-the-road convenience for drivers and fleets. It covers truck-safe navigation, parking and POI information, fleet navigation, load board, document management, dashboards and reports, and fuel controls. This suggests it is not only a driver-facing app, but also has fleet, broker, and operational-management scenarios.\n\nSo the value of the role is not simply building pages. It is helping users make better decisions under uncertainty around routes, parking, freight, operations, and cost. For a product manager, the key is to understand user tasks, information quality, workflow closure, and how data means different things across business lines.",
          notes: "Add a fact boundary: based on public information and current understanding.",
          followups: [
            {
              question: "Which product direction interests you most?",
              intent: "Checks whether you can choose an entry point based on your background.",
              simple: "Based on my background, I would be most interested in complex workflows, information quality, B2B/Fleet, or AI-assisted workflow areas. I am also open to the driver side because it is still a task-driven real-time decision product.",
              full: "Based on my background, I would be most interested in complex workflows, information quality, B2B/Fleet, or AI-assisted workflow areas. I have worked on state flows, information architecture, MVP scope, and cross-functional delivery. I am also open to the driver side because it is not a generic consumer app; it is a task-driven decision product where user flow and information trust matter a lot.",
            },
            {
              question: "What do you think is the biggest product challenge?",
              intent: "Checks whether you can form a product judgment from public information.",
              simple: "Based on public information, I would guess the core challenge is information quality and coordination across product lines: driver-side data must be fresh and trustworthy, while Fleet and Loadboard need to turn it into operational workflows.",
              full: "Based on public information, I would guess the core challenge is information quality and coordination across product lines. Driver-side information such as routes, parking, POI, and fuel prices must be fresh, trustworthy, and actionable. Fleet and Loadboard then need to turn that information into operations, freight, documents, and reporting workflows. The challenge is not just having information, but making it support the next decision.",
            },
          ],
        },
      },
      {
        id: "data_decision",
        framework: "pg",
        category: { zh: "数据判断", en: "Data Judgment" },
        mode: ["pg", "role"],
        difficulty: { zh: "中等", en: "Medium" },
        zh: {
          question: "讲一个你用数据或反馈做产品判断的例子。",
          intent: ["宝洁八大问数据判断", "看你是否能把指标和用户任务连接"],
          simple: "我不会只看一个总量指标，而是把数据放回用户任务里。比如信息质量类产品，我会同时看使用路径、失败反馈、更新时间、确认率、纠错率和投诉点。数据告诉我问题集中在哪里，用户反馈告诉我为什么这个问题重要，然后再决定是改展示、改流程，还是补充反馈入口。",
          full: "我不会只看一个总量指标，而是会把数据放回用户任务里。\n\n比如信息质量类产品，如果用户说“信息不准”，我不会直接判断要做 AI 或推荐模型。我会先看问题集中在哪些用户路径、哪些地区或时间段、信息距离上次更新多久、用户是否有纠错入口、纠错后有没有被确认，以及投诉点是否集中在某类场景。\n\n数据告诉我问题集中在哪里，用户反馈告诉我为什么这个问题重要。然后我再判断应该改展示、改流程、补充反馈入口，还是做更复杂的预测和自动化。\n\n这个方法适合很多业务场景：先把指标连接到用户任务，再决定产品动作。",
          notes: "不要只说 DAU、留存。讲任务成功和信息质量。",
          followups: [
            {
              question: "如果数据和用户反馈冲突怎么办？",
              intent: "看你是否能处理定量与定性冲突。",
              simple: "我不会马上判断谁对，而是先看样本和场景。数据可能掩盖局部高痛点，用户反馈也可能来自少数极端场景，需要拆到路径、用户分层和时间段里看。",
              full: "我不会马上判断数据或用户反馈谁对，而是先看样本和场景。数据可能看起来整体正常，但掩盖了某个高价值用户群或关键路径的痛点；用户反馈也可能来自少数极端场景。我的做法是拆到用户分层、具体路径、时间段和失败场景里，再决定是否需要补数据或做小实验。",
            },
            {
              question: "你会先看哪些指标？",
              intent: "看你是否能按场景选指标。",
              simple: "我会先看任务成功率、失败反馈、信息更新时间、确认率、纠错率和投诉集中点，而不是只看 DAU 或总留存。",
              full: "我会先看和用户任务直接相关的指标，比如任务成功率、关键路径掉点、失败反馈、信息更新时间、确认率、纠错率、投诉集中点。如果是信息质量场景，我会特别关注信息是否过期、是否被多人确认、用户失败后是否继续搜索或放弃。",
            },
          ],
        },
        en: {
          question: "Tell me about a time you used data or feedback to make a product decision.",
          intent: ["P&G-style data judgment", "Tests whether metrics connect to user tasks"],
          simple: "I do not rely on one aggregate metric alone. I put data back into the user task. For an information-quality product, I would look at the user path, failure feedback, last update time, confirmation rate, correction rate, and complaint clusters. Data tells me where the problem is concentrated; user feedback tells me why it matters. Then I decide whether to change presentation, workflow, feedback entry points, or more advanced automation.",
          full: "I do not rely on one aggregate metric alone. I put data back into the user task.\n\nFor example, in an information-quality product, if users say the information is inaccurate, I would not immediately jump to AI or a recommendation model. I would first look at where the issue is concentrated: which user paths, regions, or time windows; how long since the information was updated; whether users have a low-friction correction entry point; whether corrections are confirmed; and whether complaints cluster around specific scenarios.\n\nData tells me where the problem is concentrated. User feedback tells me why it matters. Then I decide whether to change the presentation, the workflow, the feedback mechanism, or a more advanced prediction or automation layer.\n\nThis method works across many product contexts: connect the metric to the user task first, then decide the product action.",
          notes: "Do not only mention DAU or retention. Talk about task success and information quality.",
          followups: [
            {
              question: "What if data and user feedback conflict?",
              intent: "Checks how you handle quantitative and qualitative conflict.",
              simple: "I would not immediately decide which side is right. Data may hide a painful local issue, and feedback may come from an extreme case. I would break it down by user segment, workflow step, time window, and failure scenario.",
              full: "I would not immediately decide that data or feedback is right. Data may look normal overall but hide a painful issue for a high-value segment or a critical path. User feedback may also come from an extreme scenario. I would break it down by user segment, workflow step, time window, and failure scenario, then decide whether we need more data or a small experiment.",
            },
            {
              question: "Which metrics would you check first?",
              intent: "Checks whether metrics are selected by scenario.",
              simple: "I would start with task success, failure feedback, last update time, confirmation rate, correction rate, and complaint clusters, rather than only DAU or overall retention.",
              full: "I would start with metrics tied directly to the user task: task success rate, key-path dropoff, failure feedback, last update time, confirmation rate, correction rate, and complaint clusters. For information-quality scenarios, I would focus on whether information is outdated, whether it has been confirmed by others, and what users do after a failed decision.",
            },
          ],
        },
      },
      {
        id: "domain_gap",
        framework: "role",
        category: { zh: "缺口应对", en: "Gap Handling" },
        mode: ["pressure", "role"],
        difficulty: { zh: "高压", en: "Pressure" },
        zh: {
          question: "你没有直接做过这个行业，为什么觉得自己能胜任？",
          intent: ["看诚实边界", "看迁移能力", "看学习方法"],
          simple: "我会诚实说明没有直接做过完全相同的行业，这也是我需要补的地方。但我不是从空白开始。我有复杂业务流程拆解、信息质量判断、状态流设计、PRD/原型/验收和跨团队推进经验。进入新领域时，我会先跑用户任务链路，看公开材料、历史需求、用户反馈和竞品，再通过一个小任务快速贡献价值。",
          full: "我会诚实说明，我没有直接做过完全相同的行业，这也是我需要补的地方。\n\n但我不是从空白开始。我过去做过复杂业务流程拆解、信息质量判断、状态流设计、PRD、原型、验收和跨团队推进。这些能力在很多任务驱动型产品里是可以迁移的。\n\n进入新领域时，我不会先背很多行业名词，而是先跑用户任务链路：用户是谁，在什么场景下做什么判断，需要哪些信息，下一步动作是什么，哪里会失败。然后我会看公开材料、历史需求、用户反馈、客服/运营记录和竞品，尽快通过一个小任务贡献价值，比如澄清一个流程、补一份需求文档的验收标准，或支持一次小迭代。\n\n所以我的回答不是“我已经懂”，而是“我知道差距在哪里，也有方法把差距补成可交付的产品动作”。",
          notes: "承认缺口，再讲方法和可迁移证据。",
          followups: [
            {
              question: "你第一周会怎么补课？",
              intent: "看学习计划是否具体。",
              simple: "我会先看产品文档、历史需求、用户反馈、竞品和数据看板，同时把核心用户路径跑一遍，再找产品、设计、运营或客服聊真实痛点。",
              full: "第一周我会做三件事。第一，看产品文档、历史需求、用户反馈、客服/运营记录、竞品和数据看板。第二，把核心用户路径自己跑一遍，记录哪里需要判断、哪里容易失败。第三，找产品、设计、运营、客服或销售聊，理解真实用户痛点和团队当前优先级。",
            },
            {
              question: "哪些能力不能迁移？",
              intent: "看你是否能诚实识别边界。",
              simple: "行业经验、用户语言、成熟 C 端增长经验和具体业务规则不能直接迁移，需要重新学习。但产品拆解、协作和信息质量判断可以迁移。",
              full: "不能直接迁移的是具体行业经验、用户语言、业务规则、成熟 C 端增长打法，以及目标市场的一线语境。这些需要重新学习和验证。能迁移的是产品拆解方法、跨团队协作、MVP 取舍、信息质量判断和把复杂流程转成可落地方案的能力。",
            },
          ],
        },
        en: {
          question: "You have not worked directly in this industry. Why do you think you can succeed?",
          intent: ["Checks honesty", "Tests transferable skills", "Looks for learning method"],
          simple: "I would be honest that I have not worked in the exact same domain, and that is a gap I need to close. But I am not starting from zero. I have experience in complex workflow breakdown, information-quality judgment, state-flow design, PRDs, prototypes, acceptance criteria, and cross-functional delivery. In a new domain, I first map the user task, read public materials, past requirements, feedback, and competitors, then contribute through a small concrete task.",
          full: "I would be honest that I have not worked in the exact same domain, and that is a gap I need to close.\n\nBut I am not starting from zero. I have experience in complex workflow breakdown, information-quality judgment, state-flow design, PRDs, prototypes, acceptance criteria, and cross-functional delivery. These capabilities transfer well to many task-driven products.\n\nWhen I enter a new domain, I do not start by memorizing industry terms. I first map the user task: who the user is, what decision they make, what information they need, what the next action is, and where the workflow can fail. Then I read public materials, past requirements, user feedback, support or operation records, and competitors. I try to contribute through a small concrete task quickly, such as clarifying a workflow, improving acceptance criteria, or supporting a focused iteration.\n\nSo my answer is not 'I already know everything.' It is 'I know where the gap is, and I have a method to turn that gap into product work.'",
          notes: "Acknowledge the gap, then prove method and transferability.",
          followups: [
            {
              question: "How would you learn in the first week?",
              intent: "Checks whether the learning plan is concrete.",
              simple: "I would read product docs, past requirements, user feedback, competitors, and dashboards, run through the core user journey myself, and talk to product, design, operations, or support to understand real pain points.",
              full: "In the first week, I would do three things. First, read product docs, past requirements, user feedback, support or operation records, competitors, and dashboards. Second, run through the core user journey myself and note where users make decisions or fail. Third, talk to product, design, operations, support, or sales to understand real user pain points and current priorities.",
            },
            {
              question: "Which skills are not transferable?",
              intent: "Checks whether you can honestly identify boundaries.",
              simple: "Specific domain experience, user language, mature consumer growth playbooks, and business rules are not directly transferable. I need to learn those. Product breakdown, collaboration, MVP tradeoffs, and information-quality judgment are transferable.",
              full: "Specific domain experience, user language, business rules, mature consumer growth playbooks, and local market context are not directly transferable. I need to learn and validate those. What is transferable is product breakdown, cross-functional collaboration, MVP tradeoffs, information-quality judgment, and turning complex workflows into executable product plans.",
            },
          ],
        },
      },
      {
        id: "reverse_questions",
        framework: "reverse",
        category: { zh: "反问问题", en: "Questions to Ask" },
        mode: ["reverse", "warmup"],
        difficulty: { zh: "基础", en: "Basic" },
        zh: {
          question: "你准备向面试官反问什么？",
          intent: ["看岗位理解", "看是否关注真实成功标准"],
          simple: "我会优先问三个方向：第一，这个岗位前 3-6 个月最希望解决什么问题；第二，团队现在最关注的是用户增长、核心路径转化、信息质量、企业客户交付，还是其他目标；第三，PM 平时如何获得用户反馈，并和设计、研发、数据或运营一起做取舍。",
          full: "我会优先问三个方向。\n\n第一，这个岗位前 3-6 个月最希望解决什么问题。这个问题能帮助我理解团队对新人的真实期待，而不只是岗位描述里的职责。\n\n第二，团队现在最关注的产品目标是什么：是用户增长、核心路径转化、信息质量、企业客户交付，还是其他业务目标。这样我可以更准确地理解岗位的业务优先级。\n\n第三，PM 平时如何获得用户反馈，并和设计、研发、数据或运营一起做取舍。我想了解团队的问题定义方式、协作节奏和产品判断标准。\n\n如果只能问一个，我会问：从您的视角看，这个岗位在前 90 天做成什么，您会觉得是一次成功的加入？",
          notes: "不要只问氛围。问成功标准和协作机制。",
          followups: [
            {
              question: "如果面试官已经讲过这个问题怎么办？",
              intent: "看你能否临场调整。",
              simple: "我会承接对方刚才的信息，换成更深入的问题，比如“刚才您提到信息质量，那前 90 天最希望 PM 先改善哪个具体环节？”",
              full: "如果面试官已经讲过，我不会重复问同一个问题，而是承接对方刚才的信息往下追。例如对方提到信息质量，我会问：那从您视角看，前 90 天最希望 PM 先改善哪个具体环节？是数据新鲜度、用户反馈入口、可信度展示，还是团队协作流程？",
            },
            {
              question: "哪些反问应该避免？",
              intent: "看反问是否成熟、不过早谈条件。",
              simple: "我会避免一上来问薪资、假期、是否加班，也避免问官网能直接查到的问题。更适合问成功标准、用户反馈和团队协作。",
              full: "我会避免一上来问薪资、假期、是否加班，或者问官网能直接查到的基础信息。也不适合问太空泛的问题，比如“公司文化怎么样”。更好的反问是围绕岗位成功标准、用户反馈来源、团队协作方式和当前业务优先级。",
            },
          ],
        },
        en: {
          question: "What questions would you ask the interviewer?",
          intent: ["Checks role understanding", "Shows focus on real success criteria"],
          simple: "I would ask three types of questions. First, what the team most wants this role to solve in the first three to six months. Second, whether the current priority is growth, core conversion, information quality, enterprise delivery, or something else. Third, how PMs collect user feedback and make tradeoffs with design, engineering, data, or operations.",
          full: "I would ask three types of questions.\n\nFirst, what the team most wants this role to solve in the first three to six months. This helps me understand the real expectations beyond the job description.\n\nSecond, what product goal matters most right now: growth, core-path conversion, information quality, enterprise customer delivery, or something else. This helps me understand the business priority of the role.\n\nThird, how PMs collect user feedback and make tradeoffs with design, engineering, data, or operations. I want to understand the team's problem-definition process, collaboration rhythm, and product judgment standards.\n\nIf I only had time for one question, I would ask: from your perspective, what would make the first 90 days successful for this role?",
          notes: "Do not only ask about culture. Ask about success criteria and collaboration.",
          followups: [
            {
              question: "What if the interviewer already covered this?",
              intent: "Checks whether you can adapt in the moment.",
              simple: "I would build on what they already said and ask a deeper version. For example: you mentioned information quality; in the first 90 days, which specific part would you want the PM to improve first?",
              full: "If the interviewer already covered it, I would not repeat the same question. I would build on their answer and ask a deeper version. For example, if they mentioned information quality, I might ask: from your perspective, in the first 90 days, which specific part would you want the PM to improve first: data freshness, feedback entry points, trust signals, or collaboration flow?",
            },
            {
              question: "Which questions should you avoid?",
              intent: "Checks maturity and timing.",
              simple: "I would avoid starting with salary, vacation, overtime, or basic facts that can be found on the website. Better questions focus on success criteria, user feedback, and team collaboration.",
              full: "I would avoid starting with salary, vacation, overtime, or basic facts that can be found on the company website. I would also avoid very vague questions like 'What is the culture like?' Better questions focus on success criteria, user feedback sources, collaboration style, and current business priorities.",
            },
          ],
        },
      },
    ],
    phraseBank: [
      {
        title: { zh: "开场与边界", en: "Opening and boundaries" },
        items: [
          { zh: "我先说结论，再补一个例子。", en: "I will start with the conclusion, then add one example." },
          { zh: "这个领域我还在补课，但我会从用户任务链路切入。", en: "I am still learning this domain, but I would start from the user task flow." },
          { zh: "我不会把自己包装成行业专家。", en: "I would not position myself as a domain expert." },
        ],
      },
      {
        title: { zh: "STAR/CAR 连接句", en: "STAR/CAR connectors" },
        items: [
          { zh: "当时的背景是...", en: "The context was..." },
          { zh: "我的具体动作有三步。", en: "My concrete actions had three steps." },
          { zh: "结果上，它帮助团队...", en: "As a result, it helped the team..." },
        ],
      },
      {
        title: { zh: "产品判断句", en: "Product judgment" },
        items: [
          { zh: "我不会先堆功能，而是先确认最小闭环。", en: "I would not start by adding features; I would first define the minimum loop." },
          { zh: "指标要放回用户任务里看。", en: "Metrics should be interpreted through the user task." },
          { zh: "第一版先验证最关键的用户价值。", en: "The first version should validate the most important user value." },
        ],
      },
    ],
    reviewFocus: [
      { zh: "我的核心经验，是把复杂业务流程拆成可推进的产品方案。", en: "My core experience is turning complex workflows into executable product plans." },
      { zh: "行业不同，但产品能力相关。", en: "The industry is different, but the product capabilities are relevant." },
      { zh: "我先确认用户任务、成功标准、最小闭环和暂不解决的问题。", en: "I first align on the user task, success criteria, minimum loop, and what we will not solve yet." },
      { zh: "公司背景要基于公开信息，并说明事实边界。", en: "Company understanding should be based on public information with a clear fact boundary." },
      { zh: "行为题用 STAR/CAR，不要变成抽象自我评价。", en: "Use STAR/CAR for behavioral questions; do not turn them into abstract self-evaluation." },
    ],
    companyResearch: {
      researchedAt: "2026-07-16",
      factBoundary: {
        zh: "以下是基于公开官网信息整理的样例。正式技能每次生成时应重新联网搜索并更新日期。",
        en: "The following sample is summarized from public official website information. The final skill should search the web again and update the date each time it generates a pack.",
      },
      sources: [
        {
          label: "Trucker Path official homepage",
          url: "https://truckerpath.com/",
          accessedAt: "2026-07-16",
        },
      ],
      cards: [
        {
          title: { zh: "公开定位", en: "Public positioning" },
          body: {
            zh: "官网把 Trucker Path 定位为面向 truckers 和 fleets 的平台，强调 driver safety、efficiency、over-the-road convenience。",
            en: "The official site positions Trucker Path as a platform for truckers and fleets, emphasizing driver safety, efficiency, and over-the-road convenience.",
          },
          interviewUse: {
            zh: "面试中可以把它理解成任务驱动型效率产品，不是泛内容社区。",
            en: "In interviews, frame it as a task-driven efficiency product, not a generic content community.",
          },
        },
        {
          title: { zh: "产品矩阵", en: "Product matrix" },
          body: {
            zh: "公开页面展示 truck GPS/navigation、trucker map、advanced trip planning、fleet navigation、load board、doc management、dashboards/reports、fuel discounts/controls。",
            en: "The public site shows truck GPS/navigation, trucker map, advanced trip planning, fleet navigation, load board, doc management, dashboards/reports, and fuel discounts/controls.",
          },
          interviewUse: {
            zh: "可以把岗位价值连接到司机决策、车队运营、货源匹配和文档/报表流程。",
            en: "Connect the role value to driver decisions, fleet operations, load matching, and document/report workflows.",
          },
        },
        {
          title: { zh: "规模信号", en: "Scale signals" },
          body: {
            zh: "官网展示 11M+ downloads、5B+ miles routed、100M+ monthly check-ins、1M+ monthly active users。",
            en: "The site displays 11M+ downloads, 5B+ miles routed, 100M+ monthly check-ins, and 1M+ monthly active users.",
          },
          interviewUse: {
            zh: "这些数字可以支持“信息质量、实时反馈、信任机制和运营效率”这类产品判断。",
            en: "These numbers support product discussions around information quality, real-time feedback, trust mechanisms, and operational efficiency.",
          },
        },
        {
          title: { zh: "AI 与信息质量", en: "AI and information quality" },
          body: {
            zh: "官网提到 AI-powered load matching 和 over-the-road AI tools。面试里应把 AI 放在具体流程节点，而不是泛聊天入口。",
            en: "The site mentions AI-powered load matching and over-the-road AI tools. In interviews, place AI in concrete workflow nodes instead of a generic chat entry.",
          },
          interviewUse: {
            zh: "稳妥说法：AI 可以辅助匹配、总结、结构化和异常识别，但重要判断要可解释、可确认。",
            en: "A safe framing: AI can support matching, summarization, structuring, and anomaly detection, while important judgments should be explainable and confirmable.",
          },
        },
      ],
    },
  };

  if (typeof window !== "undefined") {
    window.INTERVIEW_PREP_DATA = INTERVIEW_PREP_DATA;
  }
  if (typeof module !== "undefined") {
    module.exports = { INTERVIEW_PREP_DATA };
  }
})();
