/**
 * Upload Speaking Audio to Cloudflare R2
 * 
 * Scans Audio Factory output directory and uploads all MP3 files to R2
 * with the naming convention: L-SPR-{LEVEL}-{TOPIC}-{LESSON}-S{SENTENCE}.mp3
 * 
 * Audio Factory output naming: {topic-dir}/s{lesson}_{sentence}.mp3
 * Example: a2-alltag/s01_1.mp3 → L-SPR-A2-ALLTAG-01-S1.mp3
 * 
 * Usage: npx tsx scripts/upload-speaking-r2.ts
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const AUDIO_OUTPUT_DIR = path.resolve(__dirname, '../../8-Audio-Factory/data/output/Sprechen-Nachsprechen-Phase2')

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET!

/**
 * Convert directory name + file name to R2 object key
 * a2-alltag/s01_1.mp3 → L-SPR-A2-ALLTAG-01-S1.mp3
 */
function toR2Key(topicDir: string, filename: string): string {
  // topicDir: "a2-alltag" → level="A2", topic="ALLTAG"
  const parts = topicDir.split('-')
  const level = parts[0].toUpperCase() // "A2"
  const topic = parts.slice(1).join('-').toUpperCase() // "ALLTAG" or "ESSEN-TRINKEN"

  // filename: "s01_1.mp3" → lesson="01", sentence="1"
  const match = filename.match(/^s(\d+)_(\d+)\.mp3$/)
  if (!match) return ''

  const lesson = match[1].padStart(2, '0')
  const sentence = match[2]

  return `L-SPR-${level}-${topic}-${lesson}-S${sentence}.mp3`
}

async function fileExistsOnR2(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('🚀 Uploading Speaking Audio to R2')
  console.log('=' .repeat(50))
  console.log(`  Bucket    : ${BUCKET}`)
  console.log(`  Source     : ${AUDIO_OUTPUT_DIR}`)
  console.log(`  Endpoint  : https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`)
  console.log()

  if (!fs.existsSync(AUDIO_OUTPUT_DIR)) {
    console.error('❌ Audio output directory not found!')
    process.exit(1)
  }

  const topicDirs = fs.readdirSync(AUDIO_OUTPUT_DIR)
    .filter(d => fs.statSync(path.join(AUDIO_OUTPUT_DIR, d)).isDirectory())
    .sort()

  let totalUploaded = 0
  let totalSkipped = 0
  let totalErrors = 0
  let totalFiles = 0

  // Count total files first
  for (const topicDir of topicDirs) {
    const dirPath = path.join(AUDIO_OUTPUT_DIR, topicDir)
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.mp3'))
    totalFiles += files.length
  }

  console.log(`  Total files: ${totalFiles}`)
  console.log()

  for (const topicDir of topicDirs) {
    const dirPath = path.join(AUDIO_OUTPUT_DIR, topicDir)
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.mp3')).sort()

    if (files.length === 0) continue

    console.log(`\n📁 ${topicDir} (${files.length} files)`)

    for (const file of files) {
      const r2Key = toR2Key(topicDir, file)
      if (!r2Key) {
        console.log(`  ⚠️  Skipped (bad name): ${file}`)
        totalSkipped++
        continue
      }

      try {
        // Check if file already exists on R2
        const exists = await fileExistsOnR2(r2Key)
        if (exists) {
          totalSkipped++
          continue
        }

        const filePath = path.join(dirPath, file)
        const body = fs.readFileSync(filePath)

        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: body,
          ContentType: 'audio/mpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        }))

        totalUploaded++
        const progress = totalUploaded + totalSkipped
        if (totalUploaded % 50 === 0 || progress === totalFiles) {
          console.log(`  ✅ ${progress}/${totalFiles} (${totalUploaded} uploaded, ${totalSkipped} skipped)`)
        }
      } catch (err: any) {
        totalErrors++
        console.error(`  ❌ ${r2Key}: ${err.message}`)
      }
    }
  }

  console.log('\n' + '=' .repeat(50))
  console.log(`🎉 UPLOAD COMPLETE!`)
  console.log(`   Uploaded : ${totalUploaded}`)
  console.log(`   Skipped  : ${totalSkipped}`)
  console.log(`   Errors   : ${totalErrors}`)
  console.log(`   Total    : ${totalFiles}`)
}

main().catch(console.error)
