# Audit slice #1 (Gameplay) — 2026-07-01

Theo `parity-audit-process.md`, chấm lá {UI} của `duolingo-criteria-tree.md`. Bằng chứng: screenshots vocabulary-gameplay state default/selected/correct/wrong + reward.

## Kết quả (màn Gameplay M3)
| Lá | Tiêu chí | KQ | Bằng chứng/ghi chú |
|---|---|---|---|
| 1.1.1/1.1.4 | Chữ display đậm ≥22px | ✅ | "der Apfel" đậm, to |
| 1.2.1 | Một primary cho CTA | ✅ | "Kiểm tra" xanh action |
| 1.2.2 | Semantic đúng/sai | ✅ | correct xanh lá, wrong đỏ |
| 1.3.1 | Gờ dưới ≥3–4px thấy rõ | ✅ (fix R2) | box-shadow gờ **4px**, co 2px khi bấm; hết glitch (viền đồng nhất 2px) |
| 1.3.2 | Nút ≥48px | ✅ | Computed **56px** |
| 1.3.5 | Disabled Check rõ | ✅ | "Kiểm tra" mờ khi chưa chọn |
| 1.4.1/1.4.2 | Nền sạch + card đặc | ✅ | Nền trắng, card nổi |
| 2.1.1 | Chọn→Kiểm tra→feedback→Tiếp tục | ✅ | Đủ luồng |
| 2.2.1 | 4 trạng thái màu khối | ✅ (fix R2) | selected lam nổi + correct/wrong |
| 2.3.1/2.3.2/2.3.3 | Footer đúng/sai + hiện đáp án + Tiếp tục | ✅ | "Tuyệt vời!"/"Chưa chính xác! Đáp án đúng: quả táo" |
| 3.1.1/3.1.2 | Mascot đổi pose theo kết quả | ✅ | idle/cheer/oops |
| 5.4.1 | Immersive (ẩn chrome) | ✅ | chỉ X + progress |
| 8.6.1 | Ngôn ngữ UI tiếng Việt | ✅ | "Nghĩa của…", "Kiểm tra", "Tiếp tục" |
| 8.1 | Touch ≥44px | ✅ | **358×56px** |
| 8.2 | Contrast ≥4.5:1 | ✅ | prompt **19.3:1** |
| 8.3/8.4 | Focus/label/axe | ✅ | **0 lỗi serious/critical (axe)** |

## Verdict (R2 — sau fix)
**Màn Gameplay: PASS toàn bộ MUST {UI} đo được** (số đo: nút 56px, gờ 4px, contrast 19.3:1, axe 0, touch 358×56). Còn lại để chốt slice: **chấm M1/M2/M4/M5** với ảnh mới (chúng dùng chung PrimaryCta đã tactile nên CTA "Bắt đầu"/"Về làng" hưởng lại — cần capture để xác nhận + điền scorecard).

## R3 — Chấm nốt M1/M2/M4/M5 (ảnh mới + số đo)
| Màn | Kết quả | Bằng chứng |
|---|---|---|
| M1 World Map | ✅ | full-bleed, 6 node neo công trình (≥44px), TopBar icon 2.5D, tiếng Việt |
| M2 Lesson Intro | ✅ | cảnh trên nền làng, CTA "Bắt đầu" **56px + gờ 4px** (#2c8dc9), lún khi bấm |
| M4 Reward | ✅ | reward trong làng, chip XP/streak/từ, CTA "Về làng" **56px + gờ 4px** |
| M5 Map mastered | ✅ | Marktplatz mastered (vương miện) — đúng kỷ luật 1 primary |

## Verdict slice #1 (toàn bộ)
**PASS toàn bộ MUST {UI}** cho M1–M5 (số đo: nút 56px, gờ 4px co-2px, contrast 19.3:1, axe 0, touch ≥44–56px, UI tiếng Việt). `check:quick` + `typecheck` xanh. → **Slice #1 = CHUẨN VÀNG**, đủ điều kiện nhân rộng.

## Gap {PROD} liên quan
Không phát sinh mới; xem `product-gap-register.md` (gamification 4.*).

## Bước sau
Fix ticket 1.3 (dưới) → Antigravity re-capture + xuất số đo → re-audit. Khi gameplay PASS toàn MUST, chấm nốt M1/M2/M4/M5 rồi chốt slice.
