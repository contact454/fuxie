# Fuxie Visual Audit & Gamefication Mockup Plan

Ngay thuc hien: 2026-04-28  
Huong thiet ke: game hoa manh, uu tien hoc vien A1-B1 tren mobile  
Pham vi: audit + mockup prompt + backlog, chua code UI

## 1. Tom Tat Dieu Hanh

Fuxie da co nen tang nhan dien tot: mascot dang nho, mau brand ro, he CEFR/skill color da co token, va cac module hoc da co cau truc kha mach lac. Van de hien tai khong nam o viec "xau", ma o viec trai nghiem thi giac chua tao du cam giac tien bo, nhiem vu va phan thuong. Neu di theo huong game hoa manh, Fuxie can chuyen tu "dashboard hoc tap dang card" sang "mission hub" co trang thai song: hom nay lam gi, dang mo khoa gi, gan nhan duoc gi, va Fuxie dang huong dan o dau.

Nhan dinh chinh:

- Mascot dang duoc dung nhieu, nhung vai tro chua nhat quan: luc la logo, luc la icon module, luc la hinh trang tri; thieu logic "coach / guide / reward / warning".
- Mau sac dang trai rong theo module, nhung y nghia chua duoc ma hoa ro: xanh co khi la CEFR A1, co khi la skill, co khi la progress.
- Dashboard co nhieu card thong tin, nhung chua co "game loop" manh: mission -> action -> reward -> next unlock.
- Vocabulary la man co asset tot nhat, nhung dang la grid/card hoc tap hon la ban do chu de co cam giac kham pha.
- Reading/Listening/Writing co cau truc ro nhung qua giong nhau; thieu tinh cach rieng cua tung skill va thieu feedback dong luc truoc khi vao bai.
- Course timeline co tien trinh tot nhung chua "adventure path"; cac module nhin nhu danh sach card mau lon.
- Exam va Review con qua trong, chua truyen duoc cam giac "thu thach lon" va "daily retention ritual".

Screenshot tham chieu da luu:

- `docs/design/visual-audit/screenshots/dashboard.png`
- `docs/design/visual-audit/screenshots/course.png`
- `docs/design/visual-audit/screenshots/vocabulary.png`
- `docs/design/visual-audit/screenshots/reading.png`
- `docs/design/visual-audit/screenshots/listening.png`
- `docs/design/visual-audit/screenshots/writing.png`
- `docs/design/visual-audit/screenshots/exam.png`
- `docs/design/visual-audit/screenshots/review.png`

Mockup board concept da luu:

- `docs/design/visual-audit/fuxie-gamefication-mockup-board.png`
- `docs/design/visual-audit/fuxie-gamefication-mockup-board.svg`

Mockup board v2 benchmark-informed:

- `docs/design/visual-audit/fuxie-gamefication-mockup-board-v2.png`
- `docs/design/visual-audit/fuxie-gamefication-mockup-board-v2.svg`

## 1.1 Benchmark Top-Tier Sau Feedback V1

Sau khi review v1, van de khong phai thieu element game hoa, ma thieu cam giac "san pham song": mau chua co do sau, world/path chua du cuon, reward chua tao ham muon bam tiep, va mascot chua lam coach co tinh cach. Benchmark cac nen tang top-tier cho thay Fuxie nen hoc co che thi giac, khong copy surface style.

Nguon tham chieu:

- Duolingo: learning path/home screen redesign va art/shape language - `https://blog.duolingo.com/new-duolingo-home-screen-design/`, `https://blog.duolingo.com/shape-language-duolingos-art-style/`
- Brilliant: interactive learning, premium contrast, learn-by-doing surface - `https://brilliant.org/`
- Khan Academy Kids: character-led learning world, games/books/activities - `https://www.khanacademy.org/kids`
- Lingokids: Playlearning, nhieu hoat dong ngan, nhan vat va reward cho tre em - `https://lingokids.com/`
- Memrise: video/real-world immersion cho ngon ngu - `https://www.memrise.com/`
- Busuu: study plan, progress, review, adult language-learning credibility - `https://www.busuu.com/`
- Quizlet: flashcard/learn/test clarity, utility-first task surface - `https://quizlet.com/features/study-modes`, `https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn-mode`

| Nen tang | Dieu ho lam rat tot | Fuxie nen ap dung | Fuxie nen tranh |
|---|---|---|---|
| Duolingo | Path-based progression, streak/XP ro, mascot tao cam xuc, task rat ngan. | Course/Vocabulary thanh path co node, unlock, reward preview; Fuxie lam coach daily mission. | Bien UI thanh qua tre con hoac qua nhieu icon lap lai. |
| Brilliant | Man hoc tap tap trung, visual tuong tac cao, mau toi/sang co chu dich, it clutter. | Skill Player can co vung hoc sach, feedback/reward o layer rieng, khong che noi dung. | Game hoa bang confetti/gradient ngay trong luc hoc lam mat tap trung. |
| Khan Academy Kids / Lingokids | World/character lam dong luc, scene vui, trang thai hoc duoc nhan cach hoa. | Vocabulary/Course co "quest world" rieng; mascot dung cho guide/reward/locked state. | Infantilize Fuxie; hoc vien Goethe/telc can cam giac tin cay hon app tre em. |
| Memrise | Ngon ngu gan voi doi that, ngu canh va cam xuc, khong chi card. | Vocabulary nen co context visual va scenario, khong chi word list. | The gioi fantasy qua xa muc tieu giao tiep that. |
| Busuu | Tone nguoi lon, plan/progress ro, cam giac co lo trinh thi cu. | Giu layer "exam-ready" tren Course/Exam de Fuxie van nghiem tuc. | Qua utilitarian lam mat dong luc moi ngay. |
| Quizlet | Task mode ro, flashcard/learn/test de hieu ngay, cognitive load thap. | Moi module chi co 1 CTA chinh; mode hoc phai nhan ra trong 3 giay. | Dung qua nhieu visual layer khien task chinh bi chim. |

Ket luan benchmark:

- V2 can co "adventure depth": map/path/mission phai nhin nhu co hanh trinh, khong chi card.
- Mau brand can duoc mo rong thanh palette song: orange action, blue trust, teal progress, green level, yellow reward, purple/pink dung rat tiet che cho delight.
- Game layer nen hien reward truoc hanh dong: XP, streak-safe, unlock, badge, boss exam.
- Mascot phai co role-based placement: daily coach, reward host, lock explainer, hint helper.
- UI hoc that van phai la trung tam: noi dung bai hoc doc/lam bai khong bi mascot, confetti, map che mat.

## 2. Visual Scorecard

Thang diem: 1 = yeu, 3 = chap nhan, 5 = rat tot.

| Man | Fuxie identity | Hierarchy | Motivation | CTA clarity | Cognitive load | Consistency | Mobile ergonomics | Accessibility | Diem TB |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Dashboard | 3 | 3 | 2 | 3 | 2 | 3 | 3 | 3 | 2.75 |
| Course | 3 | 4 | 3 | 4 | 3 | 3 | 3 | 3 | 3.25 |
| Vocabulary | 4 | 4 | 3 | 4 | 3 | 4 | 3 | 3 | 3.50 |
| Reading | 3 | 4 | 2 | 4 | 4 | 3 | 4 | 3 | 3.38 |
| Listening | 3 | 4 | 2 | 4 | 4 | 3 | 4 | 3 | 3.38 |
| Writing | 3 | 4 | 2 | 4 | 3 | 3 | 3 | 3 | 3.13 |
| Exam | 3 | 3 | 1 | 2 | 4 | 2 | 4 | 3 | 2.75 |
| Review | 4 | 3 | 2 | 3 | 3 | 3 | 3 | 3 | 3.00 |

Ket luan diem:

- Man tot nhat hien tai: Vocabulary, vi co hinh chu de, CTA ro va thong tin vua du.
- Man co tac dong dong luc yeu nhat: Exam, vi empty state qua rong va khong bien "chua co de" thanh loi huong dan tiep theo.
- Man quan trong can nang cap dau tien: Dashboard, vi la cua vao moi ngay nhung chua tao cam giac "hom nay co mot hanh trinh can hoan thanh".

## 3. Cac Khuyet Diem Thi Giac Chinh

### 3.1 Identity cua Fuxie chua co vai tro ro

Hien trang:

- Sidebar dung mascot lam icon cho moi nav item, lam giam gia tri phan biet skill.
- Dashboard co mascot nho o nhieu diem, nhung khong co mot Fuxie coach noi ro "viec tiep theo".
- Exam va empty states dung mascot trang tri, chua co hanh dong tiep theo.

De xuat:

- Dinh nghia 4 vai tro mascot:
  - Coach: chi dan nhiem vu tiep theo.
  - Companion: dong vien trong dashboard/session.
  - Reward: xuat hien khi streak, level, achievement.
  - Alert: khi bai bi khoa, sap het streak, can on SRS.
- Sidebar nen giam mascot lap lai; skill icon nen uu tien bieu tuong/hinh skill nhat quan, mascot chi xuat hien o logo va card goal.

### 3.2 Mau sac dang dep nhung chua thanh ngon ngu

Hien trang:

- Brand co `#FF6B35`, `#004E89`, `#2EC4B6`.
- CEFR co mau rieng, skill co mau rieng, nhung tren UI mau xanh/cam/xanh la co nhieu nghia khac nhau.
- Course dung gradient lon moi module, tao vui nhung de thanh "rainbow list".

De xuat:

- Chot color grammar:
  - Orange `#FF6B35`: primary action, mission active, next step.
  - Blue `#004E89`: trust, exam, structure, navigation focus.
  - Teal `#2EC4B6`: audio/listening, daily rhythm, light success.
  - CEFR colors: chi dung cho level badge/path, khong dung lam CTA chinh.
  - Skill colors: dung cho icon/status cua skill, khong thay the primary action.
- Giam gradient decorative; chi dung gradient cho reward, level-up, mission banner.

### 3.3 Game loop chua du manh

Hien trang:

- Dashboard co streak, XP, goal, SRS, plan, progress, weekly activity, quick start; nhung tat ca dang ngang hang thi giac.
- Hoc vien moi vao se thay nhieu so 0 va it cam giac "toi nen lam ngay gi".

De xuat:

- Dashboard v2 nen co 3 tang:
  - Top: Hero mission "Nhiem vu hom nay: hoan thanh 15 phut de giu streak".
  - Middle: 3 quest cards: Vocabulary, Listening, Reading/Writing, moi card co reward va unlock.
  - Bottom: progress map + achievements.
- Khi nhieu so 0, bien thanh "fresh start state" vui hon: "Ngay 1: mo khoa buoc dau tien".

### 3.4 Module list ro nhung thieu cam giac kham pha

Hien trang:

- Reading/Listening/Writing rat ro, nhung gan nhu cung mot skeleton thiet ke.
- Trang khoa hoc co timeline tot nhung card qua lon, nhieu mau manh, thieu "map".

De xuat:

- Skill list nen co identity rieng:
  - Reading: parchment/story path, reading stamina.
  - Listening: waveform/audio challenge path.
  - Writing: form/paper desk, draft progress.
- Course nen thanh "learning path map": node module, bridge/lock, reward chest, boss exam node.

### 3.5 Empty state va locked state chua tao dong luc

Hien trang:

- Exam empty state noi "chua co de thi nao", nhung khong goi y de lam gi tiep.
- Locked items trong writing/reading/listening bi lam mo nhieu, co the tao cam giac bi chan.

De xuat:

- Empty state phai co next action:
  - "Chua co de thi A1. Hay hoan thanh 3 module dau de mo mock exam."
  - CTA: "Quay lai lo trinh A1" / "Luyen nghe truoc".
- Locked state nen noi ro dieu kien mo khoa va reward:
  - "Hoan thanh Deutschkurs de mo Bibliothek +20 XP".

## 4. Huong Game Hoa De Xuat

### 4.1 Visual system

- Layout language: mission hub, adventure path, quest cards, reward feedback.
- Shape language: card radius nen chuan hoa 12-16px; node/path co hinh tron hoac hex nho; CTA chinh dang pill manh.
- Motion language: nhe, nhanh, co y nghia; dung cho reward, progress fill, unlock, not for decorative loops.
- Mascot placement:
  - Header/coach bubble tren dashboard.
  - Corner helper tren module detail.
  - Reward modal sau khi hoan thanh.
  - Empty state co loi huong dan.

### 4.2 Core game loop

1. Mission: hoc vien thay 1 viec quan trong nhat.
2. Action: CTA ro, co reward hien truoc.
3. Feedback: dung/sai, XP, streak, star, progress.
4. Unlock: mo bai/module tiep theo.
5. Return: dashboard cap nhat mission moi.

### 4.3 He thong component can chuan hoa sau mockup

- `MissionHero`
- `QuestCard`
- `SkillPathNode`
- `RewardBadge`
- `FuxieCoachBubble`
- `UnlockRequirement`
- `ProgressRing`
- `WorldMapThemeCard`
- `ExamBossCard`

## 5. Prompt Mockup Image Generation

Dung cac prompt nay de tao mock test bang image generation. Yeu cau chung: UI mockup 16:9 desktop, khong can text qua nhieu, text neu co phai ngan va de doc. Nen tao them bien the mobile 9:16 sau khi desktop duoc duyet.

### 5.1 Dashboard Mission Hub

```text
Use case: ui-mockup
Asset type: Fuxie learner dashboard redesign concept
Primary request: Create a high-fidelity UI mockup for a gamified German learning dashboard called Fuxie.
Scene/backdrop: clean desktop web app, left sidebar, main mission hub.
Subject: A friendly fox mascot coach, daily mission card, streak, XP, CEFR progress, three quest cards for vocabulary/listening/reading.
Style/medium: polished modern edtech UI, playful game-like but still credible for Goethe/telc exam preparation.
Composition/framing: 16:9 desktop screenshot composition, sidebar on left, mission hero at top center, quest cards below, progress map lower section.
Lighting/mood: bright, encouraging, energetic.
Color palette: Fuxie orange #FF6B35, deep blue #004E89, teal #2EC4B6, warm white background, limited CEFR colors.
Text (verbatim): "Nhiem vu hom nay", "15 phut", "Giữ streak", "Học tiếp", "A1 -> B1"
Constraints: Show clear hierarchy, strong primary CTA, visible mascot coach bubble, reward preview, no clutter.
Avoid: generic SaaS dashboard, dark theme, excessive gradients, illegible tiny text, random animals, unrelated brand logos.
```

### 5.2 Vocabulary World Map

```text
Use case: ui-mockup
Asset type: Fuxie vocabulary module redesign concept
Primary request: Create a high-fidelity gamified vocabulary screen where topics become a world map of islands/locations.
Scene/backdrop: desktop web app with left sidebar and central learning map.
Subject: Vocabulary A1 theme path, "Person" active island, locked future themes, word preview cards, practice CTA, Fuxie mascot as guide.
Style/medium: polished edtech game UI, colorful but controlled, friendly and clear.
Composition/framing: 16:9 desktop screenshot, level tabs at top, world map path in center, selected topic panel on right or bottom.
Lighting/mood: adventurous, motivating, beginner-friendly.
Color palette: Fuxie orange, blue, teal, CEFR A1 green, soft pastel map illustrations.
Text (verbatim): "Từ vựng A1", "Person", "34 từ", "Luyện chủ đề", "Mở khóa"
Constraints: Keep the learning task obvious; topic progress and CTA must be visually dominant.
Avoid: fantasy clutter, realistic landscape, unreadable labels, too many decorative badges.
```

### 5.3 Skill Player Motivation Layer

```text
Use case: ui-mockup
Asset type: Fuxie Reading/Listening/Writing player redesign concept
Primary request: Create a high-fidelity UI mockup for a German skill exercise player with motivational feedback.
Scene/backdrop: focused lesson player screen, no marketing hero.
Subject: exercise prompt area, progress timeline, current question, answer area, Fuxie feedback bubble, XP/star reward preview, next-step bar.
Style/medium: modern app UI, gamified learning surface, compact and ergonomic.
Composition/framing: 16:9 desktop screenshot, main exercise centered, sidebar/progress rail optional, bottom feedback/action bar.
Lighting/mood: focused, encouraging, low distraction.
Color palette: neutral content surface, orange action, blue structure, teal success, skill-specific accent.
Text (verbatim): "Câu 1/5", "Tốt lắm!", "+10 XP", "Tiếp tục", "Gợi ý"
Constraints: Preserve learning readability; game elements support feedback, not decoration.
Avoid: oversized mascot covering content, noisy confetti during active question, tiny text, dark theme.
```

### 5.4 Course Adventure Path

```text
Use case: ui-mockup
Asset type: Fuxie course/module path redesign concept
Primary request: Create a high-fidelity UI mockup for a gamified German A1 course path.
Scene/backdrop: desktop web app with left sidebar and a central adventure learning path.
Subject: eight A1 modules as path nodes, current module active, locked modules, reward chest, boss exam node, next best action card.
Style/medium: polished gamified edtech UI, playful but organized.
Composition/framing: 16:9 desktop screenshot, level tabs top, path map center, module detail panel beside active node.
Lighting/mood: progress, adventure, confidence.
Color palette: Fuxie orange primary action, blue navigation/structure, teal progress, CEFR A1 green for level identity.
Text (verbatim): "Deutsch A1", "Modul 1", "Học tiếp", "Mở khóa bài thi", "0%"
Constraints: Make progression and unlock conditions immediately clear.
Avoid: rainbow overload, too many gradients, fantasy game art that hides study content, unreadable labels.
```

## 6. Backlog Cai Tien

### P0 - Sua cac diem lam hoc vien cham hieu

- Dashboard: bien "Ke hoach 15 phut" thanh mission hero duy nhat voi CTA va reward preview ro.
- Dashboard: giam so card thong ke cap 1; day thong tin phu xuong lower sections.
- Exam: thay empty state bang huong dan co CTA va dieu kien mo khoa.
- Locked states: them dieu kien mo khoa + reward, khong chi lam mo item.
- CTA grammar: chuan hoa "Hoc tiep / Bat dau / Luyen chu de" theo mot mau action chinh.
- Sidebar: giam do lap mascot; lam active state ro hon ma khong phu thuoc chi vao nen cam nhat.

### P1 - Chuan hoa visual system

- Tao design tokens cho action, skill, CEFR, reward, locked, success, warning.
- Tao component variants cho mission card, quest card, path node, reward badge, coach bubble.
- Dinh nghia mascot usage matrix: logo, coach, reward, empty, warning.
- Chuan hoa card radius/shadow/border de tranh moi module mot cam giac.
- Tach skill identity: Reading/Listening/Writing co accent, icon, feedback pattern rieng.
- Them UX copy pattern cho "fresh start" de tranh man hinh day so 0.

### P2 - Tang do vui va retention

- Them micro-interaction cho progress fill, unlock, quest complete, streak saved.
- Them achievement surface: weekly badge, first lesson, first streak, exam ready.
- Them seasonal/event visual layer co the tat duoc.
- Them "Fuxie tip" theo context, khong hien qua nhieu cung luc.
- Them mobile-specific quest stack: mot CTA chinh, mot secondary action, progress visible without scroll.

## 7. Acceptance Criteria Cho Phase Tiep Theo

- Dashboard moi phai tra loi trong 3 giay: "hom nay hoc gi, duoc gi, bam dau".
- Moi man skill co 1 CTA chinh duy nhat o first viewport.
- Mascot xuat hien co vai tro ro, khong lap lai nhu decoration.
- Mau action/skill/level/reward khong bi trung nghia.
- Empty/locked state luon co next action.
- Mobile khong bi card day qua dai truoc khi thay bai hoc tiep theo.
- Contrast CTA/text dat muc doc tot tren nen sang.
- Mockup duoc duyet truoc khi implement component code.

## 8. Rekomendasi Trien Khai Sau Khi Duyet Mockup

Thu tu code nen di theo tac dong hoc vien:

1. Dashboard mission hub.
2. Course adventure path / module next action.
3. Vocabulary world map.
4. Skill player motivation layer.
5. Exam/review empty and reward states.

Khong nen lam toan bo cung luc. Nen lam P0 Dashboard + Course truoc, do user comprehension bang manual QA va screenshot compare, sau do moi mo rong sang Vocabulary/Skill Player.

## 9. V2 Design Direction Sau Benchmark

Ten huong de xuat: `Fuxie Quest Worlds`.

Muc tieu cua v2 la nang Fuxie tu "hoc tap bang card" len "hanh trinh hoc co the thay duoc". V2 khong copy Duolingo/Brilliant/Khan Kids, ma lay cac co che manh nhat:

- Duolingo-style clarity: moi ngay co mot path/mission ro.
- Brilliant-style focus: man lam bai sach, khong bi game element che noi dung.
- Kids-app-style delight: mascot co tinh cach va reward co cam xuc.
- Busuu/Memrise-style credibility: ngon ngu va exam-goal van la trung tam.
- Quizlet-style task clarity: bam vao la biet mode hoc gi.

### 9.1 Thay doi so voi board v1

- Mau sac: tu pastel/card nhat sang palette co layer sau hon: navy trust, orange action, teal progress, green CEFR A1, yellow reward, pink delight dung tiet che.
- Layout: moi panel nhin nhu mot product surface that, co app chrome, sidebar, content state, CTA, reward preview.
- Game loop: reward preview duoc dua len truoc action, khong chi xuat hien sau khi hoc.
- Mascot: Fuxie co vai tro coach/feedback, khong lap lai o moi nav item.
- Path: Course va Vocabulary chuyen sang map/path, thay vi card grid.
- Focus: Skill Player van uu tien vung bai hoc lon; game layer nam ben canh hoac sticky bottom.

### 9.2 Prompt Engineer V2 Cho Mockup Hinh Anh

Neu can tao them mockup bang image generation, dung prompt v2 nay thay cho prompt cu:

```text
Use case: ui-mockup
Asset type: Fuxie Quest Worlds high-fidelity product concept board
Primary request: Create a polished gamified German learning platform UI concept for Fuxie, inspired by top-tier learning apps but with its own identity.
Scene/backdrop: desktop web app product mockup board with four screens: daily mission dashboard, vocabulary quest map, focused skill player, A1 course adventure path.
Subject: friendly fox mascot coach, path-based learning nodes, reward preview, streak/XP, locked/unlocked modules, clear primary CTA, Goethe/telc exam readiness.
Style/medium: premium edtech game UI, colorful and energetic, not childish, clean enough for serious exam preparation.
Composition/framing: 16:9 board, four app screens in a 2x2 grid, strong top title band, each screen should look like a real usable product interface.
Color palette: Fuxie orange #FF6B35 as primary action, deep blue #004E89 for trust/navigation, teal #2EC4B6 for progress, CEFR A1 green, warm reward yellow, tiny accents of pink/purple only for delight.
Text: Keep text short and readable: "Daily Quest", "Hoc tiep", "Word Quest", "Good ear!", "A1 exam route", "+45 XP".
Constraints: Strong hierarchy, no random brands, no clutter, no dark-only theme, no unreadable microtext, no mascot covering learning content.
Avoid: generic SaaS cards, rainbow overload, fantasy art that hides the study task, childish toy UI, decorative gradients without purpose.
```

### 9.3 Backlog Dieu Chinh Theo V2

P0:

- Tao `MissionHero` co reward preview va 1 CTA chinh.
- Tao `CoursePathMap` cho Course: node, locked requirement, boss exam gate.
- Tao `RewardPreview` dung chung: XP, badge, streak-safe, unlock.
- Tao `FuxieCoach` role-based: coach, feedback, locked explainer, reward host.

P1:

- Tao `QuestWorldShell` dung cho Dashboard/Course/Vocabulary de co visual depth nhat quan.
- Chuan hoa palette v2 thanh design tokens: action, trust, progress, level, reward, delight.
- Tao `SkillPlayerLayout` voi content-first center, feedback side/bottom, reward sticky.
- Chuan hoa iconography: skill icon rieng, mascot khong dung thay icon module.

P2:

- Microinteraction: path node unlock, XP fill, badge reveal, streak-safe pulse.
- Seasonal/event layer: chi them sau khi core UI ro, co setting tat neu gay nhieu.
- Achievement gallery va weekly mission board, de tang retention ma khong chen vao luc lam bai.

## 11. Implementation Batch: Exam/Review Reward States

### 11.1 Prompt Engineer

```text
Use case: code implementation
Feature: Exam gate and daily review reward states for Fuxie Quest Worlds
Primary request: Upgrade Exam and Review overview surfaces so learners immediately understand the next challenge, expected reward, and safest next action.
Learning constraint: Exam must still feel credible for Goethe/telc/OESD practice. Review must feel like a daily retention ritual, not a generic flashcard catalog.
Visual direction: deep blue trust surface for exam readiness, orange primary action, teal progress, warm reward yellow, Fuxie mascot as coach/reward host.
UX mechanics: show mission title, readiness/progress stats, reward preview, one primary CTA, and helpful empty/locked guidance. Keep exam cards scannable and review actions obvious on mobile.
Text examples: "Exam gate", "Thu thach thu phong thi", "Daily review ritual", "Giu tri nho", "+XP", "Badge san sang thi", "Hoc tiep".
Avoid: seed-data copy for learners, decorative game clutter, extra competing CTAs, hiding the real exam metadata, or mascot placement that covers content.
```

### 11.2 Backlog Nho Truoc Khi Code

P0:

- Them Exam hero dang "boss gate" voi tong de, de da lam, de da dat, reward preview va CTA den de tiep theo.
- Thay Exam empty state bang huong dan hoc vien: neu cap do chua co de, di Course de mo lo trinh hoac quay lai tat ca cap do.
- Them reward/readiness strip nho trong tung exam card de de thi co cam giac thu thach co muc tieu.
- Them Review hero dang "daily review ritual" voi due cards, learned words, theme progress, reward preview va CTA on SRS neu co the den han.
- Nang Review SRS empty/complete state thanh reward surface co next action ro, khong chi thong bao trong.

P1:

- Chuan hoa copy "Exam gate", "Daily review ritual", "Reward preview" de dung lai cho result screen sau nay.
- QA desktop/mobile cho `/exam` va `/review` de dam bao hero khong day CTA xuong qua sau.
- Dam bao cac trang thai khong co data van than thien voi hoc vien, khong lo noi bo nhu "Seed data".

