import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const connectionString = "postgresql://neondb_owner:npg_aU0YPhW6zZQp@ep-rough-thunder-a1m0qm18.ap-southeast-1.aws.neon.tech/fuxie_prod?sslmode=require";
const CONTENT_DIR = path.join(__dirname, '../content');

const client = new Client({ connectionString });

async function syncLevel(level: string) {
    const listeningDir = path.join(CONTENT_DIR, level, 'listening');
    if (!fs.existsSync(listeningDir)) return;

    const files = fs.readdirSync(listeningDir).filter(f => f.endsWith('.json'));
    let updatedLessons = 0;
    let totalQuestions = 0;

    for (const file of files) {
        const filePath = path.join(listeningDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Get lesson serial UUID
        const res = await client.query('SELECT id FROM listening_lessons WHERE "lessonId" = $1', [data.id]);
        if (res.rows.length === 0) continue;
        const lessonUuid = res.rows[0].id;

        // Delete existing dependent responses first to avoid foreign key violation
        await client.query('DELETE FROM listening_responses WHERE "questionId" IN (SELECT id FROM listening_questions WHERE "lessonId" = $1)', [lessonUuid]);

        // Delete existing questions
        await client.query('DELETE FROM listening_questions WHERE "lessonId" = $1', [lessonUuid]);

        if (!data.questions || !Array.isArray(data.questions)) continue;

        for (let i = 0; i < data.questions.length; i++) {
            const q = data.questions[i];
            let optionsArray: string[] = [];
            let correctAns = q.answer;

            if (q.type === 'mc_abc' && q.options) {
                optionsArray = [`a) ${q.options.a}`, `b) ${q.options.b}`, `c) ${q.options.c}`];
            } else if (q.type === 'richtig_falsch' || q.type === 'ja_nein') {
                optionsArray = q.type === 'richtig_falsch' ? ['Richtig', 'Falsch'] : ['Ja', 'Nein'];
                correctAns = (q.answer === 'richtig' || q.answer === 'ja') ? 'a' : 'b';
            } else {
                if (q.options) optionsArray = Object.values(q.options);
            }

            const id = crypto.randomUUID();
            const now = new Date().toISOString();

            await client.query(`
                INSERT INTO listening_questions (
                    "id", "lessonId", "questionNumber", "questionType", "questionText", 
                    "questionTextVi", "options", "correctAnswer", "explanation", "explanationVi", 
                    "sortOrder", "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `, [
                id, lessonUuid, i + 1, q.type, 
                q.question || q.statement || `Frage ${i+1}`, "", 
                JSON.stringify(optionsArray), correctAns, 
                q.explanation?.de || '', q.explanation?.vi || '', 
                i + 1, now, now
            ]);
            totalQuestions++;
        }
        updatedLessons++;
    }

    console.log(`✅ Synced ${level.toUpperCase()}: ${updatedLessons} lessons, ${totalQuestions} questions pushed!`);
}

async function main() {
    await client.connect();
    console.log("🚀 Starting RAW SQL DB Sync for C2 Listening Questions...");
    await syncLevel('c2');
    console.log("🎉 All AI questions synced successfully to Production Database!");
    await client.end();
}

main().catch(e => {
    console.error("Script Crashed:");
    console.error(e.message);
    fs.writeFileSync('error.txt', e.stack || e.toString());
    process.exit(1);
});
