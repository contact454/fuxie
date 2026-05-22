import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
    EXAM_PROGRESS_SAVE_INTERVAL_MS,
    EXAM_RECOVERY_TTL_MS,
    type ExamProgressStorage,
    type LocalExamProgress,
    clearExamProgress,
    examProgressKey,
    loadExamProgress,
    saveExamProgress,
} from './exam-progress-storage'

/**
 * Co-located unit tests for the exam progress local-recovery helpers.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (only consulted for the disconnect
 *               banner copy/contrast — not exercised here).
 *
 * Spec source-of-truth:
 *   - Task 15.2 (gamified-ui-asset-rollout)
 *   - design.md §Data Models — `LocalExamProgress`
 *   - requirements.md Req 10.6, 10.7
 *
 * Why pure-helper tests:
 *   The repo runs vitest in the `node` environment (no jsdom — see
 *   `apps/web/vitest.config.ts`). Following the pattern established by
 *   `lib/gamification/shop-pending-revert.test.ts` (Task 13.3), all timing
 *   and TTL behaviour is exercised through the pure module with an
 *   in-memory `Storage` shim. The React glue in `ExamSessionClient` is
 *   verified separately via static-contract checks; passing tests here
 *   are sufficient to guarantee Req 10.6 + 10.7 without booting a DOM.
 */

// -----------------------------------------------------------------------------
// In-memory storage shim
// -----------------------------------------------------------------------------

function createMemoryStorage(): ExamProgressStorage & {
    snapshot: () => Map<string, string>
    fail: (mode: 'read' | 'write' | 'remove' | 'all' | 'none') => void
} {
    const store = new Map<string, string>()
    let failMode: 'read' | 'write' | 'remove' | 'all' | 'none' = 'none'
    return {
        getItem(key) {
            if (failMode === 'read' || failMode === 'all') {
                throw new Error('SecurityError')
            }
            return store.has(key) ? (store.get(key) as string) : null
        },
        setItem(key, value) {
            if (failMode === 'write' || failMode === 'all') {
                throw new Error('QuotaExceededError')
            }
            store.set(key, value)
        },
        removeItem(key) {
            if (failMode === 'remove' || failMode === 'all') {
                throw new Error('SecurityError')
            }
            store.delete(key)
        },
        snapshot: () => new Map(store),
        fail: mode => {
            failMode = mode
        },
    }
}

const FROZEN_NOW = new Date('2026-05-20T08:00:00.000Z').getTime()
const STARTED_AT_ISO = new Date(FROZEN_NOW).toISOString()

const SAMPLE_INPUT = {
    examId: 'exam-A2-bridge-1',
    startedAt: STARTED_AT_ISO,
    remainingMs: 35 * 60 * 1000,
    answers: { 't-1': 'A', 't-2': ['option-3'] } as Record<string, unknown>,
}

beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN_NOW)
})

afterEach(() => {
    vi.useRealTimers()
})

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

describe('exam-progress-storage — constants (Req 10.6, 10.7)', () => {
    it('saves every 5 seconds (Req 10.6)', () => {
        // Saving cadence is fixed at 5_000 ms — used by the React glue.
        expect(EXAM_PROGRESS_SAVE_INTERVAL_MS).toBe(5_000)
    })

    it('TTL is 60 minutes (Req 10.7)', () => {
        // Recovery window is exactly 60 min after `startedAt`.
        expect(EXAM_RECOVERY_TTL_MS).toBe(60 * 60 * 1000)
    })
})

// -----------------------------------------------------------------------------
// Key naming
// -----------------------------------------------------------------------------

describe('examProgressKey — namespacing (Req 10.6)', () => {
    it('uses the documented `exam:{examId}:progress` shape', () => {
        expect(examProgressKey('exam-1')).toBe('exam:exam-1:progress')
    })

    it('encodes unusual characters so the namespace cannot collide', () => {
        // A `:` inside the id would otherwise inject a fake segment.
        const key = examProgressKey('exam:1')
        expect(key.startsWith('exam:')).toBe(true)
        expect(key.endsWith(':progress')).toBe(true)
        // The exam-id segment never contains a literal unencoded colon.
        const middle = key.slice('exam:'.length, -':progress'.length)
        expect(middle).toBe('exam%3A1')
    })
})

