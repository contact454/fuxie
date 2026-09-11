Vai chinh: German Curriculum Designer  
Vai phoi hop: German Academic Lead, Content QA / Linguistic Reviewer, Backend Engineer

# A1 pilot r1 — danh mục ứng viên H0/W06

Ngày chọn: 2026-09-11. **Đã chọn đủ 12 hoạt động từ nguồn thật; chưa có hoạt động nào được phê duyệt phát hành.** Đây là bàn giao selection theo [kế hoạch học thuật](../../intake/assessment-2026-09-11/academic-rollout-plan.md), kết thúc ở H0. Không sửa content, runtime, DB hoặc human signoff; không gọi provider.

[candidate-manifest.json](candidate-manifest.json) là danh mục có thể đối soát: 12 activity ID riêng, 12 source ID, JSON pointers/selectors, SHA256 file/đơn vị/trường, prerequisites, can-do đề xuất, phạm vi đọc thật, gaps, owner theo vai trò, audio và mapping code. Tên người nhận việc, human review và delivery parity vẫn chưa có; không suy ra approval từ `cefrAudit.verdict=aligned` của nguồn.

## Danh mục được chọn

Mỗi chuỗi có đủ vocabulary, grammar, reading, listening, speaking và writing. Thứ tự dưới đây đi từ nhận biết đến tạo câu/thông điệp; chia thành nhiều phiên ngắn và có ôn lại, không ép sáu kỹ năng vào một phiên.

| Slot | Source ID / phần được chọn | Nguồn và mục tiêu |
|---|---|---|
|S1-V|`a1-person`, 12 từ có selectors|`content/a1/vocabulary/01-person.json`, các mục về tên, xuất xứ, liên hệ, nghề và nhận xét về người|
|S1-G|`a1-g02-personalpronomen-sein-haben`|`content/a1/grammar/grammar-topics.json#/topics/1`: dùng đại từ với sein/haben trong giới thiệu|
|S1-R|`A1-T1-002`|`content/a1/reading/A1-T1-002.json`: hai lời nhắn mời/trả lời, xác định ai, khi nào, mang gì|
|S1-L|`L-A1-GOETHE-001-T1`|`content/a1/listening/L-A1-GOETHE-001-T1.json`: sáu hội thoại, thông tin nơi ở, xuất xứ, nghề và thời gian|
|S1-S|`a1-begruessung-03-nachsprechen`|`content/a1/speaking/a1-begruessung.json#/lessons/2`: sáu câu chào hỏi và giới thiệu; phần nói mở phải bổ sung|
|S1-W|`W-A1-T2-019`|`content/a1/writing/W-A1-T2-019.json`: giới thiệu Marco với Thomas và mời ăn trưa thứ Sáu|
|S2-V|`a1-reisen-verkehr`, 12 từ có selectors|`content/a1/vocabulary/13-reisen-verkehr.json`: tàu/xe, vé, sân ga, thời gian đi/đến, đổi tàu và lối ra|
|S2-G|`a1-g04-satzbau-fragen`|`content/a1/grammar/grammar-topics.json#/topics/3`: W-Frage, Ja/Nein-Frage và vị trí động từ|
|S2-R|`A1-T1-007`|`content/a1/reading/A1-T1-007.json`: hai tin nhắn về tàu, đổi tàu, điểm đón và trạm xe buýt|
|S2-L|`L-A1-GOETHE-006-T1`|`content/a1/listening/L-A1-GOETHE-006-T1.json`: sáu hội thoại hỏi giờ, sân ga, giá vé và phòng chờ|
|S2-S|`a1-wegbeschreibung-03-nachsprechen`|`content/a1/speaking/a1-wegbeschreibung.json#/lessons/2`: hỏi xe buýt/đường đến ga; phần nói mở phải bổ sung|
|S2-W|`W-A1-T1-012`|`content/a1/writing/W-A1-T1-012.json`: chuyển thông tin chuyến đi của Mario Rossi vào sáu trường form|

