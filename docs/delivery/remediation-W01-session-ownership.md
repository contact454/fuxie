Vai chinh: Project Manager / Delivery Manager  
Vai phoi hop: CTO / Tech Lead, Security / Privacy Consultant

# W01 — Ràng buộc ownership SRS khi hoàn tất session

Ngày11/09/2026. Executor thực tế: Codex, vai Backend Engineer, theo yêu cầu trực tiếp của anh. QC: QA/Security với một lượt AI review độc lập, ngữ cảnh mới. Trạng thái: **ACCEPTED_FOR_SCOPE trong working tree — SEC-03 fixed**, chưa deploy. [Bằng chứng thực thi](remediation-W01-verification-2026-09-11.md) gồm 20 unit, 19 HTTP/DB cases và các gate. Audit baseline HEAD `3217ea052aec5606602cb7f9ec62f159ae9a750e` gồm working tree và snapshot hash riêng. Prompt Anti bên dưới là tài liệu bàn giao ban đầu, không phải executor đã thực hiện.

## Context & Goal

Một learner gửi cardId của người khác tới session complete có thể đổi lịch ôn của card đó vì update chỉ lọc ID. [SEC-03](../intake/assessment-2026-09-11/security-privacy.md) đã tái hiện. Mục tiêu W01: chỉ tài khoản sở hữu mới cập nhật card; request gồm nhiều card phải hoàn tác toàn bộ nếu có card không hợp lệ/trái quyền. Giữ phạm vi nhỏ để review và retest nhanh. W01 không đóng TECH-01 (client XP) hoặc TECH-02 (replay); các việc đó thuộc W03/W04 trong [board](remediation-execution-board-2026-09-11.md). Đây là phần API mới, không thực thi lại Slice A vốn chỉ sửa UI/audio.

## Requirements

- **R-1:** Mỗi mutation `VOCAB_REVIEW` SHALL ràng buộc đồng thời `cardId` và DB `user.id` được xác định từ auth server. SHALL không dùng userId do client gửi.
- **R-2:** `cardId` SHALL là string không rỗng trước khi gọi Prisma. Giá trị undefined/null/sai kiểu/whitespace-only SHALL bị từ chối; không được làm mất predicate ID trong updateMany.
- **R-3:** Card không tồn tại hoặc không thuộc user SHALL trả cùng HTTP404 và cùng thông báo chung `Card not found`, không tiết lộ owner/tình trạng tồn tại.
- **R-4:** Nếu một review trong batch bị từ chối, toàn bộ transaction SHALL rollback: card đã xử lý trước, XP/progress/activity và các mutation khác của request không được commit. Invalidation SHALL chỉ chạy sau transaction thành công.
- **R-5:** Request hợp lệ với card chính chủ SHALL giữ HTTP200, response shape, công thức lịch ôn hiện tại và nhánh invalidation tương ứng. Nội dung grammar/vocab-new hiện có không thay đổi trong scope này.
- **R-6:** SHALL có regression cho positive, foreign, missing, malformed cardId và mixed batch. Unit mock không được dùng làm bằng chứng rollback DB thực; cần probe riêng trên DB fixture trước đóng SEC-03.
- **R-7:** SHALL giữ nguyên body/XP/UI/schema contract ngoài guard cardId nêu trên. Không thêm kiểm empty results hoặc “server score” từ client.correct trong W01; báo rõ residual TECH-01/02. Không đổi production content hoặc các file dirty ngoài phạm vi.

## Tech Design

**Chỉ hai file production/test được phép sửa:**

| File / vị trí hiện tại | Thay đổi |
|---|---|
|`apps/web/src/app/api/v1/session/complete/route.ts:3`|Tái sử dụng `NotFoundError` từ auth middleware cùng `withAuth`; không tạo error layer mới|
|`apps/web/src/app/api/v1/session/complete/route.ts:24`|Giữ transaction bao toàn request. Trong review loop, đọc cardId an toàn từ `r.data?.cardId`, kiểm kiểu string và `trim().length > 0` trước Prisma|
|`apps/web/src/app/api/v1/session/complete/route.ts:28`|Đổi mutation thành updateMany với `where: {id: cardId, userId: user.id}`; giữ data nextReviewAt hiện tại. `count !== 1` thì throw `new NotFoundError('Card not found')` ra ngoài transaction; không catch/continue hoặc trả lỗi từ callback mà vẫn commit|
|`apps/web/src/app/api/v1/session/complete/route.test.ts:3`|Cập nhật mocks và thêm cases có outcome rõ. Mock auth middleware phải export cả `AuthError` và `NotFoundError` phù hợp `instanceof` trong error-handler; positive mock `updateMany` trả `{count:1}`|

