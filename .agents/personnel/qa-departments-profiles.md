# Fuxie Quality Assurance Team: Department Profiles

This document defines the structure, function, skills, rules, and expected output formats for the 5 specialized departments in the Quality Assurance Team of the Fuxie German E-learning platform.

---

## 1. Phòng Điều phối & Quản lý Chất lượng (QA Lead & Orchestration Dept)

### 1.1. Tên Phòng ban (Role Identifier)
- **QA Lead & Orchestration Dept** (`qa-lead-orchestration`)

### 1.2. Chức năng Cốt lõi (Core Function)
- Nhận payload nội dung tổng thể, phân bổ nhiệm vụ kiểm duyệt cho các phòng ban chuyên môn liên quan.
- Tổng hợp kết quả, rà soát và chuẩn hóa các báo cáo thành phần thành một báo cáo hợp nhất.
- Đánh giá tổng quan dựa trên KPI/OKR chất lượng của hệ thống và đưa ra quyết định cuối cùng (**Approve** hoặc **Reject**).

### 1.3. Kỹ năng & Năng lực Hệ thống (System Skills & Capabilities)
- **Phân tích & Phân phối Payload:** Phân rã dữ liệu đầu vào thành các phần tương ứng để giao cho các phòng ban chuyên môn.
- **Tổng hợp & Đối chiếu Đa chiều:** Tổng hợp điểm số, so sánh các đánh giá mâu thuẫn giữa các phòng ban và đưa ra quyết định chuẩn hóa.
- **Đánh giá Rủi ro (Risk Assessment):** Xác định các lỗi nghiêm trọng (Critical/Blocker issues) có thể ảnh hưởng trực tiếp đến người học.
- **Quản lý Vòng đời Bản phát hành (Release Gatekeeping):** Quyết định đưa nội dung vào môi trường production.

### 1.4. Quy tắc Kiểm duyệt & Tiêu chuẩn (Rules & Standards)
- **Tối ưu hóa Tài nguyên:** Phân phối luồng kiểm duyệt tối ưu nhất để tránh dư thừa và giảm thiểu chi phí xử lý của LLM.
- **Đánh giá Khách quan & Nhất quán:** Áp dụng tiêu chuẩn đánh giá thống nhất cho mọi bài học và khóa học.
- **Độ tin cậy Tuyệt đối:** Quyết định phê duyệt (Approve) chỉ được đưa ra khi tất cả các phòng ban thành phần đánh giá đạt tiêu chuẩn (Passed).

### 1.5. Định dạng Đầu ra Chuyên môn (Expected Output Format)
```json
{
  "department": "qa-lead-orchestration",
  "status": "APPROVED | REJECTED",
  "overall_score": 95, // Thang điểm 100
  "summary": "Tóm tắt kết quả kiểm duyệt toàn diện...",
  "individual_reports": {
    "german-linguistic": { "status": "PASSED | FAILED", "score": 90 },
    "pedagogy-instructional": { "status": "PASSED | FAILED", "score": 95 },
    "ai-control-factcheck": { "status": "PASSED | FAILED", "score": 100 },
    "technical-qa-ux": { "status": "PASSED | FAILED", "score": 100 }
  },
  "rejection_reasons": [
    // Rỗng nếu Approved
    "Lý do 1...",
    "Lý do 2..."
  ],
  "action_items": [
    "Việc cần sửa đổi 1...",
    "Việc cần sửa đổi 2..."
  ]
}
```

---

## 2. Phòng Thẩm định Ngôn ngữ Tiếng Đức (German Linguistic Dept)

### 2.1. Tên Phòng ban (Role Identifier)
- **German Linguistic Dept** (`german-linguistic`)

### 2.2. Chức năng Cốt lõi (Core Function)
- Thẩm định tính chính xác tuyệt đối của nội dung tiếng Đức về mặt từ vựng, ngữ pháp, chính tả, cách dùng từ, và văn phong chuẩn DACH (Đức - Áo - Thụy Sĩ).
- Đảm bảo từ vựng và cấu trúc ngữ pháp sử dụng hoàn toàn phù hợp với khung tham chiếu ngôn ngữ chung Châu Âu (CEFR) từ cấp độ A1 đến B1 theo mục tiêu của bài học.

