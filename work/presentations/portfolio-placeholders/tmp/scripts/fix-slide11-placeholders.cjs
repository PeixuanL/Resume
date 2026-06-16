const fs = require("node:fs/promises");
const path = require("node:path");
const { FileBlob, PresentationFile } = require("@oai/artifact-tool");

const PPTX = path.resolve("outputs", "B端数字孪生AI产品经理作品集_李沛宣.pptx");
const OUT_ROOT = path.resolve("work", "presentations", "portfolio-placeholders", "tmp");
const PREVIEW_DIR = path.join(OUT_ROOT, "preview");

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
    fontSize: 11.5,
    color: "#1F6B57",
    bold: true,
    typeface: "Microsoft YaHei",
    alignment: "center",
    ...style,
  };
  return shape;
}

function coverOldSlot(slide, x, y, w, h) {
  slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h },
    fill: "#FBFCFA",
    line: { style: "solid", fill: "none", width: 0 },
  });
}

function addCompactSlot(slide, x, y, text) {
  slide.shapes.add({
    geometry: "roundRect",
    position: { left: x, top: y, width: 160, height: 44 },
    fill: "#F7FAF8",
    line: { style: "dashed", fill: "#1F6B57", width: 1.4 },
    borderRadius: "rounded-lg",
  });
  addText(slide, text, { left: x + 10, top: y + 12, width: 140, height: 20 });
}

async function main() {
  const presentation = await PresentationFile.importPptx(await FileBlob.load(PPTX));
  const slide = presentation.slides.items[10];

  coverOldSlot(slide, 382, 240, 190, 150);
  coverOldSlot(slide, 942, 240, 190, 150);
  coverOldSlot(slide, 382, 436, 190, 136);
  coverOldSlot(slide, 942, 436, 190, 136);

  addCompactSlot(slide, 396, 254, "待补截图: 看板");
  addCompactSlot(slide, 956, 254, "待补截图: 设备");
  addCompactSlot(slide, 396, 450, "待补截图: 诊断");
  addCompactSlot(slide, 956, 450, "待补截图: 工单");

  await writeBlob(
    path.join(PREVIEW_DIR, "final-slide-11-fixed.png"),
    await presentation.export({ slide, format: "png", scale: 1 }),
  );
  await writeBlob(
    path.join(PREVIEW_DIR, "after-montage-fixed.webp"),
    await presentation.export({ format: "webp", montage: true, scale: 1 }),
  );

  const exported = await PresentationFile.exportPptx(presentation);
  await exported.save(PPTX);
  const stats = await fs.stat(PPTX);
  console.log(`slides=${presentation.slides.items.length}`);
  console.log(`bytes=${stats.size}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
