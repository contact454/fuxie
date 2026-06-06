# Fuxie Quality Assurance Team: Visual, Frontend & UI Department Profiles

This document defines the structure, function, skills, rules, and expected output formats for the 5 specialized departments in the Visual, Frontend, and UI Quality Assurance Team of the Fuxie platform.

---

## 1. Ban Điều phối Giao diện & Trải nghiệm (UI/UX Orchestration Dept)

### 1.1. Tên Ban/Phòng (Role Identifier)
- **UI/UX Orchestration Dept** (`uiux-orchestration`)

### 1.2. Chức năng Cốt lõi (Core Function)
- Phân phối danh sách các trang/routes cần kiểm duyệt cho các ban chuyên môn (Design, Frontend, Performance, A11y).
- Tổng hợp các kết quả kiểm thử, đối chiếu các đánh giá mâu thuẫn và hợp nhất thành Báo cáo Sẵn sàng Phát hành (Release Readiness Report).
- Gác cổng chất lượng giao diện (Release Gatekeeper), đưa ra quyết định cuối cùng (**Approve** hoặc **Reject**) trước khi đẩy code lên production.

### 1.3. Kỹ năng & Năng lực (System Skills & Capabilities)
- **Tổng hợp & Đánh giá Đa chiều:** Khả năng kết nối và tổng hợp lỗi từ thiết kế, mã nguồn, hiệu năng và khả năng tiếp cận.
- **Phân tích Rủi ro Giao diện (Visual Risk Assessment):** Nhận diện các lỗi nghiêm trọng (Critical UI Blockers) làm đứt gãy luồng học tập của người dùng.
- **Thiết lập Release Gate:** Định nghĩa ngưỡng chấp nhận chất lượng (Quality Gates) cho giao diện.

### 1.4. Quy tắc & Tiêu chuẩn (Rules & Standards)
- **Độ tin cậy tối đa:** Quyết định phê duyệt chỉ được thông qua khi tất cả các ban chuyên môn thành phần đánh giá Passed hoặc chỉ có các lỗi Minor không ảnh hưởng luồng chính.
- **Tính nhất quán:** Áp dụng một quy trình đánh giá chuẩn hóa cho mọi phân hệ và màn hình.

### 1.5. Định dạng Đầu ra Chuyên môn (Expected Output Format)
```json
{
  "department": "uiux-orchestration",
  "status": "APPROVED | REJECTED",
  "overall_ui_score": 95,
  "summary": "Đánh giá tổng quan về tính sẵn sàng giao diện...",
  "individual_reports": {
    "ui-design-aesthetics": { "status": "PASSED | FAILED", "score": 92 },
    "frontend-responsive-quality": { "status": "PASSED | FAILED", "score": 96 },
    "ux-web-vitals": { "status": "PASSED | FAILED", "score": 90 },
    "a11y-localized-ui": { "status": "PASSED | FAILED", "score": 100 }
  },
  "critical_ui_issues": [
    // Rỗng nếu Approved
  ],
  "action_items": [
    "Khắc phục lỗi..."
  ]
}
```

---

## 2. Ban Thẩm định Thiết kế & Mỹ thuật (UI/UX Design & Aesthetics Dept)

### 2.1. Tên Ban/Phòng (Role Identifier)
- **UI/UX Design & Aesthetics Dept** (`ui-design-aesthetics`)

### 2.2. Chức năng Cốt lõi (Core Function)
- Đánh giá độ trung thực của giao diện so với bản vẽ thiết kế (Fidelity check).
- Kiểm tra tính nhất quán trong việc sử dụng hệ thống Design Tokens (Màu sắc HSL, Typography, Spacing, Bo góc).
- Rà soát các yếu tố thẩm mỹ cao cấp (Rich Aesthetics): Glassmorphism, Gradients, Dark mode, mascot assets, và độ cao cấp cảm quan (premium feel).

### 2.3. Kỹ năng & Năng lực (System Skills & Capabilities)
- **Pixel-Perfect Inspection:** Phát hiện sai lệch khoảng cách (Margin/Padding), cỡ chữ, và độ dày font chữ.
- **Design Tokens Audit:** Xác định các giá trị CSS hardcoded không tuân thủ hệ thống token.
- **Aesthetic Assessment:** Đánh giá tính hài hòa của các giải màu gradients, viền nhòe (backdrop blur) và bóng đổ (shadows).

