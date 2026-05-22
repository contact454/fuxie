- Vai chinh: Product Designer
- Vai chinh: Product Designer
- Vai phoi hop: QA Automation Engineer, Illustrator / 3D Mascot Artist, Project Manager / Delivery Manager

# Render Queue — fuxie-visual-mocktest-pack

## Status

- Status: WAVE_1_PASS / WAVE_2_PASS / WAVE_3_PASS / WAVE_4_PASS / WAVE_5_PASS / WAVE_6_PASS / WAVE_7_PASS / WAVE_8_PASS / WAVE_9_PASS / WAVE_10_PASS / WAVE_11_PASS / WAVE_12_PASS / WAVE_13_PASS / WAVE_14_PASS / WAVE_15_PASS / WAVE_16_PASS / WAVE_17_PASS / WAVE_18_PASS
- Last Reviewed: 2026-05-21T00:00:00Z
- Wave 1 (`00-style-master`): **PASS · 92/100** (signed 2026-05-17, Pack_Owner authorized; QA_Owner sign-off delegated via Kiro adopting Codex QC pass-candidate scores; provenance: [`codex-style-master-visual-qc-2026-05-17.md`](./codex-style-master-visual-qc-2026-05-17.md)).
- Wave 2 (`01-dashboard`): **PASS · 91/100** (signed 2026-05-17, Pack_Owner authorized; QA_Owner sign-off delegated via Kiro adopting Codex QC pass-candidate scores; provenance: [`codex-01-dashboard-visual-qc-2026-05-17.md`](./codex-01-dashboard-visual-qc-2026-05-17.md)).
- Wave 3 (`03-session`): **PASS · 91/100** (signed 2026-05-20, Pack_Owner authorized; QA_Owner sign-off delegated via Antigravity adopting Codex QC pass-candidate scores; provenance: [`codex-03-session-visual-qc-2026-05-20.md`](./codex-03-session-visual-qc-2026-05-20.md)).
- Wave 4 (`02-course`): **PASS · 95/100** (signed 2026-05-20, Pack_Owner authorized; QA_Owner sign-off delegated via Antigravity adopting Codex QC pass-candidate scores; provenance: [`codex-02-course-visual-qc-2026-05-20.md`](./codex-02-course-visual-qc-2026-05-20.md)).
- Wave 5 (`05-vocabulary`): **PASS · 94/100** (signed 2026-05-21, Pack_Owner authorized; QA_Owner sign-off delegated via Antigravity adopting Codex QC pass-candidate scores; provenance: GPT image 2.0).
- Wave 6 (`06-grammar`): **PASS · 94/100** (signed 2026-05-21, Pack_Owner authorized; QA_Owner sign-off delegated via Antigravity adopting Codex QC pass-candidate scores; provenance: GPT image 2.0 / gpt-image pipeline).
- Wave 7 (`07-listening`): **PASS · 95/100** (signed 2026-05-21 via Codex QC; provenance: built-in `image_gen` / GPT image pipeline with user-approved override).
- Wave 8 (`08-speaking`): **PASS · 95/100** (signed 2026-05-21 via Codex QC; provenance: built-in `image_gen` / GPT image pipeline).
- Wave 9 (`09-reading`): **PASS · 92/100** (signed 2026-05-21 via Codex QC; provenance: built-in `image_gen` / GPT image pipeline).
- Wave 10 (`10-writing`): **PASS · 93/100** (signed 2026-05-21 via Codex QC; provenance: built-in `image_gen` / GPT image pipeline).
- Wave 11 (`04-review`): **PASS · 95/100** (signed 2026-05-21 via Codex QC; provenance: built-in `image_gen` / GPT image pipeline).
- Wave 12 (`11-exam`): **PASS · 95/100** (signed 2026-05-21 via Codex QC; provenance: built-in `image_gen` / GPT image pipeline).
- Wave 13 (`12-rewards`): **PASS · 95/100** (signed 2026-05-21 via Codex QC; provenance: built-in `image_gen` / GPT image pipeline).
- Wave 14 (`13-missions`): **PASS · 95/100** (signed 2026-05-21 via Codex QC; provenance: built-in `image_gen` / GPT image pipeline).
- Wave 15 (`14-chat`): **PASS · 95/100** (signed 2026-05-21 via Codex QC; provenance: built-in `image_gen` / GPT image pipeline).
- Wave 16 (`15-profile`): **PASS** · 95/100 (signed 2026-05-21).
- Wave 17 (`16-teacher`): **PASS** · 95/100 (signed 2026-05-21).
- Wave 18 (`17-admin`): **PASS** · 95/100 · signed 2026-05-21.
- Total jobs: 54 (1 wave × 3 jobs cho `00-style-master` + 17 wave × 3 jobs cho 17 module downstream).
- Companion machine-readable file: [`render-queue.json`](./render-queue.json).

