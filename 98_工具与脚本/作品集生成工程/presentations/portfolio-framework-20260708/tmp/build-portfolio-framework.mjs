import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = "C:/cursor/Resume/作品集准备/04_PDF_PPT/Inspector主案例作品集_框架稿_2026-07-08.pptx";
const PREVIEW = "C:/cursor/Resume/work/presentations/portfolio-framework-20260708/tmp/preview";
const ASSET = "C:/cursor/Resume/作品集准备/assets/screenshots/最终推荐_2026-07-03";

const W = 1280, H = 720;
const C = {
  ink: "#111827",
  muted: "#5B6472",
  panel: "#F2F4F7",
  line: "#D0D5DD",
  soft: "#F8FAFC",
  accent: "#E85D2A",
  blue: "#2F5F9F",
  green: "#257A5A",
  amber: "#9A6200",
  red: "#9F2D2D",
  white: "#FFFFFF"
};

async function writeBlob(file, blob) {
  await fs.writeFile(file, new Uint8Array(await blob.arrayBuffer()));
}
function addBox(slide, x, y, w, h, fill = C.panel, line = C.line, name = "box") {
  return slide.shapes.add({ geometry: "rect", name, position: { left: x, top: y, width: w, height: h }, fill, line: { style: "solid", fill: line, width: 1 } });
}
function addText(slide, text, x, y, w, h, opts = {}) {
  const shape = slide.shapes.add({ geometry: "textbox", name: opts.name || "text", position: { left: x, top: y, width: w, height: h }, fill: "none", line: { style: "solid", fill: "none", width: 0 } });
  shape.text = text;
  shape.text.style = { fontSize: opts.size || 22, bold: !!opts.bold, color: opts.color || C.ink, alignment: opts.align || "left" };
  return shape;
}
function addTitle(slide, title, subtitle = "") {
  addText(slide, title, 56, 36, 880, 58, { size: 34, bold: true });
  if (subtitle) addText(slide, subtitle, 58, 92, 760, 30, { size: 16, color: C.muted });
  addText(slide, "Inspector 主案例框架稿", 1000, 42, 220, 24, { size: 14, color: C.muted, align: "right" });
  slide.shapes.add({ geometry: "rect", position: { left: 56, top: 128, width: 1168, height: 1 }, fill: C.line, line: { style: "solid", fill: C.line, width: 0 } });
}
function addFooter(slide, idx, note = "灰色区域 = 需要补的过程证据或待重绘图") {
  addText(slide, note, 56, 674, 780, 24, { size: 13, color: C.muted });
  addText(slide, String(idx).padStart(2, "0"), 1176, 670, 48, 28, { size: 18, bold: true, color: C.muted, align: "right" });
}
function tag(slide, text, x, y, color = C.accent, w = 112) {
  addBox(slide, x, y, w, 28, color, color, "tag");
  addText(slide, text, x + 8, y + 6, w - 16, 18, { size: 12, color: C.white, bold: true, align: "center" });
}
async function addImage(slide, file, x, y, w, h, fit = "cover", alt = "screenshot") {
  const bytes = await fs.readFile(path.join(ASSET, file));
  const ext = file.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  slide.images.add({ blob: bytes, contentType: ext, alt, fit, position: { left: x, top: y, width: w, height: h } });
}
function evidenceSlot(slide, title, desc, x, y, w, h, color = C.amber) {
  addBox(slide, x, y, w, h, C.soft, C.line, "evidence-slot");
  tag(slide, "待补证据", x + 14, y + 14, color, 92);
  addText(slide, title, x + 18, y + 54, w - 36, 28, { size: 20, bold: true });
  addText(slide, desc, x + 18, y + 90, w - 36, h - 104, { size: 15, color: C.muted });
}
function bulletList(slide, items, x, y, w, h, opts = {}) {
  addText(slide, items.map((it) => `• ${it}`).join("\n"), x, y, w, h, { size: opts.size || 18, color: opts.color || C.ink });
}
function processRow(slide, steps, x, y, w, h) {
  const gap = 10;
  const sw = (w - gap * (steps.length - 1)) / steps.length;
  steps.forEach((s, i) => {
    const sx = x + i * (sw + gap);
    addBox(slide, sx, y, sw, h, i === 0 ? "#111827" : C.panel, i === 0 ? "#111827" : C.line, "process-step");
    addText(slide, s, sx + 8, y + 16, sw - 16, h - 24, { size: 15, bold: i === 0, color: i === 0 ? C.white : C.ink, align: "center" });
  });
}

