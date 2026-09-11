# Implementation Plan: Fuxie Public Launch Readiness

> Vai chinh: Project Manager / Delivery Manager
> Vai phoi hop: CTO / Tech Lead, Product Manager EdTech, CEO / General Manager
>
> Source of truth: `requirements.md` (R1–R14) và `design.md` (M0–M4, WS1–WS12) trong folder này.
> Đây là **program backlog**: mỗi mục `S-n` là một Child_Slice. Khi tới lượt thực thi, Claude viết một Kiro spec riêng cho slice đó (requirements/design/tasks theo EARS) + handoff prompt cho Antigravity, theo `three-agent-delivery-model.md`. Slice nào đã có spec thì tái dùng, không tạo trùng.

## Cách đọc

- `[ ]` = chưa làm · `[x]` = đã đạt (có Evidence).
- Mỗi slice ghi: **Role** (vai chính thực thi), **Mốc** (milestone gate nó phục vụ), **Đóng** (Requirement/Risk), **Acceptance** (cách Claude QC).
- Không tick một slice nếu thiếu Evidence (gate log / smoke / eval readout / diff review trong `qc-log.md`).

---

## M0 — Baseline (owner: CEO/GM)

- [ ] **S0. Launch baseline & scope freeze**
  - Role: Project Manager / Delivery Manager (phối CTO, PM EdTech)
  - Inventory mọi P0/P1 đang mở từ `risk-register.md` + `fuxie-ui-ux-p0-remediation/tasks.md` (mục 1–3 còn open) + `issue-log.md`.
  - Chốt scope M1→M4 với owner; ghi quyết định + tradeoff.
  - Xác nhận Release_Gate_Suite xanh hiện hành và tree đã phân loại (R1.3).
  - Acceptance: bảng inventory P0/P1 có owner+mốc; owner ký M0; gate log đính kèm.
  - _Đóng: R1 (một phần), R2 (một phần)_

## M1 — Release Candidate (owner: CEO/GM + CTO)

- [ ] **S1. Đóng P0 gates / env / DB hygiene**
  - Role: DevOps / Cloud Engineer (phối QA Automation, Backend)
  - Chạy & log: `check:quick`, `test:core`, `qa:content`, `security:secrets`, `build`; xử lý `db:generate`/migration EPERM (R-005); chốt `sw.js` tracked/ignored nhất quán; `env:audit(:services)` sạch hoặc accept có chữ ký.
  - Acceptance: toàn bộ Release_Gate_Suite xanh trên tree sạch; env/db evidence đính kèm.
  - _Đóng: R1, R2 · risk R-001, R-002, R-003, R-005_

- [ ] **S2. Auth & access control production-path**
  - Role: Backend Engineer (phối Security/Privacy, QA Automation)
  - Đảm bảo production auth path (không dev-auth) cho public; learner/teacher/admin separation; cô lập dev-auth khỏi production build.
  - Acceptance: `smoke:full-local` login 3 role 200; smoke role-cross bị từ chối; diff reviewed.
  - _Đóng: R3 (1–2) · risk R-004_

- [ ] **S3. Learning-loop P0 + UI/UX P0 hoàn tất**
  - Role: Product Manager EdTech (phối Frontend, Product Designer, QA Automation)
  - Drive `docs/delivery/slice-A..E` tới QC-accepted; drive `fuxie-ui-ux-p0-remediation` TICKET-01..04 (mục 1–3 trong tasks.md của spec đó) tới done + verification. **Tái dùng spec sẵn có, không viết mới.**
  - Acceptance: slice A–E + TICKET-01..04 pass acceptance; không fake/placeholder; lỗi learner-facing; gates xanh; ghi `qc-log.md`.
  - _Đóng: R7 · risk R-012 (một phần), R-014_
  - 🚩 **M1 GATE** — owner + CTO ký sau khi S1–S3 đạt.

## M2 — Closed Beta GA-ready (owner: CTO + PM EdTech)

- [ ] **S4. AI eval gate với provider thật**
  - Role: AI / LLM Engineer (phối German Academic Lead, Data/Analytics, Security)
  - Cấu hình provider key an toàn (ISSUE-BETA-002, không commit secret); chạy `eval:ai --provider` + `eval:ai:readout`; đạt rubric + ngưỡng cost/latency; fallback learner-facing khi provider lỗi.
  - Acceptance: readout đạt ngưỡng tài liệu hóa; `security:secrets` pass; fallback smoke pass.
  - _Đóng: R4 · risk R-007 · ISSUE-BETA-002_

- [ ] **S5. Speech / audio readiness smoke**
  - Role: Speech / Audio Engineer (phối AI/LLM, Audio Script & Voice Producer)
  - Speaking (STT + pronunciation) smoke Chrome + 1 mobile browser; xử lý mic-denied/provider-fail learner-facing; xác nhận TTS audio/no-audio item.
  - Acceptance: speaking smoke pass đa browser; trạng thái lỗi rõ; evidence đính kèm.
  - _Đóng: R5 · risk R-008_