Pack scaffold đã PASS. `00-style-master`, `01-dashboard`, `03-session`, `02-course`, `05-vocabulary`, `06-grammar`, `07-listening`, `08-speaking`, `09-reading`, `10-writing`, `04-review`, `11-exam`, `12-rewards`, `13-missions`, `14-chat`, `15-profile`, `16-teacher`, và `17-admin` đã PASS Visual_Target_Score. Wave 18 `17-admin` đã có PROVENANCE_PASS từ built-in `image_gen` / GPT image pipeline, originality co-review hoàn tất, và QA_Owner sign-off 95/100 vào 2026-05-21.

## Render order

1. **Wave 1 (`00-style-master`)** — 3 job (S1, S2, S3) phải render TRƯỚC. Sau khi render xong, QA_Owner chấm Visual_Target_Score cho `00-style-master`. Module này phải đạt `PASS` (tổng ≥ 80, không chiều trọng số nào < 50% trọng số riêng, gate State coverage = PASS, QA_Owner ký) trước khi bất kỳ Wave 2..18 nào được chạy.
2. **Wave 2..18 (17 module downstream)** — chạy theo Priority_Owner-approved order, mỗi module một wave 3 job. Thứ tự: `01-dashboard` → `03-session` → `02-course` → `05-vocabulary` → `06-grammar` → `07-listening` → `08-speaking` → `09-reading` → `10-writing` → `04-review` → `11-exam` → `12-rewards` → `13-missions` → `14-chat` → `15-profile` → `16-teacher` → `17-admin`.

Có thể chạy 3 job trong cùng một wave song song (mock-desktop, mock-mobile, mock-state đều tham chiếu cùng `generation-prompt.md`); nhưng các wave phải tuần tự để tận dụng feedback Visual_Target_Score sau mỗi module.

## Per-job execution rules

- Đọc `promptSource` để lấy canonical Fuxie Bright Sky prompt block + module-specific cues + viewport spec.
- Render PNG đúng `viewport`. Ghi đè placeholder 1×1 transparent PNG tại `outputPath` ngay tại chỗ; không tạo file phụ.
- Cập nhật `Reviewer:` (Pack_Owner name) và `Date (ISO 8601):` trong `generation-prompt.md` của module trong **cùng change set** với render PNG (Requirement 12 AC 6 — provenance refresh rule). Provenance stale = block sign-off.
- Pack_Owner + Illustrator / 3D Mascot Artist chạy Originality_Guardrail co-review (Requirement 9 AC 1, 7) trên mock vừa render trước khi module được chấm Visual_Target_Score.
- QA_Owner chấm Visual_Target_Score per module sau khi cả 3 mock của module đó land. Cập nhật cả `qa-checklist.md` Visual Target Score section AND README `## Visual Target Score audit table` row trong cùng change set.

## Hard rules

- Không render thêm bất kỳ `mock-state-*.png` variant nào; V0 chỉ một `mock-state.png` per module.
- Không sửa `apps/web/...`, production routes, CI configs, hay module implementation code.
- Không mark bất kỳ module nào PASS trước khi PNG thật land và QA_Owner ký.

## Job table — 54 jobs

### Wave 1: `00-style-master` — PASS · 92/100 (signed 2026-05-17)

