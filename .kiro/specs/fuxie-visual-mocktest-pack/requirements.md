# Requirements Document

Status: Approved by Codex
Last Reviewed: 2026-05-17T00:00:00Z

## Introduction

Spec `fuxie-visual-mocktest-pack` định nghĩa một **bộ ảnh mocktest chuẩn nghiệm thu** (Visual Mocktest Pack) cho từng module chính của sản phẩm Fuxie. Sản phẩm của spec này KHÔNG phải là code của các module; sản phẩm của spec này là **các artifact thiết kế** (PNG mock + tài liệu QA + tài liệu implementation notes + tài liệu provenance prompt) đặt dưới `docs/design/fuxie-visual-mocktests/`. Mỗi mocktest đóng vai trò "visual target" mà mọi implementation về sau phải bám theo, thay cho việc engineer tự suy diễn UI từ mô tả văn bản.

Pack được lấy cảm hứng kỹ thuật từ Mykonos (isometric/world/canvas/camera/tile staging) và lấy cảm hứng concept từ Two Point Campus (campus vui nhộn, module có chức năng rõ, learning destinations có "tính cách"). Tuy nhiên, asset, nhân vật, place name, UI, theme và IP của hai nguồn cảm hứng đó **KHÔNG** được copy. Tất cả phải kết tinh thành một Fuxie original visual identity riêng.

Spec này có 3 cổng (gate) bắt buộc trước khi bất kỳ ảnh nào được render hoặc bất kỳ module nào được implement:

1. `requirements.md` được Codex duyệt.
2. `design.md` được Codex duyệt.
3. `tasks.md` được Codex duyệt.

Trước khi cả 3 cổng trên đóng dấu OK, cấm gen ảnh và cấm viết code module.

## Roles

- Vai chinh: Product Designer
- Vai phoi hop: Product Manager EdTech, QA Automation Engineer, CTO/Tech Lead

## Glossary

- **Mocktest_Pack**: Toàn bộ artifact đặt tại `docs/design/fuxie-visual-mocktests/`, gồm 1 README + 18 thư mục module + các file bắt buộc bên trong. Đây là deliverable của spec này.
- **Module_Folder**: Một thư mục con trong Mocktest_Pack tương ứng với một module Fuxie (ví dụ `01-dashboard`). Có đúng 18 module folder, đánh số `00`..`17`.
- **Mock**: Một ảnh PNG mô tả trạng thái cuối của UI một module. Có 3 loại mock bắt buộc: `mock-desktop.png`, `mock-mobile.png`, `mock-state.png`.
- **Mock_Desktop**: Ảnh `mock-desktop.png`, render UI module ở viewport desktop tham chiếu.
- **Mock_Mobile**: Ảnh `mock-mobile.png`, render UI module ở viewport mobile 390×844.
- **Mock_State**: Ảnh `mock-state.png`, render đúng MỘT trạng thái phụ quan trọng (ví dụ empty state, loading, success, error, hoặc trạng thái tương tác chính) của module. V0 của Mocktest_Pack chỉ hỗ trợ một file Mock_State duy nhất cho mỗi Module_Folder; multi-state mocks là Non-Goal của V0 và được hoãn sang V2.
- **Style_Master**: Module `00-style-master`, định nghĩa ngôn ngữ visual gốc của Fuxie (token màu, typography, spacing, mascot tone, illustration style, isometric staging convention) mà 17 module còn lại phải kế thừa.
- **Module_Identity**: Tập đặc trưng visual giúp một module được nhận diện riêng biệt trong vòng 3 giây (ví dụ palette phụ, biểu tượng chủ đạo, layout signature, learning intent prop) trong khi vẫn nhất quán với Style_Master.
- **Visual_Target_Score**: Điểm chấm 0–100 cho từng module dựa trên rubric trong spec này. Điểm sàn để mở cổng implement code module là **>= 80/100**.
- **QA_Checklist**: File `qa-checklist.md` trong mỗi Module_Folder; danh sách các điểm kiểm tra QA dùng để chấm Visual_Target_Score và để Frontend Engineer/QA tự kiểm trước khi nói "module đạt visual target".
- **Implementation_Notes**: File `implementation-notes.md` trong mỗi Module_Folder; ghi chú kỹ thuật phục vụ việc implement đúng visual target (token, layout grid, breakpoint, component reuse, motion, accessibility).
- **Generation_Prompt_Notes**: File `generation-prompt.md` trong mỗi Module_Folder; lưu provenance của ảnh mock (positive prompt, negative prompt, visual intent, module identity cues, originality guardrails, forbidden IP references, model/tool/seed nếu có, reviewer, ngày) để Codex và Pack_Owner truy vết được mọi ảnh đã render.
- **Inspiration_Sources**: Mykonos và Two Point Campus, dùng làm cảm hứng kỹ thuật và cảm hứng concept. Không được dùng làm nguồn copy.
- **Originality_Guardrail**: Quy tắc cấm copy asset, nhân vật, place name, UI, theme, IP từ Inspiration_Sources.
- **Workflow_Gate**: Bộ 3 cổng duyệt (`requirements.md` → `design.md` → `tasks.md`) phải được Codex duyệt tuần tự trước khi bất kỳ ảnh nào được gen hay bất kỳ module nào được implement. Workflow_Gate là quy tắc văn bản quan sát được (manual observable rule), không phải automation.
- **Pack_Owner**: Product Designer, role chính sở hữu Mocktest_Pack.
- **Style_Master_Owner**: Design System Designer, sở hữu nội dung và token của `00-style-master`.
- **Priority_Owner**: Product Manager EdTech, sở hữu thứ tự ưu tiên giữa các module.
- **QA_Owner**: QA Automation Engineer, sở hữu rubric chấm Visual_Target_Score và kiểm tra QA_Checklist từng module.

## Requirements

### Requirement 1: Phạm vi pack và cấu trúc deliverable

**User Story:** Là Product Designer của Fuxie, tôi muốn Mocktest_Pack có cấu trúc thư mục và filename cố định, để mọi role downstream (Frontend Engineer, QA, PM) tìm visual target đúng chỗ mà không phải đoán.

#### Acceptance Criteria

