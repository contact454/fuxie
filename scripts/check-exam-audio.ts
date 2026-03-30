import { Client } from 'pg';
const client = new Client({ connectionString: process.env.DATABASE_URL || "" });
async function main() {
    await client.connect();
    const res = await client.query(`
        SELECT tt.id, tt.title, ts.skill, tt."audioUrl" 
        FROM exam_tasks tt 
        JOIN exam_sections ts ON tt."sectionId" = ts.id 
        WHERE ts.skill = 'HOEREN' 
        LIMIT 10
    `);
    res.rows.forEach(r => console.log(`${r.title} -> ${r.audioUrl}`));
    await client.end();
}
main().catch(console.error);
