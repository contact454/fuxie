Vai chinh: Product Manager EdTech  
Vai phoi hop: Product Designer, Data / Analytics Engineer, Gamification Designer

# Fuxie — đánh giá sản phẩm, UX và analytics

Ngày đánh giá: 2026-09-11. Phạm vi: D01, D03, D10 của `comprehensive-assessment-framework-2026-09-11.md`. Mục tiêu là đánh giá hiện trạng và ưu tiên tiếp theo; không phải phê duyệt ra mắt.

## Baseline và phương pháp

- HEAD `3217ea052aec5606602cb7f9ec62f159ae9a750e`; đọc working tree hiện tại, gồm thay đổi chưa commit. Baseline toàn repo do root giữ tại `tmp/comprehensive-assessment-2026-09-11/baseline.json`. Hash phần source trực tiếp: `tmp/comprehensive-assessment-2026-09-11/product/source-hashes.json`.
- Đã đọc router, startup checklist, primary Product Manager EdTech và ba support profiles trước khi phân tích; rerun gate khi chuyển từ lập khung sang audit.
- Đối chiếu đặc tả với **route đang được import/render** và API/readout hiện hành. Không đưa điểm hoặc test PASS của các báo cáo tháng 5–7 sang lần này.
- Tái lập analytics bằng current TypeScript source, transpile với TypeScript đã có trong workspace và thay Prisma bằng guard. In-memory event store thực thi bộ lọc `where` của module; mọi event là synthetic; không đọc `.env`, không gọi DB/provider/network. Lệnh: `node tmp/comprehensive-assessment-2026-09-11/product/reproduce-analytics.cjs`. Kết quả: 6 assertion xác nhận actual, `analytics-reproduction.json` và `.log`; SHA256 của hai readout nằm trong JSON.
- Không sửa source/content, không commit/deploy, không gọi provider trả phí, không ghi production DB. Chỉ tạo báo cáo và artifact riêng.
- Browser: Playwright/Chromium có sẵn, axe-core 4.11.1; dùng quy trình skill `vercel:agent-browser` (CLI agent-browser không có trên PATH, dùng Playwright thay thế). Root dựng Next dev 3040 + PostgreSQL 55432 / Redis 56380 riêng với schema và dev seed. `node tmp/comprehensive-assessment-2026-09-11/product/browser-audit.cjs http://127.0.0.1:3040` kiểm tra 13 fixture states, mobile390×844, desktop1440×900 và narrow 320×568; 13/13 HTTP200, không pageerror. Script chặn mọi request ngoài GET/HEAD. Kết quả `browser-results.json`, `browser-audit.log`, 13 PNG; có kiểm tra focus, overflow, reduced motion và fault injection Canvas.
- `node tmp/comprehensive-assessment-2026-09-11/product/dashboard-interaction.cjs` xác nhận actual dashboard của **dev learner trên auditDB**, không fixture, tại localhost:3040: keyboard Enter Marktplatz→course thành công2/2 viewport; avatar không phản hồi2/2; không ghi nhận analytics POST. Artifact `dashboard-interaction.json`, `.log`, `dashboard-real-390.png`, `dashboard-real-1440.png`. Đây không phải chứng minh Firebase production auth hoặc session/persistence toàn hành trình.
- Lần thử dùng 127.0.0.1 cho dev-auth bị redirect sang localhost, cookie không cùng host nên rơi về login. Đã phân biệt là lỗi cấu hình/harness local và rerun localhost thành công; diagnostic được giữ riêng `dashboard-interaction-host-mismatch.json`. Không chấm lỗi dashboard từ timeout đó. Không đo perf khi root đang smoke/E2E; elapsed debug không được diễn giải là hiệu năng.

## Kết luận làm việc

Fuxie có định vị rõ cho người Việt tự học tiếng Đức và có nhiều cấu phần phù hợp: onboarding lấy mục tiêu/cấp độ/thời gian, course dùng cấp độ hồ sơ, completion đi qua lớp ghi nhận hoạt động, shell lỗi và receipt dùng chung. Tuy nhiên dashboard đang chạy không nối với logic next-action đã đặc tả, trong khi metric readout không thống nhất với định nghĩa sản phẩm. Các tỷ lệ activation/weekly progress/retention chưa đủ đáng tin để điều khiển quyết định tăng trưởng. Hiệu quả học và kinh tế trên người dùng thật chưa có bằng chứng trong phạm vi được cung cấp.

