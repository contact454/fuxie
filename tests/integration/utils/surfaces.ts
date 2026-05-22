/**
 * P0 surface catalog used by the integration test suites.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer
 *
 * Spec source-of-truth:
 *   - requirements.md Req 20.1 enumerates the 13 P0 surfaces.
 *   - apps/web/src/lib/mascot/mascot-role.ts P0_SURFACE_IDS is the runtime
 *     enum mirror (the cross-surface `result-reward` overlay is not a
 *     route and is excluded here).
 *
 * Each entry maps a surface ID to a deterministic learner URL we can
 * navigate to with the dev-auth learner identity. Where a surface
 * requires seeded content that may be missing on a fresh CI machine, the
 * entry sets `requiresSeed: true` and `seedNote` so the test can mark
 * itself `test.skip` cleanly with a PM follow-up reason.
 */

export interface P0Surface {
    /** Stable surface identifier (matches `SURFACE_MASCOT_CONFIG`). */
    id: string
    /** Human-friendly label for test titles + reports. */
    label: string
    /** Path the learner navigates to; combined with `BASE_URL`. */
    path: string
    /**
     * `true` when the route requires seeded data (e.g. an exam template
     * keyed by ID). The test will `test.skip` with `seedNote` when
     * `FUXIE_PLAYWRIGHT_SKIP_SEEDED=1` is set or when the navigation
     * surfaces a 404.
     */
    requiresSeed?: boolean
    seedNote?: string
}

/**
 * Canonical P0 surface list. Slugs come from `scripts/seed-dev-data.ts`
 * (`L-A1-GOETHE-001-T1`, `dev-a1-begruessung-01`, `dev-a1-goethe-mini`)
 * and from the published `content/a1` fixtures (`A1-T1-001`,
 * `W-A1-T1-001`).
 */
export const P0_SURFACES: P0Surface[] = [
    {
        id: 'dashboard',
        label: 'Dashboard (Village Square)',
        path: '/dashboard',
    },
    {
        id: 'course',
        label: 'Course path (A1)',
        path: '/course?level=A1',
    },
    {
        id: 'vocabulary',
        label: 'Vocabulary collection',
        path: '/vocabulary',
    },
    {
        id: 'vocabulary-practice',
        label: 'Vocabulary practice',
        path: '/vocabulary/practice',
    },
    {
        id: 'vocabulary-microgames',
        label: 'Vocabulary microgames',
        path: '/vocabulary/microgames',
    },
    {
        id: 'reading',
        label: 'Reading player (A1-T1-001)',
        path: '/reading/A1-T1-001',
        requiresSeed: true,
        seedNote:
            'Requires reading exercise A1-T1-001 (content/a1/reading/A1-T1-001.json). Run `pnpm db:seed:dev` if missing.',
    },
    {
        id: 'listening',
        label: 'Listening player (L-A1-GOETHE-001-T1)',
        path: '/listening/L-A1-GOETHE-001-T1',
        requiresSeed: true,
        seedNote:
            'Requires listening lesson L-A1-GOETHE-001-T1 (seedListening in scripts/seed-dev-data.ts).',
    },
    {
        id: 'speaking',
        label: 'Speaking player (dev-a1-begruessung-01)',
        path: '/speaking/dev-a1-begruessung-01',
        requiresSeed: true,
        seedNote:
            'Requires speaking lesson dev-a1-begruessung-01 (seedSpeaking in scripts/seed-dev-data.ts).',
    },
    {
        id: 'speaking-roleplay',
        label: 'Speaking roleplay (self-intro)',
        path: '/speaking/roleplay?scenario=self-intro&level=A1',
    },
    {
        id: 'writing',
        label: 'Writing player (W-A1-T1-001)',
        path: '/writing/W-A1-T1-001',
        requiresSeed: true,
        seedNote:
            'Requires writing exercise W-A1-T1-001 (content/a1/writing/W-A1-T1-001.json).',
    },
    {
        id: 'review',
        label: 'Review next-action',
        path: '/review',
    },
    {
        id: 'rewards-shop',
        label: 'Rewards shop',
        path: '/rewards/shop',
    },
    {
        id: 'exam',
        label: 'Exam (dev-a1-goethe-mini)',
        path: '/exam/dev-a1-goethe-mini',
        requiresSeed: true,
        seedNote:
            'Requires exam template dev-a1-goethe-mini (seedExam in scripts/seed-dev-data.ts). Page redirects when template missing — perf budgets cannot be measured.',
    },
]
