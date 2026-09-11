Vai chinh: Backend Engineer  
Vai phoi hop: QA Automation Engineer, Security / Privacy Consultant, German Academic Lead

# W00/W01 — kết quả thực thi và kiểm chứng

Ngày 11/09/2026. **W01: fixed trong working tree; QC: ACCEPTED_FOR_SCOPE.** SEC-03 không còn tái hiện trong phạm vi API session/SRS đã kiểm. Đây là nghiệm thu bản vá cục bộ; chưa commit, push, merge, deploy hoặc nghiệm thu release toàn Fuxie. TECH-01/02 còn mở.

Executor thực tế là Codex theo yêu cầu “ok em làm đi” của anh. Có một agent bảo mật điều tra trước sửa và một agent bảo mật khác rà soát bản vá với ngữ cảnh mới; cả hai chỉ đọc. Đây là kiểm chứng bằng công cụ và AI review, không phải human signoff.

## Baseline và phạm vi

- W00 chụp 5.831 file của working tree lúc `2026-09-11T07:17:49.856Z`; bỏ qua file `.env*`. HEAD `3217ea052aec5606602cb7f9ec62f159ae9a750e`, nhánh hiện có `chore/content-audit-remediation-2026-06`. Không reset/stash hay thay tree bằng HEAD sạch.
- SHA256 tổng manifest: `87bc0c41c52d411f4a1dab4b0a38e3a25f7dd42103124581bdde3d58c137037b`. Manifest đầy đủ: [baseline.json](../../tmp/remediation-W01/baseline.json).
- Hai file code/test thay đổi: [route.ts](../../apps/web/src/app/api/v1/session/complete/route.ts), [route.test.ts](../../apps/web/src/app/api/v1/session/complete/route.test.ts). Diff: 113 dòng thêm, 8 dòng xóa; phần production chỉ một import và kiểm tra/cập nhật ownership.
- Patch được independent review có SHA256 `2b9192d84c76ef03063a9ec3c7e0be96a5e1cbf724674700f6eeb483837152a7`; [candidate.patch](../../tmp/remediation-W01/candidate.patch). Hash cuối giữ nguyên bản đã review.
- Đối soát toàn baseline sau các gate chỉ thấy hai file code/test trên thay đổi. `public/sw.js` do build tạo đã được trả về **đúng bytes của snapshot trước W01**; `next-env.d.ts` không lệch. Tài liệu mới/cập nhật W00/W01/W03/W06 được ghi riêng sau đối soát, không sửa học liệu nguồn, schema hay lockfile.

## Bất biến đã sửa

Nguồn là `results[].data.cardId` do client gửi. Trước sửa, session complete cập nhật SRS theo `id` bất kỳ. Nay `cardId` phải là chuỗi không rỗng; mutation dùng đồng thời raw `id` và **DB user.id lấy từ auth server**. Không dùng Firebase UID thay DB ID, không nhận owner từ body, không trim/ép UUID làm đổi định danh hợp lệ.

`updateMany.count !== 1` ném `NotFoundError('Card not found')` ra khỏi transaction. Card của người khác, không tồn tại hoặc ID sai kiểu đều trả lỗi 404 chung. Một review thất bại làm rollback mọi review đã chạy trước; không ghi completion và không invalidation như thành công. Lịch ôn hiện có (đúng: sau một ngày; sai: ngay), body thành công, grammar/vocabulary-new và hai nhánh cache vẫn được giữ.

Đã truy cả SessionPlayer, builder, auth/database user mapping, error handler, shared activity/streak/analytics và endpoint SRS review riêng. Không tìm thấy đường đổi owner có thể vượt bản vá này. Không mở rộng sang các lỗi chưa thuộc W01.

## Đối soát requirement

| Requirement | Kết quả và bằng chứng |
|---|---|
| R1 ownership | PASS — câu UPDATE có `id + server DB user.id`; unit và HTTP probe có body/nested owner giả. Card B không đổi. |
| R2 guard | PASS — missing/null data, missing/null/empty/whitespace/numeric/boolean/array/filter-shaped object ID bị chặn; unit xác nhận không gọi mutation. Chuỗi có khoảng trắng không được normalize thành card hợp lệ. |
| R3 error | PASS — foreign, absent và malformed có cùng 404, `NOT_FOUND`, `Card not found`; không tiết lộ owner. |
| R4 atomicity | PASS — PostgreSQL thật đối soát `[owned, foreign]`, `[owned, missing]`, `[owned, malformed]`; tám nhóm dữ liệu trước/sau bằng nhau. Unit xác nhận không activity/new-vocab/grammar/invalidation khi lỗi. |
| R5 compatibility | PASS — owned correct/incorrect; legitimate mixed review/new-vocab/grammar; grammar-only; response và lịch ôn giữ nguyên. |
| R6 verification | PASS — 20 unit, 19 HTTP/DB cases, typecheck/core/build/check:quick; fresh read-only review không có vấn đề code cần sửa. Có lưu cả lượt kiểm tra lỗi ban đầu. |
| R7 scope | PASS — chỉ hai file runtime/test; không đổi client XP, empty-results, UI hay schema. TECH-01/02 không được đánh đóng. |

## Lệnh và kết quả

Node **22.23.2**, pnpm **9.15.4**; Turbo forced để không dùng kết quả cache của revision khác. Mỗi lệnh có thời điểm bắt đầu/kết thúc UTC, exit code và log trong [verification.json](../../tmp/remediation-W01/verification.json).

