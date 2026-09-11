Vai chinh: German Academic Lead  
Vai phoi hop: German Curriculum Designer, Content QA / Linguistic Reviewer, Backend Engineer

# Kế hoạch phục hồi học liệu — nhánh A01/A11/A16

Ngày: 2026-09-11. Trạng thái: đề xuất triển khai sau audit; chưa sửa học liệu, tạo bản phát hành, đối soát DB hoặc ký duyệt. Tài liệu này cụ thể hóa nhánh học thuật của [backlog](prioritized-backlog.md), không thay thế kế hoạch bảo mật, sản phẩm và vận hành.

## Quyết định đề xuất

Làm một lát cắt A1 gồm **hai chuỗi học liên kết, mỗi chuỗi đủ sáu kỹ năng: tổng cộng 12 hoạt động**. Sửa quy trình tạo nội dung cùng lúc với sửa các bài được chọn; chỉ nhân rộng sau khi lát cắt này qua duyệt học thuật, đối soát nguồn–DB–ứng dụng–âm thanh và pilot có quan sát. Không dùng việc vượt QA schema, metadata `aligned` hoặc fixture AI PASS để thay thế các bước đó.

[Audit](content-academic.md) đã đọc 180 mẫu phân tầng và hai mẫu rủi ro, phát hiện 29/30 mẫu writing không đáp ứng đề; chưa nghe audio hay có người ký duyệt. Đây là bằng chứng để ưu tiên phục hồi, không phải tỷ lệ lỗi ước lượng cho toàn kho. Ba mươi mẫu A1 trong audit là tập hồi quy hữu ích, không tự động trở thành chương trình pilot.

## 1. Chốt phạm vi A1 theo mục tiêu, không theo số lượng file

Đối tượng dự kiến: người Việt đang ở giai đoạn đầu A1, đã có kiến thức tối thiểu về chữ cái và số cơ bản; kiểm tra điều kiện này lúc tuyển. Hai tình huống đề xuất là **giới thiệu thông tin cá nhân** và **hỏi/ghi thông tin đặt chuyến đi**. Curriculum Designer kiểm lại độ phù hợp và tải kiến thức trước khi khóa danh mục.

| Kỹ năng | Phạm vi toàn pilot | Bằng chứng học tập cần tạo |
|---|---|---|
|Vocabulary|Hai nhóm, khoảng 12 mục tiêu/nhóm; ưu tiên từ được dùng lại trong năm kỹ năng còn lại|Nhận biết nghĩa trong ngữ cảnh, sau đó nhớ lại từ/cụm từ ở lượt ôn; không chỉ chạm thẻ|
|Grammar|Hai bài ngắn, mỗi bài một mục tiêu chính; ví dụ câu khai thông tin với `sein` và câu hỏi thông tin đã được giới hạn rõ|Chọn/sửa câu và tự tạo một câu mới; đáp án mẫu kèm biến thể hợp lệ, không dùng `Individuelle Antwort` làm hướng dẫn chấm duy nhất|
|Reading|Hai văn bản ngắn, mỗi văn bản khoảng 4–5 câu hỏi|Trích được dữ kiện cần dùng cho form/tin nhắn; mỗi key và distractor có lý do theo văn bản|
|Listening|Hai hoạt động, tổng dự kiến bốn đoạn audio ngắn, mỗi hoạt động khoảng 4–5 câu hỏi|Nhận ra người nói và thông tin mục tiêu; transcript, lời hướng dẫn, số câu và audio thực khớp nhau|
|Writing|Một form và một tin nhắn ngắn theo tình huống|Form đúng dữ kiện; tin nhắn thực hiện đủ các ý được yêu cầu, có ví dụ đạt/chưa đạt và giải thích Việt–Đức cụ thể|
|Speaking|Hai hoạt động, mỗi hoạt động bốn câu luyện có mẫu và hai lượt nói theo gợi ý|Có cơ hội tự tạo thông điệp ngoài nhắc lại; IPA, ghi chú phát âm, câu mẫu và tiếng nghe được nhất quán|

Mười hai hoạt động là đơn vị phát hành; các từ, câu hỏi, đoạn feedback và clip bên trong đều là đơn vị phải duyệt. Dự kiến 16 clip tham chiếu: bốn listening và tối đa 12 speaking; số cuối cùng phải ghi trong manifest. Chia thành các phiên ngắn theo thử nghiệm thời gian nội bộ, không ép người học hoàn thành cả sáu kỹ năng trong một phiên. Có lượt ôn sau buổi học và lượt nhớ lại sau khoảng bảy ngày.

