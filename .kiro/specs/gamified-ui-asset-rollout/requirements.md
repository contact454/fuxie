# Requirements Document

## Introduction

Codex đã sinh xong một khối lượng lớn hình ảnh phục vụ giao diện game-hóa cho Fuxie (mascot 3D, world props, UI frames, reward props, module mascots, lesson illustrations). Feature này không tạo asset mới — feature này tiếp nhận pipeline đó và biến nó thành **giao diện học viên (learner UI) hoàn chỉnh, có thể vận hành**: rà soát toàn bộ asset đã có, ánh xạ chúng vào từng surface/state cụ thể, sửa lại UX/UI hiện tại theo Bright Sky direction, và đảm bảo game loop (mission → action → feedback → reward → unlock) đọc được trong 3 giây ở first viewport mobile.

Mục tiêu chính:

1. Phân phối toàn bộ ảnh đã sinh vào các surface P0 của learner một cách hợp lý (không asset mồ côi, không surface dùng placeholder cũ).
2. Sắp xếp lại hierarchy/CTA/feedback của các surface P0 sao cho game loop rõ ràng nhưng vẫn study-first.
3. Tập trung mọi tham chiếu asset qua một asset registry duy nhất để các batch asset tương lai có thể swap không cần đụng UI code.
4. Tôn trọng motion / reduced-motion / accessibility AA / mobile-first / Bright Sky palette.

Phạm vi (in-scope):

- Apps/web learner surfaces under `apps/web/src/app/(learn)/`: `dashboard`, `course`, `vocabulary` (incl. `practice`, `microgames`), `grammar` (incl. `topic`, `mocktest`), `reading/[exerciseId]`, `listening/[lessonId]`, `speaking/[lessonId]` (incl. `roleplay`), `writing/[exerciseId]`, `exam/[examId]`, `review`, `session`, `rewards/shop`, `chat`, `badges`, `campaign`, `leaderboard`.
- Components: `apps/web/src/components/gamification/*`, `apps/web/src/lib/mascot/fuxie-assets.ts`, các shared component được chia sẻ giữa các surface.
- Asset registries: `FUXIE_3D_ASSETS`, `FUXIE_WORLD_PROPS`, `FUXIE_MODULE_MASCOTS`, `FUXIE_MASCOT_STATES`, `FUXIE_UI_FRAMES`, `FUXIE_LIVING_3D_ASSETS`, `REWARD_ASSETS`.
- Asset thư mục: `apps/web/public/mascot-3d/**`, `apps/web/public/reward-assets/**`, `apps/web/public/images/{exams, grammar, reading, themes, vocab}`.

Phạm vi (out-of-scope):

- Sinh asset/hình mới (đã có pipeline image-gen riêng quản).
- Backend / economy logic (XP, Fucoin, streak, mission unlock, redeem). UI chỉ consume API hiện có.
- Teacher/admin UI.
- Dịch hoặc viết nội dung học mới.
- Thay đổi data model hoặc schema.

Source-of-truth tài liệu:

- `docs/design/learner-ui-design-production-plan.md` (audit matrix 14 surfaces, 36-asset queue, integration spec).
- `docs/design/learner-ui-design-production-handoff.md` (status: 28/28 screenshots, 53/53 assets exist, batches A–E generated, asset map đã wire).
- `docs/design/fuxie-visual-audit-gamefication.md` (Quest Worlds direction, Bright Sky color, reward + skill motivation patterns).
- `docs/design/fuxie-3d-mascot-system.md` (mascot rules, pose taxonomy, optimization).
- `docs/design/learner-ui-visual-qa-runbook.md` (QA standards).

## Glossary

- **Learner_Surface**: Một route dưới `apps/web/src/app/(learn)/`, ví dụ `dashboard`, `course`, `vocabulary/practice`. Mỗi surface có tập state {default, loading, empty, locked, error, success}.
- **Asset_Registry**: Tập hợp các bản đồ key→path được export từ `apps/web/src/lib/mascot/fuxie-assets.ts` và `apps/web/src/components/gamification/reward-assets.ts`. Bao gồm `FUXIE_3D_ASSETS`, `FUXIE_WORLD_PROPS`, `FUXIE_MODULE_MASCOTS`, `FUXIE_MASCOT_STATES`, `FUXIE_UI_FRAMES`, `FUXIE_LIVING_3D_ASSETS`, `REWARD_ASSETS`.
- **Asset_Key**: Chuỗi định danh asset trong Asset_Registry (ví dụ `"coach-hero"`, `"village-square"`, `"reward-badge-a1"`). Component KHÔNG được hardcode đường dẫn `/mascot-3d/...` hay `/reward-assets/...`; phải đi qua Asset_Key.
- **Mascot_Role**: Vai của Fuxie trên một surface. Một trong: `coach` (hướng dẫn / first viewport), `companion` (đi cùng quá trình học), `cheer` (reward / streak / level-up), `guard` (locked / empty / error), `silent` (không hiện mascot).
- **World_Prop**: Asset môi trường (building, props, learning-props, themes) dùng để định danh surface (ví dụ Library cho Reading, Cafe cho Speaking) nhưng không phải nhân vật.
- **Reward_State**: Một trong: `preview` (trước action, hiển thị thứ sẽ nhận), `earned` (sau khi action thành công, có animation reveal), `receipt` (lưu trữ trong inventory/badges/shop sau đó), `locked` (chưa đủ điều kiện), `pending` (đang xử lý).
- **Bright_Sky_Palette**: Hệ màu chính: blue `#54A8E4` / `#60A8E4`, deep `#3C78A8` / `#173B56`, teal `#2EC4B6`, success/CEFR-A1 green, **reward amber `#FFB703` chỉ dùng trong Reward_State**, energy orange `#FF8A3D` chỉ dùng accent.
- **First_Viewport_Mobile**: Vùng nhìn thấy được trên thiết bị 390×844 (iPhone 13/14 logical) khi `scrollY=0`.
- **Primary_CTA**: Button chính dẫn người học về hành động học chính của surface đó (ví dụ "Vào học hôm nay" trên Dashboard, "Bắt đầu bài tập" trên Reading).
- **Game_Loop**: Chuỗi mission → action → feedback → reward → unlock thể hiện trên UI mỗi surface.
- **Skill_Motivation_Layer**: Component phủ trên Reading/Listening/Speaking/Writing player để hiện mascot coach + progress + reward preview mà không che nội dung học.
- **Result_Reward_Loop**: Component hiện ở cuối session/lesson, gồm `earned` (animation tiền-coin/badge bay vào ví) và `receipt` (tóm tắt số liệu + CTA next).
- **Reduced_Motion_Mode**: Trạng thái khi `prefers-reduced-motion: reduce` được set, hoặc khi user chọn tắt animation trong settings.
- **Asset_Coverage**: Số phần trăm Asset_Key trong Asset_Registry được ít nhất một component đang ship tham chiếu tới.
- **Orphan_Asset**: File ảnh tồn tại trong `apps/web/public/mascot-3d/**` hoặc `apps/web/public/reward-assets/**` nhưng KHÔNG được Asset_Registry nào tham chiếu.
- **Placeholder_Reference**: Component đang dùng đường dẫn `/mascot-3d/raw/*`, `/mascot-3d/concept/*`, hoặc string đường dẫn cứng thay vì đi qua Asset_Registry.

