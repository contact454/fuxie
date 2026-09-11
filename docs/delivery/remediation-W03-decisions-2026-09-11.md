# W03 — Quyết định triển khai session, chấm đáp án và receipt

Vai chinh: Product Manager EdTech  
Vai phoi hop: German Academic Lead, CTO / Tech Lead, Security / Privacy Consultant

Ngày: 2026-09-11. **Trạng thái: D1–D6 ADOPTED_FOR_IMPLEMENTATION; production release CLOSED.** Đây là quyết định mặc định của các vai trò agent trong nhiệm vụ người dùng đã giao qua “ok em làm đi”, tiếp nối bước W03 trong bàn giao W01. Không phải chữ ký của người duyệt học thuật, pháp lý hoặc chủ môi trường production. Tài liệu này thay phần “D1–D6 còn mở / PREP ONLY” của [contract W03](remediation-W03-session-contract.md) cho lần triển khai hiện tại; các bất biến R1–R12 và tiêu chí QC của contract vẫn áp dụng.

Mục tiêu là để learner nhận câu hỏi thuộc phiên của mình, gửi đáp án thực, nhận phản hồi từ máy chủ và có biên nhận điểm chỉ được ghi một lần. Lỗi mạng phải giữ tiến độ đã lưu và nội dung đang nhập. Phạm vi là mixed daily session; không đổi cơ chế thưởng của các module reading/listening riêng, không duyệt lại nền kinh tế XP/Fucoin và không phát hành học liệu.

## Căn cứ và thẩm quyền

Đã đọc router/checklist và bốn role profiles trước khi quyết định. PM sở hữu phạm vi, hành vi người dùng và acceptance; CTO tư vấn kiến trúc/migration; Academic tư vấn thiết kế luyện tập và giới hạn tuyên bố; Security/Privacy tư vấn giới hạn dữ liệu và trust boundary. “Owner” dưới đây là vai trò agent chịu trách nhiệm trong nhiệm vụ này, không phải một nhân sự được giả định đã ký.

Các nguồn đã kiểm trong working tree:

| Nguồn | Căn cứ cho quyết định |
|---|---|
| `apps/web/src/lib/session/builder.ts:145–192` | Review hiện 10 XP; intro từ mới 5 XP, chưa có recall. |
| `builder.ts:199–227` | Câu grammar cố định được ghép với lesson bất kỳ; không đủ nguồn để cấp mastery. |
| `apps/web/src/components/session/SessionPlayer.tsx:86,110–132` | Client dùng GET start, gửi `correct`/`totalXp`; SSR còn gọi builder trực tiếp. |
| `apps/web/src/app/(learn)/session/page.tsx:126–139` | Level lấy từ profile; phải giữ chính sách profile A1 fallback, bỏ đường cấp câu không có attempt. |
| `apps/web/src/components/session/exercises/TypingExercise.tsx:6–29` | Hiện so văn bản sau trim/lower-case; chọn bản chuẩn hóa hẹp, có version, tránh tự mở rộng đáp án. |
| `apps/web/src/lib/progress/learning-activity.ts:99–179` | Helper có tùy chọn `updateStreak:false`, nhưng mọi `analytics` input đều phát meaningful event. Partial completion phải bỏ analytics input. |
| `apps/web/src/lib/api/rate-limit.ts:13–46` | Limiter dùng Map trong process; phù hợp chặn burst cục bộ, không phải hạn mức bền trên nhiều instance. |
| `apps/web/src/lib/auth/middleware.ts:52–87` | `withDbAuth` lấy DB user ID, role và lọc deletedAt; không dùng Firebase UID làm owner. |
| `packages/database/prisma/schema.prisma:478–481,622` | Vocabulary có PUBLISHED/deletedAt; SRS có unique(userId,vocabularyItemId). PUBLISHED không đồng nghĩa human approval. |
| [A1 selection](../content-quality/a1-pilot-r1/selection.md), [candidate manifest](../content-quality/a1-pilot-r1/candidate-manifest.json) | 12 hoạt động ứng viên; `humanApprovedActivities = 0`, mapping/parity và học thuật chưa đủ để mở learner pilot. |
| `apps/web/src/app/sw.ts:15–20` | Đang dùng defaultCache; chưa có bằng chứng tách cache session theo tài khoản. |