## Ma trận 12 tiêu chí

Điểm 0–4 theo khung; U không phải 0. Điểm dưới đây là mức đáp ứng đã kiểm chứng, không phải chứng nhận toàn bộ module. Confidence: cao = trực tiếp/tái lập; vừa = source hoặc mẫu hẹp; thấp = chủ yếu tài liệu.

| ID | Điểm | Bằng chứng hiện hành | Confidence và giới hạn |
|---|---:|---|---|
| D01.1 Người dùng/vấn đề/kết quả/phạm vi | 2 | `docs/intake/product-north-star-roadmap.md` xác định B2C Việt Nam, Learn/Coach/Motivate, teacher/admin hỗ trợ; activation PRD và AI coach brief có must-have/non-goals. Scope được mô tả theo module chủ yếu. | Vừa. Có đặc tả; chưa có nghiên cứu người dùng thật xác nhận mức quan trọng của từng nhu cầu, chưa chứng minh từng module khớp runtime. |
| D01.2 Onboarding → hành động đầu tiên | 2 | `OnboardingWizard.tsx:35–198` lấy exam/level/time, placement, save/retry và `/dashboard`; onboarding API `route.ts:8–64` lưu hồ sơ/path và event; `events.ts:91–176` dẫn xuất activation trong 24h; PRD `:102–107,138–142` định nghĩa hoàn thành. | Vừa. Điều kiện có thể kiểm chứng; funnel đầu vào thiếu và dashboard handoff mất ngữ cảnh. Chưa xác nhận signup/auth/persistence bằng người học thật. |
| D01.3 Dashboard đề xuất bước học phù hợp | 1 | Active page `apps/web/src/app/(learn)/dashboard/page.tsx:5–26,91–110` render `WorldMapDashboardClient`; component `:7–26,45–140` chỉ dùng totalLessonsCompleted cho một node, năm node locked. Actual audit learner trên cả 2 viewport có 1 mastered + 5 locked / 0 primary; keyboard Enter vẫn vào course. `/course` tự đọc currentLevel (`course/page.tsx:553–560`). | Cao cho source và runtime. Có lối vào course, nhưng dashboard không dùng goal/exam/due SRS/time để chọn/giải thích next-action; không đồng nghĩa course luôn sai cấp độ. |
| D01.4 Roadmap, dependency và acceptance | 2 | North Star và `phase-5-implementation-ready-backlog.md:21–116` có owner, dependency, acceptance/DoR. PRD `:102–107` là đối chiếu được. | Vừa. Planned/implemented/runtime-verified/outcome-validated chưa được đồng bộ thành một bảng hiện hành; dashboard mới không thỏa các acceptance này. Không nhập trạng thái cũ thành sự thật runtime. |
| D03.1 Hoàn thành nhiệm vụ mobile/desktop | 2 |13 fixture states render200 không pageerror; actual dev learner navigation bằng bàn phím dashboard→course thành công2/2 desktop/mobile. Avatar button không làm gì2/2; onboarding result mobile scrollWidth 401>390. Artifact `browser-results.json` và `dashboard-interaction.json`. | Vừa, phạm vi hẹp.2/2là navigation task synthetic, không phải tỷ lệ completion bài học của người dùng. End-to-end học/persistence do root D04 tổng hợp; time/task usability thật=U. |
| D03.2 Loading/empty/error/retry/locked/success | 1 | Shared `state-shell.tsx:1–39` có lỗi/retry/đường quay lại; dashboard error boundary `error.tsx:30–56` dùng StateShell.13 fixture states có loading/error/empty. Fault injection Canvas null sau 4s:0 node / 0 lesson link / 0 primary, khớp `LearningWorldCanvas.tsx:312–331,876–925`. | Cao cho fallback lỗi. Có nền dùng chung, nhưng state quan trọng ở entry point bị hỏng. Review empty fixture còn số 0 ở hero và 5 ở body, nên screenshot fixture chưa chứng minh state consistency runtime. |
| D03.3 Accessibility | 1 | Actual Marktplatz keyboard Enter hoạt động2/2; narrow 320 không overflow và mastered animation=`none` khi reduced motion. Nhưng axe serious color-contrast ở11/13 case,59 node-instances (không phải59 lỗi độc lập): bottomnav 2.55:1, onboarding CTA 2.59:1; onboarding result overflow 401/390. | Cao cho lỗi được đo, vừa cho phạm vi tổng. Không có screen-reader/multibrowser/zoom 200–400% full audit; không tuyên bố WCAG compliance. Bộ JSDOM hiện còn test DashboardBackboneHero thay vì active map. |
| D03.4 Design system/mascot/reward và học tập | 2 | `result-reward-loop.tsx:1–131`, FSM `result-reward-loop-fsm.ts:1–118`, StateShell và WorldNode thể hiện token, receipt, retry, reduced-motion. `motivation-loop-readout.ts:46–89` tách reward-only khỏi meaningful actions. | Vừa. Cơ chế đã có; chưa chứng minh tăng retention/giảm áp lực. Reward-only đang đo mức user trong cả range, không phải cùng/phiên kế tiếp như spec. |
| D10.1 Định nghĩa metric nhất quán | 1 | Spec có tử/mẫu/window, nhưng `learning-progress-readout.ts:10–93,142–174` và `activation-readout.ts:15–89` lệch; 6 ca tái lập ở `analytics-reproduction.json`. API cho range bất kỳ nhưng gọi là weekly. | Cao. Metric chưa đủ dùng làm căn cứ tăng trưởng; không phải chỉ thiếu biểu đồ. |
| D10.2 UI → event → readout và dedup/test filtering | 1 | Completion server-side qua `learning-activity.ts:164–178`, API chỉ nhận allowlist client event (`analytics/events/route.ts:12–34`); readout có role=LEARNER. Nhưng active dashboard không emit next-action; actionId SRS/card, session/level khiến dedup sai. Không thấy account test/cohort exclusion trong các readout đã đọc. | Cao cho mismatch source/harness. Không có đối soát production; chưa biết mức ô nhiễm dữ liệu thực. |
| D10.3 Activation/retention và kết quả học | U | Có completion log, SRS log và WritingAttempt; AI readout chỉ aggregate score/correction counts (`ai-eval-readout.ts:33–62`). Beta artifact hiện cung cấp N/A và waiting status. | Thiếu cohort thực đủ tuổi, paired retry/delayed recall/transfer analysis, rubric đối chiếu của người duyệt. Proxy completion không chứng minh tăng CEFR. |
| D10.4 Kinh tế vận hành | 1 | `/admin/ai-costs` có estimate; schema giữ token fields; nhưng successful chat không ghi token/latency (`chat/route.ts:250–287`). Cost chart gộp lifetime conversation tokens vào updatedAt (`ai-costs/page.tsx:26–68`). Budget phase47 chỉ là assumptions. | Cao cho đường ghi/đọc source; chi phí thực, doanh thu/conversion, support load, infrastructure/active learner = U. Không suy ra chi phí thực bằng 0. |