P2:

- Them micro-interaction unlock/pass badge sau khi co real achievement model.
- Ket noi exam readiness voi progress thuc te tung skill khi backend co du diem nang luc.

## 12. Brand Color Recalibration: Mascot-First Blue Direction

### 12.1 Ket Luan Research Mau Tu Mascot

Sau feedback cua anh, mau brand nen di tu chinh mascot Fuxie thay vi lay orange/navy lam truc chinh. Mau dominant trich tu nhom mascot `core`, `game`, `learn`, `skill`, `state`, `sticker` cho thay Fuxie thien ve xanh tuoi sang:

- `#60A8D8`: Fuxie sky blue, mau long/than chu dao cua mascot.
- `#60A8E4`: bright mascot blue, dung cho primary brand surface va active states.
- `#54A8E4`: action blue, phu hop lam CTA chinh khi can giam cam.
- `#CCE4F0`: ice blue, dung cho nen panel, card tint, coach bubble.
- `#E4F0F0`: soft blue-white, dung cho page background va large surface.
- `#3C78A8`: readable ocean blue, dung cho text/icon tren nen sang.
- `#3078B4`: deep mascot blue, dung cho border/pressed state.

Mau hien tai trong UI dang lech vi:

- `#FF6B35` dang bi dung qua nhieu nhu primary brand/action/active/reward.
- `#004E89` va `#06243F` tao cam giac qua toi, nang ve navy, khong trung cam giac Fuxie tuoi sang.
- `#2EC4B6` dang la teal phu, nhung khong phai mau mascot dominant.
- Cac hero gamification moi dang dep ve cau truc nhung doc la "dark game panel" hon la "Fuxie bright learning world".

### 12.2 Huong Mau Moi

Ten huong mau: `Fuxie Bright Sky`.

Nguyen tac:

- Blue mascot la brand primary, orange chi la CTA/reward accent.
- Nen chinh sang hon: ice blue/white, khong dung navy lam hero mac dinh.
- Hero/game surface nen dung gradient xanh tuoi: sky -> aqua -> ice, co deep blue chi de tao contrast text.
- Trang thai hoc tap phai ro vai tro mau:
  - Primary action: `#54A8E4` hoac `#2F9DDB`.
  - High urgency/reward: `#FF8A3D`, khong dung cho moi CTA.
  - Success/progress: xanh la CEFR hoac `#2EC4B6` tuy ngu canh.
  - Trust/text: `#1D4F73` / `#173B56`.
  - Background: `#F3FBFF`, `#EAF7FC`, `#FFFFFF`.

### 12.3 Proposed Tokens

```css
--fuxie-blue-50: #F3FBFF;
--fuxie-blue-100: #E4F0F0;
--fuxie-blue-200: #CCE4F0;
--fuxie-blue-400: #60A8E4;
--fuxie-blue-500: #54A8E4;
--fuxie-blue-600: #3C78A8;
--fuxie-blue-700: #3078B4;
--fuxie-blue-900: #173B56;

--fuxie-action: #54A8E4;
--fuxie-action-hover: #3C93D1;
--fuxie-reward: #FFB703;
--fuxie-energy: #FF8A3D;
--fuxie-success: #2EC4B6;
```

### 12.4 Prompt Engineer Cho Batch Mau

```text
Use case: code implementation
Feature: Fuxie mascot-first color recalibration
Primary request: Rework the visual color system so Fuxie feels bright, fresh, blue-led, and derived from the mascot palette rather than orange/navy-led.
Brand constraint: Fuxie mascot colors are the source of truth. Use sky blue and ice blue as brand surfaces. Orange is only an energy/reward/accent color, not the default brand base.
Visual direction: optimistic bright edtech, clean sky-blue learning world, strong readability, playful but not childish, less dark navy, less orange dominance.
UX mechanics: keep primary CTA clear, but allow blue primary action and orange secondary reward. Hero panels should feel airy and friendly, not heavy game dashboards.
Target screens: dashboard, course, vocabulary, exam, review, skill motivation rail.
Avoid: dark navy hero as default, orange everywhere, one-note teal palette, low contrast white-on-pastel text, gradients that do not come from mascot colors.
```

### 12.5 Backlog Doi Mau Truoc Khi Code

P0:

- Cap nhat `globals.css` brand tokens: primary thanh Fuxie blue, secondary/deep text thanh ocean blue, orange thanh energy/reward.
- Rework `QuestProgressHero`: surface mac dinh sang hon, blue-led, chi dung dark text hoac dark overlay khi can contrast.
- Rework `FuxieCoach`, `RewardPreview`, `SkillMotivationRail`: dung blue/ice surface lam default, orange chi lam reward/streak.
- Doi Dashboard/Course/Exam/Review hero tu `#06243F/#063A48` sang `Fuxie Bright Sky` surface.
- Doi CTA chinh tren learning flow sang blue primary; orange chi dung cho "reward", "urgent streak", hoac "start challenge" dac biet.

P1:

- Chuan hoa skill colors de khong trung nghia voi brand blue: Reading co ocean blue, Listening co aqua, Writing co coral accent nhung khong chiem primary.
- Tao color usage matrix: brand, action, reward, skill, CEFR, state.
- QA contrast tren mobile/desktop cho hero text, CTA, badge, reward cards.
- So sanh screenshot before/after de dam bao cam giac Fuxie tuoi sang hon nhung van ro CTA.

P2:

- Tao palette swatch board trong docs/design de dung khi review visual.
- Them seasonal/event colors sau khi palette core on dinh.
- Giam hard-coded hex trong component, tien toi token dung chung.

## 10. Implementation Batch: Skill Player Motivation Layer

### 10.1 Prompt Engineer

```text
Use case: code implementation
Feature: Skill Player motivation layer for Fuxie Quest Worlds
Primary request: Add a reusable, content-first motivational side/bottom layer to Reading, Listening, and Writing exercise players.
Learning constraint: The exercise content must remain the largest, clearest area. Game elements must support focus and confidence, not compete with the prompt or answer controls.
Visual direction: neutral learning canvas, deep blue structure, orange action, teal progress/success, skill-specific accent, Fuxie as coach/feedback host.
UX mechanics: show current mission, progress, small metric, reward preview, and one concise coach message. Use side rail on desktop and stack below content on mobile.
Text examples: "Focus mission", "Cau 1/5", "Good ear", "+10 XP", "Draft ready", "Tiep tuc".
Avoid: decorative clutter, mascot covering content, dark-only player, extra primary CTAs that conflict with answer/submit buttons.
```

### 10.2 Backlog Nho Truoc Khi Code

P0:

- Tao `SkillMotivationRail` dung chung trong gamification components.
- Gan rail vao Reading exercise phase, gom tien do cau/chỗ trống, timer, reward preview.
- Gan rail vao Listening active phase, gom play limit, cau hien tai, reward preview.
- Gan rail vao Writing editor phase, gom word count, time, submit readiness, reward preview.

P1:

- Giu player content-first: desktop dung grid co rail phai, mobile stack duoi noi dung.
- Chuẩn hóa copy cho Reading/Listening/Writing de moi skill co tinh cach rieng.
- QA desktop screenshot cho 3 skill detail.

P2:

- Sau khi P0 on dinh, co the them micro-interaction cho progress/reward va feedback sticky bottom sau submit.

## 13. Implementation Batch: Fuxie Bright Sky Color Recalibration

### 13.1 Da Trien Khai

- Doi brand tokens trong `globals.css` sang mascot-first blue: `#60A8E4`, `#54A8E4`, `#3C78A8`, `#CCE4F0`, `#F3FBFF`.
- Doi browser theme color trong `layout.tsx` sang `#60A8E4`.
- Recolor shared navigation/chrome: sidebar active item, mobile logo, bottom nav, language switcher, empty/error mascot CTA.
- Recolor gamification primitives: `QuestProgressHero`, `FuxieCoach`, `RewardPreview`, `SkillMotivationRail`.
- Recolor main learning surfaces: Dashboard, Course, Vocabulary world map, Exam gate, Review ritual.
- Recolor primary CTAs and selected states trong Reading/Listening/Writing/Exam/Vocabulary exercises tu orange/navy cu sang Fuxie sky/ocean blue.
- Giu orange/amber o vai tro co chu dich: XP, streak, warning, hard rating, reward accent.

### 13.2 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint tren cac TS/TSX files da doi: 0 errors, con warnings cu ve `any`/unused.
- `pnpm --filter @fuxie/web build`: pass.
- `git diff --check`: pass.
- Browser QA localhost: khong co console error tren cac man da kiem.

Screenshots da cap nhat:

- `docs/design/visual-audit/screenshots/dashboard-v2.png`
- `docs/design/visual-audit/screenshots/course-v2.png`
- `docs/design/visual-audit/screenshots/vocabulary-v2.png`
- `docs/design/visual-audit/screenshots/exam-v2.png`
- `docs/design/visual-audit/screenshots/review-v2.png`

### 13.3 Ghi Chu Con Lai

- `pnpm --filter @fuxie/web lint` toan repo van fail do no lint cu ngoai scope: `VideoCallLayout`, `indexed-db.ts`, `push/register.ts`. Batch mau khong tao them lint error moi trong cac file da doi.
- P2 sau batch nay: giam tiep hard-coded hex bang token/component variants de palette de bao tri hon.

## 14. Implementation Batch: Visual System Consolidation

### 14.1 Prompt Engineer

```text
Use case: code implementation
Feature: Fuxie Bright Sky visual system consolidation
Primary request: Convert the approved Fuxie Bright Sky visual direction into reusable UI primitives so future screens stay visually consistent and easier to maintain.
Brand constraint: Mascot blue is the default brand/action color. Orange and amber are reserved for reward, streak, urgency, and warning states. Do not reintroduce orange as the default CTA.
Learning constraint: Components must support fast scanning and low cognitive load. Reading/list/detail screens need clear next action, clear progress, stable card dimensions, and visible state hierarchy.
Visual direction: airy sky-blue panels, white cards, ocean-blue text, compact badges, readable primary buttons, restrained shadows, mascot used as guide/reward/feedback.
Scope for this batch: create a small primitive layer for buttons, badges, panels, and progress bars; apply it first to Reading because the current review context is `/reading`.
Avoid: broad refactors, logic changes, new dependencies, nested decorative cards, one-off hex values for brand states, hover states that shift layout.
```

### 14.2 Backlog Truoc Khi Code

P0:

- Tao shared UI primitive file cho Fuxie visual system: `FuxieButton`, `FuxieBadge`, `FuxiePanel`, `FuxieProgressBar`, va class variants co the dung cho `MeasuredLink`.
- Ap primitives vao `/reading`: hero/list CTA, empty CTA, progress bar, level chips, section cards.
- Sua Reading CSS con sot hover shadow orange cu trong `.navButton.primary:hover`.
- Dam bao khong doi data flow, routing, API, hoac exercise logic.

P1:

- Ap primitives vao Course/Vocabulary/Exam/Review de giam hard-coded CTA/card/badge class.
- Chuan hoa token role: action, reward, success, skill, surface, border, muted text.
- Tao visual QA matrix desktop/mobile cho cac primitives.

P2:

- Doi dan hard-coded hex sang token/class primitive trong cac player va exercise renderers.
- Them docs swatch/component examples de review nhanh voi anh truoc khi build man moi.

### 14.3 Da Trien Khai Trong Batch Nay

- Tao `apps/web/src/components/ui/fuxie-ui.tsx` gom:
  - `fx` class join helper.
  - `fuxieButtonClass` va `FuxieButton`.
  - `FuxiePanel`.
  - `FuxieBadge`.
  - `FuxieProgressBar`.
- Ap vao `/reading`:
  - Hero dung `FuxiePanel` surface xanh sang.
  - CTA `Hoc tiep` va empty CTA dung `fuxieButtonClass('primary')`.
  - Progress dung `FuxieProgressBar`.
  - Reading badge/progress status dung `FuxieBadge`.
  - Section accordion cards dung `FuxiePanel` interactive.
  - Locked/hidden message dung `FuxiePanel` soft.
- Sua hover shadow con sot trong Reading CSS tu orange shadow sang Fuxie blue shadow.

### 14.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint `fuxie-ui.tsx` va `reading-client.tsx`: 0 errors, con warnings cu ve `any` trong `reading-client.tsx`.
- `pnpm --filter @fuxie/web build`: pass.
- `git diff --check`: pass.
- Browser QA `/reading`: khong co console error.

Screenshot:

- `docs/design/visual-audit/screenshots/reading-v3.png`

## 15. Implementation Batch: Primitive Rollout To Core Screens

### 15.1 Prompt Engineer

```text
Use case: code implementation
Feature: Roll out Fuxie UI primitives to Course, Vocabulary, Exam, and Review.
Primary request: Apply the approved primitive layer from Reading to the remaining core learning screens so visual hierarchy, CTA behavior, panels, progress, and badges stay consistent.
Brand constraint: Keep Fuxie Bright Sky as the default. Primary action is blue, reward is amber/orange, success is green/teal. Avoid changing learning logic or data loading.
Implementation constraint: Use the new primitives where they reduce duplication and stabilize visual roles. Do not rewrite entire screens or introduce broad layout risk.
Target surfaces: Course path hero and module CTA, Vocabulary world/header/detail CTA, Exam gate/filter/empty CTA, Review ritual/theme cards/progress.
Acceptance criteria: screens remain visually similar to approved mock/QA, fewer one-off CTA/panel/progress classes, typecheck/build pass, browser QA screenshots updated.
```

### 15.2 Backlog Truoc Khi Code

P0:

- Import `FuxiePanel`, `FuxieBadge`, `FuxieProgressBar`, `fuxieButtonClass` vao Course/Vocabulary/Exam/Review.
- Doi primary CTA tren 4 man sang `fuxieButtonClass('primary')`.
- Doi key hero/list panel sang `FuxiePanel` khi khong lam thay doi layout lon.
- Doi progress bars co vai tro brand sang `FuxieProgressBar`.

P1:

- Chuan hoa empty/complete states sang `FuxiePanel` va CTA primitives.
- Giam hard-coded selected-state class cho filter/chip neu primitive phu hop.
- Cap nhat screenshots QA cho Course/Vocabulary/Exam/Review sau rollout.

P2:

- Sau khi on dinh, tach variants rieng cho `FuxieLevelTabs`, `FuxieQuestCard`, `FuxieRewardList`.

### 15.3 Da Trien Khai Trong Batch Nay

- Course:
  - `CourseQuestPath` hero dung `FuxiePanel variant="hero"`.
  - Hero badges dung `FuxieBadge` theo tone brand/reward.
  - CTA `Hoc tiep` va module next-action CTA dung `fuxieButtonClass('primary')`.
  - Module next-action strip dung `FuxiePanel variant="soft"`.
  - Timeline color doi ve Fuxie sky/teal/ocean thay cho green/blue/purple cu.
- Vocabulary:
  - World map hero dung `FuxiePanel variant="hero"`.
  - Header badges dung `FuxieBadge`.
  - Main CTA, selected-theme CTA va detail CTA dung `fuxieButtonClass`.
  - Overall progress, theme mastery va detail progress dung `FuxieProgressBar`.
  - Selected-theme side panel dung `FuxiePanel`.
- Exam:
  - Hero CTA dung `fuxieButtonClass('primary')`.
  - Level filter ribbon dung `FuxiePanel variant="soft"`.
  - Empty-state action panel dung `FuxiePanel` va CTA primitives.
  - Exam cards dung `FuxiePanel variant="interactive"`; card action dung primary primitive.
- Review:
  - Study/SRS progress bars dung `FuxieProgressBar`.
  - Study, SRS complete va hero ritual buttons dung `fuxieButtonClass`.
  - CEFR tab container va empty-state action panel dung `FuxiePanel`.
  - Theme card progress dung `FuxieProgressBar`.

### 15.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint tren `fuxie-ui.tsx`, Course, Vocabulary, Exam, Review: 0 errors.
- `pnpm --filter @fuxie/web build`: pass.
- `git diff --check`: pass; chi co CRLF warnings co san tren Windows working tree.
- Browser QA localhost sau khi restart dev server:
  - `/course?level=A1`: route ready, khong app error, khong console error.
  - `/vocabulary`: route ready, khong app error, khong console error.
  - `/exam`: route ready, empty-state CTA hien dung khi API tra 0 de, khong console error.
  - `/review`: route ready, theme grid hien dung, khong console error.

Screenshots da cap nhat:

- `docs/design/visual-audit/screenshots/course-v3.png`
- `docs/design/visual-audit/screenshots/vocabulary-v3.png`
- `docs/design/visual-audit/screenshots/exam-v3.png`
- `docs/design/visual-audit/screenshots/review-v3.png`

## 16. Implementation Batch: Primitive Variants For Tabs And Quest Cards

### 16.1 Prompt Engineer

```text
Use case: code implementation
Feature: Add reusable Fuxie primitive variants for level tabs and quest cards.
Primary request: Continue reducing one-off visual code after the first primitive rollout by extracting shared tab/filter and quest-card behavior into reusable primitives.
Brand constraint: Keep Fuxie Bright Sky as the default state. Active tabs should feel fresh blue/teal by default; CEFR-specific gradients are allowed only when the screen already depends on them.
Learning constraint: Tabs must make current scope obvious without becoming visually heavy. Quest cards must scan quickly, preserve progress/action clarity, and avoid adding decorative noise.
Scope for this batch: create `FuxieLevelTabs` and `FuxieQuestCard`; apply them first to Exam, Review, and Vocabulary where repeated hard-coded tab/card classes are most visible.
Avoid: changing data fetching, route behavior, SRS logic, exam grouping logic, or introducing new dependencies.
Acceptance criteria: the screens still look like approved Fuxie Bright Sky, repeated tab/card styles shrink, typecheck/build pass, browser QA screenshots updated.
```

### 16.2 Backlog Truoc Khi Code

P0:

- Them `FuxieLevelTabs` vao `fuxie-ui.tsx` de chuan hoa level/filter ribbon.
- Them `FuxieQuestCard` vao `fuxie-ui.tsx` de chuan hoa card interactive co shadow/border/hover.
- Ap `FuxieLevelTabs` vao Exam filter va Review CEFR tabs.
- Ap `FuxieQuestCard` vao Exam cards va Review theme cards.

P1:

- Ap `FuxieLevelTabs` vao Vocabulary CEFR switcher trong world map neu layout khong bi doi lon.
- Giu count/due badge trong Review tabs de hoc vien biet ngay cap nao can on.
- Cap nhat screenshot QA cho Exam/Review/Vocabulary.

P2:

- Tach tiep `FuxieRewardList` sau khi card/tab primitives on dinh.
- Sau do moi tinh toi Course module card variant rieng neu can.

### 16.3 Da Trien Khai Trong Batch Nay

- Them `FuxieLevelTabs` vao `apps/web/src/components/ui/fuxie-ui.tsx`:
  - Ho tro `items`, `activeItem`, `onSelect`, disabled state, count badge, active/inactive class override.
  - Default active state la Fuxie sky-blue; screen co CEFR gradient co the override co kiem soat.
- Them `FuxieQuestCard` vao `fuxie-ui.tsx`:
  - Dung duoc cho `div` va `button`.
  - Mac dinh co border/surface/hover shadow theo Fuxie Bright Sky.
- Ap vao Exam:
  - Level filter ribbon dung `FuxieLevelTabs`.
  - Exam card dung `FuxieQuestCard`.
- Ap vao Review:
  - CEFR tabs dung `FuxieLevelTabs` va giu due-count badge.
  - Theme cards dung `FuxieQuestCard as="button"` de giu semantic button dung.
- Ap vao Vocabulary:
  - World map CEFR switcher dung `FuxieLevelTabs`.

### 16.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint tren `fuxie-ui.tsx`, Exam, Review, Vocabulary: 0 errors.
- `pnpm --filter @fuxie/web build`: pass.
- `git diff --check`: pass; chi co CRLF warnings co san tren Windows working tree.
- Sau build da restore `apps/web/public/sw.js` va restart dev server vi localhost tra 500 theo pattern Turbopack cu.
- Browser QA:
  - `/exam`: route ready, khong app error; empty-state filter/CTA hien dung.
  - `/review`: route ready, khong app error; CEFR tabs va theme cards hien dung.
  - `/vocabulary`: route ready, khong app error; CEFR switcher va world map hien dung.
  - Dev server log xac nhan cac route/API lien quan tra `200`.

Screenshots da cap nhat:

- `docs/design/visual-audit/screenshots/exam-v4.png`
- `docs/design/visual-audit/screenshots/review-v4.png`
- `docs/design/visual-audit/screenshots/vocabulary-v4.png`

## 17. Implementation Batch: Reward List Primitive

### 17.1 Prompt Engineer

```text
Use case: code implementation
Feature: Extract reward visual list into a reusable Fuxie primitive.
Primary request: Continue visual-system consolidation by moving repeated reward preview row/stack styling into `FuxieRewardList`, then make the existing `RewardPreview` compose it.
Brand constraint: Reward visuals may use amber/orange/purple/teal as semantic reward tones, but surrounding system should remain Fuxie Bright Sky. Do not turn primary actions orange.
Learning constraint: Reward rows must be scan-friendly: icon, reward label, and detail should stay readable, compact, and consistent across dashboard/course/vocabulary/exam/review/player rails.
Scope for this batch: add `FuxieRewardList` to `fuxie-ui.tsx`; refactor `RewardPreview` in `quest-visuals.tsx` to map reward types into the primitive.
Avoid: changing reward data shape, changing gamification logic, changing routes/API, or editing every consumer manually.
Acceptance criteria: reward preview layout remains visually stable, one-off reward row CSS is removed from `RewardPreview`, typecheck/build pass, browser QA screenshots updated for Exam/Review/Vocabulary.
```

### 17.2 Backlog Truoc Khi Code

P0:

- Them `FuxieRewardList` primitive co ho tro `row` va `stack`.
- Ho tro tone reward: `reward`, `streak`, `success`, `badge`, `brand`, `neutral`.
- Refactor `RewardPreview` de chi map type -> icon/tone, roi render bang `FuxieRewardList`.

P1:

- Dam bao label/detail truncate dung, khong vo card tren mobile.
- Giu icon reward co nen mau ro, nhung khong lam CTA/mau brand bi lech sang orange.
- QA lai Exam/Review/Vocabulary vi cac man nay co reward preview trong first viewport.

P2:

- Sau khi on dinh, co the thay cac reward list custom trong dashboard/course neu con hard-coded ngoai `RewardPreview`.

### 17.3 Da Trien Khai Trong Batch Nay

- Them `FuxieRewardList` vao `apps/web/src/components/ui/fuxie-ui.tsx`:
  - Ho tro layout `row` va `stack`.
  - Ho tro tone `brand`, `reward`, `streak`, `success`, `badge`, `neutral`.
  - Giu icon, label, detail trong cau truc scan nhanh va co truncate an toan.
- Refactor `RewardPreview` trong `apps/web/src/components/gamification/quest-visuals.tsx`:
  - `RewardPreview` khong con tu render CSS tung row.
  - Chi map reward type (`xp`, `streak`, `badge`, `unlock`, `exam`) sang icon/tone roi dung `FuxieRewardList`.
  - Tat ca consumer hien co cua `RewardPreview` duoc huong style moi ma khong doi data shape.

### 17.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint tren `fuxie-ui.tsx`, `quest-visuals.tsx`, Exam, Review, Vocabulary: 0 errors.
- `pnpm --filter @fuxie/web build`: pass.
- `git diff --check`: pass.
- Sau build da restore `apps/web/public/sw.js` va restart dev server vi localhost tra 500 theo pattern Turbopack cu.
- Browser QA:
  - `/exam`: reward preview, empty state, filter CTA render dung; route 200.
  - `/review`: reward preview va theme cards render dung; route 200.
  - `/vocabulary`: side reward stack render dung; route 200.
  - Browser dev log con hien 3 stale parse errors tu lan compile fail cu luc 09:48-09:50, khong phai loi moi; dev server hien tai render route/API 200 va khong app error.

Screenshots da cap nhat:

- `docs/design/visual-audit/screenshots/exam-v5.png`
- `docs/design/visual-audit/screenshots/review-v5.png`
- `docs/design/visual-audit/screenshots/vocabulary-v5.png`

## 18. Implementation Batch: Actual Learning Flow Polish

### 18.1 Prompt Engineer

```text
Use case: code implementation
Feature: Polish the actual study flow after the hub screens.
Primary request: Bring Vocabulary practice and SRS review sessions into the approved Fuxie Bright Sky system so the moment of learning feels as polished as the hub screens.
Brand constraint: Replace legacy green/orange-heavy practice visuals with Fuxie sky-blue/teal surfaces. Keep amber/orange only for XP, streak, warning, and reward feedback.
Learning constraint: Study flow must make progress, current task, feedback, and next action obvious. Loading/error/empty/complete states need clear recovery actions and mascot support.
Scope for this batch: update Vocabulary practice hub, exercise wrapper loading/error/fallback states, and standalone SRS review session surfaces/buttons/progress.
Avoid: changing exercise logic, grading rules, SRS algorithm, data fetching contracts, or route behavior.
Acceptance criteria: practice/review screens use shared primitives, CTA hierarchy is consistent, feedback states are readable, typecheck/build pass, browser QA screenshots updated.
```

### 18.2 Backlog Truoc Khi Code

P0:

- Apply `FuxieLevelTabs`, `FuxiePanel`, `FuxieProgressBar`, `FuxieBadge`, `FuxieQuestCard`, `FuxieRewardList`, and `fuxieButtonClass` where useful in Vocabulary practice and Review session.
- Replace legacy green practice node with Fuxie sky/teal node while preserving path behavior.
- Replace hard-coded loading/error/default buttons in `ExercisePlayerWrapper` with primitives.
- Replace SRS review progress/result cards/CTAs with primitives and reward list.

P1:

- Improve completion state visual hierarchy: XP, accuracy, correct/again, next action.
- Make empty state feel like guided next step, not a dead end.
- Keep mobile layout compact and tap targets stable.