Line numbers là vị trí khi đọc đầu lần triển khai; integrator ghi lại revision/hash cuối ở hồ sơ kiểm chứng. Đây không phải báo cáo kiểm thử runtime.

## D1 — Từ mới, chấm văn bản và XP

**ADOPTED. Owner: PM, Academic tư vấn, Backend thực hiện.**

- Mỗi từ mới gồm INTRO acknowledgement **0 XP** rồi một TYPING recall **5 XP nếu đúng**. INTRO phải đứng trước recall của chính từ đó; resume/retry giữ nguyên thứ tự trong snapshot. Acknowledgement không có `correct`, không vào mẫu số accuracy và không chứng minh mastery.
- Review có đáp án thật, đúng được **10 XP**. MC gửi opaque `optionId` thuộc lựa chọn đã đóng băng; TYPING gửi văn bản. Không dùng `client.correct`, tổng XP, cardId, level, points hoặc client hearts để quyết định kết quả.
- Grading version đầu dùng **Unicode NFC → trim khoảng trắng ngoài → lower-case → equality** với expected form đã lưu. Không bỏ mạo từ, dấu câu hoặc khoảng trắng bên trong; không gộp ß/ss, ä/a/ae, ö/o/oe hay ü/u/ue; không fuzzy match. Case-insensitive kế thừa hành vi hiện tại, không chứng nhận learner viết đúng quy tắc hoa/thường tiếng Đức.
- Expected form lấy từ trường từ vựng đã snapshot. Nếu nguồn chứa mạo từ như một phần của word thì nó vẫn thuộc đáp án; trường `article` riêng không tự được thêm/bỏ trong grader. Không tạo accepted variants không có nguồn. Feedback chỉ hiện key của câu vừa check, sau khi đáp án đầu đã được lưu.
- Chỉ enroll SRS khi recall đã được check; recall sai vẫn enroll và due ngay để có thể luyện lại. INTRO đơn lẻ không enroll. `wordsLearned` chỉ tăng khi **thực sự tạo thẻ mới và recall đúng**, distinct theo vocabulary ID. Thẻ đã có không tăng lại chỉ vì learner mở thêm session. Đây là counter “từ mới hoàn tất recall lần đầu”, không phải bằng chứng nhớ dài hạn.
- Không có session awardable nếu snapshot không có ít nhất một câu chấm được. Tối đa 5 review và 5 cặp từ mới trong phiên đầu; không nhét intro-only để tạo completion.

Không thêm Fucoin. Review giữ lịch nhị phân hiện có: đúng → ngày tiếp theo; sai → due ngay. Không tuyên bố W03 đã tích hợp đầy đủ FSRS.

## D2 — Nguồn câu hỏi và điều kiện học liệu

**ADOPTED. Owner: Academic cho eligibility, PM cho phạm vi, Backend cho nguồn/version.**

- V2 đầu chỉ phục vụ vocabulary INTRO, TYPING và MC có nguồn phù hợp. Loại hoàn toàn grammar placeholder, GRAMMAR mastery, LISTENING, LISTENING_MINI và MATCHING khỏi builder/award của v2. Loại không được hỗ trợ là lỗi cấu hình nếu lọt vào snapshot, không phải câu đúng mặc định hoặc session rỗng thành công.
- Chọn vocabulary cùng CEFR của learner, PUBLISHED, không deleted. Review phải thuộc DB user hiện tại. MC chỉ dùng distractor hợp lệ trong catalog, không giữ fallback thức ăn hardcoded; nếu không đủ lựa chọn phân biệt thì dùng TYPING có dữ liệu hợp lệ hoặc bỏ ứng viên trước khi tạo snapshot.
- Snapshot lưu source identity, source revision, key, grading/reward version và thứ tự. Câu hỏi public không chứa expected answer/key/meaning chỉ ra lựa chọn đúng trước check. TYPING không gửi term, ví dụ hay media gợi ngay đáp án. INTRO được hiển thị từ để học; linked recall là luyện nhớ có phản hồi, không được gọi là kỳ thi chống gian lận.
- Chỉnh sửa thông thường sau start không được âm thầm đổi key của snapshot. Nếu content bị xóa, chuyển khỏi PUBLISHED hoặc bị rút khỏi eligibility trước commit, completion trả conflict `SESSION_SOURCE_UNAVAILABLE`, toàn bộ award rollback. Không thay câu trong attempt cũ. UI giải thích phiên không còn lưu được, cho phép chủ động bỏ phiên/tạo mới. Receipt đã commit vẫn được replay trong retention; không tự trừ XP cũ khi content thay đổi.
- Chưa có catalog được duyệt phát hành. Dữ liệu fixture cục bộ được phép để triển khai và kiểm chứng, có nhãn nguồn/phiên bản fixture, không đổi trạng thái human approval trong manifest. Bản candidate giữ production gate đóng; không cho phép riêng một cờ enable biến candidate manifest thành catalog approved.

