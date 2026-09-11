Vai chinh: CTO / Tech Lead  
Vai phoi hop: Product Manager EdTech, German Academic Lead, Security / Privacy Consultant

# Đánh giá toàn diện Fuxie — 11/09/2026

**Kết luận:** Fuxie đã có nền kỹ thuật và phạm vi sản phẩm đáng kể, đủ để tiếp tục hoàn thiện trên kiến trúc hiện tại. Điểm yếu lớn nhất là khoảng cách giữa “đã xây dựng” và “đã kiểm chứng”: nội dung bài mở và feedback còn lỗi có quy luật, một số API chưa bảo vệ đúng tiến độ/quyền dữ liệu, dashboard chưa dẫn bước học tiếp theo, và analytics chưa đủ tin cậy để quyết định tăng trưởng. Ưu tiên giai đoạn tới là làm cho một hành trình học hẹp hoạt động đúng và đo được, trước khi mở rộng nội dung/tính năng hay thu hút người dùng diện rộng.

Đây là đánh giá hiện trạng và đề xuất ưu tiên, không phải phê duyệt phát hành hoặc kết luận sản phẩm thất bại. Chưa xác nhận sự cố P0 trên production. Không chấm một điểm tổng để lấy phần kỹ thuật tốt bù cho lỗi học thuật hoặc dữ liệu.

## Cơ sở kết luận

- Đánh giá working tree tại HEAD `3217ea052aec5606602cb7f9ec62f159ae9a750e`, nhánh `chore/content-audit-remediation-2026-06`, gồm thay đổi chưa commit. Chốt hash 5.814 file đầu đợt; không lấy bản HEAD sạch thay hiện trạng người dùng đang làm.
- Root dùng Node22 như CI, tạo PostgreSQL/Redis audit riêng, chạy typecheck, core/property tests, production build, lint, asset/locale/state checks, smoke, API probe và HTTP perf. Provider và dữ liệu production không được dùng.
- Nội dung: kiểm kê1.187 file sáu kỹ năng, 11.664 đơn vị; chọn ngẫu nhiên có seed180 đơn vị, đủ36ô A1–C2 ×6kỹ năng, mỗi ô5mẫu; duyệt text toàn bộ, thêm2mẫu rủi ro. Hai tác tử đọc chéo36/180mẫu; root phản biện thêm6trường hợp rủi ro. Không nghe audio, không có human signoff. Không suy rộng tỷ lệ lỗi mẫu thành tỷ lệ toàn kho.
- UX:13fixture states chạy trên browser, thêm actual dashboard audit learner ở mobile/desktop, kiểm bàn phím, contrast, reflow và Canvas fallback. Phân biệt fixture/mock với API thật trên DB audit.
- Security: một Standard scan, coverage partial,5finding (4medium/1low),7ca xác minh tổng hợp; thêm actual DB probe về XP do root thực hiện. Audit dependency158advisory entries không đồng nghĩa158lỗ hổng ứng dụng đã khai thác được.
- Tiêu chí, công cụ và cách chấm được xác lập [trước khi đánh giá](../comprehensive-assessment-framework-2026-09-11.md). [Ma trận40tiêu chí](criteria.md) có36điểm và4U; **không phải36tiêu chí PASS hoặc90% sản phẩm hoàn thiện**.

## Những điểm nên giữ

1. **Định vị và cấu trúc sản phẩm:** người Việt tự học tiếng Đức, Learn/Coach/Motivate; onboarding thu thập mục tiêu, cấp độ và thời gian, course đọc cấp độ hồ sơ. Có nền để cá nhân hóa mà không phải thiết kế lại toàn bộ.
2. **Nền engineering:** typecheck và production build đạt;970kiểm thử lõi đạt. Monorepo chia web, AI, database, shared và SRS; transaction, role guard, result receipt và event allowlist đã có pattern dùng lại.
3. **Tài sản và quy trình:** locale parity1.070keys mỗi ngôn ngữ, asset registry và state shells có kiểm tra; role gate, PRD, runbook và acceptance giúp truy vết quyết định. Các nền này hữu ích nhưng cần gắn vào active route và nội dung đúng nghĩa.
4. **Một số luồng đã chạy được:** hardening smoke5ca đạt; reading/listening seed submit chấm100%, lưu attempt, reload200, sai thời gian400 và anonymous401. Điều này chứng minh pipeline mẫu hoạt động, chưa chứng minh mọi dạng bài hoặc provider.

## Các vấn đề chi phối ưu tiên

