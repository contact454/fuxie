import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

type Viewport = {
    id: string
    width: number
    height: number
}

type Surface = {
    id: string
    priority: 'P0' | 'P1' | 'P2'
    route: string
    villageRole: string
    primaryJob: string
    expectedScreenshots: Record<string, string>
    existingEvidence: string[]
    assetRefs: string[]
    qaFocus: string[]
}

type Manifest = {
    schemaVersion: number
    baseUrl: string
    auth: {
        role: string
        env: string
        loginPath: string
    }
    viewports: Viewport[]
    surfaces: Surface[]
}

type SurfaceAudit = {
    surface: Surface
    missingExpectedScreenshots: string[]
    existingExpectedScreenshots: string[]
    missingExistingEvidence: string[]
    presentExistingEvidence: string[]
    missingAssets: string[]
    presentAssets: string[]
}

const root = process.cwd()
const manifestPath = path.join(root, 'docs/design/visual-audit/learner-ui-screenshot-manifest.json')
const reportPath = path.join(root, 'tmp/learner-ui-visual-audit.md')
const jsonReportPath = path.join(root, 'tmp/learner-ui-visual-audit.json')

function main() {
    const manifest = readJson<Manifest>(manifestPath)
    const audits = manifest.surfaces.map(auditSurface)
    const summary = buildSummary(manifest, audits)

    mkdirSync(path.dirname(reportPath), { recursive: true })
    writeFileSync(reportPath, renderMarkdown(manifest, audits, summary), 'utf8')
    writeFileSync(jsonReportPath, JSON.stringify({ summary, surfaces: audits }, null, 2), 'utf8')

    console.log(`[learner-ui-visual-audit] Surfaces: ${manifest.surfaces.length}`)
    console.log(`[learner-ui-visual-audit] Expected screenshots present: ${summary.expectedScreenshotsPresent}/${summary.expectedScreenshotsTotal}`)
    console.log(`[learner-ui-visual-audit] Existing evidence present: ${summary.existingEvidencePresent}/${summary.existingEvidenceTotal}`)
    console.log(`[learner-ui-visual-audit] Asset refs present: ${summary.assetsPresent}/${summary.assetsTotal}`)
    console.log(`[learner-ui-visual-audit] Markdown report: ${path.relative(root, reportPath)}`)
    console.log(`[learner-ui-visual-audit] JSON report: ${path.relative(root, jsonReportPath)}`)
}

function auditSurface(surface: Surface): SurfaceAudit {
    const expected = Object.values(surface.expectedScreenshots)
    const missingExpectedScreenshots = expected.filter((file) => !exists(file))
    const existingExpectedScreenshots = expected.filter(exists)
    const missingExistingEvidence = surface.existingEvidence.filter((file) => !exists(file))
    const presentExistingEvidence = surface.existingEvidence.filter(exists)
    const missingAssets = surface.assetRefs.filter((asset) => !exists(publicAssetPath(asset)))
    const presentAssets = surface.assetRefs.filter((asset) => exists(publicAssetPath(asset)))

    return {
        surface,
        missingExpectedScreenshots,
        existingExpectedScreenshots,
        missingExistingEvidence,
        presentExistingEvidence,
        missingAssets,
        presentAssets,
    }
}

function buildSummary(manifest: Manifest, audits: SurfaceAudit[]) {
    const expectedScreenshotsTotal = audits.reduce((sum, audit) => sum + Object.keys(audit.surface.expectedScreenshots).length, 0)
    const expectedScreenshotsPresent = audits.reduce((sum, audit) => sum + audit.existingExpectedScreenshots.length, 0)
    const existingEvidenceTotal = audits.reduce((sum, audit) => sum + audit.surface.existingEvidence.length, 0)
    const existingEvidencePresent = audits.reduce((sum, audit) => sum + audit.presentExistingEvidence.length, 0)
    const assetsTotal = audits.reduce((sum, audit) => sum + audit.surface.assetRefs.length, 0)
    const assetsPresent = audits.reduce((sum, audit) => sum + audit.presentAssets.length, 0)
    const p0MissingScreenshots = audits
        .filter((audit) => audit.surface.priority === 'P0' && audit.missingExpectedScreenshots.length > 0)
        .map((audit) => audit.surface.id)
    const missingAssetSurfaces = audits
        .filter((audit) => audit.missingAssets.length > 0)
        .map((audit) => audit.surface.id)

    return {
        baseUrl: manifest.baseUrl,
        viewportCount: manifest.viewports.length,
        surfaceCount: manifest.surfaces.length,
        expectedScreenshotsTotal,
        expectedScreenshotsPresent,
        expectedScreenshotsMissing: expectedScreenshotsTotal - expectedScreenshotsPresent,
        existingEvidenceTotal,
        existingEvidencePresent,
        existingEvidenceMissing: existingEvidenceTotal - existingEvidencePresent,
        assetsTotal,
        assetsPresent,
        assetsMissing: assetsTotal - assetsPresent,
        p0MissingScreenshots,
        missingAssetSurfaces,
    }
}

