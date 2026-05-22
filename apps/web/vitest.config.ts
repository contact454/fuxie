import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        clearMocks: true,
        restoreMocks: true,
    },
    esbuild: {
        // React 19 + Next 15 use the automatic JSX runtime; without this the
        // esbuild transform falls back to classic JSX (`React.createElement`)
        // which requires `React` to be in scope and breaks `.tsx` tests that
        // import production components rendered with renderToStaticMarkup.
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
