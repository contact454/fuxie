Vai chinh: Security / Privacy Consultant  
Vai phoi hop: DevOps / Cloud Engineer, Legal / Compliance Advisor

# Đánh giá bảo mật và quyền riêng tư Fuxie — 2026-09-11

Phạm vi: D07.1–D07.4, cùng ranh giới dữ liệu ở D06 và cấu hình/CI ở D09 theo [khung đánh giá](../comprehensive-assessment-framework-2026-09-11.md). Đây là đánh giá hiện trạng, không phải chứng nhận ASVS hoặc phê duyệt ra mắt.

Kết luận: Fuxie đã có nhiều kiểm soát hữu ích tại web API, nhưng việc áp dụng chưa đồng đều. Rà soát và kiểm thử tổng hợp đã xác minh năm lỗi kiểm soát ở AI HTTP, đồng bộ nội dung nghe, session/SRS, cấu hình cron và cache PWA. Chưa có bằng chứng sự cố hay khai thác production. Thiếu hồ sơ retention/provider và quyền sử dụng/claim để kết luận D07.3–4 hoàn chỉnh.

## Điểm và mức tin cậy

| Tiêu chí | Điểm | Bằng chứng hiện trạng | Tin cậy | Giới hạn |
| --- | --- | --- | --- | --- |
| D07.1 — Auth/session, vai trò và ownership | 1/4 | Firebase cookie auth, DB role guard, quyền giáo viên/quản trị và ownership chat/exam hiện diện. SEC-01/02/03 cho thấy các đường nhạy cảm chưa áp dụng đồng đều. | Cao với code và ca tổng hợp; trung bình với toàn tiêu chí | Chưa chạy toàn ma trận Firebase login/expire/revoke/logout trên môi trường triển khai; chưa xác nhận ingress AI. |
| D07.2 — Secrets, dependencies, input/upload | 1/4 | Secret/env audit exit 0; dev-auth production bị vô hiệu hóa; một số route có Zod/rate-limit. Dependency audit phát 158 advisory entries. Cron còn fallback secret; STT parse file trước khi có giới hạn kích thước/MIME tại ứng dụng được chứng minh. | Cao với script/code; trung bình với exploitability | Không quét Git history/ignored secrets. Không coi advisory severity là severity ứng dụng; không thử tải lớn/provider thật. |
| D07.3 — Luồng dữ liệu và retention/xóa | 1/4 | Chat có ownership và soft-delete; TTS cache TTL 7 ngày; queue giữ theo số lượng. Transcript được gửi Gemini tạo memory/embedding; STT gửi Groq; grading gửi OpenRouter. PWA cache chung là SEC-05. | Trung bình | Chưa có bằng chứng end-to-end về xóa bản sao, memory, dead-letter, backup hoặc retention tại provider; chưa có browser account-switch replay. |
| D07.4 — Nguồn/quyền nội dung/media, claim và chính sách | U | Có guardrail cấm claim vượt bằng chứng và tài liệu yêu cầu giữ MIT notice khi tái sử dụng Mykonos. Chưa xác minh bộ hồ sơ quyền, privacy/terms, chấp thuận claim theo phạm vi phát hành. | Cao về giới hạn rà soát; thấp về kết luận quyền sử dụng | U không phải kết luận vi phạm bản quyền/pháp luật. Hợp đồng ngoài repo, đối tượng/độ tuổi/thị trường và phê duyệt chuyên môn chưa được cung cấp. |

Không quy U thành 0. Không dùng điểm trung bình bù lỗi quyền truy cập. Điểm này phản ánh sự hoàn thiện trong phạm vi đã kiểm chứng, không phản ánh số lượng code/test.

## Baseline, công cụ và bằng chứng thực thi

