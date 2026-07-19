(function () {
  const INTERVIEW_PREP_DATA = {
    meta: {
      company: "新橙科技 / Alpha",
      role: "AI 产品经理",
      round: "业务一面 · AI 产品经验与法律行业迁移",
      defaultLanguage: "zh",
      generatedAt: "2026-07-19",
      coreLine: {
        zh: "我先讲结论：我不是法律行业专家，但我做过 B 端 AI 闭环设计，能把复杂任务拆成可信知识源、结构化输出、人工确认和可验收流程。",
        en: "My short answer: I am not a legal-domain expert yet, but I have built B2B AI workflow designs around trusted knowledge, structured output, human confirmation, and measurable acceptance.",
      },
      boundary: {
        zh: "答案只基于你提供的简历、JD 截图和本地面试材料。AI 相关经历按“产品侧方案验证 / Demo / POC 设计”表达，不包装成算法训练或生产全量上线；公司信息基于 2026-07-19 可检索公开资料，官网请后续确认。",
        en: "Answers are based only on your resume, the JD screenshots, and local interview notes. AI experience is framed as product-side solution validation / demo / POC design, not model training or full production rollout. Company facts are based on public research available on 2026-07-19; the official website should still be confirmed.",
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
      { id: "ai", zh: "AI 专项", en: "AI Deep Dive" },
      { id: "pressure", zh: "压力追问", en: "Pressure" },
      { id: "reverse", zh: "反问准备", en: "Reverse Questions" },
    ],
    questionFrameworks: [
      {
        id: "behavioral",
        zh: "行为与开场",
        en: "Behavioral and opening",
        guide: {
          zh: "先给岗位定位，再用一个真实项目证明能力；回答不要超过 90 秒。",
          en: "Position yourself first, then prove the fit with one real project; keep answers under 90 seconds.",
        },
      },
      {
        id: "role",
        zh: "岗位业务匹配",
        en: "Role and business fit",
        guide: {
          zh: "把 JD 的法律 AI 场景翻译成你做过的 B 端 AI 产品方法，不硬说自己懂法律。",
          en: "Translate the legal-AI JD into your B2B AI product method without overstating legal expertise.",
        },
      },
      {
        id: "ai",
        zh: "AI 产品专项",
        en: "AI product deep dive",
        guide: {
          zh: "重点讲 Agent/RAG/Workflow、输出 Schema、低置信兜底、人工确认和 bad case 验收。",
          en: "Focus on Agent/RAG/Workflow, output schema, low-confidence fallback, human confirmation, and bad-case validation.",
        },
      },
      {
        id: "pg",
        zh: "领导力与取舍",
        en: "Leadership and tradeoffs",
        guide: {
          zh: "用 STAR/CAR 讲目标、动作、取舍和结果，避免抽象评价自己。",
          en: "Use STAR/CAR to show goal, actions, tradeoffs, and results instead of abstract self-evaluation.",
        },
      },
      {
        id: "reverse",
        zh: "反问问题",
        en: "Questions to ask",
        guide: {
          zh: "围绕法律 AI 产品的成功标准、知识源、验收、研发协作和前 90 天期待来问。",
          en: "Ask about success criteria, knowledge sources, validation, R&D collaboration, and first-90-day expectations for legal AI products.",
        },
      },
    ],
    questions: [
      {
        id: "self_intro_60",
        framework: "behavioral",
        category: { zh: "开场定位", en: "Opening" },
        mode: ["warmup", "behavioral", "role"],
        difficulty: { zh: "核心", en: "Core" },
        zh: {
          question: "请做一个 60 秒自我介绍，重点贴合这个 AI 产品经理岗位。",
          intent: ["快速建立 B 端 AI PM 定位", "突出最相关项目", "控制表达长度"],
          simple: "您好，我是李沛宣，目前在 DataMesh 做 B 端产品经理，主线是设施运维 SaaS、数字孪生和 AI 产品化。我最相关的经验，是把分散的设备、告警、工单和知识库，设计成 Agent/RAG 辅助诊断到工单草稿的闭环。这个岗位虽然是法律科技场景，但同样核心是可信知识源、结构化输出、人工确认和数据迭代。我能迁移的是复杂任务拆解、AI 能力边界、研发协作和 POC 到交付的产品化能力。",
          full: "您好，我是李沛宣，目前在 DataMesh 做 B 端产品经理，主线是设施运维 SaaS、数字孪生和 AI 产品化。\n\n我最相关的项目是 Inspector 设施运维产品底座。我负责把设备、空间、告警、工单、SOP 和知识库这些分散对象，拆成可复用的产品流程，并设计 Agent/RAG 辅助诊断、处置建议、工单草稿、低置信兜底和人工确认机制。\n\n我理解这个岗位不是简单做一个 AI 聊天框，而是把法律人的问答、知识库、写作、合同审查、问卷等任务变成可用、可信、可迭代的产品流程。法律行业我需要补课，但我能带来的是 B 端 AI 闭环设计、复杂流程抽象、PRD/验收和跨研发推进能力。",
          notes: "目标 60-75 秒。不要展开所有项目，只保留 Inspector + 迁移能力。",
          followups: [
            {
              question: "你和这个岗位最匹配的地方是什么？",
              intent: "要求一句话提炼价值。",
              simple: "最匹配的是 B 端 AI 闭环设计能力：我知道怎么把业务场景拆成知识源、Agent 分工、输出协议、兜底机制和验收标准。",
              full: "最匹配的是 B 端 AI 闭环设计能力。这个岗位要做法律问答、AI 知识库、文本写作、合同审查这类产品，关键不是接模型，而是让输出可信、可解释、可确认。我过去做过类似的产品侧拆解，能把业务场景转成 PRD、原型、输出 Schema、验收标准和研发协作语言。",
            },
            {
              question: "能更短吗？",
              intent: "测试你是否能压缩表达。",
              simple: "可以。我是 B 端 AI 产品经理，做过设施运维 Agent/RAG 闭环设计。法律行业我需要补课，但 AI 产品化的方法相关：可信知识源、结构化输出、人工确认和可验收流程。",
              full: "可以。我是 B 端 AI 产品经理，核心经验是把复杂业务流程做成可交付的 AI 产品闭环。做过设施运维 Agent/RAG、工单草稿、低置信兜底和人工确认。法律行业我会补课，但产品方法和岗位要求高度相关。",
            },
          ],
        },
        en: {
          question: "Please give a 60-second self-introduction tailored to this AI Product Manager role.",
          intent: ["Position yourself as a B2B AI PM", "Use the most relevant project", "Keep it concise"],
          simple: "Hi, I am Jane Li, currently a B2B product manager at DataMesh, focusing on facility operations SaaS, digital twins, and AI productization. My most relevant experience is designing an Agent/RAG workflow that connects equipment data, alerts, work orders, SOPs, and knowledge bases into an assisted diagnosis and work-order draft loop. Although this role is in legal tech, the core product logic is similar: trusted knowledge sources, structured output, human confirmation, and data-driven iteration.",
          full: "Hi, I am Jane Li, currently a B2B product manager at DataMesh, focusing on facility operations SaaS, digital twins, and AI productization.\n\nMy most relevant project is the Inspector facility operations product foundation. I worked on turning equipment, spaces, alerts, work orders, SOPs, and knowledge bases into reusable product workflows, and designed Agent/RAG-based assisted diagnosis, recommended actions, work-order drafts, low-confidence fallback, and human confirmation.\n\nI understand this role is not about building a generic AI chatbot. It is about making legal Q&A, knowledge bases, writing, contract review, and questionnaire products usable, trustworthy, and measurable. I need to learn the legal domain, but I can transfer B2B AI workflow design, complex product abstraction, PRD/acceptance work, and cross-functional execution.",
          notes: "Aim for 60-75 seconds. Keep only Inspector plus transferable strengths.",
          followups: [
            {
              question: "What is your strongest fit for this role?",
              intent: "Forces one-line positioning.",
              simple: "My strongest fit is B2B AI workflow design: I can break a business scenario into knowledge sources, Agent roles, output contracts, fallback logic, and acceptance criteria.",
              full: "My strongest fit is B2B AI workflow design. For legal Q&A, AI knowledge bases, writing, and contract review, the key is not just connecting a model. The key is making outputs trustworthy, explainable, confirmable, and measurable. I have done similar product-side breakdowns and can turn them into PRDs, prototypes, output schema, acceptance criteria, and R&D alignment.",
            },
            {
              question: "Can you make it shorter?",
              intent: "Tests concise delivery.",
              simple: "Sure. I am a B2B AI product manager with experience designing an Agent/RAG workflow for facility operations. I need to learn legal tech, but the product method is relevant: trusted knowledge, structured output, human confirmation, and measurable workflow.",
              full: "Sure. I am a B2B AI product manager focused on turning complex workflows into deliverable AI product loops. I have designed Agent/RAG diagnosis, work-order drafts, fallback, and human confirmation. Legal tech is a domain I need to learn, but the AI product method is highly transferable.",
            },
          ],
        },
      },
      {
        id: "ai_experience_gap",
        framework: "ai",
        category: { zh: "AI 经验边界", en: "AI boundary" },
        mode: ["warmup", "ai", "pressure"],
        difficulty: { zh: "高压", en: "Pressure" },
        zh: {
          question: "你说自己有 AI 产品经验，具体做到什么程度？上线了吗？",
          intent: ["验证真实性", "看是否夸大 AI 经历", "看产品侧贡献是否清楚"],
          simple: "我会准确说：这部分不是我负责模型训练，也不包装成大规模全量上线；我做的是产品侧方案验证和 Demo/POC 设计。具体包括业务流程拆解、Agent 分工、RAG 知识源、Prompt/输出协议、Schema、低置信兜底、人工确认、bad case 验收和反馈回流。这些能进入研发评审和客户验证，不是只停留在概念。",
          full: "我会先把边界讲清楚：这部分不是我负责模型训练，也不会包装成大规模生产全量上线。更准确的说法是，我参与的是产品侧方案验证、Demo/POC 设计和可交付能力规划。\n\n我具体做的是把业务场景拆成 AI 能理解和能被系统约束的流程。比如在设施运维里，先定义告警、设备、时序、历史工单、SOP 和工单这些业务对象，再设计 Agent 分工、RAG 知识源、输出 JSON、置信度、warnings、人工确认和 bad case 验收。\n\n所以我的价值不是算法实现，而是把 AI 能力从“想法”变成研发可评审、测试可验收、客户能理解的产品闭环。",
          notes: "这题必须先讲边界，再讲专业度。",
          followups: [
            {
              question: "那你不是只有概念吗？",
              intent: "压力测试真实贡献。",
              simple: "不是。我产出的不是概念词，而是输入字段、知识源优先级、Agent 角色、输出 Schema、兜底分支、人工确认和验收脚本。",
              full: "不是。我不会只说 Agent、RAG 这些概念。我会落到产品协议：输入有哪些字段，知识源优先级是什么，Agent 能调用哪些工具，输出 JSON 长什么样，低置信怎么处理，哪些动作必须人工确认，bad case 怎么验收和回流。",
            },
            {
              question: "如果面试官追问线上指标怎么办？",
              intent: "避免穿帮，转向阶段性验收。",
              simple: "我会说这块更适合讲方案验证指标，比如 Schema 合规、引用正确、低置信兜底、人工修改率和场景脚本通过率，不硬讲线上准确率。",
              full: "我会说如果还没有全量线上运行，就不硬讲线上准确率。我会用方案验证指标表达：结构化输出是否合规、引用是否正确、低置信是否兜底、是否触发人工确认、人工修改率如何、场景脚本和 bad case 是否通过。",
            },
          ],
        },
        en: {
          question: "You mentioned AI product experience. What exactly did you do, and was it launched?",
          intent: ["Checks authenticity", "Tests whether AI experience is overstated", "Clarifies product-side contribution"],
          simple: "I would frame it accurately: I did not train models, and I would not claim a full-scale production rollout. My work was product-side solution validation and demo/POC design. It included workflow breakdown, Agent roles, RAG knowledge sources, prompt/output contracts, schema, low-confidence fallback, human confirmation, bad-case validation, and feedback loops.",
          full: "I would start with the boundary. I did not train models, and I would not claim a full-scale production rollout. The accurate framing is product-side solution validation, demo/POC design, and deliverable capability planning.\n\nMy work was to translate the business scenario into a workflow that AI could understand and the system could constrain. In facility operations, that meant defining business objects such as alerts, equipment, time-series data, historical work orders, SOPs, and work orders, then designing Agent roles, RAG knowledge sources, output JSON, confidence, warnings, human confirmation, and bad-case validation.\n\nSo my value was not algorithm implementation. It was turning AI capability from an idea into a product loop that R&D can review, QA can validate, and customers can understand.",
          notes: "State the boundary first, then show product depth.",
          followups: [
            {
              question: "Wasn't that just conceptual?",
              intent: "Pressure-tests concrete contribution.",
              simple: "No. The outputs were concrete product contracts: input fields, knowledge-source priority, Agent roles, output schema, fallback paths, human confirmation, and validation scripts.",
              full: "No. I would not stop at concepts like Agent or RAG. I translate them into product contracts: what input fields are needed, what knowledge sources are trusted first, what tools the Agent can call, what the output JSON looks like, how low confidence is handled, what requires human confirmation, and how bad cases are tested and fed back.",
            },
            {
              question: "What if they ask for online metrics?",
              intent: "Avoid overclaiming; move to validation metrics.",
              simple: "I would not invent online accuracy. I would use validation metrics such as schema compliance, citation correctness, fallback coverage, human modification rate, and scenario-script pass rate.",
              full: "If it was not fully running at scale, I would not invent online accuracy. I would explain validation-stage metrics: structured output compliance, citation correctness, whether low-confidence cases fallback correctly, whether high-risk actions require human confirmation, human modification rate, and bad-case pass rate.",
            },
          ],
        },
      },
      {
        id: "transfer_to_legal_ai",
        framework: "role",
        category: { zh: "法律行业迁移", en: "Domain transfer" },
        mode: ["role", "pressure"],
        difficulty: { zh: "核心", en: "Core" },
        zh: {
          question: "你没有法律行业经验，怎么迁移到法律 AI 产品？",
          intent: ["承认行业缺口", "证明迁移方法", "把设施运维经验转成法律任务流"],
          simple: "我会先承认法律行业需要补课，尤其是专业语境和合规风险。但这个岗位的底层能力和我做过的 B 端 AI 很相关：法律人也有任务链路、可信知识源、输出格式、复核机制和沉淀闭环。我会先从合同审查或法律问答这样的具体任务切入，拆用户、场景、知识源、输出标准和风险兜底，再补行业规则。",
          full: "我会先承认差距：法律行业的用户语言、专业规则、合规边界和风险责任都需要系统补课。\n\n但这个岗位的产品底层能力和我做过的 B 端 AI 是相关的。设施运维里，我们要处理告警、设备、SOP、历史工单和人工确认；法律 AI 里，也要处理法规、案例、合同范本、企业私域知识、审查清单、引用来源和律师/法务复核。两者都不是泛聊天，而是专业任务流。\n\n所以我会先选一个具体任务，比如合同审查，拆清楚用户是谁、上传什么材料、用哪些知识源、输出什么结构、什么情况下不能确定回答、什么内容必须人工确认。行业细节我补，但产品拆解和 AI 可控落地的方法可以迁移。",
          notes: "不要说“行业都一样”。说底层方法相关，领域知识需要补。",
          followups: [
            {
              question: "第一周你怎么补法律行业？",
              intent: "看学习路径具体不具体。",
              simple: "我会先读产品文档、审查清单、典型合同样例、用户反馈和竞品，再约业务/法务专家跑 3 个真实任务流。",
              full: "第一周我会先读产品文档、审查清单、典型合同样例、用户反馈、客服问题和竞品。然后找业务、法务专家或资深 PM 跑 3 个真实任务流：法律问答、合同审查、文本写作。目标不是立刻变专家，而是知道用户怎么判断、哪里高风险、产品在哪些节点必须可解释。",
            },
            {
              question: "法律行业和设施运维最大的不同是什么？",
              intent: "看是否识别行业特殊性。",
              simple: "法律文本的解释风险更高，结论需要依据和责任边界；所以更要强调引用来源、审查清单、人工复核和不可确定时的拒答。",
              full: "最大的不同是法律文本的解释风险和责任边界更强。设施运维里错误建议可能影响现场处置，法律场景里错误结论可能影响合同风险、案件判断或合规责任。所以法律 AI 更要强调引用来源、审查清单、适用范围、人工复核，以及不可确定时明确拒答或提示补充材料。",
            },
          ],
        },
        en: {
          question: "You do not have legal-industry experience. How would you transfer into legal AI products?",
          intent: ["Acknowledges the domain gap", "Proves learning method", "Maps facility AI to legal workflows"],
          simple: "I would first acknowledge the gap: legal language, rules, and compliance risk need to be learned. But the underlying B2B AI product logic is relevant. Legal professionals also work with task flows, trusted knowledge sources, output formats, review mechanisms, and knowledge loops. I would start from a concrete task such as contract review or legal Q&A, map the user, scenario, knowledge sources, output standards, and fallback logic, then learn domain rules with experts.",
          full: "I would first acknowledge the gap. Legal user language, professional rules, compliance boundaries, and risk responsibility all need serious learning.\n\nBut the underlying product capability is relevant. In facility operations, we handle alerts, equipment, SOPs, historical work orders, and human confirmation. In legal AI, the equivalents are laws, cases, contract templates, enterprise private knowledge, review checklists, citations, and lawyer or legal-team review. Both are professional task flows, not generic chat.\n\nSo I would start from one concrete task, such as contract review. I would clarify who the user is, what material they upload, which knowledge sources are trusted, what structured output is needed, when the system must not give a definitive answer, and what must be confirmed by a human. I need to learn the legal details, but the product method transfers.",
          notes: "Do not say all industries are the same. Say the method transfers and the domain must be learned.",
          followups: [
            {
              question: "How would you learn legal tech in the first week?",
              intent: "Checks for a concrete learning plan.",
              simple: "I would read product docs, review checklists, sample contracts, user feedback, and competitors, then walk through three real task flows with business or legal experts.",
              full: "In the first week, I would read product docs, review checklists, sample contracts, user feedback, support issues, and competitors. Then I would walk through three real task flows with business, legal experts, or senior PMs: legal Q&A, contract review, and legal writing. The goal is not to become an expert immediately, but to understand user decisions, risk points, and where the product must be explainable.",
            },
            {
              question: "What is the biggest difference between legal tech and facility operations?",
              intent: "Checks domain sensitivity.",
              simple: "Legal text has higher interpretation risk and responsibility boundaries, so citations, review checklists, human review, and refusal when uncertain matter even more.",
              full: "The biggest difference is the interpretation risk and responsibility boundary of legal text. In facility operations, a wrong recommendation may affect onsite handling. In legal AI, a wrong conclusion may affect contract risk, case judgment, or compliance responsibility. So citations, review checklists, applicability boundaries, human review, and refusal or missing-information prompts are even more important.",
            },
          ],
        },
      },
      {
        id: "contract_review_approach",
        framework: "ai",
        category: { zh: "合同审查产品", en: "Contract review" },
        mode: ["ai", "role"],
        difficulty: { zh: "核心", en: "Core" },
        zh: {
          question: "如果让你规划一个 AI 合同审查功能，你会怎么做？",
          intent: ["看产品规划方法", "看是否懂法律 AI 风险", "看能否从任务流而非模型出发"],
          simple: "我不会先从“接哪个模型”开始，而是先拆任务闭环：上传合同和交易背景，识别合同类型和关键条款，匹配审查清单、法规/案例/模板和企业私域规则，输出风险等级、依据、修改建议和可追溯引用。产品上要有结构化结果、人工复核、版本对比、低置信提示和企业模板沉淀。",
          full: "我会先从任务闭环出发，而不是先问接哪个模型。\n\n第一步是定义输入：合同文本、交易背景、合同类型、甲乙方角色、企业审查规则和历史模板。第二步是定义知识源：法规、案例、合同范本、企业私域条款库、审查清单和历史修改意见。第三步是定义输出：风险点、风险等级、依据引用、修改建议、替换条款、缺失信息和人工复核标记。\n\n产品机制上，我会强调四点：结果必须结构化，便于筛选和写回；每条建议要有来源或审查规则；低置信或材料不足时不强给结论；高风险条款要进入人工复核和版本对比。这样 AI 才是审查流程里的效率工具，而不是不可控的文本生成。",
          notes: "用“输入-知识源-输出-机制”四步回答，很稳。",
          followups: [
            {
              question: "怎么避免模型乱改合同？",
              intent: "看风险控制意识。",
              simple: "不让模型直接覆盖原文。先生成建议和替换文本，由用户确认；同时用审查清单、引用来源、风险等级和版本对比控制。",
              full: "我不会让模型直接覆盖原合同。产品上应先生成风险说明和建议替换文本，由用户确认后再应用。机制上用审查清单限定问题类型，用引用来源支撑判断，用风险等级做优先级，用版本对比显示变化，并保留人工修改记录。",
            },
            {
              question: "第一版 MVP 做哪些？",
              intent: "看范围收敛。",
              simple: "第一版先做一个高频合同类型、核心风险清单、结构化风险输出、引用依据、修改建议和人工确认，不追求全合同全场景。",
              full: "第一版我会收敛到一个高频合同类型，比如采购或服务合同，先覆盖核心风险清单、结构化风险输出、引用依据、修改建议、版本对比和人工确认。暂时不做全合同类型、全自动改写和复杂审批集成，先验证审查效率和建议可信度。",
            },
          ],
        },
        en: {
          question: "How would you plan an AI contract review feature?",
          intent: ["Tests product planning", "Checks legal-AI risk awareness", "Looks for workflow-first thinking"],
          simple: "I would not start with which model to use. I would first map the task loop: contract and transaction background upload, contract type and key-clause identification, matching review checklists, laws/cases/templates, and enterprise private rules, then output risk level, rationale, suggested edits, and traceable citations. Product mechanisms should include structured results, human review, version comparison, low-confidence prompts, and enterprise template learning.",
          full: "I would start from the task loop, not from the model.\n\nFirst, define inputs: contract text, transaction background, contract type, party role, enterprise review rules, and historical templates. Second, define knowledge sources: laws, cases, contract templates, private clause libraries, review checklists, and historical revisions. Third, define outputs: risk points, risk levels, cited rationale, suggested edits, replacement clauses, missing information, and human-review flags.\n\nProduct mechanisms matter. The result should be structured so users can filter and write it back. Each suggestion should be supported by a source or review rule. If confidence is low or materials are missing, the system should not force a conclusion. High-risk clauses should go through human review and version comparison. That makes AI an efficiency layer in the review workflow, not uncontrolled text generation.",
          notes: "Answer with four steps: input, knowledge sources, output, mechanisms.",
          followups: [
            {
              question: "How would you prevent the model from rewriting contracts incorrectly?",
              intent: "Tests risk-control thinking.",
              simple: "I would not let the model overwrite the contract directly. It should generate suggestions and replacement text for user confirmation, with checklists, citations, risk levels, and version comparison.",
              full: "I would not let the model overwrite the contract directly. It should first generate risk explanations and suggested replacement text, then the user confirms before applying changes. The product should use review checklists to constrain issue types, citations to support judgment, risk levels for prioritization, version comparison to show changes, and edit history for auditability.",
            },
            {
              question: "What would be in the first MVP?",
              intent: "Checks scope discipline.",
              simple: "I would pick one high-frequency contract type and cover core risk checks, structured output, citations, suggested edits, version comparison, and human confirmation.",
              full: "For the first MVP, I would pick one high-frequency contract type, such as procurement or service agreements. I would cover core risk checklists, structured risk output, cited rationale, suggested edits, version comparison, and human confirmation. I would not try to support every contract type, fully automatic rewriting, or complex approval integration in version one.",
            },
          ],
        },
      },
      {
        id: "rag_trust_safety",
        framework: "ai",
        category: { zh: "RAG 与可信输出", en: "RAG and trust" },
        mode: ["ai", "pressure"],
        difficulty: { zh: "高压", en: "Pressure" },
        zh: {
          question: "法律 AI 里 RAG / 知识库怎么设计，如何控制幻觉？",
          intent: ["看 AI 产品专业度", "看可信知识源治理", "看兜底机制"],
          simple: "我会把 RAG 理解成知识源治理，不是上传文档。法律场景至少要分法规、案例、合同范本、企业私域制度、审查清单和历史修改意见；输出必须带引用和适用边界。幻觉控制不是只靠 Prompt，而是 Schema 校验、来源引用、事实优先级、低置信兜底、人工复核和 bad case 回归。",
          full: "我会把 RAG 理解成知识源治理，而不是把文档上传给模型。\n\n法律场景的知识源要分层：法规和司法解释、案例、合同范本、企业私域制度、审查清单、历史修改意见和用户自己的材料。不同来源要有优先级和适用范围，比如企业审查规则可能优先于通用模板，但不能覆盖强制性法律要求。\n\n幻觉控制不能只靠 Prompt。我会做几层机制：输出必须结构化并通过 Schema；结论要有引用来源；没有召回有效依据时降置信或拒答；高风险建议进入人工复核；bad case 要回归到知识库、检索策略、Prompt 或产品流程里迭代。",
          notes: "把“可信”讲成产品机制，不要只说技术名词。",
          followups: [
            {
              question: "如果法规和企业模板冲突怎么办？",
              intent: "看事实优先级。",
              simple: "要有事实优先级和冲突提示。强制性法规优先，企业模板作为业务规则参考；冲突时不能静默采用，要提示用户确认。",
              full: "需要事实优先级和冲突提示。强制性法规和司法解释优先，企业模板或历史合同更多是业务规则参考。如果两者冲突，系统不能静默采用某一方，而要展示冲突、说明来源，并要求用户或法务专家确认。",
            },
            {
              question: "bad case 怎么沉淀？",
              intent: "看迭代闭环。",
              simple: "先分类是知识缺失、检索错误、Prompt 越界、Schema 不足还是产品流程问题，再决定补知识、改检索、改输出协议或加人工确认。",
              full: "我会先给 bad case 分类：是知识缺失、检索错误、引用不准、Prompt 越界、Schema 不足，还是产品流程没有让用户补充必要信息。不同类型对应不同动作：补知识、调检索、改输出协议、加缺失信息提示，或增加人工确认。",
            },
          ],
        },
        en: {
          question: "How would you design RAG / knowledge bases in legal AI, and how would you control hallucination?",
          intent: ["Tests AI product depth", "Checks trusted knowledge governance", "Looks for fallback mechanisms"],
          simple: "I see RAG as knowledge governance, not just uploading documents. Legal AI should separate laws, cases, contract templates, enterprise private policies, review checklists, and historical revisions. Outputs need citations and applicability boundaries. Hallucination control is not just prompting: it needs schema validation, citations, fact priority, low-confidence fallback, human review, and bad-case regression.",
          full: "I see RAG as knowledge governance, not just uploading documents to a model.\n\nIn legal AI, knowledge sources should be layered: laws and judicial interpretations, cases, contract templates, enterprise private policies, review checklists, historical revisions, and user-provided materials. Different sources need priority and applicability. For example, enterprise review rules may be prioritized over generic templates, but they cannot override mandatory legal requirements.\n\nHallucination control cannot rely only on prompts. I would design several layers: structured output with schema validation, citations for conclusions, low-confidence fallback or refusal when no valid source is retrieved, human review for high-risk suggestions, and bad-case feedback into the knowledge base, retrieval strategy, prompt, or product workflow.",
          notes: "Explain trust as product mechanisms, not only technical terms.",
          followups: [
            {
              question: "What if laws and enterprise templates conflict?",
              intent: "Tests fact priority.",
              simple: "There should be fact priority and conflict alerts. Mandatory laws come first; enterprise templates are business rules. If they conflict, the system should surface it and ask for confirmation.",
              full: "There should be fact priority and conflict alerts. Mandatory laws and judicial interpretations come first, while enterprise templates or historical contracts are business-rule references. If they conflict, the system should not silently choose one. It should show the conflict, cite sources, and ask the user or legal expert to confirm.",
            },
            {
              question: "How would you turn bad cases into improvement?",
              intent: "Checks iteration loop.",
              simple: "Classify whether it is missing knowledge, wrong retrieval, prompt overreach, schema gap, or workflow issue, then fix the corresponding layer.",
              full: "I would classify each bad case first: missing knowledge, wrong retrieval, inaccurate citation, prompt overreach, schema gap, or missing user information in the workflow. Different causes lead to different actions: add knowledge, tune retrieval, change output contracts, add missing-information prompts, or require human confirmation.",
            },
          ],
        },
      },
      {
        id: "roadmap_priority",
        framework: "pg",
        category: { zh: "路线图与优先级", en: "Roadmap" },
        mode: ["pg", "role"],
        difficulty: { zh: "核心", en: "Core" },
        zh: {
          question: "如果同时有问答 GPT、知识库、合同审查、文本写作、问卷几个方向，你怎么排优先级？",
          intent: ["看路线图判断", "看商业和研发取舍", "看是否能收敛范围"],
          simple: "我会按四个维度排：目标客户的高频痛点、能否形成可验证闭环、知识源和数据是否准备好、商业窗口和复用度。第一版不建议所有方向并行摊开，而是选一个最能证明价值的任务，比如合同审查或法律问答，做成输入、知识源、结构化输出、人工确认和指标闭环。",
          full: "我不会把几个方向平均铺开，因为这样容易变成很多 Demo，但没有一个闭环真的可用。\n\n我会按四个维度排优先级：第一，目标客户的高频痛点和付费意愿；第二，是否能形成可验证闭环，比如从输入到输出再到人工确认和回写；第三，知识源和数据是否准备好；第四，商业窗口、研发成本和后续复用度。\n\n如果是业务一面，我会给一个倾向：先选合同审查或法律问答这样的高频、边界相对清楚的任务，做成一个小闭环；文本写作和问卷可以复用同一套知识源、输出协议和用户反馈机制，再逐步扩展。",
          notes: "强调“不平均撒网”，要选闭环。",
          followups: [
            {
              question: "销售说客户都想要，怎么办？",
              intent: "看跨部门取舍。",
              simple: "我会给三档方案：第一版做核心闭环，售前 Demo 展示延展能力，客户定制进入项目或后续 Roadmap。",
              full: "我会把需求拆成三档：第一版必须支撑核心闭环的功能；可以用 Demo 或配置展示的延展能力；单客户强绑定的定制需求。这样既回应销售机会，也不让产品底座被所有客户需求击穿。",
            },
            {
              question: "怎么判断第一版成功？",
              intent: "看指标意识。",
              simple: "看任务完成时间、建议采纳率、人工修改率、引用正确率、低置信兜底率和客户是否愿意继续试点或付费。",
              full: "我会看产品和业务两层指标：任务完成时间是否缩短，建议采纳率和人工修改率如何，引用是否正确，低置信是否触发兜底，bad case 是否收敛；业务上看客户是否愿意进入下一轮试点、采购或扩大使用范围。",
            },
          ],
        },
        en: {
          question: "If you had legal Q&A GPT, knowledge base, contract review, legal writing, and questionnaire products, how would you prioritize?",
          intent: ["Tests roadmap judgment", "Checks business and R&D tradeoffs", "Looks for scope control"],
          simple: "I would prioritize by four dimensions: high-frequency pain point and willingness to pay, whether the task can form a verifiable loop, whether knowledge and data are ready, and business window plus reuse potential. I would not build all directions equally in version one. I would pick one value-proving loop, such as contract review or legal Q&A, then build input, knowledge sources, structured output, human confirmation, and metrics.",
          full: "I would not spread resources evenly across all directions, because that often creates many demos but no truly usable workflow.\n\nI would prioritize by four dimensions. First, high-frequency pain point and willingness to pay. Second, whether the task can form a verifiable loop from input to output to human confirmation and feedback. Third, whether knowledge sources and data are ready. Fourth, business window, R&D cost, and reuse potential.\n\nMy first-version tendency would be contract review or legal Q&A, because they are frequent and relatively bounded. I would first build one strong loop. Legal writing and questionnaires can later reuse the same knowledge-source governance, output contracts, and user-feedback mechanisms.",
          notes: "Emphasize not spreading thin; choose one loop.",
          followups: [
            {
              question: "What if sales says customers want everything?",
              intent: "Tests cross-functional tradeoff.",
              simple: "I would create three tiers: core loop for version one, demo/configuration for extension, and customer-specific requests for project scope or later roadmap.",
              full: "I would divide requests into three tiers: what must be in version one to support the core loop, what can be shown through demo or configuration, and what is strongly customer-specific and should be handled as project scope or later roadmap. This responds to sales opportunities without breaking the product foundation.",
            },
            {
              question: "How would you define success for version one?",
              intent: "Checks metric thinking.",
              simple: "I would track task completion time, suggestion adoption, human modification, citation correctness, fallback coverage, and whether customers continue the pilot or pay.",
              full: "I would use both product and business metrics: whether task completion time is reduced, suggestion adoption rate, human modification rate, citation correctness, low-confidence fallback coverage, and bad-case improvement. On the business side, I would check whether the customer is willing to continue the pilot, purchase, or expand usage.",
            },
          ],
        },
      },
      {
        id: "data_iteration",
        framework: "role",
        category: { zh: "数据分析与迭代", en: "Data iteration" },
        mode: ["role", "ai"],
        difficulty: { zh: "常考", en: "Common" },
        zh: {
          question: "产品上线后你怎么做数据跟踪和持续优化？",
          intent: ["对应 JD 数据跟踪", "看是否能从数据回到产品动作", "看 AI 指标是否合理"],
          simple: "我会把指标分成三层：业务效率、AI 可信度和产品体验。比如合同审查可看审查耗时、风险建议采纳率、人工修改率、引用正确率、低置信兜底率、bad case 类型和复查通过率。数据不是只看大盘，而是回到具体任务节点，判断是知识缺失、检索问题、输出太长，还是流程设计有摩擦。",
          full: "我会把上线后的数据分成三层。\n\n第一层是业务效率，比如审查耗时、问答解决率、文本生成后的二次编辑时间。第二层是 AI 可信度，比如引用正确率、无依据回答比例、低置信兜底率、人工修改率和 bad case 类型。第三层是产品体验，比如关键路径完成率、用户在哪一步退出、哪些建议被忽略。\n\n关键是把数据回到任务节点看。比如人工修改率高，不一定是模型差，可能是知识源缺失、召回不准、输出太长、风险分级不符合用户习惯，或者产品没有让用户补充交易背景。PM 要把指标翻译成具体迭代动作。",
          notes: "不要只说 DAU/留存。法律 AI 更要讲任务效率和可信度。",
          followups: [
            {
              question: "如果用户不采纳 AI 建议，怎么分析？",
              intent: "看问题拆解。",
              simple: "先看是不信任、看不懂、不适用、太长、没有引用，还是业务规则不匹配，再分别改引用展示、风险分级、知识源或交互流程。",
              full: "我会先分类原因：用户是不信任结果、看不懂依据、觉得不适用、输出太长、没有引用，还是企业内部规则不匹配。不同原因对应不同方案：强化引用展示，调整风险分级，补企业知识源，压缩输出，或者增加交易背景输入。",
            },
            {
              question: "你会怎么做复盘机制？",
              intent: "看是否能形成数据到产品动作的闭环。",
              simple: "我会建立 bad case 表，记录输入、召回来源、输出、用户修改、原因分类和改进动作，定期回归验证。",
              full: "我会建立 bad case 表，记录原始输入、召回来源、模型输出、用户修改、问题原因、处理动作和回归结果。每一类 bad case 决定是补知识、调检索、改 Prompt、改 Schema，还是改产品流程。",
            },
          ],
        },
        en: {
          question: "After launch, how would you track data and continuously improve the product?",
          intent: ["Maps to JD data tracking", "Checks product action from data", "Tests AI metrics"],
          simple: "I would use three layers: business efficiency, AI trustworthiness, and product experience. For contract review, I would track review time, suggestion adoption, human modification rate, citation correctness, low-confidence fallback, bad-case types, and review pass rate. Data should be mapped back to task nodes to decide whether the issue is missing knowledge, retrieval quality, long output, or workflow friction.",
          full: "I would track data in three layers.\n\nThe first layer is business efficiency, such as review time, Q&A resolution rate, or editing time after AI writing. The second layer is AI trustworthiness, such as citation correctness, unsupported-answer rate, low-confidence fallback rate, human modification rate, and bad-case types. The third layer is product experience, such as key-path completion, where users drop off, and which suggestions are ignored.\n\nThe key is mapping metrics back to task nodes. A high human modification rate does not always mean the model is bad. It may mean missing knowledge, poor retrieval, overly long output, risk levels that do not match user habits, or missing transaction background in the workflow. PMs need to turn metrics into product actions.",
          notes: "Do not only mention DAU/retention. Legal AI needs task efficiency and trust metrics.",
          followups: [
            {
              question: "If users do not adopt AI suggestions, how would you analyze it?",
              intent: "Tests problem breakdown.",
              simple: "I would identify whether users do not trust it, do not understand it, find it inapplicable, think it is too long, see no citations, or have mismatched business rules.",
              full: "I would classify the reason first: users do not trust the output, cannot understand the rationale, find it inapplicable, think it is too long, see no citations, or have enterprise rules that do not match. Each cause maps to a different action: improve citations, adjust risk levels, add enterprise knowledge, shorten output, or add transaction-background inputs.",
            },
            {
              question: "How would you run retrospectives?",
              intent: "Checks the improvement loop.",
              simple: "I would keep a bad-case table with input, retrieved sources, output, user edits, cause category, improvement action, and regression result.",
              full: "I would keep a bad-case table with original input, retrieved sources, model output, user edits, problem cause, action taken, and regression result. Each bad-case type decides whether to add knowledge, tune retrieval, change prompts, update schema, or improve the workflow.",
            },
          ],
        },
      },
      {
        id: "cross_functional_delivery",
        framework: "pg",
        category: { zh: "跨团队推进", en: "Cross-functional" },
        mode: ["behavioral", "pg", "role"],
        difficulty: { zh: "核心", en: "Core" },
        zh: {
          question: "讲一个你与研发紧密合作、推动产品落地的例子。",
          intent: ["对应 JD 研发协作", "看个人贡献", "看是否能定义边界和验收"],
          simple: "我会讲 Inspector。它不是单页面需求，而是涉及 IoT 数据、设备台账、告警、工单、权限和 AI 建议。我做的关键动作是把场景拆成业务对象、状态流、字段映射、Agent 输入输出、人工确认和验收清单，让研发讨论的是接口和边界，而不是抽象地说“做个 AI”。结果上，MVP 覆盖海外标杆客户 80%+ 高优诉求，也沉淀了数据准备和交付模板。",
          full: "我会讲 Inspector 设施运维产品。\n\n这个项目复杂点在于，它不是一个单页面功能，而是要把 IoT 数据、设备台账、空间、告警、工单、权限和 AI 建议串起来。研发如果只收到“做一个智能诊断”，会很难落地。\n\n我的动作是把需求拆成可实现的产品协议：业务对象有哪些，字段和状态枚举是什么，Agent 能拿哪些上下文，输出结构是什么，低置信怎么兜底，哪些动作必须人工确认，验收清单怎么写。这样研发讨论的是接口、状态流和边界。\n\n结果上，MVP 覆盖海外标杆客户 80%+ 高优诉求，沉淀了功能范围、数据准备清单、验收标准和交付模板，也帮助类似项目从 5-6 个月压缩到 1-2 个月。",
          notes: "讲“我怎么让研发能做”，不要只说“我协调”。",
          followups: [
            {
              question: "研发说技术成本太高怎么办？",
              intent: "看取舍能力。",
              simple: "我会回到 MVP 目标，把需求拆成必须做、可配置、可后置三类，必要时用规则或人工确认替代复杂自动化。",
              full: "我会先确认技术成本高在哪里，是数据拿不到、接口不稳定、模型不可靠，还是交互范围太大。然后回到 MVP 目标，把需求拆成必须做、可配置、可后置三类。对于第一版不必要的复杂自动化，可以用规则、人工确认或 Demo 方式先验证价值。",
            },
            {
              question: "你怎么写验收标准？",
              intent: "看交付细节。",
              simple: "我会按场景脚本写：输入什么、系统显示什么、AI 输出哪些字段、低置信怎么提示、人工确认后状态怎么变化。",
              full: "我会按场景脚本写验收标准。比如输入一条告警后，系统要显示异常对象、影响区域和风险等级；AI 输出根因假设、证据、置信度和下一步建议；低置信时提示缺失信息；人工确认后生成工单草稿并进入对应状态。",
            },
          ],
        },
        en: {
          question: "Tell me about a time you worked closely with R&D to deliver a product.",
          intent: ["Maps to JD R&D collaboration", "Checks personal contribution", "Looks for boundary and acceptance definition"],
          simple: "I would use Inspector. It was not a single-page feature; it involved IoT data, equipment records, alerts, work orders, permissions, and AI suggestions. My key contribution was turning the scenario into business objects, state flows, field mapping, Agent inputs/outputs, human confirmation, and acceptance checklists. That helped R&D discuss interfaces and boundaries instead of a vague request to 'build AI.'",
          full: "I would use the Inspector facility operations product.\n\nThe complexity was that it was not a single-page feature. It had to connect IoT data, equipment records, spaces, alerts, work orders, permissions, and AI suggestions. If R&D only received a vague request to build intelligent diagnosis, it would be difficult to implement.\n\nMy contribution was turning the requirements into product contracts: business objects, fields and state enums, what context the Agent can use, what output structure is needed, how low confidence falls back, which actions require human confirmation, and how acceptance criteria are written. This made the R&D discussion concrete around interfaces, state flow, and boundaries.\n\nThe MVP covered over 80% of high-priority needs from a benchmark customer and created reusable function scope, data-preparation checklists, acceptance standards, and delivery templates.",
          notes: "Explain how you made it implementable, not only that you coordinated.",
          followups: [
            {
              question: "What if engineering says the cost is too high?",
              intent: "Tests tradeoff ability.",
              simple: "I would identify the cost driver, then split scope into must-have, configurable, and later items. For version one, rules or human confirmation can replace complex automation.",
              full: "I would first identify the cost driver: missing data, unstable APIs, unreliable model behavior, or too much interaction scope. Then I would go back to the MVP goal and split requirements into must-have, configurable, and later items. For complex automation that is not essential in version one, rules, human confirmation, or demo handling can validate value first.",
            },
            {
              question: "How do you write acceptance criteria?",
              intent: "Checks delivery detail.",
              simple: "I write scenario scripts: what input is given, what the system displays, which AI fields are output, how low confidence is handled, and how status changes after human confirmation.",
              full: "I write acceptance criteria through scenario scripts. For example, after an alert is received, the system should show abnormal object, impact area, and risk level; AI should output root-cause hypotheses, evidence, confidence, and next action; low confidence should show missing information; after human confirmation, a work-order draft should be generated and move to the correct state.",
            },
          ],
        },
      },
      {
        id: "market_research",
        framework: "role",
        category: { zh: "市场与竞品", en: "Market research" },
        mode: ["role"],
        difficulty: { zh: "常考", en: "Common" },
        zh: {
          question: "你会如何做法律 AI 产品的市场调研和竞品分析？",
          intent: ["对应 JD 市场调研", "看是否能落到产品决策", "避免泛泛而谈"],
          simple: "我会先分用户和任务，而不是只列竞品功能。比如律师、律所管理者、企业法务、销售/业务团队，对法律问答、合同审查、写作、知识库的需求不同。竞品上看任务覆盖、知识源可信度、输出结构、审查清单配置、私域部署、安全审计和价格/交付模式。最后把调研转成路线图和 MVP 取舍。",
          full: "我会先分用户和任务，而不是只列竞品功能。\n\n用户侧至少要区分律师、律所管理者、企业法务、企业业务团队。不同用户对法律问答、合同审查、写作、知识库和协作审批的关注点不同：有人要效率，有人要风险控制，有人要组织知识沉淀。\n\n竞品侧我会看几个维度：覆盖哪些任务，知识源是否可信，是否有引用和适用边界，输出是否结构化，审查清单能否配置，企业私域知识怎么接，安全审计和权限怎么做，价格和交付模式如何。最后把调研转成产品判断：第一版做什么、不做什么、用什么指标验证。",
          notes: "把调研连接到路线图，不要只是罗列竞品名。",
          followups: [
            {
              question: "你会重点看哪些竞品？",
              intent: "看行业补课方向。",
              simple: "我会看 Alpha/iCourt 自身产品矩阵，也看企业法务 AI、合同审查、法律检索和通用 AI 办公产品的交叉能力。",
              full: "我会先看 Alpha/iCourt 自身公开产品矩阵，理解已有优势和用户心智；再看企业法务 AI、合同审查、法律检索、知识库和通用 AI 办公产品。重点不是谁功能最多，而是谁把专业知识、流程、权限和交付模式做成了稳定闭环。",
            },
            {
              question: "怎么收集用户反馈？",
              intent: "看真实方法。",
              simple: "我会结合用户访谈、客服/销售记录、审查修改日志、试点客户复盘和关键路径数据。",
              full: "我会用定性和定量结合：用户访谈看真实任务，客服/销售记录看高频抱怨，审查修改日志看 AI 建议被改在哪里，试点客户复盘看付费理由和阻力，关键路径数据看用户在哪一步放弃或反复修改。",
            },
          ],
        },
        en: {
          question: "How would you conduct market research and competitor analysis for legal AI products?",
          intent: ["Maps to JD market research", "Checks product-decision orientation", "Avoids generic analysis"],
          simple: "I would start with users and tasks, not only competitor features. Lawyers, law-firm managers, enterprise legal teams, and business teams have different needs for legal Q&A, contract review, writing, and knowledge bases. For competitors, I would compare task coverage, knowledge trust, structured output, configurable review checklists, private deployment, security audit, pricing, and delivery model, then turn research into roadmap decisions.",
          full: "I would start with users and tasks, not only competitor features.\n\nUser segments include lawyers, law-firm managers, enterprise legal teams, and enterprise business teams. Their needs are different across legal Q&A, contract review, writing, knowledge bases, and approval collaboration. Some care about efficiency, some about risk control, and some about organizational knowledge retention.\n\nFor competitors, I would compare task coverage, trusted knowledge sources, citations and applicability boundaries, structured output, configurable review checklists, private knowledge integration, security audit, permissions, pricing, and delivery model. Finally, I would turn research into product decisions: what version one should include, what it should not include, and what metrics validate the direction.",
          notes: "Connect research to roadmap, not only competitor names.",
          followups: [
            {
              question: "Which competitors would you look at?",
              intent: "Checks domain-learning direction.",
              simple: "I would look at Alpha/iCourt's public product matrix, plus enterprise legal AI, contract review, legal search, knowledge-base, and general AI office tools.",
              full: "I would first study Alpha/iCourt's public product matrix to understand its existing strengths and user mindshare. Then I would look at enterprise legal AI, contract review, legal search, knowledge-base products, and general AI office tools. The point is not who has the most features, but who has turned professional knowledge, workflow, permissions, and delivery into a stable loop.",
            },
            {
              question: "How would you collect user feedback?",
              intent: "Checks practical methods.",
              simple: "I would combine user interviews, support/sales records, review-edit logs, pilot retrospectives, and key-path data.",
              full: "I would combine qualitative and quantitative feedback: user interviews for real tasks, support and sales records for frequent complaints, review-edit logs to see where AI suggestions are changed, pilot retrospectives for purchase reasons and blockers, and key-path data to see where users quit or repeatedly edit.",
            },
          ],
        },
      },
      {
        id: "too_verbose",
        framework: "behavioral",
        category: { zh: "表达风险", en: "Communication risk" },
        mode: ["behavioral", "pressure"],
        difficulty: { zh: "个人重点", en: "Personal focus" },
        zh: {
          question: "你觉得自己面试表达上有什么需要改进？",
          intent: ["回应用户担心", "把短板转成改进方法", "避免自我否定"],
          simple: "我过去有一个问题是讲得太完整，担心对方没听到重点。现在我会先说结论，再给一个最相关证据，最后只补一句边界或结果。如果对方感兴趣，我再展开完整 STAR。这个调整也符合产品工作：先给决策信息，再提供可追溯细节。",
          full: "我过去确实有一个需要改进的点：为了证明自己做过很多细节，容易把回答讲得太完整，反而让面试官抓不到重点。\n\n现在我会强制自己用三段式：第一句先给结论；第二句给一个最相关证据；第三句补边界、结果或和岗位的连接。如果对方追问，我再展开完整 STAR。\n\n我觉得这不是单纯的面试技巧，也和产品沟通有关。好的 PM 需要先给决策者关键信息，再保留足够细节供追问，而不是一开始就把所有背景都讲完。",
          notes: "这题可主动用于自我修正，不要显得不自信。",
          followups: [
            {
              question: "那你现在怎么保证回答不散？",
              intent: "看方法是否可执行。",
              simple: "我会每题只准备一个主证据，并用“结论-证据-边界”三句先回答，追问时再展开。",
              full: "我现在会每题只准备一个主证据，不把多个项目混在一起。回答先用“结论-证据-边界”三句压住，再根据面试官反应展开。比如问 AI 经验，我只讲 Inspector，不再把 Designer、售前、流程优化全部摊开。",
            },
            {
              question: "如果面试官打断你怎么办？",
              intent: "看临场恢复。",
              simple: "我会停下来，用一句话收束：我想表达的重点是 X；如果您愿意，我可以再展开具体例子。",
              full: "如果被打断，我会先停下来，不抢话。然后用一句话收束：我想表达的重点是 X。之后问对方是否希望我展开具体例子。这样能把控制权还给面试官，也避免继续说散。",
            },
          ],
        },
        en: {
          question: "What do you want to improve in your interview communication?",
          intent: ["Addresses the user's concern", "Turns weakness into method", "Avoids self-negation"],
          simple: "One thing I have been improving is being too complete in my answers. I used to worry that the interviewer might not see enough evidence, so I included too much context. Now I lead with the conclusion, add one relevant piece of evidence, and close with boundary or impact. If the interviewer is interested, I expand into a full STAR story.",
          full: "One thing I have been improving is being too complete in my answers. I used to include too much context because I wanted to prove that I had done the work, but that could make the key point harder to catch.\n\nNow I force myself into three steps: conclusion first, one relevant piece of evidence second, then boundary, impact, or role connection third. If the interviewer follows up, I expand into a full STAR story.\n\nI see this as more than an interview technique. It is also product communication. A good PM should give decision-makers the key information first, then keep enough traceable detail for follow-up.",
          notes: "Use this as a self-correction story, not as low confidence.",
          followups: [
            {
              question: "How do you keep answers focused now?",
              intent: "Checks executable method.",
              simple: "I prepare only one main piece of evidence per question and start with conclusion, evidence, and boundary before expanding.",
              full: "I prepare only one main piece of evidence per question, instead of mixing multiple projects. I answer first with conclusion, evidence, and boundary, then expand based on the interviewer's reaction. For AI experience, for example, I focus on Inspector instead of listing Designer, pre-sales, and process optimization all at once.",
            },
            {
              question: "What if the interviewer interrupts you?",
              intent: "Checks recovery in the moment.",
              simple: "I would pause and summarize in one line: the key point I want to make is X. Then I would ask whether they want the detailed example.",
              full: "If I am interrupted, I would pause and not fight for the floor. Then I would summarize in one line: the key point I want to make is X. After that, I would ask whether they want me to expand with a specific example. This gives control back to the interviewer and prevents the answer from drifting.",
            },
          ],
        },
      },
      {
        id: "reverse_questions",
        framework: "reverse",
        category: { zh: "反问问题", en: "Questions to ask" },
        mode: ["reverse", "warmup"],
        difficulty: { zh: "收尾", en: "Closing" },
        zh: {
          question: "业务一面最后你准备反问什么？",
          intent: ["体现岗位理解", "获取成功标准", "让对方感到你在想真实工作"],
          simple: "我会问三个问题：第一，这个岗位前 3-6 个月最希望解决的是哪条法律 AI 产品主线；第二，团队现在判断 AI 输出质量，最看重专业准确、引用可追溯、效率提升还是商业转化；第三，PM 和法律专家、研发、销售之间如何协作定义审查清单和验收标准。",
          full: "我会优先问三个问题。\n\n第一，这个岗位前 3-6 个月最希望解决的是哪条主线：法律问答、知识库、合同审查、文本写作，还是企业客户交付。这个问题能帮助我理解真实优先级。\n\n第二，团队现在判断 AI 输出质量时，最看重专业准确、引用可追溯、效率提升、用户采纳，还是商业转化。这个问题能帮助我理解产品目标。\n\n第三，PM 平时如何和法律专家、研发、销售一起定义审查清单、知识源优先级和验收标准。这个问题能体现我关注的不是概念，而是可落地协作。",
          notes: "选 2-3 个问即可；根据面试官前面说过的内容调整。",
          followups: [
            {
              question: "如果只能问一个？",
              intent: "收束到最有价值的问题。",
              simple: "我会问：从您视角看，这个岗位前 90 天做成什么，您会觉得是一次成功的加入？",
              full: "如果只能问一个，我会问：从您视角看，这个岗位前 90 天做成什么，您会觉得是一次成功的加入？这个问题能直接得到团队的真实期待和成功标准。",
            },
            {
              question: "哪些问题先不问？",
              intent: "避免不合时宜。",
              simple: "业务一面先不主动问薪资福利，也不问官网可查的问题；更适合问产品目标、协作和成功标准。",
              full: "业务一面我不会主动从薪资福利、加班或官网基础信息开始。更适合问产品目标、当前挑战、协作机制和成功标准。薪资可以留到 HR 或 offer 阶段。",
            },
          ],
        },
        en: {
          question: "What questions would you ask at the end of the business interview?",
          intent: ["Shows role understanding", "Gets success criteria", "Signals real-work thinking"],
          simple: "I would ask three questions. First, which legal AI product line this role is expected to improve in the first three to six months. Second, how the team currently evaluates AI output quality: professional accuracy, traceable citations, efficiency, adoption, or business conversion. Third, how PMs collaborate with legal experts, R&D, and sales to define review checklists and acceptance criteria.",
          full: "I would ask three questions.\n\nFirst, which product line this role is expected to improve in the first three to six months: legal Q&A, knowledge base, contract review, legal writing, or enterprise delivery. This helps me understand the real priority.\n\nSecond, how the team currently evaluates AI output quality: professional accuracy, traceable citations, efficiency improvement, user adoption, or business conversion. This helps me understand product goals.\n\nThird, how PMs collaborate with legal experts, R&D, and sales to define review checklists, knowledge-source priority, and acceptance criteria. This shows that I care about implementation, not only concepts.",
          notes: "Pick only 2-3 questions and adapt to what the interviewer already said.",
          followups: [
            {
              question: "If you could ask only one question?",
              intent: "Focuses on the most valuable close.",
              simple: "I would ask: from your perspective, what would make the first 90 days successful for this role?",
              full: "If I could ask only one, I would ask: from your perspective, what would make the first 90 days successful for this role? This directly reveals the team's real expectations and success criteria.",
            },
            {
              question: "What would you avoid asking first?",
              intent: "Avoids poor timing.",
              simple: "In a business interview, I would not start with salary, benefits, or basic facts from the website. I would focus on product goals, collaboration, and success criteria.",
              full: "In a business interview, I would not start with salary, benefits, overtime, or basic facts that can be found on the website. I would focus on product goals, current challenges, collaboration, and success criteria. Compensation can be discussed with HR or at the offer stage.",
            },
          ],
        },
      },
    ],
    phraseBank: [
      {
        title: { zh: "短答开场", en: "Short-answer openings" },
        items: [
          { zh: "我先说结论，再补一个真实例子。", en: "I will start with the conclusion, then add one real example." },
          { zh: "这个问题我会从用户任务流切入。", en: "I would start from the user task flow." },
          { zh: "我会先讲边界：这不是模型训练，而是产品侧闭环设计。", en: "I would first state the boundary: this was product-side workflow design, not model training." },
        ],
      },
      {
        title: { zh: "AI 产品关键词", en: "AI product keywords" },
        items: [
          { zh: "可信知识源、结构化输出、人工确认、低置信兜底。", en: "Trusted knowledge, structured output, human confirmation, and low-confidence fallback." },
          { zh: "不是聊天框，而是嵌入业务流程的 AI 能力。", en: "Not a chatbot, but AI capability embedded in a business workflow." },
          { zh: "没有依据就不强给结论。", en: "If there is no evidence, the system should not force a conclusion." },
        ],
      },
      {
        title: { zh: "法律行业迁移", en: "Legal-domain transfer" },
        items: [
          { zh: "法律行业我要补课，但底层产品方法相关。", en: "I need to learn legal tech, but the underlying product method is relevant." },
          { zh: "我不会把自己包装成法律专家。", en: "I would not position myself as a legal expert." },
          { zh: "先做一个可验证的小闭环，再扩展到更多场景。", en: "Build one verifiable loop first, then expand to more scenarios." },
        ],
      },
    ],
    reviewFocus: [
      { zh: "我不是法律专家，但我能把专业任务流拆成可信 AI 产品闭环。", en: "I am not a legal expert, but I can turn professional task flows into trustworthy AI product loops." },
      { zh: "AI 经历边界：产品侧方案验证 / Demo / POC 设计，不 claim 模型训练或全量上线。", en: "AI boundary: product-side validation / demo / POC design, not model training or full-scale rollout." },
      { zh: "最相关证据只讲 Inspector：Agent/RAG、工单草稿、人工确认、bad case 验收。", en: "Use Inspector as the main evidence: Agent/RAG, work-order draft, human confirmation, and bad-case validation." },
      { zh: "法律 AI 的关键词：法规/案例/模板/私域知识、引用来源、审查清单、人工复核。", en: "Legal AI keywords: laws/cases/templates/private knowledge, citations, review checklists, and human review." },
      { zh: "回答压缩法：结论一句 + 证据一句 + 边界或结果一句。", en: "Concise answer method: one conclusion, one evidence point, one boundary or impact line." },
      { zh: "不要平均铺开多个 AI 方向；先选合同审查或法律问答做闭环。", en: "Do not spread across every AI direction; start with contract review or legal Q&A as one complete loop." },
    ],
    companyResearch: {
      researchedAt: "2026-07-19",
      factBoundary: {
        zh: "公司官网请面试前再确认。以下基于公开网页和招聘页整理：新橙科技与 iCourt/Alpha 法律科技产品相关，信息用于面试理解，不作为绝对事实背诵。",
        en: "Please confirm the official company site before the interview. The notes below are summarized from public websites and recruiting pages: Xincheng Technology appears related to iCourt/Alpha legal-tech products. Use this for interview orientation, not as absolute memorized facts.",
      },
      sources: [
        {
          label: "律动 / LegalDance official site",
          url: "https://legaldance.cn/",
          accessedAt: "2026-07-19",
        },
        {
          label: "Alpha official promotion site",
          url: "https://promote.alphalawyer.cn/new-home",
          accessedAt: "2026-07-19",
        },
        {
          label: "BOSS listing for 北京新橙科技有限公司",
          url: "https://m.zhipin.com/companys/1e610c0e442f79521XR_09u_.html",
          accessedAt: "2026-07-19",
        },
      ],
      cards: [
        {
          title: { zh: "公司与产品定位", en: "Company and product positioning" },
          body: {
            zh: "公开资料显示，新橙科技/iCourt/Alpha 面向法律人、律所和企业法务提供法律科技产品，覆盖法律检索、案例、写作、合同审查、证据、知识管理等方向。",
            en: "Public materials suggest Xincheng/iCourt/Alpha provides legal-tech products for legal professionals, law firms, and enterprise legal teams, covering legal search, cases, writing, contract review, evidence, and knowledge management.",
          },
          interviewUse: {
            zh: "面试时把它理解成专业任务型 AI 产品：核心不是聊天，而是帮助法律人更快、更可信地完成检索、审查和写作。",
            en: "Frame it as professional task-oriented AI: not generic chat, but helping legal users complete search, review, and writing faster and more trustworthily.",
          },
        },
        {
          title: { zh: "JD 能力信号", en: "JD capability signals" },
          body: {
            zh: "截图 JD 重点要求 AI 产品规划、问答类 GPT、AI 知识库、文本写作、合同审查、问卷类产品、研发协作、市场调研、数据分析、跨部门协调和 AI 行业趋势跟踪。",
            en: "The JD screenshots emphasize AI product planning, Q&A GPT, AI knowledge bases, text writing, contract review, questionnaire products, R&D collaboration, market research, data analysis, cross-functional coordination, and AI trend tracking.",
          },
          interviewUse: {
            zh: "你的主线要放在 Agent/RAG/Workflow + B 端产品化 + 交付验证，而不是泛泛说“我会用 AI 工具”。",
            en: "Your main line should be Agent/RAG/Workflow plus B2B productization and delivery validation, not simply 'I use AI tools.'",
          },
        },
        {
          title: { zh: "法律 AI 产品机会", en: "Legal AI product opportunity" },
          body: {
            zh: "法律 AI 的机会在于把法规、案例、合同范本、企业私域知识和用户材料转成可检索、可引用、可复核的工作流能力。",
            en: "The legal-AI opportunity is turning laws, cases, contract templates, enterprise private knowledge, and user materials into searchable, citable, reviewable workflow capability.",
          },
          interviewUse: {
            zh: "可以说：我会优先关注知识源可信、引用可追溯、输出结构化和人工复核，因为这正是专业 AI 产品能否落地的关键。",
            en: "You can say: I would prioritize trusted sources, traceable citations, structured output, and human review, because these determine whether professional AI products can land.",
          },
        },
        {
          title: { zh: "你的迁移卖点", en: "Your transferable value" },
          body: {
            zh: "你的设施运维经验不是法律行业经验，但它证明了你能处理专业知识源、复杂流程、AI 输出边界、人工确认和 POC 交付。",
            en: "Your facility-operations experience is not legal-domain experience, but it proves you can handle professional knowledge sources, complex workflows, AI output boundaries, human confirmation, and POC delivery.",
          },
          interviewUse: {
            zh: "回答时要诚实承认法律知识缺口，同时把迁移点落到“专业任务流 AI 产品化”。",
            en: "Be honest about the legal-domain gap, then anchor your transferability in professional workflow AI productization.",
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