1. THE Mocktest_Pack SHALL được đặt tại đường dẫn tương đối `docs/design/fuxie-visual-mocktests/` tính từ root của repository, với tên thư mục phân biệt chữ hoa/chữ thường đúng chính tả.
2. THE Mocktest_Pack SHALL chứa đúng một file README ở root tại đường dẫn `docs/design/fuxie-visual-mocktests/README.md`, không cho phép tồn tại bất kỳ file README nào khác (ví dụ `Readme.md`, `readme.txt`) ở cùng cấp.
3. THE Mocktest_Pack SHALL chứa đúng 18 Module_Folder ở cấp con trực tiếp của root, với tên cố định, viết thường, và đúng thứ tự liệt kê: `00-style-master`, `01-dashboard`, `02-course`, `03-session`, `04-review`, `05-vocabulary`, `06-grammar`, `07-listening`, `08-speaking`, `09-reading`, `10-writing`, `11-exam`, `12-rewards`, `13-missions`, `14-chat`, `15-profile`, `16-teacher`, `17-admin`.
4. WHERE một Module_Folder tồn tại trong Mocktest_Pack, THE Mocktest_Pack SHALL chứa đúng 6 file bắt buộc ở cấp con trực tiếp của Module_Folder đó với tên đúng chính tả, viết thường, và đúng phần mở rộng: `mock-desktop.png`, `mock-mobile.png`, `mock-state.png`, `qa-checklist.md`, `implementation-notes.md`, `generation-prompt.md`, trong đó mỗi file phải có kích thước lớn hơn 0 byte và Mocktest_Pack chỉ chứa duy nhất một file `mock-state.png` cho mỗi Module_Folder (multi-state mocks bị cấm trong V0 theo Non-Goals).
5. IF một Module_Folder thiếu bất kỳ một trong 6 file bắt buộc, hoặc chứa file có kích thước 0 byte, hoặc sai tên/sai phần mở rộng so với tiêu chí 4, hoặc chứa thêm file `mock-state-*.png` ngoài file `mock-state.png` duy nhất, THEN THE Workflow_Gate SHALL đánh dấu Module_Folder đó là "không đạt", chặn nó khỏi cổng "approved visual target", và ghi vào README một dòng trạng thái dạng "BLOCKED: <module-folder> – missing/invalid: <danh sách file>" để Pack_Owner và downstream role nhận biết.
6. THE README SHALL liệt kê đầy đủ 18 Module_Folder theo đúng thứ tự ở tiêu chí 3, mỗi mục gồm: liên kết tương đối tới folder, mô tả learning intent dài từ 1 đến 200 ký tự trên một dòng duy nhất, và không được để trống.
7. THE README SHALL có một mục "Workflow_Gate" nêu rõ thứ tự cố định `requirements.md` → `design.md` → `tasks.md` → render mocks → implement, và một mục "Originality_Guardrail" nêu quy tắc cấm sao chép visual từ sản phẩm của bên thứ ba, sao cho hai reviewer độc lập đọc README đều xác định được cùng một thứ tự bước và cùng một phạm vi cấm.
8. IF Mocktest_Pack chứa bất kỳ Module_Folder nào ngoài 18 folder liệt kê ở tiêu chí 3, THEN THE Workflow_Gate SHALL coi Mocktest_Pack là không đạt, trừ khi README có một mục "Scope Change" ghi rõ tên folder mới, ngày phê duyệt theo định dạng `YYYY-MM-DD`, và chữ ký dạng văn bản của cả Pack_Owner và Priority_Owner.
9. THE Mocktest_Pack SHALL không chứa file hoặc folder ẩn (tên bắt đầu bằng `.`) ở cấp root và cấp Module_Folder, ngoại trừ các file do hệ thống version control yêu cầu được liệt kê tường minh trong README.
10. WHEN Pack_Owner cập nhật bất kỳ một trong 6 file bắt buộc trong một Module_Folder, THE Pack_Owner SHALL cập nhật README trong cùng lần thay đổi để giữ liên kết tương đối và mô tả learning intent đồng bộ với nội dung thực tế của Module_Folder đó.

### Requirement 2: Style_Master làm nguồn ngôn ngữ visual gốc

**User Story:** Là Design System Designer, tôi muốn `00-style-master` là nguồn duy nhất định nghĩa ngôn ngữ visual của Fuxie, để 17 module còn lại không tự sinh token, palette, typography lệch chuẩn.

#### Acceptance Criteria

1. THE Style_Master SHALL định nghĩa trong `mock-desktop.png`, `mock-mobile.png`, và `mock-state.png` đầy đủ 10 yếu tố visual sau với mỗi yếu tố có nhãn nhận diện rõ ràng trên mock: (a) bảng màu chính tối thiểu 5 token màu, (b) bảng màu phụ tối thiểu 3 token màu, (c) bậc typography tối thiểu 5 cấp (heading, subheading, body, caption, label), (d) bậc spacing tối thiểu 5 cấp, (e) bo góc tối thiểu 3 cấp, (f) đổ bóng tối thiểu 2 cấp, (g) icon style với mẫu tối thiểu 6 icon học tập, (h) mascot tone với tối thiểu 1 mẫu mascot, (i) illustration style với tối thiểu 2 mẫu minh hoạ, (j) quy ước isometric staging với tối thiểu 1 mẫu khung dựng.
2. THE Style_Master SHALL có `implementation-notes.md` liệt kê đầy đủ: tên token màu kèm giá trị HEX hoặc tham chiếu rõ ràng tới design system hiện tại của Fuxie cho mỗi token được hiển thị trong mock, tên token typography kèm cỡ chữ và line-height, tên token spacing kèm giá trị số, danh sách breakpoint kèm giá trị số, và quy ước responsive mô tả hành vi tại từng breakpoint.
3. WHERE một Module_Folder khác `00-style-master` tồn tại, THE Module_Folder đó SHALL kế thừa toàn bộ token và quy ước được định nghĩa trong Style_Master và SHALL không khai báo token mới trong `implementation-notes.md` của module mà không kèm tham chiếu rõ ràng tới token tương ứng trong Style_Master.
4. IF một Module_Folder khai báo token hoặc pattern không tham chiếu được tới Style_Master, THEN THE hệ thống review SHALL từ chối Module_Folder đó với chỉ báo lỗi nêu rõ token vi phạm và Module_Folder SHALL giữ nguyên trạng thái block cho đến khi token được tham chiếu hợp lệ.
5. IF một Module_Folder cần token hoặc pattern chưa có trong Style_Master, THEN THE Module_Folder đó SHALL ghi yêu cầu mở rộng vào `implementation-notes.md` với tên token đề xuất, mô tả nhu cầu sử dụng, và module yêu cầu, và SHALL giữ trạng thái block cho tới khi Style_Master_Owner cập nhật Style_Master và xác nhận token mở rộng đã có mặt trong Style_Master.
6. THE Style_Master SHALL không chứa nội dung học cụ thể của bất kỳ module nào (không bao gồm dashboard, vocabulary, hoặc nội dung học của 17 module còn lại); nội dung của Style_Master SHALL chỉ giới hạn trong ngôn ngữ visual nền gồm 10 yếu tố nêu tại tiêu chí 1.
7. WHEN Style_Master_Owner thay đổi bất kỳ token nào trong Style_Master, THE Style_Master SHALL được cập nhật trước trong `mock-*.png` và `implementation-notes.md`, sau đó toàn bộ Module_Folder phụ thuộc SHALL được rà soát lại Visual_Target_Score và mỗi Module_Folder bị ảnh hưởng SHALL có Visual_Target_Score được ghi lại sau rà soát.
8. IF một Module_Folder phụ thuộc có Visual_Target_Score sau rà soát thấp hơn ngưỡng đã ký kết tại lần đánh giá trước, THEN THE Module_Folder đó SHALL được đánh dấu cần cập nhật và SHALL giữ trạng thái block cho tới khi Visual_Target_Score đạt lại ngưỡng đã ký kết.

### Requirement 3: Module Identity và tính nhất quán

**User Story:** Là người học mở app Fuxie, tôi muốn nhận ra mình đang ở module nào trong vòng 3 giây mà vẫn cảm thấy app là một sản phẩm thống nhất, để tôi không bị lạc giữa các khu vực.