Chọn từng hoạt động khi đủ các điều kiện sau:

1. Có mục tiêu quan sát được, tình huống và điều kiện thực hiện; các từ/kiến thức tiên quyết đã học hoặc được hỗ trợ rõ. Không dùng câu chung “luyện kỹ năng ở A1” làm mục tiêu nghiệm thu.
2. Liên kết với ít nhất một hoạt động khác trong cùng chuỗi; không đưa bài vào chỉ vì đã có file hoặc được gắn nhãn A1.
3. Có toàn bộ đề, stimulus, đáp án/biến thể, feedback và rubric cần thiết; có khả năng hoàn thiện quyền sử dụng và audio trong phạm vi pilot.
4. Biết ID nguồn và đường phục vụ thực tế. Nội dung có lỗi chỉ được giữ trong danh mục ứng viên kèm việc sửa và tiêu chí retest, chưa được đánh dấu sẵn sàng.

Ứng viên tái sử dụng có bằng chứng tích cực: `content/a1/writing/W-A1-T1-012.json:77`, đáp án form đúng dữ kiện trong mẫu audit. Vẫn phải duyệt rubric, điều kiện chấm form, mục tiêu và phiên bản được phục vụ. [Pilot pack cũ](../../content-quality/pilot-test-pack.md) chỉ là danh sách ứng viên bổ sung; chưa có bằng chứng các bài trong đó đã qua pilot. Các slot chưa chọn giữ `candidateId: null`, kèm owner và hạn chọn; **không khóa bản phát hành khi còn slot trống**.

Chuẩn tham chiếu: [CEFR Companion Volume 2020](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4). Với mỗi mục tiêu, lưu tên thang mô tả, trang/descriptor đã đối chiếu và lý do áp dụng; đây là đánh giá độ phù hợp do người có chuyên môn thực hiện, không phải chứng nhận trình độ. Không mặc định định dạng đề “Goethe” trong ID là đã đạt chuẩn kỳ thi.

## 2. Sửa nguyên nhân theo nhóm, rồi sửa từng bài

| Nhóm | Điều đã có bằng chứng | Cách xử lý trong đợt đầu |
|---|---|---|
|Writing template|`scripts/apply-writing-regen.ts:122` chứa tin nhắn cố định; `:99` và `:108` cắt theo số từ; `:368` chọn generator chủ yếu theo level/Teil; `:388` kiểm độ dài, regex, trùng lặp. Các cơ chế này không kiểm việc thực hiện từng yêu cầu đề.|Không chạy lại bộ sinh hiện tại để “sửa sạch” toàn kho. Tách form/tin nhắn theo hợp đồng riêng; tác giả phải lập bảng yêu cầu → đoạn đáp ứng trong model answer. Kiểm tự động độ dài không thay thế duyệt ý nghĩa. Thêm hồi quy bằng các ca audit và ca đúng được bảo toàn.|
|Câu hỏi, feedback, scoring|Audit đã xác minh stem/feedback lệch, key mơ hồ, 115/268 listening lệch tổng điểm; regex còn có candidate chưa xác minh.|Lập nhóm theo cấu trúc/pipeline tạo bài; truy nguồn trước khi kết luận cùng nguyên nhân. Bổ sung kiểm tổng điểm và miền grade theo từng dạng câu hỏi, kể cả đáp án lồng trong cloze; không tái sử dụng phép đếm sai từng tạo 36 false positive reading.|
|Pronunciation và audio|Ghi chú phát âm có lỗi khách quan; 79/268 listening mang cờ chờ audio. Chưa xác minh chất âm hay bản đang phát.|Sửa câu/IPA/ghi chú như một cụm; khóa transcript trước khi tạo hoặc thu lại clip. Nghe toàn bộ audio của pilot. Không suy ra lỗi MP3 từ lỗi JSON hay suy ra MP3 đúng từ transcript đúng.|
|Lỗi riêng từng bài|Tình huống và sourceText mâu thuẫn, ví dụ W-A2-T2-010; một câu mẫu đúng không bảo đảm bài khác đúng.|Sửa theo bảng dữ kiện của từng tình huống; người duyệt kiểm ngược từ đáp án về yêu cầu. Quét phạm vi liên quan để tìm thêm, nhưng chỉ báo lỗi ngữ nghĩa sau khi đọc đủ ngữ cảnh.|

