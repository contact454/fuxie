import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

interface AppBuildManifest {
    pages: Record<string, string[]>
}

interface RouteBudget {
    route: string
    maxGzipKb: number
}

interface RouteSize {
    route: string
    manifestKey: string
    gzipKb: number
    rawKb: number
    jsFiles: number
}

const root = process.cwd()
const webNextDir = path.join(root, 'apps', 'web', '.next')
const manifestPath = path.join(webNextDir, 'app-build-manifest.json')
const strict = !process.argv.includes('--warn-only') && process.env.BUNDLE_BUDGET_STRICT !== '0'
const listOnly = process.argv.includes('--list')

const routeBudgets: RouteBudget[] = [
    { route: '/', maxGzipKb: 115 },
    { route: '/admin', maxGzipKb: 115 },
    { route: '/admin/ai-costs', maxGzipKb: 115 },
    { route: '/admin/feedback', maxGzipKb: 115 },
    { route: '/admin/learning', maxGzipKb: 115 },
    { route: '/admin/ops', maxGzipKb: 115 },
    { route: '/admin/rewards', maxGzipKb: 115 },
    { route: '/admin/users', maxGzipKb: 115 },
    { route: '/admin/vocabulary', maxGzipKb: 115 },
    { route: '/teacher', maxGzipKb: 115 },
    { route: '/teacher/classrooms', maxGzipKb: 115 },
    { route: '/teacher/classrooms/[id]', maxGzipKb: 115 },
    { route: '/teacher/students/[id]', maxGzipKb: 115 },
    { route: '/exam', maxGzipKb: 115 },
    { route: '/exam/[examId]', maxGzipKb: 115 },
    { route: '/exam/[examId]/result/[attemptId]', maxGzipKb: 115 },
    { route: '/fuxie-live-qa', maxGzipKb: 115 },
    { route: '/course', maxGzipKb: 115 },
    { route: '/speaking', maxGzipKb: 115 },
    { route: '/speaking/[lessonId]', maxGzipKb: 115 },
    { route: '/dashboard', maxGzipKb: 115 },
    { route: '/leaderboard', maxGzipKb: 115 },
    { route: '/review', maxGzipKb: 115 },
    { route: '/session', maxGzipKb: 115 },
    { route: '/vocabulary', maxGzipKb: 115 },
    { route: '/vocabulary/practice', maxGzipKb: 115 },
    { route: '/vocabulary/practice/[type]', maxGzipKb: 115 },
    { route: '/listening', maxGzipKb: 115 },
    { route: '/listening/[lessonId]', maxGzipKb: 115 },
    { route: '/reading', maxGzipKb: 115 },
    { route: '/reading/[exerciseId]', maxGzipKb: 115 },
    { route: '/rewards/shop', maxGzipKb: 115 },
    { route: '/writing', maxGzipKb: 115 },
    { route: '/writing/[exerciseId]', maxGzipKb: 115 },
    { route: '/grammar', maxGzipKb: 115 },
    { route: '/grammar/[topicSlug]', maxGzipKb: 115 },
    { route: '/grammar/[topicSlug]/[lessonId]', maxGzipKb: 115 },
    { route: '/grammar/mocktest', maxGzipKb: 115 },
    { route: '/chat', maxGzipKb: 115 },
    { route: '/onboarding', maxGzipKb: 115 },
    { route: '/login', maxGzipKb: 115 },
    { route: '/register', maxGzipKb: 115 },
]

function main() {
    if (!fs.existsSync(manifestPath)) {
        console.error(`[bundle-budget] Missing ${manifestPath}. Run pnpm build first.`)
        process.exit(1)
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as AppBuildManifest
    const allManifestFiles = Object.values(manifest.pages).flat()
    if (allManifestFiles.some(file => file.includes('hmr-client') || file.includes('/development/') || file.includes('next-devtools'))) {
        console.error('[bundle-budget] Build manifest looks like a dev artifact. Stop next dev, then run pnpm build before pnpm bundle:budget.')
        process.exit(1)
    }

    const sizes = Object.entries(manifest.pages)
        .filter(([key]) => key.endsWith('/page'))
        .map(([key, files]) => getRouteSize(key, files))
        .sort((a, b) => b.gzipKb - a.gzipKb)

    const missingBudgets = routeBudgets.filter(budget => !sizes.some(size => size.route === budget.route))
    if (missingBudgets.length > 0) {
        console.error(`[bundle-budget] Missing budgeted route(s): ${missingBudgets.map(item => item.route).join(', ')}`)
        process.exit(1)
    }

    const failures: string[] = []
    for (const budget of routeBudgets) {
        const routeSize = sizes.find(size => size.route === budget.route)!
        const marker = routeSize.gzipKb <= budget.maxGzipKb ? 'PASS' : strict ? 'FAIL' : 'WARN'
        console.log(
            `[bundle-budget] ${marker} ${budget.route} gzip=${routeSize.gzipKb.toFixed(1)}kb raw=${routeSize.rawKb.toFixed(1)}kb budget=${budget.maxGzipKb}kb files=${routeSize.jsFiles}`,
        )

        if (routeSize.gzipKb > budget.maxGzipKb) {
            failures.push(`${budget.route} ${routeSize.gzipKb.toFixed(1)}kb > ${budget.maxGzipKb}kb`)
        }
    }

    if (listOnly) {
        console.log('\n[bundle-budget] Top routes by initial gzipped JS:')
        for (const routeSize of sizes.slice(0, 20)) {
            console.log(`  ${routeSize.route.padEnd(42)} ${routeSize.gzipKb.toFixed(1)}kb gzip, ${routeSize.rawKb.toFixed(1)}kb raw`)
        }
    }

    if (failures.length > 0 && strict) {
        console.error(`\n[bundle-budget] ${failures.length} route(s) exceeded budget:`)
        for (const failure of failures) {
            console.error(`  - ${failure}`)
        }
        console.error('[bundle-budget] Use --warn-only or BUNDLE_BUDGET_STRICT=0 for exploratory local measurement.')
        process.exit(1)
    }
}

function getRouteSize(manifestKey: string, files: string[]): RouteSize {
    const jsFiles = unique(files.filter(file => file.endsWith('.js')))
    let rawBytes = 0
    let gzipBytes = 0

    for (const file of jsFiles) {
        const fullPath = path.join(webNextDir, file)
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Missing chunk for ${manifestKey}: ${file}`)
        }

        const bytes = fs.readFileSync(fullPath)
        rawBytes += bytes.byteLength
        gzipBytes += zlib.gzipSync(bytes).byteLength
    }

    return {
        route: normalizeRoute(manifestKey),
        manifestKey,
        gzipKb: gzipBytes / 1024,
        rawKb: rawBytes / 1024,
        jsFiles: jsFiles.length,
    }
}

function normalizeRoute(manifestKey: string) {
    const segments = manifestKey
        .split('/')
        .filter(Boolean)
        .filter(segment => !(segment.startsWith('(') && segment.endsWith(')')))
        .filter(segment => segment !== 'page')

    return `/${segments.join('/')}` || '/'
}

function unique<T>(values: T[]) {
    return [...new Set(values)]
}

main()