| Job | Module | Output file | Viewport | Selected state | Prompt source | Output path | Status | Reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | `00-style-master` | `mock-desktop.png` | 1440×900 | — | `docs/design/fuxie-visual-mocktests/00-style-master/generation-prompt.md` | `docs/design/fuxie-visual-mocktests/00-style-master/mock-desktop.png` | **PASS** | Pack_Owner + QA_Owner (delegated sign-off via Kiro 2026-05-17, Codex QC adopted) |
| S2 | `00-style-master` | `mock-mobile.png` | 390×844 | — | `docs/design/fuxie-visual-mocktests/00-style-master/generation-prompt.md` | `docs/design/fuxie-visual-mocktests/00-style-master/mock-mobile.png` | **PASS** | Pack_Owner + QA_Owner (delegated sign-off via Kiro 2026-05-17, Codex QC adopted) |
| S3 | `00-style-master` | `mock-state.png` | state | interaction primary state — CTA hover/focus + chip selected + state swatches (success/warning/danger) | `docs/design/fuxie-visual-mocktests/00-style-master/generation-prompt.md` | `docs/design/fuxie-visual-mocktests/00-style-master/mock-state.png` | **PASS** | Pack_Owner + QA_Owner (delegated sign-off via Kiro 2026-05-17, Codex QC adopted) |

Notes:
- All 3 PNGs machine-verified (PNG signature valid; mock-desktop = 1440×900 / 1.89 MB; mock-mobile = 390×844 / 468 KB; mock-state = 1440×900 single interaction-primary state / 1.88 MB).
- Visual_Target_Score 92/100; per-dim breakdown in `docs/design/fuxie-visual-mocktests/00-style-master/qa-checklist.md`.
- All 6 weighted dims ≥ 50% of their weight; State coverage gate = PASS; QA_Owner signed.
- **`00-style-master` PASS unlocked Wave 2.** Wave 2 (`01-dashboard`) is now PASS.

### Wave 2: `01-dashboard` — PASS · 91/100 (signed 2026-05-17)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D1 | `mock-desktop.png` | 1440×900 | — | **PASS** | Pack_Owner + QA_Owner (delegated sign-off via Kiro 2026-05-17, Codex QC adopted) |
| D2 | `mock-mobile.png` | 390×844 | — | **PASS** | Pack_Owner + QA_Owner (delegated sign-off via Kiro 2026-05-17, Codex QC adopted) |
| D3 | `mock-state.png` | state | empty state — chưa có session hôm nay | **PASS** | Pack_Owner + QA_Owner (delegated sign-off via Kiro 2026-05-17, Codex QC adopted) |

- Prompt source: `docs/design/fuxie-visual-mocktests/01-dashboard/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/01-dashboard/<output-file>`
- Notes:
  - All 3 PNGs machine-verified (mock-desktop = 1440×900 / 1.83 MB; mock-mobile = 390×844 / 459 KB; mock-state = 1440×900 single empty-state dashboard / 2.27 MB).
  - Visual_Target_Score 91/100; per-dim breakdown in `docs/design/fuxie-visual-mocktests/01-dashboard/qa-checklist.md`.
  - All 6 weighted dims ≥ 50% of their weight; State coverage gate = PASS; QA_Owner signed.
  - **`01-dashboard` PASS unlocked Wave 3.** Wave 3 (`03-session`) is now PASS.

### Wave 3: `03-session` — PASS · 91/100 (signed 2026-05-20)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D4 | `mock-desktop.png` | 1440×900 | — | **PASS** | Pack_Owner + QA_Owner (delegated sign-off via Antigravity 2026-05-20, QC 91/100 adopted) |
| D5 | `mock-mobile.png` | 390×844 | — | **PASS** | Pack_Owner + QA_Owner (delegated sign-off via Antigravity 2026-05-20, QC 91/100 adopted) |
| D6 | `mock-state.png` | state | success state — phiên học hoàn thành | **PASS** | Pack_Owner + QA_Owner (delegated sign-off via Antigravity 2026-05-20, QC 91/100 adopted) |

- Prompt source: `docs/design/fuxie-visual-mocktests/03-session/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/03-session/<output-file>`
- Notes:
  - All 3 PNGs machine-verified (mock-desktop = 1440×900 / 2,094,598 bytes; mock-mobile = 390×844 / 518,103 bytes; mock-state = 1440×900 single success-state session / 2,255,814 bytes).
  - Visual_Target_Score 91/100; per-dim breakdown in `docs/design/fuxie-visual-mocktests/03-session/qa-checklist.md`.
  - All 6 weighted dims ≥ 50% of their weight; State coverage gate = PASS; QA_Owner signed.
  - **`03-session` PASS unlocked Wave 4.** Wave 4 (`02-course`) is now PASS.

