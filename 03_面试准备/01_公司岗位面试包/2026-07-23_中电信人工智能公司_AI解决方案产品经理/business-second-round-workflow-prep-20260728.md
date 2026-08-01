# 中电信人工智能公司产品解决方案经理业务二面准备

生成日期：2026-07-28
适用轮次：业务二面 / 部门负责人 / Hiring Manager
核心原则：按 `JD × 简历/故事库 × 面试轮次 × 真实面经检索` 生成；不编造事实、数字、客户名称或上线结果。

## 0. 本次准备依据

### 本地材料

- `ctai-solution-pm-interview-20260723/data.js`：一面准备网页内容，含 JD 截图解读、星辰智能体资料、题库。
- `interview_review/china-telecom-ai-interview-review.md`：一面复盘，重点信号是商业化、售前方案、集团/省公司协同、产品与运营边界。
- `ctai-solution-pm-interview-20260723/second-round-pressure-pack-20260728.md`：二面高压追问包。
- `ctai-solution-pm-interview-20260723/second-round-xhs-qa-20260728.md`：二面 Q&A 练习稿。
- `docs/面试/面试问答沉淀.md` 与 `docs/项目与学习/STAR项目故事-Inspector与Designer.md`：简历事实与项目故事底稿。

### 公开资料检索

- 天翼云文档显示，星辰 MaaS 智能体平台定位为大语言模型智能体应用开发平台，包含智能体编排、工作流、RAG、知识库管理、多模型、模板、工具与 API 服务化能力。来源：https://www.ctyun.cn/document/11094224/11094239
- 天翼云工作流文档强调，复杂、稳定性要求高、输出格式要求严格的 AI 任务更适合用工作流编排，并包含大模型节点、RAG、分类、回复等节点。来源：https://www.ctyun.cn/document/11094224/11094292
- 天翼云评测文档显示，平台支持评测集、评测规则、自定义评分，用于评估响应准确性、工具调用稳定性、知识覆盖度。来源：https://www.ctyun.cn/document/11094224/11094386
- 中国电信官网 2026-06-18 报道称，中电信人工智能公司凭星辰智能体平台进入 IDC 中国智能体开发平台私有化市场份额前五；同时提到 2025 年企业智能体从试点走向规模化部署，平台价值从开发工具延伸到构建、运行、纳管、审计和持续优化。来源：https://www.chinatelecom.com.cn/ct/news/jtxw/167315.html
- 牛客中国电信产品经理业务面经显示，业务面常问自我介绍、简历项目深挖、对电信政企/家庭/核心产品的理解、来电信能做哪类产品。来源：https://www.nowcoder.com/discuss/485319504990416896
- 牛客中国电信产品运营面经显示，产品运营/业务面会问产品规划、数据分析、跨团队协作、运营商体系里产品运营与产品经理/市场/客服支撑的边界、To B/To C 差异。来源：https://www.nowcoder.com/discuss/798234761347989504

可信度标记：

- 高：官方文档 / 中国电信官网 / 用户一面复盘 / 简历材料。
- 中：牛客面经，因岗位和年份不完全一致，只作为题型趋势参考。
- 低：泛 AI 产品面经，本文没有直接采用为核心依据。

## 1. JD 解码

### 岗位真实招聘意图

这不是纯后端 PRD 产品经理，也不是纯售前解决方案。更像一个“AI 产品解决方案经理”：把星辰智能体平台能力转成客户能理解、销售能讲清、渠道/省公司能复用、交付能验收、研发能沉淀的产品方案。

二面面试官大概率不只验证“你做过什么”，而是验证三件事：

- 你能不能从执行者视角升级到业务负责人视角。
- 你能不能把 AI Agent 从 Demo 讲成可销售、可交付、可验收的产品包。
- 你能不能在研发、售前、运营、省公司、客户之间搭桥，并把前线反馈沉淀成标准产品和规则。

### Must Have

1. AI Agent / 大模型产品理解：能讲清智能体、RAG、工作流、工具调用、评测、人审、安全边界。
2. 产品能力矩阵与版本包装：SaaS、企业团队版、行业方案、私有化/省专包。
3. 客户需求到产品方案：业务调研、客户方案、Demo、POC 范围、验收口径。
4. GTM / 商业化协同：价值主张、渠道话术、竞品对比、定价拆解依据、培训材料。
5. 标品化判断：哪些做配置，哪些进标准模块，哪些拒绝或放入行业包。
6. 跨组织推进：研发、售前、销售、运营、交付、省公司、集团机制。
7. 运营商/政企语境：安全、权限、审计、私有化、稳定性、长期运营。

