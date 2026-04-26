const { Client } = require('pg');

async function checkExams() {
    try {
        const client = new Client({ connectionString: process.env.DATABASE_URL ?? '' });
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