#### Acceptance Criteria

1. THE 17 Module_Folder ngoài `00-style-master` SHALL có Module_Identity riêng biệt được khai báo tường minh trong Implementation_Notes của Module_Folder, thể hiện sự khác biệt rõ ở **ít nhất 2 trong 4 chiều** sau so với mọi Module_Folder khác trong pack: (a) palette phụ, (b) biểu tượng chủ đạo, (c) layout signature, (d) learning intent prop.
2. WHEN một người chấm độc lập (chưa biết tên module) xem `mock-desktop.png` của một Module_Folder trong tối đa 3 giây và được yêu cầu chọn learning intent đúng từ một danh sách 18 lựa chọn (mỗi lựa chọn không quá 80 ký tự), THE Mock_Desktop SHALL truyền tải đủ tín hiệu visual để người chấm chọn đúng learning intent của Module_Folder đó mà không cần đọc nội dung văn bản dài trong mock.
3. THE 18 Module_Folder SHALL cùng chia sẻ Style_Master tokens (màu nền cơ bản, typography scale, mascot tone, isometric staging convention) sao cho không Module_Folder nào override Style_Master tokens ngoài phạm vi đã khai báo trong Implementation_Notes.
4. IF tối thiểu 2 trong 5 người chấm độc lập không phân biệt được hai Module_Folder bất kỳ trong vòng 3 giây, hoặc hai Module_Folder đó khác biệt ở ít hơn 2 trong 4 chiều ở tiêu chí 1, THEN cả hai Module_Folder SHALL bị đánh giá fail tiêu chí "Module Identity Distinctness" và phải sửa trước khi chấm Visual_Target_Score; trong thời gian sửa, asset trong Mock_Desktop, Mock_Mobile, Mock_State của cả hai Module_Folder SHALL được giữ nguyên (không xoá) để phục vụ đối chiếu redesign.
5. THE Module_Identity SHALL không phụ thuộc vào việc đọc tiêu đề trang để nhận ra Module_Folder; nhận diện SHALL đạt được qua visual cue (palette, biểu tượng, layout, prop) trong vùng nhìn đầu tiên không cần scroll.
6. WHERE một Module_Folder có nhiều sub-flow (ví dụ Course có "course list" và "course detail"), THE Module_Folder SHALL chọn đúng một flow đại diện cho `mock-desktop.png` và `mock-mobile.png`, và SHALL chọn tối đa MỘT sub-flow duy nhất để đi vào `mock-state.png`; sub-flow phụ này SHALL được Pack_Owner duyệt bằng văn bản trong Implementation_Notes của Module_Folder, và mọi sub-flow phụ khác SHALL được ghi nhận là deferred sang V2 trong Implementation_Notes thay vì render thêm file.
7. IF Implementation_Notes của một Module_Folder không khai báo Module_Identity theo 4 chiều ở tiêu chí 1, hoặc thiếu một trong các file Mock_Desktop/Mock_Mobile/Mock_State, THEN Module_Folder đó SHALL bị fail tiêu chí "Module Identity Completeness" với phản hồi rõ ràng cho Pack_Owner nêu chiều thiếu hoặc file thiếu, và SHALL không được chấm Visual_Target_Score cho tới khi bổ sung đủ.
8. WHEN một Module_Folder bị fail tiêu chí "Module Identity Distinctness" hoặc "Module Identity Completeness" theo tiêu chí 4 hoặc tiêu chí 7, THE Workflow_Gate SHALL chặn Visual_Target_Score của Module_Folder đó cho tới khi Pack_Owner xác nhận sửa đạt và ghi nhận trạng thái pass mới trong QA_Checklist.

### Requirement 4: Tiêu chí visual chung cho mỗi mock

**User Story:** Là Frontend Engineer chuẩn bị implement, tôi muốn mỗi mock đáp ứng tiêu chí readability cố định (3 giây hiểu intent, không tràn ngang trên 390×844, contrast đủ), để khi tôi build theo mock thì sản phẩm cuối cũng đạt tiêu chí này.

#### Acceptance Criteria

1. WHEN người chấm xem `mock-desktop.png` hoặc `mock-mobile.png` của bất kỳ Module_Folder nào trong tối đa 3 giây (đo bằng đồng hồ bấm giây, ngưỡng 3000 ms), THE Mock_Desktop hoặc Mock_Mobile SHALL truyền tải được learning intent chính (Requirement 3, tiêu chí 2) và CTA chính của màn hình, trong đó CTA chính SHALL được thể hiện như một control duy nhất nổi bật nhất (kích thước hoặc độ tương phản cao nhất so với các control khác trên cùng màn hình).
2. THE Mock_Mobile SHALL được thiết kế cho viewport tham chiếu chính xác 390×844 (chiều rộng 390 px, chiều cao 844 px) và SHALL không có nội dung quan trọng (CTA chính, tiêu đề màn hình, nội dung learning intent chính, control state hiển thị tiến trình) bị cắt bởi cạnh phải hoặc cạnh dưới của viewport; "bị cắt" được định nghĩa là bất kỳ phần nào của bounding box nội dung nằm ngoài vùng 0–390 px theo trục X hoặc 0–844 px theo trục Y ở trạng thái khởi tạo (chưa scroll).
3. THE Mock_Mobile SHALL được vẽ sao cho implementation tương ứng không tạo horizontal overflow ở viewport 390×844; do đó mock SHALL không chứa hàng nội dung yêu cầu chiều rộng vượt 390 px trừ padding (ví dụ table từ 5 cột trở lên không có cuộn ngang, card grid không xuống dòng với từ 3 card trở lên trên một hàng).
4. THE Mock_Desktop, Mock_Mobile, và Mock_State SHALL có tỉ lệ tương phản giữa text chính và nền chính tối thiểu 4.5:1 (WCAG AA cho text body kích thước < 18 px hoặc < 14 px đậm) và giữa text phụ/chip/control state và nền tương ứng tối thiểu 3:1 (WCAG AA cho non-text/large text), đo bằng công cụ kiểm tra contrast tiêu chuẩn trên ảnh mock đã render với tối thiểu 3 cặp text/nền đại diện cho mỗi mock.
5. THE Mock_Mobile SHALL giữ kích thước font body tham chiếu sao cho khi map sang implementation ở viewport 390×844, font body SHALL không nhỏ hơn 14 px hiệu dụng và font phụ (caption, helper text, label) SHALL không nhỏ hơn 12 px hiệu dụng.
6. IF Implementation_Notes của một Module_Folder liệt kê nhiều hơn một candidate sub-state, THEN Pack_Owner SHALL chọn đúng một sub-state cho `mock-state.png`; các sub-state còn lại SHALL được ghi rõ là deferred sang V2 trong Implementation_Notes và SHALL KHÔNG được render trong V0; THE Mock_State SHALL render đúng một trạng thái phụ duy nhất được chỉ định và SHALL không trộn nhiều trạng thái phụ vào cùng một ảnh.
7. WHERE Module_Folder có cảnh isometric/world/canvas/camera/tile staging, THE Mock_Desktop, Mock_Mobile, và Mock_State SHALL thể hiện rõ tile grid (đường ranh giữa các tile có thể nhìn thấy được hoặc landmark visual đại diện), depth ordering (thứ tự lớp trước/sau giữa các đối tượng nhất quán), và camera framing (vùng nhìn của camera so với world cố định) để engineer dùng làm tham chiếu staging; điều này KHÔNG yêu cầu copy bất kỳ asset nào của Inspiration_Sources.
8. IF một Mock_Desktop, Mock_Mobile, hoặc Mock_State không đạt đồng thời cả ba tiêu chí "3 giây intent" (tiêu chí 1), "không tràn ngang ở 390×844" (tiêu chí 2 và 3, chỉ áp dụng cho Mock_Mobile), và "contrast đạt WCAG AA cho text/chip/control" (tiêu chí 4), THEN mock đó SHALL bị đánh dấu fail kèm tiêu chí cụ thể không đạt, SHALL bị loại khỏi Visual_Target_Score, và SHALL phải được redesign trước khi được chấm lại.
9. IF một Module_Folder thiếu một trong các file bắt buộc (Mock_Desktop, Mock_Mobile, Mock_State, Implementation_Notes) hoặc file tồn tại nhưng không mở được như ảnh hợp lệ, THEN Module_Folder đó SHALL bị đánh dấu fail visual review và SHALL không được tính vào Visual_Target_Score cho đến khi bổ sung đủ và hợp lệ.
10. WHEN người chấm hoàn tất review một Module_Folder, THE quy trình chấm SHALL ghi nhận kết quả pass/fail riêng cho từng tiêu chí từ 1 đến 7 vào một bảng kết quả của Module_Folder, để hai người chấm độc lập có thể đối chiếu kết luận.