### Hidden Signals

- “产品解决方案经理”里的“解决方案”权重很高：不要只讲原型和 PRD，要讲客户价值、方案结构、部署边界、验收标准。
- 业务二面会压 GTM 缺口：你没背收入指标没关系，但必须讲清你如何影响线索转化、POC 推进、渠道复用和产品反馈。
- 中电信 AI 平台处在规模化落地阶段：面试官会关心行业模板、评测、私有化、审计、持续运营，而不是只关心模型能力。
- 国央企/运营商体系会看稳定性和组织协同：接受出差、省公司培训、流程约束、长期深耕，是岗位适配信号。

### 淘汰风险点

- 只说“我会做产品”，不说商业化、渠道和交付。
- 把 Inspector Agent 讲成底层算法/模型训练，容易被追穿。
- 只讲过程数字，不区分已发生事实和未来验收指标。
- 对运营商产品、政企客户、省公司协同完全无感。
- 回答太散，缺少“结论 -> 框架 -> 项目证据 -> 迁移到中电信”的结构。

## 2. 简历与故事映射

Story Bank 目前没有你的真实故事条目，因此本次直接从本地简历和项目沉淀中映射，不新增虚构故事。

| 故事 | 可证明能力 | 可用问题 | 证据完整度 | 风险 |
|---|---|---|---|---|
| Inspector 设施运维 Agent 闭环 | AI Agent 产品化、RAG、人审、评测、复杂业务拆解 | 智能体定义、RAG 验收、AI 项目代表作、没有底层模型经验怎么办 | 高 | 不要说成模型训练或全量上线 |
| 定制需求转标品 | Ownership、产品判断、平台化、客户需求抽象 | 70% 怎么来、客户强定制怎么办、行业方案如何沉淀 | 中高 | 70% 要说成产品化复盘口径，不说财务口径 |
| 售前/POC/推广材料支持 | GTM、解决方案、跨团队协同 | 你怎么证明能做商业化、渠道不会讲怎么办、材料是否有用 | 中 | 缺收入归因，需用 POC/材料/验收边界说明影响 |
| 快速接手两条产品线与第二周演示 | 学习能力、复杂业务进入、抗压 | 你短板是什么、为什么能迁移、前三个月计划 | 高 | 少说“学习快”，多说“形成可交付产出” |
| 建筑转产品与运营商稳定性 | 动机、长期适配、体系协同 | 为什么来中电信、接受不是纯产品吗、适应国央企节奏吗 | 中 | 不要只讲稳定，要讲真实客户和长期产品化 |

## 3. 业务二面总打法

主线句：

> 我理解这个岗位是在产品、解决方案和商业化之间搭桥。核心不是单点写 PRD，而是把星辰智能体平台能力包装成客户听得懂、销售讲得清、渠道能复用、交付能验收、研发能沉淀的产品方案。

回答结构固定为：

1. 先给结论。
2. 给判断框架。
3. 讲一个真实项目证据。
4. 迁移到中电信星辰智能体/省公司/渠道/政企客户。
5. 主动说明事实边界，不编结果。

业务二面的关键词：

- GTM
- 产品包装
- 行业方案
- 私有化
- 省公司/渠道
- POC 验收
- 评测集
- 人审边界
- 需求标品化
- 反馈闭环

## 4. Top 20 可能问题

### A. 开场与岗位匹配

| # | 问题 | Interview Question | 考什么 | 为什么这轮会问 | 对应故事 | 风险追问 |
|---|---|---|---|---|---|---|
| 1 | 请用 90 秒介绍自己，重点贴合产品解决方案经理。 | Give me a 90-second self-introduction tailored to this role. | 岗位匹配、表达结构 | 二面先看你是否已经从“一面项目讲述”升级到“岗位价值” | Inspector + 标品化 + 售前支持 | 你最匹配的一点是什么 |
| 2 | 你怎么理解这个岗位到底在招什么人？ | What kind of person is this role really hiring for? | JD 解码、业务理解 | JD 里有产品包装、定价、渠道、客户方案，不是纯 PRD | 一面复盘 + JD 解码 | 为什么不是普通产品经理 |
| 3 | 为什么选择中电信人工智能公司，而不是继续做工业数字孪生？ | Why China Telecom AI instead of continuing in industrial digital twin? | 动机、迁移逻辑 | 业务负责人会看你是不是随机投递 | Inspector 方法迁移 | 你对我们产品了解多少 |
| 4 | 你觉得自己的匹配点和短板是什么？ | What are your fit and gaps for this role? | 自我认知、风险管理 | 二面常压短板，看是否诚实可培养 | 全部材料 | 没做过电信 AI 平台怎么办 |