## Requirements

### Requirement 1: Asset Registry là single source of truth

**User Story:** As a frontend engineer, I want every mascot, world prop, UI frame and reward image to be referenced through a single Asset_Registry, so that I can swap a new image batch without grepping the codebase.

#### Acceptance Criteria

1. THE Asset_Registry SHALL expose 7 typed maps có tên `FUXIE_3D_ASSETS`, `FUXIE_MASCOT_STATES`, `FUXIE_MODULE_MASCOTS`, `FUXIE_WORLD_PROPS`, `FUXIE_UI_FRAMES`, `FUXIE_LIVING_3D_ASSETS`, `REWARD_ASSETS`. Mỗi map là một typed object với key string-literal và value là path string trỏ tới file dưới `apps/web/public/`.
2. WHEN một component cần render image thuộc một trong 7 nhóm trên, THE Component SHALL resolve path bằng cách gọi hàm tra cứu Asset_Registry với một Asset_Key, và KHÔNG được embed path string trực tiếp.
3. IF một file `.ts`/`.tsx` dưới `apps/web/` (ngoại trừ chính file `fuxie-assets.ts`, file `reward-assets.ts`, và các test file của hai file đó) chứa string literal bắt đầu bằng một trong các prefix `/mascot-3d/`, `/reward-assets/`, `/mascot-3d/raw/`, `/mascot-3d/concept/`, `/mascot-3d/reference-parts/`, `/reward-assets/raw/`, hoặc `/mascot-3d/foundation/`, THEN THE CI lint job SHALL fail với non-zero exit code và block PR merge.
4. WHEN một Asset_Key được tham chiếu, THE Asset_Registry SHALL trả về một path mà file tương ứng tồn tại trong `apps/web/public/` tại thời điểm build.
5. THE build pipeline SHALL chạy integrity check qua tất cả 7 maps; IF bất kỳ Asset_Key nào trỏ tới file không tồn tại, THEN THE build SHALL fail với danh sách các key bị thiếu và group tương ứng.
6. WHEN hàm tra cứu Asset_Registry được gọi với một key không tồn tại trong map đó, THE Asset_Registry SHALL trả về default placeholder path (file `apps/web/public/mascot-3d/optimized/fuxie-placeholder-512.webp` hoặc tương đương được khai báo); và WHILE `process.env.NODE_ENV === 'development'`, THE Asset_Registry SHALL log một warning tới console nhận diện được key đã miss và group dự kiến.

### Requirement 2: Asset coverage và orphan cleanup

**User Story:** As a product designer, I want every generated image to be either wired into a surface or explicitly archived, so that the asset library reflects what is actually shipping.

#### Acceptance Criteria

1. THE Asset_Registry SHALL bao phủ ≥ 95% các file có đuôi `.webp`, `.png`, `.jpg`, `.jpeg`, `.svg` nằm trực tiếp (không tính sub-folder) trong: `apps/web/public/mascot-3d/optimized/`, `apps/web/public/mascot-3d/world/optimized/`, `apps/web/public/mascot-3d/ui/optimized/`, và `apps/web/public/reward-assets/optimized/`.
2. IF một file ảnh `.webp`/`.png`/`.jpg`/`.jpeg`/`.svg` trong các thư mục optimized trên không được tham chiếu bởi bất kỳ Asset_Key đang ship nào (Orphan_Asset), THEN file đó SHALL có entry tương ứng (path đầy đủ + lý do archive ngắn gọn) trong `docs/design/asset-archive.md`, hoặc file đó không tồn tại trong `public/`.
3. THE Asset_Registry SHALL không chứa Asset_Key nào trỏ tới file nằm dưới `apps/web/public/mascot-3d/raw/`, `apps/web/public/mascot-3d/concept/`, `apps/web/public/mascot-3d/reference-parts/`, `apps/web/public/mascot-3d/foundation/`, hoặc `apps/web/public/reward-assets/raw/`.
4. WHEN khai báo một Asset_Key, IF cùng tên file tồn tại dưới cả `optimized/*.webp` và một thư mục khác (ví dụ `raw/*.png`), THEN THE Asset_Registry SHALL chọn path `optimized/*.webp`.
5. THE CI SHALL chạy một asset audit job; IF coverage < 95%, hoặc có Orphan_Asset chưa archive, hoặc có Asset_Key vi phạm AC3, THEN THE job SHALL fail với non-zero exit code và liệt kê các vi phạm.

### Requirement 3: Dashboard – Village Square hierarchy

**User Story:** As a learner mở Fuxie buổi sáng, I want to see one obvious "tiếp tục học" CTA, my streak, and Fuxie chào mình ngay đầu màn hình, so that tôi không phải nghĩ phải bấm gì.

#### Acceptance Criteria

