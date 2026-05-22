import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

type Priority = 'P0' | 'P1' | 'P2'

type GenerationAsset = {
    id: string
    surface: string
    type: string
    outputTarget: string
    runtimeTarget: string | null
    integrationTarget: string
    prompt: string
}

type GenerationBatch = {
    id: string
    priority: Priority
    purpose: string
    assets: GenerationAsset[]
}

type GenerationManifest = {
    schemaVersion: number
    strategy: string
    createdAt: string
    updatedAt?: string
    styleContract: {
        palette: string[]
        medium: string
        world: string
        avoid: string[]
    }
    batches: GenerationBatch[]
}

const root = process.cwd()
const manifestPath = path.join(root, 'docs/design/visual-audit/fuxie-german-village-image-generation-manifest.json')
const reportPath = path.join(root, 'tmp/fuxie-image-generation-plan.md')
const jsonReportPath = path.join(root, 'tmp/fuxie-image-generation-plan.json')

function main() {
    const manifest = readJson<GenerationManifest>(manifestPath)
    const assets = manifest.batches.flatMap((batch) => batch.assets.map((asset) => ({ batch, asset })))
    const duplicateAssetIds = duplicates(assets.map(({ asset }) => asset.id))
    const duplicateOutputTargets = duplicates(assets.map(({ asset }) => asset.outputTarget))
    const missingPromptAssets = assets.filter(({ asset }) => asset.prompt.trim().length < 24).map(({ asset }) => asset.id)
    const generatedSourceAssets = assets.filter(({ asset }) => existsSync(path.join(root, asset.outputTarget))).map(({ asset }) => asset.id)
    const generatedRuntimeAssets = assets.filter(({ asset }) => asset.runtimeTarget && existsSync(path.join(root, asset.runtimeTarget))).map(({ asset }) => asset.id)
    const countsByPriority = countBy(assets, ({ batch }) => batch.priority)
    const countsByType = countBy(assets, ({ asset }) => asset.type)
    const countsBySurface = countBy(assets.flatMap(({ asset }) => asset.surface.split(',').map((surface) => ({ surface: surface.trim() }))), ({ surface }) => surface)

    const summary = {
        strategy: manifest.strategy,
        createdAt: manifest.createdAt,
        batchCount: manifest.batches.length,
        assetCount: assets.length,
        countsByPriority,
        countsByType,
        countsBySurface,
        duplicateAssetIds,
        duplicateOutputTargets,
        missingPromptAssets,
        generatedSourceAssets,
        generatedRuntimeAssets,
    }

    mkdirSync(path.dirname(reportPath), { recursive: true })
    writeFileSync(jsonReportPath, JSON.stringify({ summary, batches: manifest.batches }, null, 2), 'utf8')
    writeFileSync(reportPath, renderMarkdown(manifest, summary), 'utf8')

    console.log(`[fuxie-image-generation-plan] Batches: ${summary.batchCount}`)
    console.log(`[fuxie-image-generation-plan] Assets: ${summary.assetCount}`)
    console.log(`[fuxie-image-generation-plan] P0 assets: ${countsByPriority.P0 ?? 0}`)
    console.log(`[fuxie-image-generation-plan] Duplicate asset ids: ${duplicateAssetIds.length}`)
    console.log(`[fuxie-image-generation-plan] Duplicate output targets: ${duplicateOutputTargets.length}`)
    console.log(`[fuxie-image-generation-plan] Generated source assets: ${generatedSourceAssets.length}/${summary.assetCount}`)
    console.log(`[fuxie-image-generation-plan] Generated runtime assets: ${generatedRuntimeAssets.length}/${assets.filter(({ asset }) => asset.runtimeTarget).length}`)
    console.log(`[fuxie-image-generation-plan] Markdown report: ${path.relative(root, reportPath)}`)
    console.log(`[fuxie-image-generation-plan] JSON report: ${path.relative(root, jsonReportPath)}`)

    if (duplicateAssetIds.length > 0 || duplicateOutputTargets.length > 0 || missingPromptAssets.length > 0) {
        process.exitCode = 1
    }
}

