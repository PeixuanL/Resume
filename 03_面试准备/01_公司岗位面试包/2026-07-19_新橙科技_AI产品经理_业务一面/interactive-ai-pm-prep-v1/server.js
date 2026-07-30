const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { INTERVIEW_PREP_DATA } = require("./data.js");

const ROOT = __dirname;
const SAVE_JSON = "saved-edits.json";
const SAVE_MD = "saved-edits.md";
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function normalizeLanguageEdit(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    simple: typeof source.simple === "string" ? source.simple : "",
    full: typeof source.full === "string" ? source.full : "",
    notes: typeof source.notes === "string" ? source.notes : "",
  };
}

function normalizeEditsPayload(input, savedAt = new Date().toISOString()) {
  const edits = {};
  const rawEdits = input && typeof input === "object" && input.edits && typeof input.edits === "object" ? input.edits : {};
  for (const [id, value] of Object.entries(rawEdits)) {
    if (!id || typeof value !== "object" || value === null) continue;
    edits[id] = {
      zh: normalizeLanguageEdit(value.zh),
      en: normalizeLanguageEdit(value.en),
    };
  }
  return { savedAt, edits };
}

function renderEditsMarkdown(payload, questions = INTERVIEW_PREP_DATA.questions) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const lines = [
    "# Interview Prep Saved Edits",
    "",
    `> Saved at: ${payload.savedAt}`,
    "> Source: local draft webapp save service.",
    "",
  ];

  for (const [id, edit] of Object.entries(payload.edits || {})) {
    const question = byId.get(id);
    const title = question ? question.zh.question : id;
    const englishTitle = question ? question.en.question : id;
    lines.push(`## ${title}`, "", `English: ${englishTitle}`, "");
    lines.push("### 中文简短回答", edit.zh.simple || "", "");
    lines.push("### 中文完整回答", edit.zh.full || "", "");
    lines.push("### 中文备注", edit.zh.notes || "", "");
    lines.push("### English Simple Answer", edit.en.simple || "", "");
    lines.push("### English Full Answer", edit.en.full || "", "");
    lines.push("### English Notes", edit.en.notes || "", "");
  }

  return `${lines.join("\n").trim()}\n`;
}

function savePaths(rootDir = ROOT) {
  return {
    json: path.join(rootDir, SAVE_JSON),
    markdown: path.join(rootDir, SAVE_MD),
  };
}

function readSavedPayload(rootDir = ROOT) {
  const paths = savePaths(rootDir);
  if (!fs.existsSync(paths.json)) return normalizeEditsPayload({ edits: {} });
  const raw = JSON.parse(fs.readFileSync(paths.json, "utf8"));
  return normalizeEditsPayload(raw, raw.savedAt || fs.statSync(paths.json).mtime.toISOString());
}

function writeSavedPayload(input, rootDir = ROOT) {
  const payload = normalizeEditsPayload(input);
  const paths = savePaths(rootDir);
  fs.writeFileSync(paths.json, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.writeFileSync(paths.markdown, renderEditsMarkdown(payload), "utf8");
  return payload;
}

function sendJson(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(`${JSON.stringify(value)}\n`);
}

function readRequestJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) reject(new Error("request too large"));
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res, rootDir = ROOT) {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const decodedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(rootDir, decodedPath));
  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500);
      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}

function createServer(rootDir = ROOT) {
  return http.createServer(async (req, res) => {
    if (req.url === "/api/edits" && req.method === "GET") {
      sendJson(res, 200, readSavedPayload(rootDir));
      return;
    }
    if (req.url === "/api/edits" && req.method === "POST") {
      try {
        const input = await readRequestJson(req);
        const payload = writeSavedPayload(input, rootDir);
        sendJson(res, 200, { ok: true, ...payload, files: [SAVE_JSON, SAVE_MD] });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message });
      }
      return;
    }
    serveStatic(req, res, rootDir);
  });
}

if (require.main === module) {
  createServer().listen(PORT, HOST, () => {
    console.log(`Interview prep draft running at http://${HOST}:${PORT}/`);
    console.log(`File saves: ${path.join(ROOT, SAVE_JSON)}`);
  });
}

module.exports = {
  normalizeEditsPayload,
  renderEditsMarkdown,
  readSavedPayload,
  writeSavedPayload,
  createServer,
};