1. WHEN learner đã đăng nhập điều hướng tới Dashboard trên viewport 390×844, THE Dashboard SHALL hiển thị đúng một Primary_CTA "Tiếp tục học" với tap target ≥ 44×44 px nằm hoàn toàn trong First_Viewport_Mobile (toạ độ y của cạnh dưới CTA ≤ 844 px tính từ top) trong vòng 2.5 giây kể từ khi điều hướng bắt đầu, không yêu cầu scroll.
2. WHEN Dashboard render ở trạng thái có lộ trình, THE Dashboard SHALL hiển thị mascot ở Mascot_Role `coach` cùng greeting đọc theo locale của learner profile (vi hoặc de; mặc định vi nếu locale rỗng) trong First_Viewport_Mobile, và mascot KHÔNG được phủ lên Primary_CTA hoặc streak count.
3. WHEN Dashboard render ở trạng thái có lộ trình, THE Dashboard SHALL hiển thị streak count (số nguyên ≥ 0), today's XP target (số nguyên ≥ 0) và quest progress hero trong khoảng cách scroll ≤ 2 × viewport height (≤ 1688 px tính từ top of page), mỗi phần tử có nhãn nhận diện được bằng test selector ổn định.
4. WHERE world prop "village-square" tồn tại trong Asset_Registry, THE Dashboard SHALL dùng nó làm background identity và đảm bảo contrast ratio đo được giữa text/CTA và background ≥ 4.5:1 cho body text và ≥ 3:1 cho large text (≥ 18.66 px regular hoặc ≥ 14 px bold).
5. IF world prop "village-square" không tồn tại trong Asset_Registry, THEN THE Dashboard SHALL fallback về solid background của design system và vẫn duy trì contrast ratio như Acceptance Criterion 4.
6. IF learner chưa có lộ trình hoặc đăng nhập lần đầu (chưa có active learning path record), THEN THE Dashboard SHALL hiển thị empty state với mascot ở Mascot_Role `guard`, Primary_CTA "Tạo lộ trình", và KHÔNG render streak count, XP target, hay quest progress hero.
7. IF dashboard data fail to load (request lỗi hoặc timeout > 10 giây), THEN THE Dashboard SHALL hiển thị error state trong vòng 1 giây sau khi phát hiện lỗi với Primary_CTA "Thử lại" và mascot ở Mascot_Role `guard`, không hiển thị reward amber, và không thay đổi streak count đã lưu trên server.

### Requirement 4: Course Path – nodes có hierarchy rõ

**User Story:** As a learner, I want my course path to feel like a quest map where I can see what's next, what's locked, and what's done, so that I know exactly which node to bấm.

#### Acceptance Criteria

1. THE Course_Surface SHALL render từng lesson như một node với đúng một trong 5 state: `locked` (prerequisite chưa hoàn thành), `available` (prerequisite đã đạt nhưng chưa khởi đầu), `in-progress` (đã có ít nhất một lần khởi đầu nhưng chưa hoàn thành), `completed` (đáp ứng pass criteria của lesson), `mastered` (đáp ứng pass criteria và đạt mastery threshold của course path).
2. WHEN một node ở state `available`, THE Course_Surface SHALL áp Primary_CTA visual treatment màu Bright_Sky blue cho node đó, contrast ratio ≥ 4.5:1 giữa text/biểu tượng node và background, và đặt focus order DOM để node `available` đầu tiên (theo thứ tự trong path) là interactive element được focus đầu tiên khi navigate bằng Tab key.
3. IF có nhiều hơn một node ở state `available` cùng lúc, THEN THE Course_Surface SHALL áp Primary_CTA visual treatment chỉ cho node `available` đầu tiên trong path order; các node `available` còn lại SHALL hiển thị visual treatment thứ cấp (ví dụ outline blue, không filled).
4. WHEN một node ở state `locked`, THE Course_Surface SHALL hiển thị icon khóa lấy từ Asset_Key thuộc nhóm `FUXIE_WORLD_PROPS` và hiển thị tooltip mô tả prerequisite cụ thể (tên lesson hoặc module cần hoàn thành) trong vòng 200ms khi user hover hoặc focus vào node.
5. WHEN một node ở state `in-progress`, THE Course_Surface SHALL hiển thị progress indicator (ví dụ thanh tiến trình hoặc tỷ lệ %) với giá trị từ 0 đến 100, được tính từ số bước đã hoàn thành trong lesson chia cho tổng số bước.
6. WHEN một node ở state `completed`, THE Course_Surface SHALL hiển thị badge từ `REWARD_ASSETS` ở Reward_State `receipt` (badge tĩnh, không animation reveal).
7. WHEN một node ở state `mastered`, THE Course_Surface SHALL hiển thị badge `mastered` (Asset_Key thuộc `REWARD_ASSETS`) ngoài badge `completed`, để phân biệt visual giữa hai state.
8. WHILE viewport rộng < 768px, THE Course_Surface SHALL render path theo trục dọc (vertical scroll), và tên node SHALL không bị cắt: với tên ≤ 40 ký tự hiển thị tối đa 2 dòng (ellipsis sau dòng 2), với tên > 40 ký tự áp ellipsis sau 2 dòng và giữ tooltip chứa tên đầy đủ.
9. THE Course_Surface SHALL hiển thị module mascot tương ứng (Asset_Key thuộc `FUXIE_MODULE_MASCOTS`) cho từng cụm module, mỗi cụm hiển thị đúng một mascot.
10. IF mascot asset hoặc badge asset (`FUXIE_MODULE_MASCOTS` hoặc `REWARD_ASSETS`) không load được trong vòng 3 giây, THEN THE Course_Surface SHALL hiển thị placeholder visual (ví dụ icon hình tròn neutral) thay thế và KHÔNG block render của node, đồng thời log warning trong development mode.

### Requirement 5: Vocabulary – Collection Book

**User Story:** As a learner, I want vocabulary to feel like sưu tập thẻ Fuxie, so that mỗi từ tôi học cảm thấy như một thẻ tôi đã thu thập.

#### Acceptance Criteria

1. THE Vocabulary_Surface SHALL hiển thị danh sách từ ở dạng card, mỗi card render đúng một trong 3 visual state `new`, `learning`, `mastered`; mỗi state có một nhãn trạng thái text rõ ràng và một chỉ báo hình ảnh (ví dụ icon, màu viền, hoặc frame) khác biệt giữa các state để 2 tester độc lập nhận diện được mà không cần đọc code.
2. WHEN trạng thái của một từ chuyển sang `mastered` (đáp đúng ≥ 3 lần ôn tập liên tiếp gần nhất), THE Vocabulary_Surface SHALL áp một frame được chọn từ `FUXIE_UI_FRAMES` lên card từ đó trong vòng 1 giây sau khi trạng thái chuyển.
3. WHEN learner mở `/vocabulary/practice` trên thiết bị mobile, THE Vocabulary_Practice SHALL hiển thị mascot ở Mascot_Role `companion` và Primary_CTA "Bắt đầu" nằm hoàn toàn trong First_Viewport_Mobile (không cần cuộn) trong vòng 2 giây kể từ khi route được điều hướng.
4. WHILE learner đang ở trang `/vocabulary/microgames` và chưa bấm Primary_CTA bắt đầu, THE Vocabulary_Microgames SHALL hiển thị Reward_State `preview` gồm hình ảnh phần thưởng (lấy từ `REWARD_ASSETS`) và một nhãn mô tả phần thưởng (ví dụ "+10 Fucoin"); state này SHALL chỉ thay đổi sau khi learner bấm Primary_CTA bắt đầu.
5. IF danh sách từ của learner = 0 (chưa có từ nào), THEN THE Vocabulary_Surface SHALL hiển thị empty state với mascot ở Mascot_Role `guard`, một câu giải thích localized, và Primary_CTA "Học từ đầu tiên" nằm hoàn toàn trong First_Viewport_Mobile trên thiết bị mobile.
6. IF frame asset từ `FUXIE_UI_FRAMES` không tải được khi áp lên card `mastered`, THEN THE Vocabulary_Surface SHALL hiển thị card với chỉ báo trạng thái mặc định (ví dụ viền màu success), hiển thị thông báo lỗi non-blocking dưới dạng toast hoặc inline message, và không xoá dữ liệu trạng thái `mastered` của từ.

