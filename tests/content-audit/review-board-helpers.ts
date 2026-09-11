/**
 * Spec `fuxie-content-review-board` — pure reference helpers.
 *
 * The contract types + functions were originally scaffolded here (task 1.1).
 * Task 1.2 promoted them into a production module so there is a SINGLE source
 * of truth shared by both the Tier-1 gate (`scripts/content-german-lint.ts`)
 * and this PBT suite. This file now re-exports that module unchanged so the
 * existing test imports (`./review-board-helpers`) keep working as-is.
 *
 * See `scripts/lib/review-board-contract.ts` for the implementation +
 * semantics (design.md §"Correctness Properties" / Components 1, 3, 4).
 */
export * from '../../scripts/lib/review-board-contract'