Việc duyệt đúng hash text/audio, mapping source→DB→UI và learner pilot HG0–HG5 vẫn chưa có bằng chứng. Khoảng trống này chặn **phát hành**, không chặn hoàn thiện mã và kiểm thử trên môi trường thử.

## D3 — Hearts, kết thúc phiên và counters

**ADOPTED. Owner: PM; Backend áp dụng, QA đối soát XP/event.**

Máy chủ cấp **5 hearts**; mỗi câu graded sai trừ một, acknowledgement không trừ. Chỉ có hai đường lưu thưởng:

| Kết quả | Điều kiện | Award và counters |
|---|---|---|
| COMPLETED | Mọi entry dự kiến đã check/ack, có ít nhất một câu graded, còn ít nhất 1 heart | Base XP từ câu đúng; áp dụng shared streak bonus hiện có; lessonsCompleted1; meaningful action theo attempt ID; words/SRS từ thay đổi thật. |
| EXHAUSTED | Đã check câu sai thứ 5 | Giữ XP của câu đúng trước đó và SRS outcomes đã check; lessonsCompleted0; `updateStreak:false`; không meaningful event, activation hoặc streak bonus. |

Nếu câu cuối cũng là lỗi thứ 5, **EXHAUSTED ưu tiên**. Hoàn tất toàn bộ phiên có dưới 5 lỗi vẫn là một lượt luyện tập có ý nghĩa kể cả 0 câu đúng; accuracy0 và base XP0 phải hiển thị trung thực, không gọi là mastery. Streak bonus nếu có là thưởng hiện hành của lượt hoàn tất đủ điều kiện, tách rõ khỏi điểm trả lời.

Không thưởng arbitrary prefix, intro-only, no-answer, phiên tự bỏ hoặc hết thời gian. Không có nút “nộp sớm” để farm phần prefix. EXHAUSTED chỉ là terminal award khi cùng transaction đã lưu receipt. Pending answer check không tự ghi SRS/XP; nếu learner đóng tab ở trạng thái đủ terminal thì lần resume cho phép hoàn tất/lấy receipt.

`srsReviewed` đếm thẻ review distinct đã thực sự áp dụng; `wordsLearned` theo D1; score/max/percent loại INTRO. `exerciseId` và actionId dùng `session:<attemptId>`. Partial không truyền analytics vào helper vì helper hiện coi mọi analytics input là meaningful completion. Không hiển thị giá trị streak placeholder0 từ nhánh `updateStreak:false` như streak thật của learner. Không suy thời gian học chủ động từ khoảng cách start–complete.

## D4 — Identity, retry, expiry và restart

**ADOPTED. Owner: CTO + PM; Backend/UI thực hiện.**