### B. AI Agent 产品理解

| # | 问题 | Interview Question | 考什么 | 为什么这轮会问 | 对应故事 | 风险追问 |
|---|---|---|---|---|---|---|
| 5 | 讲一个你做 AI Agent 或 AI 产品化最有代表性的项目。 | Tell me about your most representative AI Agent product project. | AI 产品化深度 | 需要证明你不是只会说概念 | Inspector Agent | 你个人到底做了什么 |
| 6 | 你怎么定义一个智能体产品？怎么验收它不是 Demo？ | How do you define an agent product and prove it is not just a demo? | 任务闭环、交付验收 | 星辰智能体平台强调开发、运行、评测、运营 | Inspector + 官方评测文档 | 聊天机器人和智能体区别 |
| 7 | RAG 怎么设计？怎么判断召回和回答准确？ | How would you design RAG and evaluate retrieval/answer quality? | 产品技术协同 | 平台有知识库、RAG、评测能力 | Inspector RAG | 技术同学说准就准吗 |
| 8 | 客户说智能体不稳定、不可信，你怎么排查？ | What would you do if a customer says the agent is unstable or untrustworthy? | Bad case 归因、运营机制 | 政企客户更关注可信和可控 | Inspector bad case | 客户不给细节怎么办 |

### C. GTM 与商业化

| # | 问题 | Interview Question | 考什么 | 为什么这轮会问 | 对应故事 | 风险追问 |
|---|---|---|---|---|---|---|
| 9 | 你过去更偏产品，怎么证明能做 GTM 和商业化推广？ | You are product-oriented. How can you prove you can do GTM? | 最大风险防守 | 一面明确提到商业化、运营、市场、规则 | 售前/POC/推广材料 | 没背收入指标怎么办 |
| 10 | 如果让你设计星辰智能体的推广打法，你第一步做什么？ | How would you design GTM for Xingchen Agent? | 客户分层、价值主张 | 岗位要求推广模式和渠道架构 | GTM 框架 | 怎么衡量成功 |
| 11 | 怎么把技术平台包装成 SaaS、企业版、行业包和私有化方案？ | How would you package a technical platform into SaaS, enterprise, industry and private-deployment offerings? | 产品包装、定价拆解 | JD 明确版本、定价、SaaS/私有化 | 标品化 + 官方产品能力 | 你没定过价怎么办 |
| 12 | 渠道和省公司不会讲智能体，你怎么让他们卖得动？ | How would you enable provincial companies and channels to sell agents? | 渠道赋能、组织协同 | 岗位不是自己冲上去交付，而是搭体系 | 售前材料 | 培训后仍不会讲怎么办 |

### D. 标品化与客户方案

| # | 问题 | Interview Question | 考什么 | 为什么这轮会问 | 对应故事 | 风险追问 |
|---|---|---|---|---|---|---|
| 13 | 你说约 70% 定制需求转标品，具体怎么判断？ | You mentioned about 70% customization-to-standardization. How exactly did you judge that? | 产品判断、真实性 | 二面会追数字和个人贡献 | 定制转标品 | 70% 怎么来的 |
| 14 | 客户强势要求定制，但你判断不该做，怎么处理？ | What if a strong customer requests customization you believe should not be built? | 冲突、边界、替代方案 | 解决方案经理要守住复用性 | 定制转标品 | 销售站客户那边怎么办 |
| 15 | 如果客户说想做一个政企智能体方案，你怎么从需求到方案？ | How would you turn a government-enterprise agent request into a solution? | 方案方法论 | 政企和私有化是中电信强场景 | Inspector 方法迁移 | 领导层只关心结果怎么讲 |
| 16 | 一个通用办公智能体怎么推广成行业版本？ | How would you turn a general office agent into an industry version? | 行业模板、规模化 | 官方资料提到行业场景模板和规模化部署 | 标品化 | 每个行业差异很大怎么办 |

### E. 组织协同与发展