function renderMarkdown(manifest: GenerationManifest, summary: ReturnType<typeof buildSummaryShape>) {
    const lines: string[] = []
    lines.push('# Fuxie Image Generation Plan')
    lines.push('')
    lines.push(`Generated: ${new Date().toISOString()}`)
    lines.push(`Strategy: ${manifest.strategy}`)
    if (manifest.updatedAt) lines.push(`Manifest updated: ${manifest.updatedAt}`)
    lines.push('')
    lines.push('## Summary')
    lines.push('')
    lines.push(`- Batches: ${summary.batchCount}`)
    lines.push(`- Assets: ${summary.assetCount}`)
    lines.push(`- P0 assets: ${summary.countsByPriority.P0 ?? 0}`)
    lines.push(`- P1 assets: ${summary.countsByPriority.P1 ?? 0}`)
    lines.push(`- Generated source assets: ${summary.generatedSourceAssets.length}/${summary.assetCount}`)
    lines.push(`- Generated runtime assets: ${summary.generatedRuntimeAssets.length}/${manifest.batches.flatMap((batch) => batch.assets).filter((asset) => asset.runtimeTarget).length}`)
    lines.push(`- Duplicate asset ids: ${summary.duplicateAssetIds.length}`)
    lines.push(`- Duplicate output targets: ${summary.duplicateOutputTargets.length}`)
    lines.push('')
    lines.push('## Style Contract')
    lines.push('')
    lines.push(`- Medium: ${manifest.styleContract.medium}`)
    lines.push(`- World: ${manifest.styleContract.world}`)
    lines.push(`- Palette: ${manifest.styleContract.palette.map((color) => `\`${color}\``).join(', ')}`)
    lines.push(`- Avoid: ${manifest.styleContract.avoid.join(', ')}`)
    lines.push('')

    for (const batch of manifest.batches) {
        lines.push(`## ${batch.id}`)
        lines.push('')
        lines.push(`Priority: ${batch.priority}`)
        lines.push(`Purpose: ${batch.purpose}`)
        lines.push('')
        lines.push('| Asset | Surface | Type | Output | Runtime | Generated | Integration |')
        lines.push('| --- | --- | --- | --- | --- | --- | --- |')
        for (const asset of batch.assets) {
            const sourceGenerated = existsSync(path.join(root, asset.outputTarget))
            const runtimeGenerated = asset.runtimeTarget ? existsSync(path.join(root, asset.runtimeTarget)) : false
            lines.push([
                asset.id,
                asset.surface,
                asset.type,
                `\`${asset.outputTarget}\``,
                asset.runtimeTarget ? `\`${asset.runtimeTarget}\`` : 'n/a',
                asset.runtimeTarget ? `${sourceGenerated ? 'source' : 'source pending'} / ${runtimeGenerated ? 'runtime' : 'runtime pending'}` : sourceGenerated ? 'source' : 'pending',
                asset.integrationTarget,
            ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
        }
        lines.push('')
    }

    return `${lines.join('\n')}\n`
}

function buildSummaryShape() {
    return {
        batchCount: 0,
        assetCount: 0,
        countsByPriority: {} as Record<string, number>,
        duplicateAssetIds: [] as string[],
        duplicateOutputTargets: [] as string[],
        generatedSourceAssets: [] as string[],
        generatedRuntimeAssets: [] as string[],
    }
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
    return items.reduce<Record<string, number>>((counts, item) => {
        const key = keyFn(item)
        counts[key] = (counts[key] ?? 0) + 1
        return counts
    }, {})
}

function duplicates(values: string[]) {
    const seen = new Set<string>()
    const duplicate = new Set<string>()
    for (const value of values) {
        if (seen.has(value)) duplicate.add(value)
        seen.add(value)
    }
    return [...duplicate].sort()
}

function readJson<T>(filePath: string): T {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

main()
