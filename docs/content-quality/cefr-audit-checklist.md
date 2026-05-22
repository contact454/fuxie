# Fuxie CEFR Audit Checklist

Owner: German Academic Lead  
Review partners: Content QA / Linguistic Reviewer, German Curriculum Designer

## Audit Metadata

Every audited item should include:

- `targetLevel`: declared CEFR level.
- `verdict`: `aligned`, `revise`, or `block`.
- `reviewerRole`: role responsible for the academic judgment.
- `notes`: concise explanation of level fit and learner risk.
- `reviewedAt`: ISO date.

## Verdict Rules

- `aligned`: content matches the declared level and can move to product testing.
- `revise`: content is usable after targeted wording, task, or support changes.
- `block`: content should not be learner-visible because it has a serious level, correctness, ambiguity, or evidence issue.

## Level Fit Checks

- A1: concrete everyday topics, short input, simple present/past patterns, clear single-step tasks.
- A2: familiar routines, services, simple opinions, short connected texts, limited inference.
- B1: everyday independence, personal experience, simple argumentation, predictable workplace/social contexts.
- B2: abstract topics, sustained argumentation, nuanced stance, inference from longer texts.
- C1: academic/professional discourse, implicit meaning, precise register, complex organization.
- C2: highly nuanced discourse, abstract synthesis, idiomatic control, near-native comprehension expectations.

## Skill Checks

- Reading: question answer is supported by text evidence.
- Listening: transcript evidence supports every answer.
- Writing: prompt, model answer, rubric, and time limit match the level.
- Speaking: sentence/prompt set supports productive speech at the level.
- Grammar: rules move from recognition to production.
- Vocabulary: definitions and examples are teachable and not circular.

## Release-Blocking Findings

- Broken answer key or answer not present in options.
- Missing transcript or only partial evidence where full transcript is required.
- German sentence that is ungrammatical, unnatural, or misleading.
- Vietnamese explanation with encoding damage or wrong meaning.
- CEFR mismatch that changes the learner expectation by one full level or more.