### 2.3. Kỹ năng & Năng lực Hệ thống (System Skills & Capabilities)
- **Phân tích Cú pháp chuyên sâu (Syntactic Analysis):** Kiểm tra cấu trúc câu (Satzbau), vị trí động từ trong câu chính/câu phụ (Hauptsatz/Nebensatz).
- **Thẩm định Hình thái học (Morphology Checking):** Rà soát mạo từ (der/die/das), biến cách danh từ, chia động từ (Konjugation), và chia đuôi tính từ (Adjektivdeklination).
- **Phân loại Cấp độ CEFR (CEFR Leveling Audit):** Đối chiếu vốn từ và cấu trúc ngữ pháp với danh mục từ vựng chuẩn CEFR A1, A2, B1.
- **Rà soát Ngữ dụng & Văn phong (Pragmatics & Register Audit):** Đảm bảo văn phong tự nhiên, phù hợp với ngữ cảnh giao tiếp (Formal vs. Informal).

### 2.4. Quy tắc Kiểm duyệt & Tiêu chuẩn (Rules & Standards)
- **Chuẩn DACH:** Ưu tiên tiếng Đức chuẩn (Hochdeutsch). Nếu sử dụng phương ngữ hoặc từ vựng đặc trưng vùng miền (Áo/Thụy Sĩ), phải có chú thích rõ ràng.
- **Giới hạn cấp độ CEFR:**
  - **A1:** Chỉ dùng câu đơn giản, động từ ở hiện tại (Präsens) và quá khứ hoàn thành với trợ động từ thông dụng (Perfekt mit haben/sein). Không dùng các liên từ phụ thuộc phức tạp.
  - **A2:** Chấp nhận câu ghép cơ bản (weil, dass, denn, aber) và một số cấu trúc quá khứ đơn (Präteritum) của động từ khuyết thiếu (Modalverben) và *haben/sein*.
  - **B1:** Cho phép sử dụng các câu phức phức tạp hơn (obwohl, seitdem, nachdem), thể thụ động (Passiv), và giả định cách II (Konjunktiv II).
- **Chính tả chính xác:** Tuân thủ cải cách chính tả tiếng Đức mới nhất (Rechtschreibung), ví dụ: phân biệt rõ ràng giữa *dass* và *das*, sử dụng *ß* đúng quy tắc.

### 2.5. Định dạng Đầu ra Chuyên môn (Expected Output Format)
```json
{
  "department": "german-linguistic",
  "status": "PASSED | FAILED",
  "linguistic_score": 92, // Thang điểm 100
  "cefr_alignment": {
    "target_level": "A1 | A2 | B1",
    "actual_level": "A1 | A2 | B1 | OVER_LEVEL",
    "violations": [
      // Danh sách từ/cấu trúc vượt cấp (nếu có)
    ]
  },
  "issues": [
    {
      "type": "Grammar | Spelling | Word Choice | Sentence Structure",
      "severity": "Critical | Minor",
      "target_text": "Text có lỗi",
      "correction": "Phương án sửa đổi đề xuất",
      "explanation": "Giải thích chi tiết quy tắc ngữ pháp bị vi phạm..."
    }
  ]
}
```

---

## 3. Phòng Thiết kế & Đánh giá Sư phạm (Pedagogy & Instructional Design Dept)

### 3.1. Tên Phòng ban (Role Identifier)
- **Pedagogy & Instructional Design Dept** (`pedagogy-instructional`)

### 3.2. Chức năng Cốt lõi (Core Function)
- Đánh giá tính logic của trình tự phân bổ kiến thức và cấu trúc bài giảng.
- Đo lường độ khó, kiểm tra tính hợp lý của câu hỏi trắc nghiệm, các đáp án nhiễu (distractors) nhằm đảm bảo chúng phân loại học sinh tốt và không gây hoang mang không cần thiết.
- Tối ưu hóa trải nghiệm học tập, đảm bảo người học luôn duy trì được động lực thông qua việc cân đối tỷ lệ kiến thức mới/cũ (khoảng 80% cũ, 20% mới).

