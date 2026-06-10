# Implementation Plan - Content Vocabulary Audit (A1-C2)

Vai chinh: German Academic Lead
Vai phoi hop: Content QA / Linguistic Reviewer, German Content Writer

## Overview

Audit va remediate 369 file vocabulary, 10.461 entry tren 6 level. Workstream nay dong cac blocker khach quan bang scanner, lexicon alignment va regression gate, nhung khong tu dong cap Academic_Signoff.

## Tasks

- [x] 1. Inventory va machine audit
  - Dem day du file/entry theo level.
  - Kiem schema, enum, CEFR metadata, learning outcomes, literal-null, capitalization va payload chia dong tu.

- [x] 2. Objective remediation
  - Sua number word type A1, 3 loi noi dung da xac dinh, literal-null va capitalization.
  - Can chinh bang chia hien tai khi co lexicon/corpus evidence; giu review status truy vet.
  - Dung `scripts/apply-vocabulary-d7-remediation.ts` voi dry-run mac dinh.

- [x] 3. Regression gate va advisory evidence
  - Them `tests/content-audit/vocabulary-d7-readiness.spec.ts`.
  - Ghi `docs/content-quality/audit-2026-06/vocabulary-d7-advisory-review.md`.

- [ ] 4. Native review va Academic_Signoff
  - Dung `docs/content-quality/audit-2026-06/vocabulary-d7-review-pack.csv` lam working queue cho reviewer.
  - Spot-check 2 bang chia hiem da resolve khoi `auto_generated_needs_spot_check`: `silencen`, `entbergen`.
  - Quyet dinh loanword policy cho `silencen` (giu loanword chuyen nganh hay thay bang `stilllegen`/`unterdruecken`).
  - Duyet plural morphology, genus, nghia, vi du, dich Viet va CEFR fit theo cell.
  - Chi cap nhat `signoff-manifest.json` sau khi reviewer co tham quyen ky tung cell.

## Advisory Progress - 2026-06-10

- [x] 369/369 file va 10.461/10.461 entry da duoc scanner bao phu.
- [x] 239 file co D7 remediation note cho blocker khach quan.
- [x] 1.114 conjugation duoc lexicon-align/source-align va 3 conjugation duoc corpus-canonicalize.
- [x] 138 conjugation con lai duoc can chinh bang regular-rule present tense va gan `regular_rule_needs_native_signoff`.
- [x] Phase regular-rule cham 95 file, giam auto-review tu 139 xuong 2.
- [x] Phase rare-verb cleanup cham 2 file, giam auto-review tu 2 xuong 0.
- [x] Vocabulary D7 review pack da tao 1.482 dong queue (626 P1) bao phu plural/genus/loanword/semantic/example flags tren 6 vocabulary cell.
- [ ] Final native review, loanword policy, plural morphology, genus, nghia/vi du va CEFR fit van pending.

## Notes

- Machine-clean khong dong nghia release-signed.
- `isIrregular` va plural morphology khong duoc tu chung nhan trong dot advisory nay.
- Moi thay doi signoff phai di qua German Academic Lead va duoc ghi vao manifest.