### Wave 4: `02-course` — PASS · 95/100 (signed 2026-05-20)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D7 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (delegated via Antigravity 2026-05-20, QC 95/100 adopted) |
| D8 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (delegated via Antigravity 2026-05-20, QC 95/100 adopted) |
| D9 | `mock-state.png` | state | loading state — đang tải catalog | **PASS** | QA_Owner (delegated via Antigravity 2026-05-20, QC 95/100 adopted) |

- Prompt source: `docs/design/fuxie-visual-mocktests/02-course/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/02-course/<output-file>`
- Notes:
  - All 3 PNGs machine-verified (mock-desktop = 1440×900 / 2,052,390 bytes; mock-mobile = 390×844 / 564,673 bytes; mock-state = 1440×900 single loading-state / 1,665,398 bytes).
  - Visual_Target_Score 95/100; per-dim breakdown in `docs/design/fuxie-visual-mocktests/02-course/qa-checklist.md`.
  - All 6 weighted dims ≥ 50% of their weight; State coverage gate = PASS; QA_Owner signed.
  - **`02-course` PASS unlocked Wave 5.** Wave 5 (`05-vocabulary`) is now PASS.

### Wave 5: `05-vocabulary`

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D10 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-21 adopted) |
| D11 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-21 adopted) |
| D12 | `mock-state.png` | state | success state — đã thuộc 10 từ | **PASS** | QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-21 adopted) |

- Prompt source: `docs/design/fuxie-visual-mocktests/05-vocabulary/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/05-vocabulary/<output-file>`
- Status: PASS · 94/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · GPT image 2.0. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 1,568,079 bytes; mock-mobile.png = 390×844 / 424,595 bytes; mock-state.png = 1440×900 / 1,457,417 bytes. `mock-state.png` is the single success state after learning 10 words.

### Wave 6: `06-grammar`

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D13 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-21 adopted) |
| D14 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-21 adopted) |
| D15 | `mock-state.png` | state | error state — sai pattern thường gặp | **PASS** | QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-21 adopted) |

- Prompt source: `docs/design/fuxie-visual-mocktests/06-grammar/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/06-grammar/<output-file>`
- Status: PASS · 94/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · GPT image 2.0. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 2,044,971 bytes; mock-mobile.png = 390×844 / 418,887 bytes; mock-state.png = 1440×900 / 1,657,319 bytes. `mock-state.png` is the single error state for a common Akkusativ pattern mistake.

### Wave 7: `07-listening` — PASS · 95/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D16 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D17 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D18 | `mock-state.png` | state | loading state — đang tải audio | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/07-listening/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/07-listening/<output-file>`
- Status: PASS · 95/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline with user-approved override. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 1,436,272 bytes; mock-mobile.png = 390×844 / 466,955 bytes; mock-state.png = 1440×900 / 1,573,836 bytes. `mock-state.png` is the single loading state for audio loading; zero `mock-state-*.png` variants.

### Wave 8: `08-speaking` — PASS · 95/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D19 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D20 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D21 | `mock-state.png` | state | error state — pronunciation lệch, hiển thị target âm + retry | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/08-speaking/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/08-speaking/<output-file>`
- Status: PASS · 95/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 2,537,708 bytes; mock-mobile.png = 390×844 / 621,801 bytes; mock-state.png = 1440×900 / 2,515,092 bytes. `mock-state.png` is the single pronunciation-error state with target sound + retry path. Zero `mock-state-*.png` variants.

### Wave 9: `09-reading` — PASS · 92/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D22 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D23 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D24 | `mock-state.png` | state | success state — đạt comprehension threshold | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/09-reading/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/09-reading/<output-file>`
- Status: PASS · 92/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 2,530,424 bytes; mock-mobile.png = 390×844 / 621,659 bytes; mock-state.png = 1440×900 / 2,620,569 bytes. `mock-state.png` is the single comprehension-success state with threshold reached + continue path. Zero `mock-state-*.png` variants.