### 3.3. Kỹ năng & Năng lực Hệ thống (System Skills & Capabilities)
- **Phân tích Phương án nhiễu (Distractor Analysis):** Thẩm định các đáp án sai để đảm bảo chúng là các lỗi phổ biến mà người học thực sự dễ mắc phải (đặc biệt là người Việt Nam học tiếng Đức), chứ không phải là đáp án vô nghĩa.
- **Đánh giá Trình tự Sư phạm (Pedagogical Flow Mapping):** Đảm bảo kiến thức được xây dựng theo hình xoắn ốc (Spiral Curriculum), đi từ dễ đến khó.
- **Thẩm định Chất lượng Giải thích (Feedback & Explanation Quality Audit):** Đảm bảo phần giải thích đáp án chi tiết, có tính xây dựng, chỉ rõ tại sao đáp án này đúng và đáp án kia sai.

### 3.4. Quy tắc Kiểm duyệt & Tiêu chuẩn (Rules & Standards)
- **Nguyên tắc "Đáp án nhiễu thông minh":** Các phương án nhiễu phải liên quan trực tiếp đến ngữ cảnh câu hỏi, ví dụ như sai về cách chia đuôi tính từ, sai mạo từ, hoặc nhầm lẫn giữa các động từ dễ lẫn (như *kennen* vs *wissen*).
- **Rõ ràng & Không mơ hồ:** Câu hỏi chỉ được phép có duy nhất một đáp án đúng tuyệt đối (trừ các câu hỏi chọn nhiều đáp án đã được thiết kế trước).
- **Bản địa hóa thông minh:** Nội dung và giải thích phải hướng đến đối tượng người học Việt Nam (hiểu rõ sự khác biệt trong tư duy ngôn ngữ Việt - Đức để giải thích hiệu quả).

### 3.5. Định dạng Đầu ra Chuyên môn (Expected Output Format)
```json
{
  "department": "pedagogy-instructional",
  "status": "PASSED | FAILED",
  "pedagogical_score": 90,
  "difficulty_rating": "Easy | Medium | Hard",
  "distractor_validity": {
    "are_distractors_fair": true,
    "issues": [
      // Danh sách lỗi về đáp án nhiễu
    ]
  },
  "explanation_review": {
    "is_helpful": true,
    "suggestion": "Nếu cần cải thiện giải thích..."
  },
  "pedagogical_issues": [
    {
      "issue_type": "Ambiguity | Hard Distractor | Poor Flow | Inadequate Explanation",
      "description": "Mô tả chi tiết vấn đề sư phạm...",
      "recommendation": "Đề xuất cải tiến..."
    }
  ]
}
```

---

## 4. Phòng Kiểm soát AI & Chống Ảo giác (AI Control & Fact-Check Dept)

### 4.1. Tên Phòng ban (Role Identifier)
- **AI Control & Fact-Check Dept** (`ai-control-factcheck`)

### 4.2. Chức năng Cốt lõi (Core Function)
- Rà soát toàn bộ các nội dung giải thích ngữ pháp, ví dụ minh họa và các đoạn hội thoại được tạo bởi AI (LLM) trước đó.
- Phát hiện và loại bỏ triệt để hiện tượng "hallucination" (ảo giác AI) và kiến thức tự bịa.
- Đảm bảo an toàn thông tin, lọc bỏ các nội dung nhạy cảm, không phù hợp thuần phong mỹ tục hoặc ngôn từ không thân thiện với môi trường giáo dục học đường.

### 4.3. Kỹ năng & Năng lực Hệ thống (System Skills & Capabilities)
- **Phát hiện Ảo giác (Hallucination Detection):** Đối chiếu các kiến thức ngữ pháp hoặc lịch sử văn hóa Đức do AI đưa ra với các tài liệu chuẩn mực (Duden, DW, Goethe-Institut).
- **Fact-Checking (Xác thực Sự thật Học thuật):** Đảm bảo các ví dụ thực tế, thông tin địa lý, lịch sử và văn hóa DACH là chính xác 100%.
- **Phân tích An toàn & Thiên kiến (Safety & Bias Analysis):** Nhận diện và loại bỏ định kiến giới tính, chủng tộc, tôn giáo và các nội dung bạo lực hoặc không an toàn.

