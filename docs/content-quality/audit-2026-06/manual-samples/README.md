# D7 Manual Review Sample Inputs

These JSON files are the durable, version-controlled input packs used by `scripts/content-d7-signoff-sweep.ts` for the D2/D3/D4 manual-review queues.

## Provenance

The original audit generated these packs under `tmp/`, which is intentionally not a durable CI input location. The committed `d7-signoff-register.json` was generated while those local packs existed and records every sampled file path plus the expected counts:

- D2 level-fit deep review: 24 files.
- D3 semantic answer/distractor review: 24 files.
- D4 Vietnamese naturalness review: 12 files.

On 2026-09-11, the exact file-path lists were recovered from that committed register and promoted here so a clean checkout can reproduce the signoff register without pre-existing local `tmp/` state.

## Semantics

- These files define **review inputs only**.
- Their presence does **not** mean a native/human academic review was completed.
- They do **not** alter `signoff-manifest.json` or promote any cell to signed.
- Changing a sample list is an audit-method change and requires Content QA / German Academic Lead review.
- `validateRegister()` remains responsible for blocking missing sample targets and count drift.