- **Một IN_PROGRESS mixed session/user**, hạn làm **24 giờ từ startedAt** theo giờ server. Same start key trả cùng attempt; key mới khi có active trả/resume active, không tạo thêm. Completed receipt được đọc/replay qua thời hạn làm bài cho đến hết retention.
- Start dùng contractVersion2 và clientStartKey tối đa128 ký tự. Client lưu một key cho một ý định start và tái dùng khi response mất; không tạo key mỗi fetch/retry/effect rerun.
- Restart phải là thao tác rõ ràng từ learner, kèm active attempt identity mà UI đang bỏ và start key mới. Transaction xác minh owner + active identity rồi ABANDONED attempt cũ và tạo mới; không cộng thưởng cũ. Retry cùng restart key trả cùng attempt mới, không tiếp tục bỏ thêm attempt. Nếu tab khác đã đổi active, trả409 để refresh trạng thái, không abandon phiên mới ngoài ý định.
- Expired/abandoned không nhận đáp án mới hoặc completion; trả410 với trạng thái khôi phục rõ. Câu đã check với cùng canonical payload được replay feedback đã lưu; đổi payload sau feedback trả409. Raw first answer immutable. Unknown/foreign attempt hoặc question dùng404 chung.
- Lock order thống nhất User → SessionAttempt; partial unique index cho IN_PROGRESS cùng DB transaction bảo vệ active count. Answer/complete/creation cần theo lock order; không dựa Map trong process để bảo vệ concurrency.
- Nếu SRS đã đổi từ snapshot do module/tab khác, complete409 `SESSION_REVIEW_CONFLICT` và rollback mọi effect, không ghi đè lịch mới. Đây là conflict không chữa bằng lặp nộp mãi; UI cho reload trạng thái hoặc bỏ và tạo phiên mới. W01 owner predicate vẫn ở chính mutation.

Tất cả response cá nhân `private, no-store`; client fetch no-store. UI giữ input/selection trên lỗi mạng,401,409,410,429,500; chỉ receipt đã commit được gọi “đã lưu”. Reload nhận lại answers đã server lưu; không hứa khôi phục phần input chưa gửi sau khi đóng trình duyệt. Không lưu raw answers vào localStorage/analytics để giải quyết retry.

## D5 — Retention, giới hạn và vận hành dữ liệu

**ADOPTED engineering defaults. Owner: Security/Privacy + CTO; Backend thực hiện purge/limits.** Đây là quyết định giảm dữ liệu cho candidate, không phải kết luận tuân thủ pháp luật hoặc thời hạn lưu bắt buộc.

| Ràng buộc | Mặc định cụ thể |
|---|---|
| Snapshot | Tối đa20 entries; bản đầu tối đa15 từ 5 review + 5 intro/recall pairs. Tối đa4 lựa chọn MC, prompt/feedback/fields có schema và giới hạn chuỗi. Không quét theme không giới hạn. |
| Request | Tối đa8KiB bytes thực tế của body, không chỉ tin Content-Length; text tối đa256 Unicode code points; start/idempotency key tối đa128 ký tự. Schema strict; field reward/owner bất hợp lệ bị reject. |
| Burst theo DB user | Reuse limiter hiện có: start/restart20 request/phút; answer60/phút; complete60/phút; read60/phút. 429 có Retry-After, UI giữ payload. Đây là giới hạn best effort trong từng process. |
| Tạo attempt bền | Tối đa20 **attempt mới**/user trong rolling24h, đếm trong transaction đang lock User. Resume, same-key/restart replay và receipt replay không tạo row nên không tiêu hạn mức này. Không gọi nó là giới hạn XP toàn hệ thống. |
| Retention | Snapshot, raw answers và receipt tối đa90 ngày tính từ startedAt; public/service access sau cutoff trả404, không award/rebuild. Mốc không được gia hạn bởi GET/retry. |
| Purge | CLI/operator command dry-run mặc định; explicit execute, batch tối đa1000 rows, cutoff dựa startedAt. Không xóa aggregate XP/progress đã commit. Xóa attempt không được chuyển request complete cũ thành start mới. |
| Tài khoản | FK cascade khi xóa User vật lý; deletedAt bị chặn ngay qua withDbAuth. Không giữ bản sao answers ngoài attempt. Account deletion policy tổng thể chưa được thay trong W03. |
| Dữ liệu ngoài DB | Không log body, key, raw answer hoặc snapshot; analytics chỉ IDs/counts/version/status. Không gửi qua provider. Không âm thanh/upload mới. |