## Findings đã xác nhận và thứ tự ưu tiên

### PX-01 — Dashboard không có next-action theo mục tiêu; mastery làm mất CTA chính

- **Tiêu chí:** D01.3, D03.2, D10.2. **Mức đề xuất:** P2; high impact entry point, effort M. **Trạng thái:** source + runtime đã xác nhận.
- **Expected:** activation PRD LA-001/002 và dashboard UX phải có một hành động ưu tiên theo level, goal, SRS, kèm lý do.
- **Actual:** active page chỉ truyền username, streak, wallet, XP và tổng số lesson. Marktplatz luôn vào `/course`; năm node khác hard-code locked. Chỉ cần hoàn tất bất kỳ lesson nào, Marktplatz thành mastered và `isPrimaryCta=false`; không có next node mở. Không có event `dashboard_next_action_clicked` trong active map/WorldNode navigation. Learner vẫn có `/course` và `/review` làm cách đi vòng.
- **Bằng chứng:** `dashboard/page.tsx:10–26,96–110`; `WorldMapDashboardClient.tsx:26,53–61,74,89,104,119,134`; `LearningWorldCanvas.tsx:892–901`; `rg -n 'dashboard_next_action_clicked' apps/web/src -g '*.tsx'` trả không có nơi emit trực tiếp trong TSX.
- **Runtime:** default fixture 6 nodes / 1 primary; mastered fixture 6 nodes / 0 primary; actual seeded learner cũng 1 mastered + 5 locked / 0 primary. Enter vẫn vào `/course` trên 2 viewport, không phát POST analytics. Avatar trông là nút hồ sơ nhưng click không làm gì2/2: `WorldMapDashboardClient.tsx:157–164` không truyền `onAvatarClick`, trong `packages/ui/src/components/TopBar.tsx:35–40` nút chỉ gọi prop đó. Có đường vòng BottomNav/Hồ sơ nên không coi toàn flow profile bị chặn.
- **Owner:** Product Manager + Frontend + Analytics. **Acceptance:** test ma trận fresh, due-SRS, no-due, goal/exam, completed-today; mỗi state còn 1 next-action có nhãn/lý do đúng và click dẫn vào hành động thật; event ghi đúng user/source/action/level; node unlock phản ánh tiến độ cụ thể. Giữ map artwork nếu đạt yêu cầu, không cần redesign diện rộng.

