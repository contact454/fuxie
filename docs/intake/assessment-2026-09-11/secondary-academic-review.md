Vai chinh: CTO / Tech Lead  
Vai phoi hop: German Academic Lead

# Phản biện độc lập mẫu học thuật

Ngày: 2026-09-11. Reviewer thứ hai là tác tử Codex tổng hợp, không phải người ký duyệt học thuật.

Đã đọc đầy đủ 36 đơn vị: hai mẫu đầu trong mỗi ô vocabulary, grammar, writing × sáu cấp A1–C2 theo sampling manifest của Academic Lead. Mỗi mẫu gồm nội dung, đề, đáp án, rubric và ngữ cảnh tương ứng; loại metadata hình ảnh và nhãn audit khỏi bản đọc để tập trung nội dung. Các đoạn bị giới hạn output đã được đọc bổ sung. Manifest và bản xuất nằm tại `tmp/comprehensive-assessment-2026-09-11/content/second-review-pack-*.txt`.

Đây là 20% của tập cơ sở 180 mẫu, chọn có chủ đích để phản biện; không phủ đều sáu kỹ năng và không dùng để ước lượng tỷ lệ lỗi toàn kho. Chưa nghe audio, chưa xác minh nguồn dữ liệu thực tế của các ví dụ chuyên ngành, chưa có human signoff.

| Nhóm | Số đã đọc | Kết luận trong phạm vi mẫu |
| --- | --- | --- |
| Vocabulary | 12 | Chưa thấy lỗi khách quan rõ ở nghĩa, article, chia động từ hoặc các câu ví dụ được xem. Một số câu chuyên ngành cần xác minh factual/source riêng; không coi là đã xác minh mọi nội dung. |
| Grammar | 12 | Có quy tắc và ví dụ hữu ích, nhưng bài recognition thường trả lại nguyên câu; bài production dùng đáp án chung “Individuelle Antwort…” mà chưa có rubric cụ thể. Chưa đủ bằng chứng người học đạt kỹ năng. |
| Writing | 12 | 11 mẫu có model answer không hoàn thành nhiệm vụ, chèn nguyên nhãn yêu cầu hoặc cắt câu từ nguồn. Một mẫu form A1 có đáp án phù hợp. |

| Mẫu writing | Kết luận reviewer thứ hai |
| --- | --- |
| W-A1-T2-008 | Đổi ca làm nhưng trả lời chung về gặp lúc 18 giờ và mang bánh/đồ uống/dụng cụ; thiếu lý do và phương án thay thế phù hợp. |
| W-A1-T1-012 | Mẫu form phù hợp: Italien, 4 người, Konstanz/Bodensee, 7 ngày, tháng August. |
| W-A2-T1-013 | Người gửi Lukas hỏi loại xe đạp; mẫu chào Anna, không khuyên loại xe, vẫn mang bánh/đồ uống/dụng cụ. |
| W-A2-T2-010 | Situation hàng xóm và máy giặt gây ngập; sourceText lại là lỡ hẹn giáo sư; model không thực hiện việc xin lỗi hoặc xử lý cả hai tình huống. |
| W-B1-T3-010 | Model chứa câu thiếu động từ “dass formelle Anrede”, cắt tên notebook và không trình bày việc trả hàng. |
| W-B1-T2-002 | Model đưa nhãn “eigene Meinung aeussern” vào lập luận, thiếu ví dụ trải nghiệm và phản biện cụ thể về cấm điện thoại. |
| W-B2-T2-008 | Source từ Dr. Markus Weber nhưng chào Frau Schneider; nhãn “Anlass des Schreibens” và câu nguồn bị cắt thay cho đề xuất hợp tác cụ thể. |
| W-B2-T2-004 | Mẫu không thực hiện hủy sự kiện/đề xuất thay thế cụ thể; cắt câu nguồn tại “aufgrund einer kurzfristigen” và chèn nhãn yêu cầu. |
| W-C1-T1-007 | Không mô tả các số 12,50 → 17,40 €/m² của biểu đồ, chèn “Grafik beschreiben”; còn bất nhất yêu cầu 250–400 từ với sourceText 350–450 từ. |
| W-C1-T2-009 | Nhắc lại văn nói nguồn bị cắt, chèn “formelle Anrede und Grussformel”/“Sachverhalt klar darstellen”, chưa tạo thư giới thiệu phù hợp. |
| W-C2-T2-011 | Phê bình nhà hàng Green Plate bị thay bởi hướng dẫn chung về viết báo, bỏ dữ kiện đồ ăn/28 euro/45 phút chờ trong nguồn. |
| W-C2-T1-013 | Không phân tích số liệu đồ thị, chèn nguyên nhãn “Detaillierte Analyse…” và “Stellungnahme…”; lặp câu để kéo dài bài. |