Phân biệt `confirmed-family-defect`, `candidate-family-match` và `one-off-confirmed`. Số 125/230 writing có dấu template trong audit là tín hiệu để tìm, không tự động là 125 lỗi đã đọc. Với nhóm generator có lỗi, chủ sở hữu phải rà toàn bộ đầu ra có cùng provenance; bản release đầu chỉ nhận các đơn vị đã duyệt. Các bản ngoài pilot còn nghi vấn không được quảng bá thành nội dung đã nghiệm thu.

## 3. Manifest, phiên bản và trạng thái duyệt

Tạo manifest riêng cho release `a1-pilot-r1` khi bắt đầu triển khai; không ghi đè manifest lấy mẫu audit. Mỗi hoạt động và đơn vị con lưu:

- `unitId`, `parentActivityId`, level/skill, slot curriculum, mục tiêu/descriptor tham chiếu, prerequisite, đường file và JSON pointer ổn định.
- `contentRevision`, Git commit, hash file gốc và hash semantic của trường được phục vụ; nguồn/provenance, phiên bản generator/prompt/model nếu có, quyền sử dụng và owner.
- Hash riêng của stimulus, key/rubric/feedback; với audio có `audioAssetId`, hash bytes, transcript hash, voice/recording version và quyền sử dụng.
- Từng lượt review: người/agent thực hiện, loại reviewer (`human` hoặc `AI-advisory`), ngày, phạm vi thực đọc/nghe, findings, revision/hash được duyệt và quyết định. Lịch sử chỉ thêm lượt mới, không biến review AI thành human signoff.
- Đối soát phục vụ: môi trường, build/deploy ID, DB content version, API/UI semantic digest, asset digest, thời gian kiểm; dùng tài khoản kiểm thử và không lưu PII người học trong manifest.

Giữ **bốn trục độc lập**: `textReview`, `audioReview`, `deliveryParity`, `releaseDecision`. Mỗi trục dùng `not-started / in-review / changes-requested / approved / stale`, kèm `not-applicable` có lý do cho audio ở bài không dùng audio. `releaseDecision` do owner quyết định sau gates; không suy ra từ một trường `aligned`.

Thay stimulus/đề làm stale review của câu hỏi, key, feedback và model answer phụ thuộc. Thay transcript làm stale audio review. Thay rubric làm stale bản chấm mẫu và AI calibration dùng rubric đó. Thay bản audio làm stale lượt nghe clip. Thay build/seed/cache làm stale bằng chứng delivery tương ứng. Review không bị ảnh hưởng chỉ được giữ khi dependency manifest chứng minh các hash liên quan giữ nguyên.

Backend định nghĩa phép chiếu semantic dùng chung để so nguồn–DB–API: chuẩn hóa thứ tự key nhưng giữ nguyên chuỗi, thứ tự câu hỏi/đáp án và dữ kiện sư phạm; loại runtime ID/timestamp theo whitelist có tài liệu. Nếu adapter biến đổi có chủ ý, lưu version và mapping thay vì so hash hai cấu trúc khác nhau. Trong staging, kiểm 100% đơn vị pilot theo phép chiếu này, rồi mở đủ 12 hoạt động để kiểm rendering, feedback, chấm điểm và asset thực tải. Bản phát hành gắn với danh sách version bất biến; cache key chứa revision, có kế hoạch chuyển traffic và rollback đồng bộ content/audio. Không seed đè production từ script audit.

## 4. Gói việc và phụ thuộc

Ước lượng dưới đây là **giờ công**, không phải báo giá hoặc cam kết lịch. Giả định tái sử dụng UI hiện tại, chỉ 12 hoạt động/24 mục từ/khoảng 16 clip, một vòng sửa sau duyệt, người có chuyên môn sẵn lịch; chưa gồm tuyển learner, thời gian chờ bảy ngày, thu âm studio, mở rộng C2, xây giao diện speaking mới hay sửa các hạng mục kỹ thuật toàn dự án.