| # | 问题 | Interview Question | 考什么 | 为什么这轮会问 | 对应故事 | 风险追问 |
|---|---|---|---|---|---|---|
| 17 | 研发、销售、交付对方案边界意见不一致，你怎么推进？ | How do you align engineering, sales and delivery when solution scope conflicts? | 跨团队影响力 | 业务二面会看组织推进能力 | POC/交付协同 | 谁拍板 |
| 18 | 你讲的数字偏过程，怎么证明真实业务结果？ | Your metrics are process-heavy. How do you prove business outcomes? | 量化、防夸大 | 你的简历强在过程与产品化，需防守结果 | 70% + 10+ + MVP | 最硬数字只能讲一个讲哪个 |
| 19 | 入职前三个月你会交付什么？ | What would you deliver in your first 90 days? | 上手路径、业务计划 | 负责人看是否能落地 | 30/60/90 | 前 30 天优先看什么 |
| 20 | 这个岗位需要去省公司培训、和销售见客户，你接受吗？ | This role may require provincial-company training and customer-facing work. Are you comfortable with that? | 稳定性、前台意愿 | 一面已问出差/外向，二面可能确认 | 动机 + 售前支持 | 你是不是只想做产品 |

## 5. Top 5 必练答案

### 1. 90 秒自我介绍

证据来源：简历、二面高压包、一面复盘
JD 命中：产品解决方案、AI Agent、GTM、客户方案
素材完整度：完整

60 秒中文口语版：

> 面试官您好，我是李沛宣，目前在 DataMesh 做 B 端产品经理，主要负责数字孪生、设施运维和 AI 产品化方向。
>
> 如果结合贵司产品解决方案经理岗位，我觉得自己最匹配的不是单点功能经验，而是三类能力组合。第一是 AI Agent 产品化能力，我在 Inspector 设施运维 Agent 项目里，把告警、设备台账、空间位置、SOP、历史工单、诊断建议、工单草稿、人工确认和结果回写拆成闭环，并定义知识源、输出结构、人审边界和验收口径。第二是 B 端标品化能力，过去面对客户定制需求，我会判断哪些做配置、哪些沉淀为标准模块、哪些和产品定位冲突，项目复盘里约 70% 诉求沉淀为标准能力、配置项或模板。第三是商业化协同能力，我参与过 10+ 份方案、POC、产品材料和演示内容支持。
>
> 所以我理解自己能提供的价值，是把复杂 AI 平台能力转成客户听得懂、销售讲得清、渠道能复用、交付能验收的产品方案。

2 分钟中文详细版：

> 面试官您好，我是李沛宣，目前在 DataMesh 做 B 端产品经理，主要负责数字孪生、设施运维和 AI 产品化相关方向。结合上一轮沟通，我理解贵司这个岗位不是传统只写 PRD 的产品经理，而是在产品、解决方案和商业化之间搭桥，把星辰智能体平台能力包装成客户、销售、渠道和交付都能理解和复用的方案。
>
> 我和这个岗位最相关的能力有三点。第一是 AI Agent 产品化。我在 Inspector 设施运维 Agent 项目里，不是把 AI 做成开放式聊天框，而是把告警理解、知识检索、诊断建议、处置方案、工单草稿、人工确认和结果回写拆成任务闭环，并定义知识源优先级、输出结构、置信度、人审节点和验收脚本。
>
> 第二是项目需求转标品。我过去面对客户定制诉求时，不会照单全收，而是拆成客户操作偏好、跨客户共性能力和产品定位冲突三类。能配置的配置，反复出现的沉淀成标准模块，确实专属的明确边界和成本。项目复盘里约 70% 定制诉求没有变成单客户代码，而是沉淀为标准能力、配置项、模板或产品规则。
>
> 第三是商业化协同。我参与过 10+ 份售前方案、POC 范围、演示脚本、产品材料和交付验收口径支持，也做过从二十多个功能里筛出十个客户真正关心推广点的工作。
>
> 所以如果加入贵司，我希望承担的是产品和商业化之间的桥接角色：把星辰智能体能力包装成 SaaS、企业团队版、行业方案和私有化交付规则，再和研发、售前、运营、省公司一起跑出可复制的推广闭环。

English version:

