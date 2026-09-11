# W03 — Persistent session attempt, server answers và XP contract

Vai chinh: Backend Engineer

Vai phoi hop: CTO / Tech Lead, Security / Privacy Consultant, QA Automation Engineer

Ngày: 2026-09-11. Mapping: A03 / TECH-01; cung cấp contract identity cho W04 và W08. **Trạng thái: PREPARED — NOT IMPLEMENTATION_READY.** Tài liệu này là đầu ra W03 PREP; không thay runtime/schema, không chạy test/migration cho W03. Các quyết định D1–D6 dưới đây là đề xuất cần owner chốt, không phải policy đã được duyệt. W01 đã [ACCEPTED_FOR_SCOPE trong working tree](remediation-W01-verification-2026-09-11.md), chưa merge/deploy. Khi mở implementation W03 phải giữ bản vá/hash W01 thực tế và giải quyết các dependency còn lại trong T0; source references là working tree tại lúc PREP, có cập nhật trạng thái W01 khi bàn giao.

## 1. Context & Goal

Session hiện nhận `correct`, `totalXp`, loại bài và source ID từ client; không có attempt do server lưu, nên không chứng minh câu đã giao, đáp án đã làm hoặc request là retry. Player còn chuyển về dashboard kể cả HTTP lỗi và hiển thị thành công trước khi lưu. W03 cần một phiên thuộc đúng learner, câu hỏi có nguồn/version cố định, đáp án thực được server chấm, và receipt/XP/progress chỉ commit một lần; learner được giữ đáp án và thử gửi lại khi lỗi. Phạm vi là mixed daily `/session`, không đồng nhất với các module reading/listening độc lập, không viết lại dashboard/FSRS/reward economy.

**Dependency:** [W01 ownership](remediation-W01-session-ownership.md) tích hợp trước mọi chỉnh `session/complete`; W00 xác nhận tree, một writer session/schema; W06 cung cấp eligibility/catalog cho content dùng; PM/Academic/Privacy/CTO chốt D1–D6. W04 tái sử dụng semantics nhưng không được tuyên bố replay reading/listening đã đóng từ W03. W08 review event identity và meaningful-action eligibility trước writer; W10 xử lý cache cá nhân tương ứng endpoint đọc attempt trước mở production.

## 2. Requirements

- **R-1 Identity:** Server SHALL cấp UUID attempt bền trong DB, gắn DB userId lấy từ `withDbAuth`, contractVersion, CEFR đã validate, source/question snapshot và gradingVersion; không nhận owner từ client.
- **R-2 Authorization:** Mọi start/read/answer/complete SHALL yêu cầu auth DB user chưa xóa và role LEARNER trong runtime; attempt/source card của người khác và không tồn tại trả cùng 404 chung. W01 owner predicate SHALL được giữ trong mutation SRS.
- **R-3 Immutable questions:** Server SHALL lưu bộ câu, thứ tự, lựa chọn, key, point policy và source revision tại start. Client không được gửi/thay content, cardId/lessonId, correctIndex, correct, XP, hearts, questionCount hoặc level để quyết định kết quả. DTO public SHALL không chứa key riêng tư trước check.
- **R-4 Real answers:** Client SHALL gửi optionId hoặc văn bản đã nhập cho câu server đã cấp; INTRO gửi acknowledgement riêng, không giả thành đáp án đúng. Server SHALL kiểm loại/format, membership, size, thứ tự và lần trả lời đầu; loại chưa có renderer + grader SHALL bị loại ở build hoặc reject rõ, không tính đúng mặc định.
- **R-5 Feedback:** Answer check SHALL lưu đáp án lần đầu và grade trước khi trả feedback. Retry cùng câu/cùng payload trả cùng grade; đổi đáp án sau feedback SHALL trả conflict, không làm tăng điểm. Check không cấp XP/progress/SRS reward.
- **R-6 Completion:** Complete SHALL chỉ đọc đáp án đã được server ghi cho attempt và áp dụng terminal policy đã chốt. Empty/no-attempt/unsupported/incomplete-for-policy SHALL không tạo XP, completion, activation hoặc progress. Số sai/hearts và base XP SHALL do server suy ra.
- **R-7 Atomicity/idempotency:** Receipt, terminal status và toàn bộ mutation SRS/profile/DailyActivity/UserProgress/streak/analytics của một completion SHALL cùng transaction. Retry/race của cùng attempt SHALL trả receipt đã commit, không gọi shared activity lại. Retry thất bại trước commit SHALL không để side effect từng phần.
- **R-8 Lifecycle:** IN_PROGRESS, COMPLETED, EXHAUSTED, ABANDONED, EXPIRED SHALL có chuyển trạng thái rõ; expiry dùng giờ server. Deliberate new attempt SHALL có identity mới, khác transport retry. Receipt COMPLETED/EXHAUSTED SHALL còn đọc lại sau expiry của thời gian làm bài trong thời hạn retention.
- **R-9 Progress semantics:** Một câu grammar không SHALL tự hoàn thành cả grammar lesson; INTRO không SHALL tự chứng minh mastery. `wordsLearned`, lesson completion và meaningful action SHALL theo D1/D2/D3 đã được PM/Academic/Analytics chốt; không dùng `session:${level}` làm identity.
- **R-10 UX failures:** Start, answer và complete SHALL phân biệt loading/empty/error/saving/saved. Lỗi mạng/401/409/410/5xx SHALL không tự điều hướng như đã lưu, không bỏ draft và không tự tạo attempt mới. Mọi nút có cùng tác dụng submit SHALL dùng cùng pending guard và retry identity.
- **R-11 Compatibility:** Migration SHALL additive; old client không có attempt SHALL không còn được cấp thưởng từ legacy body. Cutover/old-tab/PWA behavior SHALL được kiểm; rollback SHALL không mở lại legacy XP trust hoặc mất W01 ownership.
- **R-12 Privacy/performance:** Snapshot/key/answers SHALL không vào analytics, console, shared cache hoặc provider. Query/item/body limits và retention SHALL có giá trị được chốt. Builder SHALL lọc content status/deleted/catalog và tránh vòng query không giới hạn. No new provider/infrastructure.