Purge có test cutoff, dry-run và replay sau xóa trên DB thử. Chủ vận hành chạy hàng ngày trước khi mở production và ghi thời gian, số row, lỗi cùng cách retry; task này không tạo lịch hệ thống hay automation chưa được yêu cầu. Nếu chưa có vận hành purge và cache đạt QC, giữ gate đóng; không mô tả physical deletion là tự động đã chạy khi mới có command.

## D6 — Migration, compatibility và rollout

**ADOPTED. Owner: CTO + Delivery; Backend là một schema writer, QA xác minh.**

1. Giữ baseline/dirty tree và W01; thêm model SessionAttempt, relation, uniqueness/index bằng additive migration. Không backfill historic results thành “đáp án đã xác minh”, không drop history. Generate Prisma một lần sau khi writer chốt schema; kiểm migration trên DB disposable và schema hiện có trước khi ghi acceptance.
2. API v2 và consumer `/session` tích hợp cùng candidate. SSR không tự đưa awardable initialItems vượt service; visual fixture chỉ nonproduction và không gửi mutation thật. Các tab/client cũ GET start hoặc complete thiếu v2 identity nhận426 `SESSION_UPGRADE_REQUIRED`, tuyệt đối không nhận nhánh award legacy.
3. Gate server đóng trả503 `SESSION_UNAVAILABLE` cho v2 writes; giữ private/no-store cả lỗi. Legacy vẫn bị426 và không thưởng. Candidate hiện tại có production release đóng do chưa có approved catalog; fixture chỉ nonproduction trên DB thử. Khi làm candidate release tương lai, phải thêm catalog version đã duyệt và kiểm các gates dưới đây, không chỉ đổi cờ môi trường.
4. Rollback hợp lệ là đóng session writes hoặc về bản v2-safe vẫn giữ W01 và từ chối client XP. Giữ bảng mới/receipt, không drop migration để rollback ứng dụng. Không rollback về route complete tin boolean/totalXp.
5. Chỉ mở learner pilot khi có cùng revision: catalog đã duyệt đúng nguồn, parity, QA API/DB/UI, migration/restore, no-store + PWA account switch/old cache evidence, purge operation, và owner theo dõi/rollback. W04 replay reading/listening, W08 KPI toàn hệ thống và W10 cache toàn dự án vẫn có phạm vi riêng; W03 không được báo đã đóng các vấn đề này.

Không deploy/push/provider/DB production trong quyết định này. Không giao việc cho Antigravity; root integrator đang trực tiếp thực hiện theo nhiệm vụ hiện tại.

## Nghiệm thu và trạng thái thực

Các quyết định D1–D6 đã đủ để triển khai v2 candidate và kiểm chứng trên fixture. Việc soạn tài liệu này **không thực hiện code, migration, seed, API mutation hoặc test**. Backend/QA ghi kết quả implementation vào hồ sơ W03 riêng, không đổi trạng thái ở đây thành “đã chạy” dựa trên ý định.

Thành công đo bằng: forged XP không tạo effect; owner mismatch404; intro0; first-answer change409; cùng start/answer/complete retry cho kết quả ổn định; hai completion đồng thời chỉ một receipt/một bộ increments; lỗi giữa activity và receipt rollback thật; stale SRS/source không ghi từng phần; đúng5hearts theo policy; UI giữ đáp án trên lỗi và chỉ hiển thị saved từ receipt; legacy không thưởng; production gate đóng; purge không tái award ID đã xóa. Các điểm này bổ sung, không thay thế QC R1–R12 trong contract.

PM checklist đã áp dụng: target learner/problem rõ; must-have integrity + recoverable UX tách khỏi nice-to-have grammar/AI; acceptance có ca đối soát; teacher/admin chỉ bị từ chối learner write, không thay workflow riêng; các edge cases zero-correct, fifth-heart-on-last, retry/restart, source withdrawal, retention/old tabs đã được quyết định. Không có human content signoff mới.

**Bước tiếp theo:** Backend tích hợp D1–D6 vào schema/service/API/UI; QA kiểm transaction/race/rollback trên DB disposable và learner retry/resume. Chỉ sau evidence thực mới đóng TECH-01 cho `/session`; việc mở production cần một lần quyết định phát hành với học liệu và vận hành đủ bằng chứng.