> Hi, I am Li Peixuan. I am currently a B2B product manager at DataMesh, focusing on digital twin, facility operations and AI productization.
>
> For this role, I see my fit in three areas. First, I have experience turning AI Agent concepts into product workflows. In the Inspector facility-operations Agent project, I did not design AI as a generic chatbot. I broke the workflow into alert understanding, context retrieval, diagnosis, recommended actions, work-order draft, human confirmation and result feedback, with clear knowledge sources, output schema, confidence level, human review and acceptance criteria.
>
> Second, I have experience standardizing project requirements into reusable product capabilities. I usually classify customer requests into preferences, cross-customer common needs and requests that conflict with product positioning. Around 70% of customized requirements in our project reviews were turned into standard capabilities, configuration items, templates or product rules.
>
> Third, I have worked with pre-sales, POC scoping, demo scripts, product materials and delivery boundaries. So I can help bridge product, solutions and commercialization: turning Xingchen Agent platform capabilities into product packages that customers understand, sales can explain, channels can reuse and delivery teams can validate.

可能追问：

- 你最匹配的一点是什么？
  答：我最匹配的是“AI Agent 产品化 + 解决方案包装”的组合，既能拆任务闭环、RAG、人审和评测，也能把能力转成 SaaS、行业包、私有化和渠道材料。

待补充：

- 若面试官要求“最硬业务结果”，需确认是否可以讲“运营商多期交付周期 5-6 个月压到 1-2 个月”和“数百万元级项目支撑”的具体客户口径。

### 2. 你过去更偏产品，怎么证明能做 GTM 和商业化推广？

证据来源：一面复盘、二面高压包、简历材料
JD 命中：推广模式、渠道架构、产品包装、客户方案
素材完整度：中高，收入归因需谨慎

60 秒中文口语版：

> 我不会把 GTM 理解成单纯市场宣传，而是理解成产品能力如何被客户理解、被销售讲清、被渠道复用、被交付验收。
>
> 我过去 title 是产品经理，但实际参与过售前方案、POC 范围、演示脚本、产品材料和项目反馈沉淀，支持过 10+ 份方案/POC/产品材料。比如产品推广时，我不会把二十多个功能都堆给市场，而是和售前、项目侧一起筛出真正能打客户痛点的推广点，转成价值主张、Demo 话术和交付边界。
>
> 迁移到星辰智能体，我会按四步做：客户分层、价值主张、可复用资产、反馈闭环。客户分层区分个人/小团队、企业部门、政企行业客户、省公司/渠道；价值主张把模型、RAG、工作流、工具调用、评测翻译成业务结果；资产包括标准 Demo、方案模板、版本矩阵、竞品对比、POC 验收和常见异议；最后把销售和 POC 反馈反哺产品包装和 Roadmap。

2 分钟中文详细版：

> 我承认自己不是传统市场运营或销售出身，也没有独立背过收入指标。但这个岗位的 GTM 更像 AI 产品商业化落地，我有可迁移的经验。
>
> 第一，我会先做客户分层。个人和小团队关注低门槛试用，企业部门关注团队空间、权限、用量、API 和知识库治理，政企/行业客户关注私有化、安全审计、行业模板和交付验收，省公司/渠道关注能不能快速讲清楚、能不能复用材料、能不能降低售前成本。
>
> 第二，我会把技术能力翻译成价值主张。比如星辰智能体内部能力是模型、RAG、工作流、工具调用、评测和追踪，但客户听到的应该是更快创建 AI 应用、更安全管理企业知识、更低成本完成重复流程、更清楚追踪 AI 输出质量。
>
> 第三，我会做销售和渠道可复用资产。包括标准 Demo 脚本、客户方案模板、功能版本矩阵、竞品对比、常见异议、POC 前置条件、验收样例和交付边界。过去我参与过类似工作，比如从二十多个功能里筛出十个真正有客户价值的推广点，配合售前、项目和市场侧做材料。
>
> 第四，GTM 不能发完材料就结束，要看销售是否讲得清、客户是否愿意试用、POC 卡在哪里、哪些需求反复出现，再沉淀成标准模板、行业包、Roadmap 或交付规则。

English version:

> I do not define GTM as marketing communication only. For this role, GTM means making product capabilities understandable to customers, explainable by sales, reusable by channels and verifiable by delivery teams.
>
> Although my title has been product manager, I have supported pre-sales solutions, POC scope, demo scripts, product materials and delivery boundaries across more than 10 solution or POC materials. If I apply that to Xingchen Agent, I would work in four steps: customer segmentation, value proposition, reusable enablement assets and feedback loop.
>
> The key is to translate model, RAG, workflow, tool calling and evaluation into customer outcomes, then package them into demos, solution templates, version matrices, POC criteria and FAQ for channels and provincial companies.

可能追问：