## 3. Tech Design

### 3.1 Bằng chứng hiện tại và vị trí cần sửa

Line numbers là working tree đọc ngày 11/09/2026, nền audit HEAD `3217ea052aec5606602cb7f9ec62f159ae9a750e`; phải ghi hash mới khi triển khai, không lấy HEAD sạch thay dirty tree. SHA-256: `session/complete/route.ts` = `820FEAA973AABF00505524069A7CEC1CA09C50EC14053904EAB4BF6541388808` — root đã kiểm lại đây là bản W01 được QC; `session/builder.ts` = `34B1F44239FABFBE8CFC0B6E2187144D547EABAAAAF7FC79ED315D53EA0FEB9C`; `schema.prisma` = `5063B71CD076655FFBF801C1368014560973FE9D85ADA6002FE0739D063CAFAE`. Không ghi đè owner guard trong route đã được sửa.

| File:line hiện tại | Quan sát / thay đổi dự kiến |
|---|---|
| `apps/web/src/app/api/v1/session/start/route.ts:7–22` | GET cast level và default B1, trả builder items; chưa persist. Thay bằng POST creation idempotent; GET cũ không tạo attempt. |
| `apps/web/src/app/(learn)/session/page.tsx:15–78,126–139` | Fixture có results giả; production SSR gọi builder trực tiếp ở135 rồi truyền initialItems, bỏ qua API start. SSR chỉ lấy profile + shell, runtime khởi tạo/resume qua cùng attempt service. Fixture phải có chế độ riêng không gọi mutation thực. |
| `apps/web/src/lib/session/builder.ts:5–16,19–29,33–158` | Types gồm LISTENING_MINI/MATCHING; review max5, MC options randomized và key trả client. Builder chuyển sang private snapshot + public projection; source card owner và vocabulary revision lưu riêng. |
| `builder.ts:161–197` | Tối đa5 từ mới, nhưng query theo từng theme và chưa lọc PUBLISHED/deletedAt. INTRO có points5; sửa eligibility/bounded selection, D1 quyết recall. |
| `builder.ts:199–227` | Lấy một incomplete GrammarProgress rồi luôn ghép câu `Ich ___ gestern im Kino` vào lessonId bất kỳ. Không dùng đây làm ground truth cho mastery. D2 mặc định loại khỏi pilot đến khi có adapter cho câu thực `GrammarLesson.exercisesJson`. |
| `builder.ts:229–232` | Shuffle mỗi lần build. Chỉ shuffle trước snapshot; retry/resume không build/shuffle lại. INTRO và recall của cùng từ phải giữ dependency nếu D1 chọn pair. |
| `apps/web/src/lib/session/types.ts:5–44` | Data chung chứa key; ExerciseResult chỉ giữ correct + data, mất đáp án. Tách private snapshot server-only, public discriminated union, RawAnswer, CheckedAnswer, Receipt. Chuyển SessionItem type ra khỏi module import Prisma. |
| `apps/web/src/components/session/SessionPlayer.tsx:80–95,97–143,166–190,392–405` | Fetch lỗi chỉ console; handleNext cộng client points/correct; hearts0 hoặc hết bài vào success; complete không kiểm response và redirect cả catch; chỉ render INTRO/MC/TYPING. Thay bằng attempt/answer/save state; không tự kết luận unsupported format thành empty/success. |
| `.../session/exercises/MultipleChoice.tsx:14,22–84,120–130` | onNext chỉ boolean; còn tự sinh distractors/key fallback. Runtime v2 gửi optionId của snapshot, dùng feedback server; bỏ fallback tự tạo câu khi API thiếu options. |
| `.../session/exercises/TypingExercise.tsx:6–29` | Chỉ so `trim().toLowerCase()` với term tại client; không gửi input. Gửi typedText; server trả feedback, client giữ nguyên input khi lỗi. |
| `.../session/exercises/IntroCard.tsx:6,49` | onNext không đáp án; gửi `{kind:'ack', acknowledged:true}`; không nhãn correct/mastered. |
| `.../session/SessionResultScreen.tsx:29–45,86,238–249` | INTRO đang vào accuracy; data-role success trước save; nhiều onFinish, không phải tất cả disabled khi saving. Render server receipt sau commit, pending summary trước đó ghi chưa lưu; mọi submit/exit handler nhất quán. |
| `apps/web/src/app/api/v1/session/complete/route.ts:21–87,92–110` | Hiện nhận kết quả/XP, update SRS/grammar và gọi shared activity với level identity. W01 đã thêm guard cardId và owner predicate; W03 phải giữ bất biến này khi chuyển sang attempt service. Không giữ nhánh legacy ghi thưởng. |
| `apps/web/src/lib/progress/learning-activity.ts:99–179` | Tái sử dụng trong transaction; tự tăng profile/daily/streak và append UserProgress/event, chưa tự dedup. Guard attempt phải ở ngoài, trước lời gọi. Không đổi semantics toàn module trong W03. |
| `apps/web/src/lib/progress/cache-invalidation.ts:3–20` | Tái sử dụng sau commit theo touchedSrs. Retry receipt có thể invalidate lại an toàn; lỗi invalidate không được biến committed receipt thành failed completion. |
| `apps/web/src/lib/auth/middleware.ts:52–87` | Tái sử dụng DB auth và role; auth Firebase UID khác DB userId. `error-handler.ts` giữ envelope, bổ sung domain 409/410/422 tại session adapter nếu cần. |
| `apps/web/src/lib/assessment/submission-grading.ts:35–199` | Có pure graders module khác, nhưng không khớp session DTO và key mapping. Có thể học cấu trúc tests; không ép reuse grader đọc/nghe/thi cho session hoặc gọi AI để chấm. |