### PX-02 — Transparent map mất đường vào bài khi Canvas 2D không khả dụng

- **Tiêu chí:** D03.2/D03.3. **Mức đề xuất:** P2 (nhánh fallback với đường vòng review); effort S. **Trạng thái:** source + runtime fault injection đã xác nhận.
- `getContext('2d')` null đặt canvasUnavailable rồi return (`LearningWorldCanvas.tsx:312–331`); ready khởi tạo false (`:197–204`). Nodes chỉ render nếu `isTrans && ready` (`:876–905`), còn semantic HotspotList chỉ render `!isTrans` (`:916–925`). Active dashboard isTransparent=true (`WorldMapDashboardClient.tsx:42`). Do đó nhánh fallback được document trong comment không tồn tại trên active dashboard.
- **Runtime:** `dashboard-nocanvas-mobile.png` và `browser-results.json` không có node/primary. Lặp fault injection sau load+4000ms vẫn `ready=false,nodeCount=0,lessonLinks=[],primaryCount=0` trong `canvas-fallback-confirmation.json`. Axe không báo violation ở case này không có nghĩa workflow dùng được: các controls cần thiết đã biến mất.
- **Owner:** Frontend + Product Designer/QA. **Acceptance:** với canvas null/throw hoặc engine init fail, bài học mở vẫn có link/button HTML dùng bàn phím được; thông báo lỗi asset không chặn navigation; kiểm tra cả transparent/nontransparent và trước hydration.

### PX-03 — Metric window/denominator không trùng hợp đồng sản phẩm

- **Tiêu chí:** D10.1. **Mức đề xuất:** P2, ưu tiên sớm trước khi dùng dashboard để quyết định sản phẩm; effort M. **Trạng thái:** đã tái lập bằng current module, synthetic data.
- `learning-progress-readout.ts:15–36,71–93` đếm cả range do caller cung cấp; API `admin/analytics/learning-progress/route.ts:6–42` không giới hạn 7 ngày. Ca PX-A01: 3 bài vào 01/08, 12/08, 25/08 vẫn `weeklyProgress.rate=100`, dù không có rolling 7 ngày nào có 3 bài.
- `learning-progress-readout.ts:142–174` đo chính xác cửa sổ elapsed 24h ở ngày 1/7/30; spec phase32 `Primary Retention Metrics` là ngày1 theo calendar và ngày1–7/1–30. Ca PX-A02 quay lại ngày2 nhưng D7=0. Đây có thể là metric hợp lệ nếu được đổi tên/duyệt; hiện contract không thống nhất.
- Không loại cohort chưa đủ tuổi hay có pending denominator: ca PX-A03 trả D30=0 với activation ở tương lai. Khi cohort vừa kích hoạt cũng bị coi là 0, khiến thiếu thời gian quan sát trông giống churn.
- Activation PRD `:138–142` mẫu số là learner **reach onboarding**; readout chỉ dùng `onboarding_completed` (`activation-readout.ts:15–31,75–89`). Nếu 10 learner đến onboarding, 1 hoàn thành rồi học, conditional readout=100% trong khi end-to-end activation=10%. Event list chưa có onboarding_started/meaningful_action_started (`events.ts:3–30`).
- **Owner:** Data / Analytics Engineer + PM. **Acceptance:** metric version có unit, eligibility, timeframe/timezone, exact-day vs window, mature/pending; fixture với cutoff/midnight/7–30day đủ tuổi; so sánh số xuất SQL và API; không biến thiếu dữ liệu thành 0.