P2:

- Later, apply the same polish inside individual exercise components (`mc`, `matching`, `spelling`, `cloze`, `scramble`, `mixed`) if their internal feedback still feels off-brand.

### 18.3 Da Trien Khai Trong Batch Nay

- Vocabulary practice hub (`apps/web/src/components/vocabulary/practice-hub.tsx`):
  - CEFR switcher dung `FuxieLevelTabs`.
  - Sticky mission banner dung `FuxiePanel` + `FuxieBadge`.
  - Path line va lesson node chuyen tu legacy green sang Fuxie sky/teal.
  - Tooltip theme dung `FuxieQuestCard` de canh border/shadow/hover voi he primitive.
- Exercise wrapper (`apps/web/src/components/vocabulary/exercises/exercise-player-wrapper.tsx`):
  - Loading state dung Fuxie soft panel, mascot, va progress shimmer mau sky/teal.
  - Error/default state dung `FuxiePanel` va `fuxieButtonClass` cho CTA chinh/phu.
  - Khong doi exercise data fetch, route, submit, hay logic render tung dang bai.
- SRS review session (`apps/web/src/components/srs/review-session.tsx`):
  - Progress bar dung `FuxieProgressBar`.
  - Completion/empty state dung `FuxiePanel`, `FuxieRewardList`, va `fuxieButtonClass`.
  - Ghi nhan: component nay hien chua duoc import boi route live, nhung da duoc polish de san sang neu duoc noi lai sau.
- Actual live Review flow (`apps/web/src/components/srs/review-client.tsx`):
  - SRS completion stat cards chuyen sang `FuxiePanel` de dong bo voi `/review` dang live.

### 18.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint tren Practice Hub, Exercise Wrapper, Review Session, Review Client, `fuxie-ui.tsx`: 0 errors; con warning co san ve `any` trong vocabulary/exercise data.
- `pnpm --filter @fuxie/web build`: pass.
- Sau build da restore `apps/web/public/sw.js` va restart dev server de tranh loi `.next` development manifest tren localhost.
- Browser QA voi dev-auth learner:
  - `/vocabulary/practice`: route ready, CEFR tabs/mission banner/path node render dung.
  - `/vocabulary/practice/mixed?theme=a1-person&level=A1`: exercise route ready, cau hoi load thanh cong.
  - `/review`: route ready, review hub render dung sau restart.
- Dev console van giu mot so stale error cu tu lan compile Exam truoc do; current route smoke sau restart pass.

Screenshots da cap nhat:

- `docs/design/visual-audit/screenshots/vocabulary-practice-v1.png`
- `docs/design/visual-audit/screenshots/vocabulary-practice-mixed-v1.png`
- `docs/design/visual-audit/screenshots/review-session-v1.png`

## 19. Implementation Batch: Vocabulary Exercise Chrome Polish

### 19.1 Prompt Engineer

```text
Use case: code implementation
Feature: Polish shared vocabulary exercise chrome.
Primary request: Continue from the hub/practice polish by making the reusable exercise frame, feedback, intro card, and result screen feel like the approved Fuxie Bright Sky product.
Brand constraint: Progress, primary buttons, audio buttons, and card borders should lean sky-blue/teal. Amber/orange stays reserved for XP/reward; red stays only for incorrect/error feedback.
Learning constraint: During a live exercise, the student must instantly understand current progress, current task, correctness feedback, and next action. Feedback should feel supportive, not punitive.
Scope for this batch: update shared components used by multiple vocabulary exercises: `ExerciseProgress`, `IntroSlide`, `BottomFeedback`, and `ExerciseResults`.
Avoid: changing grading, retry rules, heart logic, answer submission, timers, data fetching, route behavior, or individual exercise question logic.
Acceptance criteria: common exercise chrome is consistent with Fuxie primitives, mobile layout remains stable, typecheck/build pass, browser QA screenshot updated for at least mixed practice and results/feedback if reachable.
```

### 19.2 Backlog Truoc Khi Code

P0:

- Replace hard-coded green progress bar in `ExerciseProgress` with `FuxieProgressBar` brand tone.
- Replace hard-coded CEFR badge and close button styling with `FuxieBadge` / Fuxie sky interaction states.
- Replace `IntroSlide` card/button/audio button with `FuxiePanel` + `fuxieButtonClass` and sky/teal treatment.
- Replace `BottomFeedback` legacy green/red Duolingo-like surface with softer Fuxie success/danger feedback and a consistent CTA.
- Replace `ExerciseResults` stat row, answer breakdown panel, and action buttons with Fuxie primitives.

P1:

- Ensure bottom feedback stacks cleanly on mobile and keeps the continue CTA visible.
- Keep result answer rows readable with correct/incorrect/pending states.
- Keep score ring brand-aware while preserving success/warning/danger meaning.

P2:

- After shared chrome is stable, inspect individual option buttons in `mc`, `mixed`, `matching`, `spelling`, `cloze`, `scramble` for one-off color cleanup.

### 19.3 Da Trien Khai Trong Batch Nay

- `ExerciseProgress`:
  - Progress bar chuyen sang `FuxieProgressBar` brand tone.
  - Close button, timer pill, CEFR badge duoc canh lai theo Fuxie sky/teal.
  - Giu nguyen timer/current/total/onClose contract.
- `IntroSlide`:
  - New-word label dung `FuxieBadge`.
  - Word card dung `FuxiePanel variant="hero"`.
  - Audio button va CTA tiep tuc chuyen sang Fuxie sky-blue treatment.
  - Giu nguyen autoplay audio va Enter-to-continue behavior.
- `BottomFeedback`:
  - Feedback dung/sai chuyen tu legacy green/red sang surface mem hon: success teal, danger red.
  - CTA tiep tuc dung `fuxieButtonClass` cho truong hop dung; sai van giu red semantic de hoc vien nhan biet ro.
  - Layout chuyen sang responsive stack tren mobile.
- `ExerciseResults`:
  - Score ring success chuyen sang teal, amber chi dung khi diem trung binh/reward.
  - Stats row dung `FuxieRewardList`.
  - Answer breakdown dung `FuxiePanel`, answer rows dung ring/surface semantic.
  - Action buttons dung `fuxieButtonClass`.

### 19.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint tren `exercise-progress.tsx`, `exercise-results.tsx`, `intro-slide.tsx`, `bottom-feedback.tsx`, `fuxie-ui.tsx`: pass, 0 warnings/errors.
- `pnpm --filter @fuxie/web build`: pass.
- Sau build da restore `apps/web/public/sw.js` va restart dev server.
- Browser QA voi dev-auth learner:
  - `/vocabulary/practice/mixed?theme=a1-person&level=A1`: intro slide render dung, progress chrome moi render dung.
  - Chon dap an dung: bottom feedback success render dung, CTA tiep tuc hoat dong.
  - Hoan thanh mixed practice: result screen render dung reward stats, answer breakdown, CTA retry/new theme.
  - Browser dev console: 0 current errors sau khi chụp result screen.

Screenshots da cap nhat:

- `docs/design/visual-audit/screenshots/vocabulary-practice-mixed-v2.png`
- `docs/design/visual-audit/screenshots/vocabulary-practice-feedback-v1.png`
- `docs/design/visual-audit/screenshots/vocabulary-practice-results-v1.png`

## 20. Implementation Batch: Vocabulary Exercise Interaction Polish

### 20.1 Prompt Engineer

```text
Use case: code implementation
Feature: Polish individual vocabulary exercise interactions after shared chrome is aligned.
Primary request: Continue the Fuxie Bright Sky rollout inside the actual answer interactions so buttons, cards, inputs, selected states, and disabled states feel consistent across exercise types.
Brand constraint: Default and selected states should use sky-blue/teal. Correct feedback can use teal/emerald; incorrect feedback uses red only. Amber/orange remains reward-only and should not become the main answer color.
Learning constraint: Students must clearly see what is selectable, what they selected, what is disabled after answer reveal, and what action comes next. Visual state must reduce hesitation, not add decoration.
Scope for this batch: introduce a local exercise interaction style helper, then apply it to high-impact vocabulary exercise components: MC/Mixed options, Matching pair cards, Spelling input/action, and Scramble token/action areas.
Avoid: changing answer validation, retry behavior, heart logic, data fetching, result submission, timers, keyboard behavior, or route behavior.
Acceptance criteria: interaction states are consistent, tap targets remain stable on mobile, typecheck/build pass, browser QA verifies mixed practice and at least one typed/token style exercise route if reachable.
```

### 20.2 Backlog Truoc Khi Code

P0:

- Add a local `exercise-ui` helper for reusable answer option, screen, and prompt/control classes.
- Apply shared option style to `mc-exercise.tsx` and `mixed-exercise.tsx`.
- Apply shared card/control style to `matching-exercise.tsx`.
- Apply shared input/action treatment to `spelling-exercise.tsx`.
- Apply shared token/action treatment to `scramble-exercise.tsx`.

P1:

- Keep image/audio prompt surfaces aligned with sky-blue/teal.
- Keep selected/revealed/disabled states visibly different and accessible.
- Avoid changing any exercise logic while touching UI-heavy files.

P2:

- Later, apply the same helper to `cloze-exercise.tsx` and `speed-exercise.tsx` if their interaction surfaces still feel off-brand after QA.

### 20.3 Da Trien Khai Trong Batch Nay

- Them `apps/web/src/components/vocabulary/exercises/exercise-ui.ts` lam helper cuc bo cho:
  - exercise screen/background, center stage, prompt image/audio button.
  - answer option states: default, selected, revealed, disabled.
  - matching pair card states: default, selected, matched, wrong.
  - spelling input, special char buttons, primary/secondary action buttons.
  - scramble construction zone va word token states.
- `mc-exercise.tsx`:
  - Root/background doi sang Fuxie Bright Sky.
  - Prompt image/audio va inline listen button dung helper chung.
  - Answer options dung shared sky-blue selected/revealed states, grid responsive 1 column mobile / 2 columns desktop.
  - Loading spinner doi sang sky accent.
- `mixed-exercise.tsx`:
  - Intro/MC wrapper dung shared screen/stage classes.
  - Game-over CTAs dung Fuxie button treatment.
  - Heart/life row doi sang teal/soft-sky thay vi red-dominant.
  - MC answer options dung shared option style, sua class audio button bi loi `w-24 h-24...`.
- `matching-exercise.tsx`:
  - Pair cards dung shared selected/matched/wrong states.
  - Header/column labels doi sang Fuxie sky visual language.
  - Sua hydration mismatch: bo `Math.random()` trong render-time shuffle, thay bang deterministic shuffle theo id de server/client render giong nhau.
- `spelling-exercise.tsx`:
  - Prompt image/audio, article badge, input shell, German special chars, hint va submit buttons doi sang shared interaction style.
  - Submit disabled/enabled state ro hon, tap target on dinh hon tren mobile.
- `scramble-exercise.tsx`:
  - Translation hint, construction zone, selected token, available token, reset/submit actions doi sang shared interaction style.
  - Zone selected/revealed co visual state ro, button `Prufen` enabled dung khi co token.

### 20.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint tren `exercise-ui.ts`, `mc-exercise.tsx`, `mixed-exercise.tsx`, `matching-exercise.tsx`, `spelling-exercise.tsx`, `scramble-exercise.tsx`: pass, 0 warnings/errors.
- `pnpm --filter @fuxie/web build`: pass.
- Build lan dau bi fail do artifact `.next/server/app-paths-manifest.json` bi corrupt/null bytes; da xoa rieng `.next` build output va build lai sach: pass.
- Sau build da restore `apps/web/public/sw.js` va restart dev server.
- Browser QA:
  - Docker Desktop/compose da duoc bat lai vi local DB `127.0.0.1:5434` dang tat; `postgres` va `redis` sau do healthy.
  - `/vocabulary/practice/mixed?theme=a1-person&level=A1`: intro render dung, option state va bottom feedback render dung.
  - `/vocabulary/practice/spelling?theme=a1-person&level=A1`: input render dung, special chars render dung, fill `ja` lam `Prufen` enabled, submit hien `Da luu cau tra loi`.
  - `/vocabulary/practice/scramble?theme=a1-person&level=A1`: word tiles render sau hydration, chon token lam construction zone active va `Prufen` enabled.
  - `/vocabulary/practice/matching?theme=a1-person&level=A1`: pair cards render dung; sau deterministic shuffle fix, fresh console error count = 0.

Screenshots da cap nhat:

- `docs/design/visual-audit/screenshots/vocabulary-practice-mixed-v3.png`
- `docs/design/visual-audit/screenshots/vocabulary-practice-feedback-v2.png`
- `docs/design/visual-audit/screenshots/vocabulary-practice-spelling-v1.png`
- `docs/design/visual-audit/screenshots/vocabulary-practice-scramble-v2.png`
- `docs/design/visual-audit/screenshots/vocabulary-practice-matching-v2.png`

## 21. Implementation Batch: Vocabulary Cloze And Speed Polish

### 21.1 Prompt Engineer

```text
Use case: code implementation
Feature: Finish P2 vocabulary exercise interaction polish for Cloze and Speed.
Primary request: Continue the Fuxie Bright Sky rollout so fill-in-the-blank and speed challenge no longer feel visually separate from the rest of vocabulary practice.
Brand constraint: Core surfaces, answer options, input focus, and progress/timer chrome should lean sky-blue/teal. Amber is allowed for urgency/reward warning states. Red is reserved for critical time/error only.
Learning constraint: Cloze must make the blank, typed answer, word-type hint, and submit action easy to scan. Speed must preserve urgency while reducing dark-mode cognitive load and keeping answer options readable under time pressure.
Scope for this batch: update `cloze-exercise.tsx` and `speed-exercise.tsx`, reusing `exercise-ui.ts` helpers created in Batch 20.
Avoid: changing answer validation, timeout rules, auto-advance behavior, submission payloads, timers, data fetching, route behavior, or result screen logic.
Acceptance criteria: Cloze and Speed match Fuxie Bright Sky, tap targets remain stable, disabled/revealed states are clear, typecheck/lint/build pass, browser QA verifies both routes if reachable.
```

### 21.2 Backlog Truoc Khi Code

P0:

- Apply shared screen/stage/input/action helpers to `cloze-exercise.tsx`.
- Replace cloze sentence card, blank chip, translation hint, saved feedback, special chars, and submit button styling with Fuxie Bright Sky treatment.
- Apply shared screen/option helpers to `speed-exercise.tsx`.
- Replace speed dark-mode shell with bright timer challenge UI while preserving countdown urgency.

P1:

- Keep word-type badge meaningful without introducing a rainbow palette.
- Keep countdown bar clear: teal normal, amber warning, red critical.
- Remove easy lint warnings from unused `themeName` / `onComplete` props in touched files.

P2:

- After QA, consider a future mini-batch for motion polish on the countdown bar and answer reveal, but only if it improves learning clarity.

### 21.3 Da Trien Khai Trong Batch Nay

- `cloze-exercise.tsx`:
  - Doi root/background va stage layout sang shared `exerciseScreenClass`, `exerciseCenterStageClass`, `exerciseStageInnerClass`.
  - Sentence card, blank chip, translation hint, saved feedback, input, special character keyboard va submit button chuyen sang Fuxie Bright Sky.
  - Word-type badge duoc giam rainbow palette: sky/teal la chinh, amber chi dung cho preposition/hint-like state.
  - Giu nguyen logic fill blank, Enter-to-submit, auto-advance va submit payload.
- `speed-exercise.tsx`:
  - Bo dark-mode shell rieng, doi sang bright challenge UI de dong bo voi cac exercise khac.
  - Countdown bar van giu urgency: teal normal, amber warning, red critical.
  - Answer options dung shared `exerciseOptionClass` voi selected/revealed/disabled state thong nhat.
  - Giu nguyen countdown 8 giay, timeout behavior, auto-advance va submission logic.

### 21.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint tren `exercise-ui.ts`, `cloze-exercise.tsx`, `speed-exercise.tsx`: pass, 0 warnings/errors.
- `pnpm --filter @fuxie/web build`: pass.
- Sau build da restore `apps/web/public/sw.js`, DB/Redis local van healthy, va restart dev server.
- Browser QA voi dev-auth learner:
  - `/vocabulary/practice/cloze?theme=a1-person&level=A1`: route render dung; blank chip, word-type badge, translation hint, special chars va `Prufen` render dung.
  - Cloze interaction: fill `tschuss`/German text lam `Prufen` enabled; submit hien `Da luu cau tra loi`.
  - `/vocabulary/practice/speed?theme=a1-person&level=A1`: route render dung bright timer challenge, countdown pill/bar va option grid render dung.
  - Speed interaction: click answer option thanh cong, flow tiep tuc/advance dung.
  - Fresh browser console errors tu moc Batch 21 QA: 0.

Screenshots da cap nhat:

- `docs/design/visual-audit/screenshots/vocabulary-practice-cloze-v2.png`
- `docs/design/visual-audit/screenshots/vocabulary-practice-speed-v2.png`

## 22. Planning Batch: Speaking Visual Polish And Asset Safety

### 22.1 Prompt Engineer

```text
Use case: planning before code
Feature: Prepare the next design implementation batch after Vocabulary Practice is complete.
Primary request: Move from Vocabulary Practice polish into Speaking, but first protect the worktree from unrelated audio asset changes.
Brand constraint: Continue Fuxie Bright Sky: mascot/fresh sky-blue/teal as default brand and action language; amber only for reward/urgency; red only for error/critical states.
Learning constraint: Speaking must feel like guided practice with clear listening/speaking turns, visible confidence, retry guidance, and low anxiety. Audio availability must be reliable before changing player UX.
Scope for this planning batch: audit current worktree, identify asset deletion risk, define Speaking visual polish backlog, and only proceed to code after the audio asset decision is clear.
Avoid: restoring or committing deleted audio files without explicit owner confirmation; changing speaking lesson logic before understanding audio source paths; mixing unrelated asset pipeline changes into visual UI commits.
Acceptance criteria: Vocabulary batch remains separable; audio deletion state is documented; Speaking backlog is clear enough to implement in the next batch with QA routes and screenshots.
```

### 22.2 Backlog Truoc Khi Code

P0:

- Worktree safety:
  - Confirm whether the 80 deleted tracked files under `apps/web/public/audio/speaking/a1/...` are intentional.
  - Confirm whether `copy_audios_when_done.sh` change is part of the same audio pipeline task.
  - Do not restore, stage, or commit those audio deletions until the decision is explicit.
- Speaking audit:
  - Inspect `/speaking` and one A1 speaking lesson route in browser.
  - Identify current visual issues: hero, topic cards, lesson player, audio controls, transcript/response surfaces, empty/loading states.
  - Check whether deleted A1 audio affects live playback.

P1:

- Speaking visual polish candidate scope:
  - Apply `FuxiePanel`, `FuxieBadge`, `FuxieProgressBar`, `fuxieButtonClass`, and `FuxieRewardList` where useful.
  - Make speaking player feel like a guided turn-based coach: listen -> repeat -> evaluate -> next action.
  - Standardize audio/play buttons and confidence feedback with Fuxie Bright Sky.
  - Keep mobile tap targets stable and avoid dense instruction text.

P2:

- If audio pipeline change is intentional, split it into a separate asset commit/task from visual UI.
- Add a future mobile QA pass across Dashboard, Vocabulary, Review, Speaking after Speaking polish lands.

## 23. Implementation Batch: Quest System v1 Dashboard Mission Hub

### 23.1 Prompt Engineer

```text
Use case: code implementation after design/gameification audit.
Feature: Build Quest System v1 as a hybrid Dashboard Mission Hub.
Primary request: Convert Dashboard first viewport from general stats-first layout into a clear daily mission loop using real existing learning signals.
Data constraint: Use existing TodayPlan, DailyActivity, UserStreak, UserProfile.totalXp, SRS, and achievements data. Do not add schema, migrations, API changes, scoring changes, SRS changes, streak logic changes, or TodayPlan priority changes.
Architecture constraint: Create an internal quest adapter with a stable DashboardQuest contract so a persisted quest engine can attach later without rewriting the Dashboard UI.
Brand constraint: Continue Fuxie Bright Sky. Sky-blue and teal are the default brand/action language; amber is only for reward/urgency; red is only for error/critical states.
Learning constraint: The first viewport must answer: what should I do now, why this mission, how far am I today, what reward/unlock comes next.
Scope for this batch: Dashboard Hub only. Do not roll the quest system into Course, Vocabulary Practice, or Skill players yet.
Acceptance criteria: Dashboard shows one primary quest, up to two secondary quests, reward preview, goal progress, fresh-start state, stable CTAs, typecheck/lint/build pass, and browser QA verifies desktop/mobile /dashboard.
```

### 23.2 Backlog Truoc Khi Code

P0:

- Add internal quest adapter `DashboardQuest`, `QuestStatus`, `QuestReward`, and `DashboardMissionHub`.
- Derive three prioritized quests from `TodayPlan.actions` using real Dashboard context.
- Pass full Dashboard data into the mission section so adapter can use streak, SRS, total XP, and achievements.
- Replace the old TodayPlan block with Mission Hub hero, primary CTA, reward preview, goal progress, and secondary quest cards.
- Add fresh-start handling so zero-data users see "Ngay 1" and a motivating first quest instead of a dead all-zero dashboard.

P1:

- Keep existing stat cards, weekly chart, skills, quick actions, and achievements below the mission hub.
- Keep CTA routes and measured-link tracking intact.
- Keep visual language aligned with Fuxie Bright Sky and avoid purple-heavy dashboard accents.

P2:

- Later, persist quests and reward claims if product direction confirms a full quest engine.
- Later, reuse the same quest contract on Course and Practice surfaces.

### 23.3 Da Trien Khai Trong Batch Nay

- Them `apps/web/src/lib/dashboard/quest-adapter.ts` lam adapter noi bo cho:
  - `QuestStatus`: `active`, `available`, `completed`, `locked`.
  - `QuestReward` dung chung shape voi reward preview hien co.
  - `DashboardQuest`: id/type/title/reason/href/status/progress/rewardPreview/priority/estimatedMinutes/badge.
  - `DashboardMissionHub`: primary quest, secondary quests, goal progress, fresh-start flag, coach copy.
- Adapter map `TodayPlan.actions` thanh 3 quest uu tien, dung context that tu Dashboard:
  - streak hien tai.
  - SRS due/reviewed today.
  - total XP.
  - achievements count.
- Fresh-start state:
  - Neu total XP, streak, current minutes va achievements deu bang 0, Dashboard uu tien quest "Mo khoa quest dau tien".
  - Khong con cam giac dashboard toan so 0; user thay Ngay 1, reward +15 XP, streak hint va unlock hint.
- Dashboard Mission Hub:
  - Hero "Nhiem vu hom nay" voi primary quest, reason, CTA, reward strip, progress goal minutes.
  - Fuxie Coach ben phai giai thich next best action.
  - 3 mini mission stats: XP, streak, review.
  - Quest card grid hien 3 nhiem vu uu tien, status pill, thoi gian, progress.
- Reorder `/dashboard`:
  - Header render dau tien.
  - Content/Mission Hub render truoc stat cards de first viewport tap trung vao game loop.
  - Stat cards van giu lai nhung day xuong sau Mission Hub.
- Mobile polish:
  - Fix base grid reward list va quest grid ve `grid-cols-1` de text/reward khong ep ngang tren 390px.
- Brand polish:
  - Dashboard giu Fuxie Bright Sky: sky-blue/teal la action/default, amber chi dung cho reward/fresh urgency.
  - Metadata icon doi sang mascot asset dang ton tai de nhan dien Fuxie ro hon va tranh request icon sai.

### 23.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint tren dashboard page/client, quest adapter, Fuxie UI, app layout: pass, 0 warnings/errors.
- `pnpm --filter @fuxie/web build`: pass.
- Browser QA:
  - `/dashboard` render Mission Hub voi "Nhiem vu hom nay", CTA "Bat dau quest", reward strip va "Quest uu tien".
  - Fresh user/zero data hien "Ngay 1" va quest khoi dong thay vi dashboard cut hung bang toan so 0.
  - Mission Hub nam truoc stat cards trong first viewport.
  - CTA primary giu route tu quest adapter.
  - Desktop screenshot da luu.
  - Mobile 390px screenshot da luu; khong con horizontal overflow, text wrap dung.
  - Local dev server `3000` dang giu stale error cu, nen QA dung server sach `3001`; DB local/Postgres healthy.

Screenshots da cap nhat:

- `docs/design/visual-audit/screenshots/dashboard-quest-v1-desktop.png`
- `docs/design/visual-audit/screenshots/dashboard-quest-v1-mobile.png`

## 24. Implementation Batch: Quest State Coverage And Dashboard Hardening

### 24.1 Prompt Engineer

```text
Use case: code hardening after Quest System v1 shipped on Dashboard.
Feature: Protect Dashboard Mission Hub behavior across the key real learner states before rolling quests into other modules.
Primary request: Add targeted coverage and small hardening for fresh-start, SRS due, weak skill, target exam, and completed-day Dashboard quest states.
Data constraint: Keep v1 hybrid and UI-first. Do not add DB schema, migrations, public API, scoring, SRS, streak, or TodayPlan priority changes.
Design constraint: Keep Fuxie Bright Sky, mission-first Dashboard, and stable mobile layout.
Scope for this batch: quest adapter behavior, Dashboard copy/layout edge cases, and QA documentation only.
Avoid: building a persisted quest engine, changing route behavior, changing TodayPlan generation, or rolling quests into Course/Practice.
Acceptance criteria: unit tests cover the four key states, fresh-start never hides due SRS/assignments, target exam rewards remain visible, typecheck/lint/build pass, and `/dashboard` still renders cleanly on desktop/mobile.
```

### 24.2 Backlog Truoc Khi Code

P0:

- Add unit coverage for `buildDashboardMissionHub`.
- Verify fresh-start state shows the easy starter quest only when there is no due SRS or pending assignment.
- Verify SRS due keeps Review as primary quest.
- Verify weak skill lesson can become primary quest when there is no higher-priority review/assignment.
- Verify target exam quest exposes exam reward/readiness.