### 3.2 Mô hình lưu trữ: phần nào reuse được

Schema `packages/database/prisma/schema.prisma`: `UserProgress:1011–1030` là append completion, không status/snapshot/unique attempt; `VocabExerciseAttempt:1250–1273` chỉ aggregate vocab (themeSlug bắt buộc), không lifecycle; `ExamAttempt:719–744` buộc ExamTemplate; ListeningAttempt/ReadingAttempt ở1125/1212 buộc nguồn skill riêng. Không gắn fake exam/theme vào các model này để né migration. `SrsCard:591–625` có unique(userId,vocabularyItemId), phù hợp tái sử dụng; `GrammarProgress:567–586` là aggregate lesson, không chứng minh từng câu. `FucoinLedger:919–936` có uniqueness nguồn nhưng không thay thế XP/progress idempotency; route session hiện không cấp Fucoin trực tiếp, W03 không thêm thưởng tiền mới. `AnalyticsEvent:260–280` có actionId nhưng không là khóa completion.

**Đề xuất tối thiểu: một model `SessionAttempt` mới**, quan hệ `User`, không tạo generic attempts framework toàn dự án:

```text
id UUID server-generated PK
userId FK User; level CefrLevel
contractVersion=2; gradingVersion; rewardPolicyVersion
clientStartKey string; UNIQUE(userId, clientStartKey)
status IN_PROGRESS | COMPLETED | EXHAUSTED | ABANDONED | EXPIRED
startedAt; expiresAt; completedAt?; updatedAt
snapshotJson private bounded question array + sources + keys + points
snapshotHash private SHA-256 canonical payload; publicRevision opaque version
answersJson bounded map questionId -> first raw answer, payload hash, grade, checkedAt
receiptJson? immutable final result from committed transaction
INDEX(userId,status,startedAt), INDEX(expiresAt)
```

JSON nội bộ phải validate theo schema/version khi ghi và đọc; maximum theo D5. Không expose raw ORM object. Snapshot chứa source kind/id, source updatedAt, approved catalog revision/hash, format, frozen options/optionIds, expected typed forms, source card ID nếu review; questionId riêng do server cấp, không dùng vocabulary ID làm ID câu (INTRO và recall có thể cùng word). Public projection chỉ prompt/options/media/presentation/point preview và opaque revision; key/expected typed answer/private hash không được gửi trước check.

Projection phải theo format, không chỉ xóa field `correctIndex`: MC vocab có term/audio + các options nhưng không có `meaning` riêng chỉ ra option đúng; TYPING có nghĩa tiếng Việt nhưng không có term/expected forms/example chứa đáp án; grammar có prompt/options nhưng chưa trả explanation/key. INTRO hiển thị term/meaning theo mục đích học, không có tính chất bài thi bí mật; recall sau INTRO là luyện nhớ với feedback, không tuyên bố chống gian lận hay chứng minh năng lực độc lập. Mọi alternate media/hint làm lộ term phải nằm trong policy hints đã duyệt, không truyền nguyên `ExerciseData` hiện tại.

