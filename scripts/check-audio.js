const { Client } = require('pg');

async function checkExams() {
    try {
        const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_aU0YPhW6zZQp@ep-rough-thunder-a1m0qm18.ap-southeast-1.aws.neon.tech/fuxie_prod?sslmode=require' });
        await client.connect();
        
        const res = await client.query(`
            SELECT "cefrLevel", count(*) as total_exams
            FROM exam_templates
            GROUP BY "cefrLevel"
        `);
        console.table(res.rows);

        const res2 = await client.query(`
            SELECT count(*) as total_exams
            FROM exam_templates
        `);
        console.table(res2.rows);

        await client.end();
    } catch (err) {
        console.error("error: ", err.message);
    }
    process.exit(0);
}

checkExams();
