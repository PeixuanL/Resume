# Interview Prep Webapp Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone bilingual interview-prep webapp draft that can later be packaged as a reusable Codex skill.

**Architecture:** Create a static HTML/CSS/JS app with one structured `data.js` file and a tiny local Node save server. Keep generated content separate from UI logic so the later skill can swap in new resume/JD/company data without rewriting the frontend.

**Tech Stack:** Plain HTML, CSS, browser JavaScript, Node built-in `http`, `fs`, `path`, `assert`.

## Global Constraints

- Do not modify existing TruckerPath HR or business-round app folders.
- Keep top-level views mutually exclusive: practice, review, company, question map.
- Ship bilingual Chinese/English content in the draft data.
- Store company research as static summaries with source date and source URLs; do not store API keys or request credentials.
- Use no external npm dependencies.

---

### Task 1: Data Contract And Tests

**Files:**
- Create: `docs/面试/interview-prep-webapp-draft/app.test.js`
- Create: `docs/面试/interview-prep-webapp-draft/data.js`

**Interfaces:**
- Produces: `INTERVIEW_PREP_DATA` global in the browser.
- Produces: `module.exports = { INTERVIEW_PREP_DATA }` in Node tests.

- [ ] **Step 1: Write failing tests**

Test data shape, bilingual requirements, page views, company sources, and secret scanning.

- [ ] **Step 2: Run test and confirm RED**

Run: `/Users/jane/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node docs/面试/interview-prep-webapp-draft/app.test.js`

Expected: FAIL because `data.js` does not exist yet.

- [ ] **Step 3: Implement `data.js`**

Add sample bilingual data for Trucker Path, including behavioral and P&G-style question families.

- [ ] **Step 4: Run test and confirm GREEN**

Run the same command. Expected: PASS.

### Task 2: Local Save Server

**Files:**
- Create: `docs/面试/interview-prep-webapp-draft/server.js`
- Modify: `docs/面试/interview-prep-webapp-draft/app.test.js`

**Interfaces:**
- Produces: `normalizeEditsPayload(input, savedAt)`.
- Produces: `renderEditsMarkdown(payload, questions)`.
- Produces: `createServer(rootDir)`.

- [ ] **Step 1: Extend failing tests**

Test edit payload normalization and markdown rendering.

- [ ] **Step 2: Run test and confirm RED**

Expected: FAIL because `server.js` does not exist yet.

- [ ] **Step 3: Implement server**

Serve static files and `/api/edits`, writing `saved-edits.json` and `saved-edits.md`.

- [ ] **Step 4: Run test and confirm GREEN**

Expected: PASS.

### Task 3: Frontend App

**Files:**
- Create: `docs/面试/interview-prep-webapp-draft/index.html`
- Create: `docs/面试/interview-prep-webapp-draft/styles.css`
- Create: `docs/面试/interview-prep-webapp-draft/app.js`

**Interfaces:**
- Consumes: `window.INTERVIEW_PREP_DATA`.
- Consumes: `/api/edits` when served by Node.

- [ ] **Step 1: Create semantic HTML shell**

Add persistent sidebar, language switcher, top-level view tabs, and page containers.

- [ ] **Step 2: Implement rendering logic**

Render mutually exclusive views for practice, review, company, and question map. Add filters, timer, answer tabs, speech, import/export, copy, localStorage, and save-to-file.

- [ ] **Step 3: Implement CSS**

Use a restrained operational-tool layout: dense but calm, no nested cards, stable responsive dimensions, page-level panels.

- [ ] **Step 4: Run syntax checks**

Run Node syntax checks for JS files.

### Task 4: Verify And Launch

**Files:**
- Modify only if verification finds issues.

**Interfaces:**
- Local URL: `http://127.0.0.1:18787/`

- [ ] **Step 1: Run tests**

Run `app.test.js`.

- [ ] **Step 2: Start local server**

Run: `env PORT=18787 /Users/jane/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.js`

- [ ] **Step 3: HTTP smoke test**

Fetch `/`, `/data.js`, `/app.js`, `/api/edits` and confirm status `200`.

- [ ] **Step 4: Report URL and current limitations**

Tell the user the draft is ready and note that it is sample Trucker Path data, not the final skill package.
