const fs = require('node:fs')
const path = require('node:path')
const { Module } = require('node:module')

const root = process.cwd()
const pnpmNodeModules = path.join(root, 'node_modules', '.pnpm', 'node_modules')

if (fs.existsSync(pnpmNodeModules)) {
  process.env.NODE_PATH = process.env.NODE_PATH
    ? `${process.env.NODE_PATH}${path.delimiter}${pnpmNodeModules}`
    : pnpmNodeModules
  Module._initPaths()
}

const sharp = require('sharp')

const manifestPath = path.join(root, 'apps/web/public/fuxie-global-village-runtime-draft-manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''))
const publicRoot = path.join(root, 'apps/web/public')

const MIN_TRANSPARENT_RATIO = 0.25
const MIN_RUNTIME_SOURCE_TRANSPARENT_RATIO = 0.05
const SOURCE_SCAN_ROOTS = [path.join(root, 'apps/web/src')]
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.json', '.ts', '.tsx'])
const RASTER_EXTENSIONS = new Set(['.jpeg', '.jpg', '.png', '.webp'])
const CUTOUT_QA_EXCLUDED_PREFIXES = [
  '/mascot-3d/foundation/',
  '/mascot-3d/imagegen-fullbody/',
  '/mascot-3d/live/',
  '/mascot-3d/reference-parts/',
]
const PUBLIC_ASSET_PATTERN = /['"](\/(?:mascot-3d|reward-assets)\/[^'"]+)['"]/g

async function inspectRasterPath(absolutePath) {
  const metadata = await sharp(absolutePath).metadata()
  const { data } = await sharp(absolutePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  let transparentPixels = 0
  let visiblePixels = 0

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] <= 16) {
      transparentPixels += 1
    } else {
      visiblePixels += 1
    }
  }

  const transparentRatio = transparentPixels / Math.max(1, transparentPixels + visiblePixels)

  return {
    hasAlpha: metadata.hasAlpha === true,
    transparentRatio,
  }
}

async function inspectAsset(asset) {
  const absolutePath = path.join(root, asset.runtimeFile)
  const inspection = await inspectRasterPath(absolutePath)

  return {
    id: asset.id,
    item: asset.item,
    assetType: asset.assetType,
    runtimeFile: asset.runtimeFile,
    ...inspection,
  }
}

async function inspectPublicRuntimePath(publicPath) {
  const absolutePath = path.join(publicRoot, publicPath.replace(/^\//, ''))
  const inspection = await inspectRasterPath(absolutePath)

  return {
    publicPath,
    runtimeFile: path.relative(root, absolutePath).replace(/\\/g, '/'),
    ...inspection,
  }
}

function walkSourceFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkSourceFiles(absolutePath, files)
      continue
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath)
    }
  }

  return files
}

function collectRuntimeSourcePaths() {
  const publicPaths = new Set()

  for (const rootDir of SOURCE_SCAN_ROOTS) {
    for (const file of walkSourceFiles(rootDir)) {
      const source = fs.readFileSync(file, 'utf8')
      for (const match of source.matchAll(PUBLIC_ASSET_PATTERN)) {
        const publicPath = match[1]
        if (!isCutoutQaExcludedPath(publicPath)) {
          publicPaths.add(publicPath)
        }
      }
    }
  }

  return [...publicPaths].sort()
}

function isRasterPublicPath(publicPath) {
  return RASTER_EXTENSIONS.has(path.extname(publicPath).toLowerCase())
}

function isCutoutQaExcludedPath(publicPath) {
  return CUTOUT_QA_EXCLUDED_PREFIXES.some((prefix) => publicPath.startsWith(prefix))
}

async function main() {
  const results = []

  for (const asset of manifest.runtimeDraftAssets) {
    results.push(await inspectAsset(asset))
  }

  const failures = results.filter((asset) =>
    !asset.hasAlpha || asset.transparentRatio < MIN_TRANSPARENT_RATIO
  )

  const runtimeSourceResults = []
  const missingRuntimeSourcePaths = []

  const runtimeSourcePaths = collectRuntimeSourcePaths()
  const rasterRuntimeSourcePaths = runtimeSourcePaths.filter(isRasterPublicPath)
  const nonRasterRuntimeSourcePaths = runtimeSourcePaths.length - rasterRuntimeSourcePaths.length

  for (const publicPath of rasterRuntimeSourcePaths) {
    const absolutePath = path.join(publicRoot, publicPath.replace(/^\//, ''))
    if (!fs.existsSync(absolutePath)) {
      missingRuntimeSourcePaths.push(publicPath)
      continue
    }

    runtimeSourceResults.push(await inspectPublicRuntimePath(publicPath))
  }

  const runtimeSourceFailures = runtimeSourceResults.filter((asset) =>
    !asset.hasAlpha || asset.transparentRatio < MIN_RUNTIME_SOURCE_TRANSPARENT_RATIO
  )

  const byType = results.reduce((acc, asset) => {
    const bucket = acc[asset.assetType] ?? {
      count: 0,
      withAlpha: 0,
      minTransparentRatio: 1,
      maxTransparentRatio: 0,
    }

    bucket.count += 1
    if (asset.hasAlpha) bucket.withAlpha += 1
    bucket.minTransparentRatio = Math.min(bucket.minTransparentRatio, asset.transparentRatio)
    bucket.maxTransparentRatio = Math.max(bucket.maxTransparentRatio, asset.transparentRatio)
    acc[asset.assetType] = bucket
    return acc
  }, {})

  const summary = {
    checked: results.length,
    minTransparentRatio: MIN_TRANSPARENT_RATIO,
    failures: failures.length,
    runtimeSourcePaths: runtimeSourceResults.length,
    nonRasterRuntimeSourcePaths,
    runtimeSourceMinTransparentRatio: MIN_RUNTIME_SOURCE_TRANSPARENT_RATIO,
    runtimeSourceFailures: runtimeSourceFailures.length,
    missingRuntimeSourcePaths: missingRuntimeSourcePaths.length,
    byType: Object.fromEntries(
      Object.entries(byType).map(([key, value]) => [
        key,
        {
          ...value,
          minTransparentRatio: Number(value.minTransparentRatio.toFixed(4)),
          maxTransparentRatio: Number(value.maxTransparentRatio.toFixed(4)),
        },
      ])
    ),
  }

  console.log(JSON.stringify(summary, null, 2))

  if (failures.length > 0 || runtimeSourceFailures.length > 0 || missingRuntimeSourcePaths.length > 0) {
    console.error('Fuxie global asset alpha check failed:')
    console.error(JSON.stringify({
      manifestFailures: failures,
      runtimeSourceFailures,
      missingRuntimeSourcePaths,
    }, null, 2))
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