### Requirement 6: Skill players – Reading / Listening / Speaking / Writing

**User Story:** As a learner đang làm bài Reading/Listening/Speaking/Writing, I want a thin motivation layer giữ tôi tập trung — mascot coach, progress bar, reward preview — mà không che bài, so that tôi biết mình đang ở đâu và sắp được gì.

#### Acceptance Criteria

1. WHEN một Skill_Player_Surface (reading, listening, speaking, writing) load xong dữ liệu bài, THE Skill_Player_Surface SHALL render Skill_Motivation_Layer với toàn bộ nội dung của layer nằm hoàn toàn trong First_Viewport_Mobile.
2. WHILE bài tập đang diễn ra trên thiết bị mobile (≤ 480 px), THE Skill_Motivation_Layer SHALL chiếm ≤ 20% chiều cao viewport (≤ 169 px tại viewport 844 px), và bounding box của layer KHÔNG được giao với bounding box của vùng nội dung học (text passage, audio player, prompt).
3. THE Skill_Motivation_Layer SHALL hiển thị: (a) đúng một mascot ở Mascot_Role `coach`, (b) progress text format "{số câu đã làm}/{tổng số câu}" trong đó cả 2 số là số nguyên không âm và "số câu đã làm" ≤ "tổng số câu", (c) đúng một Reward_State `preview` chứa Asset_Key từ `REWARD_ASSETS`.
4. WHEN learner Reading, THE Reading_Surface SHALL render background identity bằng World_Prop có Asset_Key membership trong `FUXIE_WORLD_PROPS` và tag thuộc nhóm `library` (ví dụ `library`, `library-shelf`, `reading-room`).
5. WHEN learner Listening, THE Listening_Surface SHALL render background identity bằng World_Prop có Asset_Key membership trong `FUXIE_WORLD_PROPS` và tag thuộc nhóm `studio` hoặc `radio` (ví dụ `radio-booth`, `studio`, `broadcast-room`).
6. WHEN learner Speaking, THE Speaking_Surface SHALL render background identity bằng World_Prop có Asset_Key membership trong `FUXIE_WORLD_PROPS` và tag thuộc nhóm `cafe` hoặc `plaza` (ví dụ `cafe`, `plaza`, `town-square`).
7. WHEN learner mở `/speaking/[lessonId]/roleplay`, THE Speaking_Roleplay SHALL hiển thị đúng một mascot ở Mascot_Role `companion` đặt ở vị trí đối diện learner avatar (mascot bounding box và avatar bounding box nằm trên cùng một trục ngang, cách nhau theo hướng đối diện).
8. WHEN learner Writing, THE Writing_Surface SHALL render background identity bằng World_Prop có Asset_Key membership trong `FUXIE_WORLD_PROPS` và tag thuộc nhóm `desk` hoặc `workshop` (ví dụ `writing-desk`, `workshop`, `study-room`).
9. WHILE bài tập đang diễn ra (state `in-progress`), THE Skill_Player_Surface SHALL không render bất kỳ pixel nào có giá trị màu `#FFB703` hoặc thuộc tập tương đương (rgb(255, 183, 3) ± 5% từng kênh) ngoài bounding box của Reward_State `preview` đã được khai báo trong Skill_Motivation_Layer.
10. IF audio asset hoặc text passage không load được trong vòng 10 giây kể từ khi route navigate, THEN THE Skill_Player_Surface SHALL hiển thị error state với đúng một Primary_CTA "Thử lại", giữ nguyên progress đã lưu của bài, và không phát bất kỳ animation reward nào.
11. IF learner bấm Primary_CTA "Thử lại" 3 lần liên tiếp mà retry vẫn fail, THEN THE Skill_Player_Surface SHALL hiển thị fallback message localized hướng dẫn learner kiểm tra kết nối hoặc thoát về `/dashboard`, và CTA "Thử lại" SHALL chuyển sang trạng thái secondary (không còn là Primary_CTA).

### Requirement 7: Result Reward Loop – earned vs receipt

**User Story:** As a learner vừa hoàn thành một lesson hoặc session, I want một khoảnh khắc "earned" cảm xúc rồi tới một "receipt" rõ ràng để tôi biết next step, so that tôi cảm thấy được thưởng nhưng vẫn biết đi đâu tiếp.

#### Acceptance Criteria

1. WHEN learner hoàn thành lesson hoặc session thành công, THE Result_Reward_Loop SHALL hiển thị giai đoạn `earned` trước trong khoảng 1.2s đến 2.0s, sau đó tự động chuyển sang giai đoạn `receipt` mà không yêu cầu learner tap.
2. WHILE đang ở giai đoạn `earned`, THE Result_Reward_Loop SHALL hiển thị mascot ở Mascot_Role `cheer`, một asset reward được chọn từ `REWARD_ASSETS`, và animation reveal với thời lượng từ 1.2s đến 2.0s.
3. WHILE đang ở giai đoạn `receipt`, THE Result_Reward_Loop SHALL hiển thị tổng XP earned (số nguyên ≥ 0), tổng Fucoin earned (số nguyên ≥ 0), accuracy (phần trăm từ 0 đến 100, làm tròn đến số nguyên), và time spent (định dạng mm:ss, tối đa 99:59).
4. WHILE đang ở giai đoạn `receipt`, THE Result_Reward_Loop SHALL hiển thị đúng một Primary_CTA với nhãn "Tiếp tục" hoặc "Học bài kế tiếp" tùy theo ngữ cảnh next step có sẵn hay không.
5. WHERE Reduced_Motion_Mode được bật, THE Result_Reward_Loop SHALL bỏ qua animation reveal và hiển thị frame cuối của giai đoạn `earned` cùng nội dung giai đoạn `receipt` trong vòng 200ms kể từ khi learner hoàn thành lesson hoặc session.
6. IF action lưu kết quả thất bại do lỗi network hoặc lỗi server, THEN THE Result_Reward_Loop SHALL không vào giai đoạn `earned`, giữ nguyên dữ liệu lesson chưa được consume, và hiển thị error state với thông báo cho biết kết quả chưa được lưu cùng Primary_CTA "Thử lại".
7. WHEN learner tap Primary_CTA "Thử lại" trong error state, THE Result_Reward_Loop SHALL thực hiện lại action lưu kết quả tối đa 3 lần liên tiếp trước khi hiển thị thông báo yêu cầu learner kiểm tra kết nối và thử lại sau.

