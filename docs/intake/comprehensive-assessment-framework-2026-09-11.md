Vai chinh: CTO / Tech Lead  
Vai phoi hop: Product Manager EdTech, German Academic Lead, Security / Privacy Consultant

# Khung đánh giá toàn diện Fuxie

Ngày lập: 2026-09-11. Mục tiêu được người dùng xác nhận: **đánh giá hiện trạng toàn diện và ưu tiên việc tiếp theo**.

Đây là khung chuẩn bị đánh giá. Chưa chạy bộ kiểm thử, scanner, đánh giá UI, provider AI hoặc chấm điểm hiện trạng trong bước này. Những thông tin về công cụ bên dưới được xác minh bằng manifest, cấu hình, tài liệu và kiểm tra phiên bản CLI.

## 1. Quyết định mà báo cáo cần hỗ trợ

- Fuxie đã làm tốt việc gì, phục vụ ai, và điều gì cần được giữ lại?
- Phần nào đã xây dựng, phần nào đã kiểm chứng vận hành, phần nào có bằng chứng giá trị với người học?
- Rủi ro hoặc khoảng trống nào ảnh hưởng lớn nhất tới học tập, dữ liệu, trải nghiệm và khả năng phát triển?
- Nên làm gì trước, làm gì sau, việc gì nên hoãn; mỗi việc có người chịu trách nhiệm và điều kiện hoàn thành nào?

Phạm vi gồm learner, teacher, admin; nội dung tiếng Đức; AI/audio; ứng dụng và dịch vụ; dữ liệu; bảo mật; vận hành; analytics và tính khả thi kinh doanh. Ưu tiên hành trình người Việt tự học tiếng Đức theo tài liệu định vị hiện có. Các tính năng hoặc cấp độ được hoạch định nhưng chưa cam kết phải được phân loại rõ, không tự coi là lỗi triển khai.

CTO chịu trách nhiệm tổng hợp kỹ thuật và thứ tự phụ thuộc. Product Manager phụ trách giá trị và ưu tiên sản phẩm; Academic Lead phụ trách tiêu chuẩn học thuật; Security / Privacy phụ trách rủi ro dữ liệu. Kết luận pháp lý, ngân sách hoặc xác nhận học thuật của con người phải có bằng chứng từ người chịu trách nhiệm tương ứng; ý kiến của tác tử AI không thay thế xác nhận đó.

## 2. Mười trục đánh giá

Mỗi mục đánh số trong ô tiêu chí là một tiêu chí độc lập, có ID dạng D01.1. Các ngưỡng đã được duyệt trong spec được ghi lại trước khi chạy; ngưỡng bổ sung được ghi rõ là đề xuất.