| Nhóm | Bằng chứng đã xác nhận | Hệ quả và ưu tiên |
|---|---|---|
| Học thuật/nội dung |29/30bài viết mẫu trong mẫu duyệt có lỗi đáp ứng đề/template. Có feedback trích chính nhận định sai làm evidence, distractor cùng đúng, ghi chú phát âm trái IPA. Scan nguồn ghi115/268bài nghe có tổng điểm không khớp tổng points;79bài nghe pending audio. | **P1 đối với nhóm nội dung lỗi đã xác nhận:** sửa nguyên nhân sinh nội dung và quy trình duyệt; nghiệm thu lại trước dùng các bài này làm tài liệu mẫu/chấm chuẩn. Cần đối soát bản đang phục vụ từ DB. |
| Quyền truy cập và integrity |AI HTTP thiếu identity/owner ở một số đường; sync-ai thiếu admin guard; session dùng cardId không ràng buộc owner. Actual audit DB nhận empty session+12.345XP và+1lesson. | **P2 nhưng làm trong nhóm đầu:** đóng kiểm soát trước mở rộng beta. Mức phơi nhiễm production chưa xác nhận; không tuyên bố đã lộ dữ liệu thật. |
| Retry/phần thưởng/cache |Hai POST giống nhau tạo2attempt và cộng thưởng2lần; cache PWA GET tài khoản/chat dùng chung. Pending offline bị xóa khi401/500 trong harness, nhưng helper chưa có UI caller. | Cần completion ID/idempotency, kiểm soát quyền theo account, replay PWA đổi tài khoản. Không cấm người học làm lại bài có chủ đích; không báo mất dữ liệu thật từ code tiềm ẩn. |
| Hành trình học |Actual dashboard có1mastered+5locked và0CTA chính sau đã hoàn tất bài; vẫn có lối vào course. Canvas null làm mất tất cả node/lesson link; avatar không phản hồi. | Nối next-action theo mục tiêu/cấp độ/SRS và tạo fallback dùng được. Đây là điểm cản đầu vào rõ hơn nhu cầu thêm artwork/module. |
| Chất lượng release/UX |Lint11errors,375warnings;17routes vượt115KBgzip. Axe serious contrast ở11/13fixture cases; onboarding mobile tràn401/390px. | Chốt gate đúng revision, chỉnh token tương phản/reflow, đo production browser trước tối ưu sâu. Không suy ra tốc độ production từ devserver. |
| Analytics và bằng chứng giá trị |6ca tổng hợp tái hiện sai window/đơn vị/dedup/cohort; dashboard không gửi next-action click; chat usage reader thiếu writer tương ứng. | Sửa hợp đồng metric và đối soát event trước đọc activation/retention/cost. Hiệu quả học, retention thật và kinh tế vận hành hiện **U**. |

Nguồn chi tiết: [học thuật](content-academic.md), [phản biện nội dung](secondary-academic-review.md), [kỹ thuật](technical-quality.md), [sản phẩm/UX/analytics](product-ux-analytics.md), [bảo mật](security-privacy.md), [vận hành](operations.md).