### PX-04 — Đơn vị actionId làm lệch việc ghi nhận học lặp lại

- **Tiêu chí:** D10.1/D10.2. **Mức đề xuất:** P2, effort M. **Trạng thái:** source + current-module reproduction.
- SRS mỗi POST của một card đã emit meaningful_action_completed với actionId=cardId và không có level (`srs/review/route.ts:114–127`); spec phase30 định nghĩa session/card batch hoặc minimum. Ca PX-A04: 3 card trong 20 giây đạt weekly 3+, tất cả CEFR unknown vẫn được tính.
- Dedup key `userId:actionId:actionType` trong cả range (`learning-progress-readout.ts:185–202`) làm cùng card được học ở 3 ngày khác nhau chỉ còn1 (PX-A05). Không phân biệt retry cùng submission với lần học mới.
- Session API dùng actionId=`session:${level}` (`session/complete/route.ts:65–81`), nên mọi session cùng cấp trong range bị gộp1. Reading/listening dùng exerciseId/lessonId làm actionId; vocabulary có attempt.id (`vocabulary/practice/submit/route.ts:128`), thể hiện đơn vị chưa thống nhất.
- **Owner:** Analytics + Backend, PM quyết định đơn vị meaningful action. **Acceptance:** session/attempt ID ổn định; retry cùng lần không nhân bản, học lại ngày khác không bị mất; SRS session/batch rule minh bạch; event bắt buộc level/skill hoặc báo DQ; cohort test loại trừ bằng trường rõ, không dựa vào tên người học.

### PX-05 — Chi phí AI có màn hình nhưng thiếu nguồn usage thực

- **Tiêu chí:** D10.4. **Mức đề xuất:** P2, effort M. **Trạng thái:** source xác nhận; không gọi provider để tạo chi phí.
- `AiConversation.totalTokensUsed` default0; `AiMessage.tokensUsed`/latencyMs nullable (`schema.prisma:769–802`). Successful chat chỉ lưu text/model/corrections và increment totalMessages (`chat/route.ts:250–269`), không đọc usageMetadata hoặc ghi token fields.
- `rg -n 'totalTokensUsed|tokensUsed:|usageMetadata|totalTokenCount|promptTokenCount|candidatesTokenCount' apps/web/src apps/ai-service/src -g '*.ts' -g '*.tsx' -g '!*.test.*'` chỉ thấy các điểm đọc trong ai-costs và ops-summary, không thấy writer của các token fields. Không khẳng định DB chưa từng được nhập từ nguồn bên ngoài.
- `/admin/ai-costs/page.tsx:52–68` phân toàn bộ lifetime conversation tokens vào ngày updatedAt, làm ngày sử dụng cũ chuyển sang ngày mới nếu conversation tiếp tục; giá cố định một rate chung. Đây không phải per-request usage ledger, không có active-learner denominator, không bao phủ writing/speaking/eval/infra.
- **Owner:** AI Engineer + Analytics + Finance/DevOps. **Acceptance:** per-call metadata flow/model/input-output token/provider pricing version/timestamp/status; reconcile với provider usage hoặc invoice; tổng ngày theo request timestamp; cost/eligible active learner và giới hạn budget; missing usage hiển thị unknown.

### PX-06 — Tương phản action/navigation thấp và kết quả onboarding tràn ngang

