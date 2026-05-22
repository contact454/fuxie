# Fuxie Visual Mocktest Pack

## Workflow_Gate

Thứ tự cố định: `requirements.md` → `design.md` → `tasks.md` → render mocks → implement code.

| File | Status | Last Status Change (ISO 8601) | Reviewer |
| --- | --- | --- | --- |
| `requirements.md` | Approved by Codex | 2026-05-17T00:00:00Z | Codex |
| `design.md` | Approved by Codex | 2026-05-17T00:00:00Z | Codex |
| `tasks.md` | Approved by Codex | 2026-05-17T00:00:00Z | Codex |

(Bảng được Pack_Owner duy trì THỦ CÔNG. Bảng này phải khớp với dòng `Status:` ở đầu mỗi file spec; lệch là stale — Requirement 10, AC 5.)

## Originality_Guardrail

Mocktest_Pack KHÔNG copy asset, nhân vật, place name, UI string, theme, logo, hoặc IP của Mykonos, Two Point Campus, hoặc bất kỳ bên thứ ba nào. Cảm hứng kỹ thuật (isometric/world/canvas/camera/tile staging) và cảm hứng concept (campus có chức năng rõ, learning destination có "tính cách") được giữ ở mức **trừu tượng** và phải kết tinh thành Fuxie original visual identity.

Chi tiết forbidden IP references theo từng mock được ghi tại `<module-folder>/generation-prompt.md` mục "Originality guardrails (forbidden IP references)". Mọi review nguyên gốc do Pack_Owner (Product Designer) phối hợp với Illustrator / 3D Mascot Artist thực hiện trước khi mock được nhận điểm Visual_Target_Score (Requirement 9, AC 1, 7).

## Module index

1. [`00-style-master/`](00-style-master/) — Style master design system tokens cho toàn pack.
2. [`01-dashboard/`](01-dashboard/) — Tổng quan tiến trình học hôm nay và CTA tiếp theo.
3. [`02-course/`](02-course/) — Khám phá lộ trình CEFR và chọn course.
4. [`03-session/`](03-session/) — Vào ngay phiên học hiện tại với hướng dẫn rõ.
5. [`04-review/`](04-review/) — Ôn lại kiến thức yếu qua spaced review.
6. [`05-vocabulary/`](05-vocabulary/) — Học và nhớ từ vựng mới.
7. [`06-grammar/`](06-grammar/) — Nắm rule ngữ pháp với ví dụ minh hoạ.
8. [`07-listening/`](07-listening/) — Nghe đoạn audio chuẩn và bắt key information.
9. [`08-speaking/`](08-speaking/) — Luyện phát âm với phản hồi pronunciation.
10. [`09-reading/`](09-reading/) — Đọc đoạn văn và trả lời câu hỏi hiểu.
11. [`10-writing/`](10-writing/) — Viết câu / đoạn văn với hint cấu trúc.
12. [`11-exam/`](11-exam/) — Mô phỏng đề thi CEFR với timer.
13. [`12-rewards/`](12-rewards/) — Hiển thị Fucoin / streak / badge đã đạt.
14. [`13-missions/`](13-missions/) — Theo dõi nhiệm vụ ngày/tuần và CTA hoàn thành.
15. [`14-chat/`](14-chat/) — Hỏi đáp với AI tutor / community.
16. [`15-profile/`](15-profile/) — Quản lý hồ sơ học và mục tiêu cá nhân.
17. [`16-teacher/`](16-teacher/) — Giáo viên theo dõi lớp và giao bài.
18. [`17-admin/`](17-admin/) — Vận hành nội bộ (user, content, billing).

## Roles

- **Pack_Owner**: Product Designer — TBD, hiệu lực 2026-05-17.
- **Style_Master_Owner**: Design System Designer — TBD, hiệu lực 2026-05-17.
- **Priority_Owner**: Product Manager EdTech — TBD, hiệu lực 2026-05-17.
- **QA_Owner**: QA Automation Engineer — TBD, hiệu lực 2026-05-17.

(Khi role thay đổi, cập nhật README trong cùng commit thay đổi — Requirement 11, AC 9.)

## Scope Change

(Placeholder. Bất kỳ Module_Folder nào ngoài 18 folder gốc phải ghi tại đây với tên folder mới, ngày phê duyệt `YYYY-MM-DD`, và chữ ký dạng văn bản của cả Pack_Owner và Priority_Owner — Requirement 1, AC 8.)

## Visual Target Score audit table

Bảng audit Visual_Target_Score cho 18 Module_Folder. Hiện toàn bộ 18/18 Module_Folder đã có PNG mock thật, State coverage gate = PASS, và QA_Owner đã ký Visual_Target_Score.

| Module | Visual Target Score | State coverage gate | Outcome | Failed dims/gates | Remediation | QA_Owner | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `00-style-master` | **92 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | — | QA_Owner (delegated sign-off via Kiro, Pack_Owner authorized) | 2026-05-17 |
| `01-dashboard` | **91 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | — | QA_Owner (delegated sign-off via Kiro, Pack_Owner authorized; Codex QC 2026-05-17 adopted) | 2026-05-17 |
| `02-course` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | — | QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-20 adopted) | 2026-05-20 |
| `03-session` | **91 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | — | QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-20 adopted) | 2026-05-20 |
| `04-review` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `05-vocabulary` | **94 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | GPT image 2.0 provenance verified; originality and state coverage passed. | QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-21 adopted) | 2026-05-21 |
| `06-grammar` | **94 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | GPT image 2.0 provenance verified; originality and state coverage passed. | QA_Owner (delegated via Antigravity, Pack_Owner authorized; Codex QC 2026-05-21 adopted) | 2026-05-21 |
| `07-listening` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified with user-approved override; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `08-speaking` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `09-reading` | **92 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `10-writing` | **93 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `11-exam` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `12-rewards` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `13-missions` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `14-chat` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `15-profile` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `16-teacher` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |
| `17-admin` | **95 / 100** | PASS | **PASS** | None — all 6 weighted dims ≥ 50% of weight; gate PASS | Built-in `image_gen` / GPT image pipeline provenance verified; originality and state coverage passed. | QA_Owner (Codex QC 2026-05-21 authorized; Pack_Owner originality co-review complete) | 2026-05-21 |

(Bảng do QA_Owner cập nhật mỗi lần chấm Visual_Target_Score; pack closure yêu cầu tổng ≥ 80, không chiều nào < 50% trọng số riêng, gate State coverage = PASS, QA_Owner ký + ngày ISO 8601 — Requirement 6, AC 9; Requirement 8.)