P1:

- Harden completed-day behavior so primary quest progress/reward state stays clear.
- Polish fresh-start copy to avoid punctuation duplication in Dashboard hero/cards.
- Keep mobile reward/quest grid from reintroducing horizontal overflow.

P2:

- After this batch, decide whether to roll the quest contract into Course path or Practice result surfaces.

### 24.3 Da Trien Khai Trong Batch Nay

- Added `apps/web/src/lib/dashboard/quest-adapter.ts` as the internal Dashboard quest contract for v1 Hybrid.
- Added `DashboardQuest`, `QuestStatus`, `QuestReward`, `DashboardMissionHub`, and `DashboardQuestContext` types.
- Hardened fresh-start detection so "Ngay 1" only appears for a true zero-data learner:
  - no XP, no streak, no achievements,
  - no SRS due/reviewed today,
  - no minutes today,
  - no pending assignments.
- Added adapter coverage in `apps/web/src/lib/dashboard/quest-adapter.test.ts` for:
  - zero-data fresh start,
  - SRS due primary quest,
  - pending assignment not hidden by fresh-start,
  - weak-skill lesson primary,
  - target exam reward/readiness,
  - completed-day quest status/progress.
- Polished Dashboard hero copy with `formatMissionReason()` so reason text keeps exactly one terminal punctuation mark and never renders `ban..`.
- Added a development PWA guard in `PwaRegistration`:
  - production still registers `/sw.js`,
  - development unregisters same-origin stale service workers so local QA does not hydrate against old cached chunks.
- Hardened `.mobile-main` with `min-width: 0` and mobile `overflow-x: hidden` to prevent Mission Hub from widening the 390px viewport.

### 24.4 QA Ket Qua

- `pnpm --filter @fuxie/web exec vitest run src/lib/dashboard/quest-adapter.test.ts`: pass, 6/6 tests.
- Targeted ESLint for quest adapter, adapter test, Dashboard client, and PWA registration: pass.
- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web build`: pass.
- Browser QA on clean dev origin `http://localhost:3002/dashboard`:
  - "Nhiem vu hom nay": 1,
  - CTA "Bat dau quest": 1,
  - "Quest uu tien": 1,
  - double punctuation `ban..`: 0,
  - fresh console errors for `localhost:3002`: 0.
- Mobile 390px CDP QA:
  - `innerWidth`: 390,
  - `documentElement.scrollWidth`: 390,
  - `documentElement.clientWidth`: 390,
  - Mission Hub wraps correctly with no right-side crop.
- Screenshots updated:
  - `docs/design/visual-audit/screenshots/dashboard-quest-v1-desktop.png`
  - `docs/design/visual-audit/screenshots/dashboard-quest-v1-mobile.png`
- Note: the previous `localhost:3001` QA tab was controlled by an old dev service worker and served stale chunks. Batch 24 fixes the root cause by preventing SW registration in development and cleaning same-origin dev registrations on load.

## 25. Implementation Batch: Reward Result Loop v1

### 25.1 Prompt Engineer

```text
Use case: code implementation after Dashboard Mission Hub.
Feature: Build the first shared Reward Result Loop for high-frequency learning results.
Primary request: Make completed practice feel like a clear game loop: result -> reward -> next quest/action.
Brand constraint: Continue Fuxie Bright Sky. Sky-blue and teal are the default brand/action language; amber is only for reward/achievement/urgency; red is only for weak/error states.
Learning constraint: Every result surface should answer what the learner did well, what reward they earned, how this helps progress, and what to do next.
Scope for this batch: Vocabulary Practice Result and Listening Lesson Result only.
Avoid: DB schema changes, public API changes, scoring changes, XP/streak logic changes, persisted reward claiming, or invented next-lesson routing.
Acceptance criteria: shared result-loop component, Vocabulary and Listening use it, existing answer breakdown/transcript behavior remains, typecheck/lint/build pass, and browser QA checks desktop/mobile result surfaces.
```

### 25.2 Backlog Truoc Khi Code

P0:

- Add shared `ResultRewardLoop` in gamification UI.
- Support internal result-loop shape: skill, score/accuracy/xp, attempt meta, reward preview, primary action, secondary action, optional Dashboard action.
- Upgrade Vocabulary result hero to show score, reward preview, streak/unlock hint, and next action while keeping answer breakdown.
- Upgrade Listening result hero to show score, earned XP, time/listen stats, coach copy, and next action while keeping question review and transcript.

P1:

- Reuse existing Fuxie primitives and mascot/coach language.
- Keep all action handlers/routes unchanged: retry still retries, new theme/listening hub still use existing callbacks.
- Keep mobile layout stable at about 390px and avoid text overflow.

P2:

- Roll the same result loop into Reading/Writing/Exam after this v1 is visually and behaviorally stable.
- Later attach persisted reward-claim states if product direction confirms a full reward engine.

### 25.3 Da Trien Khai Trong Batch Nay

- Added shared `ResultRewardLoop` for completed learning sessions:
  - supports skill, score/accuracy, XP, attempt metrics, reward preview, primary/secondary/Dashboard actions.
  - reuses Fuxie Bright Sky, `FuxieCoach`, `RewardPreview`, `FuxieProgressBar`, and `fuxieButtonClass`.
- Vocabulary Practice result now starts with a game loop:
  - score ring, result copy, XP/streak/unlock reward strip, next action, retry, Dashboard link, and Fuxie coach.
  - answer breakdown stays below the hero.
  - duplicate legacy CTA buttons were removed after the breakdown.
- Listening Lesson result now starts with the same game loop:
  - score ring, earned XP from submit API, time/listen/accuracy metrics, reward strip, next action, retry, Dashboard link, and Fuxie coach.
  - answer review and transcript toggle stay below the hero.
  - result type now includes `xpEarned`; transcript lines are typed instead of `any`.
- Text polish:
  - reward labels shortened to avoid truncation.
  - result metric cards wrap instead of cutting important values.

### 25.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint on result loop, Vocabulary result, Listening player: pass, 0 warnings/errors.
- `pnpm --filter @fuxie/web build`: pass.
- Build note:
  - first build hit a stale `.next` manifest error for `/review`.
  - cleared only `apps/web/.next` build artifact after path verification.
  - clean build then passed and generated all 69 app routes.
- Browser QA on clean dev origin `http://localhost:3003`:
  - `/vocabulary/practice/mixed?theme=a1-person&level=A1`: completed a mixed practice session; result loop rendered with `Vocabulary quest`, score ring, reward strip, Fuxie coach, CTA `Chu de moi`, `Luyen lai`, `Ve Dashboard`, and answer breakdown.
  - `/listening/L-A1-GOETHE-001-T1`: completed a listening lesson; result loop rendered with `Perfect run`, `Listening quest`, XP reward, time/listen/accuracy metrics, CTA `Bai nghe tiep theo`, `Nghe lai`, `Ve Dashboard`, and answer review.
  - Fresh console errors for `localhost:3003`: 0.
  - Observed warnings only: existing vocabulary LCP image priority warning and vocabulary submit fallback warning from local/dev auth path.
- Mobile-specific browser viewport QA is still pending in this batch because the in-app browser runtime did not expose viewport resizing; component classes were adjusted to use single-column/mobile-safe defaults.

## 26. Implementation Batch: Fuxie Economy And Mission System v1

### 26.1 Prompt Engineer

```text
Use case: evolve Fuxie gamification from reward UI into a real learning economy.
Feature: add XP level visibility, Fucoin wallet, immutable Fucoin ledger, and daily/monthly/quarterly mission board.
Primary request: Learners should see what they earn after learning, how XP progresses their level, how Fucoin can later unlock rewards, and which missions are worth finishing today/month/quarter.
Economy rule: XP is progression; Fucoin is spendable economy. Do not mix the two meanings.
Scope for this batch: persisted wallet/ledger, mission definitions/progress/claim, Dashboard Mission Control, and Fucoin reward preview for Vocabulary + Listening result screens.
Avoid: real reward redemption, paid/gift fulfillment, changing scoring, changing SRS/streak logic, or locking existing lessons behind Fucoin.
Acceptance criteria: Fucoin awards are idempotent, missions can be claimed once per period, Dashboard shows wallet/XP/mission periods, result screens show Fucoin, typecheck/lint/build/unit tests pass, and browser QA checks desktop/mobile.
```

### 26.2 Backlog Truoc Khi Code

P0:

- Add Prisma tables for `UserWallet`, `FucoinLedger`, `MissionDefinition`, and `UserMissionClaim`.
- Add `awardFucoin()` and learning reward helpers with source-level idempotency.
- Add mission board builder for daily/monthly/quarterly progress.
- Add APIs for wallet, mission board, and mission claim.
- Add Dashboard Mission Control with Fucoin wallet, XP level bar, period tabs, claimable missions, and locked shop preview.
- Extend Vocabulary and Listening submit/result flow with `fucoinEarned` and `walletBalance`.

P1:

- Seed default daily/monthly/quarterly missions.
- Add focused tests for wallet idempotency, daily cap, mission progress, and claimed state.
- Keep Fuxie Bright Sky color roles: blue/teal default, amber for Fucoin/reward, red only errors.

P2:

- Roll Fucoin result loop into Reading/Writing/Exam/SRS.
- Build real reward catalog and redemption/unlock flow after the economy ledger proves stable.
- Add admin adjustment tools for manual Fucoin support cases.

### 26.3 Da Trien Khai Trong Batch Nay

- Added persisted economy schema and migration:
  - `user_wallets`
  - `fucoin_ledger`
  - `mission_definitions`
  - `user_mission_claims`
- Added default mission seed set:
  - daily study minutes, daily practice, daily SRS.
  - monthly active days, monthly study minutes.
  - quarterly XP and quarterly exam attempts.
- Added internal economy services:
  - `awardFucoin()` writes ledger first and updates wallet only once.
  - `awardLearningFucoin()` applies a repeatable learning daily cap.
  - `calculateLearningFucoin()` separates activity, lesson, writing, exam attempt/pass amounts.
- Added Mission Board service:
  - calculates daily/monthly/quarterly progress from `DailyActivity` and exam attempts.
  - exposes mission status: active, claimable, claimed.
  - mission claim grants Fucoin + XP once per period.
- Added APIs:
  - `GET /api/v1/rewards/wallet`
  - `GET /api/v1/missions`
  - `POST /api/v1/missions/[missionId]/claim`
- Dashboard now has Mission Control:
  - Fucoin wallet.
  - XP level progress bar.
  - daily/monthly/quarterly tabs.
  - claimable mission cards.
  - locked shop preview for future reward redemption.
- Vocabulary and Listening result loops now show Fucoin reward beside XP/streak.

### 26.4 QA Ket Qua

- `pnpm --filter @fuxie/database exec prisma generate`: pass.
- Local dev DB:
  - `prisma migrate dev` could not run because the existing local DB had app tables but no migration history, and the shadow DB failed on the older performance migration.
  - Baseline local migration history for `init` and `add_performance_indexes`, then applied `20260429103000_add_fuxie_economy` with `prisma migrate deploy`.
- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/fucoin.test.ts src/lib/gamification/missions.test.ts`: pass, 6/6 tests.
- Targeted ESLint for vocabulary submit, submit hook, reward loop, and vocabulary result: pass.
- `pnpm --filter @fuxie/web build`: pass, 71 routes generated.
- Browser QA on `http://localhost:3003`:
  - `/dashboard`: Mission Control renders wallet, XP level bar, daily/monthly/quarterly mission board, claim states, and locked Fucoin shop preview; fresh console errors for `localhost:3003`: 0.
  - `/listening/L-A1-GOETHE-001-T1`: completed lesson result renders `+7 Fucoin`, wallet value, XP reward, answer review, next quest CTA, and no fresh console errors.
  - `/vocabulary/practice/mixed?theme=a1-person&level=A1`: first QA exposed a server-side whitelist gap where `mixed` submitted through local fallback and showed `+0 Fucoin`; fixed `VALID_TYPES` to include `mixed`, then completed a fresh run with API-backed result showing `+5 Fucoin` and wallet update.
- Known scope left for later batches:
  - Real shop redeem/unlock remains intentionally locked/preview-only.
  - Reading/Writing/Exam/SRS Fucoin rollout stays P2 after the economy core proves stable.

## 27. Implementation Batch: Fucoin Claim And Shop Preview Polish v1

### 27.1 Prompt Engineer

```text
Use case: polish the newly persisted Fuxie economy so learners understand the earn -> claim -> save -> shop teaser loop.
Feature: clarify mission claim states, daily Fucoin cap, wallet history, and result-screen zero-Fucoin reasons.
Brand constraint: keep Fuxie Bright Sky. Blue/teal remain action and learning colors; amber is reserved for Fucoin/reward/claim; red only for real error/locked danger.
Learning constraint: a learner should never interpret `+0 Fucoin` as a broken lesson. The UI must explain duplicate/cap cases in friendly language while keeping XP/progress motivation intact.
Scope for this batch: Dashboard Mission Control polish, wallet daily cap and recent ledger, API response metadata for learning Fucoin, and Vocabulary/Listening result copy.
Avoid: new DB schema, real shop redemption, paid/gift fulfillment, lesson locking, or changing scoring/SRS/streak behavior.
Acceptance criteria: typecheck/lint/build pass, existing economy unit tests pass, Dashboard shows cap/history/claim feedback, result screens distinguish earned/capped/duplicate Fucoin, and browser QA verifies Dashboard + Vocabulary/Listening.
```

### 27.2 Backlog Truoc Khi Code

P0:

- Add daily learning Fucoin cap summary from ledger: earned today, cap, remaining, cap reached.
- Extend learning submit responses with Fucoin metadata: duplicate, intended amount, daily cap, daily earned, daily remaining, cap reached.
- Dashboard Mission Control:
  - show `Fucoin hom nay x/60`,
  - show claim success inline,
  - keep mission states readable: ready, in progress, claim, claimed, locked.
- ResultRewardLoop consumers:
  - show normal `+N Fucoin` when earned,
  - show "Da nhan Fucoin" for duplicate,
  - show "Du Fucoin hom nay" for daily cap,
  - never leave unexplained `+0 Fucoin`.

P1:

- Show recent wallet ledger in Dashboard side rail.
- Make shop preview feel closer to a future catalog while keeping all actions locked.
- Add wallet API daily cap summary for future lightweight wallet widgets.

P2:

- Real reward catalog and redeem flow.
- Fucoin rollout for Reading/Writing/Exam/SRS.
- Admin adjustment and ledger inspection tools.

### 27.3 Da Trien Khai Trong Batch Nay

- `fucoin.ts`:
  - added `getLearningFucoinDailyProgress`.
  - `awardLearningFucoin` now returns intended amount, daily cap, remaining amount, duplicate state, and cap reached state.
- Wallet API now returns `dailyFucoin` next to wallet, XP level, and recent ledger.
- Vocabulary and Listening submit APIs now return Fucoin reason metadata.
- Dashboard Mission Control:
  - added daily cap mini stat and progress bar.
  - added inline claim success message.
  - added recent wallet history list from immutable ledger.
  - clarified mission CTA copy: `Bat dau`, `Tiep`, `Nhan`, `Da nhan`.
- Vocabulary and Listening result loops now explain duplicate/cap cases instead of showing unexplained zero reward.

### 27.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/fucoin.test.ts src/lib/gamification/missions.test.ts`: pass, 6/6 tests.
- Targeted ESLint for economy services, mission types, wallet/vocabulary/listening APIs, Dashboard, result components, submit hook: pass.
- `pnpm --filter @fuxie/web build`: pass, 71 routes generated.
- Browser QA:
  - Existing `localhost:3003` dev server returned a stale 500 after build, so a clean dev server was started on `http://localhost:3004`; `/api/v1/health` returned `status: ok`, `db: connected`.
  - `/dashboard`: Mission Control, `Fucoin hom nay`, recent wallet history, and locked Fucoin shop preview render; fresh console errors for `localhost:3004`: 0.
  - `/vocabulary/practice/mixed?theme=a1-person&level=A1`: completed a fresh mixed session; result renders `+5 Fucoin`, wallet balance, reward panel, and answer breakdown; fresh console errors for `localhost:3004`: 0.

## 28. Implementation Batch: Shop Catalog v1

### 28.1 Prompt Engineer

```text
Use case: turn the locked Fucoin teaser into a believable shop catalog while keeping redemption disabled.
Feature: define shop categories, item prices, learner-facing benefits, affordability progress, and locked redeem state.
Brand constraint: Fuxie Bright Sky remains the default. Amber is reward/Fucoin/affordability; blue/teal is progress/action; red is not used for normal locked shop previews.
Learning constraint: shop items should motivate continued learning without promising real fulfillment yet. The learner should understand what Fucoin is for, how close they are, and that redeem is coming later.
Scope for this batch: internal shop catalog service, read-only shop API, Dashboard catalog preview, and tests.
Avoid: DB schema, ledger spend transactions, actual redeem, lesson locking, shipping/gift workflows, or changing wallet balances.
Acceptance criteria: catalog is deterministic, every item is locked preview-only, Dashboard shows category/price/progress/benefit, API returns catalog data, typecheck/lint/build/tests pass, browser QA verifies Dashboard.
```

### 28.2 Backlog Truoc Khi Code

P0:

- Create internal `shop.ts` with catalog items:
  - cosmetic mascot item,
  - learning unlock item,
  - hint/support item,
  - future real gift preview.
- Compute wallet affordability:
  - `canAfford`,
  - `walletProgress`,
  - `statusLabel`.
- Keep all items `preview_locked`; no redeem button and no spend ledger.
- Replace Dashboard side teaser with richer catalog cards.

P1:

- Add `GET /api/v1/rewards/shop` for future shop page.
- Add unit tests for catalog sorting, progress, and locked status.
- Update audit doc and QA notes.

P2:

- Dedicated `/rewards/shop` page.
- Real reward catalog DB.
- Redeem flow with immutable spend ledger and admin approval controls.

### 28.3 Da Trien Khai Trong Batch Nay

- Added `apps/web/src/lib/gamification/shop.ts`:
  - deterministic catalog,
  - categories: mascot, unlock, hint, gift,
  - wallet progress and affordability labels,
  - preview-locked status for every item.
- Added `GET /api/v1/rewards/shop`.
- Dashboard Mission Control shop rail now shows:
  - item category,
  - Fucoin price,
  - benefit,
  - wallet progress bar,
  - locked icon and progress percent.
- Added `shop.test.ts` for catalog behavior.

### 28.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/fucoin.test.ts src/lib/gamification/missions.test.ts src/lib/gamification/shop.test.ts`: pass, 8/8 tests.
- Targeted ESLint for shop service/test, missions, mission types, shop API, Dashboard: pass.
- `pnpm --filter @fuxie/web build`: pass, 72 routes generated including `/api/v1/rewards/shop`.
- Browser QA:
  - Clean dev server started on `http://localhost:3005`; `/api/v1/health` returned `status: ok`, `db: connected`.
  - `/dashboard`: `Fucoin shop v1`, `Streak Freeze`, `Fuxie Sky Outfit`, category chips, locked icons, price labels, and wallet progress render; fresh console errors for `localhost:3005`: 0.
  - `/api/v1/rewards/shop`: authenticated API returns wallet, daily Fucoin, and catalog items with `preview_locked` status.

## 29. Implementation Batch: Dedicated Shop Page v1

### 29.1 Prompt Engineer

```text
Use case: make Fucoin feel like a real long-term progression system by giving learners a dedicated shop page.
Feature: create `/rewards/shop` with wallet summary, daily cap, category filters, full catalog cards, affordability progress, and locked redeem state.
Brand constraint: keep Fuxie Bright Sky. Use amber only for Fucoin/reward/affordability, blue/teal for progress and navigation, and avoid red for normal locked states.
Learning constraint: the shop should motivate more learning without creating false promises. Every item must clearly say redeem is locked and coming later.
Scope for this batch: page route, client filter UI, Dashboard link to shop page, QA/documentation.
Avoid: DB schema, spend ledger, real redeem, gift fulfillment, admin tools, or locking lessons behind Fucoin.
Acceptance criteria: `/rewards/shop` renders inside learner shell, catalog filters work, all items remain preview locked, Dashboard links to the page, typecheck/lint/build pass, and browser QA verifies dashboard -> shop.
```

### 29.2 Backlog Truoc Khi Code

P0:

- Add `/rewards/shop` learner route.
- Build `ShopCatalogClient`:
  - wallet summary,
  - daily Fucoin cap summary,
  - next target panel,
  - category filters,
  - catalog cards with price/progress/benefit/locked state.
- Link Dashboard shop rail to `/rewards/shop`.

P1:

- Browser QA Dashboard -> Shop navigation.
- Validate mobile-safe card layout.
- Keep API and page using the same `shop.ts` catalog service.

P2:

- Dedicated shop sidebar/mobile nav item after product direction is stable.
- Real redeem flow with spend ledger and approval controls.
- Admin-configurable reward catalog.

### 29.3 Da Trien Khai Trong Batch Nay

- Added `apps/web/src/app/(learn)/rewards/shop/page.tsx`.
- Added `ShopCatalogClient` with category filters and full catalog cards.
- Dashboard shop rail now links to `/rewards/shop`.
- All catalog items remain `preview_locked`; there is no redeem button and no wallet mutation.

### 29.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/shop.test.ts src/lib/gamification/fucoin.test.ts src/lib/gamification/missions.test.ts`: pass, 8/8 tests.
- Targeted ESLint for `shop-catalog-client.tsx`, `/rewards/shop/page.tsx`, Dashboard client, and shop service: pass.
- `pnpm --filter @fuxie/web build`: pass, 73 app routes generated including `/rewards/shop`.
- `git diff --check` for touched Batch 29 files: pass; existing dashboard file reports CRLF normalization warning only.
- Browser QA:
  - Clean dev server started on `http://localhost:3006`; `/api/v1/health` returned `status: ok`, `db: connected`.
  - `/dashboard`: `Xem shop catalog` link renders once and navigates to `/rewards/shop`; console errors: 0.
  - `/rewards/shop`: wallet badge, hero stats, daily cap, next target, filters `Tat ca / Hint / Mascot / Unlock / Gift`, locked catalog cards, price labels, progress bars, and Vietnamese copy render correctly.
  - Mascot filter shows `Fuxie Sky Outfit` and hides other catalog item descriptions; console errors: 0.
  - Mobile 390px Chrome QA: page renders, Mascot filter works, no main content overflow found except intended horizontal filter tab rail.

## 30. Implementation Batch: Redeem Flow Spec + Guarded UX v1

### 30.1 Prompt Engineer

```text
Use case: make the Fucoin shop feel closer to a real economy without allowing unsafe spending yet.
Feature: add a guarded redeem preview flow for each catalog item. Learners can inspect cost, wallet progress, unlock condition, and safety policy before redeem is available.
Safety constraint: no wallet mutation, no spend ledger, no API submit, no fulfillment, no real gift claim, and no lesson locking in this batch.
UX constraint: the modal must be explicit that redeem is still locked. The disabled redeem button is a state preview only, not a transaction.
Brand constraint: keep Fuxie Bright Sky. Use amber for Fucoin/reward state, blue/teal for progress and guard surfaces, neutral gray for locked state.
Acceptance criteria: shop cards expose preview CTAs, modal explains cost/progress/policy, disabled redeem state is visible, no console errors, typecheck/lint/build pass, and catalog tests cover the new redeem preview contract.
```

### 30.2 Backlog Truoc Khi Code

P0:

- Extend shop catalog contract with `redeemPreview`.
- Add card CTA:
  - `Xem điều kiện đổi` when wallet is not enough.
  - `Xem flow đổi quà` when wallet is enough.
- Add modal with wallet, price, progress, guard policy, and disabled redeem state.
- Keep all items `preview_locked`.

P1:

- Unit test redeem preview contract.
- Browser QA desktop and mobile.
- Keep Dashboard preview unchanged except for consuming the richer catalog type.

P2:

- Real `POST /api/v1/rewards/shop/[itemId]/redeem` with spend ledger.
- Pending/approved/rejected redeem states.
- Admin fulfillment and reward catalog management.

### 30.3 Da Trien Khai Trong Batch Nay

- `shop.ts` now includes `FuxieShopRedeemPreview` with:
  - stage,
  - CTA label,
  - confirmation copy,
  - next milestone,
  - guard policy.
- Shop cards now show guarded preview CTA.
- `/rewards/shop` now has a modal:
  - item cost and wallet progress,
  - clear missing Fucoin message,
  - policy bullets explaining no spend in v1,
  - disabled `Redeem thật đang khóa` button.
- No DB schema, API mutation, wallet spend, ledger spend, fulfillment, or lesson lock was added.

### 30.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/shop.test.ts src/lib/gamification/fucoin.test.ts src/lib/gamification/missions.test.ts`: pass, 8/8 tests.
- Targeted ESLint for shop client, shop service, shop tests, and `/rewards/shop/page.tsx`: pass.
- `git diff --check` for touched Batch 30 files: pass.
- `pnpm --filter @fuxie/web build`: pass, 73 app routes generated.
- Browser QA:
  - Clean dev server started on `http://localhost:3007`; `/api/v1/health` returned `status: ok`, `db: connected`.
  - `/rewards/shop`: `Redeem Guard v1` badge, six preview CTAs, and locked catalog cards render; console errors: 0.
  - Opening `Streak Freeze` preview shows `Flow đổi quà`, wallet/cost/progress, guard policy, and disabled `Redeem thật đang khóa`; console errors: 0.
  - Closing modal via `Đã hiểu` removes the dialog.
  - Mobile 390px Chrome QA: modal opens and text renders; only intended horizontal filter tab rail overflows.

## 31. Implementation Batch: Real Redeem Backend Contract v1

### 31.1 Prompt Engineer

```text
Use case: prepare the Fucoin shop for real redeem without opening spend behavior too early.
Feature: add a guarded backend contract for `POST /api/v1/rewards/shop/[itemId]/redeem`.
Safety constraint: the route must not mutate wallet, create spend ledger, fulfill gifts, unlock lessons, or approve redemptions while redeem is disabled.
Contract constraint: responses must include wallet, item, would-spend amount, missing Fucoin, confirmation requirement, guard reason, and policy.
Failure constraint: unknown items return typed 404; preview-locked items return typed 423 Locked.
Acceptance criteria: unit tests prove locked contract, missing Fucoin, unknown item behavior, and build lists the new dynamic API route.
```

