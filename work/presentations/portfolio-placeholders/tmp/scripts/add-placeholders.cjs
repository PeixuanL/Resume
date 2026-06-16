const fs = require("node:fs/promises");
const path = require("node:path");
const { FileBlob, PresentationFile } = require("@oai/artifact-tool");

const SOURCE_PPTX = path.resolve("outputs", "B端数字孪生AI产品经理作品集_李沛宣.pptx");
const FINAL_PPTX = SOURCE_PPTX;
const OUT_ROOT = path.resolve("work", "presentations", "portfolio-placeholders", "tmp");
const PREVIEW_DIR = path.join(OUT_ROOT, "preview");
const LAYOUT_DIR = path.join(OUT_ROOT, "layout", "final");

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
    fontSize: 16,
    color: "#1A2A26",
    typeface: "Microsoft YaHei",
    ...style,
  };
  return shape;
}

function addMaterialSlot(slide, cfg) {
  const {
    x,
    y,
    w,
    h,
    title,
    detail,
    accent = "#1F6B57",
    fill = "#F7FAF8",
  } = cfg;

  slide.shapes.add({
    geometry: "roundRect",
    name: `material-slot-${title}`,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "dashed", fill: accent, width: 1.5 },
    borderRadius: "rounded-lg",
  });

  addText(slide, "待补充", { left: x + 18, top: y + 14, width: 82, height: 24 }, {
    fontSize: 13,
    bold: true,
    color: accent,
  });
  addText(slide, title, { left: x + 102, top: y + 12, width: w - 120, height: 28 }, {
    fontSize: 17,
    bold: true,
    color: "#1A2A26",
  });
  if (detail) {
    addText(slide, detail, { left: x + 18, top: y + 42, width: w - 36, height: h - 50 }, {
      fontSize: 12.5,
      color: "#6B746F",
    });
  }
}

async function main() {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(LAYOUT_DIR, { recursive: true });

  const presentation = await PresentationFile.importPptx(
    await FileBlob.load(SOURCE_PPTX),
  );

  const slides = presentation.slides.items;

  addMaterialSlot(slides[4], {
    x: 822,
    y: 542,
    w: 340,
    h: 88,
    title: "0-1范围判断证据",
    detail: "PRD片段 / 范围取舍记录 / 用户访谈或评审纪要截图",
  });

  addMaterialSlot(slides[5], {
    x: 822,
    y: 542,
    w: 340,
    h: 88,
    title: "MVP范围与风险文档",
    detail: "保留/延后/禁止自动化清单、验收口径或需求评审截图",
  });

  addMaterialSlot(slides[7], {
    x: 876,
    y: 118,
    w: 292,
    h: 70,
    title: "Agent需求材料",
    detail: "输入输出字段、Prompt/工具调用、低置信度兜底规则截图",
    accent: "#2A91A3",
    fill: "#F2FAFB",
  });

  addMaterialSlot(slides[8], {
    x: 720,
    y: 374,
    w: 374,
    h: 120,
    title: "状态机 / 模板库截图",
    detail: "工单状态流转、SOP模板库、审批字段、回写字段的PRD或产品页",
  });

  const uiSlots = [
    [390, 246, "运维看板截图", "异常列表 / 风险等级 / 响应时限"],
    [950, 246, "设备详情截图", "曲线 / 台账 / 历史工单 / 3D位置"],
    [390, 442, "诊断面板截图", "结论 / 证据 / 置信度 / 引用来源"],
    [950, 442, "工单草稿截图", "字段预填 / SOP步骤 / 验收标准"],
  ];
  for (const [x, y, title, detail] of uiSlots) {
    addMaterialSlot(slides[10], {
      x,
      y,
      w: 170,
      h: 58,
      title,
      detail,
      accent: "#1F6B57",
      fill: "#FBFCFA",
    });
  }

  addMaterialSlot(slides[11], {
    x: 822,
    y: 542,
    w: 340,
    h: 88,
    title: "Vibe Coding过程证据",
    detail: "PRD输入、原型迭代、问题清单、研发对齐材料截图",
    accent: "#C47A2C",
    fill: "#FFF8F1",
  });

  addMaterialSlot(slides[12], {
    x: 822,
    y: 542,
    w: 340,
    h: 88,
    title: "支撑案例资料截图",
    detail: "DFS接入/清洗、Designer场景配置、3D/IoT上下文截图",
  });

  addMaterialSlot(slides[13], {
    x: 632,
    y: 502,
    w: 508,
    h: 62,
    title: "材料槽位",
    detail: "补充脱敏截图、客户/用户反馈、验收记录、可公开指标或过程记录",
    accent: "#C47A2C",
    fill: "#FFF8F1",
  });

  for (const [index, slide] of slides.entries()) {
    const stem = `final-slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(
      path.join(PREVIEW_DIR, `${stem}.png`),
      await presentation.export({ slide, format: "png", scale: 1 }),
    );
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(LAYOUT_DIR, `${stem}.layout.json`), await layout.text());
  }

  await writeBlob(
    path.join(PREVIEW_DIR, "after-montage.webp"),
    await presentation.export({ format: "webp", montage: true, scale: 1 }),
  );

  const exported = await PresentationFile.exportPptx(presentation);
  await exported.save(FINAL_PPTX);

  const stats = await fs.stat(FINAL_PPTX);
  console.log(`slides=${slides.length}`);
  console.log(`final=${FINAL_PPTX}`);
  console.log(`bytes=${stats.size}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
