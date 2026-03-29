/**
 * sync-exam-audio.ts
 * 
 * Uploads all generated exam audio MP3s from `8-Audio-Factory/data/output`
 * to Cloudflare R2 and updates the `audioUrl` field in `fuxie_prod` database.
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const AUDIO_OUTPUT_DIR = "C:\\Users\\DMF Schule\\8-Audio-Factory\\data\\output";

// Neon DB Prod connection exact as export script
const connectionString = "postgresql://neondb_owner:npg_aU0YPhW6zZQp@ep-rough-thunder-a1m0qm18.ap-southeast-1.aws.neon.tech/fuxie_prod?sslmode=require";
const dbClient = new Client({ connectionString });

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, ""); // Ensure no trailing slash

async function fileExistsOnR2(key: string): Promise<boolean> {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch {
        return false;
    }
}

async function main() {
    console.log('🚀 Synchronizing Fuxie Exam Audio to R2 & DB');
    console.log('='.repeat(50));
    console.log(`  Source DIR : ${AUDIO_OUTPUT_DIR}`);
    console.log(`  R2 Bucket  : ${BUCKET}`);
    console.log(`  Public URL : ${PUBLIC_URL}`);

    if (!fs.existsSync(AUDIO_OUTPUT_DIR)) {
        console.error('❌ Audio output directory not found!');
        process.exit(1);
    }

    if (!PUBLIC_URL) {
        console.error('❌ R2_PUBLIC_URL missing in .env');
        process.exit(1);
    }

    await dbClient.connect();
    console.log(`✅ Connected to fuxie_prod Neon DB.`);

    const levels = fs.readdirSync(AUDIO_OUTPUT_DIR).filter(d => fs.statSync(path.join(AUDIO_OUTPUT_DIR, d)).isDirectory());

    let totalUploaded = 0;
    let totalDbUpdates = 0;
    let totalSkippedUploads = 0;
    let totalErrors = 0;
    let totalFiles = 0;

    for (const level of levels) {
        // e.g. A1, A2
        const levelDir = path.join(AUDIO_OUTPUT_DIR, level);
        const slugs = fs.readdirSync(levelDir).filter(d => fs.statSync(path.join(levelDir, d)).isDirectory());

        for (const slug of slugs) {
            // e.g. goethe-a1, telc-b2
            const slugDir = path.join(levelDir, slug);
            const files = fs.readdirSync(slugDir).filter(f => f.endsWith('.mp3'));
            totalFiles += files.length;
        }
    }

    console.log(`  Total MP3 files found: ${totalFiles}\n`);
    let processed = 0;

    for (const level of levels) {
        const levelDir = path.join(AUDIO_OUTPUT_DIR, level);
        const slugs = fs.readdirSync(levelDir).filter(d => fs.statSync(path.join(levelDir, d)).isDirectory());

        for (const slug of slugs) {
            const slugDir = path.join(levelDir, slug);
            const files = fs.readdirSync(slugDir).filter(f => f.endsWith('.mp3'));

            if (files.length === 0) continue;
            console.log(`📁 ${level}/${slug} (${files.length} files)`);

            for (const file of files) {
                const taskId = file.replace('.mp3', '');
                const r2Key = `exams/${level}/${slug}/${file}`;
                const filePublicUrl = `${PUBLIC_URL}/${r2Key}`;
                const filePath = path.join(slugDir, file);

                try {
                    // 1. Upload to R2 if not exists
                    const exists = await fileExistsOnR2(r2Key);
                    if (exists) {
                        totalSkippedUploads++;
                    } else {
                        const body = fs.readFileSync(filePath);
                        await s3.send(new PutObjectCommand({
                            Bucket: BUCKET,
                            Key: r2Key,
                            Body: body,
                            ContentType: 'audio/mpeg',
                            CacheControl: 'public, max-age=31536000, immutable',
                        }));
                        totalUploaded++;
                    }

                    // 2. Update DB unconditionally (so if it was skipped locally but DB was missing, it updates)
                    const res = await dbClient.query(`
                        UPDATE exam_tasks 
                        SET "audioUrl" = $1, "updatedAt" = NOW()
                        WHERE id = $2 AND ("audioUrl" IS NULL OR "audioUrl" = '')
                        RETURNING id
                    `, [filePublicUrl, taskId]);

                    if (res.rowCount && res.rowCount > 0) {
                        totalDbUpdates++;
                        console.log(`  ✅ Synced: ${r2Key} -> DB (${totalDbUpdates})`);
                    }

                } catch (err: any) {
                    totalErrors++;
                    console.error(`  ❌ Failed on ${r2Key}: ${err.message}`);
                }

                processed++;
                if (processed % 20 === 0 || processed === totalFiles) {
                    console.log(`  ⏳ Progress: ${processed}/${totalFiles} files processed...`);
                }
            }
        }
    }

    await dbClient.end();

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 MASS SYNC COMPLETE!`);
    console.log(`   Uploaded to R2 : ${totalUploaded}`);
    console.log(`   Skipped Uploads: ${totalSkippedUploads}`);
    console.log(`   DB Rows Updated: ${totalDbUpdates}`);
    console.log(`   Errors Encountered: ${totalErrors}`);
    console.log(`   Total Processed: ${totalFiles}`);
    console.log('==================================================\n');
}

main().catch(err => {
    console.error('Fatal Script Error:', err);
    process.exit(1);
});