Một active mixed-session/user là default D4; triển khai bằng partial unique index cho status IN_PROGRESS và transaction serialize theo row User. Expire/abandon attempt cũ trước tạo mới; không dùng điều kiện thời gian `now()` trong unique index. Cần migration SQL tương ứng vì đây không chỉ là `@@unique`. Không mở transaction qua provider/network/build dài: bounded candidate build ngoài lock, rồi trong transaction recheck eligibility và create/resume; nếu snapshot stale thì rebuild có giới hạn.

### 3.3 API và đáp án thực

Đề xuất dùng server check từng câu để giữ UX Kiểm tra → feedback → Tiếp tục mà không gửi key trước đáp án. Complete chỉ nhận identity vì raw answers đã bền ở answer endpoint; không phải đổi `correct` sang field tên khác mà vẫn tin client.

```ts
// POST /api/v1/session/start
{ contractVersion: 2, clientStartKey: string, requestedLevel?: CefrLevel }
// 201 created / 200 same-key replay or resumable active attempt
{ success:true, data:{ attemptId, contractVersion:2, publicRevision,
  level, status, expiresAt, items:PublicSessionItem[], checkedAnswers, nextQuestionId } }

// POST /api/v1/session/[attemptId]/answers
{ contractVersion:2, publicRevision, questionId,
  answer: {kind:'option', optionId:string}
        | {kind:'text', text:string}
        | {kind:'ack', acknowledged:true} }
// response: stored grade, feedback for this checked question, server hearts,
// nextQuestionId and completionAvailable; no reward committed here

// POST /api/v1/session/complete
{ contractVersion:2, attemptId:string, publicRevision:string }
// 200 for first commit and replay; body.data.receipt stable on both
{ success:true, data:{ receipt:{ attemptId, status, reason, level,
  gradedCount, correctCount, acknowledgedCount, baseXpEarned,
  streakBonusXp, xpEarned, heartsRemaining, completionEligible,
  wordsLearned, srsReviewed, savedAt, contractVersion, gradingVersion } } }

// GET /api/v1/session/[attemptId] : own attempt/status/public projection/receipt
// no mutations, Cache-Control private,no-store; no key for unchecked question
```