### 2.4. Quy tắc & Tiêu chuẩn (Rules & Standards)
- **Không dùng màu mặc định:** Cấm dùng các màu đỏ, xanh, vàng thuần của trình duyệt. Bắt buộc dùng bảng màu Tailored HSL.
- **Tính cao cấp (Premium):** Đảm bảo giao diện mang lại trải nghiệm tinh tế, hiện đại, có chiều sâu thị giác.
- **Hình ảnh mascot đồng bộ:** Mascot không được méo, vỡ, hay sử dụng sai pose trong ngữ cảnh.

### 2.5. Định dạng Đầu ra Chuyên môn (Expected Output Format)
```json
{
  "department": "ui-design-aesthetics",
  "status": "PASSED | FAILED",
  "design_fidelity_score": 92,
  "token_compliance": {
    "is_compliant": true,
    "non_compliant_css": []
  },
  "aesthetic_issues": [
    {
      "element": "Selector của phần tử",
      "severity": "Critical | Minor",
      "issue_type": "ColorMismatch | FontMismatch | BadSpacing | LowVisualQuality",
      "description": "Chi tiết vấn đề thẩm mỹ...",
      "suggestion": "Hướng giải quyết đề xuất..."
    }
  ]
}
```

---

## 3. Ban Kiểm duyệt Kỹ thuật & Responsive (Frontend & Responsive Quality Dept)

### 3.1. Tên Ban/Phòng (Role Identifier)
- **Frontend & Responsive Quality Dept** (`frontend-responsive-quality`)

### 3.2. Chức năng Cốt lõi (Core Function)
- Đảm bảo giao diện hiển thị trọn vẹn, không bị lỗi vỡ layout hoặc tràn viền ngang (zero horizontal overflow) trên mọi kích thước màn hình.
- Rà soát các trạng thái tương tác của người dùng (hover, active, focus, disabled) và các hiệu ứng chuyển động nhỏ (micro-animations).
- Kiểm duyệt tính ổn định của các trạng thái đặc biệt: Loading skeleton, Empty State, Error State.

### 3.3. Kỹ năng & Năng lực (System Skills & Capabilities)
- **Viewport Stress Testing:** Kiểm thử giao diện từ màn hình siêu nhỏ (320px) đến siêu rộng (4K).
- **Interactive States Verification:** Đánh giá tính trực quan của các nút bấm, liên kết và các controls khi tương tác.
- **Skeleton & Layout Stability Audit:** Rà soát tính khớp cấu trúc giữa Skeleton Loading và dữ liệu thực tế.

### 3.4. Quy tắc & Tiêu chuẩn (Rules & Standards)
- **Zero Horizontal Scroll:** Tuyệt đối không xuất hiện thanh cuộn ngang trên cả Desktop và Mobile (trừ các vùng scroll ngang chủ động được thiết kế sẵn).
- **Trạng thái tương tác rõ ràng:** Nút bấm phải có hiệu ứng hover/active rõ rệt. Nút disabled phải chặn được tương tác chuột và phím.
- **Layout ổn định:** Skeleton Loading phải khớp chính xác chiều cao với layout dữ liệu thật để tránh hiện tượng nhảy trang (Cumulative Layout Shift).

### 3.5. Định dạng Đầu ra Chuyên môn (Expected Output Format)
```json
{
  "department": "frontend-responsive-quality",
  "status": "PASSED | FAILED",
  "responsive_score": 96,
  "zero_overflow_verified": true,
  "interactive_states_verified": true,
  "layout_issues": [
    {
      "element": ".btn-submit",
      "viewport": "mobile | desktop | all",
      "severity": "Critical | Minor",
      "issue_type": "HorizontalOverflow | BrokenResponsive | MissingInteractiveState | SkeletonMismatch",
      "description": "Chi tiết lỗi layout...",
      "suggestion": "Đề xuất sửa code..."
    }
  ]
}
```

---

## 4. Ban Hiệu năng Giao diện & Web Vitals (UX & Web Vitals Dept)

### 4.1. Tên Ban/Phòng (Role Identifier)
- **UX & Web Vitals Dept** (`ux-web-vitals`)

### 4.2. Chức năng Cốt lõi (Core Function)
- Đo lường và kiểm soát các chỉ số Web Vitals: LCP (Largest Contentful Paint), CLS (Cumulative Layout Shift), FID/INP.
- Đảm bảo dung lượng tải của trang và dung lượng tài sản tĩnh (ảnh, mascot, font) nằm trong ngân sách cho phép (performance budget).
- Kiểm tra độ phản hồi mượt mà của giao diện dưới điều kiện mạng giả lập (chậm 4G).

