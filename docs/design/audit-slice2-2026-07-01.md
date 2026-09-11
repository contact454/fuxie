# Audit slice #2 (Ôn tập/SRS) — 2026-07-01 (R1)

Theo `parity-audit-process.md`. Bằng chứng: review-default/empty/error + review-srs-front/back/complete.

## B-Hub — PASS
- ✅ Nền làng ambiance; ✅ "Giữ trí nhớ luôn nóng" + stats (5 đến hạn/0 quá hạn); ✅ CTA "Bắt đầu ôn tập" tactile; ✅ mascot; ✅ tiếng Việt; ✅ state empty/error có.

## B-Session — REJECT (3 MUST fail)
| Lá | Tiêu chí | KQ | Ghi chú |
|---|---|---|---|
| 5.4.1 | Immersive (ẩn chrome, phủ full-screen) | ❌ | Phiên ôn render **dưới hub**, thấy cả hai chồng nhau; phải là overlay `fixed inset-0 z-50` che hub như gameplay |
| 1.3.1 / 2.2.1 | Rating buttons tactile + màu khối | ❌/— | Hàng "Lại/Khó/Được/Dễ" **không hiển thị** ở mặt sau (do lỗi immersive đẩy dưới fold) — chưa verify được |
| 8.6.1 | Ngôn ngữ UI tiếng Việt | ❌ | Nút **"Anhören"** (Đức) → phải "Nghe"; rà nốt nhãn Đức còn sót |
| — | Flashcard front/back nội dung | ✅ | "der Apfel"/"quả táo" + ví dụ, card đặc chữ đậm — ổn |

## Verdict
**REJECT.** Hub đạt; Session phải: (a) render immersive full-screen che hub, (b) hiện rõ 4 rating buttons tactile màu khối ở mặt sau, (c) localize "Anhören"→"Nghe". Re-capture back state thấy rating + hub bị ẩn; xuất số đo rating-buttons (min-height + gờ px) + axe/contrast.

## R2 — sau fix: PASS
| Lá | KQ | Bằng chứng |
|---|---|---|
| 5.4.1 immersive | ✅ | Hub ẩn (display:none via .review-hero-wrapper); chỉ progress + X + thẻ |
| 1.3.1/2.2.1 rating tactile+màu | ✅ | 4 nút Lại/Khó/Được/Dễ, **76px + gờ 4px**, đỏ/cam/action/success, kèm interval SRS |
| 8.6.1 localize | ✅ | "Nghe" (nút loa) + nhãn rating tiếng Việt |
| 8.2 contrast / axe | ✅ | ≥4.5:1; axe 0 serious/critical |

**Verdict slice #2: PASS toàn bộ MUST {UI}** (Hub + Session). `check:quick` + typecheck xanh. → Slice #2 chốt.

## Gap {PROD}
Không mới; gamification sâu ở `product-gap-register.md`.