- HEAD lúc rà soát: `3217ea052aec5606602cb7f9ec62f159ae9a750e`; source là working tree hiện có, không thay bằng HEAD sạch. Đối chiếu snapshot/dirty-state tổng thể của báo cáo root.
- Skill đã dùng: `codex-security:security-scan`, Standard single pass. Scan ID: `12a73213-e33c-4ac9-99c0-069cbe323042`. Preflight `ready`; independent worker không khởi tạo được vì đầy slot. Root đã độc lập phát hiện đường session ownership và phản biện các phát hiện chính. Không gọi đây là hai lượt audit độc lập toàn repo.
- Native scan đã finalize thành công với 4 medium + 1 low, coverage partial. [Báo cáo canonical](</C:/Users/DMF Schule/AppData/Local/Temp/codex-security-scans-MnHEaz/9-Fuxie/3217ea052aec5606602cb7f9ec62f159ae9a750e_20260911T061254Z_sfa2fisx/report.md>) và các JSON `scan-manifest`, `findings`, `coverage` nằm cùng thư mục. Tool ghi nhận working tree đổi trong lúc chạy và gắn kết quả với snapshot ban đầu; source evidence có đoạn trích nguyên trạng, không tuyên bố mọi file cuối đợt giống snapshot. Token usage không có số đo (`scan_thread_unavailable`).
- Runtime các kiểm thử chuyên biệt: Node `25.9.0`, pnpm `9.15.4`, Vitest `3.2.4`. Core tests/build Node 22 do root thực hiện được báo cáo riêng.
- Chỉ tạo tài liệu và harness trong `tmp`; không sửa runtime, commit, deploy, gọi provider, đọc dữ liệu người học, tiết lộ secret, hay ghi DB thực. Dependency audit chỉ truy vấn registry được cho phép.

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| `pnpm security:secrets` | Exit 0 | [secrets.log](../../../tmp/comprehensive-assessment-2026-09-11/security/secrets.log) |
| `pnpm env:audit` | Exit 0 | [env-audit.log](../../../tmp/comprehensive-assessment-2026-09-11/security/env-audit.log) |
| `pnpm audit --json` | Exit 1; 158 entries: 5 critical, 62 high, 82 moderate, 9 low | [dependency-audit.json](../../../tmp/comprehensive-assessment-2026-09-11/security/dependency-audit.json) |
| Hono job/dead-letter/provider mock và listening-sync mock | 4/4 tests tái hiện hành vi | [focused-validation.log](../../../tmp/comprehensive-assessment-2026-09-11/security/focused-validation.log) |
| Cron missing-secret production mock | 1/1 test tái hiện hành vi | [cron-cache-validation.log](../../../tmp/comprehensive-assessment-2026-09-11/security/cron-cache-validation.log) |
| Installed PWA policy | 1/1 sau sửa assertion harness | [cache-validation-retry.log](../../../tmp/comprehensive-assessment-2026-09-11/security/cache-validation-retry.log) |
| Session cross-user SRS mock | 1/1 test tái hiện hành vi | [session-ownership-validation.log](../../../tmp/comprehensive-assessment-2026-09-11/security/session-ownership-validation.log) |

Tổng cộng 7 ca khác nhau có kết quả cuối đạt; “đạt” trong harness xác minh nghĩa là tái hiện đúng lỗi hiện tại, không phải kiểm soát bảo mật đạt. Lần đầu harness cache dùng sai thuộc tính `options.cacheName` của Strategy nên lỗi; đã đổi sang thuộc tính thật `cacheName`, bỏ mock không tác dụng và chạy lại riêng ca đó. Không che kết quả thất bại của harness. Core tests không được chạy lặp ở nhánh này.

Secret scanner chỉ xét file hiện tại tracked/untracked không bị ignore, có ngoại lệ `.env.example`, test/spec và nhiều mẫu chuỗi. PASS không chứng minh history/ignored files sạch. Env audit chỉ xét một số key/format; không kiểm tra CRON_SECRET, mọi quota hoặc thiết lập provider. Chưa chạy `env:audit:services` để tránh biến kiểm tra format thành tiếp xúc dịch vụ ngoài phạm vi.

## Các phát hiện đã xác minh

### SEC-01 — HTTP của AI service chưa kiểm tra identity/ownership

Mức: **medium**, tin cậy cao ở source/harness. [AI bootstrap](../../../apps/ai-service/src/index.ts:22) chỉ bọc HTTP bằng logger, CORS, telemetry và rate-limit. [Grade jobs/dead-letter](../../../apps/ai-service/src/routes/grade.ts:81) không yêu cầu user/operator; [queue serializer](../../../apps/ai-service/src/lib/queue/queues.ts:153) trả `data`, `result`, `failedReason`. Sibling generation routes dùng cùng cơ chế. CORS không xác thực caller ngoài browser. HMAC ở [live-proxy](../../../apps/ai-service/src/lib/live-proxy.ts:39) chỉ bảo vệ WebSocket.

