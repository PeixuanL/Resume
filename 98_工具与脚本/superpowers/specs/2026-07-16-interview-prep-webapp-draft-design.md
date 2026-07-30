# Interview Prep Webapp Draft Design

Goal: build a local draft of a reusable bilingual interview-prep webapp before packaging it as a Codex skill.

## Scope

Create a standalone draft under `docs/面试/interview-prep-webapp-draft/`. Do not modify the existing TruckerPath HR or business-round apps. The draft should prove the reusable interaction model: bilingual switching, page-level navigation, behavioral-question generation patterns, company research, concentrated review, and local editable answers.

## Product Behavior

The app has four top-level views:

- `练习 / Practice`: question practice, mode filters, timer, answer tabs, editable answer builder, phrase bank.
- `集中复习 / Review`: high-priority lines, STAR/CAR reminders, P&G-style question families, searchable phrases.
- `公司背景 / Company`: latest public company research, source date, source links, fact boundary, business/product implications.
- `题库地图 / Question Map`: question families grouped by behavioral, P&G, role, resume, pressure, and reverse questions.

Switching top-level views must hide other primary content. When the user opens review or company research, the question list must not remain stacked below it.

## Content Model

The draft uses one `data.js` file with a future-skill-friendly structure:

- `meta`: role, company, round, research date, source notes, default language.
- `questionFrameworks`: behavioral interview, STAR/CAR, P&G eight questions, role-specific questions.
- `questions`: each item stores `zh` and `en` variants for question, intent, simple answer, full answer, notes, follow-ups.
- `phraseBank`: bilingual phrases and vocabulary.
- `reviewFocus`: bilingual high-priority rehearsal lines.
- `companyResearch`: bilingual company background cards, source links, fact boundaries, interview implications.

The draft includes Trucker Path as sample data because the prior local app already has a realistic interview-prep scenario. In the later skill, another agent should replace the sample data with data generated from the user resume, JD, round, and current web research.

## Safety

No API keys, tokens, request headers, environment variables, or model call logs may be written into the generated app. Web research should be summarized into static data with source URLs and research date only.

## Verification

Use Node tests to verify:

- every question has both Chinese and English content;
- the page config has distinct top-level views;
- company research includes source URLs and a research date;
- no generated file contains API-key-like strings;
- the local save server normalizes edits and writes markdown.