- 你没有背过收入指标怎么办？
  答：我不会把自己包装成销售负责人，但我做过影响线索推进和 POC 成功率的上游工作，包括产品包装、方案材料、演示脚本、验收边界。入职后我会先对齐团队指标，再把产品侧产出和线索转化、POC 成功率、渠道复用率挂钩。

待补充：

- 哪份方案/POC 材料最终直接影响了合同或客户推进，是否有可说的具体例子。

### 3. 你怎么定义一个智能体产品？怎么验收它不是 Demo？

证据来源：Inspector 项目、天翼云产品介绍/工作流/评测文档
JD 命中：智能体平台、RAG、工作流、评测、交付验收
素材完整度：完整

60 秒中文口语版：

> 我会把智能体定义成围绕业务任务运行的 AI 应用，而不是聊天框。它至少要有任务目标、用户输入、知识源、工具/API、工作流、输出协议、权限边界、人审节点、失败兜底和评测机制。
>
> 验收也不能只看“能不能答”。我会分六项：场景验收，看是否覆盖目标用户高频任务；知识验收，看是否命中正确对象、知识源、版本和证据；输出验收，看是否按结构输出结论、依据、置信度、缺失信息和下一步；风险验收，看低置信、高风险、跨权限、缺资料时是否触发人审；业务验收，看业务人员是否愿意采纳、人工修改量是否可接受；交付验收，看部署环境、数据源、接口、权限、运维责任和培训材料是否齐备。
>
> 所以 Demo 到产品之间差的是业务闭环、知识治理、权限审计、评测样例、人审机制和持续 bad case 迭代。

2 分钟中文详细版：

> 我理解的智能体产品有三层。
>
> 第一层是任务定义。它必须服务一个明确业务任务，比如材料审核、政策问答、客服辅助、告警诊断、工单草稿、销售线索整理，而不是泛泛说让 AI 帮我工作。
>
> 第二层是执行机制。要定义它能访问哪些知识库、数据库和工具，如何拆解任务，什么时候调用 RAG，什么时候调用 API，输出什么结构，哪些结论必须带证据，哪些动作必须人工确认。星辰智能体平台本身有工作流、RAG、工具、知识库和评测能力，所以产品经理要做的是把这些能力组合成客户任务闭环，而不是只列功能。
>
> 第三层是运营和治理。智能体上线后一定会有 bad case，所以要有评测集、日志追踪、人工修正、知识库版本管理、权限审计和持续优化机制。
>
> 这套方法来自我的 Inspector 设施运维 Agent 项目。运维场景里 AI 不能只说“可能是设备故障”，它要能说明依据来自哪条告警、哪个设备台账、哪份 SOP、哪些历史工单；如果置信度低，就只能给检查项，不能自动派发工单。迁移到星辰智能体，就是把平台能力从“能搭智能体”推进到“能被客户验收、能被渠道讲清、能被交付运维”。

English version:

> I define an agent product as an AI application that runs around a business task, not just a chatbot. It needs a task goal, user input, knowledge sources, tools or APIs, workflow, output schema, permission boundary, human review, fallback and evaluation mechanism.
>
> To prove it is not just a demo, I would evaluate six aspects: scenario coverage, knowledge accuracy, output structure, risk control, business adoption and delivery readiness. In my Inspector Agent project, this meant making sure the agent could retrieve the right SOP and asset data, output evidence and confidence level, generate only a work-order draft and require human confirmation for high-risk actions.

可能追问：

- 它和聊天机器人有什么区别？
  答：聊天机器人主要完成对话回复；智能体要完成业务任务，包含目标理解、知识检索、工具调用、流程推进、结构化输出和人审确认。

待补充：

- 若面试官追问具体评测指标，可结合星辰平台评测文档讲：响应准确性、工具调用稳定性、知识覆盖度，再补业务指标如人工修改量、结果采纳率、低置信人审比例。

### 4. 你说约 70% 定制需求转标品，具体怎么判断和落地？

证据来源：简历/一面复盘/项目问答沉淀
JD 命中：客户需求转产品方案、标品化、行业方案沉淀
素材完整度：中高

60 秒中文口语版：

> 我会先谨慎定义这个数字：约 70% 指的是项目需求复盘里，较大比例定制诉求没有被做成单客户代码，而是沉淀为标准能力、配置项、模板或产品规则。它不是财务口径，也不是收入归因。
>
> 判断上我分三类。第一类是客户偏好，比如字段显示、入口位置、命名习惯、流程顺序，这类尽量做成配置项或模板。第二类是跨客户共性业务问题，比如资产台账、设备关系、3D 空间定位、告警到工单、SOP 模板、知识库引用、人工审核，这类反复出现就应该抽象成标准模块。第三类是和产品定位冲突的需求，比如客户希望产品变成一次性脚本或纯项目工具，我会回到真实痛点，用更符合平台架构的方式解决。
>
> 这个经验迁移到贵司，就是未来从通用办公智能体到行业版本时，不能每个省公司、每个客户都做一套，而要把高频场景沉淀成模板、版本包、交付手册和验收标准。