- [ ] **S6. Content/CEFR QA + locale parity sign-off**
  - Role: German Academic Lead (phối Content QA, Vietnamese-German Localization)
  - `qa:content` pass; `check:locale-parity` = 0; spot-check A1/B2/C1/C2; `qa:copy-style` không violation chặn ở route learner.
  - Acceptance: parity 0; content sign-off có chữ ký; blocker clear hoặc liệt kê có owner.
  - _Đóng: R6 · risk R-006_

- [ ] **S2b. Role-separation verified (M2 tier)**
  - Role: Security / Privacy Consultant (phối Backend, QA Automation)
  - Smoke có chữ ký xác nhận không rò rỉ dữ liệu cross-role; access-control cho public.
  - Acceptance: smoke role-separation có chữ ký; R3 (3–4) đạt.
  - _Đóng: R3 (3–4) · risk R-004_
  - 🚩 **M2 GATE** — CTO + PM EdTech ký sau khi S4–S6, S2b đạt.

## M3 — Public Soft Launch (owner: CEO/GM + CTO)

- [ ] **S7. Analytics & cache integrity + teacher/admin UI verify**
  - Role: Data / Analytics Engineer (phối Backend, PM EdTech)
  - Cache invalidation khi learner state mutate (no stale); verify teacher/admin analytics trong UI thật; instrument funnel onboarding→session→retention.
  - Acceptance: stale-data smoke pass; teacher/admin UI verified; event funnel đo được.
  - _Đóng: R8 · risk R-009, R-010_

- [ ] **S8. Performance & bundle budget gate**
  - Role: CTO / Tech Lead (phối DevOps, Frontend)
  - `bundle:budget` thành release gate (chặn, không chỉ warn); `perf:local` làm tín hiệu xu hướng; CWV first-viewport mobile đạt ngưỡng.
  - Acceptance: bundle gate enforced trong release flow; CWV evidence đính kèm.
  - _Đóng: R9 · risk R-013_

- [ ] **S9. Legal / privacy / security pack**
  - Role: Legal / Compliance Advisor (phối Security/Privacy, CEO/GM)
  - Publish ToS + Privacy Policy linkable từ onboarding; data-retention + account-deletion path; audio/voice consent; `security:secrets` pass; chú ý xử lý minor.
  - Acceptance: ToS/Privacy live + link; consent flow; secret audit pass.
  - _Đóng: R10_

- [ ] **S10. GTM & một B2C motion + funnel**
  - Role: Growth Lead (phối Data/Analytics, PM EdTech, CEO/GM)
  - Chốt 1 primary B2C motion (VN self-study); instrument acquisition→activation→D1/D7; landing/onboarding value prop first-viewport mobile, first session ≤ 1 hành động.
  - Acceptance: funnel dashboard đo được; owner chốt motion; onboarding đạt tiêu chí.
  - _Đóng: R11 · risk R-011_

- [ ] **S11. Observability, scaling & rollback runbook**
  - Role: DevOps / Cloud Engineer (phối Security, CTO)
  - Error/latency monitoring + alert; rollback runbook đã thử ≥1 lần; production error learner-safe (no stack/secret leak); load expectation tài liệu hóa.
  - Acceptance: alert hoạt động; rollback drill log; load note có chữ ký.
  - _Đóng: R12_
  - 🚩 **M3 GATE** — owner + CTO ký sau khi S7–S11 đạt.

## M4 — Public Launch GA (owner: CEO/GM)

- [ ] **S12. Launch Readiness Review & owner sign-off**
  - Role: Project Manager / Delivery Manager (phối CEO/GM, Operations Manager)
  - Tổng hợp trạng thái R1–R13 + evidence link; xác nhận không P0_Risk mở; owner go/no-go bằng văn bản; ghi accepted-with-risk nếu có.
  - Acceptance: bảng LRR đầy đủ evidence; chữ ký go/no-go của owner; quyết định + tradeoff ghi lại.
  - _Đóng: R14_
  - 🚩 **M4 GATE = PUBLIC LAUNCH** — chỉ owner ký.

## Post-launch (liên tục)

- [ ] **S13. Beta/launch feedback → fix loop**
  - Role: Operations Manager (phối PM/Delivery, QA Automation)
  - Ghi feedback learner thật vào `issue-log.md` (P0–P2); first-fix theo evidence (như phase 66–67); đường hotfix QC-pass cho P0 sau launch.
  - Acceptance: loop chạy ≥1 vòng có evidence; hotfix path verified.
  - _Đóng: R13_

---

## Next concrete step (đề xuất của planner)

Slice mở khóa mọi thứ là **S1 + S2** (gates/env/db sạch + auth production-path) — vì mọi smoke/eval/launch review phụ thuộc môi trường tái lập (đúng bài học phase 66–67). Đề xuất: Claude viết Kiro spec đầy đủ cho **S1** trước (requirements/design/tasks + handoff prompt cho Antigravity), owner duyệt, rồi giao thực thi.
