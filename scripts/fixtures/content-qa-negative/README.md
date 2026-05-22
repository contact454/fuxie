# Content QA Negative Fixtures

These fixtures are intentionally invalid. Use them to verify that `scripts/content-qa.ts` catches release-candidate blockers:

```powershell
.\node_modules\.bin\tsx.cmd scripts/content-qa.ts --content-dir scripts/fixtures/content-qa-negative --report-path tmp/content-qa-negative-report.md
```

Expected result: non-zero exit with errors such as missing full transcript, missing learning outcomes, invalid CEFR audit, missing answer evidence, and circular German definition.