**Chuỗi 1: Làm quen và hẹn gặp.** Vocabulary và grammar cung cấp tên/xuất xứ/nghề/nhận xét; listening và speaking luyện giới thiệu. Reading thêm ngữ cảnh lời mời và trả lời để chuyển sang email giới thiệu đồng nghiệp, mời gặp mặt. Đây là điều chỉnh có chủ đích so với ví dụ “thông tin cá nhân” trong kế hoạch: tận dụng nội dung thực đang có, đồng thời giữ mối liên hệ đọc → viết.

**Chuỗi 2: Di chuyển và ghi thông tin chuyến đi.** Từ/câu hỏi lặp lại trong đọc tin nhắn, nghe mua vé và nói hỏi đường. Form dùng lại từ về người ở chuỗi 1 và yêu cầu chuyển dữ kiện chính xác. Các địa danh/người khác nhau là tình huống luyện chuyển giao, không phải một câu chuyện duy nhất bị gán ghép. Đây là pilot có hỗ trợ ở giai đoạn đầu A1, không phải bài đầu tiên cho người chưa biết chữ cái/số.

S1-V chọn đúng: **Name, Vorname, Nachname, Adresse, Telefonnummer, Beruf, Land, heißen, wohnen, kommen, E-Mail, nett**. S2-V chọn đúng: **Zug, Bus, Bahnhof, Haltestelle, Fahrkarte, Hotel, Gleis, Abfahrt, Ankunft, fahren, umsteigen, Ausgang**. Đây là 12/49 và 12/41 mục của hai theme. Chưa xác minh UI có thể phục vụ riêng tập con này; không đưa phần còn lại của theme vào phạm vi đã duyệt.

Các từ về lời mời/gia đình, `seit` và thời lượng, số/giờ, tháng, giá vé cùng các cụm `möchten/müssen`, `hin und zurück`, hướng đi và `falls` cần kiểm đầu vào hoặc hỗ trợ bằng glossary/cụm câu. Manifest ghi chúng ở prerequisite registry với trạng thái chưa biên soạn hoặc chưa kiểm, không giả định 24 từ đủ bao phủ toàn bộ bài.

## Mức đọc thật và giới hạn

- Đã đọc đủ 24 mục từ được chọn (nghĩa, giống/số nhiều hoặc chia động từ, ví dụ Việt–Đức, ghi chú), hai topic grammar đầy đủ, hai bài reading đầy đủ, hai bài listening cùng toàn bộ transcript, hai lesson speaking và hai bài writing đầy đủ.
- Manifest có **194 tham chiếu trường/đơn vị con gắn hash**, không phải 194 bài được duyệt riêng. File metadata, đoạn rubric hoặc số từ cũng có thể là một tham chiếu. Nguồn nằm trong 11 file; không tuyên bố đã đọc hết hai theme vocabulary hoặc toàn bộ hai file speaking.
- Chưa nghe bất kỳ clip nào; chưa xem ảnh, chạy learner flow hay đọc DB môi trường nào. Chưa có human review; can-do và mức phù hợp A1 là đề xuất cần Academic Lead/người có chuyên môn xác nhận.
- Có **29 gap theo hoạt động và bốn gap xuyên suốt**. Con số này gộp lỗi nội dung đã xác minh, thiết kế còn thiếu, mục cần người duyệt và bằng chứng chưa có; không được báo thành “33 lỗi ngôn ngữ”.

## Những việc phải xử lý trước human acceptance