2 分钟中文详细版：

> 这个数字我会先说清边界：约 70% 是产品化复盘口径，指一批项目需求最终没有被做成单客户代码，而是沉淀成标准能力、配置项、模板或产品规则。不是财务口径，也不是说我一个人独立创造了 70% 结果。
>
> 我的判断方式有三步。第一步是拉通需求，看它是单个客户的操作习惯，还是多个客户都会遇到的业务问题。第二步是判断它是否影响关键业务结果，比如效率、准确性、交付成本或客户体验。第三步是看它和产品长期定位是否冲突。
>
> 判断后我会分三类处理。客户偏好类做配置，比如字段、入口、流程顺序、名称习惯。共性能力进标准模块，比如资产台账、设备关系、空间定位、告警工单、SOP、知识库引用、人审。定位冲突类先追真实痛点，判断是不是培训、性能、批量操作或流程问题导致客户提出了一个看似定制的方案。
>
> 落地不是写个分类表就结束，而是要变成产品资产：配置项、标准模板、实施基线、Demo 脚本、交付手册和 Roadmap。对于中电信星辰智能体，类似逻辑就是把省公司和行业客户的需求分成通用平台能力、行业模板、客户专属集成和暂不做项，这样才能规模化推广。

English version:

> I would first clarify the metric. The roughly 70% number is a productization review metric. It means many customized requests were not built as one-off customer code, but became standard capabilities, configuration items, templates or product rules. It is not a revenue attribution metric.
>
> My judgment framework has three categories: customer preferences, cross-customer common needs and requests that conflict with product positioning. Preferences should become configurations. Repeated business needs should become standard modules. Conflicting requests should be traced back to the real pain point and solved in a way that fits the platform architecture.
>
> This is very relevant to Xingchen Agent. Provincial companies and industry customers will have different requests, but we should turn repeatable patterns into templates, product packages, delivery guides and acceptance standards.

可能追问：

- 客户强势要求但不该做怎么办？
  答：先承认客户目标重要，再拆真实痛点。如果目标能通过配置、模板、标准流程解决，我给替代方案；如果确实是专属集成，就明确成本、边界、报价和是否进入行业包验证。

待补充：

- 70% 的统计来自哪批项目/需求清单，是否能说“运营商多期项目”或需匿名。

### 5. 入职前三个月你会交付什么？

证据来源：二面 Q&A、一面复盘、JD 解码、公开资料
JD 命中：产品包装、竞品分析、客户方案、推广模式、渠道架构
素材完整度：完整

60 秒中文口语版：

> 我会分 30/60/90 天。
>
> 前 30 天先建立产品和市场底图：深用星辰智能体、TeleAgent、星辰慧记等产品，梳理能力矩阵、版本包装、客户群体、现有渠道材料和典型交付流程；同时拆竞品，比如 Coze、Dify、百度/阿里/腾讯智能体平台，看应用创建、知识库、工作流、评测、发布、私有化和行业模板差异。
>
> 31 到 60 天，选 1 到 2 个重点客群或场景做产品包装优化，比如政企知识问答、办公助手、客服辅助或园区/工业场景，输出产品能力矩阵、版本分层、演示脚本、客户方案模板、竞品对比和 POC 验收口径。
>
> 61 到 90 天，和研发、销售、渠道、运营跑小闭环，看销售是否讲得清、客户是否愿意试用、POC 前置条件是否明确、交付是否接得住，再调整版本包装、行业模板和 Roadmap。
>
> 90 天可见成果至少是一套场景方案包、一套版本包装建议、一套竞品对比、一套 POC 验收模板，以及一次和销售/渠道共同验证后的反馈闭环。

2 分钟中文详细版：