### Requirement 8: Shop / Inventory – wallet, affordability, ownership

**User Story:** As a learner muốn dùng Fucoin để mua phụ kiện cho Fuxie, I want to see ví của tôi, item nào tôi đủ tiền mua, item nào đã sở hữu, ngay cùng một chỗ.

#### Acceptance Criteria

1. WHEN Shop_Surface (`/rewards/shop`) load xong wallet data, THE Shop_Surface SHALL hiển thị Fucoin balance (số nguyên 0–9,999,999) và XP (số nguyên 0–9,999,999) nằm hoàn toàn trong First_Viewport_Mobile (viewport 360–480 px width) mà không cần scroll.
2. THE Shop_Surface SHALL phân loại mỗi item về đúng một state:
   - `affordable` khi Fucoin balance ≥ price AND item chưa owned AND không có unlock condition chưa thỏa,
   - `unaffordable` khi Fucoin balance < price AND item chưa owned AND không có unlock condition chưa thỏa,
   - `owned` khi item đã có trong inventory,
   - `pending` khi đã gửi redeem request nhưng chưa nhận response,
   - `locked` khi có unlock condition (level / streak / badge) chưa thỏa.
3. WHEN một item ở state `affordable`, THE Shop_Surface SHALL hiển thị Primary_CTA "Đổi" ở trạng thái enabled cho item đó.
4. WHEN một item ở state `unaffordable`, THE Shop_Surface SHALL disable nút "Đổi" và hiển thị hint với số coin còn thiếu = (price − Fucoin balance), số nguyên dương.
5. WHEN một item ở state `owned`, THE Shop_Surface SHALL hiển thị badge "đã sở hữu" và CTA "Trang bị" thay cho "Đổi"; CTA "Trang bị" SHALL không hiển thị màu Primary (Bright_Sky blue) trừ khi item đó đang được equipped.
6. WHEN một item chuyển sang state `pending` (sau khi learner bấm "Đổi"), THE Shop_Surface SHALL hiển thị spinner trên item card và disable CTA cho tới khi response trở về hoặc đạt timeout 10 giây.
7. IF state `pending` đạt timeout 10 giây mà chưa có response, THEN THE Shop_Surface SHALL chuyển item về state trước đó (`affordable` hoặc `unaffordable` tùy theo balance hiện tại), enable lại CTA, và hiển thị toast error non-blocking.
8. THE Shop_Surface SHALL có tab/section Inventory hiển thị danh sách item learner đã sở hữu, giới hạn 200 item gần nhất, scroll theo chiều dọc; mỗi item hiển thị Asset_Key tương ứng từ `REWARD_ASSETS`.
9. WHEN learner equip một item từ Inventory, THE Shop_Surface SHALL cập nhật mascot hiển thị item đó trong vòng 1 giây.
10. IF shop data fail to load (network error, server error, hoặc timeout 10 giây), THEN THE Shop_Surface SHALL hiển thị error state với Primary_CTA "Thử lại", hiển thị wallet ở giá trị cached gần nhất nếu có, và KHÔNG hiển thị reward amber animation.

### Requirement 9: Review surface – next-action focus

**User Story:** As a learner mở Review, I want biết rõ hôm nay phải ôn gì và bấm vào đó được ngay, so that tôi không bị overwhelmed bởi danh sách.

#### Acceptance Criteria

1. WHEN có ít nhất một item due hoặc overdue, THE Review_Surface SHALL hiển thị Primary_CTA "Ôn ngay" với tap target ≥ 48×48 dp nằm hoàn toàn trong First_Viewport_Mobile (vùng có chiều cao ≤ 640 px tính từ top, không scroll), dẫn vào batch ôn tập kế tiếp gồm tối đa 20 item.
2. THE Review_Surface SHALL hiển thị số item due hôm nay (số nguyên 0–9999) và số item overdue (số nguyên 0–9999); IF giá trị > 9999, THEN THE Review_Surface SHALL hiển thị "9999+".
3. THE Review_Surface SHALL render số item due bằng màu Bright_Sky blue và số item overdue bằng deep blue; THE Review_Surface SHALL không dùng màu đỏ alarming cho cả hai chỉ số.
4. WHEN số item due hôm nay = 0 AND số item overdue = 0, THE Review_Surface SHALL hiển thị empty state với mascot ở Mascot_Role `cheer` và đúng một Primary_CTA "Học bài mới".
5. WHILE còn ít nhất một item due hoặc overdue chưa được hoàn thành trong phiên hiện tại, THE Review_Surface SHALL hiển thị Reward_State `preview` cho phần thưởng dự kiến nếu hoàn thành toàn bộ batch hôm nay, kèm nhãn "chưa nhận".
6. IF dữ liệu Review_Surface không tải được trong vòng 5 giây hoặc trả về lỗi, THEN THE Review_Surface SHALL hiển thị error state với mascot ở Mascot_Role `guard` và Primary_CTA "Thử lại"; KHÔNG hiển thị Primary_CTA "Ôn ngay" trong error state này.

### Requirement 10: Exam surface – credibility & focus

**User Story:** As a learner luyện thi Goethe/telc, I want exam surface trông chuyên nghiệp và đáng tin, không bị game overlay làm phân tâm, so that tôi tin Fuxie chuẩn bị tôi cho kỳ thi thật.

#### Acceptance Criteria

