# Fuxie Bilingual German-Vietnamese Content Style Guide

Owner: Content QA / Linguistic Reviewer  
Review partners: German Academic Lead, German Curriculum Designer, German Content Writer

## Purpose

This guide defines the minimum release-candidate standard for German learning content written for Vietnamese learners. It applies to grammar, vocabulary, reading, listening, writing, and speaking content in `content/`.

## German Content Standard

- German must be natural, idiomatic, and level-appropriate for the declared CEFR level.
- Example sentences must demonstrate the target word, grammar point, or skill directly.
- A1-A2 sentences should stay short, concrete, and high-frequency.
- B1-B2 tasks may use connected argumentation, workplace/school/social themes, and moderate abstraction.
- C1-C2 tasks may include academic, institutional, and nuanced discourse, but must still be teachable and not obscure for its own sake.
- Distractors must be plausible but fair. They must not depend on trick wording unless the task explicitly tests inference.

## Vietnamese Support Standard

- Vietnamese explanations should clarify the learning target, not replace the German practice.
- Vietnamese translations should preserve meaning and register, not word-for-word structure when that would sound unnatural.
- Avoid mixed encodings and replacement characters. Any visible mojibake or placeholder text must be treated as a release blocker.
- Use Vietnamese to explain why the answer is correct, the learner mistake pattern, and the practical usage.

## Definitions And Examples

- German definitions should avoid circular wording. The headword should not appear as the main explanation unless unavoidable for fixed terms.
- Vocabulary examples should include at least one complete sentence with the target usage.
- Grammar explanations should include a rule, a short example, and one productive application task.
- Reading/listening answer explanations must include evidence from the source text or transcript.

## Transcript Standard

- Every listening item must have `transcript.status = "complete"`.
- `transcript.lines[]` must contain full learner-visible script lines, not only answer evidence.
- Each line should include `speaker` and `text`.
- Lines that support answers should include `linkedQuestionId`.
- If an original studio script is unavailable, a reconstructed script may be used only when it covers all answer evidence and is marked with `source = "reconstructed_full_script"`.

## Learning Outcome Standard

Each content item should include at least one `learningOutcomes[]` item:

- `id`: stable local outcome id.
- `cefrLevel`: A1, A2, B1, B2, C1, or C2.
- `skill`: vocabulary, grammar, reading, listening, writing, speaking, or course.
- `canDoVi`: learner-facing Vietnamese can-do statement.
- `canDoDe`: learner-facing German can-do statement.
- `linkedContentIds`: ids of content items, topics, modules, lessons, or words covered by the outcome.

