Vai chinh: Project Manager / Delivery Manager  
Vai phoi hop: CTO / Tech Lead, German Academic Lead, Security / Privacy Consultant

# Bảng triển khai phục hồi chất lượng Fuxie

Nguồn: [chiến lược](../intake/implementation-strategy-2026-09-11.md), [audit và backlog A01–A17](../intake/assessment-2026-09-11/prioritized-backlog.md). Cập nhật ngày11/09/2026 sau đợt W00/W01 đầu tiên; [hồ sơ thực thi/QC](remediation-W01-verification-2026-09-11.md). Trạng thái code, chuẩn bị spec và chọn nội dung được ghi theo đúng phạm vi; chưa có deployment.

`READY`: đã đủ đầu vào cho phạm vi ghi rõ. `SPEC_NEEDED`: cần gói requirement/design/acceptance trước code. `WAITING_GATE`: có dependency chưa đạt. `AWAITING_HUMAN`: đang thiếu xác nhận chuyên môn. Khi thực thi dùng `IN_PROGRESS → IN_QC → ACCEPTED`, hoặc `BLOCKED` kèm nguyên nhân và next action. Không dùng DONE cho báo cáo của executor chưa QC.

| Gói | Mapping | Owner chịu trách nhiệm | Kết quả cần có | Dependency bắt buộc | Trạng thái hiện tại |
|---|---|---|---|---|---|
|W00 Snapshot và điều phối|A09/A14|Codex root / Delivery,CTO|Manifest code/content, phạm vi từng PR, file ownership, môi trường thử, danh mục gate đúngrevision|Không|ACCEPTED_FOR_SCOPE đợt W01: 5.831 file/hash, giữ nhánh/tree hiện có; snapshot mới đã ghi|
|W01 Session SRS ownership|A02,SEC03|Codex root Backend / Security,QA agents|Card phải thuộc user từ server; batch trái quyền rollback; không sửa XP contract|W00 xác nhận baseline khi bắt đầu|ACCEPTED_FOR_SCOPE local: 20 unit + 19 HTTP/DB cases; type/core/build/check:quick PASS, có log timeout lượt đầu. [QC](remediation-W01-verification-2026-09-11.md); chưa deploy|
|W02 Các quyền còn thiếu|A02/A06,SEC01/02/04|Backend / Security,DevOps|Tách PR sync admin, cron fail-closed, AI HTTP/job owner; gọi đúng actor mới tới sink|W00; riêng AI cần xác minh caller/ingress để chọn auth|SPEC_NEEDED từng PR; không chờ AI để sửa web|
|W03 Hợp đồng session và XP|A03,TECH01|CTO / Backend,Frontend,QA|Server-issued ID + answer contract + server grading; empty/forged không được thưởng; UI giữ lỗi/retry|W01 local QC đã đạt; một writer session files; policy/catalog còn cần chốt|PREPARED, chưa implementation-ready — [contract và D1–D6](remediation-W03-session-contract.md); chưa sửa XP|
|W04 Replay reading/listening|A03,TECH02|Backend / QA,Analytics|Một logical attempt chỉ có một receipt/reward/event; retry khác deliberate new attempt|Contract ID và semantics ở W03; có thể tái sử dụng thiết kế, không phải chờ mọi UI session|SPEC_NEEDED; hai skill có thể thành hai PR|
|W05 Dependency và runtime|A04/A14|DevOps / Full-stack,CTO,QA|Bản vá phù hợp advisory tại thời điểm làm; image/runtime khởi động; manifest/lockfile thuộc một owner|W00; container startup candidate phải tái hiện trước sửa|SPEC_NEEDED; patch package và Docker là PR riêng|
|W06 Phục hồi nội dung A1|A01|German Academic Lead / Content QA,Content Engineer|Manifest bài thật, sửa template, review người và audio/source–DB–UI parity; batch trạng thái rõ|Import dùng đường an toàn từ W02; human reviewer cho release; mapping cần xác minh|H0 selection COMPLETE: [12 ứng viên](../content-quality/a1-pilot-r1/selection.md), 194 tham chiếu/hash; H1/H2 chưa bắt đầu, HG0–HG5 chưa nghiệm thu, human/audio/live parity chưa có|
|W07 Dashboard và UX active|A05/A08|PM / Designer,Frontend,QA|Spec F/G cập nhật theo map active; một next-action, fallback/keyboard/avatar/contrast/reflow|Spec song song; nhãn/priority do PM chốt; acceptance progress sau W03/W04; contentpilot theo W06|SPEC_NEEDED; tách action wiring và token/reflow|
|W08 Metric và events|A07|Analytics / PM,Backend,QA|Metric version/window/cohort/exclusions; UI→attempt→event→readout khớp; không gộp SRS cards thành sessions sai|Definitions ngay; writer sau contract W03/W04 và action W07|SPEC_NEEDED; spec trước writer/readout|
|W09 AI/speech và usage|A11/A12|AI/Speech / Academic,Analytics,Security|Gold references/rubric, audio thực, provider failure/retry, usage/cost; đúng chức năng thuộc pilot|W06 có reference; credentials/testbudget/retention được xác định khi chạy provider|SPEC_NEEDED; fixture chỉ là contract evidence|
|W10 Cache/gates/perf/ops|A06/A09/A10/A13/A14/A15|CTO điều phối / Frontend,QA,DevOps,Security|PR riêng cho PWA; tests active; gate mới; productionperf; rollback/restore/data handling. Offlinequeue chỉ triển khai nếu cần bật|PWA privacy làm sớm; offlinequeue sau W03/W04; integrated release sau W01–W09 theo phạm vi|SPEC_NEEDED; không phải một PR khổng lồ|
|W11 Pilot A1|A16|PM / Academic,Analytics,Customer Success|Roster/quan sát/support,pairedretry/recall,cohort và chi phí đúng; continue/hold có căn cứ|G0–G5 cho catalog/chức năng đã chốt; reviewer và owner vận hành thực|WAITING_GATE; chưa tuyển/gửi tin hay triển khai|
|W12 Mở rộng có căn cứ|A17/phần A01 còn lại|PM / Academic,Finance,CTO|Quyết định tập A2 rồi cấp sau, capacity và economics; cùng quy trình review|W11 có evidence đủ cho quyết định cụ thể; D30 chỉ khi cohort đủtuổi|WAITING_GATE; không cam kết mở hết A1–C2 theo lịch cứng|

