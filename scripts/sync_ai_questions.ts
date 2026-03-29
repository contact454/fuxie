import { PrismaClient } from '../apps/web/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const CONTENT_DIR = path.join(__dirname, '../content');

async function syncLevel(level: string) {
    const listeningDir = path.join(CONTENT_DIR, level, 'listening');
    if (!fs.existsSync(listeningDir)) {
        console.warn(`⚠️ Dir not found: ${listeningDir}`);
        return;
    }

    const files = fs.readdirSync(listeningDir).filter(f => f.endsWith('.json'));
    console.log(`📂 Found ${files.length} JSON files for ${level.toUpperCase()}`);

    let updatedLessons = 0;
    let totalQuestions = 0;

    for (const file of files) {
        const filePath = path.join(listeningDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Find existing lesson
        const lesson = await prisma.listeningLesson.findUnique({
            where: { lessonId: data.id }
        });

        if (!lesson) {
            console.warn(`    ⚠️ Lesson ${data.id} not found in DB! Skipping...`);
            continue;
        }

        // Delete existing questions
        await prisma.listeningQuestion.deleteMany({
            where: { lessonId: lesson.id }
        });

        // Map AI questions to Prisma model
        if (!data.questions || !Array.isArray(data.questions)) {
             console.warn(`    ⚠️ No questions block for ${data.id}`);
             continue;
        }

        const prismaQuestions = data.questions.map((q: any, i: number) => {
            let optionsArray: string[] = [];
            let correctAns = q.answer;

            if (q.type === 'mc_abc' && q.options) {
                // Ensure options are strings
                optionsArray = [
                    `a) ${q.options.a}`, 
                    `b) ${q.options.b}`, 
                    `c) ${q.options.c}`
                ];
                // answer is usually 'a', 'b', 'c'
            } else if (q.type === 'richtig_falsch' || q.type === 'ja_nein') {
                if (q.type === 'richtig_falsch') {
                     optionsArray = ['Richtig', 'Falsch'];
                     correctAns = q.answer === 'richtig' ? 'a' : 'b'; // Map to 'a' or 'b' since template used 'a' or 'b'
                } else {
                     optionsArray = ['Ja', 'Nein'];
                     correctAns = q.answer === 'ja' ? 'a' : 'b';
                }
            } else {
                // Fallback
                 if (q.options) optionsArray = Object.values(q.options);
            }

            return {
                lessonId: lesson.id,
                questionNumber: i + 1,
                questionType: q.type,
                questionText: q.question || q.statement || `Frage ${i+1}`,
                questionTextVi: "", // AI prompt generated explanation.vi not questionTextVi
                options: optionsArray,
                correctAnswer: correctAns,
                explanation: q.explanation?.de || '',
                explanationVi: q.explanation?.vi || '',
                sortOrder: i + 1
            };
        });

        await prisma.listeningQuestion.createMany({
            data: prismaQuestions
        });

        updatedLessons++;
        totalQuestions += prismaQuestions.length;
    }

    console.log(`✅ Synced ${level.toUpperCase()}: ${updatedLessons} lessons, ${totalQuestions} questions pushed to DB!`);
}

async function main() {
    console.log("🚀 Starting DB Sync for A1, A2, B1, B2 Listening Questions...");
    await syncLevel('a1');
    await syncLevel('a2');
    await syncLevel('b1');
    await syncLevel('b2');
    console.log("🎉 All AI questions synced successfully to the Production Database!");
}

main()
    .catch(e => { console.error('❌ Error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
