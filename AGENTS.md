# Resume Workspace Instructions

## Interview Prep Default

When the user asks for interview preparation, first read `03_面试准备/02_通用面试工具与规范/面试回答Agent提示词.md`, then use the workflow in `03_面试准备/02_通用面试工具与规范/面试准备默认工作流.md` by default.

Core rule: do not generate polished answers directly from capability keywords. First decode the JD, map the resume and story bank, search real interview experiences when company/role context is available, predict questions by round/interviewer role, then draft only evidence-based answers from the user's real material.

Never invent facts, metrics, customer names, project scale, responsibilities, or outcomes. If details are missing, ask focused follow-up questions or mark them as `【待补充】`.

## Interview Answer Editing Default

When the user asks to prepare, revise, polish, or confirm interview answers, final answers should sound like the candidate speaking in an interview, not like resume bullets, PRDs, consulting reports, AI summaries, or answer-coaching notes.

- For interview answer editing, use the skill workflow in this order: `bq-skill` for STAR/CAR evidence and fact boundaries, `shuorenhua` for spoken interview phrasing, then `humanizer-zh` for a second Chinese anti-AI-tone pass.
- First identify what the interviewer is really asking, then fix content before wording.
- Preserve factual boundaries. Do not invent facts, metrics, customer names, ownership, production status, or outcomes.
- If facts, actions, results, or examples are missing, ask or mark `【待补充】`.
- Avoid defensive disclaimer phrasing such as "我不会说满 / 我不会夸大 / 我不会归因". State the factual scope directly.
- Avoid answer-strategy phrasing such as "我重点讲的是 / 我会从三个方面回答 / 这个回答体现". Answer directly.
- Avoid mechanical three-part structure, empty value words, and gold-sentence endings unless followed by concrete actions, flows, evidence, or metrics.
- For product landing or metrics questions, distinguish delivery-stage evidence from later operating metrics.
- For Chinese answers, make the final version natural, concise, and spoken. For English answers, make it sound like a candidate across the table, not a cover letter.
