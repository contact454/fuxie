# SPRINT 8 PATCHED PREP PACK

**Baseline**: Sprint 0–7 verified — 75 passed, 41 skipped, 0 errors.
**Goal**: Add 1:N solver + unified mode + E2E hardening.

---

## A. Sprint 8 Scope

### IN

| # | Item | Priority |
|---|------|----------|
| 1 | 1:N solver (1 txn → 2-5 invoices) | P0 |
| 2 | Unified solver mode `full` (1:1 + N:1 + 1:N) | P0 |
| 3 | 1:N HTTP+DB integration test | P1 |
| 4 | Solver stats endpoint + `candidate_count` | P2 |

### OUT

Full N:N, async solver, posting, duplicate auto-exclude — all deferred.

---

## B. Revised API Compatibility Contract (Contract 1 — Fixed)

### Decision: Transitional response (Option A)

Assignment response includes **both** fields:

```python
class AssignmentOut:
    bank_txn_ids: list[str]       # canonical — list of matched txn IDs
    node_ids: list[str]           # canonical (NEW) — list of matched node IDs
    node_id: str                  # deprecated alias = node_ids[0], always present
    ...
```

> [!IMPORTANT]
> `node_id` is a **deprecated backward-compat alias**.
> It equals `node_ids[0]` — always present because every assignment has ≥1 node.
> New consumers should use `node_ids`. `node_id` will be removed in a future version.

