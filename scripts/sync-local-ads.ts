import { Client } from 'pg';
import { existsSync } from 'fs';
import * as path from 'path';

const dbUrl = 'postgresql://fuxie:fuxie_dev@127.0.0.1:5433/fuxie_dev';
const IMG_DIR = path.join('c:/Users/DMF Schule/9-Fuxie/apps/web/public/images/exams/ads');

async function main() {
    console.log('Connecting to local DB...');
    const fetchClient = new Client({ connectionString: dbUrl });
    await fetchClient.connect();
    
    const res = await fetchClient.query(`
        SELECT t.id, t."contentJson"
        FROM exam_tasks t
        JOIN exam_sections s ON t."sectionId" = s.id
        WHERE s.skill = 'LESEN' AND t."exerciseType"::text ILIKE '%match%'
    `);
    
    let updatedCount = 0;
    
    for (const row of res.rows) {
        let content = typeof row.contentJson === 'string' ? JSON.parse(row.contentJson) : row.contentJson;
        if (!content.options || !Array.isArray(content.options)) continue;
        
        let isDirty = false;
        for (let i = 0; i < content.options.length; i++) {
            const opt = content.options[i];
            const fileName = `${row.id}_${opt.key}.png`;
            const destPath = path.join(IMG_DIR, fileName);
            const publicUrl = `/images/exams/ads/${fileName}`;
            
            if (existsSync(destPath) && opt.imageUrl !== publicUrl) {
                opt.imageUrl = publicUrl;
                isDirty = true;
            }
        }
        
        if (isDirty) {
            await fetchClient.query(`UPDATE exam_tasks SET "contentJson" = $1 WHERE id = $2`, [JSON.stringify(content), row.id]);
            updatedCount++;
        }
    }
    
    await fetchClient.end();
    console.log(`✅ Updated ${updatedCount} local tasks with existing image URLs.`);
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