### 31.2 Backlog Truoc Khi Code

P0:

- Add redeem guard service with `buildShopRedeemPreviewContract`.
- Add typed `ShopRedeemError`.
- Add dynamic API route:
  - `POST /api/v1/rewards/shop/[itemId]/redeem`.
- Return `423 Locked` for existing items while `FUXIE_SHOP_REDEEM_ENABLED = false`.
- Return `404` for unknown item ids.

P1:

- Add unit tests for:
  - locked preview contract,
  - enough wallet but still locked,
  - missing Fucoin,
  - unknown item.
- API QA with authenticated dev session.
- Verify wallet balance and `lifetimeSpent` do not change after calling the redeem route.

P2:

- Spend ledger implementation behind an explicit feature flag.
- Pending/approved/rejected redeem records.
- Admin review and fulfillment tools.

### 31.3 Da Trien Khai Trong Batch Nay

- Added `apps/web/src/lib/gamification/redeem.ts`.
- Added `apps/web/src/lib/gamification/redeem.test.ts`.
- Added `apps/web/src/app/api/v1/rewards/shop/[itemId]/redeem/route.ts`.
- Added `getFuxieShopCatalogItem()` helper to `shop.ts`.
- Route behavior:
  - authenticated user required,
  - existing item returns `423 Locked`,
  - payload includes wallet, item, missing Fucoin, `wouldSpend`, `confirmationRequired`, and guard policy,
  - unknown item returns `404` with `code: not_found`,
  - no wallet mutation and no spend ledger mutation.

### 31.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/shop.test.ts src/lib/gamification/redeem.test.ts src/lib/gamification/fucoin.test.ts src/lib/gamification/missions.test.ts`: pass, 11/11 tests.
- Targeted ESLint for shop, redeem service, redeem tests, and dynamic redeem route: pass.
- `git diff --check` for touched Batch 31 files: pass.
- `pnpm --filter @fuxie/web build`: pass; route list includes `/api/v1/rewards/shop/[itemId]/redeem`.
- API QA:
  - Clean dev server started on `http://localhost:3008`; `/api/v1/health` returned `status: ok`, `db: connected`.
  - `POST /api/v1/rewards/shop/streak-freeze/redeem` returned `423` with `redeemEnabled: false`, `status: preview_locked`, `wouldSpend: 120`, `missingFucoin: 103`.
  - `POST /api/v1/rewards/shop/missing-item/redeem` returned `404` with `code: not_found`.
  - Wallet stayed unchanged after redeem call: `balance 17 -> 17`, `lifetimeSpent 0 -> 0`.

## 32. Implementation Batch: Redeem Pending Model v1

### 32.1 Prompt Engineer

```text
Use case: turn the Fucoin shop from preview-only into a request-based economy surface while keeping spend and fulfillment locked.
Feature: add a persistent `ShopRedeemRequest` model with pending/approved/rejected/cancelled status.
Safety constraint: creating a pending request must not spend Fucoin, create a SPEND ledger row, unlock lessons, or fulfill gifts.
Contract constraint: pending request stores item id/title/category/benefit, cost, wallet balance at request time, item snapshot, status reason, and timestamps.
Idempotency constraint: a learner can have only one pending request for the same item.
Acceptance criteria: migration is generated/applied locally, Prisma client is generated, tests cover pending creation, duplicate pending, insufficient funds, and unknown item behavior.
```

### 32.2 Backlog Truoc Khi Code

P0:

- Add Prisma enum `ShopRedeemRequestStatus`.
- Add model `ShopRedeemRequest`.
- Add migration `20260429162000_add_shop_redeem_requests`.
- Export new enum/model from database package.
- Update redeem service to create pending request only when wallet can afford item.

P1:

- Keep `spendEnabled: false`.
- Return `402 insufficient_funds` when wallet is not enough.
- Return existing pending request instead of creating duplicates.
- Add unit tests for request creation and idempotency.

P2:

- Admin review API.
- Approval flow that creates immutable `SPEND` ledger.
- Fulfillment/unlock execution after approval.

### 32.3 Da Trien Khai Trong Batch Nay

- Added `ShopRedeemRequestStatus` enum:
  - `PENDING`,
  - `APPROVED`,
  - `REJECTED`,
  - `CANCELLED`.
- Added `shop_redeem_requests` table:
  - `userId`,
  - `itemId`,
  - item copy fields,
  - `cost`,
  - `walletBalanceAtRequest`,
  - `status`,
  - `statusReason`,
  - `itemSnapshot`,
  - request/review/fulfillment timestamps.
- Added unique guard: one request per `userId + itemId + status`.
- Updated `createShopRedeemRequest()`:
  - enough wallet: creates or returns pending request,
  - insufficient wallet: returns typed `402`,
  - no spend ledger and no wallet mutation.
- Updated dynamic redeem API to return:
  - `202` for new pending request,
  - `200` for existing pending request,
  - `402` for insufficient Fucoin,
  - `404` for missing item.

### 32.4 QA Ket Qua

- `pnpm --filter @fuxie/database db:generate`: pass after stopping stale local `next dev` processes that held Prisma engine DLL.
- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/redeem.test.ts src/lib/gamification/shop.test.ts src/lib/gamification/fucoin.test.ts src/lib/gamification/missions.test.ts`: pass, 13/13 tests.
- Targeted ESLint for redeem/shop service, redeem tests, and dynamic route: pass.
- `git diff --check` for touched Batch 32 files: pass; Prisma/client files report CRLF normalization warnings only.
- `pnpm --filter @fuxie/web build`: pass; route list includes `/api/v1/rewards/shop/[itemId]/redeem`.
- `pnpm --filter @fuxie/database exec prisma migrate deploy`: pass on local `fuxie_dev`; migration `20260429162000_add_shop_redeem_requests` applied.
- `pnpm --filter @fuxie/database exec prisma migrate status`: database schema is up to date.
- API QA on clean dev server `http://localhost:3009`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
  - `POST /api/v1/rewards/shop/streak-freeze/redeem`: returned `402 insufficient_funds` for current learner wallet.
  - Response included `spendEnabled: false`, `wouldSpend: 120`, `missingFucoin: 103`.
  - Wallet stayed unchanged after API call: `balance 17 -> 17`, `lifetimeSpent 0 -> 0`.

## 33. Implementation Batch: Admin Redeem Review v1

### 33.1 Prompt Engineer

```text
Use case: give Fuxie admins visibility and control over pending Fucoin redeem requests.
Feature: add admin-only list and review APIs plus `/admin/rewards` review screen.
Safety constraint: approve/reject only changes request status and reason. It must not spend Fucoin, create a SPEND ledger entry, fulfill gifts, unlock lessons, or send external messages.
Role constraint: admin reward review is ADMIN only, even though the broader admin shell allows teacher access.
UX constraint: the page must make the guardrail visible: approval is for future fulfillment only.
Acceptance criteria: admin can list pending requests, approve/reject pending requests, non-pending requests are rejected with a typed conflict, empty state renders, and build lists the new admin page/API routes.
```

### 33.2 Backlog Truoc Khi Code

P0:

- Add admin redeem service:
  - list pending redeem requests,
  - approve/reject pending request,
  - block non-pending review.
- Add admin APIs:
  - `GET /api/v1/admin/rewards/redeem-requests`,
  - `PATCH /api/v1/admin/rewards/redeem-requests/[requestId]`.
- Add `/admin/rewards` page and sidebar item.

P1:

- Unit test list/review/non-pending behavior.
- API QA admin-only routes.
- Browser QA empty state and guardrail copy.

P2:

- Admin filters for approved/rejected/cancelled.
- Review reason input in UI.
- Fulfillment queue and spend ledger approval in a later guarded batch.

### 33.3 Da Trien Khai Trong Batch Nay

- Added `apps/web/src/lib/gamification/admin-redeem.ts`.
- Added `apps/web/src/lib/gamification/admin-redeem.test.ts`.
- Added admin API routes:
  - `apps/web/src/app/api/v1/admin/rewards/redeem-requests/route.ts`,
  - `apps/web/src/app/api/v1/admin/rewards/redeem-requests/[requestId]/route.ts`.
- Added admin page:
  - `apps/web/src/app/admin/rewards/page.tsx`,
  - `apps/web/src/app/admin/rewards/RewardsReviewClient.tsx`.
- Added `Reward Review` sidebar entry.
- Approval/rejection updates only:
  - `status`,
  - `statusReason`,
  - `reviewedAt`.
- No wallet mutation, no `SPEND` ledger, no fulfillment, no unlock, and no external communication.

### 33.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/admin-redeem.test.ts src/lib/gamification/redeem.test.ts src/lib/gamification/shop.test.ts src/lib/gamification/fucoin.test.ts src/lib/gamification/missions.test.ts`: pass, 16/16 tests.
- Targeted ESLint for admin redeem service/tests, admin routes, admin page/client, and admin sidebar: pass.
- `git diff --check` for touched Batch 33 files: pass; admin layout reports CRLF normalization warning only.
- `pnpm --filter @fuxie/web build`: pass; route list includes:
  - `/admin/rewards`,
  - `/api/v1/admin/rewards/redeem-requests`,
  - `/api/v1/admin/rewards/redeem-requests/[requestId]`.
- API QA on clean dev server `http://localhost:3010`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
  - `GET /api/v1/admin/rewards/redeem-requests` as dev admin returned `200` with current empty list.
  - `PATCH /api/v1/admin/rewards/redeem-requests/missing-request-id` returned `404` with `code: not_found`.
- Browser QA:
  - `/admin/rewards` renders `Reward Review`, sidebar item, guardrail copy, pending count, and empty state.
  - Console errors: 0.

## 34. Implementation Batch: Learner Redeem Request UX v1

### 34.1 Prompt Engineer

```text
Use case: let learners understand and start the Fucoin redeem request flow from the shop without making redeem/spend real yet.
Feature: connect the shop modal to the existing `POST /api/v1/rewards/shop/[itemId]/redeem` contract.
Safety constraint: creating or attempting a request must not spend Fucoin, create a SPEND ledger entry, fulfill gifts, unlock lessons, or send external communication.
UX constraint: if the wallet is not enough, show exactly how many Fucoin are still needed. If the wallet is enough, create or reuse a pending request and show that it is waiting for admin review.
Acceptance criteria: learner shop shows pending-request copy, insufficient wallet keeps CTA disabled in UI, backend returns typed 402 for insufficient funds, and wallet balance/lifetimeSpent stay unchanged.
```

### 34.2 Backlog Truoc Khi Code

P0:

- Update shop catalog copy and CTA labels for request-based redeem.
- Add client-side redeem feedback state in `/rewards/shop`.
- Wire modal action to `POST /api/v1/rewards/shop/[itemId]/redeem`.
- Show success, existing-pending, insufficient-funds, and generic-error states.
- Keep insufficient-wallet CTA disabled in the modal.

P1:

- Preserve all Batch 31-33 guardrails:
  - no wallet spend,
  - no `SPEND` ledger,
  - no fulfillment,
  - no unlock,
  - no external communication.
- Update shop unit test expectations.
- Browser QA for learner shop and modal.

P2:

- Enough-wallet browser fixture for creating a visible pending request.
- Pending request history for learners.
- Spend/fulfillment flow after explicit approval in a later guarded batch.

### 34.3 Da Trien Khai Trong Batch Nay

- Updated `apps/web/src/lib/gamification/shop.ts`:
  - CTA is now request-based:
    - enough wallet: `Tao request doi qua`,
    - insufficient wallet: `Xem dieu kien doi`.
  - Policy copy clearly says pending request does not subtract Fucoin.
- Updated `apps/web/src/components/gamification/shop-catalog-client.tsx`:
  - added `redeemFeedbackByItem`,
  - modal calls the redeem API,
  - handles `pending_created`, `pending_existing`, `insufficient_funds`, and error states,
  - disabled CTA when wallet is insufficient or request is in flight.
- Updated `apps/web/src/lib/gamification/shop.test.ts`.
- No schema, scoring, wallet-spend, ledger-spend, fulfillment, or unlock changes in this batch.

### 34.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/shop.test.ts src/lib/gamification/redeem.test.ts src/lib/gamification/admin-redeem.test.ts src/lib/gamification/fucoin.test.ts src/lib/gamification/missions.test.ts`: pass, 16/16 tests.
- Targeted ESLint for shop client, shop service/test, redeem service, and redeem route: pass.
- `git diff --check` for Batch 34 touched files: pass.
- `pnpm --filter @fuxie/web build`: pass; route list still includes learner shop, admin rewards, and redeem APIs.
- Clean dev server on `http://localhost:3011`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
- Browser QA learner shop:
  - logged in through dev learner auth and opened `/rewards/shop`.
  - page shows `Pending Request v1`.
  - page shows the hero question: `Fucoin dung de mo phan thuong nao?`.
  - current learner wallet: 17 Fucoin.
  - catalog shows 6 `Xem dieu kien doi` CTAs and 0 `Tao request doi qua` CTAs, matching insufficient wallet state.
  - opening `Streak Freeze` modal shows cost 120, wallet 17, progress 14%, and `Can them 103 Fucoin`.
  - modal CTA `Chua du Fucoin` is disabled.
  - console errors: 0.
- API QA learner insufficient funds:
  - before wallet: `balance 17`, `lifetimeSpent 0`.
  - `POST /api/v1/rewards/shop/streak-freeze/redeem`: returned `402 insufficient_funds`.
  - response included `missingFucoin: 103`, `wouldSpend: 120`, `spendEnabled: false`, and the guard policy.
  - after wallet: `balance 17`, `lifetimeSpent 0`.

## 35. Implementation Batch: Learner Request History + Admin Review Polish

### 35.1 Prompt Engineer

```text
Use case: make Fucoin redeem feel trackable for learners and easier to operate for admins.
Feature: add learner-side redeem request history in `/rewards/shop`, then polish admin review with status filters and optional review reason.
Safety constraint: this batch must still not spend Fucoin, create SPEND ledger entries, fulfill gifts, unlock lessons, or send external communication.
State constraint: learner history is read-only except for inserting the pending request returned by the existing redeem API.
Admin constraint: approve/reject only changes request status/reason/reviewedAt. Filters must not imply fulfillment.
Acceptance criteria: learner can see recent request status, admin can filter pending/approved/rejected/cancelled/all, counts are visible, API supports `status=ALL`, and QA proves console is clean.
```

### 35.2 Backlog Truoc Khi Code

P0:

- Add learner request history query:
  - recent requests by user,
  - status,
  - item snapshot fields,
  - request/review timestamps.
- Render a learner history panel on `/rewards/shop`.
- Update client redeem success flow so created/existing pending request appears in the history panel.

P1:

- Add admin status counts.
- Extend admin list API to support `status=ALL`.
- Add admin status filter buttons:
  - Pending,
  - Approved,
  - Rejected,
  - Cancelled,
  - All.
- Add optional admin review reason input.

P2:

- Learner detail drawer for each request.
- Admin full audit timeline.
- Spend ledger approval and fulfillment queue in a later guarded batch.

### 35.3 Da Trien Khai Trong Batch Nay

- Updated `apps/web/src/lib/gamification/redeem.ts`:
  - expanded `ShopRedeemRequestSummary`,
  - added `listUserShopRedeemRequests()`.
- Updated `/rewards/shop` server page:
  - loads learner recent redeem requests together with wallet/catalog.
- Updated `apps/web/src/components/gamification/shop-catalog-client.tsx`:
  - added `LearnerRedeemHistory`,
  - shows pending count,
  - shows recent item/status/cost/reason cards,
  - upserts returned pending request after successful redeem API response.
- Updated `apps/web/src/lib/gamification/admin-redeem.ts`:
  - added `countShopRedeemRequestsByStatus()`.
- Updated admin API:
  - `GET /api/v1/admin/rewards/redeem-requests?status=ALL`,
  - response now includes `meta.status` and status counts.
- Rebuilt `/admin/rewards` client:
  - status filters,
  - total/pending/showing stats,
  - optional review reason,
  - disabled review actions for non-pending rows.
- No database/schema, wallet spend, SPEND ledger, fulfillment, unlock, scoring, or external messaging changes.

### 35.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/shop.test.ts src/lib/gamification/redeem.test.ts src/lib/gamification/admin-redeem.test.ts src/lib/gamification/fucoin.test.ts src/lib/gamification/missions.test.ts`: pass, 18/18 tests.
- Targeted ESLint for shop client, admin rewards client/page/API, redeem/admin-redeem services/tests: pass.
- `git diff --check` for Batch 35 touched files: pass.
- `pnpm --filter @fuxie/web build`: pass; route list includes `/rewards/shop`, `/admin/rewards`, and admin redeem APIs.
- Clean dev server on `http://localhost:3012`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
- Browser QA learner shop:
  - dev learner auth to `/rewards/shop`.
  - `Hàng chờ đổi quà của em` renders.
  - pending counter renders.
  - current insufficient catalog still shows 6 `Xem điều kiện đổi` CTAs.
  - current console errors for `localhost:3012`: 0.
- Browser QA admin rewards:
  - dev admin auth to `/admin/rewards`.
  - guardrail copy renders.
  - filters render: Pending, Approved, Rejected, Cancelled, All.
  - clicking Approved filter shows `Approved Redeem Requests`.
  - current console errors for `localhost:3012`: 0.
- API QA admin filters:
  - `GET /api/v1/admin/rewards/redeem-requests?status=PENDING`: `success: true`, `meta.status: PENDING`.
  - `GET /api/v1/admin/rewards/redeem-requests?status=ALL`: `success: true`, `meta.status: ALL`.

## 36. Implementation Batch: Spend Ledger Approval v1

### 36.1 Prompt Engineer

```text
Use case: make Fucoin redeem approval financially consistent inside the app economy.
Feature: when admin approves a pending redeem request, spend Fucoin through an immutable `SPEND` ledger and update the learner wallet in the same transaction.
Safety constraint: approval may spend Fucoin, but still must not fulfill gifts, unlock lessons, send messages, or deliver real rewards.
Atomicity constraint: request status, wallet decrement, lifetimeSpent increment, and spend ledger must succeed or fail together.
Idempotency constraint: spend source uses `sourceType=shop:redeem` and `sourceId=requestId` so the ledger cannot double-spend the same request.
Failure constraint: if learner wallet is no longer enough at approval time, return typed `402 insufficient_funds` and keep request pending with no ledger.
Acceptance criteria: unit tests cover spend success, insufficient spend block, reject without spend, API transaction approval, and browser copy makes the new spend behavior clear.
```

### 36.2 Backlog Truoc Khi Code

P0:

- Add `spendFucoin()` economy service:
  - validates positive amount,
  - checks wallet balance,
  - writes `FucoinLedgerType.SPEND`,
  - decrements `UserWallet.balance`,
  - increments `UserWallet.lifetimeSpent`,
  - uses unique `userId + sourceType + sourceId` to prevent duplicate spend.
- Update admin approve path:
  - run inside Prisma transaction,
  - spend Fucoin before marking request approved,
  - return typed insufficient-funds error if wallet is too low.

P1:

- Keep reject path no-spend.
- Update admin review copy so admins understand approve now spends Fucoin.
- Add tests for:
  - spend ledger success,
  - insufficient wallet block,
  - approve spends,
  - reject does not spend.

P2:

- Fulfillment queue.
- Real unlock/gift execution.
- Refund/cancel flow for approved but unfulfilled requests.

### 36.3 Da Trien Khai Trong Batch Nay

- Updated `apps/web/src/lib/gamification/fucoin.ts`:
  - added `SpendFucoinInput`,
  - added `SpendFucoinResult`,
  - added `FucoinSpendError`,
  - added `spendFucoin()`.
- Updated `apps/web/src/lib/gamification/admin-redeem.ts`:
  - approve now spends Fucoin through `sourceType: shop:redeem`,
  - insufficient wallet throws `AdminRedeemReviewError` with `code: insufficient_funds`,
  - reject remains no-spend.
- Updated admin review API route:
  - wraps review in `prisma.$transaction()`.
- Updated admin UI copy:
  - approval now clearly says it spends Fucoin through the ledger,
  - fulfillment/unlock remains locked.
- No schema/migration change.
- No fulfillment, unlock, gift delivery, or external messaging change.

### 36.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/fucoin.test.ts src/lib/gamification/admin-redeem.test.ts src/lib/gamification/redeem.test.ts src/lib/gamification/shop.test.ts src/lib/gamification/missions.test.ts`: pass, 22/22 tests.
- Targeted ESLint for economy, admin redeem service/tests, admin API route, and admin UI: pass.
- `git diff --check` for Batch 36 touched files: pass.
- `pnpm --filter @fuxie/web build`: pass.
- Clean dev server on `http://localhost:3013`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
- API QA approve success using local QA fixture:
  - before wallet: `balance 150`, `lifetimeSpent 0`.
  - `PATCH /api/v1/admin/rewards/redeem-requests/{requestId}` with `action=approve`: returned `200`, request `APPROVED`.
  - after wallet: `balance 30`, `lifetimeSpent 120`.
  - spend ledger exists: `amount 120`, `type SPEND`, `sourceType shop:redeem`, `sourceId requestId`.
  - request `fulfilledAt` remains `null`.
- API QA approve insufficient funds using local QA fixture:
  - before wallet: `balance 17`, `lifetimeSpent 0`.
  - approve returned `402`, `code: insufficient_funds`.
  - after wallet unchanged: `balance 17`, `lifetimeSpent 0`.
  - request stayed `PENDING`, `reviewedAt null`.
  - no spend ledger created.
- Browser QA admin rewards:
  - `/admin/rewards` shows updated copy: approval spends Fucoin through the ledger.
  - guardrail says gifts/unlocks are still not delivered.
  - current console errors for `localhost:3013`: 0.

## 37. Implementation Batch: Fulfillment Queue v1

### 37.1 Prompt Engineer

```text
Use case: after Fucoin has been spent on approve, admins need a safe place to track which approved requests still need manual delivery.
Feature: add an awaiting-fulfillment queue for approved redeem requests where `fulfilledAt` is null, and allow admins to mark a request fulfilled.
Safety constraint: mark-fulfilled only records manual completion. It must not create another spend ledger, refund, deliver gifts, unlock lessons, send messages, or call external systems.
State constraint: fulfilled state is represented by existing `fulfilledAt`; no schema or migration in this batch.
Learner constraint: learner history should distinguish approved-awaiting from fulfilled, so learners do not feel their Fucoin disappeared without a next state.
Acceptance criteria: API supports `status=FULFILLMENT`, admin UI shows Awaiting queue and Mark fulfilled action, fulfillment is idempotency-guarded, wallet/ledger do not change on fulfillment, and QA proves console clean.
```

### 37.2 Backlog Truoc Khi Code

P0:

- Extend admin redeem service:
  - list `APPROVED + fulfilledAt null`,
  - count awaiting fulfillment,
  - mark approved request fulfilled,
  - block fulfillment before approval,
  - block duplicate fulfillment.
- Extend admin list API:
  - `GET /api/v1/admin/rewards/redeem-requests?status=FULFILLMENT`.
- Extend admin PATCH API:
  - `action: fulfill`.

P1:

- Add admin filter button `Awaiting`.
- Show awaiting fulfillment stat.
- Show `Mark fulfilled` CTA for approved unfulfilled rows.
- Keep approve/reject actions only for pending rows.
- Update learner shop history:
  - approved + no `fulfilledAt` => awaiting,
  - approved + `fulfilledAt` => fulfilled.

P2:

- Fulfillment detail drawer.
- Fulfillment audit timeline.
- Real unlock/gift delivery by item type in a later guarded batch.
- Refund/cancel flow for approved but unfulfilled requests.

### 37.3 Da Trien Khai Trong Batch Nay

- Updated `apps/web/src/lib/gamification/admin-redeem.ts`:
  - added `AdminRedeemFulfillmentState`,
  - added `AdminRedeemQueueCounts`,
  - added `getAdminRedeemQueueCounts()`,
  - added `fulfillShopRedeemRequest()`,
  - added list filter for `awaiting` and `fulfilled`.
- Updated admin list API:
  - `status=FULFILLMENT` returns approved requests with `fulfilledAt null`,
  - `meta.counts.awaitingFulfillment` is returned with status counts.
- Updated admin PATCH API:
  - accepts `action: fulfill`,
  - calls `fulfillShopRedeemRequest()` inside transaction.
- Updated `/admin/rewards` UI:
  - added `Awaiting` filter,
  - added awaiting stat,
  - approved/unfulfilled rows can be marked fulfilled,
  - guardrail copy says fulfillment only records manual completion and does not auto-deliver/unlock.
- Updated learner shop history:
  - approved unfulfilled shows `Awaiting`,
  - fulfilled shows `Fulfilled`,
  - added awaiting count in the history panel.
- No database/schema migration, no extra spend ledger, no refund, no gift delivery, no unlock, no external communication.

### 37.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/admin-redeem.test.ts src/lib/gamification/fucoin.test.ts src/lib/gamification/redeem.test.ts src/lib/gamification/shop.test.ts src/lib/gamification/missions.test.ts`: pass, 25/25 tests.
- Targeted ESLint for admin redeem service/tests, admin APIs, admin page/client, and learner shop client: pass.
- `git diff --check` for Batch 37 touched files: pass.
- `pnpm --filter @fuxie/web build`: pass.
- Clean dev server on `http://localhost:3014`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
- API QA using local QA fixture:
  - before fulfillment: `meta.counts.awaitingFulfillment = 1`.
  - `PATCH /api/v1/admin/rewards/redeem-requests/{requestId}` with `action=fulfill`: returned `200`.
  - request stayed `APPROVED`, `fulfilledAt` was set.
  - wallet stayed unchanged: `balance 30`, `lifetimeEarned 150`, `lifetimeSpent 120`.
  - ledger count stayed `1`, so fulfillment did not spend again.
  - after fulfillment: `meta.counts.awaitingFulfillment = 0`.
