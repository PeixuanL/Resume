import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = "/Users/jane/Resume/outputs/Inspector设施运维AI产品作品集_框架稿_李沛宣.pptx";
const PREVIEW_DIR = "/Users/jane/Resume/work/presentations/inspector-framework/tmp/preview";
const LAYOUT_DIR = "/Users/jane/Resume/work/presentations/inspector-framework/tmp/layout";
const QA_DIR = "/Users/jane/Resume/work/presentations/inspector-framework/tmp/qa";

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function addText(slide, text, position, style = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontSize: style.fontSize ?? 20,
    bold: style.bold ?? false,
    color: style.color ?? "slate-900",
    alignment: style.alignment ?? "left",
    ...style.textStyle,
  };
  return shape;
}

function addBox(slide, title, body, position, opts = {}) {
  const box = slide.shapes.add({
    geometry: "roundRect",
    position,
    fill: opts.fill ?? "white",
    line: { style: "solid", fill: opts.line ?? "slate-200", width: 1 },
    borderRadius: "rounded-lg",
  });
  addText(slide, title, {
    left: position.left + 18,
    top: position.top + 16,
    width: position.width - 36,
    height: 30,
  }, { fontSize: opts.titleSize ?? 20, bold: true, color: opts.titleColor ?? "slate-950" });
  addText(slide, body, {
    left: position.left + 18,
    top: position.top + 54,
    width: position.width - 36,
    height: position.height - 68,
  }, { fontSize: opts.bodySize ?? 17, color: opts.bodyColor ?? "slate-700" });
  return box;
}

function addFooter(slide, index, section = "Inspector Product Case Study") {
  addText(slide, section, { left: 72, top: 676, width: 520, height: 22 }, {
    fontSize: 12,
    color: "slate-500",
    bold: true,
  });
  addText(slide, String(index).padStart(2, "0"), { left: 1154, top: 674, width: 54, height: 24 }, {
    fontSize: 13,
    color: "slate-500",
    bold: true,
    alignment: "right",
  });
}

function addHeader(slide, index, eyebrow, title, subtitle = "") {
  slide.background.fill = "slate-50";
  addText(slide, eyebrow, { left: 72, top: 42, width: 360, height: 24 }, {
    fontSize: 12,
    bold: true,
    color: "slate-500",
  });
  addText(slide, title, { left: 72, top: 76, width: 980, height: 64 }, {
    fontSize: 35,
    bold: true,
    color: "slate-950",
  });
  if (subtitle) {
    addText(slide, subtitle, { left: 74, top: 140, width: 1030, height: 34 }, {
      fontSize: 18,
      color: "slate-600",
    });
  }
  addFooter(slide, index);
}