function renderMarkdown(manifest: Manifest, audits: SurfaceAudit[], summary: ReturnType<typeof buildSummary>) {
    const lines: string[] = []
    lines.push('# Learner UI Visual Audit Inventory')
    lines.push('')
    lines.push(`Generated: ${new Date().toISOString()}`)
    lines.push('')
    lines.push('## Summary')
    lines.push('')
    lines.push(`- Base URL: \`${manifest.baseUrl}\``)
    lines.push(`- Dev auth: \`${manifest.auth.env}\`, role \`${manifest.auth.role}\``)
    lines.push(`- Surfaces: ${summary.surfaceCount}`)
    lines.push(`- Expected screenshots present: ${summary.expectedScreenshotsPresent}/${summary.expectedScreenshotsTotal}`)
    lines.push(`- Existing evidence present: ${summary.existingEvidencePresent}/${summary.existingEvidenceTotal}`)
    lines.push(`- Asset refs present: ${summary.assetsPresent}/${summary.assetsTotal}`)
    lines.push('')

    if (summary.p0MissingScreenshots.length > 0) {
        lines.push('## P0 Screenshot Gaps')
        lines.push('')
        for (const id of summary.p0MissingScreenshots) {
            lines.push(`- ${id}`)
        }
        lines.push('')
    }

    if (summary.missingAssetSurfaces.length > 0) {
        lines.push('## Missing Asset Refs')
        lines.push('')
        for (const audit of audits.filter((item) => item.missingAssets.length > 0)) {
            lines.push(`- ${audit.surface.id}: ${audit.missingAssets.map((asset) => `\`${asset}\``).join(', ')}`)
        }
        lines.push('')
    }

    lines.push('## Surface Detail')
    lines.push('')
    lines.push('| Surface | Priority | Route | Village role | Expected screenshots | Existing evidence | Assets |')
    lines.push('| --- | --- | --- | --- | --- | --- | --- |')
    for (const audit of audits) {
        lines.push([
            audit.surface.id,
            audit.surface.priority,
            `\`${audit.surface.route}\``,
            audit.surface.villageRole,
            status(audit.existingExpectedScreenshots.length, Object.keys(audit.surface.expectedScreenshots).length),
            status(audit.presentExistingEvidence.length, audit.surface.existingEvidence.length),
            status(audit.presentAssets.length, audit.surface.assetRefs.length),
        ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
    }

    lines.push('')
    lines.push('## Capture Queue')
    lines.push('')
    for (const audit of audits.filter((item) => item.missingExpectedScreenshots.length > 0)) {
        lines.push(`### ${audit.surface.priority} ${audit.surface.id}`)
        lines.push('')
        lines.push(`- Route: \`${audit.surface.route}\``)
        lines.push(`- Village role: ${audit.surface.villageRole}`)
        lines.push(`- Primary job: ${audit.surface.primaryJob}`)
        lines.push('- Missing screenshots:')
        for (const file of audit.missingExpectedScreenshots) {
            lines.push(`  - \`${file}\``)
        }
        lines.push('- QA focus:')
        for (const item of audit.surface.qaFocus) {
            lines.push(`  - ${item}`)
        }
        lines.push('')
    }

    return `${lines.join('\n')}\n`
}

function status(present: number, total: number) {
    if (total === 0) return 'n/a'
    return `${present}/${total}`
}

function publicAssetPath(assetRef: string) {
    return path.join(root, 'apps/web/public', assetRef.replace(/^\/+/, ''))
}

function exists(filePath: string) {
    return existsSync(path.isAbsolute(filePath) ? filePath : path.join(root, filePath))
}

function readJson<T>(filePath: string): T {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

main()