### Requirement 5: Hợp đồng artifact của Mock_Desktop, Mock_Mobile, Mock_State

**User Story:** Là QA Automation Engineer, tôi muốn biết chính xác mỗi loại mock phải thể hiện gì, để tôi viết được rubric chấm và đối chiếu implementation về sau.

#### Acceptance Criteria

1. THE Mock_Desktop SHALL render trạng thái mặc định ("default happy state") của module ở viewport desktop tham chiếu 1440×900 px, bao gồm đồng thời: (a) navigation/khung chính hiển thị đầy đủ không bị cắt, (b) vùng nội dung chính chiếm tối thiểu 60% chiều rộng viewport, (c) đúng một CTA chính ở trạng thái enabled với label không rỗng, và (d) ít nhất một dấu hiệu Module_Identity (logo, tên module, hoặc icon đặc trưng) nằm trong vùng hiển thị đầu tiên không cần scroll.
2. THE Mock_Mobile SHALL render cùng module ở viewport 390×844 px, bao gồm đồng thời: (a) header thu gọn với chiều cao tối đa 64 px, (b) vùng nội dung chính hiển thị không cần scroll ngang, (c) đúng một CTA chính ở trạng thái enabled với label không rỗng, và (d) tuân thủ ràng buộc không tràn ngang theo Requirement 4.
3. THE Mock_State SHALL render đúng một trong các trạng thái phụ sau (do Pack_Owner chọn cho từng module và ghi rõ tên trạng thái cùng lý do chọn trong Implementation_Notes của Module_Folder tương ứng): empty state, loading state, success state, error/edge state, hoặc trạng thái tương tác chính (ví dụ "đang làm bài", "đang chấm").
4. WHEN cả Mock_Desktop và Mock_Mobile được tạo cho cùng một Module_Folder, THE Mock_Desktop và Mock_Mobile SHALL render cùng module ở cùng flow đại diện đã chọn ở Requirement 3 tiêu chí 6, với cùng tiêu đề module, cùng CTA chính (cùng label), và cùng nội dung dữ liệu mẫu.
5. WHERE Mock_State render trạng thái lỗi (error/edge state), THE Mock_State SHALL hiển thị đồng thời: (a) thông điệp lỗi mô tả nguyên nhân ở dạng câu hoàn chỉnh không cụt, (b) ít nhất một lối thoát rõ ràng dưới dạng nút bấm hoặc liên kết có nhãn (retry, back, hoặc liên hệ hỗ trợ), và (c) Module_Identity vẫn nhận diện được để người xem biết đang ở module nào.
6. IF Mock_Desktop, Mock_Mobile và Mock_State của cùng một Module_Folder không cùng kể một câu chuyện về một module duy nhất (khác tên module, khác CTA chính, hoặc khác flow đại diện), THEN Module_Folder đó SHALL bị fail tiêu chí "narrative consistency" và phải sửa trước khi chấm Visual_Target_Score.
7. IF Pack_Owner không ghi rõ tên trạng thái phụ đã chọn cho Mock_State trong Implementation_Notes, THEN Module_Folder đó SHALL bị fail tiêu chí "mock contract completeness" và không được nhận điểm Visual_Target_Score cho đến khi bổ sung thông tin.

### Requirement 6: Hợp đồng nội dung của QA_Checklist

**User Story:** Là QA Automation Engineer, tôi muốn `qa-checklist.md` của mỗi module có cấu trúc thống nhất, để tôi chấm Visual_Target_Score và đối chiếu implementation theo cùng một rubric.

#### Acceptance Criteria