// -----------------------------------------------------------------------------
// Save
// -----------------------------------------------------------------------------

describe('saveExamProgress — Req 10.6 shape', () => {
    it('writes a snapshot whose shape matches design §Data Models exactly', () => {
        const storage = createMemoryStorage()

        const snapshot = saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)

        expect(Object.keys(snapshot).sort()).toEqual(
            [
                'answers',
                'examId',
                'lastSavedAt',
                'remainingMs',
                'startedAt',
            ].sort(),
        )
        expect(snapshot.examId).toBe(SAMPLE_INPUT.examId)
        expect(snapshot.startedAt).toBe(SAMPLE_INPUT.startedAt)
        expect(snapshot.remainingMs).toBe(SAMPLE_INPUT.remainingMs)
        expect(snapshot.answers).toEqual(SAMPLE_INPUT.answers)
        expect(snapshot.lastSavedAt).toBe(STARTED_AT_ISO)
    })

    it('persists the snapshot under the canonical key', () => {
        const storage = createMemoryStorage()
        saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)
        const raw = storage.snapshot().get(examProgressKey(SAMPLE_INPUT.examId))
        expect(raw).toBeDefined()
        const parsed = JSON.parse(raw as string) as LocalExamProgress
        expect(parsed.examId).toBe(SAMPLE_INPUT.examId)
        expect(parsed.remainingMs).toBe(SAMPLE_INPUT.remainingMs)
    })

    it('clamps negative or non-finite remainingMs to 0', () => {
        const storage = createMemoryStorage()
        const snapshot = saveExamProgress(
            storage,
            { ...SAMPLE_INPUT, remainingMs: -10 },
            FROZEN_NOW,
        )
        expect(snapshot.remainingMs).toBe(0)
    })

    it('updates lastSavedAt on every save while preserving startedAt', () => {
        const storage = createMemoryStorage()
        saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)

        // Advance 5s — the host re-saves at the next interval tick.
        vi.advanceTimersByTime(EXAM_PROGRESS_SAVE_INTERVAL_MS)
        const next = saveExamProgress(
            storage,
            { ...SAMPLE_INPUT, remainingMs: SAMPLE_INPUT.remainingMs - 5_000 },
            Date.now(),
        )

        expect(next.startedAt).toBe(SAMPLE_INPUT.startedAt)
        expect(next.lastSavedAt).not.toBe(STARTED_AT_ISO)
        expect(Date.parse(next.lastSavedAt)).toBe(FROZEN_NOW + 5_000)
    })

    it('does not crash when storage.setItem throws (private mode / quota)', () => {
        const storage = createMemoryStorage()
        storage.fail('write')
        expect(() =>
            saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW),
        ).not.toThrow()
    })
})

// -----------------------------------------------------------------------------
// Load — TTL behaviour (Req 10.7)
// -----------------------------------------------------------------------------

