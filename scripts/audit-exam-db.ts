/**
 * audit-exam-db.ts — Dump the structure of existing exams from Production DB
 * Outputs: how many exams per level, section/task details, and a sample contentJson
 */
import { Client } from 'pg';
import * as fs from 'fs';

const connectionString = "postgresql://neondb_owner:npg_aU0YPhW6zZQp@ep-rough-thunder-a1m0qm18.ap-southeast-1.aws.neon.tech/fuxie_prod?sslmode=require";
const client = new Client({ connectionString });

async function main() {
    await client.connect();
    console.log("🔍 Auditing Exam Templates in Production DB...\n");

    // 1. Count exams per level
    const examRes = await client.query(`
        SELECT id, slug, title, "examType", "cefrLevel", "totalMinutes", "totalPoints", "passingScore", status
        FROM exam_templates 
        ORDER BY "cefrLevel", "examType"
    `);
    console.log(`Total exam templates: ${examRes.rows.length}\n`);
    for (const row of examRes.rows) {
        console.log(`  [${row.cefrLevel}] ${row.title} (${row.examType}) — ${row.totalMinutes}min, ${row.totalPoints}pts, pass:${row.passingScore}%, status:${row.status}`);
    }

    // 2. For each exam, dump sections and tasks
    const fullDump: any[] = [];
    for (const exam of examRes.rows) {
        const sectionsRes = await client.query(`
            SELECT id, title, skill, "totalMinutes", "totalPoints", "sortOrder"
            FROM exam_sections WHERE "examId" = $1 ORDER BY "sortOrder"
        `, [exam.id]);

        const examData: any = { ...exam, sections: [] };
        for (const section of sectionsRes.rows) {
            const tasksRes = await client.query(`
                SELECT id, title, "exerciseType", "contentJson", "audioUrl", "maxPoints", "sortOrder"
                FROM exam_tasks WHERE "sectionId" = $1 ORDER BY "sortOrder"
            `, [section.id]);

            const sectionData = {
                ...section,
                tasks: tasksRes.rows.map((t: any) => ({
                    ...t,
                    contentJsonSample: typeof t.contentJson === 'object' ? t.contentJson : JSON.parse(t.contentJson)
                }))
            };
            examData.sections.push(sectionData);
        }
        fullDump.push(examData);
    }

    // 3. Write full dump to file
    const outputPath = 'scripts/exam_audit_dump.json';
    fs.writeFileSync(outputPath, JSON.stringify(fullDump, null, 2));
    console.log(`\n✅ Full exam structure dumped to ${outputPath}`);

    await client.end();
}

main().catch(console.error);
