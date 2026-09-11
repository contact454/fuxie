# Fuxie — Duolingo-Parity Rubric (sàn chất lượng tối thiểu, TOÀN NỀN TẢNG)

Date: 2026-07-01 (v2, platform-wide) · Chuẩn nghiệm thu bắt buộc cho **MỌI màn learner-facing của toàn app** (không chỉ slice từ vựng): dashboard/world, mọi kỹ năng (nghe/nói/đọc/viết/từ vựng), review/SRS, exam, profile, leaderboard, shop, onboarding, empty/error/loading.
Cơ sở: `duolingo-deep-dive.md` (nghiên cứu). Chi tiết đối chiếu từng lá: `duolingo-criteria-tree.md` (cây tiêu chí phân cấp, có target đo được + tham chiếu Duolingo + scope UI/PROD). Rubric này là bản tóm tắt của cây; khi chấm kỹ, dùng cây.
Nguyên tắc: **mọi tiêu chí MUST phải đạt thì màn mới "bằng Duolingo"**. Chưa đủ MUST = chưa được merge/nhân rộng. NICE = phần Fuxie vượt Duolingo (thế giới/làng), cộng điểm chứ không thay MUST.

Cách chấm: mỗi màn điền scorecard cuối file. MUST fail dù chỉ 1 mục ⇒ **REJECT**.

---

## A. Nút & control tactile (MUST)
- [ ] Nút chính/đáp án cao **≥ 56px**; vùng chạm **≥ 44px**.
- [ ] Nút có **chiều sâu**: fill đặc + "gờ dưới" ≥ 3px (hoặc tương đương), **không phải** pill viền 1px phẳng.
- [ ] **Press state** thấy rõ (lún + gờ co) trong ~120ms.
- [ ] Bo góc & màu lấy từ token (`--fuxie-radius-*`, `--fuxie-*`), không hardcode.

## B. Typography (MUST)
- [ ] Từ/câu hỏi trọng tâm **≥ 22px**, **đậm (≥700)**, rounded.
- [ ] Nhãn nút **≥ 15px**, đậm (≥600).
- [ ] Dùng một type-scale từ token; không cỡ chữ tùy tiện.

## C. Tương phản & content-first (MUST)
- [ ] Chữ thường/nhãn tương phản **≥ 4.5:1**; chữ lớn **≥ 3:1** (WCAG AA).
- [ ] Vùng làm bài trên **nền sạch**; **không** để art rối/mờ ngay sau chữ trọng tâm (nội dung là vua).

## D. Trạng thái đáp án & vòng phản hồi (MUST)
- [ ] Bốn trạng thái phân biệt bằng **màu khối** (không chỉ viền): default / selected / correct / wrong.
- [ ] **Khoảnh khắc phản hồi**: footer/banner màu (đúng=xanh, sai=đỏ) + CTA **"Tiếp tục"** rõ.
- [ ] Sai thì **hiện đáp án đúng**; không trừng phạt gắt.

## E. Motion & tactility (MUST; tôn trọng reduced-motion)
- [ ] Mọi phần tử bấm có **micro-interaction** khi chạm.
- [ ] Có **khoảnh khắc ăn mừng** ở reward/level-up.
- [ ] Tôn trọng `prefers-reduced-motion` (tắt rung/animation khi bật).

## F. Layout & nhịp (MUST)
- [ ] Spacing theo scale 4pt; nhịp khối **≥ 16px**.
- [ ] **Mobile-first**, không layout "desktop nén".

## G. Nhất quán cross-screen (MUST)
- [ ] Cùng hệ header/nav/surface/token trên mọi màn.
- [ ] Mascot nhất quán scale/độ khối; không lạc register.

## H. Accessibility WCAG AA (MUST)
- [ ] Tap ≥ 44px; **focus ring** thấy rõ; reachable bằng keyboard.
- [ ] Icon-only có `aria-label`; ảnh có alt; đối chiếu bằng `design:accessibility-review` trên DOM thật.

## J. Gamification toàn nền tảng (MUST ở tầng hệ thống)
- [ ] **XP** cho mọi hoạt động; hiển thị nhất quán ở header mọi màn.
- [ ] **Streak** + **Streak Freeze** (loss aversion); nhắc nhở + mascot phản ứng khi sắp mất.
- [ ] **Daily goal** tuỳ chỉnh + tiến độ ngày rõ.
- [ ] **League/leaderboard** tuần (thăng/giáng) HOẶC lộ trình tương đương.
- [ ] **Hearts/mistakes** + **Gems** + **shop** có đánh đổi thật.
- [ ] **Daily quest** và **badge** (personal records + awards).
- [ ] Cơ chế phân tầng theo chặng người dùng (day-1 / ~day-7 / dài hạn).

## K. First-run & onboarding (MUST)
- [ ] **Play-first**: học được bài đầu + nhận XP trước khi buộc tạo tài khoản.
- [ ] Onboarding **phân tán** (tooltip/modal ngữ cảnh, empty-state) — không tutorial nhồi đầu.
- [ ] Có phân loại trình độ đầu vào (segmentation).

## L. Motion & mascot (MUST; honor reduced-motion)
- [ ] Mascot Fuxie có **≥5 trạng thái cảm xúc** (idle/đúng/sai/level-up/nhắc…), chuyển mượt.
- [ ] **Micro-interaction ở mọi tap**; **khoảnh khắc ăn mừng** ở reward/level-up.
- [ ] **Tôn trọng `prefers-reduced-motion` theo OS, MẶC ĐỊNH** (vượt Duolingo — vốn không bật sẵn).

## I. Delight / Thế giới (NICE — điểm vượt Duolingo)
- [ ] World-first map; làng/ambiance ở màn ngoài-bài.
- [ ] Art 2.5D cohesive; "thế giới lớn lên" sau khi học.
- [ ] Vật phẩm/mascot có cá tính, cùng ngôn ngữ thị giác.

---

## Scorecard toàn nền tảng (điền mỗi màn)
A–H chấm mỗi màn; J/K/L chấm ở tầng hệ thống (một lần cho cả app).
| Màn/Surface | A | B | C | D | E | F | G | H | MUST pass? | NICE |
|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard/World map | | | | | | | | | | |
| Lesson intro | | | | | | | | | | |
| Gameplay (mọi dạng bài) | | | | | | | | | | |
| Reward/result | | | | | | | | | | |
| Review / SRS | | | | | | | | | | |
| Listening | | | | | | | | | | |
| Speaking | | | | | | | | | | |
| Reading | | | | | | | | | | |
| Writing | | | | | | | | | | |
| Exam | | | | | | | | | | |
| Profile / Leaderboard | | | | | | | | | | |
| Shop | | | | | | | | | | |
| Onboarding / first-run | | | | | | | | | | |
| Empty / Error / Loading | | | | | | | | | | |

Tầng hệ thống (chấm 1 lần): **J** Gamification ☐ · **K** Onboarding ☐ · **L** Motion/mascot ☐

Ghi chú cách đo nhanh:
- **Tương phản**: dùng `design:accessibility-review` hoặc devtools; ghi tỉ lệ.
- **Chiều cao/nút/tap**: đo px trên DOM.
- **Trạng thái/feedback/motion**: chụp state đúng + sai để chứng minh.
- Bằng chứng = screenshot state tương ứng, đính kèm khi handoff về Claude verify.