1. WHILE learner đang trong session exam (`/exam/[examId]`, state `in-progress`), THE Exam_Surface SHALL không render mascot animation, không phát reward animation, không hiển thị streak indicator, không hiển thị XP/coin badge, và không phát sound effect game.
2. WHILE learner đang trong session exam, THE Exam_Surface SHALL hiển thị timer định dạng mm:ss (cập nhật mỗi giây), counter số câu định dạng "{đã làm} / {tổng}" (ví dụ "3 / 25"), và Primary_CTA "Nộp bài" ở vị trí cố định (fixed) luôn hiển thị không cần scroll.
3. WHEN timer countdown đạt 00:00, THE Exam_Surface SHALL tự động submit bài và chuyển sang Exam_Result_Surface trong vòng 2 giây.
4. THE Exam_Surface SHALL chỉ dùng palette neutral và deep blue cho UI components trong khi exam đang diễn ra; THE Exam_Surface SHALL không dùng reward amber (`#FFB703`) trên bất kỳ UI component nào trong state `in-progress`.
5. WHEN learner xác nhận nộp bài (bấm "Nộp bài" và confirm), THE Exam_Result_Surface SHALL kích hoạt Result_Reward_Loop chuẩn (Requirement 7) trong vòng 2 giây sau khi server confirm submission.
6. IF learner mất kết nối giữa exam, THEN THE Exam_Surface SHALL pause timer, lưu local progress (answers đã chọn + remaining time) mỗi 5 giây, hiển thị error state với Primary_CTA "Tiếp tục" disabled cho tới khi reconnect; WHEN reconnect xác nhận, THE Exam_Surface SHALL enable Primary_CTA "Tiếp tục" và resume timer từ remaining time đã lưu.
7. IF learner đóng tab hoặc reload trang trong khi exam `in-progress`, THEN THE Exam_Surface SHALL có recovery window 60 phút: WHEN learner mở lại exam trong window đó, THE Exam_Surface SHALL khôi phục answers và remaining time từ local progress.

### Requirement 11: Locked / Empty / Error state phải có next-action

**User Story:** As a learner gặp một surface chưa có dữ liệu, bị khóa, hoặc lỗi, I want luôn thấy bước tiếp theo phải làm gì, so that tôi không bị kẹt.

#### Acceptance Criteria

1. THE every Learner_Surface SHALL implement ít nhất 3 state: `default`, `empty`, `error`.
2. IF một Learner_Surface có gating (ví dụ yêu cầu hoàn thành module trước), THEN THE Surface SHALL implement thêm state `locked`.
3. WHEN một Learner_Surface ở state `empty`, THE Surface SHALL hiển thị mascot ở Mascot_Role `guard`, đúng một câu giải thích localized với độ dài ≤ 140 ký tự, và đúng một Primary_CTA dẫn về một hành động khả thi.
4. WHEN một Learner_Surface ở state `locked`, THE Surface SHALL hiển thị điều kiện mở khóa cụ thể tham chiếu một đơn vị học xác định (ví dụ "Hoàn thành A1 module 2 lesson 3") với độ dài ≤ 140 ký tự, và đúng một Primary_CTA dẫn tới hành động unlock đó.
5. WHEN một Learner_Surface ở state `error`, THE Surface SHALL hiển thị đúng một Primary_CTA "Thử lại" để retry action gần nhất, đường dẫn về Dashboard ở dạng secondary action, và preserve user input (form data, selection) đã có trước lỗi.
6. IF learner bấm Primary_CTA "Thử lại" trong state `error` quá 3 lần trong vòng 60 giây, THEN THE Surface SHALL disable Primary_CTA "Thử lại" cho 30 giây kế tiếp và hiển thị thông báo gợi ý kiểm tra kết nối.
7. WHILE một Learner_Surface đang ở state `locked`, `empty`, hoặc `error`, THE Surface SHALL không render reward amber animation, sound effect celebration, hoặc bất kỳ visual treatment nào thuộc Reward_State `earned`.

### Requirement 12: Mascot role consistency

**User Story:** As a product designer, I want Fuxie xuất hiện với một vai trò duy nhất, đúng tình huống trên mỗi surface, so that mascot không bị dùng tùy tiện làm decoration.

#### Acceptance Criteria

1. THE Mascot_Role enumeration SHALL bao gồm đúng 5 giá trị: `coach`, `companion`, `cheer`, `guard`, `silent`.
2. THE every Learner_Surface SHALL khai báo Mascot_Role mong đợi cho mỗi state (`default`, `empty`, `locked`, `error`, `success`) của surface đó trong cấu hình surface.
3. IF một state của Learner_Surface không khai báo Mascot_Role, THEN Mascot_Role SHALL mặc định là `silent` (không render mascot) và build SHALL log warning trong development.
4. WHEN một surface render mascot, THE Component SHALL chọn pose từ `FUXIE_MASCOT_STATES` khớp với Mascot_Role đã khai báo cho state hiện tại.
5. WHERE Reward_State của surface là `earned`, OR WHERE state của surface là `empty` AND learner đã hoàn thành mục tiêu (ví dụ "Bạn đã ôn xong"), THE Component SHALL áp Mascot_Role `cheer`; THE Mascot_Role `cheer` SHALL không xuất hiện ngoài hai context này.
6. WHERE state của surface là `locked`, `empty`, hoặc `error`, THE Component SHALL áp Mascot_Role `guard`; THE Mascot_Role `guard` SHALL không xuất hiện ngoài ba state này.
7. WHILE Exam_Surface đang ở state `in-progress` (xem Requirement 10), THE Component SHALL áp Mascot_Role `silent`, không render mascot animation và không phát sound mascot.
8. THE every Skill_Player_Surface SHALL áp Mascot_Role `coach` cho Skill_Motivation_Layer (xem Requirement 6.3).
9. IF mascot role được áp không khớp với rule trong AC5–AC8, THEN THE Component SHALL fail render trong development mode (throw error rõ ràng) và fallback về Mascot_Role `silent` trong production.

### Requirement 13: Motion và reduced-motion an toàn

**User Story:** As a learner bật reduced-motion (do tiền đình, motion sickness, hoặc OS preference), I want UI vẫn hoạt động đầy đủ và không có animation gây khó chịu.

#### Acceptance Criteria

1. THE every animated component SHALL chỉ animate `transform` và `opacity`; THE every animated component SHALL không animate `top`, `left`, `right`, `bottom`, `width`, `height`, `margin`, `padding`.
2. WHEN media query `prefers-reduced-motion: reduce` được detect chuyển từ false sang true, THE every animated component SHALL strip các CSS class trong tập `{animate-idle, animate-coach, animate-reward, animate-speak}` khỏi DOM nodes trong vòng 100ms và render frame cuối của animation.
3. WHILE Reduced_Motion_Mode đang bật, THE Result_Reward_Loop SHALL skip giai đoạn reveal animation (xem Requirement 7.5).
4. WHEN Skill_Motivation_Layer phát animation lặp đạt 6000ms tổng thời lượng, THE Skill_Motivation_Layer SHALL chuyển mascot về pose idle với transition 500ms.
5. THE every animation SHALL có duration nằm trong khoảng [120ms, 2000ms]; THE Result_Reward_Loop earned giai đoạn SHALL có duration trong [1200ms, 2000ms] (xem Requirement 7.1, 7.2).
6. IF user toggle `prefers-reduced-motion` từ true sang false trong khi một animation đang chạy, THEN THE animation SHALL tiếp tục từ frame hiện tại đến hết duration đã định nghĩa, và các animation kế tiếp SHALL chạy bình thường.
7. IF một animation chạy quá 2000ms (vượt upper bound), THEN THE Component SHALL force-complete animation tại 2000ms và snap về frame cuối.