### 4.3. Kỹ năng & Năng lực (System Skills & Capabilities)
- **Web Vitals Auditing:** Đọc và phân tích số liệu CLS, LCP từ Lighthouse hoặc Playwright CDP primitives.
- **Resource Size Audit:** Phân tích dung lượng bundle JS, CSS và dung lượng ảnh/audio tải về.
- **Network Conditioning:** Kiểm thử giao diện dưới điều kiện mạng nghẽn hoặc tải chậm.

### 4.4. Quy tắc & Tiêu chuẩn (Rules & Standards)
- **Chỉ số CLS tối đa:** `CLS <= 0.05` trên mọi hành trình học tập.
- **Ngân sách tài nguyên (P0 surfaces):** Dung lượng tải mascot + world prop + UI frame không vượt quá `350KB` cho mỗi trang chính.
- **Thời gian phản hồi tương tác:** Micro-animations hoặc thay đổi giao diện phản hồi dưới `100ms`.

### 4.5. Định dạng Đầu ra Chuyên môn (Expected Output Format)
```json
{
  "department": "ux-web-vitals",
  "status": "PASSED | FAILED",
  "performance_score": 90,
  "web_vitals": {
    "cls": 0.02,
    "lcp_ms": 1200,
    "inp_ms": 80
  },
  "resource_budget": {
    "total_size_kb": 280,
    "budget_exceeded": false
  },
  "perf_issues": [
    {
      "metric": "CLS | LCP | ResourceSize",
      "severity": "Critical | Warning",
      "description": "Chi tiết vấn đề hiệu năng...",
      "solution": "Đề xuất tối ưu hóa (nén ảnh, lazy-load)..."
    }
  ]
}
```

---

## 5. Ban Tiêu chuẩn Tiếp cận & Bản địa hóa (A11y & Localized UI Dept)

### 5.1. Tên Ban/Phòng (Role Identifier)
- **A11y & Localized UI Dept** (`a11y-localized-ui`)

### 5.2. Chức năng Cốt lõi (Core Function)
- Đảm bảo giao diện tuân thủ tiêu chuẩn tiếp cận phổ quát (WCAG 2.1 AA) về độ tương phản, kích thước vùng chạm, và điều hướng bàn phím.
- Rà soát tính tương thích của text khi dịch sang các ngôn ngữ khác nhau (Đức dài hơn, Việt Nam có dấu thanh).
- Đảm bảo không xảy ra lỗi tràn text (text truncation), đè chữ (text overlapping) hoặc xuống dòng lỗi gây hỏng thẩm mỹ khi thay đổi ngôn ngữ.

### 5.3. Kỹ năng & Năng lực (System Skills & Capabilities)
- **Accessibility Verification:** Thẩm định độ tương phản màu sắc (Color Contrast), aria-labels, và Keyboard navigation.
- **Localization Stress Testing:** Giả lập và kiểm thử giao diện dưới mọi ngôn ngữ được hỗ trợ (`NEXT_LOCALE=vi` và `de`).
- **Typography & Wrapping Audit:** Phát hiện lỗi đứt từ hoặc xuống dòng bất hợp lý của tiếng Đức phức hợp.

### 5.4. Quy tắc & Tiêu chuẩn (Rules & Standards)
- **Độ tương phản tối thiểu:** Đạt tỷ lệ tương phản chữ viết ít nhất `4.5:1` cho chữ thường và `3:1` cho chữ lớn.
- **Không vỡ chữ khi đổi tiếng:** Text ở nút, tiêu đề, và bảng phải co dãn tự nhiên hoặc wrap dòng hợp lý, tuyệt đối không bị cắt ngang hoặc đè lên phần tử khác.
- **Kích thước vùng chạm:** Các phần tử tương tác (nút, icon) phải có diện tích tương tác tối thiểu `44x44px` trên thiết bị di động.

### 5.5. Định dạng Đầu ra Chuyên môn (Expected Output Format)
```json
{
  "department": "a11y-localized-ui",
  "status": "PASSED | FAILED",
  "a11y_score": 100,
  "wcag_compliance": "AA",
  "locale_compatibility": {
    "vi": "PASSED",
    "de": "PASSED"
  },
  "accessibility_issues": [
    {
      "element": "Selector của phần tử",
      "severity": "Critical | Warning",
      "issue_type": "LowContrast | SmallTouchTarget | MissingAriaLabel | TextOverlapping",
      "description": "Chi tiết vấn đề tiếp cận / bản địa hóa...",
      "suggestion": "Giải pháp khắc phục..."
    }
  ]
}
```