- Browser QA admin rewards:
  - `/admin/rewards` shows new fulfillment copy.
  - `Awaiting` filter renders and opens `Awaiting Redeem Requests`.
  - guardrail copy says manual fulfillment does not auto-deliver gifts or unlock lessons.
  - current console errors for `localhost:3014`: 0.

## 38. Implementation Batch: Safe In-App Fulfillment v1

### 38.1 Prompt Engineer

```text
Use case: admins need the first safe in-app reward to become real after Fucoin has been spent and a redeem request is fulfilled.
Feature: when an approved `streak-freeze` request is marked fulfilled, grant the learner one available Streak Freeze inside `UserStreak`.
Safety constraint: unsupported shop items remain manual-record-only; do not unlock lessons, deliver gifts, send external messages, refund, or spend again.
Idempotency constraint: fulfillment must still be blocked when `fulfilledAt` already exists, so the same safe reward cannot be granted twice.
Accounting constraint: fulfillment must not create another Fucoin ledger entry or change wallet balance/lifetime totals.
Acceptance criteria: unit tests cover safe grant, manual fallback, duplicate fulfillment block, and no wallet/ledger side effects.
```

### 38.2 Backlog Truoc Khi Code

P0:

- Extend `fulfillShopRedeemRequest()` select with `userId`, `itemId`, and `itemTitle`.
- Add a guarded safe fulfillment adapter:
  - `streak-freeze` => `UserStreak.freezesAvailable += 1`,
  - unsupported items => manual record only.
- Keep existing approval, spend ledger, wallet, and request status behavior unchanged.

P1:

- Add unit tests for:
  - Streak Freeze grant on fulfillment,
  - unsupported item no-op fulfillment,
  - duplicate fulfilled request blocks before applying effects,
  - no extra spend ledger or wallet update.
- Update admin copy so operators understand safe in-app rewards may be granted automatically.

P2:

- Real unlock/delivery adapters for lesson unlocks, cosmetics, and external gifts.
- Fulfillment audit timeline by item effect.
- Admin refund/cancel flow for approved but unfulfilled requests.

### 38.3 Da Trien Khai Trong Batch Nay

- Updated `apps/web/src/lib/gamification/admin-redeem.ts`:
  - fulfillment now reads `userId`, `itemId`, `itemTitle`,
  - added safe in-app fulfillment adapter,
  - `streak-freeze` grants `+1` `UserStreak.freezesAvailable`,
  - other items keep manual delivery status reason,
  - duplicate fulfillment guard remains before any effect.
- Updated `apps/web/src/lib/gamification/admin-redeem.test.ts`:
  - added `userStreak.upsert` mock,
  - added coverage for Streak Freeze grant,
  - added coverage for unsupported manual item,
  - added coverage for duplicate fulfillment block.
- Updated `/admin/rewards` copy:
  - approval still spends Fucoin through ledger,
  - fulfillment now explains safe in-app rewards can be granted when supported,
  - unsupported gifts/unlocks remain manual-only.
- No schema/migration change.
- No new Fucoin spend, refund, external gift delivery, lesson unlock, or public API contract removal.

### 38.4 QA Ket Qua

- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/admin-redeem.test.ts`: pass, 11/11 tests.
- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/admin-redeem.test.ts src/lib/gamification/fucoin.test.ts src/lib/gamification/redeem.test.ts src/lib/gamification/shop.test.ts src/lib/gamification/missions.test.ts`: pass, 27/27 tests.
- Targeted ESLint for admin redeem service/tests and admin rewards client: pass.
- `git diff --check` for Batch 38 touched files: pass.
- `pnpm --filter @fuxie/web build`: pass.
- Clean dev server on `http://localhost:3016`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
- Browser QA admin rewards:
  - `/admin/rewards` renders updated safe fulfillment copy.
  - `Awaiting` filter renders and opens `Awaiting Redeem Requests`.
  - guardrail copy says Streak Freeze can be granted automatically while gifts/unlocks remain manual-only.
  - current console errors for `localhost:3016`: 0.

## 39. Implementation Batch: Learner Reward Ownership v1

### 39.1 Prompt Engineer

```text
Use case: after an admin fulfills a supported in-app reward, learners need to see that the reward is now owned, not only buried in an admin queue.
Feature: expose a small learner-facing reward inventory with Streak Freeze availability, awaiting fulfillment count, fulfilled reward count, and latest fulfilled reward.
Scope constraint: use existing data only (`UserStreak`, `ShopRedeemRequest`); no schema, migration, spend, refund, unlock, or external delivery changes.
Clarity constraint: distinguish Pending, Approved/Awaiting, Fulfilled, and Owned so learners understand where their Fucoin and reward stand.
Acceptance criteria: shop page shows inventory, dashboard shows available Streak Freeze, tests cover inventory summary, and existing shop/redeem/admin tests stay green.
```

### 39.2 Backlog Truoc Khi Code

P0:

- Add reward inventory summary from existing data:
  - `UserStreak.freezesAvailable`,
  - `UserStreak.freezesUsed`,
  - pending redeem requests,
  - approved awaiting fulfillment,
  - fulfilled rewards,
  - fulfilled Streak Freeze count,
  - latest fulfilled reward.
- Render inventory on `/rewards/shop`.
- Surface Streak Freeze count on Dashboard header.

P1:

- Add focused unit test for inventory summary.
- Keep request creation behavior unchanged: pending request still does not spend Fucoin.
- Keep admin approval/fulfillment behavior unchanged: approve spends, supported fulfill grants, unsupported fulfill remains manual.

P2:

- Dedicated `/rewards/inventory` page.
- Item-level ownership cards for cosmetics/unlocks after their adapters exist.
- Streak Freeze usage timeline and undo/receipt UI.

### 39.3 Da Trien Khai Trong Batch Nay

- Updated `apps/web/src/lib/gamification/shop.ts`:
  - added `FuxieRewardInventory`,
  - added `buildFuxieRewardInventory()`,
  - `getFuxieShopCatalogForUser()` now fetches streak ownership and redeem request fulfillment summary.
- Updated `/rewards/shop` server page:
  - passes serialized reward inventory to the client.
- Updated `ShopCatalogClient`:
  - hero now includes inventory count,
  - new `Reward Inventory` panel shows Streak Freeze ready, awaiting fulfillment, fulfilled rewards, and latest fulfilled reward.
- Updated Dashboard:
  - header data includes `freezesAvailable` and `freezesUsed`,
  - header shows a compact Streak Freeze badge.
- Updated `shop.test.ts`:
  - added inventory summary test.
- No schema/migration, wallet/spend, refund, external delivery, or unlock adapter change.

### 39.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/gamification/shop.test.ts src/lib/gamification/redeem.test.ts src/lib/gamification/admin-redeem.test.ts`: pass, 20/20 tests.
- Targeted ESLint for shop inventory, shop page/client, dashboard page/client: pass.
- `git diff --check` for Batch 39 touched files: pass.
- `pnpm --filter @fuxie/web build`: pass.
- Clean dev server on `http://localhost:3017`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
- Browser QA `/rewards/shop`:
  - `Reward Inventory` panel renders.
  - inventory hero stat renders `Streak Freeze ready`.
  - current console errors for `localhost:3017`: 0.
- Browser QA `/dashboard`:
  - header renders Streak Freeze badge.
  - current console errors for `localhost:3017`: 0.

## 40. Implementation Batch: Streak Freeze Usage Loop v1

### 40.1 Prompt Engineer

```text
Use case: Streak Freeze must feel valuable at the exact moment it protects a learner from losing momentum.
Feature: when learning activity consumes a freeze, return a receipt in the activity result and show it inside result reward loops.
Scope constraint: do not add schema/migration in v1; use the existing `UserStreak.freezesAvailable` and `freezesUsed` counters.
Behavior constraint: keep existing streak rules unchanged. A freeze is only used by the current streak logic when the learner missed up to one day and still has an available freeze.
UX constraint: result screens should explain whether the streak is safe, whether a freeze was used, the current streak, and remaining freeze count.
Acceptance criteria: Vocabulary and Listening results can render the receipt, API keeps old fields and extends `streak`, tests prove freeze consumption is reported.
```

### 40.2 Backlog Truoc Khi Code

P0:

- Extend `recordLearningActivity()` streak result with:
  - `freezeUsed`,
  - `freezesAvailable`,
  - `freezesUsed`.
- Preserve existing streak update behavior.
- Add focused test for missed-day freeze consumption.

P1:

- Add `streakReceipt` support to `ResultRewardLoop`.
- Pass streak receipts into Vocabulary result screens.
- Pass streak receipts into Listening result screens.
- Keep SRS/Reading/Writing/Exam rollout for later batches.

P2:

- Persisted streak-freeze usage timeline.
- Dedicated inventory receipt history.
- Push/in-app notification when a freeze saves a streak.

### 40.3 Da Trien Khai Trong Batch Nay

- Updated `apps/web/src/lib/progress/learning-activity.ts`:
  - `LearningActivityResult.streak` now includes freeze receipt fields.
  - existing freeze-consumption branch now reports `freezeUsed: true` and updated counts.
  - continued streak / same-day / reset branches report safe receipt defaults.
- Updated `apps/web/src/components/gamification/result-reward-loop.tsx`:
  - added optional `streakReceipt`,
  - shows highlighted receipt panel when streak is safe or when a freeze was used.
- Updated Vocabulary result flow:
  - API already returns `progress.streak`,
  - submit hook type now includes streak receipt fields,
  - all vocabulary exercise results pass `submitResult.streak` into `ExerciseResults`.
- Updated Listening result flow:
  - result state accepts `streak`,
  - result reward preview and receipt panel reflect freeze usage.
- Updated `learning-activity.test.ts`:
  - existing exact expectations include new streak receipt fields,
  - added missed-day test proving Streak Freeze is consumed and reported.
- No schema/migration, no change to streak eligibility rules, no wallet/Fucoin change.

### 40.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/progress/learning-activity.test.ts`: pass, 4/4 tests.
- `pnpm --filter @fuxie/web exec vitest run src/lib/progress/learning-activity.test.ts src/lib/gamification/shop.test.ts src/lib/gamification/admin-redeem.test.ts`: pass, 18/18 tests.
- Targeted ESLint for learning activity, result reward loop, vocabulary result, listening player, and submit hook: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/progress/learning-activity.test.ts src/lib/gamification/shop.test.ts src/lib/gamification/admin-redeem.test.ts src/lib/gamification/redeem.test.ts`: pass, 24/24 tests.
- `git diff --check` for Batch 40 touched files: pass.
- `pnpm --filter @fuxie/web build`: pass.
- Clean dev server on `http://localhost:3018`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
- Browser QA:
  - `/vocabulary/practice/mixed?theme=a1-person&level=A1` loads with no current-port console errors.
  - `/listening/L-A1-GOETHE-001-T1` loads with no current-port console errors.

## 41. Implementation Batch: Streak Freeze Timeline v1

### 41.1 Prompt Engineer

```text
Use case: Streak Freeze should be auditable and visible after it protects a learner, not only reflected in aggregate counters.
Feature: persist an append-only usage receipt each time the existing streak logic consumes a freeze, then show recent receipts in the learner Reward Inventory.
Scope constraint: add only the receipt table and read UI; do not change streak eligibility, scoring, XP, Fucoin spend, redeem, or fulfillment behavior.
Data constraint: write the receipt in the same transaction as the existing streak update and keep a unique guard by user/source so duplicate source activity cannot create duplicate receipts.
UX constraint: the shop inventory should answer when a freeze was used, what streak was protected, why it was used, and how many freezes remain.
Acceptance criteria: Prisma client knows the new table, local migration applies, learning activity tests cover receipt creation, shop UI renders an empty or recent timeline safely.
```

### 41.2 Backlog Truoc Khi Code

P0:

- Add `StreakFreezeUsage` Prisma model and migration.
- Extend `recordLearningActivity()` to create a receipt only inside the existing freeze-consumption branch.
- Return `freezeUsageId` in the streak receipt payload.
- Add targeted test coverage for receipt persistence.

P1:

- Fetch latest Streak Freeze usage records inside `getFuxieShopCatalogForUser()`.
- Serialize timeline dates in `/rewards/shop`.
- Render recent receipts in the learner `Reward Inventory` panel.

P2:

- Dashboard mini timeline.
- Dedicated inventory page.
- Notification/coach copy when a freeze saves a streak outside result screens.

### 41.3 Da Trien Khai Trong Batch Nay

- Added `StreakFreezeUsage` and relation from `User`.
- Added migration `20260429190000_add_streak_freeze_usages`.
- Exported `StreakFreezeUsage` from the database package.
- Extended learning activity streak receipts with `freezeUsageId`.
- Persisted a freeze usage receipt with protected streak, missed days, remaining freezes, source type/id, and metadata.
- Added latest-3 freeze timeline to shop inventory data.
- Rendered `Freeze timeline` in `/rewards/shop` with empty and receipt states.

### 41.4 QA Ket Qua

- `pnpm --filter @fuxie/database exec prisma generate`: pass after stopping stale Next dev servers that held the Prisma engine DLL.
- `pnpm --filter @fuxie/web typecheck`: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/progress/learning-activity.test.ts src/lib/gamification/shop.test.ts src/lib/gamification/admin-redeem.test.ts src/lib/gamification/redeem.test.ts`: pass, 24/24 tests.
- `pnpm --filter @fuxie/database exec prisma migrate deploy`: pass on local `fuxie_dev`.
- `pnpm --filter @fuxie/database exec prisma migrate status`: up to date.
- Targeted ESLint for learning activity, shop service/test, shop page/client: pass.
- `git diff --check` for Batch 41 touched files: pass.
- `pnpm --filter @fuxie/web build`: pass.
- Clean dev server on `http://localhost:3019`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
- Browser QA `/rewards/shop`:
  - `Reward Inventory` renders.
  - `Freeze timeline` renders empty state safely when no usage receipt exists.
  - current-port console errors for `localhost:3019`: 0.
- Browser QA `/listening/L-A1-GOETHE-001-T1`:
  - page loads on the new dev server.
  - current-port console errors for `localhost:3019`: 0.
- Note: `prisma migrate dev --skip-generate` still fails in this repo because the shadow DB cannot apply older baseline/index migration `20260427091500_add_performance_indexes` without `listening_attempts`; local existing DB was updated with `migrate deploy` instead.

## 42. Implementation Batch: Dashboard Freeze Awareness v1

### 42.1 Prompt Engineer

```text
Use case: learners should understand Streak Freeze value before and after it is used, without needing to open the shop inventory.
Feature: show a compact Dashboard safety panel with Freeze ready/used/streak counts, recent freeze receipts, and a Fuxie coach message.
Scope constraint: read from existing `UserStreak` and `StreakFreezeUsage` only; do not change streak rules, mission rewards, Fucoin, shop redeem, or result behavior.
UX constraint: place the panel after Mission Control so the first learning loop stays intact, then immediately explain streak protection as a supporting safety loop.
Acceptance criteria: Dashboard loads with empty and receipt states, timeline dates are serialized server-side, current-port browser console has no new errors.
```

### 42.2 Backlog Truoc Khi Code

P0:

- Fetch latest 3 `StreakFreezeUsage` rows for Dashboard content.
- Add `streakFreezeTimeline` to `DashboardData`.
- Render `Streak safety` panel with ready/used/current streak stats.
- Render empty state when no freeze usage exists.

P1:

- Add Fuxie coach copy that changes by state:
  - recent freeze used,
  - freeze ready but unused,
  - no freeze ready.
- Link the mental model back to Reward Inventory/Shop without creating new actions.

P2:

- Add notification/toast immediately after a freeze is consumed.
- Add dedicated `/rewards/inventory` page.
- Add timeline filtering once receipts become frequent.

### 42.3 Da Trien Khai Trong Batch Nay

- Added `getStreakFreezeTimeline()` to Dashboard server data.
- Cached latest freeze timeline with `dash:freeze-timeline:{userId}`.
- Extended `DashboardData` with serialized freeze receipt rows.
- Added `StreakFreezeAwarenessSection` after Mission Control.
- Added state-aware Fuxie coach messaging and empty/receipt UI.

### 42.4 QA Ket Qua

- `pnpm --filter @fuxie/web typecheck`: pass.
- Targeted ESLint for Dashboard page/client: pass.
- `pnpm --filter @fuxie/web exec vitest run src/lib/dashboard/quest-adapter.test.ts src/lib/gamification/shop.test.ts src/lib/progress/learning-activity.test.ts`: pass, 13/13 tests.
- `git diff --check` for Batch 42 touched files: pass.
- `pnpm --filter @fuxie/web build`: pass.
- Clean dev server on `http://localhost:3020`:
  - `/api/v1/health`: `status: ok`, `db: connected`.
- Browser QA `/dashboard`:
  - `Streak safety` panel renders after Mission Control.
  - empty state renders when no freeze receipt exists.
  - state-aware Fuxie safety coach renders.
  - current-port console errors for `localhost:3020`: 0.

## 43. Concept Batch: Fuxie German Village + Codex Image Asset Pipeline

### 43.1 Prompt Engineer

```text
Use case: combine the current Fuxie gamification foundation with a cozy daily-village learning metaphor inspired by Animal Crossing-style loops, without copying external IP.
Feature: define "Fuxie German Village" and use Codex image generation as a required design step before any production UI coding.
Scope constraint: concept, prompt library, visual mockups, and backlog only; do not change production UI, DB, API, scoring, missions, Fucoin, shop, or reward logic.
Visual constraint: generated images must extend the Fuxie Bright Sky world, keep Fuxie as the central brand anchor, and avoid external-game characters, names, UI patterns, or item shapes.
Acceptance criteria: produce concept doc, asset style guide, prompt library, Codex-generated asset board, 2-3 screen mockups, and a code backlog shortlist.
```

### 43.2 Backlog Truoc Khi Code

P0:

- Define the Fuxie German Village metaphor and map current surfaces to village locations.
- Write a reusable Codex image generation prompt style guide.
- Generate visual concepts using Codex image generation:
  - asset style board,
  - Dashboard Village Square mockup,
  - Fuxie Market + Inventory mockup,
  - Vocabulary Collection Book mockup.

P1:

- Shortlist first production assets:
  - Fucoin,
  - Streak Freeze item,
  - Hint Ticket,
  - Unlock Key,
  - XP Star,
  - shop item art.
- Plan first implementation batch around Shop/Inventory because economy and reward ownership already exist.

P2:

- Dashboard village snapshot layer.
- Vocabulary collection card visuals.
- Seasonal events and animated reward moments.

### 43.3 Da Trien Khai Trong Batch Nay

- Added `docs/design/fuxie-german-village-concept.md`.
- Documented the core metaphor:
  - Dashboard = Village Square,
  - Mission Board = Village Notice Board,
  - Fucoin = Village reward coin,
  - Shop = Fuxie Market,
  - Inventory = Backpack/Trophy Room,
  - Vocabulary = Collection Book,
  - Listening = Radio Booth,
  - Reading = Library,
  - Writing = Post Office,
  - Exam = Town Hall Challenge.
- Created a reusable Codex image prompt library for:
  - asset style board,
  - Dashboard Village Square,
  - Fuxie Market + Inventory,
  - Vocabulary Collection Book.
- Used Codex image generation to create:
  - Fuxie German Village asset style board,
  - Dashboard Village Square mockup,
  - Fuxie Market + Reward Inventory mockup,
  - Vocabulary Collection Book mockup.
- No production code, schema, API, or game-economy logic was changed in this concept batch.

### 43.4 Review Ket Qua

- Visual direction fits Fuxie Bright Sky: blue/teal dominant, amber for Fucoin and rewards.
- Fuxie mascot remains central; new images expand the world around Fuxie.
- Shop/Inventory mockup is the strongest first production candidate because it maps directly onto existing Fucoin, shop catalog, redeem requests, and reward inventory.
- Dashboard Village Square mockup is inspiring but should be implemented as a contained panel/snapshot, not a full replacement of the current learning-first Mission Hub.
- Vocabulary Collection Book is promising for later because it needs either a light UI-only interpretation first or a persisted collectible model later.
- IP safety note: keep prompts and implementation explicitly original; do not reuse Animal Crossing names, characters, leaf motifs, or copied UI structures.

## 44. Concept Batch: 3D Fuxie Mascot System v1

### 44.1 Prompt Engineer

```text
Use case: establish 3D Fuxie as the new canonical mascot direction for Fuxie German Village.
Feature: generate a 3D mascot master sheet, pose packs, role packs, and reward/state packs with Codex image generation, then define production replacement rules.
Scope constraint: concept assets and documentation only; do not replace production UI yet because the generated sheets still need single-pose transparent app-ready assets.
Brand constraint: preserve Fuxie Bright Sky identity, sky-blue mascot, teal hoodie/accessories, white face/chest, friendly coach personality.
IP constraint: original Fuxie only; no Animal Crossing/Nintendo-like characters, leaf motifs, copied UI, or copied item shapes.
Acceptance criteria: concept images saved in workspace, 3D mascot style system documented, rollout map created, next production asset pipeline defined.
```

### 44.2 Backlog Truoc Khi Code

P0:

- Generate 3D Fuxie master style sheet.
- Generate 3D coach pose pack.
- Generate 3D learning role pack.
- Generate 3D reward/state pack.
- Copy generated concept assets into the project.
- Document canonical 3D mascot rules and replacement map.

P1:

- Define app-ready single-pose asset naming convention.
- Define transparent/cutout pipeline for production PNG/WebP.
- Shortlist first surfaces to replace:
  - Dashboard,
  - Shop/Inventory,
  - Streak safety,
  - Result reward loop.

P2:

- Generate individual transparent poses.
- Roll out 3D Fuxie to high-impact UI.
- Keep sidebar icons compact until visual density is validated.

### 44.3 Da Trien Khai Trong Batch Nay

- Added `docs/design/fuxie-3d-mascot-system.md`.
- Generated and copied these concept assets:
  - `/mascot-3d/concept/fuxie-3d-master-style-sheet.png`,
  - `/mascot-3d/concept/fuxie-3d-coach-pose-pack.png`,
  - `/mascot-3d/concept/fuxie-3d-learning-role-pack.png`,
  - `/mascot-3d/concept/fuxie-3d-reward-state-pack.png`.
- Defined canonical 3D Fuxie rules:
  - bright sky-blue fox-like coach,
  - teal hoodie/accessories,
  - white face/chest,
  - rounded 3D clay-like style,
  - warm expressive eyes,
  - original IP only.
- Defined pose taxonomy:
  - core coach,
  - learning roles,
  - reward/state poses.
- Defined production replacement map and app-ready asset pipeline.

### 44.4 Review Ket Qua

- Master sheet is strong: consistent blue mascot identity, readable silhouette, useful front/side/back references.
- Coach pose pack is strong for Dashboard, result loop, onboarding, and feedback.
- Learning role pack is strong for Shop, Reading, Listening, Writing, Exam, though some props should be simplified in final cropped assets.
- Reward/state pack is strong for Fucoin, Streak Freeze, level-up, empty, and gentle error states.
- Current outputs are pose sheets, not production cutouts; next batch should generate single-pose transparent assets before replacing UI.
- No production UI, DB, API, scoring, Fucoin, shop, or streak logic changed.

## 45. Production Batch: 3D Fuxie Single-Pose Asset Pack v1

### 45.1 Prompt Engineer

```text
Feature: replace high-impact 2D mascot moments with app-ready 3D Fuxie single-pose assets.
Visual target: canonical Fuxie Bright Sky, sky-blue mascot, teal hoodie/accessories, white face/chest, rounded clay-like 3D game style, supportive coach expression.
Asset constraint: one pose per image, full body, generous padding, flat #ff00ff chroma-key background, no floor/shadow/text/watermark, no copied external-game/IP resemblance.
UX constraint: use 3D Fuxie only where it has a job: guide, reward, explain state, protect streak, or celebrate completion.
Acceptance: transparent PNG cutouts exist in project, key dashboard/result surfaces are wired, no scoring/API/schema changes.
```

### 45.2 Backlog Truoc Khi Code

P0:

- Generate six production single-pose assets:
  - happy wave,
  - daily mission coach,
  - Fucoin reward,
  - Streak Freeze saved,
  - shopkeeper,
  - celebration.
- Remove chroma-key background into transparent PNGs.
- Validate alpha corners and basic dimensions.
- Wire 3D assets into shared mascot coach primitives and highest-impact Dashboard/Result surfaces.

P1:

- Retain raw chroma-key files for repeatable cleanup.
- Document asset usage and rollout map.
- Run typecheck, targeted lint, build, and browser QA.

P2:

- Add WebP/512 derivatives for performance.
- Generate role-specific assets for Reading, Listening, Writing, Exam, error, empty, and level-up states.

### 45.3 Da Trien Khai Trong Batch Nay

- Generated six single-pose 3D Fuxie assets with Codex image generation.
- Copied raw sources into `/apps/web/public/mascot-3d/raw/`.
- Removed chroma-key background and saved app-ready transparent PNGs:
  - `/mascot-3d/core/fuxie-3d-core-happy-wave.png`,
  - `/mascot-3d/core/fuxie-3d-core-daily-mission.png`,
  - `/mascot-3d/core/fuxie-3d-game-fucoin-reward.png`,
  - `/mascot-3d/core/fuxie-3d-game-streak-freeze-saved.png`,
  - `/mascot-3d/core/fuxie-3d-role-shopkeeper.png`,
  - `/mascot-3d/core/fuxie-3d-core-celebration.png`.
- Updated `FuxieCoach` to accept optional `mascotSrc`.
- Replaced default shared coach role mascots with 3D assets.
- Wired Dashboard mascot surfaces:
  - greeting,
  - achievements empty state,
  - Today Plan,
  - Mission Control shop coach,
  - Streak Freeze safety coach.
- Wired Quest hero variants:
  - exam uses celebration,
  - review uses Streak Freeze saved.
- Wired ResultRewardLoop:
  - successful graded result uses celebration,
  - retry/feedback state uses happy wave.

### 45.4 QA Can Chay