1. THE QA_Checklist SHALL nằm tại đường dẫn `docs/design/fuxie-visual-mocktests/<module-folder>/qa-checklist.md` cho mọi Module_Folder, với tên file viết thường chính xác là `qa-checklist.md` và `<module-folder>` khớp với tên Module_Folder đã đăng ký.
2. THE QA_Checklist SHALL chứa đúng 8 mục bắt buộc, theo đúng thứ tự sau (mỗi mục là một heading cấp 2 `##` riêng biệt): (1) "Learning intent (3s)", (2) "Module identity distinctness", (3) "Style master compliance", (4) "Mobile readability (390×844, no horizontal overflow)", (5) "Contrast (text/chip/control)", (6) "State coverage (desktop/mobile/state)", (7) "Originality (no Inspiration_Sources copy)", (8) "Visual Target Score".
3. THE QA_Checklist SHALL áp dụng mô hình chấm điểm chia làm hai nhóm: 6 trong 8 heading mang trọng số điểm theo Requirement 8 và đóng góp vào Visual_Target_Score, 1 heading duy nhất là pass/fail gate KHÔNG có trọng số ("State coverage (desktop/mobile/state)"), và 1 heading là roll-up tổng hợp KHÔNG có trọng số riêng ("Visual Target Score"); ánh xạ giữa heading QA_Checklist và chiều trọng số trong Requirement 8 SHALL được thực hiện như sau: "Learning intent (3s)" → "Learning intent in 3s" (20 điểm), "Module identity distinctness" → "Module identity distinctness" (15 điểm; với `00-style-master` thay bằng "Token coverage cho 17 module downstream" 15 điểm theo Requirement 8 tiêu chí 2), "Style master compliance" → "Style master compliance" (15 điểm), "Mobile readability (390×844, no horizontal overflow)" → "Mobile readability and no horizontal overflow at viewport 390×844 px" (20 điểm), "Contrast (text/chip/control)" → "Contrast for text/chip/control đạt ngưỡng WCAG AA" (15 điểm), "Originality (no Inspiration_Sources copy)" → "Originality không sao chép Inspiration_Sources" (15 điểm), và "Visual Target Score" → mục tổng hợp roll-up không có trọng số riêng.
4. THE QA_Checklist SHALL đảm bảo tổng điểm của 6 heading mang trọng số đúng bằng 100 điểm (20 + 15 + 15 + 20 + 15 + 15 = 100); heading pass/fail gate duy nhất "State coverage (desktop/mobile/state)" SHALL không có trọng số điểm và SHALL được ghi nhận chỉ ở dạng PASS hoặc FAIL trong QA_Checklist; heading roll-up "Visual Target Score" SHALL không có trọng số riêng và chỉ tổng hợp lại điểm của 6 heading mang trọng số cùng kết quả của pass/fail gate.
5. WHERE Module_Folder là `00-style-master`, THE QA_Checklist SHALL thay heading số 2 "Module identity distinctness" bằng heading "Token coverage" (xác minh Style_Master mô tả đủ token cho 17 Module_Folder còn lại), giữ nguyên 7 heading còn lại và thứ tự của chúng; "Token coverage" mang trọng số 15 điểm thay cho "Module identity distinctness" trong nhóm 6 heading có điểm.
6. IF heading "State coverage (desktop/mobile/state)" trong QA_Checklist của một Module_Folder bị đánh FAIL, THEN cổng sign-off Visual_Target_Score của Module_Folder đó SHALL bị block ngay lập tức bất kể tổng điểm 6 chiều có ≥ 80 hay không, và Module_Folder SHALL giữ trạng thái block cho tới khi pass/fail gate "State coverage (desktop/mobile/state)" được đánh PASS.
7. IF một heading có trọng số trong QA_Checklist được đánh fail (điểm dưới 50% trọng số riêng) hoặc pass/fail gate "State coverage (desktop/mobile/state)" bị đánh FAIL, THEN THE QA_Checklist SHALL bắt buộc ghi rõ ít nhất một hành động khắc phục có thể quan sát được, nêu giá trị/tham chiếu hiện tại và giá trị/tham chiếu mục tiêu (ví dụ "tăng contrast title từ 3.2:1 lên ≥ 4.5:1", "đổi palette phụ vì trùng module 04-grammar", "bổ sung mock-state cho trạng thái lỗi").
8. THE QA_Checklist SHALL không chứa hướng dẫn implement code (mã nguồn, tên hàm, tên class CSS, snippet framework) và SHALL không chứa provenance prompt hay nội dung tạo ảnh; nội dung implement thuộc Implementation_Notes (Requirement 7) và provenance thuộc Generation_Prompt_Notes (Requirement 12).
9. WHEN QA_Owner chấm xong toàn bộ 8 heading, THE QA_Checklist SHALL hiển thị Visual_Target_Score tổng hợp dưới dạng số nguyên 0–100 (tổng điểm của 6 heading mang trọng số) cùng trạng thái pass/fail tổng thể, kết quả PASS/FAIL của pass/fail gate "State coverage (desktop/mobile/state)", tên QA_Owner chấm, và ngày chấm theo định dạng ISO 8601 (YYYY-MM-DD); pass tổng thể yêu cầu Visual_Target_Score ≥ 80, không có chiều trọng số nào dưới 50% trọng số riêng, pass/fail gate "State coverage (desktop/mobile/state)" ở trạng thái PASS, và QA_Owner đã ký duyệt.
10. IF QA_Checklist thiếu bất kỳ heading bắt buộc nào, sai thứ tự, sai bản đồ trọng số ở tiêu chí 3, hoặc tổng điểm của 6 heading mang trọng số khác 100, THEN THE QA_Checklist SHALL bị coi là không hợp lệ và Module_Folder tương ứng SHALL bị đánh dấu chưa đạt cho tới khi QA_Checklist được sửa đúng hợp đồng nội dung.

### Requirement 7: Hợp đồng nội dung của Implementation_Notes

**User Story:** Là Frontend Engineer chuẩn bị implement module sau khi pack được duyệt, tôi muốn `implementation-notes.md` cho tôi đủ thông tin kỹ thuật để build đúng visual target mà không phải đoán.

#### Acceptance Criteria

1. THE Implementation_Notes SHALL nằm tại đường dẫn `docs/design/fuxie-visual-mocktests/<module-folder>/implementation-notes.md` cho mọi Module_Folder, với tên file viết thường chính xác là `implementation-notes.md` và mã hoá UTF-8.
2. THE Implementation_Notes SHALL chứa các mục bắt buộc sau, theo đúng thứ tự, mỗi mục là một heading cấp 2 (`##`) và có nội dung không rỗng (tối thiểu 1 câu hoặc 1 bullet): "Module learning intent", "Layout grid (desktop)", "Layout grid (mobile 390×844)", "Tokens used (color/typography/spacing/radius/shadow từ Style_Master)", "Component reuse (component nào đã có, component nào cần thêm)", "Responsive rules (breakpoint, reflow, ẩn/hiện)", "State chosen for mock-state.png + lý do", "Motion/interaction notes (nếu có)", "Accessibility notes (focus order, ARIA cần lưu ý, contrast cụ thể)", "Originality notes (xác nhận không trùng Inspiration_Sources)".
3. WHERE Module_Folder là `00-style-master`, THE Implementation_Notes SHALL bổ sung mục "Token registry" liệt kê toàn bộ token (tên + giá trị + module dự kiến dùng) thay cho mục "Component reuse", và mục "Token registry" SHALL liệt kê tối thiểu các nhóm token color, typography, spacing, radius, shadow theo đúng phân loại của Style_Master.
4. WHERE một Module_Folder yêu cầu mở rộng Style_Master, THE Implementation_Notes của Module_Folder đó SHALL nêu rõ tên token/component cần Style_Master cập nhật, giá trị đề xuất, và lý do mở rộng (gắn với learning intent hoặc layout cụ thể).
5. THE Implementation_Notes SHALL không chứa code thực thi (không khối code của ngôn ngữ lập trình như JavaScript, TypeScript, CSS, HTML, Python); được phép có pseudo-code dạng mô tả, tên token, tên component, đường dẫn file, breakpoint, kích thước (px/rem), và tham chiếu sang Style_Master.
6. IF Implementation_Notes mâu thuẫn với Mock_Desktop, Mock_Mobile, hoặc Mock_State của cùng Module_Folder ở bất kỳ điểm nào (token đã dùng, layout grid, state được chọn, breakpoint, hoặc component reuse), THEN THE Module_Folder đó SHALL bị fail tiêu chí "spec-mock consistency", THE hệ thống review SHALL ghi rõ điểm mâu thuẫn trong feedback, và Module_Folder SHALL không được chấm Visual_Target_Score cho đến khi mâu thuẫn được sửa.
7. IF Implementation_Notes thiếu bất kỳ mục bắt buộc nào ở tiêu chí 2 (hoặc mục "Token registry" với `00-style-master` ở tiêu chí 3), hoặc có mục bắt buộc nhưng nội dung rỗng, THEN THE Module_Folder đó SHALL bị fail tiêu chí "implementation-notes completeness" và phải bổ sung trước khi pack được duyệt.
8. IF Implementation_Notes tham chiếu token hoặc component không tồn tại trong Style_Master và Module_Folder đó không phải là Module_Folder do Style_Master_Owner phụ trách mở rộng theo tiêu chí 4, THEN THE Module_Folder đó SHALL bị fail tiêu chí "token-component reference validity" và phải sửa tham chiếu hoặc yêu cầu Style_Master_Owner cập nhật Style_Master trước khi pack được duyệt.