| Mục | Bằng chứng đã đọc | Việc tiếp theo / owner |
|---|---|---|
|S1-W model sai đề|`/modelAnswer` chào Anna, hẹn thứ Bảy 18 giờ, không giới thiệu Marco/Ý và không mời ăn trưa thứ Sáu|Content Writer lập bảng ba yêu cầu → đoạn đáp ứng, viết lại model và rubric; QA độc lập duyệt|
|S1-R Q3 lệch chủ thể|`/questions/2`: stem nói Anna muốn mang thức ăn; explanation chỉ chứng minh Anna yêu cầu Maria mang nhạc|Sửa stem/key/feedback cùng nhau, kiểm lại ngữ cảnh|
|S1-S ghi chú âm sai|`/lessons/2/sentences/4/pronunciationNotes` gọi chữ đầu sind/Sie là “z”, gợi âm x/ts trong khi IPA dùng [z]|Reviewer phát âm sửa và nghe bản mới; kiểm thêm bản dịch Guten Tag, IPA heute và hướng dẫn mir|
|S2-S ghi chú âm sai|`/lessons/2/sentences/1/pronunciationNotes` dạy “sch” trong suche như sh; từ có ch và IPA [x]|Sửa chỉ dẫn theo đúng từ/âm, rồi kiểm audio|
|S2-G mnemonic mâu thuẫn|`/topics/3/mnemonicTip` nói động từ luôn ở vị trí 2, trong khi chính topic dạy câu hỏi có/không ở vị trí 1|Giới hạn phạm vi quy tắc; thay bài recognition/production chung bằng nhiệm vụ có đáp án/biến thể|
|S2-L hội thoại 4 đổi vai|`/transcript/lines/20`–`24`: người hỏi mua vé chuyển sang giải thích máy và phòng chờ; người vừa hướng dẫn lại hỏi về chuyến tàu của mình|Audio Script owner xác định vai, sửa transcript và phiên bản audio cùng nhau|
|Cả hai grammar/speaking|Bài grammar có production placeholder; speaking chỉ sáu câu nhắc lại mỗi lesson|Biên soạn nhiệm vụ sản sinh và hướng dẫn chấm; bốn lượt nói mở tổng cộng vẫn chưa tồn tại trong nguồn|
|Cả hai writing|Rubric chỉ có tiêu chí, trọng số, điểm tối đa|Thêm mức mô tả, ví dụ/biến thể. Form chấm theo dữ kiện từng trường, không chỉ word count|

Các mục còn lại có trong manifest, gồm hỗ trợ tải kiến thức, độ cụ thể của feedback Việt, mốc thời gian trong S2-R và diễn đạt ví dụ `Gleis`. Các vấn đề cần người duyệt được ghi `review-needed`, không nâng thành lỗi chắc chắn.

Điểm tích cực để bảo toàn: W-A1-T1-012 điền đúng Mario Rossi, Ý, bốn người, Konstanz, bảy ngày, tháng Tám; cả hai bài nghe có sáu key khớp transcript được đọc và tổng điểm khớp số câu; các key khác của S1-R và cả năm key S2-R có bằng chứng văn bản. Đây là nhận xét trên text, chưa chứng minh audio, UI hoặc khả năng chấm thật.

## Audio và thay đổi estimate

Nguồn có **hai MP3 gộp, mỗi MP3 sáu hội thoại**; khác giả định bốn clip ngắn trong kế hoạch ban đầu:

- `/audio/listening/A1/Teil1-Kurze-Alltagsgespraeche/L-A1-GOETHE-001-T1.mp3`
- `/audio/listening/A1/Teil1-Kurze-Alltagsgespraeche/L-A1-GOETHE-006-T1.mp3`

Cả hai tồn tại dưới `apps/web/public`; manifest đã ghi SHA256 bytes. Sự tồn tại/hash không phải xác nhận âm thanh đúng. Mười hai `audioUrl` ở speaking đều rỗng; player có browser TTS fallback ở `apps/web/src/components/speaking/NachsprechenPlayer.tsx:169`, chưa nghe hoặc chốt voice/version. Không kết luận ứng dụng hoàn toàn không phát được tiếng.

Vì vậy phạm vi tham chiếu audio hiện tại là hai MP3 cần nghe/đối soát và 12 câu cần quyết định audio cố định hoặc chính sách TTS được duyệt. Audio từ vựng là thêm một phạm vi tùy cách phục vụ, chưa có URL trong 24 mục nguồn. Chưa cắt MP3, thu lại, tạo thêm clip hay mua dịch vụ. Estimate H1/H4/H5 phải hiệu chỉnh sau khi chốt grammar adapter, phạm vi nói mở và parity; không giữ nguyên 68–122 giờ như một cam kết.

## Mapping nguồn → DB → UI: điều biết và điều chưa biết