- **Tiêu chí:** D03.1/D03.3. **Mức đề xuất:** P2, effort S–M. **Trạng thái:** runtime có DOM, computed contrast và screenshots; đã xem ảnh trực tiếp.
- Axe 4.11.1 trên13 route/state/viewport reports serious `color-contrast` ở 11 case,59 node instances bao gồm case lặp. Ví dụ BottomNav Ôn tập/Hồ sơ #60a8e4 trên trắng=2.55:1; goal onboarding CTA trắng trên #54a8e4=2.59:1. Spec AA cho chữ thường yêu cầu 4.5:1 theo rule axe được thực thi. Không dùng 59 instances như số defects duy nhất.
- Nguồn lặp: `apps/web/src/app/globals.css:45–52` đặt --fuxie-action=#54a8e4; `components/ui/primary-cta.tsx:82–92` đặt chữ trắng. `packages/ui/src/components/BottomNav.tsx` dùng blue 400 cho tab không active. Onboarding result có nhiều label gray 400 ở 9–12px (`OnboardingWizard.tsx:583,595,615`).
- `onboarding-result-mobile` viewport 390 có html/body scrollWidth 401; ảnh thấy phần badge cấp độ tràn 2 mép. Desktop 1440 không tràn. Pair badges dùng một hàng flex, gaps/padding và số cấp độ shrink-0 (`OnboardingWizard.tsx:577–602`). Đây là finding responsive cụ thể, không suy rộng mọi màn hình.
- **Owner:** Product Designer/Design System + Frontend + QA. **Acceptance:** giữ brand palette cho nền/decoration nhưng text/action contrast đạt ngưỡng áp dụng; retest active route với axe+review thủ công; các label/CTA không bị cắt tại 320/390px và zoom 200–400%; không chữa bằng overflow:hidden che chữ. Bổ sung assertion trên active map/onboarding, không chỉ primitive cũ.

## Điểm mạnh nên giữ

- Đặc tả Learn/Coach/Motivate có trọng tâm B2C Việt Nam, không đặt mở rộng B2B/paywall lên trước activation; AI brief tách coach với lời hứa chấm thi chính thức.
- Onboarding hiện đã có dailyStudyMinutes 5/10/20/30, current/target CEFR và save error với retry; course đọc currentLevel của profile khi không yêu cầu level cụ thể (`course/page.tsx:553–560`). Đây là nền để nối lại map vào hành trình phù hợp.
- Completion server-side và client event allowlist tạo điểm kiểm soát analytics rõ; metadata sanitizer chặn key nhạy cảm và string quá dài (`events.ts:64–86,195–221`). Đây là guard cơ bản, không phải chứng minh loại hết PII.
- Shared StateShell, PrimaryCta, result receipt/FSM có cấu trúc tái sử dụng, retry và reduced motion. Các thành phần này đáng được kiểm tra tại active route rồi giữ lại.
- Readout tách role LEARNER, phân action/skill/level, dedup và reward-only đã có nền logic. Cần sửa hợp đồng/đơn vị/cửa sổ, không cần dựng hệ analytics mới chỉ để khởi đầu.

## Khả dụng bằng chứng người dùng và kinh doanh

- Current `docs/beta/controlled-beta/analytics-snapshot.md` có `waiting_for_real_learner_activity`, mọi metric N/A. `learner-feedback.md` chỉ có record shortfall. `cohort-roster.csv` có1 record trạng thái `community_outreach_selected_waiting_for_real_aliases`; outreach tracker có response_count=0, real_aliases_created=0. Chỉ aggregate này được đọc ra; không sao chép PII.
- Đây là **bằng chứng trạng thái tài liệu đang có**, không khẳng định ngoài repo không có khách hàng. Không có export/cohort production được xác minh cho audit, nên activation/retention thực và product-market fit = U.
- `phase-47-operating-budget-staffing-plan.md` tự ghi là rough operating plan, còn cần provider pricing, usage/cohort, hosting, rates và runway. Không có hóa đơn/chi phí thực/active-learner denominator hoặc báo cáo doanh thu được cung cấp.
- AI readout aggregate điểm bài làm và số correction không phải đo improvement. WritingAttempt/SRS logs có thể hỗ trợ nghiên cứu tiếp, nhưng chưa có cặp attempt trước/sau, bài chuyển giao, retention trí nhớ trễ và phương pháp tránh selection bias được kiểm chứng.
- User research tiếp theo cần nêu rõ mẫu, cấp độ, goal và thiết bị; không dùng thời gian page load hoặc screenshot làm completion time người học. Ngưỡng beta25%/3 actions trong phase30 là giả định nội bộ cần hiệu chỉnh, không phải chuẩn ngành.