### Wave 10: `10-writing` — PASS · 93/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D25 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D26 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D27 | `mock-state.png` | state | error state — thiếu yêu cầu cấu trúc, feedback inline | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/10-writing/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/10-writing/<output-file>`
- Status: PASS · 93/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 2,609,720 bytes; mock-mobile.png = 390×844 / 571,775 bytes; mock-state.png = 1440×900 / 2,471,101 bytes. `mock-state.png` is the single writing-structure-error state with inline feedback. Zero `mock-state-*.png` variants.

### Wave 11: `04-review` — PASS · 95/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D28 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D29 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D30 | `mock-state.png` | state | empty state — không có item cần ôn | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/04-review/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/04-review/<output-file>`
- Status: PASS · 95/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 2,201,582 bytes; mock-mobile.png = 390×844 / 544,527 bytes; mock-state.png = 1440×900 / 1,860,658 bytes. `mock-state.png` is the single review empty state with no items due. Zero `mock-state-*.png` variants.

### Wave 12: `11-exam` — PASS · 95/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D31 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D32 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D33 | `mock-state.png` | state | error state — hết giờ trước khi nộp | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/11-exam/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/11-exam/<output-file>`
- Status: PASS · 95/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 1,722,362 bytes; mock-mobile.png = 390×844 / 449,424 bytes; mock-state.png = 1440×900 / 1,842,766 bytes. `mock-state.png` is the single timeout-before-submit state with submit/retry exits. Zero `mock-state-*.png` variants.

### Wave 13: `12-rewards` — PASS · 95/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D34 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D35 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D36 | `mock-state.png` | state | success state — vừa unlock badge mới với reveal animation cue | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/12-rewards/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/12-rewards/<output-file>`
- Status: PASS · 95/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 2,159,809 bytes; mock-mobile.png = 390×844 / 599,596 bytes; mock-state.png = 1440×900 / 2,372,530 bytes. `mock-state.png` is the single new-badge-unlocked success state with reveal animation cue. Zero `mock-state-*.png` variants.

### Wave 14: `13-missions` — PASS · 95/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D37 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D38 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D39 | `mock-state.png` | state | empty state — đã hoàn thành tất cả mission hôm nay | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/13-missions/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/13-missions/<output-file>`
- Status: PASS · 95/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 2,002,335 bytes; mock-mobile.png = 390×844 / 515,861 bytes; mock-state.png = 1440×900 / 2,139,916 bytes. `mock-state.png` is the single all-missions-complete empty state; zero `mock-state-*.png` variants.

### Wave 15: `14-chat` — PASS · 95/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D40 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D41 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D42 | `mock-state.png` | state | loading state — tutor đang trả lời (typing indicator) | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/14-chat/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/14-chat/<output-file>`
- Status: PASS · 95/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 2,010,940 bytes; mock-mobile.png = 390×844 / 472,788 bytes; mock-state.png = 1440×900 / 1,625,300 bytes. `mock-state.png` is the single tutor-typing loading state; zero `mock-state-*.png` variants.

### Wave 16: `15-profile` — PASS · 95/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D43 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D44 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D45 | `mock-state.png` | state | success state — vừa cập nhật mục tiêu cá nhân | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/15-profile/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/15-profile/<output-file>`
- Status: PASS · 95/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 1,963,104 bytes; mock-mobile.png = 390×844 / 451,225 bytes; mock-state.png = 1440×900 / 1,933,562 bytes. `mock-state.png` is the single personal-goal-updated success state; zero `mock-state-*.png` variants.

### Wave 17: `16-teacher` — PASS · 95/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D46 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D47 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D48 | `mock-state.png` | state | error state — assignment quá hạn submission, hiển thị danh sách overdue + nudge action | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/16-teacher/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/16-teacher/<output-file>`
- Status: PASS · 95/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 1,816,277 bytes; mock-mobile.png = 390×844 / 506,986 bytes; mock-state.png = 1440×900 / 2,037,752 bytes. `mock-state.png` is the single assignment-overdue error state with overdue learner list + nudge action; zero `mock-state-*.png` variants.

### Wave 18: `17-admin` — PASS · 95/100 (signed 2026-05-21)

