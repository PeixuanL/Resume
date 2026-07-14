const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = __dirname;
const STORAGE_KEY = "truckerpath_business_round_prep_cn_v1";
const SAVE_JSON = path.join(ROOT, "saved-edits.json");
const SAVE_MD = path.join(ROOT, "saved-edits.md");
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function normalizeEditsPayload(input, savedAt = new Date().toISOString()) {
  const edits = {};
  const rawEdits = input && typeof input === "object" && input.edits && typeof input.edits === "object" ? input.edits : {};
  for (const [id, value] of Object.entries(rawEdits)) {
    if (!id || typeof value !== "object" || value === null) continue;
    edits[id] = {
      simple: typeof value.simple === "string" ? value.simple : "",
      full: typeof value.full === "string" ? value.full : "",
      notes: typeof value.notes === "string" ? value.notes : "",
    };
  }
  return { savedAt, storageKey: STORAGE_KEY, edits };
}

function loadQuestions() {
  const source = fs.readFileSync(path.join(ROOT, "questions.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: "questions.js" });
  return Array.isArray(sandbox.window.INTERVIEW_QUESTIONS) ? sandbox.window.INTERVIEW_QUESTIONS : [];
}

function renderEditsMarkdown(payload, questions = loadQuestions()) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const lines = [
    "# Trucker Path 业务一面互动练习保存稿",
    "",
    `> 保存时间：${payload.savedAt}`,
    "> 来源：本地 Node 保存服务写入，可随 Git commit / push 同步到 GitHub。",
    "",
  ];

  for (const [id, edit] of Object.entries(payload.edits || {})) {
    const question = byId.get(id) || { question: id, chinese: "" };
    lines.push(`## ${question.question}`);
    if (question.chinese) lines.push(`- 准备重点：${question.chinese}`);
    lines.push("", "### 简短回答", edit.simple || "", "", "### 完整回答", edit.full || "", "", "### 临场备注 / 中文钩子", edit.notes || "", "");
  }
  return `${lines.join("\n").trim()}\n`;
}

function readSavedPayload() {
  if (!fs.existsSync(SAVE_JSON)) return normalizeEditsPayload({ edits: {} });
  return normalizeEditsPayload(JSON.parse(fs.readFileSync(SAVE_JSON, "utf8")), fs.statSync(SAVE_JSON).mtime.toISOString());
}

function writeSavedPayload(input) {
  const payload = normalizeEditsPayload(input);
  fs.writeFileSync(SAVE_JSON, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.writeFileSync(SAVE_MD, renderEditsMarkdown(payload), "utf8");
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
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (error) { reject(error); }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const decodedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(ROOT, decodedPath));
  if (!filePath.startsWith(ROOT)) {
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
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    if (req.url === "/api/edits" && req.method === "GET") {
      sendJson(res, 200, readSavedPayload());
      return;
    }
    if (req.url === "/api/edits" && req.method === "POST") {
      try {
        const input = await readRequestJson(req);
        const payload = writeSavedPayload(input);
        sendJson(res, 200, { ok: true, ...payload, files: [path.basename(SAVE_JSON), path.basename(SAVE_MD)] });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: error.message });
      }
      return;
    }
    serveStatic(req, res);
  });
}

if (require.main === module) {
  createServer().listen(PORT, HOST, () => {
    console.log(`Interactive interview prep running at http://${HOST}:${PORT}/`);
    console.log(`File saves: ${SAVE_JSON}`);
  });
}

module.exports = { normalizeEditsPayload, renderEditsMarkdown, readSavedPayload, writeSavedPayload, createServer };
