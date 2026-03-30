import { GoogleGenAI, Modality } from '@google/genai';
import { Client } from 'pg';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', 'apps', 'web', '.env') });
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY missing');
const genai = new GoogleGenAI({ apiKey });

// Completely bypass .env for DB to avoid local pollution
const dbUrl = process.env.DATABASE_URL || "";
const client = new Client({ connectionString: dbUrl });

const IMG_DIR = path.join(__dirname, '..', 'apps', 'web', 'public', 'images', 'exams', 'ads');
mkdirSync(IMG_DIR, { recursive: true });

async function generateWithFallback(prompt: string): Promise<Buffer | null> {
    const models = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];
    for (const model of models) {
        try {
            const res = await genai.models.generateContent({
                model, contents: prompt, config: { responseModalities: [Modality.TEXT, Modality.IMAGE] }
            });
            for (const p of res.candidates?.[0]?.content?.parts || []) {
                if (p.inlineData?.mimeType?.startsWith('image/')) {
                    return Buffer.from(p.inlineData.data!, 'base64');
                }
            }
        } catch (e: any) {
            console.error(`[${model}] Failed: ${e.message?.slice(0, 100)}`);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    return null;
}

async function main() {
    let fetchClient = new Client({ connectionString: dbUrl });
    await fetchClient.connect();
    // Get ALL matching tasks from LESEN
    const res = await fetchClient.query(`
        SELECT t.id, t."contentJson", e."cefrLevel", e.slug
        FROM exam_tasks t
        JOIN exam_sections s ON t."sectionId" = s.id
        JOIN exam_templates e ON s."examId" = e.id
        WHERE s.skill = 'LESEN' AND t."exerciseType"::text ILIKE '%match%'
    `);
    const rows = res.rows;
    await fetchClient.end(); // Disconnect to prevent 57P01 timeout during heavy AI wait!

    console.log(`Found ${rows.length} MATCHING reading tasks.`);
    let generatedCount = 0;

    for (const row of rows) {
        let content = typeof row.contentJson === 'string' ? JSON.parse(row.contentJson) : row.contentJson;
        if (!content.options || !Array.isArray(content.options)) continue;

        let isDirty = false;
        console.log(`\n=== Task ${row.id} (${row.cefrLevel} ${row.slug}) ===`);
        
        for (let i = 0; i < content.options.length; i++) {
            const opt = content.options[i];
            const fileName = `${row.id}_${opt.key}.png`;
            const destPath = path.join(IMG_DIR, fileName);
            const publicUrl = `/images/exams/ads/${fileName}`;

            if (existsSync(destPath)) {
                if (opt.imageUrl !== publicUrl) {
                    opt.imageUrl = publicUrl;
                    isDirty = true;
                }
                console.log(`  ⏭️ Skip ${opt.key}: ${opt.title} (already exists)`);
                continue;
            }

            console.log(`  🎨 Generating image for ${opt.key}: ${opt.title}...`);
            const prompt = `Create a clean, cute vector flat-design illustration of "${opt.title}". Context/Snippet: "${opt.snippet}". 
Style: minimal abstract or cute vector art, no text, no labels, soft pastel colors, white background. 
This is for a German language learning app's advertisement matching exercise.`;

            const buf = await generateWithFallback(prompt);
            if (buf) {
                writeFileSync(destPath, buf);
                opt.imageUrl = publicUrl;
                isDirty = true;
                generatedCount++;
                console.log(`    ✅ Saved ${fileName}`);
            } else {
                console.log(`    ❌ Failed to generate for ${opt.title}`);
            }
            await new Promise(r => setTimeout(r, 4500)); // rate limit 4.5s
        }

        if (isDirty) {
            let updateClient = new Client({ connectionString: dbUrl });
            await updateClient.connect();
            await updateClient.query(`UPDATE exam_tasks SET "contentJson" = $1 WHERE id = $2`, [JSON.stringify(content), row.id]);
            await updateClient.end();
            console.log(`  💾 Updated DB for Task ${row.id}`);
        }
    }

    console.log(`\n🎉 Finished! Generated ${generatedCount} new advertisement images.`);
}

main().catch(err => { console.error(err); client.end(); });
