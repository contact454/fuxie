Vai chinh: CTO / Tech Lead  
Vai phoi hop: Product Manager EdTech, German Academic Lead, Security / Privacy Consultant

# Backlog sau đánh giá — 2026-09-11

Ưu tiên theo rủi ro đã xác minh và phụ thuộc. P1/P2/P3 là mức tác động trong khung; thứ tự thực hiện còn xét khả năng chặn rủi ro trước beta. U là khoảng trống cần thu bằng chứng, không tự đổi thành lỗi P0. Không có production P0 được chứng minh trong audit. S/M/L là effort tương đối, chưa có capacity để cam kết số ngày hoặc ngân sách.

| ID / thứ tự | Mức, việc và nguồn | Owner chịu trách nhiệm / phối hợp | Effort | Phụ thuộc | Điều kiện đóng và retest |
|---|---|---|---|---|---|
|A01|P1: sửa nhóm nội dung học thuật lỗi và quy trình sinh; [academic](content-academic.md)|German Academic Lead / Content QA,Content Engineer|L|Chốt danh mục nguồn đang phục vụ|Đề–bài mẫu–rubric–key evidence nhất quán; ví dụ29writing và nhóm template liên quan được duyệt, lỗi pronunciation sửa cả nguồn; người có chuyên môn ký. Đối soát source→DB→UI; không chỉ đổi metadata aligned.|
|A02|P2, xử lý sớm: auth/ownership AI HTTP,sync-ai,session;SEC01–03|Backend Lead / Security,DevOps,QA|M|Sửa ngay SEC02/03; xác minh ingress song song để xác định exposure SEC01|Anonymous không tới queue/provider; learner không sửa content chung; A không đọc/sửa job/card B; negative tests route và DBfixture; schema/role/owner kiểm trước mutation.|
|A03|P2: server-validated completion/reward và idempotency;TECH01–02|Backend Lead / QA,Gamification|M|Làm song song A02; chốt logical attempt ID, không chờ xác minh AI ingress|Empty/giả mạo/XPâm/quá lớn bị reject; server tính XP; replay cùng ID không cộng lại attempt/progress/Fucoin; một lần làm lại mới vẫn đúng chính sách; transaction/race tests.|
|A04|P2, xử lý sớm: dependency triage và Next patch|CTO / Full-stack,DevOps,QA|M|Inventory version/artifact đang deploy|Xác minh advisory applicability,version đã vá; type/core/build/image/critical E2E đạt; khóa dependency và release artifact; không auto-fix toàn bộ158entries không xét tác động.|
|A05|P2: dashboard next-action,fallback và avatar;PX01–02|Product Manager / Frontend,Designer,QA|M|A03 bảo đảm progress đáng tin|Người mới/quay lại/đã hoàn tất/mấtCanvas đều có hành động học được; dùnglevel/goal/due SRS có lý do; keyboard và avatar đúng; UIclick→event được đối soát. Không cần thay toàn artwork.|
|A06|P2: cache dữ liệu cá nhân và cron fail-closed;SEC04–05|Frontend+Backend Lead / Security,QA|S–M|A02;chính sách offline/account|Production SW cacheA→logout→B→offline không trả dữ liệuA; missingcronsecret từ chối trướcDB; publicasset cache vẫn dùng được.|
|A07|P2: metric version/window/unit/cohort/dedup;PX03–04|Data/Analytics Lead / PM,Backend|M|A03/A05;định nghĩa học có ý nghĩa|Sáu reproduction thành regression theo contract; D7/D30 chỉcohort đủtuổi,weekly đúngwindow,SRS theo session,lọc test accounts; raw syntheticevents→readout có kết quả đối chiếu.|
|A08|P2: sửa contrast/reflow;PX06|Product Designer / Frontend,QA|S–M|Design tokens/active routes|Axe+manual đạt ngưỡng áp dụng ở11fixture affected và route thực;320/390px,zoom200–400%,keyboard/reduced motion; không che nội dung bằng overflowhidden.|
|A09|P2: đồng bộ E2E và gate release;TECH03|QA Automation Lead / DevOps,Full-stack|M|A02–A08 theo test liên quan|Reading/listening kiểm luồngCheck→Continue và persistence; chạy6case đãNOT_RUN; currentCI type/core/property/lint/build/bundle đủ artifact; timeout có điều tra,không chỉ skip; revision rõ.|
|A10|P2: bundle/production perf baseline|Frontend Lead / DevOps,QA|M|A09;production build+cache đúng|Retest17routes vượt115KB hoặc PM/CTO phê duyệt budget có cơ sở;Slow4G3runs/route,CLS/asset budgets; tách p75field/p95API; tối ưu dựa trace,không dựa devHTTP đơn lẻ.|
|A11|U cần evidence trước speech/AI claims: human-calibrated eval|AI Engineer / Academic Lead,QA|M–L|A01;goldreferences và providertestscope|Rubric4chiều gắn đúngprompt; đúng/sai/giáp ranh,alternateanswers,falsecorrection;noisyGerman audio/micdenial/providerfailure; reviewer người duyệt,repeatedruns,model/promptversion,usagecap,costlogs.|
|A12|P2: usage/cost instrumentation;PX05|AI+Analytics Lead / Finance|M|A07;provider response contract|Ghi tokens/latency/task/model/timestamp;unknown không ghi$0; đốisoát usageexport/invoice khi có;cost/activelearner có denominator,success/failure tách.|
|A13|U: retention/deletion/license/privacy/claims evidence|Security+Legal / Academic,Backend,Design|M|Phạm vi tuổi/thị trường,provider và asset registry|Data map có nơi lưu/TTL/owner/quyền xóa;fixture delete quaDB/memory/queue/provider;chứng từ quyềnasset/notice;người có thẩm quyền phê duyệt claim theo evidence.|
|A14|P2: hoàn thiện vận hành có diễn tập|DevOps Lead / CTO,QA|M|A04/A09;artifact release rõ|Build AI Docker xác minh tsx runtime candidate;deployment immutabletag;diễn tập rollback/restore trên môi trường thử,verify dữ liệu;RPO/RTO và incidentowner/alerts được chốt.|
|A15|P2 trước bật offline: giữ pending khi lỗi;TECH04|Frontend Lead / Backend,QA|S–M|A03/A06|401/500/timeout vẫn giữ đúngpending;retrybackoff+completiondedupe;accountchange không sync dữ liệu saiowner;test productionSW thật. Hiện helper chưa có UIcaller.|
|A16|U: pilot và đo hiệu quả người học|Product Manager / Academic,Analytics,Growth|M|A01–A09 đạt lát cắtA1;A11 cho AI đưa vào pilot; phần A13/A14 áp dụng: data handling/retention/owner và rollback/backup tối thiểu được chốt|Cohort nhỏ có tiêu chí tuyển,consent,tasksuccess và blocker;pre/postfeedback revision,delayedrecall;ghi n/missing/cohortage;không gọi pilotnhỏ chứng minhCEFR/PMF.|
|A17|U: quyết định kinh tế/mở rộng|PM+Finance / CTO,Analytics|M|A12/A16,cost/support thực|Chi phíAI+hosting+support/người học,activation/retention đã đốisoát;so sánh giả định với thực tế;quyết định scope/capacity có dữ liệu.|