Dependency cần xử lý sớm: Next15.5.12 nằm trong dải ảnh hưởng của hai advisory chính thức về [Windows-hosted RCE](https://github.com/advisories/GHSA-p293-qw3h-jr36) và [AVIF image optimizer](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4); bản vá được advisory ghi15.5.24. Cần xác minh version/deployment và cập nhật có regression checks. Đây là version applicability, chưa chứng minh hai đường khai thác này khả dụng trên Fuxie production.

## Hiện trạng theo10trục

Mỗi ô là điểm .1/.2/.3/.4 theo thang0–4 đã thống nhất; U chưa đủ bằng chứng. Không cộng hay lấy trung bình.

| Trục | Điểm từng tiêu chí | Nhận định |
|---|---|---|
|D01 Sản phẩm|2 /2 /1 /2|Định vị có; dashboard chưa thực thi next-action contract|
|D02 Học thuật|1 /1 /1 /1|Lỗi nội dung có quy luật; cần người duyệt và đối soát audio/DB|
|D03 UX/accessibility|2 /1 /1 /2|Có design system; contrast,fallback và tác vụ cụ thể cần sửa|
|D04 Chức năng/test|2 /1 /2 /2|Pipeline mẫu chạy; test fidelity và consistency chưa đủ|
|D05 AI/speech|1 /1 /1 /U|Có triển khai/fixture; provider và acoustic chưa xác nhận|
|D06 Kiến trúc/dữ liệu|2 /2 /2 /1|Giữ kiến trúc; tập trung completion,ownership và rewards|
|D07 Bảo mật/privacy|1 /1 /1 /U|Guard chưa đồng đều; hồ sơ quyền/retention thiếu evidence|
|D08 Hiệu năng/tin cậy|1 /U /1 /1|Bundle fail; telemetry thật và PWA replay còn thiếu|
|D09 Vận hành|2 /1 /1 /2|Local build/schema đạt; fresh-clone/container chưa kiểm,restore/rollback cần diễn tập|
|D10 Analytics/kinh tế|1 /1 /U /1|Readout cần sửa; chưa có outcome/cohort/cost thật tin cậy|

## Phạm vi tính năng và điều chưa chứng minh

| Cấu phần | Đã xây dựng/kiểm tra hiện tại | Chưa được xác nhận |
|---|---|---|
|Onboarding,course,dashboard|Source+fixture; actual navigation mobile/desktop|Firebase signup→bài đầu của người mới,persistence toàn hành trình|
|Vocabulary,grammar,SRS|Source,core/property tests,content text samples; due API200|Ghi nhớ dài hạn,concurrency/múi giờ/offline đầy đủ|
|Reading/listening|Nội dung mẫu+grader; actualAPI bài seed và UI submitmock|Mọi dạng bài,audio nghe thật,source–DBproduction parity|
|Writing/speaking/AIchat|Source,prompt,rubric,fixtures và content review|Provider truth,false-correction,giọng Việt/mic,feedback→sửa bài thật|
|Exam/teacher/admin|Source/phạm vi,hardening role/API smoke; trang HTTP200|Thi hoàn chỉnh/lớp giao bài→nộp→teacher review,auth thật|
|Gamification/progress|FSM/ledger tests và probe XP/replay|Kinh tế thưởng bền vững và tác động học tập|
|Ops/PWA/data|Build,CIconfig,read-only lịch sử,policy/harness|Current deployed version,backup restore,SLO,account-switch offline|

Các module nằm ngoài kiểm chứng đầy đủ được ghi gap; không tự coi chúng không tồn tại hay bị lỗi. Thẩm định format Goethe/telc theo đúng phiên bản và thẩm âm vẫn cần chuyên môn/nguồn chính thức tương ứng; metadata `aligned` hoặc `qa.passed` không thay nghiệm thu đó. Chuẩn nền tham chiếu là [CEFR descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors), [WCAG2.2](https://www.w3.org/TR/WCAG22/) và [OWASP ASVS](https://github.com/OWASP/ASVS), không tuyên bố được chứng nhận.

## Giới hạn và điều chỉnh phương pháp

- LanguageTool toàn kho bị chặn hạ tầng sau679giây và khoảng19,83GiBRAM; container audit đã dừng. Không có kết quả LT toàn kho để gọi PASS/FAIL. QA cấu trúc1.193file (gồm6course) PASS vẫn giữ, độc lập với lỗi semantic.
- Đã loại36file reading cloze khỏi nghi vấn tổng điểm vì dùng schema câu hỏi khác. Số cuối là115/268listening, không dùng con số scan thô151để báo lỗi.
- Property lần toàn suite có1timeout khi tranh tài nguyên; chạy riêng4ca đạt. Bốn interaction failures do locator/workflow cũ, không chứng minh sản phẩm hỏng; sáu ca khác chưa chạy vì giới hạn max-failures. Kết quả gốc được giữ cùng triage.
- Reviewer thứ hai đạt36/180mẫu và phản biện6case rủi ro; chưa duyệt chéo100% mọi đơn vị bị gắn lỗi như mục tiêu ban đầu. Cần full affected-template review và human signoff trong remediation; không gọi auditAI là nghiệm thu học thuật cuối.
- Local HTTP perf21/21status200 nhưng5budgetfail, trên dev/cache không hoạt động. Chưa chạy toàn Slow4G/browser matrix hoặc thu field Core Web Vitals. Không có production traffic,p95/error rate,provider invoice hoặc cohort học thật đủ tuổi.
- GitHub lịch sử10run gần nhất thất bại ở tháng6; chưa có run khớp HEAD hiện tại. Lịch sử đó không phải kết quả CI của snapshot audit này.

## Quyết định đề xuất và tài liệu bàn giao

Giữ kiến trúc hiện tại; ưu tiên một lát cắt **A1 đủ sáu kỹ năng** với bài học, đáp án, feedback và audio được duyệt; completion/reward/phân quyền đúng; dashboard đưa được hành động tiếp theo; event/readout đối soát được. Sau đó chạy pilot người học thật có phạm vi nhỏ và đo sửa bài/ghi nhớ, trước khi mở rộng các cấp độ hoặc đầu tư acquisition. Đây là thứ tự đề xuất, chưa phải cam kết lịch hay quyết định ngân sách của PM/Finance.

- [Backlog ưu tiên và kế hoạch2tuần/30–60–90ngày](prioritized-backlog.md): owner,effort,phụ thuộc,acceptance/retest.
- [Ma trận tiêu chí](criteria.md), [CSV](criteria.csv), [JSON](criteria.json):40tiêu chí có scope/confidence/gap.
- [Kỹ thuật và sơ đồ hệ thống](technical-quality.md), cùng5báo cáo chuyên môn/phản biện ở trên.
- [Biên bản bảo toàn và đóng audit](closeout.md): source,artifact,môi trường; log gốc nằm dưới `tmp/comprehensive-assessment-2026-09-11` và có thể bị dọn nếu xóa tmp, nên lưu kèm khi bàn giao.

CTO checklist đã áp dụng: giữ pattern hiện có, có đường kiểm chứng/rollback, không đưa hạ tầng mới vào sản phẩm, phân owner chuyên môn và bảo vệ dữ liệu/secret. **Bước tiếp theo cụ thể:** mở một đợt remediation giới hạn theo A01–A05 trong backlog, bắt đầu bằng server-validated session/ownership song song sửa nhóm bài mẫu lỗi; QA và Academic Lead nghiệm thu lát cắt A1 trước pilot.