- `pnpm --filter @fuxie/web typecheck`
- Targeted ESLint:
  - `src/components/gamification/quest-visuals.tsx`,
  - `src/components/gamification/result-reward-loop.tsx`,
  - `src/components/dashboard/dashboard-client.tsx`.
- `pnpm --filter @fuxie/web build`
- Browser QA:
  - `/dashboard`,
  - `/rewards/shop`,
  - `/vocabulary/practice/mixed?theme=a1-person&level=A1`,
  - `/listening/L-A1-GOETHE-001-T1`.

### 45.5 Review Ket Qua Tam Thoi

- 3D Fuxie now feels more like a real game companion on the surfaces that matter most.
- The rollout remains controlled: no global sidebar/icon replacement yet, so the UI does not become visually noisy.
- Fucoin, shop, streak, mission, and result states now have pose-specific mascot art instead of one generic character.
- Main remaining risk is image weight: each PNG is around 0.9-1.2 MB, so a follow-up optimization batch should create smaller WebP/PNG variants before replacing many more surfaces.

## 46. Production Batch: 3D Fuxie Asset Optimization v1

### 46.1 Prompt Engineer

```text
Feature: optimize the 3D Fuxie mascot pack before broader production rollout.
Goal: keep the emotional lift of 3D Fuxie while reducing image weight enough for dashboard, result, shop, streak, and later skill surfaces.
Asset constraint: keep original raw and 1024px PNG master assets; generate 512px transparent derivatives for runtime use.
Code constraint: route UI through one central asset map so future swaps do not require editing many components.
Acceptance: WebP optimized assets exist, app code no longer references heavy `/mascot-3d/core/` files directly, and typecheck/lint/build/browser QA pass.
```

### 46.2 Backlog Truoc Khi Code

P0:

- Generate 512x512 optimized transparent PNG derivatives.
- Generate 512x512 optimized transparent WebP delivery assets.
- Compare file sizes against Batch 45 master PNGs.
- Create a central `FUXIE_3D_ASSETS` map.
- Replace direct UI references with centralized optimized paths.

P1:

- Validate transparent corners for optimized outputs.
- Update mascot system and visual audit docs.
- Browser QA Dashboard, Shop, and Listening.

P2:

- Consider responsive image variants if later hero art needs larger than 512px.
- Generate role-specific optimized assets for Reading, Listening, Writing, Exam, empty, error, and level-up states.

### 46.3 Da Trien Khai Trong Batch Nay

- Added optimized assets under `/apps/web/public/mascot-3d/optimized/`.
- Created both `-512.png` and `-512.webp` files for:
  - happy wave,
  - daily mission,
  - Fucoin reward,
  - Streak Freeze saved,
  - shopkeeper,
  - celebration.
- Reduced runtime delivery source weight from about `933KB-1.21MB` per mascot to about `25KB-32KB` per WebP asset.
- Added `FUXIE_3D_ASSETS` in `quest-visuals.tsx`.
- Updated Dashboard, Quest visuals, and ResultRewardLoop to use centralized optimized WebP assets.
- Confirmed no app TS/TSX code still references `/mascot-3d/core/` directly.

### 46.4 Review Ket Qua

- 3D Fuxie is now much safer to reuse across more learning surfaces.
- The visual identity remains consistent because optimized files are generated from the approved Batch 45 master cutouts.
- Centralized asset mapping gives us a clean switchboard for the next rollout batch.
- The next design/game batch can now focus on role expansion instead of performance cleanup.

## 47. Production Batch: 3D Fuxie Skill Role Pack v1

### 47.1 Prompt Engineer

```text
Feature: expand Fuxie 3D into role-specific learning coaches.
Goal: make Reading, Listening, Writing, and Exam feel like distinct places in Fuxie German Village without making the app decorative or noisy.
Visual constraint: keep Fuxie Bright Sky, blue/teal mascot identity, clean rounded 3D style, no copied external-game/IP elements.
Asset constraint: generate one full-body pose per role on flat #ff00ff chroma-key, remove background locally, keep raw/master/optimized outputs.
UX constraint: replace high-impact hero/intro/result mascot surfaces first; keep small sidebar icons unchanged.
Acceptance: each major skill has a fitting mascot role, optimized WebP assets are wired through `FUXIE_3D_ASSETS`, and QA passes.
```

### 47.2 Backlog Truoc Khi Code

P0:

- Generate role assets:
  - Reading librarian,
  - Listening radio host,
  - Writing post office helper,
  - Exam guide.
- Chroma-key each asset into transparent PNG master.
- Create 512px PNG/WebP optimized derivatives.
- Add role paths to the central asset map.
- Wire role mascots into skill hubs and high-frequency player/result surfaces.

P1:

- Update result feedback states to use skill-specific mascot art.
- Add `mascotSrc` override to QuestProgressHero for Exam hero.
- Document visual rules and rollout map.
- Run typecheck/lint/build/browser QA.

P2:

- Add Speaking role mascot later.
- Add empty/error/level-up role variants.
- Explore subtle entrance animation after performance remains healthy.

### 47.3 Da Trien Khai Trong Batch Nay

- Used Codex image generation to create four new Fuxie 3D role assets.
- Saved raw sources under `/apps/web/public/mascot-3d/raw/`.
- Saved transparent master PNGs under `/apps/web/public/mascot-3d/core/`.
- Saved optimized runtime files under `/apps/web/public/mascot-3d/optimized/`.
- Added these runtime paths:
  - `/mascot-3d/optimized/fuxie-3d-role-librarian-512.webp`,
  - `/mascot-3d/optimized/fuxie-3d-role-radio-host-512.webp`,
  - `/mascot-3d/optimized/fuxie-3d-role-post-office-512.webp`,
  - `/mascot-3d/optimized/fuxie-3d-role-exam-guide-512.webp`.
- Updated `FUXIE_3D_ASSETS` and shared result loop role mapping.
- Replaced high-impact skill surfaces:
  - Reading hub and Reading intro,
  - Listening hub and Listening lesson intro,
  - Writing hub and Writing feedback,
  - Exam hub, Exam empty state, Exam pass indicator.

### 47.4 Review Ket Qua

- Fuxie now reads less like a generic sticker and more like a game companion with skill-specific jobs.
- The role props are clear at small sizes: book, headphones/mic, postcard/pencil, checklist/trophy.
- The rollout is still controlled, so dense navigation and content cards are not visually overloaded.
- Next step should be either Speaking role pack or a small animation/micro-interaction layer for mascot moments.

## 48. Production Batch: Speaking Role + Mascot Motion Layer v1

### 48.1 Prompt Engineer

```text
Feature: complete the core skill role pack with Speaking and add a restrained mascot motion layer.
Goal: make Fuxie feel more game-like and alive while preserving focus on learning tasks.
Speaking asset: canonical 3D Fuxie, sky-blue/teal, microphone, blank speech bubble, friendly pronunciation-coach pose, flat #ff00ff chroma-key, no text or copied IP.
Motion constraint: transform-only, subtle, no layout shift, no scroll-trigger complexity, disabled by prefers-reduced-motion.
Acceptance: Speaking has its own role asset, key speaking surfaces use it, mascot motion primitives exist, and QA passes.
```

### 48.2 Backlog Truoc Khi Code

P0:

- Generate Speaking coach asset with Codex image generation.
- Chroma-key to transparent PNG master.
- Create 512px PNG/WebP optimized derivatives.
- Add `speakingCoach` to `FUXIE_3D_ASSETS`.
- Add shared mascot wrapper and motion classes.
- Wire Speaking hub, lesson intro, summary, and Nachsprechen result.

P1:

- Convert existing role image callsites to `FuxieRoleMascot`.
- Add future `speaking` support to `ResultRewardLoop`.
- Document motion rules and asset paths.

P2:

- Add optional reward burst or claim animation later.
- Consider speaking role in TurnBased message avatar after conversation UI polish.

### 48.3 Da Trien Khai Trong Batch Nay

- Generated `fuxie-3d-role-speaking-coach-raw.png`.
- Created transparent master:
  - `/mascot-3d/core/fuxie-3d-role-speaking-coach.png`.
- Created optimized runtime assets:
  - `/mascot-3d/optimized/fuxie-3d-role-speaking-coach-512.png`,
  - `/mascot-3d/optimized/fuxie-3d-role-speaking-coach-512.webp`.
- Added `FuxieRoleMascot` and reusable motion modes:
  - `idle`,
  - `coach`,
  - `reward`,
  - `speak`,
  - `none`.
- Added reduced-motion fallback.
- Wired motion into:
  - `FuxieCoach`,
  - `QuestProgressHero`,
  - Reading/Listening/Writing role surfaces,
  - Speaking hub,
  - Speaking lesson intro,
  - Speaking summary,
  - Nachsprechen result panel.
- Extended result loop type support with `speaking`.

### 48.4 Review Ket Qua

- Speaking now has the same visual quality level as Reading/Listening/Writing/Exam.
- Mascot motion adds liveliness without changing the learning flow.
- The shared wrapper gives us a single control point for future mascot animation tuning.
- Next step should be a focused browser/mobile visual QA pass on speaking, then either conversation UI polish or reward claim micro-interactions.

## 49. Production Batch: Reward Claim Micro-interactions v1

### 49.1 Prompt Engineer

```text
Feature: make Dashboard Mission Control reward claiming feel like a polished learning-game moment.
Goal: after a learner claims a mission, show an immediate, readable reward moment: Fuxie celebrates, Fucoin/XP are visible, and the claimed mission card reacts.
Scope constraint: do not change mission API, economy ledger, Fucoin math, XP, streak, DB schema, or reward fulfillment.
Visual constraint: use Fuxie Bright Sky; amber only for reward/Fucoin, teal/sky for success and brand, red only for errors.
Motion constraint: short transform-only CSS, no layout shift, and disabled by prefers-reduced-motion.
Acceptance: claimable state is easier to notice, pending state is clearer, success reward is visible in Mission Control, and QA passes.
```

### 49.2 Backlog Truoc Khi Code

P0:

- Replace plain mission claim success text with a reward celebration panel.
- Reuse the existing 3D Fucoin reward Fuxie asset.
- Add a just-claimed state to MissionCard.
- Add short card pop and coin burst micro-interactions.
- Add loading spinner/text to the claim button.

P1:

- Keep reward chips scannable on mobile.
- Respect reduced-motion.
- Document the batch in the mascot system and visual audit docs.

P2:

- Later, extend similar reward micro-interactions to result screens and shop request flow.
- Later, add sound/haptic hooks only if mobile product direction confirms it.

### 49.3 Da Trien Khai Trong Batch Nay

- Dashboard Mission Control now keeps a typed `ClaimCelebration`.
- Successful mission claim renders a compact reward panel with:
  - `FUXIE_3D_ASSETS.fucoinReward`,
  - mission title,
  - Fucoin reward chip,
  - XP reward chip.
- Mission cards receive `justClaimed` state.
- Just-claimed mission card gets a short pop animation and coin burst.
- Claimable gift icon gets a subtle pulse so available rewards stand out.
- Claim button now shows a spinner and loading copy while the request is pending.
- Added reduced-motion fallback for all new reward claim animations.

### 49.4 Review Ket Qua

- Reward claim now reads as a tangible game action instead of a plain notification.
- The first viewport of Mission Control better supports the loop: mission -> claim -> reward.
- Economy safety remains unchanged because all changes are presentational.
- Next candidates: shop request micro-interactions, result-screen claim polish, or a small Fuxie Village dashboard panel.

## 50. Production Batch: Shop Request Micro-interactions v1

### 50.1 Prompt Engineer

```text
Feature: make Fuxie Market request flow feel like a learning-game reward queue.
Goal: when a learner can afford an item, opens preview, and creates or reuses a pending request, the UI should clearly show item readiness, request creation, queue state, and safety policy.
Scope constraint: no database, API, spend ledger, fulfillment, inventory, wallet, or admin workflow changes.
Visual constraint: keep Fuxie Bright Sky; amber only for Fucoin/request readiness, sky/teal for brand and guidance, red only for errors.
Motion constraint: CSS-only micro-interactions, no layout shift, and disabled by prefers-reduced-motion.
Asset constraint: reuse existing shopkeeper mascot now; next batch must use Codex image generation for app-ready item art.
Acceptance: shop cards feel more interactive, request success is visible, pending queue state is clearer, and QA passes.
```

### 50.2 Backlog Truoc Khi Code

P0:

- Add request celebration state to `/rewards/shop`.
- Show a Fuxie shopkeeper success panel after a request is created or reused.
- Highlight affordable item cards.
- Animate recently requested item card with pop and coin burst.
- Make pending history cards feel alive.

P1:

- Add modal entrance and feedback pop.
- Respect reduced-motion for all new animation classes.
- Document Batch 50 and the next Codex image asset batch.

P2:

- Generate and integrate app-ready item art.
- Convert generic shop icon blocks into item images.
- Add inventory shelf/backpack visual treatment.

### 50.3 Da Trien Khai Trong Batch Nay

- Added typed `ShopRequestCelebrationData` in `ShopCatalogClient`.
- Successful request upsert now stores request celebration state.
- Added `ShopRequestCelebration` panel using `FUXIE_3D_ASSETS.shopkeeper`.
- Shop cards now receive:
  - afford-ready glow,
  - ready icon pulse,
  - recently-requested pop,
  - coin burst overlay.
- Request history pending cards now pulse subtly.
- Redeem preview modal and success feedback now have entrance/pop motion.
- Added reduced-motion fallback for all Batch 50 animation classes.

### 50.4 Image Generation Plan

Anh hỏi đúng điểm quan trọng: concept image plan đã có từ Batch 43, nhưng chưa có batch production riêng để tạo vật phẩm app-ready. Batch 51 nên bắt buộc dùng Codex image generation cho item assets:

- Fucoin icon,
- Streak Freeze charm,
- Hint Ticket,
- Unlock Key,
- XP Star,
- Fuxie Sky Outfit,
- German postcard collectible,
- Fuxie Market shelf/backpack props.

Each asset should be generated as a single centered object on flat `#ff00ff` chroma-key background, then cleaned into transparent PNG master and optimized 512px WebP runtime files.

### 50.5 Review Ket Qua

- Shop request flow now has a visible reward-queue moment instead of feeling like a plain modal submit.
- Learners can better see which item is close/ready, what just entered the queue, and why Fucoin has not disappeared yet.
- Economy safety remains unchanged because Batch 50 is presentational.
- Next step should be Batch 51: Codex-generated item asset pack and shop/inventory image integration.

## 51. Production Batch: Codex Image Shop Item Asset Pack v1

### 51.1 Prompt Engineer

```text
Feature: replace generic shop icons with app-ready generated item art.
Goal: make Fuxie Market feel like a real learning-game shop by giving each visible item a tangible collectible image.
Image requirement: use Codex image generation. Generate single centered objects on flat #ff00ff chroma-key backgrounds, then remove the key locally and export transparent PNG/WebP assets.
Brand constraint: Fuxie Bright Sky palette; sky blue and teal carry the brand, amber is reserved for Fucoin/reward details.
IP constraint: original Fuxie German Village assets only; no external-game, Nintendo, or Animal Crossing lookalike elements.
Code constraint: keep shop economy, request, spend, fulfillment, wallet, and admin logic unchanged.
Acceptance: generated raw/core/optimized assets exist in project, alpha validates, shop cards use item images, typecheck/lint/build/browser QA pass.
```

### 51.2 Backlog Truoc Khi Code

P0:

- Generate Fucoin, Streak Freeze, Hint Ticket, Unlock Key, Fuxie Sky Outfit, and German Postcard assets with Codex image generation.
- Copy raw outputs into `/apps/web/public/reward-assets/raw/`.
- Remove chroma-key backgrounds into transparent PNG masters under `/core/`.
- Create 512px PNG/WebP runtime files under `/optimized/`.
- Add shop item asset mapping.
- Replace generic shop card icons and request-history icons with item art.
- Show requested item art inside the shop request celebration panel.

P1:

- Validate alpha corners and runtime file sizes.
- Document prompts, asset paths, and item mapping.

P2:

- Generate XP Star, CEFR badges, Market shelf/backpack prop, and inventory room visuals.
- Integrate item art into Dashboard shop preview and result reward loops.

### 51.3 Da Trien Khai Trong Batch Nay

- Used Codex image generation to create six app-ready item icons:
  - Fucoin,
  - Streak Freeze charm,
  - Hint Ticket,
  - Unlock Key,
  - Fuxie Sky Outfit,
  - German Postcard.
- Saved raw generated sources in:
  - `/reward-assets/raw/`.
- Created transparent master PNGs in:
  - `/reward-assets/core/`.
- Created optimized runtime assets in:
  - `/reward-assets/optimized/`.
- WebP runtime sizes are about 22-32 KB each.
- Added `SHOP_ITEM_ASSETS` and `getShopItemAssetSrc()` in `ShopCatalogClient`.
- Replaced generic category icon blocks in shop cards with generated item art.
- Added item art to request history cards.
- Added item art to the request celebration panel beside the Fuxie shopkeeper.

### 51.4 Review Ket Qua

- Fuxie Market now reads less like a list of SaaS entitlements and more like a real game shop.
- Generated assets keep the Fuxie Bright Sky direction and avoid copying external IP.
- Economy behavior remains untouched; this is visual/asset integration only.
- Next best follow-up: extend the same item art into Dashboard shop preview, then generate XP Star/CEFR badges for result and level-up moments.

## 52. Production Batch: Dashboard Reward Asset Integration v1

### 52.1 Prompt Engineer

```text
Feature: extend generated reward item art beyond the shop into the learner's daily loop.
Goal: make Dashboard Mission Control feel connected to Fuxie Market by showing tangible item art in shop preview, Fucoin ledger, mission rewards, and reward preview components.
Visual rule: generated items should clarify reward value at a glance; avoid decorative clutter and keep the next learning action readable.
Brand constraint: Fuxie Bright Sky remains dominant; amber is only for Fucoin/reward emphasis.
Code constraint: no DB/API/economy/scoring changes; refactor asset mapping into a shared helper so future Inventory/Collection surfaces can reuse it.
Acceptance: typecheck, targeted ESLint, build, and browser QA on Dashboard and Shop pass.
```

### 52.2 Backlog Truoc Khi Code

P0:

- Move shop item asset mapping into a shared `reward-assets` helper.
- Keep Fuxie Market cards using generated item art through the shared helper.
- Replace Dashboard Mission Control shop-preview generic gift icons with generated item art.
- Show Fucoin art in Dashboard ledger/reward claim surfaces.

P1:

- Let shared `RewardPreview` use item art for Fucoin, Streak Freeze, and Unlock reward types.
- Keep XP/badge/exam as lucide icons until XP Star and CEFR badge assets are generated.

P2:

- Generate XP Star, CEFR badges, and inventory props.
- Use the same helper in future Inventory, Collection Book, and level-up screens.

### 52.3 Da Trien Khai Trong Batch Nay

- Added shared asset helper:
  - `/apps/web/src/components/gamification/reward-assets.ts`.
- Refactored `ShopCatalogClient` to use the shared `getShopItemAssetSrc()` mapping.
- Updated `RewardPreview` so `fucoin`, `streak`, and `unlock` rewards render generated item art.
- Updated Dashboard Mission Control:
  - shop preview cards now show the generated item image for each reward,
  - mission reward rows show Fucoin art,
  - reward claim celebration shows Fucoin art,
  - recent wallet ledger shows Fucoin art for positive entries.

### 52.4 Review Ket Qua

- Dashboard now connects mission progress to tangible shop items, so the loop feels more like: learn -> earn -> save -> unlock.
- Shop and Dashboard share one asset mapping, reducing drift as the catalog grows.
- XP Star/CEFR badge generation remains the next visual gap for level/result screens.

## 53. Production Batch: XP Star, CEFR Badges And Inventory Prop v1

### 53.1 Prompt Engineer

```text
Feature: add level-up and collection visuals to the Fuxie reward system.
Goal: make XP, CEFR milestones, and inventory ownership feel tangible instead of numeric-only.
Image requirement: use Codex image generation for XP Star, CEFR badge set, and Inventory/Market prop; export transparent PNG/WebP runtime assets.
Visual rule: XP Star should read at small size, CEFR badges must clearly show A1/A2/B1/B2, and Inventory prop should make Shop ownership feel like a game collection.
Brand constraint: Fuxie Bright Sky palette; sky blue/teal dominate, amber only for reward accents.
Code constraint: no DB/API/economy/scoring changes.
Acceptance: generated raw/core/optimized assets exist, alpha validates, RewardPreview/Dashboard/Shop Inventory use the new assets, typecheck/lint/build/browser QA pass.
```

### 53.2 Backlog Truoc Khi Code

P0:

- Generate XP Star, CEFR badge sheet, and Inventory/Market prop with Codex image generation.
- Save raw outputs under `/reward-assets/raw/`.
- Remove chroma-key backgrounds into transparent masters under `/reward-assets/core/`.
- Export optimized 512px PNG/WebP runtime assets under `/reward-assets/optimized/`.
- Split CEFR badge sheet into individual A1/A2/B1/B2 runtime assets.
- Extend shared `REWARD_ASSETS` and add `getCefrBadgeAssetSrc()`.

P1:

- Use XP Star and badge art in shared `RewardPreview`.
- Use CEFR badge art in Dashboard header.
- Use Inventory/Market prop in Fuxie Market inventory panel.

P2:

- Roll CEFR badge assets into Course milestones, Exam readiness, and future Collection Book.
- Add level-up reveal animation after XP changes.

### 53.3 Da Trien Khai Trong Batch Nay

- Generated three new asset groups with Codex image generation:
  - XP Star,
  - CEFR badge sheet A1/A2/B1/B2,
  - Inventory backpack + Fuxie Market shelf prop.
- Created transparent masters and optimized 512px PNG/WebP runtime files.
- Split CEFR sheet into:
  - `fuxie-item-cefr-badge-a1`,
  - `fuxie-item-cefr-badge-a2`,
  - `fuxie-item-cefr-badge-b1`,
  - `fuxie-item-cefr-badge-b2`.
- Extended shared `reward-assets.ts` with XP, CEFR, and Inventory asset mappings.
- Updated `RewardPreview` so XP and badge rewards now use generated asset art.
- Updated Dashboard header to show the learner's CEFR badge asset.
- Updated Shop inventory section to show the generated backpack/market prop.

### 53.4 Review Ket Qua

- XP now has a real visual token, improving reward clarity in result and mission surfaces.
- CEFR level now begins to feel like a collectible milestone instead of a plain pill.
- Shop inventory now has a tangible collection prop, making fulfilled rewards easier to understand emotionally.
- Next best follow-up: add a lightweight level-up/reward reveal moment and roll CEFR badge art into Course path nodes.

## 54. Production Batch: Reward Reveal Moment v1

### 54.1 Prompt Engineer

```text
Feature: add a lightweight reward reveal moment after learning completion and mission claim.
Goal: make the first 1-2 seconds after a result/claim feel like a small win, not just a static stats panel.
Visual rule: reveal should use generated XP/Fucoin/Badge/Unlock assets, show the highest-value reward first, and keep the next CTA visible.
Motion rule: soft pop, spark, and token entrance only; no blocking modal, no long animation, reduced-motion safe.
Brand constraint: Fuxie Bright Sky with amber only for reward emphasis.
Code constraint: no DB/API/scoring/economy changes; presentation-only.
Acceptance: shared component reused in result loop and mission claim, typecheck/lint/build/browser QA pass.
```

### 54.2 Backlog Truoc Khi Code

P0:

- Add shared `RewardRevealMoment` component in gamification visuals.
- Use existing reward asset mapping for XP, Fucoin, Streak Freeze, CEFR badge, and Unlock.
- Add reveal to `ResultRewardLoop` for Vocabulary/Listening and future result screens that use the shared loop.
- Add reveal to Dashboard mission claim celebration.

P1:

- Add CSS keyframes for reveal panel, token pop, and sparks.
- Add `prefers-reduced-motion` fallback.
- Keep reward preview list and CTA flow unchanged.

P2:

- Trigger reveal only after newly earned rewards if persisted reward events become available.
- Add level-up reveal and course path badge unlock in later batches.

### 54.3 Da Trien Khai Trong Batch Nay

- Added shared `RewardRevealMoment` to `quest-visuals.tsx`.
- Reused generated assets through `REWARD_TYPE_ASSETS`.
- Added reveal panel inside `ResultRewardLoop`, so Vocabulary/Listening result screens inherit the moment.
- Added reveal panel to Dashboard mission claim celebration.
- Added motion classes:
  - `fuxie-reward-reveal`,
  - `fuxie-reveal-main-token`,
  - `fuxie-reveal-mini-token`,
  - `fuxie-reveal-spark`.
- Added reduced-motion fallback for the new reveal animations.

### 54.4 Review Ket Qua

- Result screens now have a clearer emotional beat: reward appears as a tangible object before the learner chooses the next action.
- Mission claim now feels more like a reward moment instead of a plain receipt.
- The implementation stays UI-only and does not alter Fucoin, XP, mission, ledger, or scoring logic.

## 55. Production Batch: Conditional Reward Reveal And Course Badge Nodes

### 55.1 Prompt Engineer

```text
Feature: make reward reveal moments honest and add CEFR badge art to course path milestones.
Goal: learners should feel a true win only when a new reward was earned; capped, repeated, or pending rewards should read as a calm receipt.
Visual rule: earned rewards keep amber spark/pop; receipt and pending states use calmer Fuxie Bright Sky blue/teal surfaces.
Course rule: CEFR badge art should turn course nodes into visible milestones without hiding lock/progress state.
Code constraint: no DB/API/scoring/economy changes; presentation-only.
Acceptance: typecheck, targeted ESLint, build, and browser QA for Course, Dashboard, and result loop surfaces pass.
```

### 55.2 Backlog Truoc Khi Code

P0:

- Add `earned`, `receipt`, and `pending` modes to `RewardRevealMoment`.
- Let `ResultRewardLoop` detect fresh rewards from existing reward labels/details.
- Keep Dashboard mission claim celebration in earned mode because claim is a real reward event.
- Add CEFR badge assets to Course header and unlocked Course path nodes.