**Rules:**
- `node_ids` is the canonical field, set from `CandidateGroup.node_ids`
- `node_id = node_ids[0]` — computed in the response model, not stored separately
- Existing tests and consumers that read `node_id` continue to work
- New tests assert on `node_ids` for multi-node assignments
- Internal [CandidateGroup](file:///C:/Users/DMF%20Schule/AI-KE-TOAN/src/app/services/recon_solver.py#96-110): `node_idx` → `node_indices`, `node_id` → `node_ids`

---

## C. Revised Full-Mode Solver Contract (Contract 2 — Fixed)

### Decision: No tie-break contract (Option A)

> [!IMPORTANT]
> **Sprint 8 MVP: no deterministic tie-break guarantee.**
> CP-SAT maximizes `Σ score_int[k] * g[k]`.
> Among equal-score optimal solutions, any valid solution is acceptable.
> Tests must not assume 1:1 > N:1 > 1:N preference unless encoded in the score.

**What this means for tests:**
- `test_solver_full_mode_picks_best` → renamed to `test_solver_full_mode_finds_optimal`
- Test uses **score-gap** design: make one candidate clearly higher-scoring so the result is deterministic
- Example: 1:1 exact match (score ≈ 1.0) vs 1:N group with date spread (score ≈ 0.6) → solver picks 1:1
- Tests do NOT assert "1:1 is preferred over N:1" as a general rule — only that the higher-scored candidate wins

**Tie-break encoding (future):**
If Sprint 9+ needs deterministic tie-break, add a small bonus to the objective:
```python
tie_break_bonus = (MAX_TXNS_PER_GROUP + 1 - len(c.txn_indices) - len(c.node_indices))
```
This is NOT implemented in Sprint 8.

---

## D. Revised Candidate Budgeting Contract (Contract 3 — Fixed)

### Decision: Global budget, ordered generation, early-exit

> [!IMPORTANT]
> `MAX_CANDIDATE_EDGES = 10,000` is a **GLOBAL per-run** limit across all candidate types.

**Generation order (deterministic):**
1. **1:1 candidates** — generated first (cheapest, O(T×N))
2. **N:1 candidates** — generated second (K=10 per node, combos 2-5)
3. **1:N candidates** — generated last (K=10 per txn, combos 2-5)

**Early-exit rule (same as Sprint 7):**
```python
if len(all_candidates) >= MAX_CANDIDATE_EDGES:
    logger.warning("candidate_limit_reached", ...)
    break  # stop generating, proceed with what we have
```
- Early-exit is **graceful degradation** — solver runs on whatever fits
- If 1:1 alone fills the budget, N:1 and 1:N are not generated
- This is documented behavior, not a bug

**`candidate_count` column in [recon_runs](file:///C:/Users/DMF%20Schule/AI-KE-TOAN/src/app/api/recon.py#169-207):**
- Meaning: **count sent to solver** (i.e., post-cap, equals `len(all_candidates)` at solve time)
- Range: 0 to `MAX_CANDIDATE_EDGES`
- Written alongside `solver_type`, `solver_time_ms` in the COMPLETED update

**Guardrail behavior:**
```
candidates_generated <= MAX_CANDIDATE_EDGES  (always true, due to early-exit)
```
The Sprint 7 post-generation check (`if len(candidates) > MAX_CANDIDATE_EDGES → FAILED`) is removed. Early-exit replaces it.

---

## E. File/Module Plan

### Services

#### [MODIFY] [src/app/services/recon_solver.py](file:///C:/Users/DMF%20Schule/AI-KE-TOAN/src/app/services/recon_solver.py)
- Generalize [CandidateGroup](file:///C:/Users/DMF%20Schule/AI-KE-TOAN/src/app/services/recon_solver.py#96-110): `node_idx` → `node_indices`, `node_id` → `node_ids`
- Add `generate_candidates_1_to_n()`
- Add `_select_top_k_eligible_nodes()`
- Add `_compute_score_1n()`
- Update [solve_assignments()](file:///C:/Users/DMF%20Schule/AI-KE-TOAN/src/app/services/recon_solver.py#425-483): node constraint uses `node_indices`
- Add `solver=full` mode: 1:1 + N:1 + 1:N with global early-exit
- Update persistence: loop over `node_ids` for junction INSERTs
- Remove post-generation `MAX_CANDIDATE_EDGES` check (replaced by early-exit)
- Write `candidate_count` to [recon_runs](file:///C:/Users/DMF%20Schule/AI-KE-TOAN/src/app/api/recon.py#169-207)

### API

#### [MODIFY] [src/app/api/recon.py](file:///C:/Users/DMF%20Schule/AI-KE-TOAN/src/app/api/recon.py)
- Add `solver=full` as default
- Assignment response: add `node_ids: list[str]`, keep `node_id` as alias
- Add `GET /recon/runs/{id}/stats`

### Migration

#### [NEW] `sql/migrations/0005_recon_run_stats.sql`
- Add `candidate_count INTEGER` to [recon_runs](file:///C:/Users/DMF%20Schule/AI-KE-TOAN/src/app/api/recon.py#169-207)

### Bootstrap

#### [MODIFY] [scripts/bootstrap_dev.sh](file:///C:/Users/DMF%20Schule/AI-KE-TOAN/scripts/bootstrap_dev.sh)
- Apply migration 0005

---

## F. Revised Test Plan

### Mock Tests — `tests/api/` (7 new)

| # | Test | Proves |
|---|------|--------|
| 106 | `test_solver_1n_two_inv_one_txn` | 1 txn → 2 invoices |
| 107 | `test_solver_1n_five_inv_one_txn` | 1 txn → 5 invoices |
| 108 | `test_solver_1n_topk_node_pruning` | >10 eligible nodes → top-10 |
| 109 | `test_solver_full_mode_finds_optimal` | Higher-score candidate selected (score-gap, no preference assumption) |
| 110 | `test_solver_1n_no_overlap_with_n1` | Same txn can't be in both 1:N and N:1 matches |
| 111 | `test_recon_run_solver_full_mode` | API accepts `solver=full` |
| 112 | `test_recon_run_stats_endpoint` | GET /stats returns metadata |

### Real DB Tests — `tests/gate_b/` (7 new)

| # | Test | Type | Proves |
|---|------|------|--------|
| 113 | `test_1n_three_node_junctions` | DB-only | 1 txn + 3 node junctions FK-correct |
| 114 | `test_1n_revoke_frees_all_nodes` | DB-only | Revoke → node junctions freed |
| 115 | `test_1n_single_active_node_constraint` | DB-only | Same node in 2 active assignments → violation |
| 116 | `test_1n_http_integration_1txn_3inv` | HTTP+DB | Full POST → solver → PG → readback (1:N) |
| 117 | `test_full_mode_mixed_assignments` | HTTP+DB | 1 N:1 + 1 1:N in same run |
| 118 | `test_candidate_count_stored` | DB-only | `candidate_count` in `recon_runs` |
| 119 | `test_stats_endpoint_live` | HTTP+DB | GET /stats correct |

### Pass Conditions

```bash
# Mock: 82 passed (75 + 7 new)
# With DB: 82 + 7 gate_b = 89 passed
```

---

## G. Final Statement

**SPRINT 8 CONTRACTS LOCKED**

### Contract 1: API Backward Compatibility ✅
- Transitional response: `node_ids` (canonical) + `node_id` (deprecated alias = `node_ids[0]`)
- Always present, always consistent
- Old consumers read `node_id` — works unchanged
- New consumers read `node_ids` — gets full list

### Contract 2: Full-Mode Tie-Break ✅
- No tie-break guarantee — any max-score solution valid
- Tests use score-gap design, not preference assumptions
- Tie-break encoding deferred to Sprint 9+ if needed

### Contract 3: Candidate Budgeting ✅
- `MAX_CANDIDATE_EDGES = 10,000` GLOBAL per-run
- Generation order: 1:1 → N:1 → 1:N
- Early-exit is graceful degradation (not hard error)
- `candidate_count` = count sent to solver (post-cap)

**READY TO CODE**
