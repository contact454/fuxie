# Requirements Document

## Introduction

Đây là spec **cấp chương trình** (program-level), không phải một feature slice. Mục tiêu: định nghĩa các **điều kiện ra mắt công khai (Public Launch)** mà Fuxie phải thỏa mãn để chuyển từ trạng thái *controlled beta* hiện tại sang *public general availability (GA)* một cách an toàn cho người học, dữ liệu và thương hiệu.

Spec này là **single source of truth cho launch readiness**. Nó không tự thực thi code. Thay vào đó nó định nghĩa các *gate* (cổng) launch dạng EARS, và `tasks.md` chia chương trình thành các **child slice** — mỗi slice sau này được viết thành một Kiro spec riêng (requirements/design/tasks) và giao cho Antigravity thực thi theo `three-agent-delivery-model.md`. Claude (planner/QC) sở hữu spec này; owner (CEO/General Manager) phê duyệt từng milestone gate.

Spec bám sát bằng chứng đã có trong repo tại thời điểm 2026-06-07: `docs/intake/risk-register.md`, các phase intake 50–67, `docs/delivery/` (slice A–E + `qc-log.md`), và spec `.kiro/specs/fuxie-ui-ux-p0-remediation/`. Không yêu cầu nào trong tài liệu này được coi là "đạt" nếu thiếu bằng chứng (gate log, smoke result, eval readout, diff review) tương ứng.

## Glossary

- **Public_Launch**: Trạng thái Fuxie mở đăng ký công khai cho người học B2C Việt (không còn giới hạn invite-only), với đầy đủ legal/privacy, observability và rollback plan.
- **Release_Gate_Suite**: Tập lệnh kiểm định bắt buộc: `pnpm check:quick`, `pnpm test:core`, `pnpm qa:content`, `pnpm security:secrets`, `pnpm build`, và `pnpm smoke:full-local` (hoặc bản production tương đương). "Green" = tất cả pass và có log.
- **Milestone_Gate**: Một mốc readiness (M0–M4) phải được owner ký duyệt trước khi sang mốc kế tiếp. Xem `design.md`.
- **Launch_Readiness_Review (LRR)**: Buổi review cuối do owner chủ trì, ký duyệt go/no-go cho Public_Launch dựa trên trạng thái mọi Requirement trong spec này.
- **Owner**: Anh Fuchs — vai CEO/General Manager, người ký duyệt mọi Milestone_Gate và LRR.
- **P0_Risk / P1_Risk / P2_Risk**: Mức độ rủi ro theo `risk-register.md` (P0 chặn baseline an toàn; P1 chặn beta tự tin; P2 cải thiện không chặn).
- **AI_Eval_Gate**: Eval AI tutor/grading chạy với provider thật, đạt rubric + ngưỡng cost/latency, có readout (`pnpm eval:ai:readout`).
- **Content_Parity**: `pnpm check:locale-parity` = 0 violations cho mọi route learner (DE/VI).
- **Child_Slice**: Một đơn vị công việc được tách ra từ `tasks.md`, sẽ trở thành một Kiro spec độc lập khi tới lượt thực thi.
- **Evidence**: Một artifact kiểm chứng được (gate log, smoke output, eval readout, screenshot, diff review trong `qc-log.md`).

## Requirements

### Requirement 1: Release gates & build hygiene xanh và hiện hành

**User Story:** As the Owner, I want every release gate green on a clean tree with a current log, so that no launch decision rests on stale or unknown build state.

#### Acceptance Criteria

1. THE Release_Gate_Suite SHALL pass với evidence log không cũ hơn commit mới nhất chạm runtime source.
2. WHEN một commit thay đổi runtime source (apps/, packages/, services/), THE Release_Gate_Suite SHALL được chạy lại trước khi commit đó được tính vào một Milestone_Gate.
3. THE working tree SHALL không chứa diff high-risk chưa phân loại; mọi diff governance/intake/runtime/generated phải được tách nhóm rõ (đóng R-001).
4. IF `pnpm db:generate` hoặc migration fail hoặc tạo tracked change ngoài dự kiến, THEN THE chương trình SHALL coi đó là P0 blocker cho mọi mốc từ M1 trở đi (đóng R-005).
5. THE generated artifact `apps/web/public/sw.js` SHALL được commit hoặc gitignore nhất quán, không bị treat như diff bất ngờ.

### Requirement 2: Môi trường & service readiness có thể tái lập

**User Story:** As a DevOps/Cloud Engineer, I want environment and service audits to pass deterministically, so that smoke and deploy reflect real production behavior.

#### Acceptance Criteria

