import { Client } from 'pg';
const client = new Client({ connectionString: "postgresql://neondb_owner:npg_aU0YPhW6zZQp@ep-rough-thunder-a1m0qm18.ap-southeast-1.aws.neon.tech/fuxie_prod?sslmode=require" });
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