## Hai tuần đầu: thứ tự đề xuất

Giả định có một đầu mối backend, frontend/QA và một Academic Lead làm song song; nếu thiếu capacity, giảm phạm vi nội dung và hoãn mở rộng, giữ ưu tiên kiểm soát dữ liệu.

1. **Chặng đầu:** xác minh deployment/version/AI ingress; khoanh vùng nhóm bài lỗi đang phục vụ. Backend làm A02–A03, Academic+Content bắt đầu A01; CTO chuẩn bị A04 và đường rollback. Giữ baseline trước sửa và tách commit theo nhóm có thể hoàn nguyên.
2. **Chặng tiếp:** nối A05/A06; QA sửa workflow test đúng active UI, kiểm server persistence; Analytics chốt A07; Designer sửa A08 bằng token và reflow. Nghiệm thu từng phần, không đợi một PR thay đổi toàn dự án.
3. **Cuối chặng:** demo một hành trình A1 mới→onboarding→bài→feedback→retry→progress→next action và người quay lại→SRS. Báo cáo actual pass/fail/gap đúng revision; nội dung/audio chưa ký duyệt không được coi đã đóng A01. Hai tuần là timebox định hướng, không hứa hoàn tất toàn backlog.

## Hướng30/60/90ngày, phụ thuộc điều kiện đạt

| Mốc định hướng | Kết quả cần có | Điều kiện chuyển tiếp |
|---|---|---|
|30ngày|Lát cắtA1 đủ6kỹ năng đáng tin;gatesrelease,ownership/reward,content và next-action đã nghiệm thu;metricversion ổn|Có humanreview/audio đốisoát cho content dùng;criticaltests đạt;không còn gap dữ liệu nghiêm trọng trong lát cắt|
|60ngày|Pilotngười học thật,provider eval/usagecost,restore/rollbackdrill;thu feedback+pairedrevision+delayedrecall|Số mẫu/cohort/missing minh bạch;vấn đề ưu tiên đã xử lý;costdata và eventreadout đốisoát|
|90ngày|Quyết định mở level/module/cohort dựa trên learning/retention/cost;chuẩn hóa vòng duyệt nội dung và vận hành|PM/Academic/Finance chốt tiêu chí;không mở rộng chỉ vì số bài hoặcXP tăng|

## Nên hoãn trong lúc đóng khoảng trống

- Sinh hàng loạt thêm bài A1–C2 bằng template hiện tại; thay vào đó sửa bộ sinh và nghiệm thu nhóm bị ảnh hưởng.
- Thêm gamification/shop/artwork diện rộng hoặc rewrite kiến trúc khi chưa có bằng chứng cần thiết.
- Paid acquisition diện rộng, claim “đạt CEFR/chuẩn thi” hoặc cam kết chất lượng AI vượt mức đã được duyệt.
- Dashboard số đẹp dựa trên readout hiện tại trước khi đơn vị/window/cohort được sửa.

Đóng một việc bằng source+test+runtime artifact đúng revision và xác nhận owner; một file tài liệu hoặc fixturePASS không đủ khi acceptance yêu cầu người học/provider/production. Content cần giữ bản trước/sau; DB migration phải có backup và rollback đã thử; không sửa dữ liệu production từ script audit.

**Bước tiếp theo cụ thể:** CTO/PM nhận owner cho A01–A05 và tạo phạm vi remediation đầu tiên gồm session integrity/ownership cùng nhóm content đang dùng; QA giữ các reproduction làm regression, Academic Lead chốt tậpA1 nghiệm thu. Chưa giao task cho Antigravity/Anti trong bàn giao này.