**Nguồn tái sử dụng chỉ đọc:** [auth errors](../../apps/web/src/lib/auth/middleware.ts:7), [error mapping](../../apps/web/src/lib/api/error-handler.ts:33), [dedicated SRS owner pattern](../../apps/web/src/app/api/v1/srs/review/route.ts:60), [learning activity](../../apps/web/src/lib/progress/learning-activity.ts:119). Schema đã có userId trên SRS card, không cần migration. Việc đặt owner ngay trong UPDATE tránh khoảng trống giữa query kiểm tra và mutation; guard hẹp ID ngăn updateMany bỏ điều kiện khi nhận undefined.

Unit test mixed batch chỉ xác minh exception ngăn đi tới activity/invalidation; transaction giả không thể chứng minh hoàn tác dữ liệu. Probe DB có thể tạo script tạm dưới `tmp/remediation-W01/`; chỉ chạy trên database fixture xác nhận host/port/name trước mọi ghi. Không để secret/cookie/dữ liệu thật vào báo cáo. Không chạy audit probe hiện tại có XP giả trên production.

## Asset plan

**No new assets.** Không có thay đổi hình ảnh/giao diện; không gọi image generation, không thay registry, `public/sw.js` hoặc nội dung. Nếu build tạo lại SW, giữ artifact riêng và xử lý theo baseline, không lẫn generated diff vào scope API.

## Task List

- [x] **T-1 → R1/R7:** Hoàn tất role gate Backend; đọc W01, source và audit; ghi baseline của hai file, xác định thay đổi có sẵn và DB fixture.
- [x] **T-2 → R1/R2/R3:** Trong route, thêm guard cardId hẹp và ownership trong updateMany; map count khác1 sang NotFoundError chung.
- [x] **T-3 → R4/R5:** Kiểm luồng throw thoát transaction và invalidation chỉ sau commit; giữ success/body/XP/lịch ôn ngoài scope.
- [x] **T-4 → R6:** Sửa test mocks đủ error classes; thêm positive/foreign/missing/malformed-ID/mixed-batch cases, không bỏ assertion hoạt động hợp lệ.
- [x] **T-5 → R4/R6:** Tạo/tái sử dụng dữ liệu audit gồm user A có cardA và userB có cardB; probe A gửi `[cardA,cardB]` và ghi before/after từ DB, kể cả profile/progress/activity. CardA phải rollback dù đã xử lý trước cardB.
- [x] **T-6 → R6/R7:** Chạy focused tests và gates; review diff, xuất báo cáo đúng revision, giữ residual findings mở và nêu rollback.

## Acceptance criteria / QC checklist

| Case | Expected |
|---|---|
|Chính chủ,1card|200;where có cả id vàuserId;nextReviewAt theo logic cũ;activity/invalidation đúng|
|Card của userB / ID không tồn tại|Cùng404,NOT_FOUND,Card not found; không activity/invalidation thành công|
|cardId undefined,null,number,empty,whitespace|404 chung; không gọi Prisma mutation với predicate thiếuID|
|Batch cardA hợp lệ rồi cardB trái quyền|404; DBbefore/after cardA/cardB,XP/activity/progress không đổi; không invalidate như đã lưu|
|User chỉ có1card,request thiếucardId|Không cập nhật nhầm card đó;guard chặn trước updateMany|
|Valid mixed session|Response và grammar/vocab-new behavior trong test hiện có giữ được; riêng review mutation có owner|
|Diff và scope|Chỉ hai file được giao;tmp probe/evidence được ghi riêng;TECH01/02 vẫn mở|

Lệnh focused, từ repo root:

```powershell
pnpm --filter @fuxie/web exec vitest run src/app/api/v1/session/complete/route.test.ts
pnpm typecheck
pnpm test:core
pnpm check:quick
pnpm build
```