Các owner là vai trò; Delivery phải gắn người/tác tử thực lúc kéo gói vào IN_PROGRESS. W02/W10 là nhóm điều phối chứa các PR độc lập, không cho executor sửa tất cả một lượt. W03 không được coi ACCEPTED nếu chỉ cap totalXp hoặc đếm `correct` do client gửi. W06 không được coi ACCEPTED nếu chỉ schema QA hoặc metadata aligned.

## Khóa file và thứ tự tích hợp

| Vùng dùng chung | Quy tắc |
|---|---|
|Session complete + route.test|W01 tích hợp trước W03; một executor ghi tại một thời điểm|
|Session types/builder/start/player|W03 giữ contract; UI error/retry đi cùng thay đổi API|
|Schema/attempt/ledger/learning-activity/events|Backend owner điều phối W03/W04/W08; Analytics review contract trước writer|
|Manifests/pnpm-lock/generated client|W05 hoặc integrator ghi; gói khác chỉ yêu cầu thay đổi, không tự regenerate đồng thời|
|sw.ts/public/sw.js/cache lifecycle|Một owner cho PWA privacy và offline; build artifact theo policy, không lẫn vào PR khác|
|WorldMapDashboardClient/today-plan/tokens|W07 chia concern; update spec cũ theo active route, không sửa dashboard legacy chỉ vì spec ghi tên đó|
|Content JSON/audio/seed|W06 sửa theo manifest/batch; importer không reset lịch sử attempt; signoff gắn hash|

## Mẫu ghi cho mỗi lần thực thi

```text
Work package / PR:
Owner / QC reviewer:
Starting commit + working-tree/content hashes:
Files allowed / files actually changed:
Requirement -> evidence -> PASS / FAIL / BLOCKED / NOT_RUN:
Command / runtime / timestamp / exit code / artifact path:
DB/content change and rollback/compatibility evidence:
Known residual findings (IDs):
Next action / owner / dependency:
QC verdict: ACCEPTED_FOR_SCOPE / CHANGES_REQUIRED / BLOCKED
```

Không chuyển status dựa vào log cache khác revision, testfile tồn tại hoặc ảnh cũ. Với baseline fail ngoài phạm vi, ghi nguyên trạng và đánh giá regression; có thể review một scope nhỏ, nhưng release tổng không tự xanh. Kiểm tra toàn repo một lần trên candidate tích hợp, chạy lại khi thay đổi/failure cần thiết; không lặp các gate nặng sau từng chỉnh tài liệu.

**Bước tiếp theo:** chốt W03 T0/D1–D6 trên bản W01 đã QC để triển khai server grading/receipt; Backend đóng mapping của 12 ứng viên A1, Academic chuẩn bị H1/H2 và human review. Không thực thi lại W01 từ prompt cũ hoặc tuyên bố toàn W06 đã hoàn tất.