### Requirement 8: Visual_Target_Score và cổng sign-off implement

**User Story:** Là Product Manager EdTech, tôi muốn một điểm số khách quan trên thang 100 quyết định module nào được phép vào giai đoạn implement code, để tránh việc engineer code dựa trên mock chưa đủ chất lượng.

#### Acceptance Criteria

1. THE Visual_Target_Score SHALL được tính trên thang số nguyên 0–100 cho mỗi Module_Folder dựa trên rubric gồm 6 chiều có trọng số, với tổng trọng số đúng 100 điểm: "Learning intent in 3s" (20 điểm), "Module identity distinctness" (15 điểm), "Style master compliance" (15 điểm), "Mobile readability and no horizontal overflow at viewport 390×844 px" (20 điểm), "Contrast for text/chip/control đạt ngưỡng WCAG AA (text thường tỉ lệ tương phản ≥ 4.5:1, text lớn và thành phần UI ≥ 3:1)" (15 điểm), "Originality không sao chép Inspiration_Sources" (15 điểm); mỗi chiều SHALL được chấm bằng số nguyên từ 0 tới trọng số tối đa của chiều đó; chỉ "State coverage (desktop/mobile/state)" trong QA_Checklist là pass/fail gate (KHÔNG phải chiều trọng số), được quản lý theo Requirement 6, và FAIL ở gate đó SHALL block cổng sign-off implement theo tiêu chí 4 dưới đây.
2. THE Visual_Target_Score của Module_Folder `00-style-master` SHALL thay chiều "Module identity distinctness" bằng chiều "Token coverage cho 17 module downstream" (15 điểm), giữ nguyên 5 chiều còn lại và tổng trọng số 100 điểm.
3. WHEN Visual_Target_Score của một Module_Folder đạt ≥ 80/100, không có chiều trọng số nào dưới 50% trọng số riêng của chiều đó, pass/fail gate "State coverage (desktop/mobile/state)" ở trạng thái PASS theo Requirement 6 tiêu chí 6, và QA_Owner đã ký duyệt theo tiêu chí 6 dưới đây, THE cổng sign-off implement SHALL được mở cho Module_Folder đó và Module_Folder đó SHALL được phép bắt đầu implement code trong các spec downstream.
4. IF Visual_Target_Score của một Module_Folder < 80/100, hoặc có ít nhất một chiều trọng số dưới 50% trọng số riêng của chiều đó, hoặc pass/fail gate "State coverage (desktop/mobile/state)" bị FAIL, THEN THE cổng sign-off implement SHALL bị block cho Module_Folder đó (kể cả khi tổng điểm 6 chiều ≥ 80), Module_Folder đó SHALL bị cấm bắt đầu implement code trong các spec downstream, và mục "Visual Target Score" trong QA_Checklist SHALL ghi trạng thái "blocked" cùng danh sách chiều/gate không đạt cho tới khi được chấm lại đạt cổng.
5. WHEN Visual_Target_Score của một Module_Folder được chấm hoặc chấm lại, THE Visual_Target_Score, điểm từng chiều trên 6 chiều trọng số, kết quả PASS/FAIL của pass/fail gate "State coverage (desktop/mobile/state)", lý do chấm cho mỗi chiều và cho gate, ngày chấm theo định dạng ISO 8601 (YYYY-MM-DD) và tên QA_Owner chấm SHALL được ghi vào mục "Visual Target Score" trong QA_Checklist của Module_Folder đó (Requirement 6, tiêu chí 2) trong vòng 1 ngày làm việc kể từ khi chấm.
6. IF mục "Visual Target Score" trong QA_Checklist của một Module_Folder thiếu chữ ký duyệt của QA_Owner, THEN THE cổng sign-off implement SHALL bị block cho Module_Folder đó bất kể giá trị điểm.
7. WHERE một Module_Folder thay đổi mock sau khi đã được chấm, THE Visual_Target_Score SHALL được chấm lại trong vòng 2 ngày làm việc kể từ thay đổi mock và mục "Visual Target Score" trong QA_Checklist SHALL được cập nhật ngày chấm và tên QA_Owner chấm; cổng sign-off implement của Module_Folder đó SHALL được đánh giá lại theo tiêu chí 3 và tiêu chí 4.
8. THE cổng sign-off implement SHALL được cấp riêng cho từng Module_Folder dựa trên Visual_Target_Score của chính Module_Folder đó và SHALL không được cấp gộp ở mức pack hay nhóm Module_Folder.

### Requirement 9: Originality_Guardrail và an toàn IP

**User Story:** Là CEO/General Manager (qua Pack_Owner đại diện), tôi muốn pack không sao chép bất kỳ tài sản nào của Mykonos hay Two Point Campus, để Fuxie sở hữu visual identity nguyên bản và tránh rủi ro pháp lý.

#### Acceptance Criteria

1. THE Mocktest_Pack SHALL không chứa hoặc tham chiếu trực tiếp tới asset, nhân vật, place name, UI string, theme, logo, hay IP của Inspiration_Sources, được xác minh bằng rà soát 100% mock và 100% text string trong pack trước khi pack được duyệt.
2. WHERE Mocktest_Pack lấy cảm hứng kỹ thuật (isometric/world/canvas/camera/tile staging) từ Mykonos hoặc cảm hứng concept (campus học tập vui nhộn, learning destinations) từ Two Point Campus, THE Mocktest_Pack SHALL chỉ giữ ý tưởng kỹ thuật/concept ở mức trừu tượng (không tái sử dụng tỉ lệ tile, palette, silhouette nhân vật, hay tên địa điểm gốc) và SHALL diễn dịch lại bằng ngôn ngữ visual riêng của Fuxie định nghĩa trong Style_Master.
3. THE Mocktest_Pack SHALL có Fuxie original visual identity được định nghĩa thống nhất trong Style_Master (Requirement 2), và mọi mock trong pack SHALL tham chiếu đúng tokens (palette, typography, shape language, mascot) từ Style_Master mà không introduce token ngoài Style_Master.
4. IF một mock chứa biểu tượng, layout, nhân vật, hoặc place name có thể bị nhầm là copy từ Inspiration_Sources, THEN mock đó SHALL bị fail mục "Originality" trong QA_Checklist và Visual_Target_Score, SHALL được đánh dấu trạng thái "Originality fail" kèm lý do cụ thể, và SHALL được redesign trước khi tái thẩm định.
5. THE README và mỗi Implementation_Notes SHALL có mục "Originality notes" liệt kê: (a) xác nhận pack/module không sao chép Inspiration_Sources, (b) các điểm cảm hứng đã được trừu tượng hóa, (c) Pack_Owner ký xác nhận, và (d) tham chiếu tới Generation_Prompt_Notes (`generation-prompt.md`) của cùng Module_Folder làm nguồn provenance chính thức cho danh sách forbidden IP references và prompt đã dùng để render mock; Generation_Prompt_Notes là nguồn canonical, Implementation_Notes chỉ tóm tắt và link sang.
6. WHEN Pack_Owner phát hiện vi phạm Originality_Guardrail trong bất kỳ Module_Folder nào, THE Module_Folder đó SHALL bị block khỏi cổng Visual_Target_Score cho tới khi vi phạm được sửa, được Pack_Owner xác nhận đã khắc phục, và mục "Originality notes" tương ứng được cập nhật.
7. WHILE Mocktest_Pack đang trong giai đoạn review, THE Pack_Owner SHALL chạy Originality_Guardrail check trên 100% mock và 100% Module_Folder, và SHALL không cấp pass Visual_Target_Score cho pack nếu còn bất kỳ Module_Folder nào ở trạng thái "Originality fail".