const slides = [
  {
    eyebrow: "CASE STUDY FRAMEWORK",
    title: "Inspector 设施运维 AI 产品案例",
    subtitle: "作品集框架：面向 AI 产品经理 / 数字孪生产品经理的案例研究",
    thesis: "以 Inspector 为主案例，呈现从业务问题定义、产品定位、数据建模、流程设计到 AI 能力规划的完整产品工作链路。",
    boxes: [
      ["案例范围", "Inspector 设施运维：告警、资产、工单、SOP、3D 场景与 AI 辅助处置"],
      ["目标岗位", "AI 产品经理 / 数字孪生产品经理 / B 端产品经理"],
      ["证据策略", "每页围绕一个产品经理动作，匹配需求文档、流程图、数据表、原型或验收材料"],
    ],
  },
  {
    eyebrow: "02 · MATERIAL STRATEGY",
    title: "材料组织：围绕产品能力而非功能截图展开",
    subtitle: "将现有材料映射到产品工作链路：需求识别、定位判断、架构协同、数据建模、流程设计、原型验证与验收交付。",
    ability: "证据组织与案例表达",
    hook: "本页说明作品集的阅读方式：每类材料都对应一个明确的产品经理动作，避免变成产品介绍或截图堆叠。",
    evidence: "需求文档、架构图、竞品分析表、产品间流程图、原型图、主数据表、主数据流图、功能清单、Vibe Coding 原型",
    gap: "补充 AI Prompt / Agent 设计、人机协同规则、AI 评测指标，以及已落地 / MVP / 规划中的边界说明",
  },
  {
    eyebrow: "03 · BUSINESS CONTEXT",
    title: "业务背景：从被动维修到闭环运维管理",
    subtitle: "设施运维场景的核心矛盾不是系统缺失，而是告警、资产、工单、SOP 与现场执行之间缺少可追踪闭环。",
    ability: "复杂业务理解与问题定义",
    hook: "通过业务现状归纳运维断点：告警不可处置、资产脱离现场、工单流转割裂、经验难以沉淀。",
    evidence: "需求文档：客户场景、痛点归纳、Inspector 8.0 概要设计",
    gap: "客户访谈摘要、旧流程痛点截图、现有系统割裂示意，以及关键角色的作业链路说明",
  },
  {
    eyebrow: "04 · MARKET POSITIONING",
    title: "产品定位：面向闭环处置的设施运维平台",
    subtitle: "基于竞品与场景判断，产品切口不是纯 CMMS 或 3D 大屏，而是告警、资产、工单与 SOP 的闭环协同。",
    ability: "竞品分析与产品定位",
    hook: "通过能力矩阵沉淀定位结论：同类产品分别强在工单、资产、楼控或可视化，机会点在跨系统闭环与 AI 辅助处置。",
    evidence: "竞品分析表：能力矩阵、差异点、机会点、功能优先级",
    gap: "将完整竞品表压缩为 3-5 条结论，并补充差异化定位与第一阶段取舍依据",
  },
  {
    eyebrow: "05 · MVP DEFINITION",
    title: "MVP 定义：先验证最短可交付闭环",
    subtitle: "第一阶段聚焦告警识别、人工确认、生成 / 关联工单、执行回写与 SOP 沉淀，避免过早承诺全自动智能运维。",
    ability: "MVP 范围管理",
    hook: "本页突出范围判断：AI 产品第一阶段的关键不是全自动，而是让业务闭环可运行、可验收、可持续迭代。",
    evidence: "功能清单、P0/P1/P2、Roadmap、需求文档目录",
    gap: "补充范围取舍清单，例如暂缓自动派单、全自动关单、预测性维护大模型化等能力的原因",
  },
  {
    eyebrow: "06 · SOLUTION ARCHITECTURE",
    title: "方案架构：多系统协同下的运维业务流",
    subtitle: "Inspector 不是孤立应用，需要与外部告警、BMS / IoT、工单系统、3D 场景和资产主数据协作。",
    ability: "系统边界与跨产品协同",
    hook: "本页呈现产品边界判断：哪些系统提供数据，哪些模块消费数据，哪些状态需要同步，以及哪些责任不应混入本产品。",
    evidence: "架构图、产品间流程图、外部系统对接说明",
    gap: "补充系统责任边界表，区分产品定义、研发实现、外部系统依赖与客户现场配置",
  },
  {
    eyebrow: "07 · MASTER DATA",
    title: "主数据设计：空间、设备、告警、工单与知识对象建模",
    subtitle: "AI 与数字孪生能力的基础，是资产、空间、设备、告警、工单和 SOP 对象能够被结构化关联。",
    ability: "主数据建模",
    hook: "本页将主数据解释为 AI 和数字孪生的底座：设备 ID 串联位置、状态、告警、工单和知识记录。",
    evidence: "主数据设计表格、主数据流图、资产/告警/工单字段定义",
    gap: "补充简化对象关系图：空间、设备、告警、工单、SOP、人员、剧本之间的关键关联",
  },
  {
    eyebrow: "08 · PROCESS MODELING",
    title: "流程设计：从告警触发到工单处置的状态联动",
    subtitle: "复杂 B 端产品的关键不是增加入口，而是定义状态、异常分支、关闭条件和跨系统回写规则。",
    ability: "流程建模与状态机设计",
    hook: "本页聚焦告警转工单：生成 / 关联只是入口，真正难点在状态如何联动、何时关闭、由谁确认。",
    evidence: "产品间流程图、工单流程图、告警状态联动规则",
    gap: "补充异常分支示例，例如多工单关联、工单驳回、设备信号未恢复、外部系统回写失败",
  },
  {
    eyebrow: "09 · ALERT MODEL",
    title: "告警模型：从通知消息到可处置事件",
    subtitle: "告警不仅用于展示，还需要支持溯源、合并、下钻、转工单、处置记录与审计追踪。",
    ability: "业务对象抽象",
    hook: "本页体现对象抽象能力：通过外联 ID、JSON 扩展数据、合并规则和历史记录，让告警具备处置属性。",
    evidence: "告警管理需求文档、JSON 扩展数据、告警合并机制、外联 ID 设计",
    gap: "补充告警详情原型、告警卡片 / 抽屉截图，以及字段与处置动作的对应说明",
  },
  {
    eyebrow: "10 · WORK ORDER MODEL",
    title: "工单模型：多来源任务的统一承接与执行管理",
    subtitle: "手动创建、告警转入、故障提报、点巡检和预防性维护任务，统一进入派发、执行、验收、回写链路。",
    ability: "复杂入口归一化",
    hook: "本页用流程图说明入口归一：任务来源可以不同，但执行模型必须统一，否则一线执行和后续分析都会断裂。",
    evidence: "工单管理流程图、工单管理需求文档、执行端流程",
    gap: "将现有工单流程图裁切为两段展示：任务来源与生成、一线执行与验收回写",
  },
  {
    eyebrow: "11 · DIGITAL TWIN CONTEXT",
    title: "数字孪生场景：面向现场处置的空间上下文",
    subtitle: "3D 场景的价值不是展示大屏，而是帮助定位设备、理解空间关系、查看运行监测并关联处置记录。",
    ability: "数字孪生业务价值判断",
    hook: "本页面向数字孪生岗位突出业务判断：让告警和工单拥有空间上下文，而不是把 3D 作为单独展示层。",
    evidence: "原型图、资产详情、3D 定位、设备关系、运行监测、视频流",
    gap: "补充设备详情页截图、3D 聚焦截图、资产-工单 Tab 截图，并标注它们服务的处置动作",
  },
  {
    eyebrow: "12 · KNOWLEDGE ASSET",
    title: "SOP 模板库：维修经验的标准化与资产化",
    subtitle: "闭环的终点不是关单，而是将有效步骤、检查项和处置剧本沉淀为可复用模板。",
    ability: "产品化与标品沉淀",
    hook: "本页体现产品化能力：将项目制交付中的一次性经验沉淀为模板库，减少重复填写和专家经验流失。",
    evidence: "SOP 模板库需求、版本控制、Copy on Write、工单沉淀逻辑",
    gap: "补充模板库原型图、优质工单转模板示意，以及模板更新与版本管理规则",
  },
  {
    eyebrow: "13 · PROTOTYPE VALIDATION",
    title: "原型验证：基于 Vibe Coding 的流程可用性验证",
    subtitle: "Vibe Coding 用于提前暴露字段缺失、状态遗漏和交互断点，辅助 PRD 修订与产研评审。",
    ability: "原型验证与产研沟通",
    hook: "本页不单纯展示页面，而是说明原型验证发现的问题，例如字段不足、状态不闭环、执行端路径过长。",
    evidence: "Vibe Coding 原型页面、原型操作录屏/截图、PRD 修订记录",
    gap: "补充复盘表：原型发现的问题、PRD 如何调整、影响哪些角色与流程节点",
  },
  {
    eyebrow: "14 · AI CAPABILITY DESIGN",
    title: "AI 能力规划：人机协同的诊断、建议与处置辅助",
    subtitle: "AI 设计重点不是堆叠 Prompt，而是明确输入输出、责任边界、人工兜底和验收指标。",
    ability: "AI 产品设计与风险边界",
    hook: "本页规划四类补充材料：Agent 分工图、Prompt 输入输出样例、人机协同规则、AI 验收指标。",
    evidence: "可从人机协同预测性维护 MD、告警/工单/SOP 材料中提炼",
    gap: "补充低置信人工复核、高风险不自动执行、引用来源、前三命中率、字段完整率、误建议率等规则",
  },
  {
    eyebrow: "15 · CAPABILITY SUMMARY",
    title: "能力总结：从复杂业务到 AI 产品闭环落地",
    subtitle: "通过 Inspector 案例证明复杂问题定义、数据与流程建模、原型验证、AI 边界设计和版本交付能力。",
    ability: "面试收束",
    hook: "结尾将案例收束为岗位匹配：能够把 AI 能力嵌入真实 B 端业务闭环，而不是停留在概念层。",
    evidence: "前 14 页材料汇总",
    gap: "补充阶段成果与诚实边界，清晰区分已完成、Demo / MVP、待验证指标与后续规划",
  },
];

