const { Client } = require('pg');

async function checkExams() {
    try {
        const client = new Client({ connectionString: 'postgresql://fuxie:fuxie_dev@127.0.0.1:5433/fuxie_dev' });
        await client.connect();
        
        const res = await client.query(`
            SELECT count(*) 
            FROM exam_tasks tt 
            JOIN exam_sections ts ON tt."sectionId" = ts.id
            WHERE ts.skill = 'HOEREN' AND tt."audioUrl" LIKE '/%'
        `);
        console.log("Local Dev DB Tasks with Local URLs:", res.rows[0].count);

        await client.end();
    } catch (err) {
        console.error("Could not connect to DEV DB: ", err.message);
    }
    process.exit(0);
}

checkExams();