### Requirement 10: Workflow_Gate trước khi gen ảnh và implement code

**User Story:** Là Codex (người duyệt spec), tôi muốn các cổng duyệt tuần tự được tôn trọng, để không có ảnh nào bị render hoặc module nào bị code trước khi requirements/design/tasks của spec này được duyệt.

#### Acceptance Criteria

1. IF `requirements.md`, `design.md`, hoặc `tasks.md` của spec `fuxie-visual-mocktest-pack` chưa đạt trạng thái "Approved by Codex" (được ghi nhận bằng dòng `Status: Approved by Codex` kèm timestamp ISO 8601 ở đầu mỗi file), THEN THE Mocktest_Pack SHALL từ chối render bất kỳ file `mock-desktop.png`, `mock-mobile.png`, hoặc `mock-state.png` nào và SHALL trả về thông báo lỗi chỉ rõ file spec nào đang thiếu duyệt.
2. IF Module_Folder tương ứng của một module (trong 18 module liệt kê ở Requirement 1) chưa đạt Visual_Target_Score ≥ 80/100 theo Requirement 8, THEN THE Fuxie codebase SHALL không bắt đầu implement code cho module đó dựa trên spec này và SHALL trả về thông báo chặn nêu rõ tên module và điểm Visual_Target_Score hiện tại.
3. WHEN một trong ba file (`requirements.md`, `design.md`, `tasks.md`) của spec này được sửa sau khi đã đạt trạng thái "Approved by Codex", THE Pack_Owner SHALL set the file's status line to `Status: Pending Re-approval` trước bất kỳ bước downstream nào (render mocks hoặc implement code); mọi chỉnh sửa sau khi đã được duyệt SHALL invalidates duyệt trước đó, và mọi bước downstream được thực hiện trong khi status ≠ `Status: Approved by Codex` SHALL được coi là vi phạm Workflow_Gate, có thể quan sát được bằng cách đọc dòng status ở đầu file. Quy tắc này là quy tắc văn bản thủ công (manual observable rule); spec này không xây dựng watcher, validation script, hay automation nào để tự động chuyển trạng thái.
4. IF Pack_Owner gửi yêu cầu render thử nghiệm hoặc spike implement trước cổng duyệt, THEN THE Workflow_Gate SHALL chỉ chấp nhận yêu cầu khi yêu cầu đó được Pack_Owner đánh dấu rõ ràng bằng nhãn `spike/throwaway` trong tên branch hoặc trong phần mô tả yêu cầu, và THE Mocktest_Pack SHALL không commit artifact spike vào thư mục `docs/design/fuxie-visual-mocktests/` cũng như không cho phép artifact spike được tham chiếu làm visual target chính thức trong Module_Folder.
5. THE README SHALL hiển thị một bảng trạng thái Workflow_Gate được Pack_Owner duy trì THỦ CÔNG, liệt kê tên 3 file (`requirements.md`, `design.md`, `tasks.md`), trạng thái duyệt hiện tại của từng file (một trong các giá trị: "Draft", "Pending Codex Approval", "Pending Re-approval", "Approved by Codex"), và timestamp ISO 8601 của lần thay đổi trạng thái gần nhất, đồng thời ghi rõ thứ tự cổng duyệt tuần tự requirements → design → tasks → render ảnh → implement code; bảng trạng thái trong README SHALL khớp với dòng status ở đầu mỗi file spec, và nếu hai nguồn lệch nhau thì README SHALL bị coi là stale và Pack_Owner SHALL reconcile trước bất kỳ bước downstream nào.
6. WHERE một Module_Folder đã đạt Visual_Target_Score ≥ 80/100, THE Workflow_Gate SHALL chỉ mở cổng implement code cho đúng Module_Folder của module đó và SHALL giữ trạng thái cổng đóng cho 17 Module_Folder còn lại trong pack cho đến khi mỗi Module_Folder riêng lẻ độc lập đạt ngưỡng Visual_Target_Score ≥ 80/100.
7. IF có hai hoặc nhiều yêu cầu render hoặc implement gửi đồng thời cho cùng một Module_Folder, THEN THE Workflow_Gate SHALL xử lý tuần tự theo thứ tự nhận yêu cầu và SHALL từ chối các yêu cầu trùng lặp với thông báo chỉ rõ yêu cầu nào đang được xử lý.

### Requirement 11: Roles và ownership của pack

**User Story:** Là Project Manager / Delivery Manager, tôi muốn biết ai sở hữu phần nào của pack, để khi có review hoặc xung đột thì tìm đúng người quyết định.

#### Acceptance Criteria

1. THE Pack_Owner SHALL là Product Designer; Pack_Owner SHALL chịu trách nhiệm cuối về Visual_Target_Score mục tiêu của Mocktest_Pack và sự nhất quán cross-module trên toàn bộ 18 Module_Folder, bao gồm phê duyệt mọi thay đổi ảnh hưởng tới ≥ 2 Module_Folder.
2. THE Style_Master_Owner SHALL là Design System Designer; Style_Master_Owner SHALL chịu trách nhiệm về nội dung và token của Style_Master (`00-style-master`) cũng như xác nhận các Module_Folder khác kế thừa đúng token trước khi module đó được ký duyệt Visual_Target_Score.
3. THE Priority_Owner SHALL là Product Manager EdTech; Priority_Owner SHALL chịu trách nhiệm duy trì thứ tự ưu tiên giữa 18 Module_Folder trong README (module nào nên đạt Visual_Target_Score trước, module nào sau) và cập nhật thứ tự này khi có thay đổi.
4. THE QA_Owner SHALL là QA Automation Engineer; QA_Owner SHALL chịu trách nhiệm về rubric Visual_Target_Score, kiểm tra QA_Checklist từng Module_Folder, và ký duyệt điểm Visual_Target_Score cuối cùng cho mỗi Module_Folder.
5. WHERE một quyết định ảnh hưởng đồng thời Visual_Target_Score và token của Style_Master, THE Pack_Owner SHALL phối hợp với Style_Master_Owner và đạt được sự đồng thuận bằng văn bản (ghi chú trong README hoặc changelog của Mocktest_Pack) trước khi cập nhật Mocktest_Pack.
6. WHERE một quyết định ảnh hưởng đồng thời Visual_Target_Score và roadmap ưu tiên module, THE Pack_Owner SHALL phối hợp với Priority_Owner và đạt được sự đồng thuận bằng văn bản trước khi cập nhật README hoặc thứ tự Module_Folder.
7. IF không xác định được role chủ sở hữu cho một câu hỏi cụ thể trong Mocktest_Pack, THEN câu hỏi đó SHALL được đẩy lên Pack_Owner, và Pack_Owner SHALL định tuyến câu hỏi tới đúng role (Style_Master_Owner, Priority_Owner, hoặc QA_Owner) trong vòng 2 ngày làm việc kể từ khi nhận.
8. IF một trong các role Pack_Owner, Style_Master_Owner, Priority_Owner, hoặc QA_Owner không khả dụng (vắng mặt, rời dự án, hoặc chưa được chỉ định), THEN Mocktest_Pack SHALL ghi nhận role thay thế tạm thời trong README, và mọi quyết định thuộc phạm vi role đó SHALL bị tạm dừng cho đến khi role thay thế được ghi nhận.
9. WHEN bất kỳ role nào trong bốn role (Pack_Owner, Style_Master_Owner, Priority_Owner, QA_Owner) được chỉ định hoặc thay đổi, THE Mocktest_Pack SHALL cập nhật README với tên role, người đảm nhiệm, và ngày hiệu lực trong cùng commit thực hiện thay đổi.