Ba ca Hono giả đã xác nhận đọc job/dead-letter có payload riêng tư và tới provider mock khi không gửi credentials. Điều kiện: caller truy cập được listener; lộ dữ liệu queue cần Redis và job tồn tại. Chưa xác minh ingress production, nên không gọi đây là sự cố lộ dữ liệu production.

Khắc phục: auth service/user tại ingress; job có owner; status kiểm tra owner; dead-letter chỉ operator và loại payload không cần thiết. Owner: Backend Engineer + DevOps. Acceptance: anonymous bị chặn trước queue/provider, user A không đọc được job B, operator có quyền hẹp được kiểm thử.

### SEC-02 — Learner có thể gọi đồng bộ toàn bộ câu hỏi nghe

Mức: **medium**, tin cậy cao. [Middleware](../../../apps/web/src/middleware.ts:71) cho mọi Firebase session hợp lệ đi tiếp. [GET sync-ai](../../../apps/web/src/app/api/sync-ai/route.ts:79) không có role guard, gọi đồng bộ A1–B2; [deleteMany](../../../apps/web/src/app/api/sync-ai/route.ts:31) và [createMany](../../../apps/web/src/app/api/sync-ai/route.ts:70) sửa câu hỏi dùng chung.

Harness FS/Prisma giả xác nhận bốn lượt xóa/tạo mà không nhận hoặc kiểm tra role. Điều kiện: runtime có thư mục content và lesson khớp; FK có thể ngăn một số lần xóa nhưng không phải cơ chế phân quyền. Không thực hiện thao tác này trên DB thật. GET gây mutation còn cho phép kích hoạt từ điều hướng có cookie; thay thế nội dung chưa nằm trong transaction của cả thao tác.

Khắc phục: bỏ route migration khỏi web learner, hoặc chuyển thành POST có guard ADMIN/CSRF và transaction phù hợp. Owner: Backend Engineer. Acceptance: learner không gọi được bất kỳ DB write nào; thất bại giữa thao tác không để lesson ở trạng thái đã xóa nhưng chưa tạo lại.

### SEC-03 — Session completion sửa lịch ôn của card ngoài tài khoản

Mức: **medium**, tin cậy cao; tác động giới hạn ở integrity lịch ôn. [Session complete](../../../apps/web/src/app/api/v1/session/complete/route.ts:20) nhận `cardId`/`correct` từ client, rồi `srsCard.update({where:{id:cardId}})` không lọc userId. Ngược lại, [SRS review trực tiếp](../../../apps/web/src/app/api/v1/srs/review/route.ts:64) có predicate owner.

Harness giả đăng nhập attacker, lưu card owner victim và mô phỏng Prisma match chính xác theo `where`: request trả 200 và thay `victim.nextReviewAt`, activity ghi vào attacker. Cần biết UUID card victim; chưa xác minh đường enumerate và không có chứng cứ chiếm tài khoản. Đây là candidate root tìm được, được nhánh Security đọc lại và xác minh độc lập.

Khắc phục: xác minh tất cả card theo `id + userId` trong transaction, chặn batch có card ngoại lai trước mọi mutation. Owner: Backend Engineer. Acceptance: user A gửi UUID của B bị 403/404, lịch B không đổi, mixed batch rollback đúng. Việc tin `totalXp`/`correct` từ client cần được xử lý riêng ở D06/gamification vì đó là invariant khác.

### SEC-04 — Cron dùng credential mặc định khi thiếu cấu hình

Mức: **low**, tin cậy cao; điều kiện cấu hình rõ. [Cron leagues](../../../apps/web/src/app/api/v1/admin/cron/leagues/route.ts:11) dùng hằng development nếu CRON_SECRET rỗng/không có, kể cả production. Test đặt `NODE_ENV=production`, CRON_SECRET rỗng và header fallback từ source, nhận 200 và tới `updateMany` giả.

Tác động là caller chưa đăng nhập kích hoạt xử lý league toàn hệ thống khi thiếu secret, không phải chiếm tài khoản. Secret thật có cấu hình sẽ chặn đường này; trạng thái secret production chưa xác minh.

Khắc phục: fail closed khi thiếu cấu hình; bổ sung env gate. Owner: Backend + DevOps. Acceptance: thiếu/rỗng/sai secret đều không đọc/ghi league; chỉ credential cấu hình hợp lệ được thực thi.

### SEC-05 — PWA cache API cá nhân theo URL chung