| ID | Trục | Tiêu chí và cách đo | Bằng chứng chính |
| --- | --- | --- | --- |
| D01 | Sản phẩm và định hướng | 1. Người dùng, vấn đề, kết quả mong muốn và phạm vi cam kết của từng module rõ ràng. 2. Luồng onboarding đến hành động học đầu tiên có điều kiện hoàn thành. 3. Dashboard chỉ ra bước học tiếp theo phù hợp trình độ/mục tiêu. 4. Roadmap liên kết nhu cầu với ưu tiên, phụ thuộc và acceptance criteria. | PRD, roadmap, ma trận tính năng, walkthrough, funnel activation và phản hồi người học nếu có. |
| D02 | Học thuật và nội dung | 1. Mục tiêu can-do và lộ trình được đối chiếu CEFR. 2. Tiếng Đức, ví dụ và giải thích Việt–Đức đúng, tự nhiên, phù hợp người học. 3. Đáp án, biến thể được chấp nhận, distractor và rubric công bằng. 4. Audio/transcript, bài nói/viết và format từng kỳ thi khớp mục tiêu. Đo lỗi trên số đơn vị được duyệt và coverage theo cấp độ/kỹ năng. | Content inventory, QA cấu trúc, mẫu duyệt sâu, audio thực, rubric, descriptor và tài liệu đúng hãng thi/cấp độ/phiên bản. |
| D03 | UX, hình ảnh, khả năng tiếp cận và gamification | 1. Hoàn thành nhiệm vụ trên mobile/desktop: tỷ lệ thành công, số lỗi, thời gian. 2. Loading, empty, error, retry, locked và success có hướng dẫn rõ. 3. Bàn phím, focus, tương phản, zoom/reflow, audio controls và reduced motion dùng được. 4. Design system/mascot/reward nhất quán, giúp hiểu bài và duy trì việc học; kiểm tra reward-only engagement. | Browser walkthrough, screenshot và trace, axe-core, kiểm tra thủ công, phiên usability nếu có người học. |
| D04 | Chức năng và chất lượng kiểm thử | 1. Luồng học và tác vụ teacher/admin trọng yếu chạy trọn vẹn. 2. Kết quả/tiến độ nhất quán khi submit, retry, reload, hết phiên. 3. Trường hợp rỗng, sai đầu vào, quyền sai và dịch vụ lỗi được xử lý. 4. Bộ test thực sự thực thi yêu cầu: số pass/fail/skip, phạm vi mock, test rỗng, độ ổn định và khoảng trống coverage. | Test inventory, Vitest, fast-check, Playwright, assertion, trace, đối chiếu UI/API/dữ liệu thử nghiệm. |
| D05 | AI và speech/audio | 1. Tutor và chấm bài đúng rubric, không sửa câu đúng thành sai. 2. Phản hồi cụ thể, hữu ích, phù hợp trình độ và tiếng Việt. 3. Độ ổn định, timeout/fallback, độ trễ và chi phí mỗi tác vụ đo được. 4. Microphone, STT/TTS, transcript và audio có chất lượng kiểm chứng; hành vi khi provider lỗi rõ ràng. | Eval fixtures đúng/sai/giáp ranh, reviewer reference, chạy lặp trên tập con, nghe audio, provider logs đã lọc dữ liệu nhạy cảm. |
| D06 | Kiến trúc, mã nguồn và tính đúng của dữ liệu | 1. Ranh giới web/AI/STT/shared rõ, phụ thuộc hợp lý, module có owner. 2. Typecheck/build/API contracts và cấu hình nhất quán với runtime mục tiêu. 3. Schema/migration, quan hệ dữ liệu và transaction đáp ứng invariant. 4. SRS/progress/XP/Fucoin không cộng trùng, mất tiến độ hoặc sai lịch ở retry/concurrency/múi giờ. | Git, rg, manifests, dependency graph, schema/migration review, test invariant và truy vấn chỉ đọc trên dữ liệu được phép. |
| D07 | Bảo mật, quyền riêng tư và nguồn gốc tài sản | 1. Auth/session, phân quyền learner/teacher/admin và ownership tại API được xác minh. 2. Secrets, dependency và bề mặt đầu vào/upload có kiểm soát. 3. Dữ liệu bài làm/audio/chat có luồng provider, thời hạn lưu, quyền truy cập/xóa rõ. 4. Nguồn và quyền sử dụng nội dung/media, tuyên bố sản phẩm và chính sách có bằng chứng phù hợp phạm vi sử dụng. | Review theo ASVS, ma trận quyền và negative tests, secret/dependency scan, data-flow map, cấu hình và hồ sơ nguồn/license/chính sách. |
| D08 | Hiệu năng và độ tin cậy | 1. Đo tải trang, phản hồi thao tác, layout shift và bundle/asset theo budget. 2. API/DB/AI có độ trễ và tỷ lệ lỗi theo loại tác vụ. 3. Mạng chậm, provider gián đoạn, timeout/retry/caching/queue có hành vi kiểm chứng. 4. PWA/service worker và resume không phục vụ dữ liệu/kết quả cũ sai tài khoản. | Playwright perf, perf-local, bundle budgets, network trace, logs/metrics nếu có; đo lab và dữ liệu người dùng thật riêng. |
| D09 | Vận hành và khả năng bàn giao | 1. Môi trường và dependency có thể tái lập. 2. CI chạy đúng gate, nhận diện skip/continue-on-error và bằng chứng cũ. 3. Deploy/rollback, backup/restore và xử lý sự cố có owner, runbook, bằng chứng diễn tập phù hợp. 4. Backlog, tài liệu, quyết định kỹ thuật và thay đổi chưa commit có thể truy vết. | Workflow CI, lockfile, cấu hình môi trường, runbook, artifact CI/deploy, lịch sử thay đổi, bằng chứng restore trên môi trường thử. |
| D10 | Analytics, hiệu quả học và kinh tế vận hành | 1. Metric có tử số/mẫu số, cohort, múi giờ, cửa sổ và dedup rõ. 2. Đối soát UI → event → readout; loại tài khoản test và dữ liệu trùng. 3. Activation/retention, sửa bài sau feedback, ghi nhớ và chuyển giao được đo đúng mức bằng chứng. 4. Chi phí AI/hạ tầng trên người học hoạt động, tải hỗ trợ, doanh thu/chuyển đổi nếu có và giả định kinh doanh được tách rõ. | Event map, truy vấn chỉ đọc, cohort đủ tuổi, dữ liệu giả danh, pilot, learner work đã ẩn danh, readout chi phí và giả định ngân sách. |