### Requirement 12: Hợp đồng nội dung của Generation_Prompt_Notes

**User Story:** Là Pack_Owner và là Codex auditor, tôi muốn mỗi Module_Folder có một file provenance riêng ghi lại prompt và bối cảnh đã dùng để render mock, để tôi có thể truy vết nguồn gốc từng ảnh và kiểm tra Originality_Guardrail ở mức từng mock thay vì chỉ ở mức pack.

#### Acceptance Criteria

1. THE Generation_Prompt_Notes SHALL nằm tại đường dẫn `docs/design/fuxie-visual-mocktests/<module-folder>/generation-prompt.md` cho mọi Module_Folder, với tên file viết thường chính xác là `generation-prompt.md`, mã hoá UTF-8, và `<module-folder>` khớp đúng với tên Module_Folder đã đăng ký ở Requirement 1.
2. THE Generation_Prompt_Notes SHALL chứa các heading cấp 2 (`##`) bắt buộc theo đúng thứ tự sau, mỗi heading có nội dung không rỗng (tối thiểu 1 câu hoặc 1 bullet): "Visual intent", "Module identity cues", "Positive prompt", "Negative prompt", "Originality guardrails (forbidden IP references)", "Model / tool / seed (if available)", "Reviewer + date".
3. THE heading "Originality guardrails (forbidden IP references)" trong Generation_Prompt_Notes SHALL liệt kê tường minh ở mức tối thiểu: tên asset của Mykonos bị cấm tham chiếu, tên nhân vật/place name/themed prop của Two Point Campus bị cấm tham chiếu, và mọi IP của bên thứ ba khác đã được trích dẫn trong prompt; danh sách này SHALL đủ chi tiết để Originality_Guardrail (Requirement 9) trở nên auditable ở mức từng mock thay vì chỉ ở mức pack.
4. THE heading "Reviewer + date" trong Generation_Prompt_Notes SHALL bao gồm tên Pack_Owner ký xác nhận và ngày ký theo định dạng ISO 8601 (YYYY-MM-DD).
5. IF `generation-prompt.md` của một Module_Folder bị thiếu, hoặc có heading bắt buộc nhưng nội dung rỗng, hoặc heading "Originality guardrails (forbidden IP references)" không liệt kê danh sách IP loại trừ, THEN Module_Folder đó SHALL bị block khỏi cổng sign-off Visual_Target_Score (Requirement 8) cho tới khi Generation_Prompt_Notes được sửa đúng hợp đồng nội dung.
6. WHEN bất kỳ một trong ba file mock (`mock-desktop.png`, `mock-mobile.png`, `mock-state.png`) của một Module_Folder được render lại hoặc thay thế, THE Generation_Prompt_Notes của Module_Folder đó SHALL được cập nhật trong cùng change set với tên Reviewer và date mới; provenance cũ SHALL được coi là stale và stale provenance SHALL block cổng sign-off Visual_Target_Score cho tới khi Generation_Prompt_Notes được cập nhật.
7. THE Generation_Prompt_Notes SHALL không chứa code thực thi và SHALL không trùng lặp nội dung của QA_Checklist (rubric chấm) hay Implementation_Notes (token, layout, component reuse); phạm vi của Generation_Prompt_Notes SHALL chỉ giới hạn ở provenance của ảnh mock đã render.

## Non-Goals

- Spec này KHÔNG bao gồm việc implement code thực cho bất kỳ module nào trong 18 module.
- Spec này KHÔNG bao gồm việc gen ảnh mock; việc gen ảnh chỉ được phép sau khi `requirements.md`, `design.md`, `tasks.md` đều được Codex duyệt (Requirement 10).
- Spec này KHÔNG định nghĩa nội dung học (curriculum, ngữ pháp, từ vựng cụ thể) bên trong từng module; nội dung học do các spec/role học thuật khác phụ trách.
- Spec này KHÔNG sản xuất animation, video, hoặc prototype tương tác; sản phẩm là PNG mock + tài liệu.
- Spec này KHÔNG copy tài sản, nhân vật, place name, UI, theme, hoặc IP của Mykonos hay Two Point Campus.
- Multi-state mocks (`mock-state-*.png`) là OUT OF SCOPE của V0 Mocktest_Pack và SHALL được hoãn sang V2; V0 chỉ hỗ trợ duy nhất một file `mock-state.png` cho mỗi Module_Folder.
- Spec này KHÔNG xây dựng watcher, validation script, hay automation nào để tự động kiểm tra hoặc chuyển trạng thái Workflow_Gate; Workflow_Gate là quy tắc văn bản thủ công quan sát được trên dòng status ở đầu mỗi file spec và bảng trạng thái trong README.
- i18n readiness (ví dụ "VI/DE readiness") là một scored dimension được hoãn sang V2; V0 cố định 6 chiều trọng số ở Requirement 8 (Learning intent, Module identity / Token coverage cho `00-style-master`, Style master compliance, Mobile readability, Contrast, Originality) và SHALL không thêm chiều thứ 7 nào trong V0.

## Open Questions

- Cần Priority_Owner xác nhận thứ tự ưu tiên giữa 18 module (module nào pass cổng Visual_Target_Score trước) sẽ được ghi vào `design.md` hay `tasks.md`.
- Cần Style_Master_Owner xác nhận Style_Master kế thừa từ design system Fuxie hiện hữu (nếu có) hay khởi tạo mới hoàn toàn; quyết định này sẽ ảnh hưởng `implementation-notes.md` của `00-style-master`.
- Có cần script kiểm tra trạng thái Workflow_Gate (manual vs automated) trong V2 không? V0 cố tình giữ Workflow_Gate ở dạng quy tắc văn bản thủ công; quyết định automation thuộc phạm vi V2 và do CTO/Tech Lead phối hợp với Pack_Owner và QA_Owner đưa ra.
