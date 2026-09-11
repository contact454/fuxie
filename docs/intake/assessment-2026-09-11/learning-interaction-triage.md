# Learning interaction smoke: bounded triage — 2026-09-11

Vai chinh: QA Automation Engineer. Vai phoi hop: Frontend Engineer, Product Manager EdTech.

## Conclusion

The four original failures are explained by stale selectors/workflow expectations in the reading/listening specs. They do not establish that learners cannot submit those exercises. Preserve the original suite result as **4 FAIL, 6 NOT_RUN**; this diagnostic is a separate result, not a passing rerun of that suite.

Current UI diagnostic on the isolated seeded audit server reached one mocked submit and a successful results screen for reading and listening, at 390×844 and 1440×900. Reading diagnostic **PASS to results**. Listening diagnostic **PASS to results and keyboard audio toggle**, but its full transcript flow is **BLOCKED by a stale diagnostic selector / NOT VERIFIED**: the harness, following the old spec, looks for “Xem transcript” while the UI displays “Xem bản chép lời”. No product or original test files were modified.

## Evidence and classification

| Original failure / follow-on expectation | Current evidence | Classification |
|---|---|---|
| Reading desktop/mobile: `reading-interaction.pw.spec.ts:192–194` expects `Nộp bài` after selecting Đúng | `reading-player.tsx:1335–1358` renders **Kiểm tra**, then BottomFeedback; `:277–294` records/checks the answer and submits on final Continue. Current UI has zero Nộp bài buttons, one Kiểm tra, then Tiếp tục produces one POST and Xuất sắc results. | Stale workflow expectation, high confidence. |
| Listening desktop/mobile: `listening-interaction.pw.spec.ts:169–171` looks inside `div.bg-white.rounded-2xl.p-5` | Actual player card is `p-6` in `lesson-player.tsx:676`; accessible AudioButton at `:677–684` is present. Old CSS selector count is zero. | Stale style selector, high confidence. |
| Listening later expects `Nộp bài`, spec `:183–186` | Current Check → BottomFeedback Continue at `lesson-player.tsx:835–856`; current selection→check→continue issues one POST and renders 1/1 results. | Additional stale workflow expectation. |
| Listening later expects title `/Nghe rất sắc|Rất tốt/`, spec `:191–192`, and `Xem transcript`/`Ẩn transcript` at `:198`, `:208` | Current 100% result heading is **Nghe xuất sắc — hoàn thành nhiệm vụ!** and toggle is **Xem bản chép lời**, recorded from rendered DOM in final diagnostic JSON. | Additional stale copy selectors; transcript open/close remains unverified in this bounded diagnostic. |

Source paths above are relative to `apps/web/src/components/reading/`, `apps/web/src/components/listening/`, or `tests/integration/` as appropriate. Full paths and frame evidence are available in the artifacts below.

Audio starts from the learner's Start gesture (`lesson-player.tsx:464–468`), so the initial accessible name can be **Tạm dừng âm thanh**, not Phát âm thanh. Default playing animation continuously scales the button (`packages/ui/src/components/AudioButton.tsx:55–66`); an intermediate Playwright click waited for stability and timed out. The final diagnostic retained default motion and verified keyboard Enter toggles playing → idle → playing. This is an automation actionability issue, not evidence that human input is broken.

The reading result's **Di tiep** button still exists with a complete quest receipt (`reading-player.tsx:1623`); do not classify that assertion as stale.

## Artifacts and limits

- Original run: `tmp/comprehensive-assessment-2026-09-11/technical/learning-interaction-smoke.log`; original traces under `tmp/playwright/output/reading-interaction*` and `listening-interaction*`.
- Original final-frame extracts and last test steps: `tmp/comprehensive-assessment-2026-09-11/product/{reading,listening}-original-trace-last.jpeg` and corresponding `*-original-trace-summary.json`.
- Reproducible diagnostic: `tmp/comprehensive-assessment-2026-09-11/product/triage-learning-interactions.cjs`; run `node tmp/comprehensive-assessment-2026-09-11/product/triage-learning-interactions.cjs` against existing `http://localhost:3040`.
- Final evidence: `learning-interaction-triage.json`, `.log`, `reading-current-results-{390,1440}.png`, `listening-triage-failure-{390,1440}.png`, in that same product artifact directory. Listening screenshot filename reflects the later transcript selector timeout; its screen shows successful results.
- Intermediate `*-first-attempt.json`, `*-animation-attempt.json`, `*-incomplete-mock-attempt.json` are diagnostic history, **not product findings**. One intermediate mock omitted listening `questionResults.options`, causing a caught render error; the final mock includes required options. An earlier mock omitted the reading quest receipt; final evidence includes it.

Scope is seeded local UI + synthetic successful submit responses and mocked media readiness/playback. All non-GET requests were fulfilled locally by the harness, with submit bodies recorded. This establishes current UI wiring, not real API authorization, scoring, durable reward persistence, actual audio quality, or provider reliability. Root validates real API submits separately. No production data, provider calls, or external communication was used. No performance conclusion is drawn.

## Next action and acceptance

Owner: QA Automation Engineer with Frontend support. Update integration specs to accessible role/name or stable semantic selectors, use Check → Continue for these question types, and handle audio state plus motion explicitly. Keep a keyboard path and a reduced-motion pointer path. Update expected current result/transcript copy from the i18n contract. Then rerun all 10 original cases against an isolated seeded environment, including submit error fallback, max-play limit, loading, and transcript cases; require explicit outcomes for every case and independent API/persistence evidence. Do not convert the 6 unexecuted cases to PASS or use this diagnostic as release approval.

QA checklist: prioritized broken-flow risk; inspected original traces and current source; reproduced seeded UI on mobile/desktop; documented negative harness attempts and residual risk; no brittle-selector fix was silently applied to product tests.