1. THE `pnpm env:audit` và `pnpm env:audit:services` SHALL pass không có readiness warning trên môi trường dùng để ký M1 (đóng R-003).
2. WHERE Redis/Postgres là phụ thuộc runtime, THE smoke environment SHALL chạy các service đó healthy hoặc ghi rõ chấp nhận rủi ro có chữ ký owner.
3. THE production deploy target (Vercel + AWS S3 + Google Cloud) SHALL có env var được kiểm toán bằng `pnpm env:audit` ở cấu hình production trước M3.

### Requirement 3: Auth, role separation & access control sẵn sàng public

**User Story:** As a Security/Privacy Consultant, I want learner/teacher/admin separation verified beyond dev-auth, so that public users cannot cross role boundaries.

#### Acceptance Criteria

1. THE `pnpm smoke:full-local` SHALL đăng nhập thành công learner/teacher/admin và trả 200 cho endpoint role-scoped (BETA-001 đã verify — duy trì current).
2. THE auth flow dùng cho Public_Launch SHALL là production auth path, không phải dev-auth shortcut; dev-auth SHALL bị tắt hoặc cô lập khỏi production build.
3. WHEN một user role learner truy cập route teacher/admin, THE system SHALL từ chối truy cập và không rò rỉ dữ liệu role khác.
4. THE access-control SHALL được kiểm bằng smoke có chữ ký trước M2 (đóng R-004).

### Requirement 4: AI tutor & grading đạt chất lượng + cost gate với provider thật

**User Story:** As an AI/LLM Engineer, I want provider-backed evals passing rubric and cost/latency thresholds, so that AI claims are safe to make publicly.

#### Acceptance Criteria

1. THE AI_Eval_Gate SHALL chạy `pnpm eval:ai` với provider thật (`--provider`) và sinh readout qua `pnpm eval:ai:readout`.
2. THE provider key cần cho eval (ISSUE-BETA-002) SHALL được cấu hình an toàn (không commit secret; `pnpm security:secrets` pass).
3. THE AI_Eval_Gate SHALL đạt rubric tối thiểu đã định và nằm trong ngưỡng cost/latency tài liệu hóa trước M2 (đóng R-007).
4. IF AI provider lỗi hoặc vượt ngân sách, THEN THE system SHALL fallback học-được (learner-facing) thay vì im lặng fail.
5. WHERE AI sinh nội dung học hoặc chấm CEFR, THE output SHALL được Content QA / German Academic Lead spot-check trước khi tuyên bố công khai.

### Requirement 5: Speech / audio pipeline ổn định trên browser & provider

**User Story:** As a Speech/Audio Engineer, I want speaking and live-audio paths smoke-tested across browser/provider edge cases, so that pronunciation features work for public users.

#### Acceptance Criteria

1. THE speaking flow (STT + pronunciation scoring) SHALL pass smoke trên ít nhất Chrome + một browser mobile trước M2 (đóng R-008).
2. WHEN quyền microphone bị từ chối hoặc provider audio lỗi, THE system SHALL hiển thị trạng thái learner-facing rõ ràng và đường phục hồi.
3. THE TTS listening audio SHALL phát đúng cho item có audio và xử lý an toàn item không audio (theo Slice A acceptance đã pass).

### Requirement 6: Content & CEFR correctness + locale parity sạch

**User Story:** As the German Academic Lead, I want content QA and locale parity clean across levels, so that learners never see broken or wrong-language content.

#### Acceptance Criteria

1. THE `pnpm qa:content` SHALL pass và content blocker được clear hoặc liệt kê có owner (đóng R-006).
2. THE Content_Parity (`pnpm check:locale-parity`) SHALL = 0 violations cho mọi route learner.
3. THE content SHALL được spot-check tối thiểu ở A1, B2, C1, C2 với chữ ký Content QA / Linguistic Reviewer trước M2.
4. WHERE mojibake/copy-style violation tồn tại, THE `pnpm qa:copy-style` SHALL không còn violation chặn ở route learner.

### Requirement 7: Learning-loop P0 & UI/UX P0 hoàn tất (first-session "wow")

**User Story:** As a Product Manager EdTech, I want the first-session learning loop and P0 UI/UX remediation complete, so that a new public learner has a correct, non-broken first experience.

#### Acceptance Criteria

1. THE learning-loop P0 slices (docs/delivery slice A–E) SHALL được QC-accepted trong `qc-log.md` với gates xanh.
2. THE spec `fuxie-ui-ux-p0-remediation` TICKET-01..04 (contrast, reward amber/focus, German overflow, flow safeguards/fail-open) SHALL hoàn tất phần implementation (mục 1–3 trong tasks.md của spec đó) và pass verification.
3. THE UI SHALL không ship fake/placeholder (no dead button, no simulated data trình bày như thật) tại mọi surface learner trước M1.
4. WHEN một hành động learner thất bại (submit, claim, practice-open), THE system SHALL báo learner-facing và cho đường retry.