Dùng runtime Node22/pnpm9.15.4 theo baseline CI hoặc ghi rõ khác biệt. Provision environment fixture trước các lệnh cần DB/auth; không dùng `.env` production chỉ để build thành công. Mỗi lệnh lưu thời điểm, runtime, exit code và log đúng revision. `check:quick` có thể gặp debt hiện hữu; báo FAIL/BLOCKED và phân tích regression, không tự skip hoặc nới assertion. QC có thể nhận scope nhỏ nếu focused/DBproof/type/core/build đạt và debt ngoài scope được ghi rõ; release tổng vẫn chờ gate của chiến lược.

Rollback: W01 không migration. Revert/đổi artifact theo một PR riêng sau khi xét mitigation; không rollback về route trái quyền đang mở cho người dùng mà không có biện pháp chặn tương đương. Probe fixture giữ lại evidence, không sửa/xóa dữ liệu người học.

## Antigravity prompt

```text
Vai chinh: Backend Engineer
Vai phoi hop: QA Automation Engineer, Security / Privacy Consultant

Mục tiêu: thực hiện W01 để đóng SEC-03: session completion chỉ cập nhật SRS card thuộc tài khoản đã xác thực, và batch trái quyền rollback toàn bộ. Đây là task implementation theo spec, không phải sửa toàn bộ session/XP.

Repo: C:\Users\DMF Schule\9-Fuxie. Hoàn tất AGENTS.md role gate; đọc .agents/workflows/task-role-router.md, profile Backend và support liên quan. Đọc đầy đủ docs/delivery/remediation-W01-session-ownership.md cùng docs/intake/assessment-2026-09-11/security-privacy.md. Giữ các thay đổi đang có; snapshot hiện trạng trước chỉnh. Nếu tạo nhánh dùng codex/ prefix; không lấy HEAD sạch thay working tree đang audit, không reset/stash/commit hàng loạt.

Chỉ sửa apps/web/src/app/api/v1/session/complete/route.ts và route.test.ts cùng thư mục. Đọc tham chiếu apps/web/src/lib/auth/middleware.ts, apps/web/src/lib/api/error-handler.ts, apps/web/src/app/api/v1/srs/review/route.ts và apps/web/src/lib/progress/learning-activity.ts.

Thực hiện T1–T6: guard cardId phải là string không rỗng trước Prisma; updateMany WHERE id+userId từ server; count khác1 throw NotFoundError('Card not found') ra khỏi transaction. Không catch/continue trong loop. Mocks phải export AuthError/NotFoundError để error-handler hoạt động đúng. Giữ hợp đồng body/XP/UI và không migration. Không tuyên bố TECH-01/02 đã đóng. Không chỉnh totalXp thành số đếm client.correct.

Nghiệm thu toàn bảng QC: card chính chủ thành công; foreign/missing/malformed card đều generic404; batch [cardA,cardB-của-người-khác] không để lại mutation/XP/progress/activity; invalidation chỉ sau commit. Unitmock không chứng minh rollback: chạy probe trên DBfixture riêng đã kiểm host/port/name. Tuyệt đối không chạy probe mutation trên production, không gọi provider trả phí.

Chạy focused Vitest, pnpm typecheck, pnpm test:core, pnpm check:quick và pnpm build theo spec; ghi đúng PASS/FAIL/BLOCKED cùng runtime/revision/thời điểm. Không lấy log cũ hoặc hạ gate để báo xanh. Debt ngoài scope phải tách khỏi regression.

Báo cáo: (1) commit/tree baseline và file đã sửa; (2) R1–R7 đạt/chưa đạt kèm evidence; (3) từng lệnh,exitcode,log; (4) DBbefore/after rollback proof; (5) residual TECH-01/02 và gap; (6) cách rollback; (7) đề xuất bước kế tiếp W03. Không deploy/push hay sửa nội dung trong task này.
```

## Codex prompt

None — no new assets. Bước tiếp theo sau QC W01: đưa scope ownership vào nhánh tích hợp, chuẩn bị W03 contract session/XP; giữ G1 release chưa đạt cho tới khi toàn invariant liên quan được kiểm chứng.