| Job | Output file | Viewport | Selected state | Status | Reviewer |
| --- | --- | --- | --- | --- | --- |
| D49 | `mock-desktop.png` | 1440×900 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D50 | `mock-mobile.png` | 390×844 | — | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |
| D51 | `mock-state.png` | state | empty state — filter không trả kết quả, suggest reset | **PASS** | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) |

- Prompt source: `docs/design/fuxie-visual-mocktests/17-admin/generation-prompt.md`
- Output path: `docs/design/fuxie-visual-mocktests/17-admin/<output-file>`
- Status: PASS · 95/100 · Codex PASS adoption date: 2026-05-21
- Notes: PROVENANCE_PASS · built-in `image_gen` / GPT image pipeline. PNGs rendered and machine-verified: mock-desktop.png = 1440×900 / 1,610,342 bytes; mock-mobile.png = 390×844 / 448,799 bytes; mock-state.png = 1440×900 / 1,494,752 bytes. `mock-state.png` is the single no-results filtered-empty state with reset suggestion; zero `mock-state-*.png` variants.

## Summary

- 18 wave · 54 job tổng cộng (1 + 17 module × 3 mock).
- Wave 1 (`00-style-master`): **3/3 jobs PASS · score 92/100 · signed 2026-05-17**. Pack_Owner authorized adoption of Codex QC pass-candidate scores; QA_Owner sign-off delegated via Kiro.
- Wave 2 (`01-dashboard`): **3/3 jobs PASS · score 91/100 · signed 2026-05-17**. Pack_Owner authorized adoption of Codex QC pass-candidate scores; QA_Owner sign-off delegated via Kiro.
- Wave 3 (`03-session`): **3/3 jobs PASS · score 91/100 · signed 2026-05-20**. Pack_Owner authorized adoption of Codex QC pass-candidate scores; QA_Owner sign-off delegated via Antigravity.
- Wave 4 (`02-course`): **3/3 jobs PASS · score 95/100 · signed 2026-05-20**. Pack_Owner authorized adoption of Codex QC pass-candidate scores; QA_Owner sign-off delegated via Antigravity.
- Wave 5 (`05-vocabulary`): **3/3 jobs PASS · score 94/100 · signed 2026-05-21**.
- Wave 6 (`06-grammar`): **3/3 jobs PASS · score 94/100 · signed 2026-05-21**.
- Wave 7 (`07-listening`): **3/3 jobs PASS · score 95/100 · signed 2026-05-21**.
- Wave 8 (`08-speaking`): **3/3 jobs PASS · 95/100 · signed 2026-05-21 via Codex QC**.
- Wave 9 (`09-reading`): **3/3 jobs PASS · 92/100 · signed 2026-05-21 via Codex QC**.
- Wave 10 (`10-writing`): **3/3 jobs PASS · 93/100 · signed 2026-05-21 via Codex QC**.
- Wave 11 (`04-review`): **3/3 jobs PASS · 95/100 · signed 2026-05-21 via Codex QC**.
- Wave 12 (`11-exam`): **3/3 jobs PASS · 95/100 · signed 2026-05-21 via Codex QC**.
- Wave 13 (`12-rewards`): **3/3 jobs PASS · 95/100 · signed 2026-05-21 via Codex QC**.
- Wave 14 (`13-missions`): **3/3 jobs PASS · 95/100 · signed 2026-05-21 via Codex QC**.
- Wave 15 (`14-chat`): **3/3 jobs PASS · 95/100 · signed 2026-05-21 via Codex QC**.
- Wave 16 (`15-profile`): **3/3 jobs PASS · 95/100 · signed 2026-05-21**.
- Wave 17 (`16-teacher`): **3/3 jobs PASS · 95/100 · signed 2026-05-21**.
- Wave 18 (`17-admin`): **3/3 jobs PASS · 95/100 · signed 2026-05-21**.
- Pack_Owner cập nhật JSON tương ứng (`render-queue.json`) và bảng này khi mỗi job hoàn thành (status đổi từ `READY_FOR_CODEX_RENDER` → `RENDERED` → `ORIGINALITY_REVIEWED` → `SCORED` → `PASS` hoặc `BLOCKED`).
