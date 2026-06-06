import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Root-level Vitest config used by `pnpm test:property` to run the
 * property-based test suites declared by spec
 * `gamified-ui-asset-rollout` (design §"Testing Strategy" / Map
 * Property → Test file). The PBT spec files live under the
 * repository-root `tests/` folder so they can scan the public asset
 * tree, the Asset Registry source, and message JSON without needing
 * to be inside the `apps/web` workspace.
 *
 * Integration suites under `tests/integration/`:
 *   - `a11y.spec.tsx` (task 18.2) is a Vitest + JSDOM accessibility
 *     audit that DOES run here.
 *   - `perf.spec.ts` (task 18.1) is a Playwright suite — it imports
 *     `@playwright/test`, which throws when invoked outside the
 *     Playwright runner. We therefore exclude `**\/perf.spec.ts` and
 *     any future `**\/*.pw.spec.{ts,tsx}` Playwright-flavoured spec
 *     from the Vitest include glob. Those run via
 *     `pnpm test:integration:perf` (see
 *     `tests/integration/playwright.config.ts`).
 *   - `visual-capture.spec.ts` (spec
 *     `visual-qa-screenshot-capture`, Decision 4) is also a
 *     Playwright suite and is excluded for the same reason. It runs
 *     via `pnpm test:integration:capture` against the new
 *     `chromium-mobile-capture` Playwright project.
 *
 * `passWithNoTests` is wired so that this script is a green gate
 * before any optional starred PBT subtask has landed; the CI guard
 * tightens automatically as `tests/*.spec.{ts,tsx}` files appear.
 */
export default defineConfig({
    test: {
        include: ['tests/**/*.spec.{ts,tsx}'],
        // Playwright specs live alongside Vitest specs in
        // `tests/integration/` (task 18.1 + 18.2). They must NOT load
        // here because importing `@playwright/test` outside the
        // Playwright runner throws "test.describe() did not expect to
        // be called here". The Playwright runner has its own
        // `testMatch` allow-list that mirrors this exclude.
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'tests/integration/perf.spec.ts',
            'tests/integration/visual-capture.spec.ts',
            'tests/integration/**/*.pw.spec.{ts,tsx}',
        ],
        environment: 'node',
        clearMocks: true,
        restoreMocks: true,
        passWithNoTests: true,
    },
    esbuild: {
        // Match apps/web vitest config so .tsx PBT specs render React
        // components with the automatic JSX runtime.
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            '@web': path.resolve(__dirname, 'apps/web/src'),
            // The `@/` alias is the path-mapping convention used inside
            // the `apps/web` workspace (see `apps/web/tsconfig.json` and
            // `apps/web/vitest.config.ts`). When backbone components
            // are rendered from `tests/integration/a11y.spec.tsx` we
            // need to resolve `@/components/...`, `@/lib/...`, etc.
            // through the same path so the imports inside the
            // production source code keep working.
            '@/': `${path.resolve(__dirname, 'apps/web/src')}/`,
            '@': path.resolve(__dirname, 'apps/web/src'),
            // The automatic JSX runtime expects to import
            // `react/jsx-runtime` and `react/jsx-dev-runtime`. React is
            // installed under the `apps/web` workspace (where the Next
            // app uses it), not at the repo root, so we alias the
            // bare specifier and the JSX runtime entrypoints to the
            // workspace copy. Without this, `tests/integration/a11y.spec.tsx`
            // (task 18.2) cannot resolve `react/jsx-dev-runtime` when
            // run via this config.
            react: path.resolve(__dirname, 'apps/web/node_modules/react'),
            'react-dom': path.resolve(__dirname, 'apps/web/node_modules/react-dom'),
            'next-intl': path.resolve(__dirname, 'apps/web/node_modules/next-intl'),
        },
    },
})
