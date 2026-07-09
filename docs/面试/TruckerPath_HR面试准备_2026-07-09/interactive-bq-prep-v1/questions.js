window.INTERVIEW_QUESTIONS = [
{
 id:"self_intro",category:"HR 常规",mode:["warmup","hr"],difficulty:"Easy English",
 question:"Tell me about yourself.",chinese:"请介绍一下你自己。",tests:"英文结构、主线是否清楚、能否把 B 端经验迁移到 Trucker Path。",
 intent:[["先定位","我是 B2B / industrial PM，强项是复杂真实工作流产品化。"],["再迁移","Trucker Path 不是泛社区，而是位置、实时信息、司机工作流和社区贡献。"],["最后收束","想把结构化产品能力用到更全球、更用户侧的产品。"]],
 simple:"I am a product manager with a B2B and industrial product background. My strength is turning complex real-world workflows into structured product solutions. For Trucker Path, I see a strong connection in location data, real-time information, driver workflows, and community contribution. I believe my experience is transferable, and I am excited to learn more about consumer products and UGC.",
 full:"Hi, I am Peixuan. I am currently a B2B product manager at DataMesh, focusing on AI-enabled digital twin products for industrial and facility operations.\n\nMy core strength is turning complex real-world workflows into structured product solutions. I have worked on user research, requirement analysis, PRD and prototype design, cross-functional delivery, launch, and iteration.\n\nI know my background is not a traditional consumer social product background. But I see Trucker Path as a product that solves real operational problems through location data, real-time information, truck-safe navigation, parking availability, fuel prices, weigh station status, and driver community. That is why I think my product thinking is transferable. I am also excited to grow in consumer product metrics, UGC mechanisms, and community engagement.",
 notes:"中文钩子：B2B工业PM -> 复杂工作流产品化 -> Trucker Path也是真实工作流 -> 位置/实时/社区。",
 followups:["Why do you want to move from B2B to C-side products?","What is the strongest connection between your current work and Trucker Path?","Can you make it shorter?"]
},
{
 id:"why_role",category:"岗位匹配",mode:["warmup","hr"],difficulty:"Easy English",
 question:"Why are you interested in this role?",chinese:"你为什么对这个岗位感兴趣？",tests:"动机是否真实，是否理解岗位不是泛娱乐社区。",
 intent:[["别说转型","不要说我想从 B 端转 C 端。"],["说产品价值","这是司机真实工作流里的导航、停车、油价、称重站、社区信息。"],["说你的连接","我喜欢具体、可衡量、影响真实决策的产品。"]],
 simple:"I am interested in this role because Trucker Path is not just a navigation app. It helps truck drivers with route planning, parking, fuel, weigh station status, load-related information, and driver community. I like products where user value is concrete and connected to real daily workflows.",
 full:"I am interested in this role because Trucker Path is not just a navigation app. It supports truck drivers and fleets with truck-safe navigation, trip planning, parking information, fuel prices, weigh station status, load-related services, and driver community.\n\nWhat attracts me is that the product value is very practical. For drivers, accurate information can affect time, cost, safety, and income. I like products where the user problem is concrete and where product design can make daily work easier.",
 notes:"中文钩子：不是导航App，是司机工作流平台；价值具体：时间、成本、安全、收入。",
 followups:["What do you know about Trucker Path?","Why not continue in B2B AI products?","What part of this role excites you most?"]
},
{
 id:"why_company",category:"岗位匹配",mode:["hr"],difficulty:"Easy English",
 question:"Why Moatable / Trucker Path?",chinese:"为什么选择 Moatable / Trucker Path？",tests:"是否做过公司研究，是否不是海投。",
 intent:[["Moatable","构建和规模化 AI-native SaaS / portfolio products。"],["Trucker Path","北美 truck drivers / fleets 的垂直行业平台。"],["你的兴趣","行业深度 + 用户侧产品 + 实时信息质量。"]],
 simple:"From my research, Moatable builds and scales AI-native SaaS products, and Trucker Path is one of its portfolio companies. I am interested in Trucker Path because it solves real problems for truck drivers and fleets. It combines navigation, real-time information, and community contribution.",
 full:"From my research, Moatable builds and scales AI-native SaaS products, and Trucker Path is one of its portfolio companies. What attracts me about Trucker Path is that it serves a very specific user group: truck drivers and fleets.\n\nThe product is meaningful because drivers need reliable information before and during a trip, such as truck-safe navigation, parking, fuel prices, weigh station status, and community updates. I like this combination of industry depth, user-facing product, and real-time information quality.",
 notes:"不要展开公司金融背景。说 Moatable + Trucker Path + 真实行业问题即可。",
 followups:["What did you learn from our website?","What do you think is the core user value?","Do you know our users?"]
},
{
 id:"b2b_to_c",category:"岗位匹配",mode:["hr","gap"],difficulty:"Easy English",
 question:"Your background is B2B. Why consumer-facing?",chinese:"你的背景偏 B 端，为什么想做 C 端/用户侧产品？",tests:"最大画像风险：能否承认缺口但不防御。",
 intent:[["别防御","先承认不是传统 C 端社区 PM。"],["强调连接","用户不同，但产品思维连接：场景、流程、需求、验证。"],["补齐方向","愿意学习 activation、retention、community contribution。"]],
 simple:"I do not see it as a complete switch. The users are different, but the product thinking is connected. I still need to understand user scenarios, break down workflows, define requirements, and work with design and engineering. I can bring structured product thinking, and I am ready to learn more about consumer growth and community engagement.",
 full:"I do not see it as a complete switch. The users are different, but the product thinking is connected. In my current role, I also need to understand user scenarios, break down workflows, define product requirements, work with design and engineering, and validate outcomes.\n\nFor Trucker Path, the product is consumer-facing, but it is still very workflow-driven. Drivers need reliable real-time information, better route planning, parking availability, fuel prices, weigh station status, and community updates. These are practical product problems.\n\nSo I would bring structured product thinking and cross-functional delivery experience. At the same time, I know I need to learn more about consumer metrics, community engagement, and UGC mechanisms.",
 notes:"关键词：not a complete switch / users are different / product thinking is connected. 语气要平稳。",
 followups:["What consumer product metrics do you know?","What is your weakness for this role?","Have you worked on mobile apps?"]
},
{
 id:"zero_to_one",category:"0-1 项目",mode:["warmup","behavior","hr"],difficulty:"Medium",
 question:"Tell me about a product you owned from 0 to 1.",chinese:"讲一个你从 0 到 1 的产品经历。",tests:"Ownership、产品全生命周期、复杂问题拆解。",
 intent:[["S","设施运维项目高度定制，资产、告警、工单、SOP、知识分散。"],["T","做可复用的产品闭环，不再纯项目制。"],["A","定义范围、PRD/原型逻辑、告警到工单、AI辅助诊断、人机确认。"],["R","MVP覆盖高优诉求，支撑商机，形成产品基线。"]],
 simple:"One 0-to-1 example is an AI-enabled facility operations product. The problem was that assets, alarms, work orders, SOPs, and knowledge were scattered. I helped define a reusable workflow that connected asset information, alarm management, work orders, knowledge base, and AI-assisted diagnosis. The MVP covered most high-priority requirements from a benchmark client and supported several business opportunities.",
 full:"One representative 0-to-1 product experience was an AI-enabled facility operations product I worked on at DataMesh.\n\nThe situation was that many facility operations projects were highly customized. Asset information, alarms, work orders, SOPs, and operational knowledge were scattered across different systems, so delivery was difficult to standardize.\n\nMy task was to help define a reusable product workflow. On the product side, I worked on requirement analysis, product scope, PRD and prototype logic, and cross-functional alignment with engineering and delivery teams. The core workflow connected asset information, alarm management, work orders, knowledge base, and AI-assisted diagnosis. I also helped define human confirmation and fallback rules, because in operational scenarios AI output needs to be explainable and controllable.\n\nThe MVP covered most high-priority requirements from a benchmark client and supported several business opportunities. The biggest learning for me was that AI products should not just be impressive demos. They need to fit into a real operational workflow, with clear boundaries, human confirmation, and measurable delivery value.",
 notes:"中文钩子：高定制 -> 标准闭环 -> AI不是聊天框 -> 告警/工单/SOP/人机确认。",
 followups:["What was your personal contribution?","What was the hardest trade-off?","How did you validate the MVP?"]
},
{
 id:"agent_rag",category:"简历追问",mode:["hr","pressure"],difficulty:"Easy English",
 question:"Can you explain the AI / Agent product on your resume?",chinese:"你简历上写的 AI / Agent / RAG 是什么？",tests:"简历真实性、技术边界、能否用简单英文解释复杂概念。",
 intent:[["先降维","不是模型训练，不讲算法细节。"],["讲业务","告警来了，帮助查上下文、找SOP、给原因和下一步。"],["讲边界","人工确认、低置信兜底、输入输出边界。"]],
 simple:"In my resume, Agent and RAG refer to AI product mechanisms in an operations workflow. It is not just a chatbot. It helps users understand an alarm, retrieve equipment information or SOP knowledge, suggest possible causes, and generate a next-step action or work order draft. I focused on product design, workflow, input-output boundaries, human confirmation, and fallback rules, not model training.",
 full:"In my resume, Agent and RAG refer to AI product mechanisms in an operations workflow. The idea is not just to add a chatbot. It is to help users understand an alarm, retrieve relevant equipment information or SOP knowledge, suggest possible causes, and generate a next-step action or work order draft.\n\nMy focus was on the product side. I clarified what information the AI could use, what output it should provide, when human confirmation was required, and what fallback rules were needed when confidence was low.\n\nSo I focused on product design, workflow, input-output boundaries, human confirmation, and fallback rules, not model training. I think the connection to Trucker Path is that both products rely on trustworthy information and clear decision support.",
 notes:"必须说：not model training。不要讲太技术。",
 followups:["What exactly did you own?","How did you make AI output reliable?","How is this related to Trucker Path?"]
},
{
 id:"similar_product",category:"简历追问",mode:["hr","gap"],difficulty:"Easy English",
 question:"Have you worked on a similar product before?",chinese:"有没有做过和我们方向类似的产品？",tests:"是否诚实，是否能建立迁移关系。",
 intent:[["诚实","没有直接做过 trucking。"],["迁移","做过位置/实时数据/工作流/数据质量影响决策。"],["连接","route planning、parking、weigh station、UGC updates。"]],
 simple:"I have not worked on a trucking product directly. But I have worked on products with similar complexity: location-based scenarios, real-time operational data, workflow optimization, and users making decisions based on data quality. For Trucker Path, I see the connection in route planning, parking availability, weigh station status, and user-generated updates.",
 full:"I have not worked on a trucking product directly, so I do not want to overclaim that experience. But I have worked on products with similar complexity: location-based scenarios, real-time operational data, workflow optimization, and users making decisions based on data quality.\n\nFor Trucker Path, I see the connection in route planning, real-time information, parking availability, weigh station status, and user-generated updates. The industry is different, but the product thinking is transferable: understand the user journey, identify key decision points, improve information quality, and make the workflow easier for users.",
 notes:"先承认没做过，再说相似复杂度。不要说我懂卡车。",
 followups:["How would you learn trucking?","What is transferable?","What is not transferable?"]
},
{
 id:"prioritize",category:"宝洁八大问",mode:["behavior","pressure"],difficulty:"Medium",
 question:"Tell me about a time you prioritized under limited resources.",chinese:"讲一次资源有限时你如何做优先级取舍。",tests:"Prioritization、产品判断、资源取舍。",
 intent:[["背景","三条产品线 + 多客户需求，不可能都做。"],["方法","平台能力 / 行业共性 / 客户定制 三层。"],["结果","11个版本，约70%重复定制沉淀为标品。"]],
 simple:"In my current role, I worked across three product lines and many customer-facing requirements. If we treated every request as customization, the product would be hard to maintain. I grouped requirements into platform-level capabilities, industry-common needs, and customer-specific needs. Repeated needs were moved toward the standard product baseline, while highly specific integrations stayed as customization.",
 full:"In my current role, I worked across three product lines and many customer-facing requirements. The challenge was that if we treated every request as separate customization, the product would become hard to maintain and delivery would stay inefficient.\n\nMy task was to help prioritize what should become standard product capability and what should remain project-specific customization. I grouped requirements into different layers: platform-level capabilities, industry-common needs, and customer-specific requirements. For repeated needs, such as asset structure, alarm workflow, work order status, and implementation checklist, I pushed them toward the standard product baseline. For highly specific integrations, we kept them as customization.\n\nAs a result, we managed 11 version iterations and moved an estimated 70% of repeated custom needs toward standardized product capabilities. This helped reduce repeated communication and made future delivery more scalable.",
 notes:"70% 要说 estimated。不要讲成精确审计数字。",
 followups:["Give me one example of a requirement you postponed.","How did you convince stakeholders?","What framework do you use for prioritization?"]
},
{
 id:"cross_function",category:"宝洁八大问",mode:["behavior"],difficulty:"Medium",
 question:"Tell me about a cross-functional project.",chinese:"讲一个跨部门协作项目。",tests:"Stakeholder management、沟通、影响力。",
 intent:[["不是催进度","跨团队价值是把模糊目标变成可执行范围。"],["角色","产品、研发、客成、美术/3D、销售、交付。"],["结果","端到端 demo / 交付闭环。"]],
 simple:"One cross-functional project was a customer-facing operations demo. It required product, engineering, customer success, 3D delivery, and sales alignment. My role was to clarify the scope, break the workflow into deliverable modules, and align priorities. The demo needed to show an end-to-end workflow: scene setup, data access, and operational handling.",
 full:"One cross-functional project was a customer-facing operations demo that required product, engineering, customer success, art or 3D delivery, and sales alignment.\n\nThe challenge was that the demo could not just show isolated features. It needed to show an end-to-end business workflow: scene setup, data access, and operational handling.\n\nMy role was to clarify the product scope, break the workflow into deliverable modules, align priorities with different teams, and make sure each team understood what was needed for the demo. When resources were limited, I helped evaluate priorities and provide alternative solutions instead of blocking the whole delivery.\n\nThe result was an end-to-end demo workflow that could communicate product value to customers and support later validation. This experience taught me that cross-functional work is not only about coordination. It is about turning ambiguity into a shared product story that every team can execute.",
 notes:"如果能补一个真实分歧，会更强：例如研发资源、3D交付、客户期望。",
 followups:["Which team was hardest to align?","How did you handle disagreement?","What artifact did you use to align everyone?"]
},
{
 id:"process_improve",category:"宝洁八大问",mode:["behavior"],difficulty:"Easy English",
 question:"Tell me about a time you improved a process.",chinese:"讲一次你优化流程或提升效率的经历。",tests:"结果导向、细节把控、流程意识。",
 intent:[["问题","发布流程重复沟通、验收不清、周期约4周。"],["动作","4份发布指导和验收SOP，线上发布流程，检查清单。"],["结果","4周缩短到1-2周，约75%提效。"]],
 simple:"One process improvement example was the release process for standard resource packages. The original process involved repeated communication and unclear validation steps, so it could take around four weeks. I created release guidance, acceptance SOPs, and reusable checklists. As a result, the release cycle was shortened from around four weeks to one to two weeks.",
 full:"One process improvement example was around the release process for standard resource packages.\n\nThe original process involved repeated communication and unclear validation steps, so the release cycle could take around four weeks. My task was to make the process more predictable and easier for different teams to reuse.\n\nI created release guidance and product acceptance SOPs, rebuilt the online release process, and summarized reusable delivery checklists. The goal was to make responsibilities, validation steps, and acceptance criteria clearer before release.\n\nAs a result, the release cycle was shortened from around four weeks to one to two weeks, which was about a 75% improvement. For me, the key lesson was that product quality is not only about feature design. It also depends on clear process, acceptance standards, and repeatable execution.",
 notes:"最稳行为题。英文简单，结果明确。",
 followups:["What was the most important checklist item?","How did you measure improvement?","How did other teams react?"]
},
{
 id:"learn_domain",category:"缺口救场",mode:["gap","behavior","pressure"],difficulty:"Easy English",
 question:"How would you learn the trucking domain quickly?",chinese:"你没有卡车行业经验，会怎么快速学习？",tests:"自知、学习方法、行业迁移能力。",
 intent:[["边界","不装懂 trucking。"],["方法","用户旅程、工作流、关键决策点、内部专家、竞品。"],["产品化","把行业知识转成模块、指标和验证路径。"]],
 simple:"I would start from user scenarios, not abstract industry terms. For Trucker Path, I would map a truck driver’s journey: route planning, parking, fuel, weigh stations, rest, load matching, and real-time updates. Then I would talk to internal experts or users, study competitor products, and connect the workflow to product metrics.",
 full:"I do not want to overclaim direct trucking industry experience. My way to learn a new domain is to start from user scenarios and daily workflows, not abstract industry terms.\n\nFor Trucker Path, I would first map a truck driver’s journey: route planning, parking, fuel, weigh stations, rest, load matching, and real-time updates. Then I would talk to internal domain experts or users, study competitor products, and identify where information quality affects user decisions.\n\nAfter that, I would translate the workflow into product modules, key metrics, and validation questions. This is similar to how I learned complex facility operations workflows in my current role.",
 notes:"关键句：start from user scenarios, not abstract industry terms. 很适合背。",
 followups:["What would you learn first?","Which competitor would you study?","How would you validate your understanding?"]
},
{
 id:"ugc_quality",category:"缺口救场",mode:["gap","pressure"],difficulty:"Medium",
 question:"How would you think about UGC quality for Trucker Path?",chinese:"你怎么看 Trucker Path 的 UGC 信息质量？",tests:"UGC 缺口、产品思维、方法论。",
 intent:[["承认","没直接负责成熟 UGC 社区。"],["拆维度","贡献动机、时效性、可信度、反馈闭环、重复使用。"],["套场景","parking、fuel prices、weigh station、road conditions。"]],
 simple:"I have not directly owned a mature UGC community product, so I would not overclaim that experience. But I understand the product logic. For Trucker Path, I would look at contribution motivation, data freshness, trustworthiness, feedback loops, and repeated usage. The most important updates may include parking availability, fuel prices, weigh station status, and road conditions.",
 full:"I have not directly owned a mature UGC community product before, so I would not overclaim that experience. But I understand the product logic: we need to look at contribution motivation, content or data freshness, trustworthiness, feedback loops, and repeated usage.\n\nFor Trucker Path, I would first study which user-generated updates are most critical to driver decisions, such as parking availability, fuel prices, weigh station status, or road conditions. Then I would think about how to make contribution easy, how to show update time, how to build trust signals, and how to give users feedback that their contribution helped others.\n\nFor this product, UGC is not just social content. It is operational information that can affect a driver’s time, cost, safety, and income.",
 notes:"好句：UGC is not just social content. It is operational information. 这句很加分。",
 followups:["What metrics would you use?","How would you prevent low-quality updates?","How would you motivate drivers to contribute?"]
},
{
 id:"metrics",category:"缺口救场",mode:["gap"],difficulty:"Medium",
 question:"What metrics would you track for a driver community product?",chinese:"司机社区/UGC 产品你会看哪些指标？",tests:"C端增长/社区指标基础。",
 intent:[["别复杂","用 4 类指标：激活、留存、贡献、质量。"],["贴 Trucker","停车/称重站/油价信息的新鲜度和可信度。"],["业务价值","是否帮助司机节省时间和减少不确定性。"]],
 simple:"I would look at four groups of metrics: activation, retention, contribution, and information quality. For example, new user activation, weekly or monthly retention, contribution rate, repeat contribution rate, update freshness, and report accuracy. For Trucker Path, I would also care whether the information helps drivers save time and make better decisions.",
 full:"For a driver community product, I would look at four groups of metrics.\n\nFirst, activation: whether new users complete key actions, such as searching a route, checking parking, or viewing a truck stop. Second, retention: whether drivers come back weekly or monthly. Third, contribution: contribution rate, repeat contribution rate, and which scenarios users contribute to, such as parking, weigh stations, or fuel prices. Fourth, information quality: update freshness, report accuracy, trust signals, and whether outdated information is reduced.\n\nFor Trucker Path, I would not only track engagement for its own sake. I would connect metrics to real user value: helping drivers save time, reduce uncertainty, and make safer decisions on the road.",
 notes:"四组：activation / retention / contribution / quality。别背太多指标。",
 followups:["Which metric is most important?","How would you define activation?","How would you measure data freshness?"]
},
{
 id:"weakness",category:"HR 常规",mode:["hr","gap"],difficulty:"Easy English",
 question:"What is your biggest weakness for this role?",chinese:"对这个岗位来说，你最大的短板是什么？",tests:"自知、诚实、成长计划。",
 intent:[["承认","直接 C端增长和成熟UGC经验不多。"],["不示弱","但我有用户场景分析、工作流、交付能力。"],["计划","学习 activation、retention、contribution mechanisms。"]],
 simple:"One area I need to improve is direct consumer growth and UGC experience, such as activation, retention, and community contribution mechanisms. My previous experience is more B2B and workflow-driven. But I believe my structured product thinking and user scenario analysis give me a strong foundation to learn quickly.",
 full:"One area I need to improve is direct consumer growth and UGC experience, especially activation, retention, and community contribution mechanisms. My previous experience is more B2B and workflow-driven.\n\nBut I do not see this as a complete gap in product thinking. I have strong experience in user scenario analysis, requirement definition, workflow design, cross-functional delivery, and product iteration. For Trucker Path, I would apply that foundation and learn the consumer-side metrics and community mechanisms quickly.\n\nI also think this role is interesting because the community here is not only social interaction. It is connected to real-time, location-based information that helps drivers make decisions.",
 notes:"短板题一定要接 foundation + learning plan，别停在弱点。",
 followups:["How are you learning consumer growth?","Why should we take the risk?","What would you do in the first month?"]
},
{
 id:"leave_reason",category:"HR 常规",mode:["hr"],difficulty:"Easy English",
 question:"Why are you considering leaving your current company?",chinese:"为什么考虑离职/看机会？",tests:"动机、稳定性、是否抱怨。",
 intent:[["感谢现岗位","给了产品ownership、复杂场景、跨团队交付。"],["下一阶段","更大用户规模、更强反馈闭环、更全球。"],["连接岗位","Trucker Path 具备这些特点。"]],
 simple:"I am grateful for my current role because it gave me strong experience in product ownership, complex scenarios, and cross-functional delivery. At this stage, I am looking for a role with a larger user base, a stronger user feedback loop, and more exposure to global users. That is why Trucker Path is interesting to me.",
 full:"I am grateful for my current role because it gave me strong experience in product ownership, complex scenarios, and cross-functional delivery. I learned a lot about turning complex business workflows into product solutions.\n\nAt this stage, I am looking for a role with a larger user base, a stronger user feedback loop, and more exposure to global users. I want to apply my structured product thinking in a more user-facing product context.\n\nThat is why Trucker Path is interesting to me. It combines practical user value, industry depth, and consumer-facing product challenges.",
 notes:"不要抱怨现公司。说 growth direction。",
 followups:["Are you actively looking?","What are you looking for in your next role?","Why now?"]
},
{
 id:"salary",category:"HR 常规",mode:["hr"],difficulty:"Easy English",
 question:"What is your salary expectation?",chinese:"你的薪酬期望是多少？",tests:"是否和岗位区间一致，是否灵活。",
 intent:[["不报死","先说 aligned with posted range。"],["留空间","based on scope, team expectations, full package。"],["必要时","20-25K monthly。"]],
 simple:"My expectation is generally aligned with the posted range for this role. I am open to discussing the exact package based on the role scope, team expectations, and overall compensation structure.",
 full:"My expectation is generally aligned with the posted range for this role. I am open to discussing the exact package based on the role scope, team expectations, and overall compensation structure.\n\nBased on the posted range, I would expect something around 20 to 25K monthly, with the final number depending on the full package and role scope.",
 notes:"如果对方逼数字：around 20 to 25K monthly。别自己压价。",
 followups:["What is your current salary?","Is this negotiable?","What is your minimum expectation?"]
},
{
 id:"english",category:"HR 常规",mode:["hr","warmup"],difficulty:"Easy English",
 question:"Are you comfortable working in English?",chinese:"你能接受英文工作/英文沟通吗？",tests:"外籍 HR 核心问题。",
 intent:[["肯定","Yes, I am comfortable working in English."],["证据","UCL、英文文档、presentation、跨文化沟通。"],["边界","非native，但能做产品讨论和需求澄清。"]],
 simple:"Yes, I am comfortable working in English. I studied at UCL and have experience with English documents, presentations, and cross-cultural communication. I may not speak like a native speaker, but I can use English for product discussions, requirement clarification, and daily collaboration.",
 full:"Yes, I am comfortable working in English. I studied at UCL and have experience with English documents, presentations, and cross-cultural communication.\n\nI may not speak like a native speaker, but I can use English for product discussions, requirement clarification, and daily collaboration. If I need to explain complex product logic, I usually structure my answer first and then use clear, simple language. That is also how I would communicate in an international team.",
 notes:"不要说我英文一般。说 may not speak like a native speaker, but...",
 followups:["Can we continue in English?","Have you worked with overseas colleagues?","Can you explain your project in English?"]
},
{
 id:"commute",category:"HR 常规",mode:["hr"],difficulty:"Easy English",
 question:"Are you okay with the location and commute?",chinese:"通勤和工作地点能接受吗？",tests:"现实约束、稳定性。",
 intent:[["可接受","location is acceptable。"],["了解模式","fully onsite or hybrid。"],["远也能说","manageable for the right opportunity。"]],
 simple:"The location is acceptable for me. I would like to understand the working model, whether it is fully onsite or hybrid, but in general the commute is manageable.",
 full:"The location is acceptable for me. I would like to understand the working model, whether it is fully onsite or hybrid, but in general the commute is manageable. If it takes some time, I still think it is manageable for the right opportunity.",
 notes:"如果确实远：It will take some time, but it is manageable for the right opportunity.",
 followups:["Can you work onsite?","How long is your commute?","What is your notice period?"]
},
{
 id:"mistake",category:"压力追问",mode:["pressure","behavior"],difficulty:"Needs Real Story",
 question:"Tell me about a mistake or learning experience.",chinese:"讲一次失败、错误或复盘经历。",tests:"成熟度、复盘能力、真实性。",
 intent:[["不要编","这题需要你补一个真实事件。"],["可选方向","需求被研发挑战 / 客户期望过大 / demo资源不足。"],["结构","问题 -> 你如何修正 -> 学到什么 -> 后续怎么避免。"]],
 simple:"One learning experience was when I realized that a product requirement was not specific enough for engineering and delivery teams. After receiving feedback, I clarified the user scenario, acceptance criteria, and product boundary. Since then, I pay more attention to making requirements concrete and testable before development starts.",
 full:"One learning experience was when I realized that a product requirement was not specific enough for engineering and delivery teams. The initial description explained the business goal, but it did not clearly define the user scenario, acceptance criteria, and product boundary.\n\nAfter receiving feedback, I went back to clarify the workflow, break the requirement into smaller modules, and define what should be included in the current phase and what should be postponed.\n\nThe lesson for me was that product managers should not only describe the expected result. We also need to make requirements concrete, testable, and aligned with delivery constraints. Since then, I pay more attention to acceptance criteria and edge cases before development starts.",
 notes:"这是安全模板，但最好替换成你的真实事件。页面里可以直接编辑保存。",
 followups:["What would you do differently?","How did others react?","What did you learn?"]
},
{
 id:"conflict",category:"压力追问",mode:["pressure","behavior"],difficulty:"Needs Real Story",
 question:"Tell me about a conflict with a teammate or stakeholder.",chinese:"讲一次和同事/相关方有分歧的经历。",tests:"冲突处理、沟通成熟度。",
 intent:[["不甩锅","不要说对方不专业。"],["讲取舍","用户价值、业务优先级、技术成本。"],["讲结果","达成阶段方案或替代方案。"]],
 simple:"One common type of conflict is around scope. Business stakeholders may want more features, while engineering needs to control complexity. My approach is to separate the user problem from the solution, clarify the must-have workflow, discuss technical trade-offs, and propose a phased plan.",
 full:"One common type of conflict in B2B product work is around scope. Business stakeholders may want more features because of customer pressure, while engineering needs to control technical complexity and delivery risk.\n\nMy approach is to separate the user problem from the solution. First, I clarify the user need and business priority. Then I discuss feasibility and trade-offs with engineers. If the original solution is too costly, I am open to alternatives as long as the core user value can still be delivered.\n\nIn many cases, a phased approach works better: first deliver the minimum workflow needed for validation, and keep more specific requirements as configuration or later-phase items.",
 notes:"这是方法论模板。最好补一个真实人和真实分歧。",
 followups:["Did you win the argument?","How did you convince them?","What if engineering says no?"]
},
{
 id:"questions_for_hr",category:"HR 常规",mode:["warmup","hr"],difficulty:"Easy English",
 question:"What questions do you have for me?",chinese:"你有什么想问我的？",tests:"是否认真理解岗位。",
 intent:[["问方向","navigation / community / parking / load board / growth。"],["问协作","北京团队如何和海外用户/同事协作。"],["问成功标准","first six months success。"]],
 simple:"Yes, I have a few questions. Which product area will this role focus on most: navigation, driver community, parking information, load board, or growth? How does the Beijing product team collaborate with overseas colleagues and North American users? And what would success look like for this role in the first six months?",
 full:"Yes, I have a few questions.\n\nFirst, which product area will this role focus on most: navigation, driver community, parking information, load board, or growth?\n\nSecond, since the users are mainly North American truck drivers, how does the Beijing product team collaborate with overseas colleagues and local users?\n\nThird, what would success look like for this role in the first six months? I would like to understand what kind of product impact the team expects from this position.",
 notes:"反问不要问福利。问产品范围、跨国协作、成功标准。",
 followups:["Anything else?","Do you have concerns about the role?","When can you start?"]
}
];