Mức: **medium**, tin cậy trung bình. [Service worker](../../../apps/web/src/app/sw.ts:16) dùng `defaultCache`. Policy của dependency @serwist/next 9.5.7 đã cài loại `/api/auth/*`, nhưng đưa các GET `/api/*` khác vào cache `apis` trong 24 giờ, fallback khi mất mạng hoặc timeout. `/api/v1/auth/me` và `/api/v1/chat/history` khớp rule này. [Auth me](../../../apps/web/src/app/api/v1/auth/me/route.ts:54) trả dữ liệu cá nhân không có cache isolation/Vary Cookie. Trong auth flow đã rà soát không tìm thấy hook xóa cache khi đổi phiên.

Test import policy thật trong production xác nhận hai URL khớp cache chung và không có plugin đổi cache key theo identity. Điều kiện: service worker production đã đăng ký, cùng browser profile đã cache response của A, sau đó request offline/timeout. Chưa replay browser đổi A → B nên không khẳng định đã quan sát dữ liệu A xuất hiện trong UI B, và không suy rộng thành lộ dữ liệu giữa hai thiết bị.

Khắc phục: NetworkOnly cho API/navigation cá nhân, hoặc partition và purge theo identity có kiểm chứng. Owner: Frontend + Security/QA. Acceptance: cache A rồi logout/đổi B và offline không trả dữ liệu account/chat A; tài sản public vẫn cache được.

## Dependencies, dữ liệu/provider và quyền nội dung