## Workflow coverage và phần còn thiếu

| Hành trình | Đã đọc/kiểm tra | Chưa chứng minh |
|---|---|---|
| Onboarding → dashboard → bài đầu | Source wizard/API/activation derivation; goal/result fixtures desktop/mobile | Signup/Firebase auth thật, profile persistence, funnel trên người mới |
| Dashboard mới → course/review | Import chain, map props/unlock; course level resolution; actual seeded learner Enter → course 2/2; avatar dead 2/2 | Next-action theo due SRS/goal và unlock theo node; không xác nhận lesson completion từ navigation |
| SRS/vocabulary/reading/listening/grammar/session completion | Emit path + đơn vị actionId; synthetic readout reproduction | UI → DB toàn hành trình mỗi kỹ năng; session retry/concurrency thuộc D04/D06 |
| Writing/speaking feedback → retry | UI/schema và AI readout source | Provider truth, paired improvement, delayed recall/transfer |
| Reward/mission/streak | Shared receipt/state và motivation readout source | Economy/retention thật; ledger invariants thuộc D06 |
| Teacher/admin | Phạm vi specs, analytics/cost source | Tác vụ lớp/bài giao/ops end-to-end: root D04 và dữ liệu local cần bổ sung |
| Accessibility/state variants |13 fixtures, axe, Tab sampling, Canvas null 4s, narrow 320/reduced-motion; review-empty contradiction 0/5 do fixture `review/page.tsx:131–165` | Screen reader thật, nhiều browser/thiết bị, zoom full matrix, usability với người khuyết tật. Error/skill fixtures có chrome và copy dành choQA, không phải full real submit-state coverage |

## Backlog đề xuất

| Thứ tự | Việc | Owner | Effort | Phụ thuộc / điều kiện hoàn thành |
|---:|---|---|---|---|
| 1 | Khôi phục next-action contract trên active map + canvas fallback (PX01/02) | PM + Frontend + QA | M | Dùng currentProfile/dueReview/cụ thể node; 6 state fixtures, keyboard và fallback; không cần thay toàn bộ artwork |
| 2 | Chốt metric version và sửa readout/units/test exclusion (PX03/04) | Analytics + Backend + PM | M | Repro6 ca trở thành regression đúng contract; add cutoff/timezone/eligible maturity; UI click → event → readout đối soát được |
| 3 | Đo usage/cost có timestamp và flow (PX05) | AI + Analytics + Finance | M | Provider response hợp đồng, invoice/usage export khi có; failed/missing usage không phải $0; cost/active learner |
| 3a | Sửa contrast ởtoken/action và reflow onboarding (PX06) | Product Designer + Frontend + QA | S–M | Retest đúng active routes, giữ nội dung đọc được, 320/390px + zoom; keyboard task không regress |
| 4 | Thiết lập baseline người học thực nhỏ có consent | PM + Growth + Academic Lead | M | Luồng học và metric đã tin cậy; báo cáo n/cohort đủ tuổi, task success, blocker, feedback và paired retry; owner review hằng tuần |
| 5 | Thẩm định recall/transfer và khả thi kinh tế | Academic Lead + Analytics + Finance | L | Mẫu đủ, rubric/chỉ tiêu trước phân tích, dữ liệu theo thời gian; không tuyên bố CEFR improvement từ action count |

Effort S/M/L là ước lượng tương đối cho một nhóm đã hiểu codebase, không phải cam kết ngày giao hàng. Chưa nên mở rộng paid acquisition, shop mechanics hoặc thêm diện rộng tính năng chỉ để cải thiện proxy trước khi có baseline đáng tin.

Checklist Product Manager đã áp dụng: xác định target user/problem; tách must-have và mở rộng; tiêu chí đo được; nêu learner/teacher/admin impact, edge cases và non-goals. **Kết quả12 tiêu chí: 11 có điểm, 1 U (D10.3); điểm theo trục D01=[2,2,1,2], D03=[2,1,1,2], D10=[1,1,U,1].** Không gộp điểm tổng. Bước tiếp theo cụ thể: root đối chiếu findings với D04/D06/học thuật/bảo mật, chốt owner cho PX01–PX06 và quy trình đo baseline người học thực sau khi luồng/metric đáng tin.