## 3. Cách chấm và ghi nhận bằng chứng

Chấm **từng tiêu chí từ 0 đến 4**, kèm mô tả thực tế; không dùng số lượng file, dòng code hoặc số tính năng làm điểm chất lượng.

| Điểm | Ý nghĩa |
| --- | --- |
| 0 | Có bằng chứng tiêu chí bắt buộc chưa được đáp ứng hoặc hành vi cốt lõi bị hỏng. |
| 1 | Đã có một phần, còn thiếu đáng kể hoặc chủ yếu là bản thử nghiệm. |
| 2 | Đáp ứng trường hợp chính trong phạm vi đã kiểm chứng; còn giới hạn được nêu rõ. |
| 3 | Đáp ứng cả tình huống quan trọng và trường hợp lỗi; có bằng chứng tái lập, owner và kiểm soát hồi quy phù hợp. |
| 4 | Đáp ứng mức 3 và có bằng chứng duy trì chất lượng/kết quả theo thời gian trong môi trường sử dụng phù hợp tiêu chí. |
| U | Chưa đủ bằng chứng; không quy thành điểm 0. |
| N/A | Không áp dụng trong phạm vi cam kết; phải ghi lý do. |

Điểm là thang trưởng thành nội bộ của đợt đánh giá, không phải chứng nhận bên ngoài. Báo cáo chính giữ điểm từng tiêu chí, phân bố theo trục và coverage: số tiêu chí đã kiểm chứng / số tiêu chí áp dụng. Không gộp thành một điểm tổng dự án làm che khuất phần chưa kiểm chứng hoặc lỗi nghiêm trọng.

Mỗi phép kiểm tra có trạng thái riêng: PASS, FAIL, BLOCKED, NOT_RUN hoặc N/A. BLOCKED phải nêu điều kiện thiếu; một kiểm tra bị chặn không chứng minh sản phẩm bị lỗi. Một test PASS chỉ chứng minh các assertion thực sự đã chạy.

Mỗi nhận định gắn nhãn: **đã xác nhận**, **suy luận cần kiểm chứng**, hoặc **thiếu bằng chứng**. Mức tin cậy cao khi tái lập trên snapshot rõ và có bằng chứng trực tiếp; vừa khi dựa trên đọc code hoặc mẫu hẹp; thấp khi chủ yếu dựa vào tài liệu/giả định. Kết quả cũ không tự chuyển thành kết quả hiện tại.

Mẫu bản ghi:

`finding_id | criterion_id | scope/environment | commit + file/content hash | observed_at | expected | actual | evidence/command | result | maturity_score | confidence | impact | severity | owner | next_action | effort_range | dependency | acceptance/retest`

Không đưa secret, cookie phiên, bản ghi âm, chat hoặc bài làm có thông tin cá nhân vào báo cáo. Bằng chứng chia sẻ dùng dữ liệu tổng hợp hoặc đã ẩn danh.

## 4. Công cụ được chọn và tình trạng sẵn có

