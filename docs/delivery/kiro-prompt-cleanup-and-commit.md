# Kiro Work-Order — Dọn line-ending + revert 2a + commit theo lớp

> Dán phần trong khung vào Kiro. ĐÂY KHÔNG phải task viết tính năng — là **dọn dẹp git + commit có kỷ luật** cho working tree đang có ~2.298 file thay đổi mà chưa commit gì suốt phiên audit→remediation. Mục tiêu: (1) xóa nhiễu CRLF để diff thật review được, (2) revert riêng codemod 2a (đổi tên ~46 key QA-metadata, gây mixing snake+camel, 0 lợi ích) NHƯNG giữ nguyên 1.282 explanation regen, (3) commit phần việc thật thành các commit tách bạch. **KHÔNG push.**

---

Đây là một **work-order dọn dẹp git (git hygiene)**, không phải viết tính năng. Tuyệt đối không thay đổi nội dung học (chỉ key/line-ending). KHÔNG push, KHÔNG tạo PR — chỉ commit local để owner review.

Role-gate: đọc `AGENTS.md` + `.agents/workflows/task-role-router.md`. **Vai chính: DevOps / Cloud Engineer.** Vai phối hợp: CTO / Tech Lead, Backend Engineer, Content QA / Linguistic Reviewer. Bắt đầu output bằng `Vai chinh:` / `Vai phoi hop:`.

## Bối cảnh (trạng thái thật, đã verify)
- HEAD = `c83760fad`. Suốt phiên audit→remediation KHÔNG có commit nào → mọi thay đổi nằm chung chưa commit (`git status` ~2.298 file, 37 untracked).
- ~1.194 file content "đổi" nhưng phần lớn chỉ là **CRLF** (LF→CRLF do tool Windows ghi lại). Bỏ CR-at-eol ra chỉ ~**536 file đổi thật**.
- 536 đổi thật = genus fix (1 file `content/a2/vocabulary/20-wetter-klima.json`) + 1.282 explanation regen (266 file `content/*/reading/*.json`) + codemod 2a (`content/*/reading` + `content/*/listening`).
- Codemod 2a = `scripts/codemod-snake-to-camel-content.mjs` (parse-JSON, đổi key không đụng value). Nó đã đổi ~46 key QA-metadata 0-consumer sang camel → tạo file trộn snake+camel (vd `A1-T1-001.json` có `teil_name` snake cạnh `wordCountInRange` camel).

## Nguyên tắc an toàn (bắt buộc)
- KHÔNG `git add -A` rồi commit một cục. Stage + commit theo từng nhóm.
- Mọi bước đổi file: dry-run/diff trước, verify sau. Giữ **value bất biến** (chỉ key + line-ending đổi).
- KHÔNG push, KHÔNG PR. Nếu git báo `index.lock` mà chắc chắn không có git nào đang chạy → xóa lock cũ.

## Bước 0 — Backup
Tạo nhánh backup để không mất gì: `git branch backup/pre-cleanup-2026-06-07` (hoặc tag tương đương). Xác nhận nhánh tồn tại.

## Bước 1 — Revert riêng codemod 2a (giữ nguyên explanation regen)
File reading chứa CẢ explanation regen (GIỮ) LẪN 2a key-rename (BỎ) → **KHÔNG được `git checkout`** (sẽ mất explanation). Cách đúng:
1. Viết codemod **nghịch đảo** (camel→snake) cho ĐÚNG tập key mà 2a đã đổi — lấy danh sách + SKIP list từ `scripts/codemod-snake-to-camel-content.mjs`, đảo chiều map. Parse-JSON, chỉ đổi key, không đụng value.
2. Dry-run trên `content/*/reading/*.json` + `content/*/listening/*.json`; xác nhận chỉ các key QA-metadata quay về snake.
3. Apply.
4. Verify trên file mẫu `content/a1/reading/A1-T1-001.json`: `wordCountInRange`→`word_count_in_range`, `allAnswersVerifiable`→`all_answers_verifiable`… đã về snake; **NHƯNG `explanation.vi` regenerated vẫn còn**; value `richtig_falsch` nguyên vẹn.
5. Gate: `tsx scripts/content-qa.ts` exit 0; `tests/content-audit/*` PBT xanh; seed-smoke (DB `fuxie-postgres-vector` có sẵn) exit 0 nếu chạy được.