| Lệnh / evidence | Kết quả |
|---|---|
| Focused Vitest trước sửa production | 18 FAIL, 2 PASS — regression mới tái hiện route cũ; [log](../../tmp/remediation-W01/focused-before-fix.log). Đây là lượt RED có chủ đích. |
| `pnpm --filter @fuxie/web exec vitest run src/app/api/v1/session/complete/route.test.ts` | **20 PASS**; [log](../../tmp/remediation-W01/focused-after-fix.log). |
| `pnpm typecheck` | **6/6 tasks PASS**, không cache; [log](../../tmp/remediation-W01/typecheck.log). |
| `pnpm test:core` | **989 PASS** = web926 + AI58 + SRS5; [log](../../tmp/remediation-W01/core.log). 20 focused nằm trong web926, không cộng thêm lần nữa. |
| `pnpm build` | **2/2 tasks PASS**, không cache; [log](../../tmp/remediation-W01/build.log). |
| `pnpm check:quick`, lượt đầu | FAIL: property băm content vượt 5.000 ms (5.374 ms); 886 PASS, 1 FAIL, 14 SKIP. Các gate asset/locale/state trước đó đạt; visual audit chưa chạy trong chuỗi này. [Log](../../tmp/remediation-W01/check-quick.log). |
| Cùng `pnpm check:quick`, sau dừng môi trường thử | **PASS**: property887 PASS,14 SKIP; visual72 PNG/4 invariants PASS; [log](../../tmp/remediation-W01/check-quick-retry-idle.log). Không sửa timeout/assertion/config, không chọn lọc test. Lượt đầu được giữ như bằng chứng timeout dao động; audit trước cũng từng gặp cùng bài. |
| `pnpm exec tsx tmp/remediation-W01/db-rollback-probe.ts` | **19 PASS**; [kết quả từng ca](../../tmp/remediation-W01/db-rollback-probe.json), [script](../../tmp/remediation-W01/db-rollback-probe.ts). |
| `git diff --check` hai file | PASS sau chuẩn hóa LF; không còn whitespace diff toàn file. |

## Bằng chứng PostgreSQL và giới hạn

Probe có hard guard host `127.0.0.1`, port55432, DB **fuxie_w01** và web loopback3042. DB riêng được `prisma db push --skip-generate` + `db:seed:dev`; không migration hoặc ghi production. Next dev dùng dev-auth thực qua HTTP, user học viên fixture và user B tổng hợp. Provider bị vô hiệu hóa. Đây không phải kiểm chứng Firebase/ingress production.

19 ca gồm một anonymous401, 16 rejection404 và hai positive200. Các ca rejection so sánh toàn bộ row của hai learner trong SrsCard, UserProfile, UserProgress, DailyActivity, UserStreak, StreakFreezeUsage, AnalyticsEvent và GrammarProgress, gồm timestamps. Hash before/after giống nhau; SQL log ghi ROLLBACK cho các batch lỗi. Hai ca positive dùng ID không phải UUID, chứng minh lịch ôn đúng/sai vẫn theo công thức cũ; profile +40XP, lesson+1, progress+1 và card/profile B không đổi. XP40 ở đây chỉ là compatibility control, **không chứng minh client XP đáng tin**.

Cache invalidation được kiểm qua unit/control-flow; không gán bằng chứng SQL rollback cho cache. Probe không thử tải lớn, provider, victim-ID enumeration hay production. Bản vá không thêm query mỗi review so với trước; giới hạn kích thước toàn session và vòng lặp input hiện có thuộc W03.

Web thử3042 và hai container PostgreSQL/Redis của audit đã dừng sau kiểm tra; giữ dữ liệu fixture/evidence để tái lập. Không chạm container của dự án khác. Không cập nhật đè báo cáo security scan lịch sử: verdict này là remedial evidence cho working tree mới.

## W03 và W06 song song

- [W03 contract](remediation-W03-session-contract.md): đã chuẩn bị persistent attempt, raw answer, server grading, transaction/receipt chống replay, UI giữ lỗi/retry và migration. **PREPARED, chưa implementation-ready**; W01 local QC đã xong nhưng D1–D6 và catalog/mapping còn cần owner chốt. Chưa sửa XP hoặc replay reading/listening.
- [A1 candidate selection](../content-quality/a1-pilot-r1/selection.md): 12 hoạt động thật = hai chuỗi × sáu kỹ năng, 24 từ được chọn; [manifest](../content-quality/a1-pilot-r1/candidate-manifest.json) có 194 tham chiếu/hash trong 11 file nguồn. H0 selection hoàn tất; chưa human approval, nghe audio hoặc live source→DB→UI parity. Không coi toàn W06 hoặc HG0–HG5 đã đạt.

Root đã kiểm độc lập 12 slot, sáu kỹ năng mỗi chuỗi, 194 review-unit hashes, 142 field hashes và 11 source-file hashes: tất cả khớp. Kiểm liên kết tài liệu và hash hai file candidate sau bàn giao cũng đạt; [validation](../../tmp/remediation-W01/deliverables-validation.json).

Backend checklist đã áp dụng: input guard và auth boundary rõ; transaction nguyên tử; không thêm N+1; invalidation sau commit; lỗi và compatibility có kiểm chứng. Release toàn dự án vẫn chờ các findings khác, content/human gates và kiểm chứng môi trường phát hành trong chiến lược.

**Bước tiếp theo:** CTO/Backend cùng PM/Academic/Analytics chốt T0/D1–D6 của W03 trên baseline đã có W01, ưu tiên bỏ nguồn grammar cố định và xác định đáp án recall; sau đó triển khai server grading + receipt. W06 tiếp tục đóng mapping vocabulary/grammar/writing/listening trước H1/H2; chưa phát hành 12 ứng viên này cho pilot.