Thông tin quan sát trong bước chuẩn bị: HEAD `3217ea052`; working tree có nhiều thay đổi tracked/untracked. Đây chưa phải snapshot đầy đủ của phiên bản sẽ được audit. Git, rg, Node, pnpm, Docker CLI và gh có trên PATH. Node tại máy là `v25.9.0`, pnpm là `9.15.4`; CI khai báo Node 22. Khi đánh giá phải dùng runtime phù hợp CI hoặc ghi rõ khác biệt; chưa kết luận khác biệt này là lỗi sản phẩm.

| Mục đích | Công cụ/lệnh đã xác nhận | Cách sử dụng và giới hạn |
| --- | --- | --- |
| Chốt phiên bản và đọc hệ thống | Git, rg, PowerShell, manifests, pnpm/Turbo | Ghi commit, danh sách thay đổi, hash phần source/content được kiểm tra. Đọc code, cấu hình và tài liệu để lập bản đồ hệ thống. |
| Kỹ thuật và test | `pnpm typecheck`, `pnpm test:core`, `pnpm test:property`, `pnpm build` | Các script có trong package.json; chưa chạy ở bước chuẩn bị. Ghi số test thực thi/skip; không coi `--passWithNoTests` là coverage. Đọc tác dụng phụ trước khi chạy build/generator. |
| Luồng thật và UI | Playwright, `pnpm test:integration`, `pnpm test:integration:capture`; browser automation khi cần khám phá | Manifest/cấu hình có sẵn; chưa xác nhận browser binaries, tài khoản hoặc dịch vụ đã sẵn sàng. Fixtures/dev-auth kiểm chứng hành vi trong môi trường thử; không chứng minh production auth hoạt động. |
| Accessibility và giao diện | axe-core, `pnpm check:visual-audit`, `pnpm check:locale-parity`, `pnpm check:state-shell-coverage`, các asset checks | Có sẵn. Bổ sung xem ảnh/UI và kiểm tra bàn phím thực. Kiểm tra đủ file screenshot không chứng minh giao diện đạt; axe trong JSDOM không đại diện toàn bộ route thật. |
| Nội dung | `pnpm qa:content`, `pnpm qa:german-lint`, checklist CEFR/Việt–Đức và review board | Có script và tài liệu; dịch vụ ngôn ngữ cần được kiểm tra riêng. Quét cấu trúc toàn kho, thẩm định sâu có lấy mẫu; lint không thay người duyệt ngôn ngữ. |
| AI/audio | `pnpm eval:ai`, `pnpm eval:ai:readout`, các academic review/signoff scripts | Tách fixtures/mock khỏi provider thật; ghi model, prompt, thời điểm, cấu hình, tập mẫu và chi phí. Script tạo review pack không phải xác nhận học thuật của con người. |
| Bảo mật | `pnpm security:secrets`, `pnpm env:audit`; review code/ASVS và kiểm tra quyền | Có script; xem phạm vi và cách che dữ liệu trước khi chạy. Bổ sung `pnpm audit` cho dependencies, xác minh advisory và đường khai thác phù hợp trước khi xếp severity. |
| Hiệu năng | `pnpm perf:local`, `pnpm test:integration:perf`, `pnpm bundle:budget` | Có script/config; đo trong điều kiện tái lập. Báo cáo riêng dev và production build, cold/warm, lab và field. |
| Dữ liệu và vận hành | Prisma/schema review, PostgreSQL truy vấn chỉ đọc, `pnpm env:audit:services`, `pnpm smoke:full-local`, GitHub CLI/CI artifacts | Khả năng kết nối, quyền tài khoản, dữ liệu fixture, Docker daemon và log production chưa được xác minh. Đọc script trước khi chạy; smoke/test có thể tạo dữ liệu. |
| Khoảng trống chuyên dụng | Gitleaks để bổ sung phạm vi Git history; công cụ scan chuyên sâu chỉ khi cần | Chưa thấy Gitleaks/Semgrep trên PATH; không coi là đã cài hoặc đã chạy. Chọn thêm sau khi biết khoảng trống của bộ kiểm tra hiện có. Không cần cài plugin mới để bắt đầu đánh giá repo/local. |

Nguồn inventory: [package.json](../../package.json), [web manifest](../../apps/web/package.json), [AI manifest](../../apps/ai-service/package.json), [CI](../../.github/workflows/ci.yml), [Playwright config](../../tests/integration/playwright.config.ts), [integration README](../../tests/integration/README.md), [property config](../../vitest.property.config.ts).

