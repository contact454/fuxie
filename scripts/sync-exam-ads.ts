/**
 * sync-exam-ads.ts
 * 
 * Uploads all generated exam ad PNGs from `apps/web/public/images/exams/ads`
 * to Cloudflare R2 and updates the `contentJson` -> `imageUrl` field in `fuxie_prod` database.
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load ENV variables
dotenv.config({ path: path.join(__dirname, '..', 'apps', 'web', '.env') });
// Fallback root env
dotenv.config();

const IMG_DIR = path.join(__dirname, '..', 'apps', 'web', 'public', 'images', 'exams', 'ads');

// Neon DB Prod connection exact as audio sync script
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
    console.log('🚀 Synchronizing Fuxie Exam Ad Images to CDN & DB');
    console.log('='.repeat(50));
    console.log(`  Source DIR : ${IMG_DIR}`);
    console.log(`  R2 Bucket  : ${BUCKET}`);
    console.log(`  Public URL : ${PUBLIC_URL}\n`);

    if (!fs.existsSync(IMG_DIR)) {
        console.error('❌ Ad image directory not found! Have you generated them?');
        process.exit(1);
    }

    if (!PUBLIC_URL) {
        console.error('❌ R2_PUBLIC_URL missing in .env');
        process.exit(1);
    }

    await dbClient.connect();
    console.log(`✅ Connected to fuxie_prod Neon DB.`);

    const res = await dbClient.query(`
        SELECT t.id, t."contentJson"
        FROM exam_tasks t
        JOIN exam_sections s ON t."sectionId" = s.id
        WHERE s.skill = 'LESEN' AND t."exerciseType"::text ILIKE '%match%'
    `);
    const tasks = res.rows;
    console.log(`📦 Found ${tasks.length} LESEN matching tasks in DB.\n`);

    let totalUploaded = 0;
    let totalSkippedUploads = 0;
    let totalDbUpdates = 0;
    let totalErrors = 0;

    for (const row of tasks) {
        let content = typeof row.contentJson === 'string' ? JSON.parse(row.contentJson) : row.contentJson;
        if (!content.options || !Array.isArray(content.options)) continue;

        let isDirty = false;
        const originalContentStr = JSON.stringify(content);

        console.log(`🔄 Task ${row.id}...`);

        for (let i = 0; i < content.options.length; i++) {
            const opt = content.options[i];
            const currentUrl = opt.imageUrl;

            // If it uses the local path, we need to upload it and replace the path
            if (currentUrl && currentUrl.startsWith('/images/exams/ads/')) {
                const fileName = path.basename(currentUrl);
                const localFilePath = path.join(IMG_DIR, fileName);
                const r2Key = `images/exams/ads/${fileName}`;
                const filePublicUrl = `${PUBLIC_URL}/${r2Key}`;

                try {
                    // 1. Upload if it doesn't exist
                    if (!fs.existsSync(localFilePath)) {
                        console.warn(`  ⚠️ Local file missing for ${opt.key}: ${localFilePath}`);
                        continue; // Can't upload or remap safely
                    }

                    const exists = await fileExistsOnR2(r2Key);
                    if (exists) {
                        totalSkippedUploads++;
                    } else {
                        const body = fs.readFileSync(localFilePath);
                        await s3.send(new PutObjectCommand({
                            Bucket: BUCKET,
                            Key: r2Key,
                            Body: body,
                            ContentType: 'image/png',
                            CacheControl: 'public, max-age=31536000, immutable',
                        }));
                        totalUploaded++;
                    }

                    // 2. Remap the JSON URL
                    opt.imageUrl = filePublicUrl;
                    isDirty = true;
                    console.log(`  ✅ Synced image [${fileName}]`);
                } catch (err: any) {
                    totalErrors++;
                    console.error(`  ❌ Failed R2 sync for ${fileName}: ${err.message}`);
                }
            } 
            // If it already uses CDN, maybe we already ran the script
            else if (currentUrl && currentUrl.startsWith(PUBLIC_URL)) {
                totalSkippedUploads++; // Assuming R2 has it if URL says so
            }
        }

        if (isDirty && JSON.stringify(content) !== originalContentStr) {
            try {
                await dbClient.query(`UPDATE exam_tasks SET "contentJson" = $1, "updatedAt" = NOW() WHERE id = $2`, [JSON.stringify(content), row.id]);
                totalDbUpdates++;
                console.log(`  💾 Saved layout patch for Task ${row.id}`);
            } catch (dbErr: any) {
                totalErrors++;
                console.error(`  ❌ Failed saving DB for Task ${row.id}: ${dbErr.message}`);
            }
        }
    }

    await dbClient.end();

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 AD SYNC COMPLETE!`);
    console.log(`   Uploaded to R2 : ${totalUploaded}`);
    console.log(`   Skipped Uploads: ${totalSkippedUploads}`);
    console.log(`   DB Rows Updated: ${totalDbUpdates}`);
    console.log(`   Errors Encountered: ${totalErrors}`);
    console.log('==================================================\n');
}

main().catch(err => {
    console.error('Fatal Script Error:', err);
    process.exit(1);
});