describe('loadExamProgress — Req 10.7 (60-minute recovery window)', () => {
    it('restores a snapshot saved seconds ago', () => {
        const storage = createMemoryStorage()
        saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)

        const loaded = loadExamProgress(
            storage,
            SAMPLE_INPUT.examId,
            FROZEN_NOW + 10_000,
        )

        expect(loaded).not.toBeNull()
        expect(loaded?.answers).toEqual(SAMPLE_INPUT.answers)
        expect(loaded?.remainingMs).toBe(SAMPLE_INPUT.remainingMs)
    })

    it('restores a snapshot saved 30 minutes ago (within TTL)', () => {
        const storage = createMemoryStorage()
        saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)

        const loaded = loadExamProgress(
            storage,
            SAMPLE_INPUT.examId,
            FROZEN_NOW + 30 * 60 * 1000,
        )

        expect(loaded).not.toBeNull()
        expect(loaded?.examId).toBe(SAMPLE_INPUT.examId)
    })

    it('restores at exactly the 60-minute boundary', () => {
        const storage = createMemoryStorage()
        saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)

        const loaded = loadExamProgress(
            storage,
            SAMPLE_INPUT.examId,
            FROZEN_NOW + EXAM_RECOVERY_TTL_MS,
        )

        // Boundary is inclusive — only `now - startedAt > TTL` evicts.
        expect(loaded).not.toBeNull()
    })

    it('discards a snapshot saved 70 minutes ago (TTL expired)', () => {
        const storage = createMemoryStorage()
        saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)

        const loaded = loadExamProgress(
            storage,
            SAMPLE_INPUT.examId,
            FROZEN_NOW + 70 * 60 * 1000,
        )

        expect(loaded).toBeNull()
        // Eviction also clears the entry so a fresh attempt starts clean.
        expect(
            storage.snapshot().has(examProgressKey(SAMPLE_INPUT.examId)),
        ).toBe(false)
    })

    it('returns null when no snapshot exists', () => {
        const storage = createMemoryStorage()
        expect(loadExamProgress(storage, 'unknown', FROZEN_NOW)).toBeNull()
    })

    it('drops corrupted JSON entries instead of crashing', () => {
        const storage = createMemoryStorage()
        storage.setItem(examProgressKey(SAMPLE_INPUT.examId), '{not-json')

        const loaded = loadExamProgress(storage, SAMPLE_INPUT.examId, FROZEN_NOW)

        expect(loaded).toBeNull()
        expect(
            storage.snapshot().has(examProgressKey(SAMPLE_INPUT.examId)),
        ).toBe(false)
    })

    it('rejects snapshots that fail the shape guard', () => {
        const storage = createMemoryStorage()
        storage.setItem(
            examProgressKey(SAMPLE_INPUT.examId),
            JSON.stringify({ examId: SAMPLE_INPUT.examId }),
        )
        expect(
            loadExamProgress(storage, SAMPLE_INPUT.examId, FROZEN_NOW),
        ).toBeNull()
    })

    it('rejects snapshots with a mismatched examId (slot reused)', () => {
        const storage = createMemoryStorage()
        saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)
        // Hand-write a snapshot under SAMPLE_INPUT's key but for another exam.
        storage.setItem(
            examProgressKey(SAMPLE_INPUT.examId),
            JSON.stringify({
                ...SAMPLE_INPUT,
                examId: 'exam-different',
                lastSavedAt: STARTED_AT_ISO,
            }),
        )
        expect(
            loadExamProgress(storage, SAMPLE_INPUT.examId, FROZEN_NOW),
        ).toBeNull()
    })

    it('returns null when storage.getItem throws', () => {
        const storage = createMemoryStorage()
        storage.fail('read')
        expect(
            loadExamProgress(storage, SAMPLE_INPUT.examId, FROZEN_NOW),
        ).toBeNull()
    })
})

// -----------------------------------------------------------------------------
// Clear
// -----------------------------------------------------------------------------

describe('clearExamProgress', () => {
    it('removes a stored snapshot', () => {
        const storage = createMemoryStorage()
        saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)
        clearExamProgress(storage, SAMPLE_INPUT.examId)
        expect(
            storage.snapshot().has(examProgressKey(SAMPLE_INPUT.examId)),
        ).toBe(false)
    })

    it('is a no-op when nothing is stored', () => {
        const storage = createMemoryStorage()
        expect(() =>
            clearExamProgress(storage, SAMPLE_INPUT.examId),
        ).not.toThrow()
    })

    it('does not crash when storage.removeItem throws', () => {
        const storage = createMemoryStorage()
        saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)
        storage.fail('remove')
        expect(() =>
            clearExamProgress(storage, SAMPLE_INPUT.examId),
        ).not.toThrow()
    })
})

// -----------------------------------------------------------------------------
// Round-trip
// -----------------------------------------------------------------------------

describe('round-trip — save → load preserves shape (Req 10.6 + 10.7)', () => {
    it('a saved snapshot reloaded within the window is structurally identical', () => {
        const storage = createMemoryStorage()
        const written = saveExamProgress(storage, SAMPLE_INPUT, FROZEN_NOW)

        const loaded = loadExamProgress(
            storage,
            SAMPLE_INPUT.examId,
            FROZEN_NOW + 1_000,
        )

        expect(loaded).toEqual(written)
    })
})
