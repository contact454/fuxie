# Kiro Spec Prompt — Fuxie Content Quality Audit (read-only)

> Dán toàn bộ phần trong khung dưới vào ô mô tả khi tạo **Spec mới** trên Kiro.
> Mục tiêu: Kiro tự sinh `requirements.md` (EARS) + `design.md` + `tasks.md` cho một đợt **kiểm duyệt toàn diện, chỉ-audit** mảng nội dung học.

---

Tạo một **Spec mới** tên `fuxie-content-quality-audit` cho repo Fuxie. Đây là nhiệm vụ **kiểm duyệt toàn diện, CHỈ AUDIT (read-only)** mảng nội dung học — KHÔNG sửa nội dung trong đợt này. Hãy sinh `requirements.md` (dùng EARS), `design.md`, `tasks.md` theo đúng phong cách các spec sẵn có trong `.kiro/specs/`.

Trước khi bắt đầu, tuân thủ role-gate của repo: đọc `AGENTS.md` và `.agents/workflows/task-role-router.md`. **Vai chính: Content QA / Linguistic Reviewer.** Vai phối hợp: German Academic Lead, German Curriculum Designer, Vietnamese-German Localization Specialist, Exam Prep Specialist. Mở các profile tương ứng trong `.agents/personnel/` và bắt đầu output bằng `Vai chinh:` / `Vai phoi hop:`.

## Bối cảnh
Fuxie là nền tảng học tiếng Đức cho người Việt, CEFR A1–C2, song ngữ VI/DE. Nội dung nằm ở `content/<level>/<skill>/*.json`, với level ∈ {a1,a2,b1,b2,c1,c2} và skill ∈ {grammar, listening, reading, speaking, vocabulary, writing}. Tổng ~1,194 file JSON. Mỗi level có `content/<level>/course.json` (modules, vocabularyThemes, grammarTopics, examTypes = GOETHE/TELC/OESD) và `content/<level>/grammar/grammar-topics.json`.

Schema KHÔNG đồng nhất (đây là một chiều cần audit):
- vocabulary / grammar / course: camelCase — vd `meaningVi`, `titleDe`, `sortOrder`, `article` ∈ {MASKULIN, FEMININ, NEUTRUM}, `wordType` ∈ {NOMEN, VERB, ...}.
- reading / listening: snake_case — vd `teil`, `teil_name`, `target_grammar`, `word_count`, `audio_file`, `questions[].type` = `richtig_falsch`...
- speaking: từng có drift field theo lịch sử (A1: `textDe`/`textVi`/`pronunciationNotes` vs A2+: `german`/`vietnamese`/`pronunciationTips`) — xem `CHANGELOG.md`.

## Phạm vi
TRONG phạm vi: toàn bộ A1–C2 × 6 kỹ năng + `course.json` + `grammar-topics.json` + kiểm tính hợp lệ đề thi (Goethe/Telc/ÖSD). Quét hết, không bỏ sót; nếu buộc phải lấy mẫu thì nêu rõ phương pháp và lý do.
NGOÀI phạm vi (đợt này): KHÔNG sửa file trong `content/`; không đụng code runtime/UI/asset; không đổi schema (chỉ ghi nhận lỗi schema). Việc sửa để dành cho một spec remediation sau.

## Các chiều cần audit (dimensions)
1. **Chính tả & ngữ pháp tiếng Đức**: ß/umlaut, viết hoa danh từ, giống (Genus) & quán từ, số nhiều, chia động từ, cách (Kasus), trật tự từ.
2. **Đúng cấp CEFR**: độ khó từ vựng/ngữ pháp & độ dài văn bản hợp với level; `target_grammar`/`target_vocabulary` phù hợp.
3. **Chất lượng sư phạm**: hướng dẫn rõ ràng, ĐÁP ÁN đúng, distractor hợp lý, giải thích chính xác, ví dụ tự nhiên/idiomatic, trình tự module hợp lý theo `course.json`.
4. **Chất lượng bản dịch tiếng Việt**: chính xác, tự nhiên, thuật ngữ nhất quán, đủ `meaningVi`/`exampleTranslation`, không mojibake.
5. **Song ngữ & đầy đủ trường**: mọi field learner-facing có đủ DE + VI ở nơi cần; locale parity.
6. **Nhất quán schema & toàn vẹn dữ liệu**: field-naming drift; required fields thiếu; enum hợp lệ (`article`/`wordType`); đáp án/`correctIndex` đúng; trùng `id`; tham chiếu mồ côi giữa `course.json` (themes/topics) và file thật; `audio_file` có tồn tại.
7. **Audio/script (listening & speaking)**: transcript khớp script nguồn, `audio_file` tham chiếu có thật, pronunciation notes đúng.
8. **Hợp lệ đề thi**: cấu trúc Teil + rubric khớp Goethe/Telc/ÖSD cho item dạng thi.
9. **Độ phủ & cân bằng**: lỗ hổng/mất cân đối giữa level & skill (vd speaking mỏng ở b1/c2), item trùng lặp.

## Phương pháp (reuse-first — đừng phát minh gate mới)
Lớp 1 — tự động: chạy và tổng hợp output các script SẴN CÓ: `pnpm qa:content`, `pnpm check:locale-parity`, `pnpm qa:copy-style` (mojibake), `pnpm qa:learning-quality`. Tham chiếu báo cáo có sẵn: `detailed_compounds_audit_report.md`, `qa_report.md`, `docs/content-quality/`, `current_violations*.txt`.
Lớp 2 — review ngôn ngữ/sư phạm sâu: áp rubric của Content QA + German Academic Lead lên nội dung thật (mẫu đại diện mỗi skill/level + quét toàn bộ ở nơi rủi ro cao như đáp án, exam, compound nouns).

## Deliverable (đặt dưới `docs/content-quality/audit-2026-06/`)
- `report.md`: tóm tắt điều hành + heatmap mật độ lỗi (level × skill).
- `findings.csv` (hoặc bảng .md): mỗi dòng = {finding_id, level, skill, file_path, item_id, dimension, severity (P0/P1/P2), evidence (trích dẫn cụ thể), recommended_fix}.
- `coverage-matrix.md`: ma trận level × skill với số item & số lỗi.
- `remediation-backlog.md`: backlog ưu tiên theo severity; mỗi nhóm là 1 candidate fix-spec về sau.

## Ràng buộc
- READ-ONLY: tuyệt đối không sửa file trong `content/`.
- Evidence-gated: mỗi finding PHẢI có `file_path` + `item_id` + trích dẫn cụ thể.
- Severity theo định nghĩa trong `docs/intake/risk-register.md`: P0 = hại người học / sai đáp án / sai tiếng Đức; P1 = lệch CEFR / dịch sai / thiếu field bắt buộc; P2 = polish.
- Báo cáo song ngữ (VI chính, thuật ngữ DE/EN khi cần).
- Kết thúc bằng đề xuất bước kế tiếp (theo operating model).

## Acceptance criteria (cho spec này)
1. 100% trong ~1,194 item được audit, HOẶC được lấy mẫu có nêu rõ phương pháp + lý do chọn mẫu.
2. Mọi finding có đủ severity + evidence + recommended_fix.
3. Đã chạy lớp tự động và nhúng kết quả; locale-parity & mojibake được phản ánh trong báo cáo.
4. `coverage-matrix.md` đầy đủ; `remediation-backlog.md` ưu tiên theo severity.
5. KHÔNG file nội dung nào bị chỉnh sửa trong đợt này (audit-only).