async function main() {
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.mkdir(PREVIEW, { recursive: true });
  const deck = Presentation.create({ slideSize: { width: W, height: H } });

  // 1
  let slide = deck.slides.add();
  slide.background.fill = C.white;
  await addImage(slide, "01_3D场景与空间定位.jpg", 640, 0, 640, 720, "cover", "3D scene positioning");
  addBox(slide, 0, 0, 672, 720, C.white, C.white);
  tag(slide, "框架稿", 56, 54, C.accent, 88);
  addText(slide, "Inspector 设施运维\nAI 辅助闭环", 56, 120, 520, 150, { size: 46, bold: true });
  addText(slide, "面向 B 端 AI 产品经理 / 智能楼宇 / 数字孪生岗位\n用一个主案例证明：0-1 产品闭环、复杂流程拆解、AI 产品化边界。", 60, 300, 520, 82, { size: 20, color: C.muted });
  processRow(slide, ["场景", "底座", "闭环", "AI", "验证"], 60, 440, 500, 58);
  evidenceSlot(slide, "封面仍需补", "一句更强的岗位定位；可选：个人姓名/目标岗位，不放公司敏感信息。", 60, 536, 500, 92, C.blue);
  addFooter(slide, 1, "先看整体感觉：左侧是叙事，右侧是真实产品场景锚点");

  // 2
  slide = deck.slides.add(); slide.background.fill = C.white;
  addTitle(slide, "设施运维的问题不是缺 AI，而是链路断裂", "这一页要展示你的问题定义能力，不是展示产品功能。")
  addBox(slide, 58, 166, 480, 382, C.panel, C.line);
  addText(slide, "Before 流程断点", 88, 196, 240, 30, { size: 24, bold: true });
  processRow(slide, ["告警", "查设备", "翻 SOP", "问专家", "手动建单"], 88, 260, 400, 58);
  bulletList(slide, ["上下文分散", "责任流转不清", "处置经验难沉淀"], 96, 360, 360, 120, { size: 21 });
  evidenceSlot(slide, "补：需求拆解片段", "从 PRD 或分析文档截 1 小块：用户角色、痛点、业务断点。不要截整页。", 586, 166, 290, 382, C.amber);
  evidenceSlot(slide, "补：竞品/行业取舍", "只放结论：为什么不做普通 Chatbot，为什么要放进告警-工单闭环。", 912, 166, 290, 382, C.blue);
  addFooter(slide, 2);

  // 3
  slide = deck.slides.add(); slide.background.fill = C.white;
  addTitle(slide, "产品底座让 AI 和工单不悬空", "用真实截图证明对象、位置、异常、状态都存在。")
  await addImage(slide, "01_3D场景与空间定位.jpg", 58, 166, 500, 282, "cover", "3D positioning");
  await addImage(slide, "02_告警详情与异常触发.jpg", 586, 166, 300, 170, "cover", "alert detail");
  await addImage(slide, "备选_设备详情与关联关系.jpg", 586, 362, 300, 170, "cover", "device relation");
  evidenceSlot(slide, "补：信息架构小图", "资产/设备、3D、告警、工单、知识库之间的关系。建议重绘，不贴复杂原图。", 920, 166, 284, 366, C.amber);
  addText(slide, "能力点：系统化建模", 64, 474, 420, 30, { size: 22, bold: true });
  addText(slide, "不是只做页面，而是把物理空间、设备对象、异常事件组织成可流转的业务上下文。", 64, 512, 500, 56, { size: 18, color: C.muted });
  addFooter(slide, 3);

  // 4
  slide = deck.slides.add(); slide.background.fill = C.white;
  addTitle(slide, "核心闭环把截图变成产品经理案例", "这一页要让面试官看懂你的端到端链路设计。")
  processRow(slide, ["异常", "上下文", "检索", "建议", "确认", "工单", "执行", "沉淀"], 66, 176, 1100, 66);
  evidenceSlot(slide, "补：AI/工单闭环正式图", "根据现有 Mermaid 草图重绘，突出人工确认闸门和知识沉淀回流。", 66, 292, 520, 250, C.amber);
  evidenceSlot(slide, "补：状态机或异常分支", "至少体现退回、改派、完成、验收这类 B 端复杂流程。", 646, 292, 520, 250, C.blue);
  addText(slide, "我的判断", 66, 570, 160, 26, { size: 22, bold: true });
  addText(slide, "AI 不直接派单或维修，它把分散信息组织成可审核建议，再进入人工确认后的工单流转。", 190, 568, 840, 36, { size: 19, color: C.ink });
  addFooter(slide, 4);

  // 5
  slide = deck.slides.add(); slide.background.fill = C.white;
  addTitle(slide, "AI 页要讲输入输出和风险边界", "单张 AI 截图不够，必须配产品化拆解。")
  await addImage(slide, "03_AI故障诊断建议.png", 58, 170, 480, 270, "contain", "AI diagnosis suggestion");
  addText(slide, "现有截图：可作为证据，但不独立承担 AI 产品化证明", 62, 458, 470, 42, { size: 17, color: C.muted });
  evidenceSlot(slide, "补：AI 结果卡片", "原因、依据、建议、引用来源、风险提示、确认按钮。", 586, 170, 284, 330, C.amber);
  evidenceSlot(slide, "补：输入输出表", "输入：SOP/手册/历史工单/设备/告警；输出：原因、步骤、草稿、风险。", 918, 170, 284, 330, C.blue);
  addText(slide, "能力点：AI 产品化边界", 586, 536, 280, 28, { size: 22, bold: true });
  addText(slide, "你负责定义 AI 在业务流里的位置，而不是声称自己训练模型。", 586, 572, 560, 36, { size: 19, color: C.muted });
  addFooter(slide, 5);

  // 6 key sample
  slide = deck.slides.add(); slide.background.fill = C.white;
  addTitle(slide, "工单闭环页最能证明你的产品能力", "这一页是样板页：产品截图 + 状态机 + PRD片段 + 取舍。")
  await addImage(slide, "04_告警创建工单任务.jpg", 58, 166, 440, 248, "cover", "create work order from alert");
  addText(slide, "结果截图：告警进入工单任务", 62, 430, 420, 26, { size: 18, bold: true });
  processRow(slide, ["创建", "分派", "执行", "退回", "改派", "完成", "验收", "评价"], 530, 170, 676, 54);
  evidenceSlot(slide, "补：PRD 片段", "截用户故事/验收标准/字段说明。只要 1 小块，证明你把需求写成可开发规则。", 530, 256, 320, 210, C.amber);
  evidenceSlot(slide, "补：异常分支", "退回、改派、SLA、评价、移动端/离线执行，任选最能证明复杂度的 1-2 个。", 884, 256, 322, 210, C.blue);
  addBox(slide, 530, 498, 676, 76, "#FFF7ED", "#FDBA74");
  addText(slide, "我的取舍", 548, 512, 120, 24, { size: 18, bold: true, color: C.amber });
  addText(slide, "不把告警停留在“看到”，而是进入责任明确、状态可追踪、异常可回退的处置流程。", 668, 512, 500, 40, { size: 18, color: C.ink });
  addFooter(slide, 6, "优先补这一页的材料，它会立刻把作品集从产品介绍变成能力展示");

  // 7
  slide = deck.slides.add(); slide.background.fill = C.white;
  addTitle(slide, "现场执行页证明闭环没有停在后台", "展示移动端/现场/离线/反馈这些真实执行约束。")
  await addImage(slide, "05_移动端工单执行闭环.jpg", 78, 156, 356, 356, "contain", "mobile work order execution");
  addText(slide, "现有图需要裁切或套手机框", 92, 530, 320, 24, { size: 18, color: C.red, bold: true, align: "center" });
  evidenceSlot(slide, "补：原型验证说明", "这张图验证了什么？接单、查看上下文、执行、提交、验收中的哪一步。", 500, 166, 326, 340, C.amber);
  evidenceSlot(slide, "补：现场约束", "离线、剧本/AR/3D资源、设备详情工单 Tab；没有截图就用流程小图。", 872, 166, 326, 340, C.blue);
  addFooter(slide, 7);

  // 8
  slide = deck.slides.add(); slide.background.fill = C.white;
  addTitle(slide, "最后一页把能力归因到你身上", "避免只证明产品好，要证明你为什么适合目标岗位。")
  const rows = [
    ["主导", "设施运维 0-1 产品闭环、PRD/流程/状态机/页面结构沉淀"],
    ["负责", "工单闭环、告警/资产/3D 与运维流程的信息架构串联"],
    ["参与", "AI Agent/RAG 的产品化表达、输入输出、风险边界"],
    ["方法", "用 AI 工具辅助 PRD 结构化、流程图/状态机、原型验证"]
  ];
  rows.forEach((r, i) => {
    const y = 168 + i * 82;
    addBox(slide, 70, y, 170, 56, i === 0 ? "#111827" : C.panel, i === 0 ? "#111827" : C.line);
    addText(slide, r[0], 92, y + 16, 126, 24, { size: 22, bold: true, color: i === 0 ? C.white : C.ink, align: "center" });
    addText(slide, r[1], 280, y + 10, 760, 42, { size: 20, color: C.ink });
  });
  evidenceSlot(slide, "补：贡献证据", "可放确认版贡献分层、PRD目录、评审记录、原型验证结果。", 910, 504, 280, 96, C.amber);
  addText(slide, "不写虚构 ROI、准确率、自动派单。重点写：方案沉淀、Demo/原型验证、可复用业务闭环。", 72, 536, 780, 52, { size: 20, color: C.muted });
  addFooter(slide, 8, "这一页用于面试追问，不要堆结果，要讲清贡献边界");

  for (const [index, s] of deck.slides.items.entries()) {
    const png = await deck.export({ slide: s, format: "png", scale: 1 });
    await writeBlob(path.join(PREVIEW, `slide-${String(index + 1).padStart(2, "0")}.png`), png);
    const layout = await s.export({ format: "layout" });
    await fs.writeFile(path.join(PREVIEW, `slide-${String(index + 1).padStart(2, "0")}.layout.json`), await layout.text());
  }
  const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
  await writeBlob(path.join(PREVIEW, "deck-montage.webp"), montage);
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(OUT);
  console.log(OUT);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
