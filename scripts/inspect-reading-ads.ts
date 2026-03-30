import { Client } from 'pg';
const connectionString = process.env.DATABASE_URL || "";
const client = new Client({ connectionString });

async function main() {
    await client.connect();
    // Fetch a few reading tasks, especially B1 Teil 3 or A1 Teil 2
    const query = `
        SELECT t.title, t."exerciseType", t."contentJson", e."cefrLevel", e.slug
        FROM exam_tasks t
        JOIN exam_sections s ON t."sectionId" = s.id
        JOIN exam_templates e ON s."examId" = e.id
        WHERE s.skill = 'LESEN' AND e.slug = 'goethe-a1-modellsatz-1'
    `;
    const res = await client.query(query);
    
    for (const row of res.rows) {
        const content = typeof row.contentJson === 'string' ? JSON.parse(row.contentJson) : row.contentJson;
        console.log(`\n=== FOUND TASK: ${row.cefrLevel} - ${row.slug} - ${row.title} ===`);
        console.log(`Exercise Type: ${row.exerciseType}`);
        console.log(JSON.stringify(content, null, 2).substring(0, 1500));
    }
    await client.end();
}

main().catch(err => { console.error(err); client.end(); });