> Nếu owner đổi ý muốn GIỮ 2a: bỏ Bước 1, nhưng khi đó phải làm 2a **trọn vẹn** cả contract fields (đồng bộ seeder/QA-gate/audio) — không để file trộn nửa vời.

## Bước 2 — Chuẩn hóa line-ending về LF
Mục tiêu: file chỉ-khác-CRLF trở lại trùng HEAD và **rớt khỏi diff**.
1. Thêm (append, không ghi đè) vào `.gitattributes`:
   ```
   *.json text eol=lf
   content/**/*.json text eol=lf
   ```
2. Convert mọi `content/**/*.json` về LF (script node thay `\r\n`→`\n`, value-invariant). File đổi-thật giữ nội dung, chỉ EOL→LF; file chỉ-CRLF thành byte-identical HEAD.
   - Nếu `core.autocrlf` gây phức tạp, tự chọn cách phù hợp (vd `core.autocrlf=false` rồi convert) và verify kết quả.
3. Verify: `git status --short | wc -l` giảm mạnh; `git diff --stat` giờ chủ yếu là ~536 file đổi thật.

## Bước 3 — Commit theo lớp (mỗi nhóm 1 commit, review được)
Stage + commit từng nhóm RIÊNG, kiểm `git diff --cached` trước mỗi commit:

- **C1 — governance**: `.agents/**`, `AGENTS.md` (nếu đổi có chủ đích — kiểm diff; nếu mơ hồ thì HỎI owner, đừng commit bừa). → `chore(agents): update operating model & role profiles`
- **C2 — audit**: `.kiro/specs/fuxie-content-quality-audit/**` + `docs/content-quality/audit-2026-06/**` + `docs/content-quality/kiro-prompt-content-audit.md` + script tooling audit (codemod, classifier, analyzer…). → `docs(content-qa): content quality audit 2026-06 + tooling`
- **C3 — genus (RB-P0-01)**: `content/a2/vocabulary/20-wetter-klima.json` + `.kiro/specs/content-genus-enum-fix/**`. → `fix(content): correct Genus enum FEMINUM→FEMININ (3 words)`
- **C4 — wordtype (RB-P1-01)**: `packages/shared/src/types/index.ts` + `.kiro/specs/vocab-wordtype-enum-reconcile/**`. → `fix(shared): add PHRASE to WORD_TYPES (sync Prisma+content)`
- **C5 — shim (RB-P2-01 Option C)**: `packages/shared/src/content-schema/**`, `packages/shared/package.json`, `tests/content-audit/content-normalize.spec.ts`, `.kiro/specs/content-read-normalize-shim/**` + `.kiro/specs/content-schema-naming-unify/**`. → `feat(shared): content-schema read-normalize shim (camel/snake)`
- **C6 — explanation regen (RB-P2-02) — TÁCH RIÊNG, learner-facing**: 266 file `content/*/reading/*.json` (chỉ thay đổi `explanation`) + `scripts/classify-reading-explanations.ts` + `scripts/regenerate-reading-explanations.ts` + `scripts/build-reading-explanation-patch.ts` + `packages/shared/src/content-schema`-không-thuộc-đây + `tests/content-audit/reading-explanation.spec.ts` + `.kiro/specs/reading-explanation-regeneration/**`. → `feat(content): regenerate 1282 reading explanations` — **commit body ghi rõ: nội dung AI-sinh, CHƯA được Academic Lead/Localization duyệt; cần review trước khi tin dùng production.**
- **C7 — planner spec**: `.kiro/specs/fuxie-public-launch-readiness/**` + `docs/delivery/kiro-prompt-cleanup-and-commit.md`. → `docs(planning): launch readiness program spec + cleanup work-order`

Nếu có file không rơi vào nhóm nào → **liệt kê cho owner, KHÔNG tự commit**.

## Acceptance (binary)
1. Nhánh backup tồn tại.
2. Sau LF-normalize: file chỉ-CRLF không còn trong `git diff`.
3. 2a đã revert (key QA về snake) NHƯNG 1.282 explanation regen còn nguyên; value bất biến (đặc biệt `richtig_falsch`).
4. Gate xanh: `tsx scripts/content-qa.ts`, `tests/content-audit/*` PBT, seed-smoke (nếu DB chạy).
5. Mọi thay đổi đã vào commit tách-nhóm; `git status` sạch (hoặc chỉ còn nhóm "chưa phân loại" đã báo owner). **KHÔNG push.**
6. Kết thúc: in `git log --oneline -10` các commit mới + `git status` để owner review, và đề xuất bước kế tiếp.