| Kỹ năng | Đường code đã đọc | Khoảng trống cần đóng |
|---|---|---|
|Vocabulary|`packages/database/prisma/seed/seed-vocabulary.ts:67`: theme theo slug, item unique theo word+level; `apps/web/src/lib/content/vocabulary.ts:7`/`:85` đọc theme/items|Không có native ID trong từ nguồn; manifest dùng composite identity và pointer/hash. Chưa biết row/version live, thứ tự seed khi từ trùng theme hoặc cách giữ đúng 12 mục|
|Grammar|`seed/seed-grammar.ts:34` nạp topic/rules A1; seed riêng `packages/database/prisma/seed-grammar.ts:23` đọc Grammatik-Factory; active page `/grammar/[topicSlug]` liệt kê `GrammarLesson`|JSON topic/exercises đã chọn chưa có mapping sang ID lesson tương tác. Route topic xác định được; route lesson chính xác còn unknown. Đây là blocker parity của slice|
|Reading|`seed-reading-writing.ts:94`/`:126` nạp exercise và questions; active page đọc theo exerciseId|QuestionNumber theo thứ tự mảng, không theo Q ID. Chưa đối soát DB, hình và feedback thực|
|Listening|`seed-listening.ts:19` lấy lesson/audio/transcript từ sibling Audio-Factory; `seed-listening-questions.ts:88` lấy câu hỏi từ repo|Hai nguồn nhập khác nhau. Chưa biết audioUrl/transcript/points/version thực; seed câu hỏi không tự đưa audio_file/transcript/scoring hiện tại vào DB|
|Speaking|`seed-speaking.ts:114`/`:238` chuẩn hóa câu và lưu `exercisesJson.sentences`, lesson ID có hậu tố nachsprechen; page đọc theo ID|Mapping code rõ, nhưng DB/voice/calibration/nói mở chưa kiểm|
|Writing|`seed-reading-writing.ts:188` nạp exercise; `:200` đọc `sampleResponse`, không đọc `modelAnswer`; page `writing/[exerciseId]/page.tsx:153` đọc DB|Chưa chứng minh model tốt/xấu trong JSON đến được UI/grader. Phải kiểm cả hợp đồng dữ liệu và bản phục vụ|

**Rủi ro có điều kiện cần ưu tiên trong listening:** seed câu hỏi gán `explanation.vi` vào `translations.vi`; page tại `apps/web/src/app/(learn)/listening/[lessonId]/page.tsx:223` dùng trường này làm `questionTextNative`, rồi player tại `apps/web/src/components/listening/lesson-player.tsx:765` hiển thị dưới câu hỏi trước trả lời. Nếu DB đã nạp theo đường này, Q1 ở S1-L sẽ hiện câu “Maria nói: Bây giờ tôi sống ở Berlin”, tiết lộ đáp án. Chưa đọc DB nên đây là bằng chứng đường code và ca retest cụ thể, không phải kết luận production đã lộ đáp án. Feedback sau submit được lấy riêng từ explanation tại API; không nên xử lý bằng xóa hết feedback.

Không chạy bất kỳ seed nào trong H0. Các script trên có mutation/publish và có nguồn ngoài repo; chỉ đọc để lập bản đồ. URLs có ID “GOETHE” được giữ nguyên để truy nguồn, không mang ý nghĩa nội dung đã đạt định dạng thi chính thức.

## Bàn giao và điều kiện tiếp tục

Đã kiểm JSON đọc được, đủ 12 slot/đúng sáu kỹ năng mỗi chuỗi, IDs/selectors/pointers có nguồn, hash khớp và 11 file nguồn không thay đổi trong lúc tạo manifest. Script tái tạo nằm ở `tmp/comprehensive-assessment-2026-09-11/content/build-a1-candidates.mjs`; hash trong manifest là căn cứ cho snapshot, không lấy HEAD làm bằng chứng nguồn chưa sửa.

H0 hoàn tất phần chọn nguồn và lập gaps. HG0 chưa được tự động gắn PASS thay PM/Academic; HG1–HG5 còn thiếu sửa nội dung, human review, audio và runtime evidence. Reviewer có thể bắt đầu từ danh mục này, ghi review mới theo hash; không sửa các human signoff cũ để làm đẹp trạng thái.

**Bước tiếp theo:** PM/Academic nhận tên owner và lịch reviewer; Backend chốt mapping của hai grammar topic, tập con vocabulary và hợp đồng writing/listening; sau đó khóa H1/H2 cho đúng 12 hoạt động cùng các regression/gaps trong manifest. Dừng ở bàn giao này, chưa chạy generator hoặc bulk fix.
