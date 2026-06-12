# Vocabulary D7 Advisory Review

Vai chinh: German Academic Lead
Vai phoi hop: Content QA / Linguistic Reviewer, German Content Writer

Ngay review: 2026-06-10

## Scope

- Bao phu day du 369 file vocabulary A1-C2 va 10.461 muc tu.
- Inventory theo level: A1 21/728, A2 26/768, B1 42/1.194, B2 60/2.100, C1 75/2.638, C2 145/3.033 (file/entry).
- Day la advisory remediation cho blocker khach quan. Tai lieu nay khong thay the native review hoac Academic_Signoff.

## Remediation Evidence

- 239 file co D7 remediation note; phase regular-rule cham 95 file.
- 31 tu chi so dem A1 duoc chuyen tu `NOMEN` sang `NUMERALE`.
- 3 loi noi dung xac dinh duoc sua: `zählen`, `scharf`, `Säge`.
- 55 gia tri `plural: "null"` va 18 gia tri `article: "null"` duoc chuan hoa.
- 22 dong tu/tinh tu/trang tu mot token duoc sua ve viet thuong.
- 1.114 bang chia hien tai duoc can chinh theo bo du lieu dong tu dan xuat tu Wiktionary hoac nguon tu dien cong khai.
- 3 bang chia duoc can chinh theo ban canonical da co trong corpus Fuxie.
- 138 bang chia hien tai duoc can chinh bang quy tac dong tu yeu/regular present tense, gom ca dang tach duoc, phan than, va loanword `silencen` theo mau Duden `slicen`.
- 0 bang chia dong tu con `auto_generated_needs_spot_check`; `entbergen` duoc sua stem-vowel theo Duden (`entbirgst`, `entbirgt`).
- Review pack cho native reviewer da duoc tao: `vocabulary-d7-review-pack.{json,md,csv}` gom 1.482 dong queue, trong do 626 dong P1, bao phu plural morphology, article/genus policy, loanword policy, semantic-definition va example-lexeme flags.
- Regression gate: `tests/content-audit/vocabulary-d7-readiness.spec.ts`.
- Review-pack gate: `tests/content-audit/vocabulary-d7-review-pack.spec.ts`.
- Remediation runner: `scripts/apply-vocabulary-d7-remediation.ts` (dry-run mac dinh, `--write` de ghi).

Nguon lexicon mot lan: [viorelsfetea/german-verbs-database](https://github.com/viorelsfetea/german-verbs-database). Trang thai `lexicon_aligned_needs_native_signoff` chi khang dinh cac dang hien tai da duoc doi chieu voi lexicon, khong phai native signoff.
Nguon spot-check bo sung: [Duden `entbergen`](https://www.duden.de/konjugation/entbergen), [Duden `slicen`](https://www.duden.de/konjugation/slicen), [transGEN Gene Silencing](https://www.transgen.de/lexikon/1595.gene-silencing.html), [DocCheck Gen-Silencing](https://flexikon.doccheck.com/de/Gen-Silencing).

## Review Boundary

- Khong con bang chia dong tu nao o trang thai `auto_generated_needs_spot_check`.
- `silencen` van la loanword chuyen nganh hiem; form da duoc dua ve boundary `regular_rule_needs_native_signoff`, nhung native reviewer can xac nhan co nen giu lexeme nay hay thay bang `stilllegen`/`unterdruecken` trong bai hoc.
- 1.482 dong trong review pack van co `reviewerVerdict` trong; day la hang doi lam viec, khong phai phe duyet.
- Co `isIrregular` chua duoc tai xac minh toan bo; learner UI hien tai doc cac dang `praesens`, khong dung co nay lam noi dung hien thi.
- Hinh thai so nhieu cua danh tu moi duoc sua blocker schema/literal-null. Do chinh xac tu vung cua tung dang so nhieu van can lexicon va native review.
- Dinh nghia, ban dich Viet, vi du, CEFR fit va tinh tu nhien chua duoc nguoi ban ngu duyet tung entry.
- Vi vay 6 cell vocabulary van giu `academicSignoff=pending`.

## Release Recommendation

Objective blockers trong dot nay dat muc machine-clean va co regression guard. Vocabulary chua du dieu kien goi la release-signed cho den khi plural morphology, nghia/vi du, loanword policy va CEFR fit duoc reviewer chuyen mon duyet, sau do cap nhat signoff manifest.