Các điểm bổ sung ở grammar: `b1-konjunktiv2` có literal `ho(f)licher`; mẹo A1 “động từ luôn vị trí 2” cần giới hạn vào câu trần thuật vì chính bài cũng dạy câu hỏi yes/no ở vị trí 1. Các nhãn CEFR hoặc số từ không giải quyết những vấn đề này.

Kết luận phản biện: ưu tiên sửa nguồn/template tạo modelAnswer và kiểm tra theo từng yêu cầu nhiệm vụ; không chỉ sửa metadata, độ dài hoặc trùng lặp. Giữ lại nội dung vocabulary và ví dụ grammar đạt trong phạm vi mẫu, rồi bổ sung đánh giá thực hành và rubric. Không thay nhãn pending human signoff bằng approved từ kết quả này.

Bước tiếp theo: Academic Lead hợp nhất phản biện với 180 mẫu cơ sở, giải quyết bất đồng và mở rộng kiểm tra nhóm template writing trước khi giao nội dung đó cho người học.
# Phản biện bổ sung các trường hợp rủi ro

Root đã đọc lại ngữ cảnh trọng yếu của sáu trường hợp sau, độc lập với lượt đọc của academic agent. Đây là phản biện bổ sung; không thay đổi mẫu ngẫu nhiên 180 đơn vị hay coi sáu trường hợp là một mẫu ngẫu nhiên khác.

| Nguồn | Kết quả đối chiếu |
|---|---|
| `content/a2/listening/L-A2-GOETHE-006-T3.json`, Q2 | Transcript xác nhận mua tại Buchhandlung am Marktplatz; cả lựa chọn b cụ thể và c Im Buchladen đều đúng về nghĩa. Key chỉ nhận b nên distractor không loại trừ nhau. |
| `content/c2/listening/L-C2-GOETHE-014-T3.json` | Ký tự `?` nằm trong chuỗi nguồn Đức/Việt; Q1=Q3, Q2=Q4; evidence chỉ `Frau Dr` không hỗ trợ mệnh đề. Transcript ghi `audio_restub: pending`. Không nghe MP3 nên chưa kết luận độ lệch âm thanh thực tế. |
| `content/c1/listening/L-C1-GOETHE-002-T4.json` | Narrator nói bảy nhiệm vụ, JSON có hai câu MC. Hai câu hỏi và evidence nhìn chung phù hợp phần thuyết trình; lỗi đã xác nhận là không khớp hướng dẫn/số câu, chưa phải kết luận sai format Goethe hiện hành. |
| `content/b1/reading/B1-T1-007.json` | `hat ... aufgestanden` sai trợ động từ ở blog và feedback Q4; Q1 còn chồng template `dass im Text wird erwähnt, dass yumi hat...`. Cần sửa cả nguồn lẫn feedback phát sinh. |
| `content/b2/reading/B2-T4-008.json` | Q1 đáp án nein phù hợp ý nguồn, nhưng key_evidence sao chép chính nhận định sai `technisch leicht umsetzbar`; feedback gọi đó là trích đoạn chứng minh. Ngoài ra có mất umlaut và template sai trật tự từ. |
| `content/a2/speaking/a2-gesundheit.json`, lesson 03 | Ghi chú s3 dạy z trong setzen là [z], trái với cụm [t͡s] trong IPA; s6 dạy st trong Husten là [ʃt], trái với [st] trong IPA. AudioUrl trống ở mẫu; không suy ra runtime TTS không hoạt động. |

Sáu ví dụ xác nhận các nhóm lỗi cần ngăn tái phát, chưa phải reviewer thứ hai đã duyệt mọi đơn vị có lỗi. Đạt mức tối thiểu 36/180 mẫu được hai tác tử xem; các blocker được phản biện qua ví dụ tiêu biểu, chưa đạt duyệt chéo 100% mọi đơn vị lỗi theo mục tiêu ban đầu. Human signoff và thẩm âm vẫn U.
