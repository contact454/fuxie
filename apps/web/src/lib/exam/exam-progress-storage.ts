/**
 * exam-progress-storage — local recovery for the exam in-progress session.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (only consulted for the disconnect
 *               banner copy/contrast).
 *
 * Spec source-of-truth:
 *   - Task 15.2 (gamified-ui-asset-rollout)
 *   - design.md §Data Models — `LocalExamProgress`
 *   - requirements.md Req 10.3, 10.6, 10.7
 *
 * Why a pure module:
 *   The repo runs vitest in the `node` environment (no jsdom — see
 *   `apps/web/vitest.config.ts`). Following the pattern established by
 *   `lib/gamification/shop-pending-revert.ts` (Task 13.3), all timing,
 *   TTL and serialisation logic is implemented as pure functions over an
 *   injectable `Storage` shim. The React layer (`useExamProgress` hook
 *   used by `ExamSessionClient`) is a thin glue that delegates timing and
 *   persistence decisions here, so passing tests in this file are
 *   sufficient to guarantee Req 10.6 / 10.7 without booting a DOM.
 *
 * Contract (machine-checkable):
 *   1. Stored under `localStorage` key `exam:{examId}:progress`
 *      (Req 10.6 — "lưu local progress mỗi 5 giây").
 *   2. Shape matches design §Data Models `LocalExamProgress` exactly:
 *        { examId, startedAt, remainingMs, answers, lastSavedAt }.
 *   3. `loadExamProgress(examId, now)` returns the saved snapshot only
 *      when `now - startedAtMs ≤ EXAM_RECOVERY_TTL_MS` (60 minutes —
 *      Req 10.7). Expired entries are evicted on read.
 *   4. Storage is write-skipped when corrupted snapshots are encountered
 *      (Property 6 mirror — never crash the surface for a recovery edge).
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Local exam progress snapshot persisted to `localStorage` for offline
 * pause/resume (Req 10.6) and tab close/reload recovery (Req 10.7).
 *
 * Shape mirrors design.md §Data Models exactly:
 *
 *   interface LocalExamProgress {
 *     examId: string
 *     startedAt: string                // ISO
 *     remainingMs: number              // updated every 5s
 *     answers: Record<string, string | string[]>
 *     lastSavedAt: string
 *   }
 */
export interface LocalExamProgress {
    /** Exam identifier this snapshot belongs to. */
    examId: string
    /** ISO timestamp at which the attempt started (TTL anchor). */
    startedAt: string
    /** Remaining countdown in milliseconds at the moment of save. */
    remainingMs: number
    /**
     * Answer payload per task id. Stored as a string-keyed record so the
     * snapshot is JSON-friendly and renderer-agnostic — the host serialises
     * the in-flight `answers` object before saving.
     */
    answers: Record<string, unknown>
    /** ISO timestamp of the most recent save. */
    lastSavedAt: string
}

/**
 * Minimal Storage surface — the subset of `Storage` we actually use. This
 * lets us inject an in-memory shim in tests (the workspace runs vitest in
 * the `node` environment without jsdom).
 */
export interface ExamProgressStorage {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem(key: string): void
}