P1:

- Keep receipt/pending surfaces animated lightly but remove sparks/token pop.
- Preserve CTA and reward preview layout.
- Avoid changing Fucoin ledger, XP, mission, or scoring logic.

P2:

- Later replace label-based detection with persisted reward event metadata.
- Add dedicated level-up reveal when XP thresholds are available.

### 55.3 Da Trien Khai Trong Batch Nay

- Extended `RewardRevealMoment` with conditional `mode`.
- `earned` mode keeps the existing amber spark and token-pop treatment.
- `receipt` and `pending` modes now use calmer blue/teal panels without celebratory sparks.
- `ResultRewardLoop` now chooses reveal mode from existing reward labels/details.
- Dashboard mission claim explicitly uses earned mode.
- Course header and Course quest nodes now display generated CEFR badge art for the active level.

### 55.4 Review Ket Qua

- Result screens no longer over-celebrate capped or already-claimed rewards.
- Course path now feels closer to a game milestone map because each unlocked node carries the learner's CEFR badge.
- The batch remains UI-only and does not alter reward accounting, mission claim, XP, Fucoin, or unlock rules.

## 56. Production Planning Batch: Learner UI + Design Coordination

### 56.1 Prompt Engineer

```text
Use case: coordinated UI/UX and Design production planning.
Feature: implement the Fuxie Learner UI + Design Production Plan for a moderate Fuxie German Village layer.
Scope: learner surfaces only; no teacher/admin expansion in this batch.
Goal: create the audit matrix, village-role mapping, mockup board, active image-generation backlog, prompt pack, integration spec, and QA checklist needed before the next UI implementation slice.
Asset rule: use existing FUXIE_3D_ASSETS, REWARD_ASSETS, and FUXIE_WORLD_PROPS as continuity references, then generate the v2 German Village assets needed for location, frame, mascot, reward, and mockup development.
UX rule: mascot, prop, frame, or motion must support a learning CTA, feedback moment, reward receipt, or empty/error state.
```

### 56.2 Da Trien Khai Trong Batch Nay

- Added the production spec at `docs/design/learner-ui-design-production-plan.md`.
- Added a learner-surface audit matrix covering Dashboard, Course, Vocabulary, Grammar, Reading, Listening, Speaking, Writing, Exam, Review, Shop, Chat, Badges, and Campaign.
- Added surface-to-village-role mapping, component mapping, asset mapping, motion rules, and QA acceptance criteria.
- Added the first deterministic mockup board at `docs/design/visual-audit/learner-ui-production-mockup-board-v1.svg`.
- Added an image production taxonomy that explicitly separates UI mockups, world/location props, mascot/state poses, reward objects, and UI frames/panels.
- Added prompt blocks for AI-generated mockups and assets so the German Village layer can expand without losing the study-first hierarchy.

### 56.3 Review Ket Qua

- The next implementation slice now has a single source of truth for what to audit, what to generate, where to integrate it, and how to avoid overdecorating.
- The plan protects the current learning-first UX by keeping the village layer moderate and job-based.
- Browser screenshots are still required for missing learner surfaces before any broad UI replacement: Grammar, Speaking, Shop, Chat, Badges, and Campaign.

## 57. Production QA Batch: Learner Visual Audit Inventory

### 57.1 Prompt Engineer

```text
Use case: make Batch 1 visual audit repeatable.
Feature: add a learner screenshot manifest, QA runbook, and inventory script for the Fuxie German Village learner UI pass.
Goal: reviewers can see which routes need screenshots, which existing screenshots are valid evidence, whether required assets exist, and which P0 surfaces must be captured first.
Constraint: do not change app runtime UI; this batch is audit tooling and documentation only.
```

### 57.2 Da Trien Khai Trong Batch Nay

- Added `docs/design/visual-audit/learner-ui-screenshot-manifest.json` with 14 learner surfaces, desktop/mobile screenshot targets, existing evidence, asset refs, and QA focus notes.
- Added `docs/design/learner-ui-visual-qa-runbook.md` with local dev-auth setup, screenshot naming rules, reviewer scorecard, team responsibilities, and stop rules.
- Added `scripts/learner-ui-visual-audit.ts`, which validates manifest screenshot targets, existing screenshot evidence, and referenced public assets.
- Updated `docs/design/learner-ui-design-production-plan.md` to link the runbook/manifest and include the inventory script in the command list.

### 57.3 Inventory Ket Qua

- Command: `pnpm exec tsx scripts/learner-ui-visual-audit.ts`.
- Surfaces tracked: 14.
- Expected village screenshots present: 0/28.
- Existing evidence screenshots present: 18/18.
- Asset refs present: 53/53.
- P0 capture queue: Dashboard, Course, Vocabulary, Reading, Listening, Speaking, Writing, Shop.
- Reports generated:
  - `tmp/learner-ui-visual-audit.md`
  - `tmp/learner-ui-visual-audit.json`

### 57.4 Review Ket Qua

- Asset readiness is good: every referenced mascot, world prop, and reward asset exists.
- Screenshot readiness is the next blocker: the new `*-village-v1-*` desktop/mobile evidence set still needs to be captured.
- The next practical implementation step is browser QA capture for the P0 queue so generation prompts and integration slots stay grounded in real UI surfaces.

## 58. Production QA Batch: Learner Screenshot Evidence And Handoff

### 58.1 Prompt Engineer

```text
Use case: execute the approved Fuxie Learner UI + Design Production Plan.
Feature: capture the learner UI evidence set, validate asset readiness, fix QA blockers found during capture, and produce a handoff for UI/UX + Design.
Scope: learner UI only, including P0 skill-player intro states.
Constraint: use screenshot evidence and inventory QA to define a proactive German Village generation roadmap, not to block new asset production.
```

### 58.2 Da Trien Khai Trong Batch Nay

- Seeded local QA data with content/course/dev learner state so Course, skill hubs, players, Exam, and Shop render meaningful screenshots.
- Captured 28/28 surface screenshots for Dashboard, Course, Vocabulary, Grammar, Reading, Listening, Speaking, Writing, Exam, Review, Shop, Chat, Badges, and Campaign.
- Captured 8/8 supplemental player screenshots for Reading, Listening, Writing, and Speaking.
- Added final handoff doc at `docs/design/learner-ui-design-production-handoff.md`.
- Fixed Course duplicate-render risk by deduping course module mappings before UI render.
- Fixed dev Speaking seed shape so the Speaking player starts with 3 real dev sentences instead of a 0-sentence intro.
- Added stable image sizing on shared mascot/reward image components used in learner chrome and gamification UI.

### 58.3 Inventory Ket Qua

- `pnpm exec tsx scripts/learner-ui-visual-audit.ts`: 14 surfaces, expected screenshots 28/28, existing evidence 18/18, asset refs 53/53.
- Surface capture report: `tmp/learner-ui-screenshot-capture.md`, 28/28 OK.
- Player capture report: `tmp/learner-ui-player-screenshot-capture.md`, 8/8 OK.
- Image generation follow-up: create an active v2 German Village manifest for location plates, UI frames, mascot poses, reward objects, and UI mockups.

### 58.4 Review Ket Qua

- The UI/UX and Design teams now have a concrete evidence set and handoff instead of a speculative asset list.
- The next implementation slice can stay P0-focused: Dashboard, Course, Vocabulary, Skill Player motivation/result loop, and Shop.
- Local dev screenshots may show the Next dev indicator in the bottom-left; it is not part of the product UI score.

## 59. Production Art Direction Batch: German Village Image Generation Roadmap

### 59.1 Prompt Engineer

```text
Use case: develop Fuxie into a German-learning village through planned image generation.
Feature: convert learner audit evidence into an active image-generation queue for UI/UX, Design System, Illustrator/3D, and Gamification.
Scope: learner UI only; prioritize Dashboard, Course, Vocabulary, Skill Player, Result loop, and Shop.
Goal: produce a manifest-driven generation roadmap with prompts, source targets, runtime targets, and integration targets for the v2 German Village layer.
Constraint: generated images must support CTA, feedback, reward, progression, locked, empty, or error states; no decorative asset without a UI job.
```

### 59.2 Da Trien Khai Trong Batch Nay

- Added `docs/design/fuxie-german-village-image-generation-strategy.md` as the shared art-direction and production-order document.
- Added `docs/design/visual-audit/fuxie-german-village-image-generation-manifest.json` with 5 batches, 36 planned generated assets, and 22 P0 assets.
- Added `scripts/fuxie-image-generation-plan.ts` to validate duplicate asset IDs, duplicate output targets, missing prompts, and report the generation queue.
- Updated `docs/design/learner-ui-design-production-plan.md` so Batch 3 is an active German Village generation pack with manifest-backed prompts and integration targets.
- Updated `docs/design/learner-ui-design-production-handoff.md` so UI/UX and Design receive the active generation queue alongside the screenshot evidence.

### 59.3 Generation Queue

- Batch A P0: 8 village location plates for Dashboard, Course, Vocabulary, Reading, Listening, Speaking, Writing, and Shop.
- Batch B P0: 8 reusable UI frames/panels for mission, checkpoint, collection, audio, letter receipt, result reveal, market shelf, and empty-state signpost.
- Batch C P1: 8 Fuxie learning-moment poses including quest planning, correction, listening, speaking, writing, shop approval, result celebration, and calm empty state.
- Batch D P1: 6 reward objects for XP, Fucoin, Streak Freeze, CEFR badges, Hint Ticket, and Unlock Key.
- Batch E P0: 6 UI mockups for Dashboard, Course, Vocabulary, Skill Player, Market/Inventory, and Result Receipt.

### 59.4 Review Ket Qua

- Direction is now corrected from image-generation gating to image-generation production strategy.
- Existing assets remain the v1 continuity layer; new assets are the v2 expansion layer for the Fuxie German Village.
- The manifest is now the source of truth for prompt order, file targets, and integration mapping before asset export.

## 60. Production Asset Batch: Batch A/B German Village Runtime Assets

### 60.1 Prompt Engineer

```text
Use case: produce the first runtime-ready generated assets for Fuxie German Village learner UI.
Feature: generate Batch A location plates and Batch B UI frames from the manifest, export source PNGs and 512px runtime WebP files, then wire P0 location plates into learner UI anchors.
Scope: learner UI P0 surfaces and generated asset maps only.
Goal: Dashboard, Course, Vocabulary, Reading, Listening, Speaking, Writing, and Shop have v2 location plates; UI/UX and Design have reusable frame assets ready for implementation.
Constraint: generated assets must be transparent/alpha-safe, readable at 96px, avoid external IP resemblance, and support a learning CTA, feedback state, reward state, empty state, or route identity.
```

### 60.2 Da Trien Khai Trong Batch Nay

- Generated Batch A 8/8 P0 location plates as source PNGs under `docs/design/asset-generation/source/`.
- Exported Batch A runtime WebP files under `apps/web/public/mascot-3d/world/optimized/v2/`.
- Generated Batch B 8/8 UI frames/state panels as source PNGs under `docs/design/asset-generation/source/`.
- Exported Batch B runtime WebP files under `apps/web/public/mascot-3d/ui/optimized/v1/`.
- Added QA contact sheet at `docs/design/asset-generation/fuxie-german-village-batch-a-b-contact-sheet.png`.
- Updated `FUXIE_WORLD_PROPS` with v2 generated location plate keys.
- Added `FUXIE_UI_FRAMES` with generated frame asset keys.
- Updated learner P0 anchor images to use v2 location plates in Dashboard, Course, Vocabulary, Reading, Listening, Speaking, Writing, and Shop.
- Updated the generation report script so it reports generated source/runtime counts from the manifest targets.

### 60.3 Inventory Ket Qua

- Generated source assets: 16/36.
- Generated runtime assets: 16/30.
- Batch A location plates: Dashboard, Course, Vocabulary, Reading, Listening, Speaking, Writing, Shop.
- Batch B frames/state panels: notice board, checkpoint node, collection card, audio broadcast panel, letter receipt, result reveal, market shelf, empty-state signpost.
- Contact sheet: `docs/design/asset-generation/fuxie-german-village-batch-a-b-contact-sheet.png`.

### 60.4 Review Ket Qua

- The village layer now has runtime-ready visual anchors rather than only prompts.
- The strongest integration value is on P0 route identity and reward-state framing; no learning logic or economy logic changed.
- Next production slice should generate Batch C mascot poses and then map them to feedback/result/empty states.

## 61. Production Asset Batch: Batch C Mascot State Runtime Pack

### 61.1 Prompt Engineer

```text
Use case: continue developing Fuxie into a German-learning village through mascot learning states.
Feature: produce Batch C mascot poses, export source PNGs and 512px runtime WebP files, then map them into learner feedback, skill motivation, result, and empty-state surfaces.
Scope: learner UI P0 feedback/result loops and generated mascot asset maps.
Goal: Fuxie has workflow-specific states for planning, correction, listening focus, speaking record, writing delivery, shop approval, result celebration, and calm empty/error moments.
Constraint: preserve existing Fuxie identity if a native generation pass drifts away from the approved mascot language.
```

### 61.2 Da Trien Khai Trong Batch Nay

- Generated Batch C 8/8 mascot learning-moment poses as source PNGs under `docs/design/asset-generation/source/`.
- Exported Batch C runtime WebP files under `apps/web/public/mascot-3d/states/v2/`.
- Added QA contact sheet at `docs/design/asset-generation/fuxie-german-village-batch-c-mascot-poses-contact-sheet.png`.
- Updated `FUXIE_MASCOT_STATES` with v2 generated mascot state keys.
- Updated `FUXIE_3D_ASSETS` so shared gamification components can use the v2 Batch C states.
- Mapped skill motivation and result surfaces to the new state pack: quest planner, listening focus, speaking record, writing delivery, gentle correction, and result celebration.
- Updated learner production plan, handoff, and image-generation strategy with the Batch C status.

### 61.3 Inventory Ket Qua

- Generated source assets: 24/36.
- Generated runtime assets: 24/30.
- Batch C mascot states: quest planner, gentle correction, listening focus, speaking record, writing delivery, shop approval, result celebration, calm empty state.
- Contact sheet: `docs/design/asset-generation/fuxie-german-village-batch-c-mascot-poses-contact-sheet.png`.

### 61.4 Review Ket Qua

- The mascot layer now supports learning-state jobs rather than only generic mascot decoration.
- Native image-generation attempts drifted on some mascot prompts, so this production pass uses approved v1 mascot/gamification art as the identity-preserving source layer and exports v2 runtime assets from it.
- Next production slice should generate Batch D reward objects, then replace reward reveal token art only where the new objects improve earned/receipt/pending clarity.

## 62. Production Asset Batch: Batch D Reward Object Runtime Pack

### 62.1 Prompt Engineer

```text
Use case: continue developing Fuxie into a German-learning village through reward artifacts.
Feature: generate Batch D reward objects, remove chroma-key backgrounds, export source PNGs and 512px runtime WebP files, then map them into reward preview, result reveal, shop item, and Dashboard reward states.
Scope: learner UI reward surfaces and generated reward asset maps.
Goal: XP, Fucoin, Streak Freeze, CEFR badge progress, Hint Ticket, and Unlock Key feel native to the village reward economy.
Constraint: reward assets must stay readable at 24-96px, avoid reward inflation, and support earned/receipt/pending clarity.
```

### 62.2 Da Trien Khai Trong Batch Nay

- Generated Batch D 6/6 reward objects as source PNGs under `docs/design/asset-generation/source/`.
- Removed chroma-key backgrounds and exported 512px runtime WebP files under `apps/web/public/reward-assets/optimized/`.
- Added QA contact sheet at `docs/design/asset-generation/fuxie-german-village-batch-d-reward-objects-contact-sheet.png`.
- Updated `REWARD_ASSETS` with village-native reward object keys.
- Mapped shared `RewardPreview` and `RewardRevealMoment` visuals to the Batch D reward objects.
- Updated shop item asset routing for support, learning, Streak Freeze, unlock, and fallback Fucoin items.
- Updated Dashboard Fucoin ledger/mission visuals to use the village Fucoin token.
- Updated learner production plan, handoff, and image-generation strategy with the Batch D status.

### 62.3 Inventory Ket Qua

- Generated source assets: 30/36.
- Generated runtime assets: 30/30.
- Batch D reward objects: XP star village token, Fucoin village token, Streak Freeze snowglobe, CEFR badge node set, Hint Ticket village coupon, Unlock Key signpost charm.
- Contact sheet: `docs/design/asset-generation/fuxie-german-village-batch-d-reward-objects-contact-sheet.png`.

### 62.4 Review Ket Qua

- The reward layer now has village-native runtime objects rather than relying only on the original v1 reward pack.
- This batch improves visual consistency in the motivation loop without changing XP, Fucoin, streak, shop, or unlock accounting.
- Next production slice should generate Batch E UI mockups for Dashboard, Course, Vocabulary, Skill Player, Market/Inventory, and Result Receipt.

## 63. Production Mockup Batch: Batch E Learner UI Mockups

### 63.1 Prompt Engineer

```text
Use case: finish the Fuxie German Village image-generation queue with screen-level implementation references.
Feature: generate Batch E high-fidelity UI mockups for Dashboard, Course, Vocabulary, Skill Player, Market/Inventory, and Result Receipt.
Scope: learner UI P0 design references only; mockups are not runtime assets.
Goal: UI/UX, Design, and Frontend have a shared visual target for the next implementation polish slice.
Constraint: mockups must preserve study-first hierarchy; village art supports mission, CTA, reward, progress, inventory, or result states.
```

### 63.2 Da Trien Khai Trong Batch Nay

- Generated Batch E 6/6 UI mockups under `docs/design/visual-audit/mockups/`.
- Added QA contact sheet at `docs/design/visual-audit/mockups/fuxie-german-village-batch-e-ui-mockups-contact-sheet.png`.
- Updated learner production plan, handoff, and image-generation strategy with the Batch E status.
- Completed the image-generation manifest queue: all 36 source targets now exist, and all 30 runtime targets exist.

### 63.3 Inventory Ket Qua

- Generated source assets: 36/36.
- Generated runtime assets: 30/30.
- Batch E mockups: Dashboard Village Square, Course Path, Vocabulary Collection Book, Skill Player Motivation Layer, Market Inventory, Result Receipt.
- Contact sheet: `docs/design/visual-audit/mockups/fuxie-german-village-batch-e-ui-mockups-contact-sheet.png`.

### 63.4 Review Ket Qua

- The production team now has both runtime assets and screen-level references for the learner German Village layer.
- Batch E should guide the next code slice; the mockup text itself is directional and should not be copied verbatim into production.
- Next implementation work should translate the mockup patterns into existing components, starting with Dashboard, Course, Vocabulary, Skill Player, Market/Inventory, and Result Receipt.

## 64. Frontend Integration Batch: Village Frames In Shared Reward And Skill Components

### 64.1 Prompt Engineer

```text
Use case: translate generated German Village frames into reusable learner UI components.
Feature: wire `FUXIE_UI_FRAMES` into shared reward reveal, checkpoint rail, and skill motivation rail components.
Scope: shared learner gamification UI only; no reward accounting, route data, or content changes.
Goal: Dashboard, Course, Vocabulary exercises, Speaking checkpoints, Reading/Listening/Writing players, and Result loops inherit village frame language through shared components.
Constraint: frame art must support state clarity and not compete with the CTA or exercise content.
```

### 64.2 Da Trien Khai Trong Batch Nay

- Imported `FUXIE_UI_FRAMES` into `quest-visuals.tsx`.
- Added a small reusable `FuxieFrameAccent` helper for stable decorative frame rendering.
- Added `resultRevealFrame` to `RewardRevealMoment` so earned/receipt/pending reward states share the generated result frame language.
- Added `courseCheckpointNode` to `QuestCheckpointRail` header and background so checkpoint states visually match the generated path node asset.
- Added skill-specific frame accents to `SkillMotivationRail`:
  - Reading uses `noticeBoard`.
  - Listening uses `audioBroadcastPanel`.
  - Writing uses `letterReceiptFrame`.
- Added the generated result frame behind the skill reward preview block.

### 64.3 Review Ket Qua

- The generated Batch B UI frames now affect real learner UI through shared components rather than one-off screen decoration.
- This improves visual consistency across P0 result, checkpoint, and skill-player motivation surfaces without changing learner data or economy logic.
- Next implementation slice can use the Batch E mockups for screen-specific layout polish on Dashboard, Course, Vocabulary, Market/Inventory, and Result Receipt.

## 65. Frontend Integration Batch: P0 Screen Frame Anchors

### 65.1 Prompt Engineer

```text
Use case: apply generated village frame assets to P0 learner screens without creating one-off decorative layouts.
Feature: wire state-appropriate `FUXIE_UI_FRAMES` into Dashboard mission cards, Vocabulary collection panels, and Shop item cards.
Scope: learner P0 visual anchors only; no data, economy, or content logic changes.
Goal: Dashboard, Vocabulary, and Market/Inventory show the same frame language as the shared result, checkpoint, and skill components.
Constraint: each frame must map to a state or surface role: notice board for mission, result frame for claimed, empty signpost for locked, collection frame for vocabulary, market shelf for shop.
```

### 65.2 Da Trien Khai Trong Batch Nay

- Dashboard `MissionCard` now selects frame accents by mission state:
  - `noticeBoard` for active/ready missions.
  - `resultRevealFrame` for claimed missions.
  - `emptyStateSignpost` for locked missions.
- Vocabulary selected-theme panels now use `collectionCardFrame` as a subtle card identity anchor.
- Shop item cards now use `marketShelfFrame` so catalog items share the generated market/inventory language.

### 65.3 Review Ket Qua

- The P0 learner surfaces now consume Batch B frames through both shared components and route-specific anchors.
- The changes remain visual-only and keep CTA, progress, and reward text above the frame layer.
- Next slice should use Batch E mockups to tune screen structure, starting with Dashboard mission/reward hierarchy and Market/Inventory density.

## 66. Frontend Integration Batch: Course Path And Result Receipt Mockup Alignment

### 66.1 Prompt Engineer

```text
Use case: translate Batch E Course Path and Result Receipt mockups into production UI anchors.
Feature: add generated frame accents to Course path nodes and the shared ResultRewardLoop receipt shell.
Scope: learner Course and shared result loop visual layer only.
Goal: path progression and post-lesson reward receipt better match the German Village mockup direction while preserving existing UX hierarchy.
Constraint: no learning data, scoring, XP, Fucoin, streak, or unlock logic changes.
```

### 66.2 Da Trien Khai Trong Batch Nay

- Course path hero now uses `courseCheckpointNode` as a subtle background anchor.
- Course module nodes now include the generated checkpoint frame inside each node while keeping module number, lock, and completion icons on top.
- Shared `ResultRewardLoop` now uses `resultRevealFrame` and `letterReceiptFrame` as low-opacity receipt/reveal accents.
- Score receipt circle now includes a subtle letter receipt frame without changing the score content or progress logic.

### 66.3 Review Ket Qua

- Course Path and Result Receipt now visually align better with Batch E mockups.
- The changes stay in existing components and keep the primary CTA and score/reward content readable.
- Next slice can continue screen-specific polish with Dashboard mission/reward hierarchy or Shop density once browser QA has DB available.

## 67. Browser QA Batch: Docker DB Rerun And Player Smoke

### 67.1 Prompt Engineer

```text
Use case: continue learner UI QA after Docker local DB is available.
Feature: rerun P0 learner browser smoke for village surfaces and skill players.
Scope: learner UI only; no teacher/admin expansion.
Goal: confirm generated village assets, frame integration, and skill-player motivation layers render against the local Docker database.
Constraint: use local dev auth and local Docker DB, not package-level production env files.
```

### 67.2 Da Trien Khai Trong Batch Nay

- Confirmed `localhost:3005` web and `127.0.0.1:5434` Docker DB were listening.
- Verified Prisma can connect to the local DB when `DATABASE_URL` is forced from the root `.env`.
- Found and documented an env pitfall: `packages/database/.env` can point at a different database, so local QA commands must override `DATABASE_URL` and `DATABASE_URL_UNPOOLED` from the root `.env`.
- Reran `pnpm db:seed:dev` against the local Docker DB.
- Captured Chrome/CDP QA screenshots under `tmp/browser-qa/cdp/` for Reading, Listening, Writing, and Speaking player desktop/mobile states.
- Fixed the local listening dev seed fixture in `scripts/seed-dev-data.ts` so `L-A1-DEV-001` uses an existing public MP3 instead of missing `/audio/dev/sample.mp3`.

### 67.3 Browser QA Ket Qua

- P0 list/browser surfaces captured by Chrome headless: Dashboard, Course, Vocabulary, Shop, Reading player, Listening player, Writing player, Speaking player.
- Dynamic player routes confirmed with local seed IDs:
  - Reading: `/reading/R-A1-DEV-001`.
  - Listening: `/listening/L-A1-DEV-001`.
  - Writing: `/writing/W-A1-DEV-001`.
  - Speaking: `/speaking/dev-a1-begruessung-01`.
- CDP smoke confirmed player pages moved past loading state and did not show the 404 page.
- After the audio fixture fix, Listening player desktop/mobile had `errorCount: 0`.
- Mobile player screenshots show the village motivation layer remains readable; install prompt may cover lower reward content during local QA and should be dismissed for final design scoring.

### 67.4 Verification

- `pnpm exec tsx scripts/fuxie-image-generation-plan.ts`: 36/36 generated source assets, 30/30 runtime assets.
- `pnpm exec tsx scripts/learner-ui-visual-audit.ts`: 28/28 expected screenshots, 53/53 asset refs.
- `pnpm qa:text-visual`: 0 errors, 761 warnings.
- `pnpm check:quick`: passed.
- `pnpm smoke:full-local`: web DB health, learner pages, learner APIs, teacher page/API, and admin page/API passed; AI health failed because the AI service was not running locally.

### 67.5 Review Ket Qua

- Docker DB unblocks browser QA for the learner German Village layer.
- The P0 visual layer is now verified against local seed data rather than only static manifest checks.
- The remaining QA follow-up is interaction-level result-state capture after completing one Reading, Listening, Writing, and Speaking exercise.
