const fs = require("node:fs/promises");
const path = require("node:path");
const { FileBlob, PresentationFile } = require("@oai/artifact-tool");

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  const sourcePptx = path.resolve("outputs", "B端数字孪生AI产品经理作品集_李沛宣.pptx");
  const outRoot = path.resolve("work", "presentations", "portfolio-placeholders", "tmp");
  const previewDir = path.join(outRoot, "preview");
  const layoutDir = path.join(outRoot, "layout");
  await fs.mkdir(previewDir, { recursive: true });
  await fs.mkdir(layoutDir, { recursive: true });

  const presentation = await PresentationFile.importPptx(
    await FileBlob.load(sourcePptx),
  );

  const snapshot = await presentation.inspect({
    kind: "slide,textbox,shape,image,table,chart,notes,layout",
    maxChars: 40000,
  });
  await fs.writeFile(path.join(outRoot, "inspect.ndjson"), snapshot.ndjson);

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(
      path.join(previewDir, `${stem}.png`),
      await presentation.export({ slide, format: "png", scale: 1 }),
    );
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(layoutDir, `${stem}.layout.json`), await layout.text());
  }

  await writeBlob(
    path.join(previewDir, "before-montage.webp"),
    await presentation.export({ format: "webp", montage: true, scale: 1 }),
  );

  console.log(`slides=${presentation.slides.items.length}`);
  console.log(path.join(outRoot, "inspect.ndjson"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