### Requirement 14: Mobile-first first viewport stability

**User Story:** As a learner trên điện thoại, I want first viewport không bị nhảy layout khi mascot/asset load xong, so that tôi không bấm nhầm.

#### Acceptance Criteria

1. WHEN một Learner_Surface render hoàn chỉnh trên viewport 390×844 (`scrollY=0`), THE Surface SHALL có Primary_CTA với tap target ≥ 44×44 CSS pixels nằm hoàn toàn trong First_Viewport_Mobile.
2. WHILE một asset (mascot 3D, world prop, UI frame) chưa load xong, THE Component SHALL render skeleton/placeholder cùng width × height (sai số ≤ 1px) so với asset cuối, để vùng layout không thay đổi sau khi asset load.
3. WHEN đo Cumulative Layout Shift (CLS) trên first viewport của mỗi P0 surface tại 390×844 với network throttling Slow 4G và đo trong 5 giây sau load complete, THE CLS value SHALL ≤ 0.05 trong 3 lần đo liên tiếp.
4. THE every image asset SHALL được render với attribute `width` và `height` rõ ràng, hoặc nằm trong container có `aspect-ratio` cố định.
5. IF một asset không load được trong vòng 10 giây hoặc trả lỗi, THEN THE Component SHALL giữ skeleton/placeholder có cùng kích thước, không trigger layout shift, và hiển thị một fallback visual neutral.

### Requirement 15: Accessibility AA contrast

**User Story:** As a learner xem trong điều kiện ánh sáng kém hoặc với thị lực giảm, I want nội dung học và CTA luôn đọc được.

#### Acceptance Criteria

1. THE every body text (font-size < 18.66 px regular hoặc < 14 px bold) on a Learner_Surface SHALL đạt contrast ratio ≥ 4.5:1 với background được đo tại vị trí render. Large text (font-size ≥ 18.66 px regular hoặc ≥ 14 px bold) SHALL đạt ≥ 3:1.
2. THE every Primary_CTA SHALL có tap target ≥ 44×44 CSS pixels, contrast ratio ≥ 4.5:1 cho text trên nền button, và contrast ratio ≥ 3:1 cho viền button vs surrounding background.
3. WHEN một surface có world prop làm background, THE Surface SHALL detect các vùng pixel trong text bounding box có contrast < 4.5:1 và áp một lớp scrim/card có background-color opacity ≥ 80% phủ vùng text để đảm bảo contrast theo AC1.
4. THE every interactive element SHALL có visible focus state với outline thickness ≥ 2 CSS pixels, contrast ≥ 3:1 vs adjacent colors, và outline bao quanh toàn bộ interactive area.
5. THE every image asset có ý nghĩa thông tin SHALL có alt text localized vi/de với độ dài 1–250 ký tự; decorative-only assets SHALL có `alt=""`.
6. IF runtime contrast measurement fail (do background image không load hoặc tool không tính được), THEN THE Component SHALL log violation, áp một scrim mặc định trong vòng 100ms và đảm bảo text vẫn đọc được ở contrast ≥ 4.5:1.

### Requirement 16: Color discipline – reward amber chỉ dùng đúng chỗ

**User Story:** As a product designer, I want màu reward amber `#FFB703` chỉ xuất hiện khi learner thực sự được thưởng, so that nó giữ giá trị tín hiệu.

#### Acceptance Criteria

1. WHERE Reward_State của một subtree DOM thuộc tập `{preview, earned, receipt}`, OR WHERE streak_count ≥ 1 trong vòng 24 giờ kể từ lần học gần nhất, THE Component SHALL được phép dùng reward amber color (`#FFB703`).
2. IF một component có Reward_State thuộc tập `{locked, pending}` hoặc không thuộc Reward_State nào, THEN THE Component SHALL không dùng `#FFB703` làm fill/background của Primary_CTA, secondary button, hoặc surface background.
3. WHERE energy orange (`#FF8A3D`) được dùng làm accent, THE Component SHALL giữ tổng diện tích pixel hiển thị màu này ≤ 5% diện tích surface; THE Component SHALL không dùng `#FF8A3D` làm fill của Primary_CTA hoặc secondary action button.
4. WHEN render Primary_CTA trên một learning surface (lesson, exercise, review, practice), THE Component SHALL dùng Bright_Sky blue (`#54A8E4` hoặc `#60A8E4`) làm màu chủ đạo của button.
5. IF state của surface là `locked`, `empty`, hoặc `error`, THEN THE Component SHALL không dùng `#FFB703` cho stroke, fill, icon color, hoặc text color của bất kỳ element nào trong subtree đó; thay vào đó dùng neutral / disabled token của design system.
6. IF một component vi phạm AC1–AC5 (detect bằng style scan trong runtime hoặc design QA), THEN THE Component SHALL fail snapshot test trong CI và rollback về palette mặc định trong production.

### Requirement 17: Localization vi/de cho mọi UI text mới

**User Story:** As a learner Vietnamese hoặc German, I want UI text mới do feature này thêm vào đều có cả 2 ngôn ngữ.

#### Acceptance Criteria

1. THE every UI string mới do feature thêm SHALL có entries trong cả 2 file message của next-intl: `apps/web/messages/vi.json` và `apps/web/messages/de.json`.
2. IF một translation key mới được thêm vào một trong hai file mà không có key tương ứng trong file còn lại, THEN THE Build SHALL fail với danh sách các key thiếu.
3. IF giá trị của một translation key là chuỗi rỗng hoặc chỉ chứa whitespace, THEN THE Build SHALL fail với danh sách các key vi phạm.
4. WHEN component render text learner-facing, THE Component SHALL đi qua next-intl `t()` API; IF một component chứa string literal learner-facing không qua `t()`, THEN THE lint job SHALL fail.
5. THE mascot greeting và coach copy mới SHALL có cả vi và de variant với độ dài ≤ 200 ký tự cho mỗi variant.
6. THE alt text cho meaningful image asset SHALL được localized vi/de với độ dài 1–125 ký tự.
7. THE alt text cho decorative-only image SHALL là `alt=""` và không cần entry trong message file.
8. WHEN locale của learner là `vi`, THE Component SHALL dùng entry trong `vi.json`; WHEN locale là `de`, THE Component SHALL dùng entry trong `de.json`; THE Component SHALL không fallback giữa vi và de cho strings của feature này.