## 5. Chuẩn đối chiếu và ngưỡng

- **Học thuật:** dùng can-do descriptors của [Council of Europe, CEFR Companion Volume 2020](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors). Các claim Goethe/telc/ÖSD phải đối chiếu tài liệu chính thức đúng bài thi và phiên bản khi audit.
- **Accessibility:** dùng các tiêu chí áp dụng ở mức AA của [WCAG 2.2](https://www.w3.org/TR/WCAG22/), kết hợp kiểm tra tự động và thủ công. Không tự tuyên bố đạt WCAG chỉ từ một lần chạy axe.
- **Security:** dùng [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS) để tạo ma trận yêu cầu áp dụng, gồm auth, access control, đầu vào, dữ liệu, API và cấu hình. Ghi requirement ID cùng phiên bản; không coi đánh giá này là chứng nhận toàn bộ tiêu chuẩn.
- **Hiệu năng:** tham chiếu [Core Web Vitals](https://web.dev/articles/vitals): LCP ≤ 2,5 giây, INP ≤ 200 ms, CLS ≤ 0,1 tại phân vị 75 của dữ liệu người dùng thật, tách mobile/desktop. Chưa có field data thì ghi chưa kiểm chứng field performance. Giữ riêng budget nội bộ của Playwright hiện có: CLS ≤ 0,05 qua 3 lượt và nhóm asset quy định ≤ 350 KB trên viewport 390×844/Slow 4G; đây không phải budget toàn trang.
- **Sản phẩm/kinh doanh:** ngưỡng activation, retention, chi phí và thành công usability phải truy về spec hoặc được ghi là mục tiêu đề xuất. Chỉ số ≥3 meaningful actions/7 ngày trong tài liệu hiện có là proxy, không chứng minh tăng trình độ CEFR. Retention theo cửa sổ ngày 1–7/1–30 phải được phân biệt với quay lại đúng ngày 7/30.

## 6. Phạm vi kiểm tra và lấy mẫu

**Hệ thống:** kiểm kê toàn bộ module, route/API, vai trò, test suite, nguồn content và dịch vụ phụ thuộc; đánh dấu từng mục là planned, implemented, runtime-verified hoặc outcome-validated. Coverage kiểm kê toàn hệ thống không đồng nghĩa mọi nhánh code đã được kiểm thử.

**Hành trình:** người mới → onboarding/placement → dashboard → bài phù hợp → feedback/reward → bước tiếp theo; người quay lại → SRS → lưu tiến độ; vocabulary/grammar/reading/listening → trả lời đúng/sai → thử lại; writing/speaking → feedback → sửa bài; luyện thi → kết quả; quest/reward → claim; teacher và admin thực hiện tác vụ thiết yếu. Thêm double-submit, reload, đổi ngày/múi giờ, hết phiên, mất mạng, provider lỗi và từ chối microphone. Ma trận phân quyền bao gồm chưa đăng nhập, learner, teacher, admin và truy cập dữ liệu của tài khoản khác.

**Nội dung:** quét cấu trúc toàn bộ inventory; đối chiếu content trong repo với content thực sự phục vụ. Lấy mẫu ngẫu nhiên có seed 5 đơn vị mỗi ô tồn tại trong A1–C2 × 6 kỹ năng, tối đa 180 đơn vị cơ sở. Mỗi đơn vị bao gồm ngữ cảnh, câu hỏi, đáp án, feedback và audio liên quan. Bổ sung tầng loại bài, format thi, nguồn sinh và trạng thái duyệt. Đây là mức bao phủ ban đầu, chưa đủ để suy rộng tỷ lệ lỗi cho toàn kho.

Lấy mẫu rủi ro riêng cho nội dung mới sửa, bất đồng cũ, template sinh hàng loạt, bài mở và kỳ thi; không gộp tỷ lệ lỗi mẫu này với mẫu ngẫu nhiên. Hai reviewer độc lập xem tối thiểu 20% mẫu và toàn bộ blocker/bất đồng; ghi rõ reviewer là tác tử hay người có chuyên môn. Nếu chưa có người thẩm định, trạng thái human signoff là U. Lỗi có quy luật kích hoạt mở rộng sang toàn bộ nhóm template/nguồn liên quan.

**AI:** bộ chuẩn có đáp án đúng, sai, giáp ranh, nhiều cách diễn đạt và đầu vào nhiễu; có reference/rubric được duyệt. Đo false correction, lỗi bỏ sót, độ đúng rubric, độ hữu ích và độ ổn định trên các lượt lặp. Mock chứng minh hợp đồng kỹ thuật; provider thật mới cung cấp bằng chứng hành vi model. Không dùng AI làm người chứng nhận duy nhất cho chính phản hồi của AI.

**Người dùng/kinh doanh:** nếu thiếu cohort, chi phí hoặc nghiên cứu người dùng thật thì ghi rõ U và đề xuất phép đo tiếp theo. Code và screenshot không chứng minh product-market fit, retention hoặc hiệu quả học tập. Dữ liệu nghiên cứu nhỏ phải công bố số mẫu và giới hạn suy rộng.

## 7. Trình tự thực hiện sau bước chuẩn bị

1. **Chốt baseline:** ghi commit, lockfile/runtime, hash source/content liên quan, trạng thái working tree và môi trường. Giữ đầy đủ thay đổi đang có; dùng bản sao kiểm thử khi build/test có thể ghi đè artifact. Một worktree chỉ từ HEAD không chứa các sửa đổi chưa commit nên không tự đại diện hiện trạng này.
2. **Lập ma trận bằng chứng:** inventory toàn hệ thống, tiêu chí áp dụng, test hiện có, tài liệu cũ, dữ liệu còn thiếu, dependencies và nguồn chuẩn. Kiểm tra tác dụng phụ của script trước khi thực thi.
3. **Thu thập baseline kỹ thuật:** typecheck, test phù hợp, content checks, security checks và build theo prerequisites. Log riêng mỗi lệnh, exit code, test count/skip và artifact của lần chạy. Không lặp test không cần thiết khi đã có kết quả rõ.
4. **Kiểm chứng chuyên sâu:** UX/E2E, dữ liệu/quyền truy cập, content review, AI/audio, hiệu năng và vận hành. Chạy song song các phần độc lập; đo hiệu năng tránh tranh chấp tài nguyên. Dùng tài khoản và dữ liệu thử nghiệm cho hành động có ghi dữ liệu.
5. **Tổng hợp và phản biện:** xác minh lại finding nghiêm trọng, gộp nguyên nhân chung, phân biệt lỗi sản phẩm với lỗi môi trường hoặc công cụ. Tách yêu cầu chưa triển khai khỏi tính năng ngoài phạm vi.
6. **Ưu tiên hành động:** tạo backlog có owner, chi phí tương đối, phụ thuộc và điều kiện kiểm chứng; đề xuất thứ tự cho 2 tuần đầu và hướng 30/60/90 ngày. Đây là thứ tự đề xuất, không phải cam kết lịch giao hàng khi chưa có capacity.

Trong bước đánh giá, không trộn việc sửa sản phẩm vào bằng chứng hiện trạng. Khi chuyển sang khắc phục sẽ giữ baseline trước sửa, ghi phạm vi thay đổi và đường kiểm chứng/khôi phục tương ứng. Không thực hiện migrate/seed hoặc bài thử ghi dữ liệu trên production chỉ vì tên script có chữ smoke.

## 8. Xếp mức nghiêm trọng và ưu tiên

| Mức | Điều kiện dựa trên bằng chứng | Cách xử lý |
| --- | --- | --- |
| P0 | Lộ dữ liệu/vượt quyền nghiêm trọng, mất hoặc hỏng dữ liệu, gián đoạn diện rộng đã xác nhận. | Ưu tiên kiểm soát tác động và khắc phục ngay trước công việc mở rộng. |
| P1 | Luồng học cốt lõi không hoàn thành, chấm sai/feedback sai có tính hệ thống, lỗi nghiêm trọng với nhóm người dùng mục tiêu. | Xử lý trong nhóm ưu tiên đầu; ghi rõ phạm vi chịu ảnh hưởng. |
| P2 | Lỗi có cách đi vòng, hạn chế trải nghiệm/hiệu năng/khả năng bảo trì với tác động rõ. | Xếp theo tác động người học, tần suất, phạm vi, độ tin cậy, effort và phụ thuộc. |
| P3 | Cải thiện nhỏ, polish hoặc tối ưu có lợi nhưng chưa gây cản trở đáng kể. | Làm sau các phụ thuộc và rủi ro lớn hơn. |

Không tự gán P0/P1 cho dirty working tree, việc thiếu tài liệu, hoặc thiếu quyền chạy test. Chưa có bằng chứng được đưa vào danh sách cần kiểm chứng, có mức khẩn cấp thu thập bằng chứng riêng. Lỗi học thuật nghiêm trọng có thể chặn sử dụng module/content liên quan dù các trục khác tốt; không lấy điểm trung bình để bỏ qua.

Trong cùng mức, ưu tiên việc giảm rủi ro hoặc cải thiện kết quả học rõ nhất; xử lý phụ thuộc mở đường cho các việc khác trước. Ước lượng S/M/L đi kèm giả định, sau đó owner chuyển thành effort range. Các giả định kinh doanh chưa chắc chắn trở thành đề xuất thí nghiệm có điều kiện thành công/thất bại.

## 9. Bộ đầu ra của đợt đánh giá

- Báo cáo hiện trạng: điểm mạnh cần giữ, giới hạn, bằng chứng, rủi ro và kết luận theo 10 trục.
- Ma trận coverage: đã xây dựng / đã kiểm chứng / có bằng chứng giá trị; tiêu chí U/BLOCKED rõ điều kiện thiếu.
- Bản đồ hệ thống và hành trình trọng yếu, kèm dependency/ownership.
- Danh sách finding đã xác nhận và giả thuyết cần kiểm chứng, với nguồn tái lập.
- Backlog ưu tiên: sửa ngay, làm tiếp, cần nghiên cứu, nên hoãn; owner, effort, phụ thuộc, acceptance và phép retest.
- Đề xuất thứ tự 2 tuần đầu và hướng 30/60/90 ngày, gắn nguồn lực cần thiết.

Đợt đánh giá được coi là hoàn tất khi mọi tiêu chí áp dụng đã có kết quả hoặc khoảng trống bằng chứng được nêu chính xác, các finding lớn được kiểm chứng, và mỗi ưu tiên có hành động cụ thể. Hoàn tất báo cáo không đồng nghĩa mọi kiểm tra đều đạt hoặc sản phẩm đã được phê duyệt ra mắt.

## 10. Tài liệu nền và bước tiếp theo

Tài liệu cũ được dùng để hiểu mục tiêu và tìm bằng chứng cần kiểm tra lại, không nhập lại điểm/kết quả cũ:

- [Intake board](README.md), [current-state audit](current-state-audit.md), [phase-1 audit](phase-1-full-audit.md).
- [Product North Star](product-north-star-roadmap.md), [activation PRD](phase-23-learner-activation-prd.md), [weekly progress metric](phase-30-weekly-cefr-progress-metric.md), [retention event map](phase-32-retention-event-map.md).
- [CEFR checklist](../content-quality/cefr-audit-checklist.md), [bilingual style guide](../content-quality/bilingual-style-guide.md), [pilot pack](../content-quality/pilot-test-pack.md), [review board](../content-quality/audit-2026-06/review-board/README.md).
- [AI eval plan](phase-29-ai-eval-plan.md), [lesson quest pilot](../gamification/lesson-quest-pilot.md).

Quality checklist của CTO đã áp dụng cho khung: tận dụng công cụ/pattern hiện có; định nghĩa kiểm chứng và bảo toàn baseline; tránh hạ tầng mới không cần thiết; phân định quyền quyết định; bảo vệ secrets và dữ liệu người dùng.

**Bước tiếp theo cụ thể:** chốt snapshot của working tree hiện tại và lập ma trận 40 tiêu chí D01.1–D10.4 với module, bằng chứng cần có và lệnh kiểm tra tương ứng; sau đó thực hiện đánh giá theo trình tự ở mục 7.