### Requirement 8: Data, analytics & cache integrity

**User Story:** As a Data/Analytics Engineer, I want learning events correct and no stale personalized data, so that decisions and learner views are trustworthy at scale.

#### Acceptance Criteria

1. WHEN learner state mutate (XP, streak, Fucoin, SRS card), THE cache SHALL invalidate sao cho không hiển thị dữ liệu cũ (đóng R-009).
2. THE teacher/admin analytics SHALL được verify trong UI thật (không chỉ test) trước M3 (đóng R-010).
3. THE learning-event instrumentation SHALL ghi đủ funnel onboarding → first session → retention cho GTM đo lường (liên kết Req 11).

### Requirement 9: Performance & bundle budget là release gate

**User Story:** As the CTO/Tech Lead, I want perf trend tracked and bundle budget enforced, so that public launch meets acceptable load performance.

#### Acceptance Criteria

1. THE `pnpm bundle:budget` SHALL pass như một release gate (không chỉ cảnh báo) trước M3 (đóng R-013).
2. THE `pnpm perf:local` SHALL được dùng làm tín hiệu xu hướng, ghi nhận median ấm so với budget, không chặn sai.
3. THE first-viewport mobile của surface learner chính SHALL đạt ngưỡng Core Web Vitals tài liệu hóa trước M3.

### Requirement 10: Legal, privacy & security pack cho public

**User Story:** As a Legal/Compliance Advisor, I want terms/privacy and security controls ready, so that opening registration publicly is compliant and safe.

#### Acceptance Criteria

1. THE Public_Launch SHALL có Terms of Service và Privacy Policy được publish và linkable từ onboarding/registration.
2. THE `pnpm security:secrets` SHALL pass; không secret nào nằm trong tracked source.
3. THE personal data của learner (đặc biệt nếu có minor) SHALL được xử lý theo policy tài liệu hóa, với data-retention và account-deletion path.
4. WHERE Fuxie thu thập audio/giọng nói, THE consent SHALL được lấy rõ ràng trước khi ghi.

### Requirement 11: Go-to-market & một B2C motion sẵn sàng

**User Story:** As the Growth Lead, I want one primary B2C self-study motion instrumented, so that launch has a measurable acquisition→activation funnel rather than spreading thin.

#### Acceptance Criteria

1. THE chương trình SHALL chốt đúng **một** primary growth motion B2C (Vietnamese self-study), teacher/admin là support/B2B tương lai (đóng R-011).
2. THE onboarding funnel SHALL có instrumentation đo acquisition → activation → D1/D7 retention.
3. THE landing/onboarding SHALL truyền đạt value prop rõ trong first viewport mobile và dẫn tới first session ≤ 1 hành động chính.

### Requirement 12: Production observability, scaling & rollback

**User Story:** As a DevOps/Cloud Engineer, I want monitoring, scaling and a rollback runbook, so that public traffic can be operated safely.

#### Acceptance Criteria

1. THE production SHALL có error/latency monitoring và alert tới owner/on-call trước M4.
2. THE deploy SHALL có rollback runbook tài liệu hóa và đã thử ít nhất một lần.
3. WHEN lỗi production xảy ra, THE system SHALL log learner-facing-safe và không phơi stack/secret cho user.
4. THE infra SHALL chịu được tải dự kiến của soft-launch cohort đầu tiên (load expectation tài liệu hóa).

### Requirement 13: Beta feedback → fix loop vận hành liên tục

**User Story:** As the Operations Manager, I want a working evidence→triage→fix loop, so that real learner feedback drives prioritized fixes before and after launch.

#### Acceptance Criteria

1. THE issue intake SHALL ghi feedback learner thật vào `issue-log.md` với priority (P0–P2).
2. THE first-fix cadence SHALL chọn slice theo evidence (như phase 66–67), không theo phỏng đoán.
3. WHEN một P0 learner-facing issue xuất hiện sau launch, THE loop SHALL có đường hotfix với QC pass trước khi ship.

### Requirement 14: Launch Readiness Review & owner sign-off

**User Story:** As the Owner, I want a single go/no-go review backed by evidence, so that the public launch decision is explicit and accountable.

#### Acceptance Criteria

1. THE LRR SHALL tổng hợp trạng thái mọi Requirement 1–13 với evidence link cho mỗi mục.
2. THE Public_Launch SHALL không xảy ra nếu còn bất kỳ P0_Risk nào mở hoặc bất kỳ Requirement M4-gated nào chưa đạt.
3. THE owner SHALL ký duyệt go/no-go bằng văn bản; quyết định và tradeoff được ghi lại.
4. IF một gate được chấp nhận có điều kiện (accepted-with-risk), THEN THE rủi ro và người chịu trách nhiệm SHALL được ghi rõ trong LRR.