### Requirement 18: Asset rollout không phá performance

**User Story:** As a learner trên 4G, I want trang vẫn nhanh dù có nhiều asset mascot và world prop.

#### Acceptance Criteria

1. WHEN khai báo một Asset_Key, IF cùng asset có cả version `.webp` trong thư mục `optimized/` và version khác (.png, .jpg) ở thư mục khác, THEN THE Asset_Registry SHALL chọn `.webp` từ `optimized/` (xem Requirement 2.4).
2. IF version `.webp` của một asset không tồn tại trong `optimized/`, THEN THE Asset_Registry SHALL fallback về version `.png`/`.jpg` từ `optimized/` cùng tên file (nếu có), và log warning trong development.
3. WHEN đo first-viewport assets của mỗi P0 surface tại viewport 390×844 với network throttling Slow 4G và cache state empty, THE tổng kích thước transferred của (mascot hero + world prop + UI frame) SHALL ≤ 350KB.
4. THE every image asset không phải first-viewport SHALL có attribute `loading="lazy"` hoặc được render qua dynamic import wrapper, và SHALL bắt đầu fetch khi cách viewport ≤ 200 px.
5. THE 3D mascot heavy asset (`FuxieLive3D` GLB hoặc sprite frames) SHALL chỉ render khi component có ≥ 10% diện tích nằm trong viewport (detect bằng IntersectionObserver hoặc dùng wrapper `FuxieLive3DDynamic` đã có).
6. IF một image asset trả HTTP error hoặc fail network, THEN THE Component SHALL hiển thị placeholder neutral cùng kích thước (xem Requirement 14.5), không trigger layout shift, và không retry quá 2 lần liên tiếp.

### Requirement 19: Correctness properties (cho property-based testing)

**User Story:** As a QA engineer, I want các invariant của asset rollout có thể được kiểm bằng property-based test, so that các thay đổi trong tương lai không phá game loop visibility.

#### Acceptance Criteria

1. THE Asset_Registry integrity test SHALL assert: cho mọi `key` trong Asset_Registry, file tại `registry[key]` tồn tại trong `apps/web/public/`. IF test fail, THEN THE test SHALL output danh sách các key có path không resolve được.
2. THE Component reference test SHALL assert: cho mọi Asset_Key được tham chiếu trong source code dưới `apps/web/src/`, key đó tồn tại trong Asset_Registry. IF test fail, THEN THE test SHALL output danh sách các orphan reference (component path + key name).
3. THE first-viewport visibility test SHALL assert: cho mỗi P0 Learner_Surface (được liệt kê trong Requirement 20.1), khi render tại viewport 390×844 với `scrollY=0`, có ít nhất một element với attribute `data-role="primary-cta"` mà bounding box nằm hoàn toàn trong vùng `[x: 0, y: 0, width: 390, height: 844]`.
4. THE reward amber containment test SHALL assert: cho mọi DOM node của một surface, IF computed style của node có color hoặc background-color match `rgb(255, 183, 3)` (sai số ≤ 5% từng kênh RGB), THEN node đó hoặc một ancestor của node SHALL có attribute `data-reward-context="true"` HOẶC attribute `data-reward-state` với value thuộc tập `{preview, earned, receipt}`. IF test fail, THEN THE test SHALL output node selector và computed color.
5. WHEN test mock `window.matchMedia('(prefers-reduced-motion: reduce)').matches = true`, THE animation strip test SHALL assert: cho mỗi P0 surface render với mock đó, không có DOM node nào có classList chứa class trong tập `{animate-idle, animate-coach, animate-reward, animate-speak}`. IF test fail, THEN THE test SHALL output node selector và class list.
6. THE Mascot_Role enum test SHALL assert: cho mọi giá trị Mascot_Role được runtime áp lên một surface, giá trị đó thuộc tập `{coach, companion, cheer, guard, silent}`.
7. THE Reward_State enum test SHALL assert: cho mọi giá trị Reward_State được runtime áp lên một component, giá trị đó thuộc tập `{preview, earned, receipt, locked, pending}`.
8. WHEN render P0 surface ở state `locked`, THE locked-state test SHALL assert: surface có đúng một element với `data-role="primary-cta"`.
9. WHEN render P0 surface ở state `empty`, THE empty-state test SHALL assert: surface có đúng một element với `data-role="primary-cta"`.
10. WHEN render P0 surface ở state `error`, THE error-state test SHALL assert: surface có đúng một element với `data-role="primary-cta"`.

### Requirement 20: Definition of Done cho rollout

**User Story:** As a project manager, I want một định nghĩa rõ "xong" cho feature này, so that team biết khi nào dừng được.

#### Acceptance Criteria

1. THE Feature SHALL được coi là Done khi tất cả các P0 surface sau pass full QA của Requirements 3–11: `dashboard`, `course`, `vocabulary`, `vocabulary/practice`, `vocabulary/microgames`, `reading/[exerciseId]`, `listening/[lessonId]`, `speaking/[lessonId]`, `speaking/[lessonId]/roleplay`, `writing/[exerciseId]`, `review`, `rewards/shop`, `exam/[examId]`.
2. THE Asset_Registry SHALL đạt Asset_Coverage ≥ 95% trên các thư mục optimized (xem Requirement 2.1, 2.5).
3. THE codebase scan SHALL không tìm thấy Placeholder_Reference (hardcoded path bắt đầu bằng `/mascot-3d/` hoặc `/reward-assets/` ngoài Asset_Registry — xem Requirement 1.3).
4. THE Visual QA runbook (`docs/design/learner-ui-visual-qa-runbook.md`) SHALL được chạy qua tất cả P0 surface trong AC1, kết quả SHALL được commit dưới dạng checklist file ở `docs/design/visual-audit/qa-runs/<date>/<surface>.md` với mỗi item check được đánh dấu pass/fail và evidence (screenshot path).
5. THE Properties trong Requirement 19 (AC1–AC10) SHALL có test tự động chạy được trong CI pipeline; THE CI job SHALL fail (non-zero exit code) nếu bất kỳ property nào fail.
6. IF một trong các điều kiện AC1–AC5 không thỏa, THEN THE Feature SHALL không được tag Done; THE project tracker SHALL list rõ điều kiện chưa thỏa và chủ sở hữu fix.