| Gói | Owner / đầu ra | Phụ thuộc | Giờ công dự kiến |
|---|---|---|---:|
|H0 — Chọn và khóa ứng viên|Curriculum + Academic: 12 ID, mục tiêu, prerequisites, inventory đơn vị con và nguồn đang phục vụ|Đầu mối kỹ thuật cung cấp mapping nguồn–loader/DB; có thể soạn curriculum trước|6–10|
|H1 — Ngăn lỗi tái sinh|Content Engineer + Academic: truy nguyên nhóm, giới hạn/quy trình thay generator cho pilot, kiểm invariants và hồi quy từ audit|Bắt đầu song song H0; scope fix khóa sau H0|16–28|
|H2 — Biên tập pilot|Content author: đề, dữ kiện, đáp án/biến thể, model, rubric có mức mô tả và feedback đầy đủ|H0; tiếp thu hợp đồng H1, không cần đợi mọi sửa generator ngoài pilot|16–28|
|H3 — Duyệt độc lập|Human Content QA + Academic: đọc toàn bộ đơn vị con, adjudication, review ledger đúng hash|H2; có thể làm cuốn chiếu từng hoạt động|10–18|
|H4 — Hoàn thiện audio|Audio owner + reviewer tiếng Đức: clip theo transcript khóa, nghe toàn bộ, xác nhận phát âm/người nói/hướng dẫn|Transcript từng clip đã qua H3; đổi transcript phải làm lại phụ thuộc|6–12|
|H5 — Đối soát phục vụ|Backend + QA: source–DB–API–UI–audio parity, cache/version và diễn tập rollback trên staging|H3/H4 và các sửa kỹ thuật áp dụng cho lát cắt|8–16|
|H6 — Nghiệm thu và chuẩn bị pilot|Academic + PM + QA: checklist gates, phiếu nhiệm vụ, paired examples, cách thu feedback và owner xử lý lỗi|H5; gate bảo mật/vận hành của kế hoạch chung|6–10|
|**Tổng chuẩn bị nhánh học liệu**|Không cộng lại các giờ này vào cùng công việc A01 ở kế hoạch tổng|Cần đo lại sau H0/H1|**68–122**|

Với ba tuyến nội dung, kỹ thuật, reviewer/audio làm song song và có reviewer trong tuần đầu, có thể lập lịch mục tiêu khoảng 2–3 tuần cho chuẩn bị; đây là giả định điều phối, không hứa ngày ra mắt. Nếu H0 tìm thấy UI không hỗ trợ form hoặc lượt speaking mở cần thiết, đưa phần đó thành thay đổi riêng có estimate mới; không âm thầm tính vào 68–122 giờ.

## 5. Gates nhị phân cho lát cắt được phát hành

Một gate chỉ PASS khi đủ toàn bộ bằng chứng tại cùng release revision; thiếu kiểm chứng là NOT READY. P1 ngoài slice vẫn phải có owner và cách xử lý, nhưng không thể bị coi đã đóng nhờ một pilot nhỏ.

| Gate | Điều kiện PASS | Người quyết định |
|---|---|---|
|HG0 — Phạm vi|Đủ 12 ID, đủ sáu kỹ năng mỗi chuỗi, toàn bộ đơn vị con có owner, mục tiêu và dependency; không slot trống|Academic + PM|
|HG1 — Tính nhất quán|Các kiểm schema/invariants áp dụng PASS; không còn lỗi đã xác minh trong slice về dữ kiện, key, scoring, feedback hoặc model không làm đúng đề; candidate findings đều được triage, không lẫn false positive vào số lỗi|Content QA + Content Engineer|
|HG2 — Duyệt người|Người có chuyên môn đã đọc 100% nội dung sư phạm của slice ở đúng hash; model thực hiện đủ từng yêu cầu; rubric có mô tả các mức và ví dụ; các bất đồng ảnh hưởng đáp án/feedback/độ phù hợp đã giải quyết|Human reviewer độc lập với người viết + Academic Lead phê duyệt học thuật|
|HG3 — Âm thanh|Mọi clip được dùng đã được nghe toàn bộ và duyệt; transcript, speaker, ngữ âm, instructions/số câu và asset đang phát khớp; không còn cờ pending chưa giải quyết của clip trong slice|Audio QA + reviewer tiếng Đức|
|HG4 — Bản thực phục vụ|100% đơn vị slice có semantic parity nguồn–DB–API, đủ 12 luồng UI qua chấm/feedback/retry/progress; audio tải đúng hash; có rollback thử trên staging|Backend + QA|
|HG5 — Mở learner pilot|HG0–HG4 PASS và acceptance áp dụng của A02–A09, data handling/retention/owner cùng rollback tối thiểu của A13/A14 đã đạt; có consent và lịch hỗ trợ; A11 đạt nếu đưa AI chấm thật vào pilot|PM + CTO + Academic|

LanguageTool toàn kho đã bị giới hạn RAM trong audit. Đợt này dùng kiểm theo batch chỉ trên slice, giới hạn heap/CPU/RAM và lưu checkpoint. Khi công cụ chưa chạy được, ghi rõ khoảng trống và duyệt ngôn ngữ thủ công theo H3; không báo “lint PASS”. Công cụ lint không được quyền ký HG2.

