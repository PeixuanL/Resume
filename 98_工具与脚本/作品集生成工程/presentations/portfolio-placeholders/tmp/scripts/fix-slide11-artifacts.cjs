const fs = require("node:fs/promises");
const path = require("node:path");
const { FileBlob, PresentationFile } = require("@oai/artifact-tool");

const PPTX = path.resolve("outputs", "B端数字孪生AI产品经理作品集_李沛宣.pptx");
const PREVIEW = path.resolve(
  "work",
  "presentations",
  "portfolio-placeholders",
  "tmp",
  "preview",
  "final-slide-11-clean.png",
);

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function cover(slide, left, top, width, height) {
  slide.shapes.add({
    geometry: "rect",
    position: { left, top, width, height },
    fill: "#FBFCFA",
    line: { style: "solid", fill: "none", width: 0 },
  });
}

async function main() {
  const presentation = await PresentationFile.importPptx(await FileBlob.load(PPTX));
  const slide = presentation.slides.items[10];

  cover(slide, 490, 560, 44, 30);
  cover(slide, 1050, 560, 44, 30);

  await writeBlob(PREVIEW, await presentation.export({ slide, format: "png", scale: 1 }));
  const exported = await PresentationFile.exportPptx(presentation);
  await exported.save(PPTX);
  console.log(`slides=${presentation.slides.items.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