Auth checks precede domain data access. Invalid JSON/schema/level/version →400/426 with stable code; no body-type coercion. Existing/new requested level is checked against server profile and enabled catalog (SSR currently uses profile with A1 fallback; do not retain start's implicit B1). Requested unavailable level fails clearly, not silently cast. Unknown/foreign attempt/question not part of owned snapshot →404 common `ATTEMPT_NOT_FOUND`/`QUESTION_NOT_FOUND`; changed first answer/wrong next question/revision mismatch →409; expired/abandoned →410; no eligible content →200 `{state:'no_content',attemptId:null,items:[]}` without award; unknown builder type is a configuration error, not no_content. Domain codes and localized copy must be reconciled at T0.

| Session type / format | Raw answer / authoritative check | v2 eligibility |
|---|---|---|
| VOCAB_REVIEW / MULTIPLE_CHOICE | opaque optionId belongs to frozen options; compare private correctOptionId | Supported after content validation; no client fallback options |
| VOCAB_REVIEW / TYPING | text compared to frozen accepted terms using gradingVersion | Proposed normalization NFC + outer trim + case-insensitive match, following current case behavior. Do not remove umlauts, conflate ß/ss, strip articles or add fuzzy correctness without Academic policy. |
| VOCAB_NEW / INTRO | explicit acknowledgement, no correctness | No accuracy/XP/mastery by itself. D1 proposes paired recall below. |
| VOCAB_NEW / TYPING recall | actual text; same graded contract, linked to INTRO/source word | Proposed D1; not currently emitted by builder. INTRO must precede linked recall. |
| GRAMMAR / MULTIPLE_CHOICE | optionId against a stable real exercise ID inside approved lesson.exercisesJson snapshot | Design supported but pilot disabled pending D2 source/adapter signoff. A single correct answer must not mark entire lesson completed/stars3. |
| LISTENING (any format), LISTENING_MINI, MATCHING | No complete Session ExerciseData/renderer/grader pipeline exists | **Unsupported.** Reject in v2 builder schema; don't return score0 as success, don't infer support from dedicated listening/exam modules. |

Answer service locks the attempt, validates ownership/status/next question and saves first response + derived grade. Same canonical answer returns that stored result even if its first response was lost; a different response for an already-checked question returns409. Check retry for already-recorded answers returns stored feedback after terminal status (while retained); it never accepts a new answer then. Answer failure preserves the field/selection and reuses attempt/question. Ordinary content edit later does not silently change key: grade frozen snapshot. Explicitly withdrawn/deleted/unapproved content is checked before final award and prevents completion until the invalidation policy in D2 is resolved; no replacement question inserted into an existing attempt.

### 3.4 Completion transaction and counters

All W03 DB writes acquire locks in the same order: authenticated User row, then owned SessionAttempt row. Use parameterized Prisma transaction/raw locking if necessary, never string-built SQL. Same-attempt concurrent submits therefore wait and read one final receipt. Other module writers do not currently share this lock; W03 does **not** claim to solve cross-module streak races or reading/listening replay globally.

1. Validate bounded request and authenticate; within transaction load/lock owned attempt. If it already has terminal receipt, return receipt before expiry check or any reward call. If expired/abandoned/revision invalid, no mutation reward.
2. Read snapshot + stored raw answers, revalidate membership/format and deterministically grade from versioned rules; do not trust any persisted client correctness or client-supplied data. Verify all-item completion or valid hearts-exhausted prefix per D3. Missing items without legitimate terminal reason →409.
3. Recheck source eligibility and W01 owner predicate. SRS card `updatedAt` snapshot is an optimistic conflict guard against review in another tab/module; stale state →409 and rollback all effects, never overwrite newer scheduling silently. UI offers resume/retry only when appropriate or explicit abandon/new attempt; it does not loop retry a permanent conflict.
4. Apply checked review outcomes using W01 ownership. Preserve existing binary schedule until a separate FSRS policy change: correct →next day, incorrect →due now. Do not claim full FSRS integration. New vocabulary SRS creation uses unique(userId,vocabularyItemId) with upsert/unique handling; counts use actual state changes, not client array length. D1 decides wrong-new recall enrollment. No arbitrary GrammarProgress lesson completion from one question.
5. Compute base XP = sum frozen points of server-correct graded questions, INTRO0. Proposed constants retain review10, new-word recall5, approved grammar15; stored rewardPolicyVersion fixes the values. Hearts = max(0,5 − incorrect graded answers), bounded by D3; initial hearts is server policy. No new Fucoin award.
6. Call `recordLearningActivity(tx, input)` at most once: `exerciseId` and `analytics.actionId` = `session:<attempt UUID>`, actionType `lesson_session`, level from snapshot, score/max/percent exclude INTRO. For fully completed eligible attempt, lessonsCompleted1 and meaningful event allowed. D3 partial terminal has lessonsCompleted0, `updateStreak:false` and no meaningful completion/activation; optional analytics argument omitted, because shared activity emits meaningful on every analytics input. Still record verified earned XP and appropriate SRS counters. Partial receipt must not present the helper's suppressed streak placeholder as the learner's real streak. Shared activity's streak bonus on eligible full completion is included in final receipt, so UI cannot just show the sum of item points as the saved total.
7. Save receipt and terminal state in same transaction. Commit first; invalidate relevant learner caches after commit. Invalidation error is operational warning with retryable invalidation, not a signal to re-award or navigate to failed save. Receipt replay may reattempt invalidation only.

UserProgress lacks uniqueness, but call-once is guarded by locked persisted attempt transaction; failure between activity and receipt rolls everything back. No external calls, event sends outside transaction or queue delivery is needed. Event/readout identity is one attempt, not level; W08 must keep engagement actions and actual meaningful completion distinct. If tracking elapsed duration, start/end server wall-clock is not proof of active study; retain nullable/untrusted diagnostic duration until a measurement contract is approved, not inflated study minutes.

### 3.5 Quyết định chưa chốt — recommended defaults, không giả định đã được duyệt

| ID / owner | Đề xuất mặc định và căn cứ | Điều kiện READY |
|---|---|---|
| **D1 New vocabulary / PM + Academic** | INTRO currently always `handleNext(true)` earns5 and creates SRS without recall. Recommend INTRO acknowledgement0XP + one linked TYPING recall5XP; at least one graded item per awardable session. Create new SRS after checked recall, including wrong recall due now; wordsLearned only a distinct newly created word with correct recall, not proof of retention. Existing card is not counted as newly learned again. | Approve pair, accepted forms, counter semantics and fresh-user experience. If declined, specify another genuine assessment path; do not ship intro-only as meaningful activation. |
| **D2 Grammar/source / Academic + Content + Backend** | Disable hardcoded grammar session question. Bind only approved stable exercise IDs and version from actual exercisesJson; don't advance whole lesson from one item. Vocabulary must be PUBLISHED, not deleted and in selected catalog; content withdrawal invalidates pending award. | W06 catalog/adapter and withdrawal behavior signed off. Grammar can remain explicitly excluded from first W03 rollout. |
| **D3 Hearts/partial / PM + Gamification + Analytics** | Preserve5 hearts and earned XP from checked correct questions before exhaustion; permit terminal EXHAUSTED only at fifth error, retain receipt, lessonsCompleted0, no meaningful_action_completed or streak advancement/bonus. Full completion requires all planned entries checked/acknowledged and ≥1 graded item; all-wrong completed practice before exhaustion can still be a meaningful attempt, not success/mastery. If final question also consumes the fifth heart, EXHAUSTED takes precedence by this default. No arbitrary partial submit reward. | Approve terminal predicates, counters and learner copy, including all-wrong and intro-only cases. |
| **D4 Attempt/retry/expiry / CTO + PM** | One active mixed session/user; same start key returns same ID; other start request resumes active attempt. Explicit new attempt abandons current and creates new server ID. Proposed expiry24h because this is a daily session, not an existing guaranteed policy. Completed receipt replay ignores work expiry while retained. | Approve active limit,24h and explicit restart endpoint/body contract; no new ID on transport retry. Decide conflict UX for externally changed SRS. |
| **D5 Retention/limits / Privacy + CTO** | Proposal: max20 entries (current ≤11;5review +5intro/recall pairs +1grammar ≤16), text≤256 codepoints, request≤8KiB; bounded catalog queries and per-user start/check limits using existing limiter. Snapshot/raw answers/receipt retention proposed90days to support D30 diagnostics; no audio/PII beyond user relation; purge must not permit legacy replay. These are engineering proposals, not current settings or legal conclusions. | Confirm exact values, pruning owner/command, deletion behavior and rate limit config; decide whether retention needs shorter raw-answer lifetime. |
| **D6 Rollout / CTO + Delivery + QA** | Additive schema + v2 API/UI together under a server gate. Gate disabled returns maintenance/retry for session writes, never legacy reward. No backfill of historic fabricated attempts. | W01 QC/integration, migration dry run, cache owner and rollback plan confirmed; API/UI consumer inventory current. |

### 3.6 Compatibility, migration và rollback

Future implementation allowlist must be finalized after D1–D6: existing session files above; `schema.prisma` + one additive migration and generated Prisma client by integrator; new `apps/web/src/lib/session/{attempt-service,grading,schemas}.ts`; new `/api/v1/session/[attemptId]/route.ts` and `/answers/route.ts`; focused tests next to them; session player/exercises/result UI; current vi/en/de session keys. Shared activity/cache files are reuse-first, not a license for global refactor. Existing auth, dedicated reading/listening, content JSON/imports, providers, artwork, SW and package lockfiles stay outside W03 except an explicitly coordinated dependency change. Current PREP author is permitted to create **this document only**.

Recommended deployment sequence: (a) freeze/reconcile W01 tree; (b) validate additive migration on disposable DB, backup/restore drill for rollout owner, generate client once; (c) deploy compatible v2 code with session gate closed; (d) update browser consumers and ensure old PWA cache cannot serve personalized attempt data; (e) enable scoped pilot after QC. GET start legacy/POST complete without v2 identity returns426 `SESSION_UPGRADE_REQUIRED`, no reward; stale tabs retain visible draft and offer reload/restart, explaining it cannot be validated as a saved attempt. Do not silently turn an old boolean result payload into a new validated attempt.

No migration should infer historical truth from UserProgress or fabricate snapshots for old results. Old aggregate history remains labelled legacy in analytics scope. Table is additive and not dropped on rollback. Roll back to a candidate that retains W01 and rejects unverifiable legacy completion, or close session writes; never restore vulnerable awarding as the fallback. Privacy purge deletes scoped snapshots/answers/receipts after approved retention and returns404 for removed IDs, never recreate/award that ID. W04/W08 changes must coordinate schema/ledger ownership; they cannot regenerate/drop this table concurrently.

## 4. Asset plan

**No new assets.** Reuse the existing session world props `FUXIE_WORLD_PROPS.sessionFocusDojo`, `villageSquare` and mascot states already imported by SessionPlayer/SessionResultScreen. Reuse ConfirmExitDialog and PrimaryCta for pending/error/retry as appropriate. Do not render images or edit registry/public assets. This work changes integrity and state copy, not a visual redesign.

## 5. Task List

- [ ] **T0 — R1–R12 / PREP ONLY:** Record owners' D1–D6 decisions, confirm W01 ACCEPTED and W06/W08/W10 dependencies, finalize API restart/error codes/schema/migration allowlist; change status to IMPLEMENTATION_READY only with those artifacts. If blockers remain, report them; no code.
- [ ] **T1 — R1/R7/R8/R11:** Add SessionAttempt lifecycle/constraints migration and Prisma relation; verify empty/existing DB upgrade and retained history. One schema owner.
- [ ] **T2 — R3/R4/R12:** Define public/private types + bounded schemas, gradingVersion/rewardPolicyVersion, separate server-only modules and no-key DTO projection.
- [ ] **T3 — R3/R4/R9/R12:** Refactor builder into bounded eligible snapshot construction; actual question source/version, supported-type guard, D1 pair order, D2 grammar exclusion/adapter. No bulk content rewrite.
- [ ] **T4 — R1/R2/R8:** Implement start/resume/read service and endpoints, idempotent clientStartKey, profile CEFR validation, owner checks, lifecycle expiry and explicit restart per approved D4.
- [ ] **T5 — R4/R5/R8:** Implement answer persistence/locking, raw option/text/ack checks, first answer wins, deterministic grading + stored feedback, no progress side effects.
- [ ] **T6 — R2/R6/R7/R9:** Replace completion with transaction/receipt guard; preserve W01, apply server-derived counters/XP, optimistic SRS conflict guard, shared activity call-once, post-commit invalidation.
- [ ] **T7 — R4/R5/R10/R11:** Adapt MC/Typing/Intro callbacks to raw answers + server feedback; retain input on error, no local fallback question synthesis; block duplicate checks.
- [ ] **T8 — R1/R8/R10/R11:** Adapt SessionPlayer and SSR route to persistent attempt; refresh/resume via server, start/error/no-content states, preview versus committed receipt, all submit paths guarded. Visual fixtures explicitly non-persisting.
- [ ] **T9 — R9/R10:** Adapt SessionResultScreen/copy to receipt, separate acknowledgement from graded accuracy; partial/expired/failed save truthful, old-tab upgrade visible; locale parity.
- [ ] **T10 — R1–R12:** Focused tests + real isolated DB race/rollback probes + browser network-error/retry/resume verification; then integrated gates and migration/compatibility artifacts. No provider charges.
- [ ] **T11 — R11/R12:** QC against table, source/hash revision, retention/cache rollout owner, rollback evidence; handoff ACCEPTED_FOR_SCOPE or CHANGES_REQUIRED with remaining W04/W08/W10 findings.

T1–T11 are a proposed future implementation sequence, **not authorized by this PREP prompt**. Split API/data and UI commits for review but integrate as a compatible candidate before enabling the v2 gate. Do not release one half and treat runtime breakage as accepted.

## 6. Acceptance criteria / QC checklist

All expected outcomes below are binary once D1–D6 are resolved. No automated tests were run for this document.

| Case | PASS evidence required |
|---|---|
| Start and SSR bypass | Real `/session` receives a persisted own attempt; rerender/retry same start key does not create two; server profile level wins over arbitrary input. SSR cannot supply awardable initialItems without attempt. |
| Auth/owner | Anonymous rejected; teacher/admin runtime write rejected per policy; A cannot read/answer/complete B attempt. W01 foreign/malformed/mixed SRS batch regression remains green with actual DB rollback. |
| Answer tampering | Sending correct=true,totalXp<0/huge,client points/cardId/lessonId/wrong revision/type is rejected by strict contract; no progress change. Unknown/duplicate question, invalid optionId and over-limit text/body handled without reward. |
| Keys/source/version | Start/public GET/HTML payload has no answer key; original randomized option order survives retry; content edit does not regrade against a new key; withdrawal/SRS stale-state behavior matches approved policy. |
| Actual grading | MC optionId, German text edge cases and acknowledgement each follow versioned policy. Correct/incorrect feedback comes from stored raw answer. INTRO excluded from accuracy/mastery. LISTENING_MINI/MATCHING cannot silently finish. |
| First answer and retry | Lost answer response then retry returns identical saved feedback; changed answer after reveal rejected; one record/question; refreshing resumes same question/progress without key leak or losing saved answers. |
| Empty/partial/hearts | No-content has no attempt reward; no-answer completion fails; arbitrary prefix fails; fifth wrong answer produces approved EXHAUSTED receipt and truthful counters; all questions completed produces eligible receipt. |
| Server XP | Client cannot choose totalXp; persisted base matches frozen grade/points; receipt includes real shared streak bonus. New-word pair/multiple references never double-count a distinct new SRS enrollment. Grammar one-item success never marks unrelated whole lesson mastered. |
| Completion replay/race | Send same completion concurrently at least twice on real fixture DB: exactly one attempt receipt, one UserProgress, one meaningful event if eligible, one set of profile/daily increments and SRS updates. Same receipt after lost HTTP response. Test mock callback alone is insufficient. |
| Rollback | Inject failure after first SRS update or activity write but before receipt; all DB effects absent, status remains retryable; same attempt can then complete once. Invalid mixed source batch leaves no partial data. |
| UI failure | Start 5xx is error, not congratulations. Check/complete401,409,410,500,timeout keep input/answers and state; only committed receipt shows saved XP. All result buttons/Enter/doubleclick use one pending guard; no redirect-on-catch. |
| Cache and privacy | After commit dashboard fetch reflects receipt; invalidation failure does not re-award. Attempt GET is no-store and SW ownership policy verified by W10; logout A/login B cannot replay A answers/receipt. Logs/events contain IDs/counts/version, not raw answers/keys. |
| Upgrade/rollback | Old boolean payload cannot earn XP; stale tab gives upgrade recovery; additive migration preserves prior history; feature rollback closes unverifiable writes and retains W01. No fake historic attempt backfill. |

Commands for **future implementation**, from repo root with W00-confirmed Node22/pnpm9.15.4 and isolated fixture environment:

```powershell
pnpm --filter @fuxie/web exec vitest run src/app/api/v1/session src/lib/session
pnpm typecheck
pnpm test:core
pnpm check:quick
pnpm build
```

QA defines focused player/E2E command after adding actual test file names; never run a fabricated path then report it passed. Browser checks include `/session` fresh/resume/result, desktop1440 and mobile390, keyboard, simulated HTTP failures, old-tab payload and duplicate-click races. Run migration/DB concurrency probes only against verified disposable host/port/database, recording before/after without PII. Do not infer transactional rollback from Vitest mocks or HTTP200 alone. Save command/runtime/revision/time/exit code and artifact paths. Gates that fail at baseline remain FAIL/BLOCKED with analysis; do not weaken, skip or reuse old cache logs to declare acceptance.

Backend checklist applied to this prep: inputs and auth scoped; source/key trust boundaries explicit; transaction/replay/locking and cache invalidation defined; query bounds proposed; migration/privacy and unresolved policies have owners. W03 cannot close until actual implementation/QC evidence exists.

## 7. Antigravity prompt

**Spec-preparation prompt only — no code execution.** This is ready to paste to resolve design gaps; it is not an implementation work order.

```text
Vai chinh: Backend Engineer
Vai phoi hop: CTO / Tech Lead, QA Automation Engineer, Security / Privacy Consultant

Mục tiêu: hoàn thiện W03 session contract trước implementation. Repo C:\Users\DMF Schule\9-Fuxie. Hoàn tất AGENTS.md role gate; đọc task-role-router và primary/support profiles. Đọc docs/delivery/remediation-W03-session-contract.md, remediation-W01-session-ownership.md, remediation-execution-board-2026-09-11.md và docs/intake/assessment-2026-09-11/technical-quality.md, product-ux-analytics.md. Đây là PREP ONLY: không sửa code/schema/content, không chạy test/build/migration, không start service, không deploy/commit/push, không gọi provider hay ghi DB. Chỉ được sửa tài liệu W03 nếu root giao quyền file.

Đọc chính xác: apps/web/src/app/api/v1/session/start/route.ts; complete/route.ts và route.test.ts; apps/web/src/app/(learn)/session/page.tsx; apps/web/src/lib/session/builder.ts,types.ts; components/session/SessionPlayer.tsx,SessionResultScreen.tsx và exercises/IntroCard.tsx,MultipleChoice.tsx,TypingExercise.tsx; lib/progress/learning-activity.ts,cache-invalidation.ts; lib/auth/middleware.ts; packages/database/prisma/schema.prisma. Dùng Get-Content -Encoding UTF8 và rg, không in secrets/env. Kiểm cả SSR builder bypass, không chỉ API start.

Làm T0: ghi bằng chứng W01 đã QC/tích hợp hoặc giữ WAITING_GATE; phản biện SessionAttempt additive model, public/private snapshot, POST start, raw answer check endpoint, complete receipt atomic/idempotent. Chốt với owner bằng thông tin có thật D1 INTRO/recall, D2 grammar source/catalog, D3 hearts/partial/meaningful, D4 expiry/restart/conflict, D5 retention/limits, D6 migration/cache/cutover. Nếu chưa có quyết định, giữ OPEN kèm recommended default + owner, không tự ghi APPROVED. LISTENING/MATCHING chưa có renderer/grader session không được coi hỗ trợ. Không dùng client.correct làm server score. Không tái dùng VocabExerciseAttempt bằng fake theme/skill metadata.

Nghiệm thu PREP: tám phần delivery contract đầy đủ; exact file/line được recheck; mỗi loại answer có nguồn và grader; retry khác new attempt; all-or-nothing progress/receipt với concurrency proof plan; UI giữ lỗi và draft; migration/legacy/rollback không mở lại XP trust; W01 không bị ghi đè. Chỉ đánh IMPLEMENTATION_READY khi các policy/dependency bắt buộc có xác nhận từ owner; nếu chưa đủ thì trả PREPARED/BLOCKED_BY_DECISIONS và prompt triển khai chưa được ban hành.

Báo cáo: (1) source/revision đã đọc; (2) D1–D6 APPROVED/OPEN kèm nguồn/owner; (3) schema/API/transaction và consumer inventory cuối; (4) requirements→tasks→QC coverage; (5) dependency W01/W06/W08/W10; (6) exact files đề xuất cho implementation; (7) status thật và next action. Không báo test PASS trong task chỉ đọc/spec.
```

## 8. Codex prompt

None — no new assets. **Bước tiếp theo:** Delivery lấy quyết định D1–D6 và W01 QC; Backend cập nhật allowlist/API/state contract, QA duyệt ma trận đối soát DB. Khi đó mới phát hành prompt implementation W03 riêng và khóa một writer cho session/schema; giữ TECH-01 mở cho tới evidence thực.