/** Inputs for {@link saveExamProgress}. */
export interface SaveExamProgressInput {
    examId: string
    /** ISO start timestamp (TTL anchor); reused across saves of the same attempt. */
    startedAt: string
    /** Remaining countdown in ms (Req 10.6 — "remaining time"). */
    remainingMs: number
    /** Answers payload at the moment of save. */
    answers: Record<string, unknown>
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/**
 * Recovery window — 60 minutes (Req 10.7).
 *
 * "WHEN learner mở lại exam trong window đó, THE Exam_Surface SHALL
 *  khôi phục answers và remaining time từ local progress."
 */
export const EXAM_RECOVERY_TTL_MS = 60 * 60 * 1000

/**
 * Save cadence — 5 seconds (Req 10.6).
 *
 * "lưu local progress (answers đã chọn + remaining time) mỗi 5 giây".
 */
export const EXAM_PROGRESS_SAVE_INTERVAL_MS = 5_000

// -----------------------------------------------------------------------------
// Pure helpers
// -----------------------------------------------------------------------------

/**
 * Build the canonical `localStorage` key for the given exam id.
 *
 * Format: `exam:{examId}:progress` (Req 10.6).
 *
 * The exam id is encoded via `encodeURIComponent` so unusual characters
 * (e.g. UUIDs with `:` separators) cannot collide with the `:`-delimited
 * key namespace.
 */
export function examProgressKey(examId: string): string {
    return `exam:${encodeURIComponent(examId)}:progress`
}

/** Type guard — minimum shape required to consider a snapshot valid. */
function isValidSnapshot(value: unknown): value is LocalExamProgress {
    if (value === null || typeof value !== 'object') return false
    const candidate = value as Partial<LocalExamProgress>
    if (typeof candidate.examId !== 'string' || candidate.examId.length === 0) {
        return false
    }
    if (typeof candidate.startedAt !== 'string') return false
    if (
        typeof candidate.remainingMs !== 'number' ||
        !Number.isFinite(candidate.remainingMs) ||
        candidate.remainingMs < 0
    ) {
        return false
    }
    if (typeof candidate.lastSavedAt !== 'string') return false
    if (
        candidate.answers === null ||
        typeof candidate.answers !== 'object' ||
        Array.isArray(candidate.answers)
    ) {
        return false
    }
    // Reject NaN startedAt
    const startedAtMs = Date.parse(candidate.startedAt)
    if (Number.isNaN(startedAtMs)) return false
    return true
}

// -----------------------------------------------------------------------------
// Save / Load / Clear
// -----------------------------------------------------------------------------

/**
 * Persist an exam progress snapshot.
 *
 * The snapshot shape is exactly `LocalExamProgress` (design §Data Models)
 * with `lastSavedAt` set to `nowMs`. Storage failures (quota, private
 * mode) are swallowed so a failed save never blocks the in-progress UI.
 *
 * Validates: Requirement 10.6
 */
export function saveExamProgress(
    storage: ExamProgressStorage,
    input: SaveExamProgressInput,
    nowMs: number,
): LocalExamProgress {
    const snapshot: LocalExamProgress = {
        examId: input.examId,
        startedAt: input.startedAt,
        remainingMs: Math.max(0, Math.floor(input.remainingMs)),
        answers: input.answers,
        lastSavedAt: new Date(nowMs).toISOString(),
    }
    try {
        storage.setItem(examProgressKey(input.examId), JSON.stringify(snapshot))
    } catch {
        // localStorage may be unavailable (private mode / quota); the host
        // surface still functions — recovery just won't activate after a
        // close/reload. Mirrors the wallet-cache pattern in
        // shop-backbone-client.
    }
    return snapshot
}

/**
 * Load and TTL-validate an exam progress snapshot.
 *
 * Returns `null` when:
 *   - no snapshot exists for `examId`,
 *   - the stored value is not valid JSON or fails the shape guard,
 *   - the snapshot is older than {@link EXAM_RECOVERY_TTL_MS} (Req 10.7).
 *
 * Expired snapshots are evicted on read so a stale entry does not linger
 * in `localStorage` after the recovery window.
 *
 * Validates: Requirement 10.7
 */
export function loadExamProgress(
    storage: ExamProgressStorage,
    examId: string,
    nowMs: number,
): LocalExamProgress | null {
    const key = examProgressKey(examId)
    let raw: string | null
    try {
        raw = storage.getItem(key)
    } catch {
        return null
    }
    if (raw === null) return null

    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        // Corrupted entry — drop it so a future save can replace it cleanly.
        try {
            storage.removeItem(key)
        } catch {
            /* ignore */
        }
        return null
    }

    if (!isValidSnapshot(parsed)) {
        try {
            storage.removeItem(key)
        } catch {
            /* ignore */
        }
        return null
    }

    if (parsed.examId !== examId) {
        // The slot was overwritten by a different attempt — treat as miss.
        return null
    }

    const startedAtMs = Date.parse(parsed.startedAt)
    if (nowMs - startedAtMs > EXAM_RECOVERY_TTL_MS) {
        // TTL expired — evict and miss (Req 10.7).
        try {
            storage.removeItem(key)
        } catch {
            /* ignore */
        }
        return null
    }

    return parsed
}

/**
 * Remove the saved snapshot. Called on successful submit so the next
 * attempt starts fresh, and from the host when the user explicitly
 * abandons the attempt.
 */
export function clearExamProgress(
    storage: ExamProgressStorage,
    examId: string,
): void {
    try {
        storage.removeItem(examProgressKey(examId))
    } catch {
        /* ignore */
    }
}

// -----------------------------------------------------------------------------
// Browser convenience helpers (for the host component)
// -----------------------------------------------------------------------------

/**
 * Resolve `window.localStorage` when available, returning `null` during
 * SSR or when storage is blocked. The host (`useExamProgress`) skips
 * persistence in that case.
 */
export function getBrowserExamStorage(): ExamProgressStorage | null {
    if (typeof window === 'undefined') return null
    try {
        // Touch the API to surface SecurityError early (Safari private mode).
        const probe = window.localStorage
        if (probe === undefined || probe === null) return null
        return probe
    } catch {
        return null
    }
}
