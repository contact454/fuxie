Vai chinh: CTO / Tech Lead  
Vai phoi hop: Product Manager EdTech, German Academic Lead, Security / Privacy Consultant

# Ma trận40tiêu chí — 2026-09-11

40/40 tiêu chí áp dụng đã có nhận định hoặc khoảng trống cụ thể:36 có điểm,4U. Đây không phải36/40 tiêu chí PASS hoặc tỷ lệ90% sản phẩm hoàn thiện. Không tính điểm tổng.

Thang0–4 theo khung đã lập:0 chưa đáp ứng điều bắt buộc;1 có phần đáng kể còn thiếu;2 đáp ứng trường hợp chính trong phạm vi kiểm chứng;3 có edge-case/owner/regression evidence;4 duy trì chất lượng theo thời gian. U chưa đủ bằng chứng, không phải0. Trạng thái PASS/FAIL/BLOCKED/NOT_RUN nằm trong các báo cáo phép kiểm.

|ID|Tiêu chí|Điểm|Bằng chứng và quan sát|Tin cậy/phạm vi|Giới hạn cần đóng|
|---|---|---:|---|---|---|
|D01.1|Người dùng, vấn đề và phạm vi|2|[Có định vị B2C người Việt và module scope](product-ux-analytics.md)|Vừa; PRD/roadmap/source|Nghiên cứu nhu cầu người học thật chưa có|
|D01.2|Onboarding đến hành động đầu tiên|2|[Goal/level/time/save/retry và activation contract có](product-ux-analytics.md)|Vừa; Source + fixture UI|Signup Firebase và người mới đến bài hoàn chỉnh chưa đo|
|D01.3|Dashboard đề xuất bước học|1|[1mastered+5locked,0primary; course vẫn truy cập được](product-ux-analytics.md)|Cao; Source + 2 viewport audit learner|Chưa nối goal/due SRS/next node|
|D01.4|Roadmap, dependency, acceptance|2|[Có owner/acceptance; runtime lệch một số cam kết](product-ux-analytics.md)|Vừa; Tài liệu đối chiếu route active|Cần bảng trạng thái current revision|
|D02.1|Can-do và CEFR|1|[Có metadata/LO nhưng nhiều can-do chung chung](content-academic.md)|Vừa; Inventory + 180 mẫu text|Chưa có human alignment/signoff và outcome validation|
|D02.2|Ngôn ngữ Đức và hỗ trợ Việt|1|[Lỗi template, cú pháp, encoding và hướng dẫn phát âm đã thấy](content-academic.md)|Cao với ví dụ; vừa toàn kho; 180 mẫu,36 review chéo và6case rủi ro|LanguageTool full run bị chặn hạ tầng; không suy rộng tỷ lệ lỗi|
|D02.3|Đáp án, distractor và rubric|1|[Có distractor cùng đúng, evidence sai, rubric thiếu band](content-academic.md)|Cao với ví dụ; Semantic review + structural scan|Phải rà toàn nhóm template và hiệu chuẩn người duyệt|
|D02.4|Audio, bài mở và format thi|1|[Writing29/30 mẫu có vấn đề; transcript/intro lệch, audio pending](content-academic.md)|Vừa; Source/script,0audio nghe thật|Acoustic và đối chiếu format thi chính thức theo phiên bản U|
|D03.1|Nhiệm vụ mobile và desktop|2|[Navigation2/2 đạt; avatar không phản hồi](product-ux-analytics.md)|Vừa; 13fixture states; actual dashboard 2viewport|Chưa có usability completion time người học|
|D03.2|Loading, empty, error, retry, locked|1|[Shared shells có; canvasnull bỏ toàn bộ node/lesson link](product-ux-analytics.md)|Cao với canvas; Fixture + fault injection|Chưa replay mọi route/error dependency|
|D03.3|Accessibility và reflow|1|[11/13fixture cases có serious contrast; onboarding tràn390px](product-ux-analytics.md)|Cao với lỗi được đo; axe + keyboard/reduced motion/320px|Screen reader,zoom toàn diện,multibrowser U|
|D03.4|Design và gamification hỗ trợ học|2|[Shared receipt/tokens/reduced motion hiện hữu](product-ux-analytics.md)|Vừa; Source components/FSM/readout|Hiệu quả duy trì học và reward-only behavior thật U|
|D04.1|Luồng learner,teacher,admin trọng yếu|2|[Luồng mẫu và role negatives có bằng chứng thực](technical-quality.md)|Vừa; Core970,hardening5,API seed,UI probes|Chưa full Firebase/provider/classroom/thi end-to-end|
|D04.2|Submit,retry,reload,expire nhất quán|1|[Submit/reload đạt nhưng clientXP/replay nhân tiến độ](technical-quality.md)|Cao với probe; Audit DB thực|Concurrency/timezone/session expiry toàn matrix chưa chạy|
|D04.3|Empty,invalid input,wrong role,dependency error|2|[Negative time400,anonymous401; nhiều negative guards có](technical-quality.md)|Vừa; Unit/smoke/negative API|Provider outage/micdenial và toàn ownership matrix chưa đủ|
|D04.4|Test fidelity và coverage|2|[970core; property1timeout;4interaction stale,6notrun](technical-quality.md)|Cao; Kết quả chạy mới|Chưa toàn suite xanh hiện revision,active-route coverage cần sửa|
|D05.1|Tutor/chấm đúng rubric,không false correction|1|[Có triển khai,fixture5/5; speaking chưa gắn rubric4chiều](content-academic.md)|Vừa; Prompt + fixture eval|Provider corpus/gold adjudication chưa có|
|D05.2|Feedback cụ thể,đúng cấp độ và tiếng Việt|1|[Signal tự khai không chứng minh VI; mẫu writing yếu](content-academic.md)|Vừa; Prompt/fixture/source|Chưa pair feedback/revision được người duyệt đối chiếu|
|D05.3|Timeout,fallback,latency,cost AI|1|[Có timeout/fallback/queue; usage writer thiếu](technical-quality.md)|Vừa; Unit/source/cache/queue/usage reader|Latency,cost,error rate provider thực U|
|D05.4|Mic,STT,TTS,transcript và lỗi provider|U|[Đã kiểm kê source và audio status](technical-quality.md)|Thiếu bằng chứng; 0audio nghe thật; service/provider không chạy|Cần golden audio,nghe thật,mic/network/provider tests|
|D06.1|Ranh giới kiến trúc và owner|2|[Web/AI/STT/shared/SRS/DB tách package](technical-quality.md)|Vừa; Manifests/imports/system map|Owner triển khai và đường active STT cần xác nhận|
|D06.2|Type/build/contracts/runtime|2|[Runtime audit khớp majorCI; lint chưa đạt](technical-quality.md)|Cao với local; Node22 type/buildPASS|Neon adapter và deployed artifact chưa kiểm|
|D06.3|Schema,migration,relations,transaction|2|[DB mới tạo được; attempt/reward trong transaction](technical-quality.md)|Vừa; Schema push + seed + actual submit|Migration nâng cấp dữ liệu,drift,restore U|
|D06.4|SRS/progress/XP/Fucoin invariants|1|[ClientXP+12345,replay2attempt và SRSownership gap](technical-quality.md)|Cao; Audit DB + security/source tests|Cần server-scored session/idempotency,timezone/concurrency retest|
|D07.1|Auth,role và ownership|1|[Guard hữu ích nhưng AI/sync/session chưa đồng đều](security-privacy.md)|Cao với cases; vừa toàn phạm vi; Source + 7synthetic checks + smoke|Ingress và Firebase lifecycle deployment U|
|D07.2|Secrets,dependency,input/upload|1|[Secrets/envPASS;158advisory entries;missing-secret fallback](security-privacy.md)|Vừa; Current secret/env scans + registry audit|History/ignored files/upload quotas/exploitability chưa đầy đủ|
|D07.3|Data flow,retention,xóa|1|[Chatowner/softdelete,TTS7days;private PWA cache gap](security-privacy.md)|Vừa; Source/provider map/cache policy|Deletion end-to-end/provider/backup retention U|
|D07.4|Nguồn,quyền tài sản,claim,chính sách|U|[Có yêu cầu guardrail/license,thiếu hồ sơ xác nhận](security-privacy.md)|Thiếu bằng chứng; Guidance/doc review|Không suy ra vi phạm; cần chứng từ và owner chuyên môn|
|D08.1|Tải trang,tương tác,CLS,bundle|1|[17routes vượt115KB;dev5/21 vượtbudget](technical-quality.md)|Cao bundle; vừa local; Production bundle + dev HTTP|Production browser/field CWV chưa đo|
|D08.2|API/DB/AI latency và error rate|U|[21HTTP targets200,provider không chạy](technical-quality.md)|Thiếu bằng chứng tổng thể; Dev HTTP sample chỉ tham khảo|Thiếu telemetry production,p95/error rate và cache đúng|
|D08.3|Mạng chậm,timeout,retry,queue|1|[Có fallback/queue nhưng pending bị clear khi401/500](technical-quality.md)|Vừa; Source/unit/offline synthetic|Latent helper chưa có UIcaller; Slow4G/provider matrix chưa chạy|
|D08.4|PWA,resume và dữ liệu đúng account|1|[GETauthme/chathistory matchcachechung](security-privacy.md)|Cao policy; vừa impact; Installed cache policy test|Chưa browser replayA→Boffline; cần NetworkOnly/partition+purge|
|D09.1|Tái lập môi trường/dependencies|2|[Node22/pnpm lock + audit môi trường mới đạt](operations.md)|Vừa; CI/manifests + local build/seed|AI Docker runtime tsx candidate chưa build để xác nhận|
|D09.2|CI gates/skip/evidence|1|[Có gates;fail quick kéo skipped;lint/bundle gaps](operations.md)|Cao config; vừa current CI; Workflow + gh historical reads|HEAD3217ea0 chưa có run; lịch sử không thay current evidence|
|D09.3|Deploy,rollback,backup,incident|1|[Có runbook và owner theo vai;deploy/restore evidence thiếu](operations.md)|Vừa; Runbooks/config|Chưa diễn tập RPO/RTO,rollback current build hoặc production restore|
|D09.4|Backlog,tài liệu,truy vết thay đổi|2|[Role gate,roadmap,baseline và artifact cụ thể](operations.md)|Vừa; Git+docs+snapshot|Dirty tree không phải lỗi; cần release manifest/tag/owner acceptance|
|D10.1|Metric definition/window/cohort/dedup|1|[Weekly bất kỳ range,D7/cohort maturity và unit lệch](product-ux-analytics.md)|Cao; 6synthetic reproduction|Không dùng readout hiện tại làm số liệu tăng trưởng|
|D10.2|UI→event→readout,loại test/trùng|1|[Dashboardclick thiếu;SRS/session actionId gộp sai](product-ux-analytics.md)|Cao; Source + UIevent paths|Chưa đối soát real events/test-account exclusion|
|D10.3|Activation,retention,recall,transfer|U|[Không có cohort thật đủ tuổi hoặc paired learning study](product-ux-analytics.md)|Thiếu bằng chứng; Beta docs waiting,N/A|Không gọi completion/XP là tăngCEFR|
|D10.4|Chi phí,doanh thu,khả thi vận hành|1|[Có estimate nhưng thiếuwriter usage,denominator thật](product-ux-analytics.md)|Vừa; Costreader/schema/budgetdocs|Invoices/revenue/support workload/active learner U|

[CSV](criteria.csv) và [JSON](criteria.json) dùng cùng40bản ghi. Bước tiếp theo: owner đóng các gap bằng bằng chứng đúng revision rồi cập nhật từng tiêu chí; không nâng điểm chỉ vì bổ sung tài liệu hoặc testfile.