const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });

slides.forEach((s, idx) => {
  const slide = p.slides.add();
  const n = idx + 1;

  if (idx === 0) {
    slide.background.fill = "slate-950";
    addText(slide, "CASE STUDY FRAMEWORK", { left: 72, top: 56, width: 360, height: 28 }, {
      fontSize: 14,
      bold: true,
      color: "slate-300",
    });
    addText(slide, s.title, { left: 72, top: 132, width: 950, height: 74 }, {
      fontSize: 52,
      bold: true,
      color: "white",
    });
    addText(slide, s.subtitle, { left: 76, top: 224, width: 940, height: 44 }, {
      fontSize: 22,
      color: "slate-300",
    });
    addBox(slide, "核心主线", s.thesis, { left: 72, top: 326, width: 770, height: 118 }, {
      fill: "slate-900",
      line: "slate-700",
      titleColor: "white",
      bodyColor: "slate-200",
      bodySize: 18,
    });
    s.boxes.forEach((b, i) => {
      addBox(slide, b[0], b[1], { left: 72 + i * 372, top: 486, width: 340, height: 112 }, {
        fill: i === 0 ? "blue-950" : "slate-900",
        line: i === 0 ? "blue-700" : "slate-700",
        titleColor: "white",
        bodyColor: "slate-200",
        bodySize: 16,
      });
    });
    addText(slide, "李沛宣 Jane · B 端 / AI / 数字孪生产品经理", { left: 72, top: 674, width: 680, height: 24 }, {
      fontSize: 13,
      color: "slate-400",
      bold: true,
    });
    addText(slide, "01", { left: 1152, top: 674, width: 56, height: 24 }, {
      fontSize: 13,
      color: "slate-400",
      bold: true,
      alignment: "right",
    });
    return;
  }

  addHeader(slide, n, s.eyebrow, s.title, s.subtitle);
  addBox(slide, "证明的产品经理能力", s.ability, { left: 72, top: 204, width: 300, height: 110 }, {
    fill: "blue-50",
    line: "blue-200",
    titleColor: "blue-950",
    bodyColor: "slate-900",
    bodySize: 19,
  });
  addBox(slide, "案例叙事重点", s.hook, { left: 404, top: 204, width: 804, height: 110 }, {
    fill: "white",
    line: "slate-200",
    titleColor: "slate-950",
    bodyColor: "slate-700",
    bodySize: 18,
  });
  addBox(slide, "已有证据材料", s.evidence, { left: 72, top: 344, width: 552, height: 178 }, {
    fill: "white",
    line: "emerald-200",
    titleColor: "emerald-900",
    bodyColor: "slate-700",
    bodySize: 18,
  });
  addBox(slide, "待补强材料", s.gap, { left: 656, top: 344, width: 552, height: 178 }, {
    fill: "amber-50",
    line: "amber-200",
    titleColor: "amber-900",
    bodyColor: "slate-800",
    bodySize: 18,
  });
  addText(slide, "材料呈现建议：后续将对应截图或表格裁切放在本页下半区，并保留一行关键结论。", {
    left: 72,
    top: 558,
    width: 1100,
    height: 34,
  }, { fontSize: 17, color: "slate-500" });
});

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.mkdir(PREVIEW_DIR, { recursive: true });
await fs.mkdir(LAYOUT_DIR, { recursive: true });
await fs.mkdir(QA_DIR, { recursive: true });

for (const [index, slide] of p.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  await writeBlob(path.join(PREVIEW_DIR, `${stem}.png`), await p.export({ slide, format: "png", scale: 1 }));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(LAYOUT_DIR, `${stem}.layout.json`), await layout.text());
}

await writeBlob(path.join(PREVIEW_DIR, "montage.webp"), await p.export({ format: "webp", montage: true, scale: 1 }));

const inspect = await p.inspect({ kind: "slide,textbox,shape,layout", maxChars: 50000 });
await fs.writeFile(path.join(QA_DIR, "inspect.ndjson"), inspect.ndjson);

const pptx = await PresentationFile.exportPptx(p);
await pptx.save(OUT);

console.log(JSON.stringify({
  output: OUT,
  slides: p.slides.items.length,
  preview: PREVIEW_DIR,
  layout: LAYOUT_DIR,
  qa: path.join(QA_DIR, "inspect.ndjson"),
}, null, 2));