## 6. Người duyệt, phương án khi thiếu người và AI

Chọn reviewer có kinh nghiệm dạy/thiết kế bài DaF ở A1 và năng lực đánh giá tiếng Đức; feedback tiếng Việt cần người hiểu cả Việt–Đức hoặc người dịch phối hợp. “Người bản ngữ” tự nó chưa chứng minh năng lực thiết kế assessment. Tác giả không tự ký thay người duyệt độc lập; Academic Lead giải quyết khác biệt và chịu trách nhiệm mức phù hợp được công bố. Lượt duyệt AI thứ hai trong audit vẫn là AI, không thay vai trò này.

Nếu chưa có reviewer, tiếp tục H0–H2, invariants, trace provenance và đóng gói review pack; trạng thái tối đa là **bản ứng viên để xem nội bộ**. PM phải sắp lịch người duyệt hoặc giữ nguyên giới hạn này. Không hạ HG2 để chạy learner pilot. Tương tự, chưa nghe đủ audio thì chưa có lát cắt sáu kỹ năng sẵn sàng; có thể demo phần text trong nội bộ và báo phần audio chưa đạt.

A11 tách thành nhánh phụ thuộc gold references đã qua HG2. Rubric chấm cần mô tả mức và ví dụ, gồm đáp án đúng, biến thể hợp lệ, sai/thiếu ý, giáp ranh và ca dễ bị sửa sai; speaking cần tiếng Đức thực, âm thanh nhiễu và tình huống mic/provider lỗi. Khóa prompt/model/rubric version; đánh giá lặp và ghi bất đồng với người duyệt cùng cost cap. Fixture hiện tại PASS chưa đáp ứng nhánh này.

Trong pilot đầu, nếu A11 chưa đạt, đề xuất không đưa điểm AI vào kết luận năng lực hay điều kiện hoàn thành. Có thể dùng audio tham chiếu, ghi âm/nghe lại và feedback giáo viên **khi luồng đó đã được kỹ thuật xác minh hoặc triển khai và nghiệm thu**. Đây là phương án phạm vi để CTO/PM cân nhắc, chưa phải tính năng đã sẵn sàng. Không chuyển hoạt động speaking thành chỉ nhắc lại rồi coi đã kiểm được khả năng giao tiếp.

## 7. Đo pilot và điều kiện mở rộng

PM tuyển khoảng 5–10 người học đúng phạm vi; ghi n/N, điều kiện đầu vào, phiên bản bài, số bỏ dở và dữ liệu thiếu. Quan sát hoàn thành nhiệm vụ, hiểu feedback và sửa bài; dùng một nhiệm vụ tương đương chưa thấy đáp án để kiểm chuyển giao gần, cùng lượt nhớ lại sau khoảng bảy ngày. Không so sánh hai lần cùng đáp án vừa được xem để kết luận đã tăng năng lực.

Các mức 80% thấy đề rõ và 70% thấy độ khó vừa trong pilot pack cũ chỉ nên là tín hiệu định hướng ở mẫu nhỏ, kèm số người thực. Mọi phản hồi được phân loại và xử lý; không yêu cầu phải “tạo đủ năm góp ý” để làm đẹp chỉ tiêu. Nếu xuất hiện lỗi đáp án/model/phát âm đã xác minh, dừng phân phối hoạt động bị ảnh hưởng, ghi revision/attempt chịu tác động và duyệt lại sau sửa; không xóa dấu vết phiên bản cũ.

Chỉ đề xuất mở module kế tiếp khi gates của phiên bản sửa vẫn PASS, các blocker từ pilot đã đóng và PM/Academic đã xem dữ liệu đủ kèm missing. Ưu tiên thêm một tình huống A1 theo cùng quy trình trước khi nhân rộng level; quyết định A2–C2 cần curriculum review và nguồn lực riêng. Pilot này tạo bằng chứng sử dụng và học tập ban đầu, không chứng minh bảo đảm CEFR hay hiệu quả chung cho toàn kho.

**Bước tiếp theo cụ thể:** giao Academic/Curriculum thực hiện H0 cùng Backend cung cấp mapping nguồn đang phục vụ; trong cùng đợt chốt lịch reviewer và 12 candidate ID. H0 trả về manifest ứng viên, dependency, inventory đơn vị con và estimate đã hiệu chỉnh để CTO/PM khóa đợt triển khai đầu. Chưa giao việc cho Antigravity/Anti trong tài liệu này.