158 entries là output registry theo lockfile, không phải 158 đường khai thác ứng dụng. Root đã đối chiếu hai advisory chính thức mới công bố 2026-09-08 cho Next 15.5.12: [Windows-hosted RCE](https://github.com/advisories/GHSA-p293-qw3h-jr36) và [AVIF image optimizer RCE](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4), bản vá 15.5.24. Cần xác nhận Windows deployment, nguồn ảnh có thể bị kiểm soát, cách dùng image optimizer/sharp và bản build đang phục vụ trước khi gán severity ứng dụng. Windows audit dev của root chỉ bind loopback. Vitest advisory cần UI server đang listen; các ca trong báo cáo này dùng `vitest run`, không chạy UI server. Các Hono helper advisories không tự áp dụng nếu helper dễ lỗi không được sử dụng.

Luồng đã xác minh bằng code: Firebase → user DB; Groq nhận audio ở [STT](../../../apps/web/src/app/api/v1/stt/route.ts:46); Google Cloud TTS nhận text ở [TTS](../../../apps/web/src/app/api/v1/tts/route.ts:169); OpenRouter nhận prompt chấm bài qua [client](../../../apps/web/src/lib/ai/openrouter.ts:16); Gemini nhận transcript để rút memory và tạo embedding ở [chat memory](../../../apps/web/src/app/api/v1/chat/memory/route.ts:15). Các SDK xuất hiện trong manifest không tự chứng minh mọi provider đang hoạt động.

[Chat DELETE](../../../apps/web/src/app/api/v1/chat/history/route.ts:102) kiểm tra owner rồi soft-delete conversation, không chứng minh xóa nội dung/messages/memory tại DB/provider. Queue completed/failed giới hạn theo số lượng, dead-letter không tự xóa ở [queue options](../../../apps/ai-service/src/lib/queue/queues.ts:68). TTS TTL 7 ngày là retention của một cache cụ thể. Chưa xác minh purge định kỳ hay quyền xóa/export tài khoản end-to-end. STT chỉ kiểm tra file có mặt trước gửi provider; giới hạn request của nền tảng triển khai chưa được kiểm tra nên chưa tuyên bố DoS đã chứng minh.

[Beta guardrails](../../beta/controlled-beta/guardrail-checklist.md:7) có owner và điều kiện nới claim; quy tắc dữ liệu cấm raw transcripts/submissions/PII trong evidence. Tài liệu [Mykonos reuse](../../design/fuxie-learning-world-mykonos-tech-reuse-masterplan.md:387) yêu cầu giữ MIT notice khi copy/adapt. Đây là hướng dẫn, chưa phải chuỗi hồ sơ quyền và signoff của toàn bộ asset. Báo cáo không kết luận Fuxie vi phạm luật, không gán GDPR hoặc luật cụ thể khi thị trường/đối tượng chưa chốt.

## Điểm mạnh cần giữ và liên hệ D06/D09

- Production dev-auth tắt theo NODE_ENV; cookie HttpOnly/Secure/SameSite, secret cookie bắt buộc runtime production. Giữ các kiểm soát này khi chuẩn hóa auth.
- DB role guard, admin role mutation, teacher-student membership, chat-history owner, exam-result owner và SRS review owner là pattern hiện có để tái sử dụng.
- CORS, rate-limit, WebSocket HMAC expiry/origin và body cap 2 MiB cho live đã có; không nhầm chúng với auth/quota toàn hệ thống.
- CI gọi `pnpm check` có secret audit; env script che giá trị. Chưa có dependency-audit gate tương đương trong workflow đã đọc. CI có service smoke nhưng evidence production/restore khác với fixture CI.
- Không xem latent `pending_reviews` clear-on-error là mất dữ liệu người dùng đã xảy ra: root tìm chưa có caller runtime cho helper queue trong source hiện tại. Đây là mục cần kiểm chứng trước khi bật offline flow.

## Backlog ưu tiên và điều kiện đóng

| Thứ tự | Việc | Owner | Effort tương đối | Acceptance / bằng chứng đóng |
| --- | --- | --- | --- | --- |
| 1 | Đóng các đường auth/ownership SEC-01/02/03; kiểm tra ingress trước mở AI listener | Backend + DevOps + QA | M | Negative tests thật tại route/transaction; anonymous và cross-user không tới sink; replay trên DB fixture riêng. |
| 2 | Triage và cập nhật runtime dependency có advisory nghiêm trọng, bắt đầu Next | CTO/Full-stack + DevOps | M | Version/build đã vá; applicability ghi rõ; core/E2E/image checks đạt, không dùng auto-fix mù. |
| 3 | Sửa cache cá nhân và fail-closed cron SEC-04/05 | Frontend + Backend + QA | S–M | Account-switch/offline browser test và cron missing-secret test đạt; không còn fallback bí mật development. |
| 4 | Data map + retention/deletion test cho chat/audio/memory/queue/provider | Security + Backend + Legal | M | Mỗi loại dữ liệu có owner, nơi lưu, TTL/quyền xóa; fixture deletion không còn bản sao ngoài retention hợp lệ. |
| 5 | Hoàn thiện hồ sơ quyền/claim/privacy theo thị trường sử dụng | Legal + Academic + Design | M, phụ thuộc chứng từ | Registry nguồn/license/notice và phạm vi quyền; người có thẩm quyền ký claim/privacy trước public promise. |
| 6 | Chuẩn hóa session/role matrix, dependency gate, restore/incident evidence | QA + DevOps | M | Chạy Firebase thật trên môi trường thử, revoke/logout, restore drill so với RPO/RTO đã chọn; evidence có revision/thời gian. |

Effort là S/M tương đối để chia việc, chưa phải cam kết lịch. Chưa có P0 production incident được chứng minh; mục đích các ưu tiên đầu là đóng invariant và làm rõ exposure trước mở rộng người dùng.

## Coverage và handoff

Đã kiểm kê entrypoint toàn repo và đọc sâu các ranh giới nhạy cảm liệt kê ở trên; canonical scan ghi **partial**, không tuyên bố toàn bộ 5.815 file inventory đã security-review. Manifest, bootstrap/guard, grade/generate routes, queue/live proxy, session/SRS, admin/teacher/chat/exam mẫu, PWA/offline, STT/TTS, CI và scripts được dùng làm bằng chứng. Một search hit hoặc tồn tại test file không được tính là kiểm thử hoàn chỉnh.

Còn U/cần follow-up: ingress/prod versions, Firebase session lifecycle thực, browser PWA replay, input-size/quota trong hạ tầng, provider terms/retention/deletion, tuổi/thị trường, giấy phép/cam kết claim và backup/restore exercise. Các giới hạn này không bị đổi thành finding chỉ vì thiếu quyền hoặc thiếu tài liệu.

Đã áp dụng checklist role: tài sản/tác nhân/trust boundary rõ; auth/authorization/secrets có bằng chứng; dữ liệu cá nhân/audio được tối thiểu hóa trong audit; luồng provider và mitigation/owner/acceptance đã ghi. Không yêu cầu người dùng cung cấp raw transcript hay secrets.

Bước tiếp theo cụ thể: Backend và QA chạy lại ba negative cases SEC-01/02/03 trên môi trường fixture cô lập, đồng thời DevOps xác nhận AI ingress và version Next đang triển khai; sau đó sửa từng control trong task remediation riêng, giữ báo cáo này làm baseline.
