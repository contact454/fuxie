# Biên bản nghiệm thu — Vertical Slice #1 "Từ vựng"

Date: 2026-07-01
Nghiệm thu theo `references/acceptance.md` (skill `fuxie-redesign`). Bằng chứng: screenshot thật trong `docs/design/visual-audit/qa-runs/2026-05-16/screenshots/`.

## Các màn đã verify bằng ảnh
- **M1 World Map** (full-bleed): `dashboard/dashboard-default-mobile.png` — ✅
- **M2 Lesson Intro**: `vocabulary-lesson-intro/...-mobile.png` — ✅
- **M3 Gameplay**: `vocabulary-gameplay/...-mobile.png` — ✅
- **M4 Reward Receipt**: `vocabulary-reward/...-mobile.png` — ✅
- **M5 Map mastered**: `dashboard/dashboard-mastered-mobile.png` (vương miện trên Marktplatz) — ✅

## Gate B — objective (khách quan)
- [x] World unity (Mykonos): 1 góc, 1 nguồn sáng, 1 bảng màu trên toàn bộ asset & màn.
- [x] Feedback loop (Duolingo): hành động→phản hồi tức thì (đúng/sai đổi pose Fuxie)→reward→map lớn lên.
- [x] Premium tối giản (Monument Valley): thoáng, không rối.
- [x] 100% asset qua STYLE LOCK; Fuxie đúng màu sky-blue (đã sửa lỗi cam).
- [x] Mobile: World Map full-bleed, touch target ≥44px, không "desktop nén".
- [x] Token contract: `pnpm check:quick` xanh (900+ test, 52 visual audit) — reward-amber containment + energy ≤5% + Primary_CTA discipline đều pass.
- [x] Core boundary: không đụng database/srs-engine/ai-service/content (đã kiểm qua git diff/mtime).

## Cohesion pass (sau TICKET-A5 + fix M3) — 2026-07-01
Bản đầu bị "chấp vá" do 3 register va nhau + mỗi màn một nền/header (xem `design-critique-slice-1.md`). Sau A5: 1 nền làng chung + panel kính mờ chung + header thống nhất; M3 đã ngồi trong thế giới (fix bug z-index backdrop). Đặt 5 màn cạnh nhau đọc ra "cùng một app" → **cohesion ĐẠT**.

## Gate A — đánh giá bằng design-critique (chủ dự án ủy quyền cho Claude)
- [x] 5 màn cùng một thế giới, hết cảm giác chắp vá — **đạt**.
- [x] Vòng M3→M4→M5 rõ; M5 mastered có vương miện — **đạt**.
- Polish còn mở (không chặn): icon TopBar chưa cùng vật liệu 2.5D (Codex ②); mascot hơi bóng; node 1 nên thành huy hiệu; M3 ẩn nav khi làm bài (đang sửa).

## Accessibility (sơ bộ)
Tương phản chữ chính đạt; touch target ≥44px đạt; cần chạy `design:accessibility-review` trên DOM thật để đo contrast chữ phụ + keyboard nav.

## Kết luận
Gate B: **ĐẠT**. Gate A (theo con mắt design-critique, được ủy quyền): **ĐẠT**. Slice #1 = **chuẩn vàng** để nhân rộng. Việc còn lại là polish (Codex icon/mastered-edit, ẩn nav M3, node badge) — làm song song, không chặn nhân rộng.