> 我不会一入职就先大改产品，而是先把产品、市场和组织协同底图跑清楚。
>
> 前 30 天，我会做三件事。第一，深用星辰智能体平台和相关产品，比如 TeleAgent、星辰慧记，理解创建智能体、知识库、工作流、工具调用、评测、发布、用量统计和私有化相关能力。第二，读现有材料和项目复盘，包括销售怎么讲、客户怎么问、交付卡在哪里、哪些需求反复出现。第三，做竞品拆解，看 Coze、Dify、百度、阿里、腾讯在应用创建、模板、知识库、评测、发布、企业管理和私有化上的差异。
>
> 31 到 60 天，我会选 1 到 2 个高优先级场景做产品包装。比如政企知识问答或办公流程助手，输出一套能力矩阵、版本分层、客户价值主张、Demo 脚本、方案模板、POC 验收表和常见异议。重点不是做一份漂亮 PPT，而是让销售能讲、客户能懂、交付能接。
>
> 61 到 90 天，我会拉研发、销售、渠道、运营一起跑小闭环。验证销售讲不讲得清、客户是否愿意试用、POC 条件是否清楚、哪些需求需要进入 Roadmap，最后沉淀成标准方案包和产品规则。
>
> 所以 90 天的可见成果，我希望是：一套场景方案包、一套版本包装建议、一套竞品对比、一套 POC 验收模板，以及一次真实渠道或客户反馈后的迭代记录。

English version:

> I would split the first 90 days into three stages. In the first 30 days, I would build a product and market map: deeply use Xingchen Agent and related products, review capability matrix, sales materials, customer segments and delivery workflow, and benchmark competitors.
>
> From day 31 to 60, I would choose one or two priority scenarios and package them into solution assets: capability matrix, version tiers, demo scripts, customer solution templates, competitor comparison and POC acceptance criteria.
>
> From day 61 to 90, I would run a small feedback loop with engineering, sales, channels and operations. The goal is to test whether sales can explain the value, customers are willing to try, POC prerequisites are clear and delivery can support it. The visible deliverables would be one scenario solution package, one version-packaging proposal, one competitor comparison, one POC acceptance template and one feedback iteration record.

可能追问：

- 前 30 天你会优先看什么？
  答：优先看产品能力矩阵、目标客户分类、当前销售材料、典型项目复盘和竞品。因为这个岗位不是单纯熟悉功能，而是要知道功能怎么被卖出去、交付下去、反馈回来。

待补充：

- 如果面试官透露岗位当前最急问题，要立刻把 90 天计划改成围绕那个问题。

## 6. 缺口与补强

### 已有材料不足的地方

1. GTM 结果证据：目前能讲材料、POC、演示、培训和推广点筛选，但缺少明确线索转化、签约金额或付费转化归因。
2. 70% 口径：需要确认来自哪批项目需求复盘，避免被问“这个数字怎么统计”时只说体感。
3. 省公司/渠道真实协作：你有售前/项目/市场协同，但不一定有运营商省公司协同，回答时要说“可迁移”。
4. 星辰产品细节：需面前再快速过一遍星辰智能体平台、TeleAgent、星辰慧记、TokenHub、私有化市场前五这些资料。

### 建议你补充确认的问题

请优先补这 3 个事实，每个 2-3 句即可：

1. 过去 10+ 份方案/POC/产品材料里，哪 1 份最能证明“产品包装影响客户推进”？
2. 约 70% 定制需求转标品，最能落到哪个具体项目或哪批需求清单？
3. 你是否真的参与过培训/对外演示？对象是售前、客户、项目团队还是市场？

## 7. 临场短句

- 我理解这个岗位是在产品、解决方案和商业化之间搭桥。
- 我不会把智能体只讲成聊天框，而会讲成任务、知识、工具、流程、人审和评测闭环。
- 已发生结果我只讲确认过的数字；AI 效果我会讲验收指标，不编上线效果。
- 产品包装不能按内部功能树拆，要按客户购买和交付决策拆。
- 省公司和渠道要的不是模型细节，而是客户痛点、标准话术、Demo 脚本、部署条件和常见异议。
- 我的优势不是纯售前，也不是纯后端产品，而是把客户问题反推成可复用产品能力。

## 8. 最后反问

如果只能问一个：

> 这个岗位前 90 天最希望我交付的可见成果是什么？是产品能力包装、某个行业方案、渠道材料，还是私有化交付方案？

如果时间允许再问：

- 团队判断产品解决方案经理做得好，主要看 POC 推进、渠道复用率、方案交付质量，还是产品 Roadmap 贡献？
- 这个岗位和研发产品经理、售前、运营、交付、省公司之间的边界如何划分？
- 星辰智能体未来半年更优先平台通用能力升级，还是沉淀政务、工业、教育、交通等行业模板？
