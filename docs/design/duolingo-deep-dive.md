# Duolingo Deep Dive — hiểu tới gốc (để lập chuẩn nền tảng)

Date: 2026-07-01 · Nguồn: design.duolingo.com + phân tích UX/kỹ thuật uy tín (xem cuối). Mục tiêu: rút ra tiêu chí ĐO ĐƯỢC cho `duolingo-parity-rubric.md` (áp toàn nền tảng Fuxie).

## 1. Design system & visual language
- **Typography 2 lớp:** *Feather Bold* (custom, Fontsmith 2019) cho headline "hét lên"; *DIN Next Rounded* cho UI/body, **letter-spacing rộng ~0.053em** → thoáng, dễ đọc. Chữ **rounded + đậm** là chữ ký nhận diện.
  → Fuxie: Nunito **800** cho display/nút, **600–700** body, thêm letter-spacing nhẹ.
- **Nút "tactile" 3D:** chi tiết chữ ký — nền đặc + **"gờ dưới" đặc màu đậm hơn** (vd `box-shadow: 0 4px 0 #3f8f01` dưới nút xanh), tạo cảm giác bấm được, tương phản hẳn UI phẳng còn lại. Bấm = lún.
- **Màu:** một **primary bão hoà duy nhất cho MỌI hành động chính** (Duo Green `#58cc02`), + sky blue `#1cb0f6`, yellow `#ffc700`, tím `#a570ff`, hồng `#cc348d`. Bảng màu kỷ luật, primary = "chữ ký hành động".
  → Fuxie đã có kỷ luật này (action `#54A8E4`); giữ **một** primary cho mọi CTA.

## 2. UX lesson flow
- **Play-first, profile-second:** người dùng học xong bài đầu + nhận XP **trong <15 phút TRƯỚC khi tạo tài khoản** → tăng chuyển đổi.
- **Onboarding phân tán:** dạy bằng tooltip/modal ngữ cảnh + empty-state, KHÔNG tutorial nhồi đầu.
- **Vòng feedback tức thì + cảm xúc:** chọn đáp án → nút **Check**; đúng = banner xanh + "ding"/confetti; sai = banner đỏ + **hiện đáp án đúng**; dùng **bottom-sheet** + CTA **Continue** to. "Mỗi tương tác đều có phản hồi tức thì và tưởng thưởng cảm xúc."
- **Cấu trúc phiên:** path dạng danh sách node cuộn dọc → chọn node → chuỗi bài quiz ngắn → tổng kết.

## 3. Gamification (tầng nền tảng, không chỉ 1 màn)
- **XP** thưởng biến thiên (variable reward) cho mọi hoạt động.
- **Streak** + **Streak Freeze** (200 gems) — đòn bẩy **loss aversion** trung tâm; nhắc nhở khẩn cấp + mascot buồn.
- **Daily goal** tuỳ chỉnh; **Daily Quests** (+25% DAU khi ra mắt).
- **Leagues** tuần (thăng/giáng hạng) — cạnh tranh.
- **Hearts** (sai mất tim; refill 650 gems); **Gems** + **shop** định giá tạo đánh đổi thật.
- **Badges** (Personal Records + Awards); **friend streak/challenge**.
- **Tâm lý theo chặng:** người mới có thành tựu day-1 + daily goal; ~7 ngày có streak đáng giữ; chạm league đầu; lâu dài có badge hiếm + friend streak.

## 4. Motion & mascot
- **State machine** (Rive) cho mascot: **5–10 trạng thái cảm xúc**, chuyển mượt (vẫy, nhảy, thở dài); micro-interaction ở mọi tap; **khoảnh khắc ăn mừng**.
- Mascot dùng **"baby schema"** (mắt to, bo tròn) → gắn kết cảm xúc; xuất hiện ở notification/achievement/error.

## 5. Accessibility (điểm Duolingo BỊ chê → Fuxie vượt)
- Chuẩn ngành: **touch ≥48dp**, **contrast ≥4.5:1** (chữ) / **≥3:1** (phi văn bản).
- Duolingo bị chê: chữ nhỏ, contrast thấp chỗ nọ chỗ kia, phần tử thiếu nhãn cho VoiceOver, **reduced-motion không bật mặc định**.
  → **Cơ hội cho Fuxie vượt sàn:** gán nhãn mọi control, **tôn trọng reduced-motion theo OS mặc định**, đảm bảo contrast + touch mọi nơi.

## Tiêu chí đo được rút ra (đưa vào rubric)
- Nút chính: nền đặc primary + **gờ dưới ≥3px**, cao **≥48px**, lún khi bấm.
- Chữ trọng tâm ≥22px/≥700; body rounded; primary một màu cho mọi CTA.
- Vòng feedback: Check → đúng(xanh)/sai(đỏ, hiện đáp án) + **Continue** + âm/haptic.
- Gamification tối thiểu hiện diện: XP, streak(+freeze), daily goal, league, hearts/gems, quest, badge — nhất quán toàn app.
- Mascot: ≥5 trạng thái cảm xúc, micro-interaction mọi tap, celebration; reduced-motion honor OS.
- A11y: touch ≥48px (Fuxie dùng ≥44px tối thiểu, khuyến ≥48px), contrast ≥4.5:1, label đầy đủ.

## Nguồn
- Duolingo Brand Guidelines / Typography — design.duolingo.com
- "How Duolingo Animates Its World Characters" — blog.duolingo.com; LottieFiles/Rive case studies
- Trophy.so, Ludaxis, StriveCloud — gamification case studies
- 925studios, UsabilityGeek, Growth.design — UX breakdowns
- Material Design a11y; phân tích a11y Duolingo (Medium/Dribbble)
