# Transcript Source Acquisition Sprint

Owner: German Academic Lead  
Execution partners: Content QA / Linguistic Reviewer, Audio Script & Voice Producer, Full-stack Engineer

## Goal

Replace release-candidate reconstructed listening transcripts with source-verified studio scripts.

## Current Status

- Listening files: 268.
- Source scripts available in repo: 0.
- Current transcript source: `reconstructed_full_script`.
- Blocking reason: source paths listed in `metadata.source_script` point to `data/scripts/...`, but that directory is not present in the repository.

## Required Input

For each listening file, provide the original JSON source script at the path declared in `metadata.source_script`, or provide a mapped replacement file with:

- `lines[]` as strings, or
- `transcript.lines[]` objects with `speaker` and `text`.

## Execution

1. Add source scripts under `data/scripts/...` using the existing `metadata.source_script` paths.
2. Run dry-run:

```powershell
.\node_modules\.bin\tsx.cmd scripts/apply-source-transcripts.ts --dry-run
```

3. Confirm report in `tmp/source-transcript-apply-report.json`.
4. Run apply without `--dry-run` only when source coverage is acceptable:

```powershell
.\node_modules\.bin\tsx.cmd scripts/apply-source-transcripts.ts
```

5. Run content QA:

```powershell
.\node_modules\.bin\tsx.cmd scripts/content-qa.ts
```

## Acceptance

- `source_verified` transcript quality for all target listening files.
- `scripts/content-qa.ts` reports 0 errors, 0 warnings.
- German Academic Lead spot-checks at least 10 source-replaced transcripts across A1-C2.