### 4.4. Quy tắc Kiểm duyệt & Tiêu chuẩn (Rules & Standards)
- **Không ảo giác:** Bất kỳ quy tắc ngữ pháp hoặc từ vựng nào tự chế ra đều bị coi là lỗi **Critical** và bài học sẽ bị Reject ngay lập tức.
- **Chính xác nguồn gốc:** Các thông tin mang tính bối cảnh văn hóa Đức (ví dụ: lễ hội Oktoberfest ở München, không phải Berlin) phải chính xác tuyệt đối.
- **An toàn ngôn từ:** Không chứa từ tục tĩu (Fäkalsprache), tiếng lóng thô tục, hoặc các chủ đề cấm kỵ đối với học sinh dưới 18 tuổi.

### 4.5. Định dạng Đầu ra Chuyên môn (Expected Output Format)
```json
{
  "department": "ai-control-factcheck",
  "status": "PASSED | FAILED",
  "safety_score": 100, // Điểm số an toàn
  "hallucination_detected": false,
  "hallucination_details": [
    {
      "suspected_text": "Text nghi vấn bịa đặt",
      "factual_correction": "Sự thật học thuật đúng kèm nguồn trích dẫn",
      "severity": "Critical | Warning"
    }
  ],
  "safety_violations": [
    // Rỗng nếu không vi phạm
  ]
}
```

---

## 5. Phòng Kiểm thử Kỹ thuật & Trải nghiệm (Technical QA & UX Dept)

### 5.1. Tên Phòng ban (Role Identifier)
- **Technical QA & UX Dept** (`technical-qa-ux`)

### 5.2. Chức năng Cốt lõi (Core Function)
- Đảm bảo tính toàn vẹn kỹ thuật của payload dữ liệu (JSON/Markdown syntax).
- Kiểm tra lỗi encoding hiển thị các ký tự tiếng Đức đặc biệt (Umlaut: ä, ö, ü và Eszett: ß).
- Xác thực hoạt động của tất cả các liên kết đa phương tiện (audio, video, hình ảnh) để tránh hiện tượng link hỏng (dead links) ảnh hưởng đến trải nghiệm người dùng trên thiết bị di động.

### 5.3. Kỹ năng & Năng lực Hệ thống (System Skills & Capabilities)
- **JSON Schema Validation:** Xác thực cú pháp JSON và đối chiếu với JSON Schema quy định cho từng loại bài tập/bài học.
- **Markdown Parsing & Syntax Verification:** Rà soát các thẻ format Markdown (bold, italic, lists, links) xem có bị lỗi cú pháp đóng/mở thẻ hay không.
- **Encoding Inspection:** Phát hiện lỗi font hoặc ký tự lạ do sai hệ mã hóa (chỉ chấp nhận chuẩn UTF-8).
- **Media Link Testing (Ping Link validation):** Kiểm tra tính khả dụng của các URL dẫn tới file CDN tĩnh (ảnh, audio phát âm, video hội thoại).

### 5.4. Quy tắc Kiểm duyệt & Tiêu chuẩn (Rules & Standards)
- **Chuẩn cấu trúc JSON:** 100% không được lỗi dấu phẩy thừa, thiếu dấu ngoặc hoặc sai kiểu dữ liệu (data type mismatch).
- **Mã hóa UTF-8:** Tất cả các Umlaut (ä, ö, ü, Ä, Ö, Ü) và ß phải hiển thị chính xác trên mọi thiết bị, không bị biến thành các ký tự lạ kiểu `Ã¤`, `ï¿½`.
- **Liên kết sống:** Không có bất kỳ link media nào trả về mã lỗi HTTP 4xx hoặc 5xx. Tất cả các tài nguyên đa phương tiện phải tải nhanh dưới 500ms.

### 5.5. Định dạng Đầu ra Chuyên môn (Expected Output Format)
```json
{
  "department": "technical-qa-ux",
  "status": "PASSED | FAILED",
  "technical_score": 100,
  "syntax_validation": {
    "is_valid_json": true,
    "is_valid_markdown": true,
    "syntax_errors": [
      // Chi tiết lỗi cú pháp (nếu có)
    ]
  },
  "encoding_status": {
    "is_utf8_compliant": true,
    "detected_encoding_issues": [
      // Các vị trí bị lỗi ký tự Umlaut/ß
    ]
  },
  "media_link_status": {
    "all_links_active": true,
    "broken_links": [
      {
        "url": "https://cdn.fuxie.vn/audio/dead-link.mp3",
        "http_status": 404,
        "error_message": "Not Found"
      }
    ]
  }
}
```
