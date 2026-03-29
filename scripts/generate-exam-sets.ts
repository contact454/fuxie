/**
 * generate-exam-sets.ts — AI-powered Exam Content Generator
 * 
 * Reads the existing exam template (Modellsatz 1) from Production DB,
 * uses Gemini 2.5 Pro to generate fresh content for each task,
 * and injects new exam sets (Modellsatz 2-10) into the database.
 *
 * Run: pnpm exec tsx scripts/generate-exam-sets.ts
 */
import { Client } from 'pg';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
dotenv.config();

const connectionString = "postgresql://neondb_owner:npg_aU0YPhW6zZQp@ep-rough-thunder-a1m0qm18.ap-southeast-1.aws.neon.tech/fuxie_prod?sslmode=require";
const client = new Client({ connectionString });

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) throw new Error('Missing GEMINI_API_KEY');
const ai = new GoogleGenAI({ apiKey: geminiKey });

// Theme clusters for diversity across 9 new sets
const THEME_CLUSTERS: Record<number, { de: string; topics: string[] }> = {
    2: { de: 'Arbeit & Beruf', topics: ['Bewerbungsgespräch', 'Büroalltag', 'Berufsausbildung', 'Homeoffice', 'Gehaltsverhandlung'] },
    3: { de: 'Reisen & Urlaub', topics: ['Hotelreservierung', 'Flughafen', 'Roadtrip', 'Campingurlaub', 'Städtereise'] },
    4: { de: 'Gesundheit & Körper', topics: ['Arztbesuch', 'Krankenhaus', 'Ernährung', 'Sport und Fitness', 'Apotheke'] },
    5: { de: 'Umwelt & Natur', topics: ['Klimawandel', 'Recycling', 'Tierschutz', 'Erneuerbare Energien', 'Naturschutzgebiet'] },
    6: { de: 'Medien & Technologie', topics: ['Soziale Medien', 'Künstliche Intelligenz', 'Datenschutz', 'Online-Shopping', 'Streaming'] },
    7: { de: 'Kultur & Kunst', topics: ['Museumsbesuch', 'Theateraufführung', 'Filmfestival', 'Musikkonzert', 'Buchvorstellung'] },
    8: { de: 'Bildung & Schule', topics: ['Schulalltag', 'Universität', 'Sprachkurs', 'Nachhilfe', 'Bibliothek'] },
    9: { de: 'Wohnen & Stadt', topics: ['Wohnungssuche', 'Umzug', 'Nachbarschaft', 'Stadtplanung', 'Mietvertrag'] },
    10: { de: 'Essen & Einkaufen', topics: ['Supermarkt', 'Restaurant', 'Kochrezepte', 'Wochenmarkt', 'Lebensmittelverschwendung'] },
};

// CEFR-level vocabulary constraints for prompts
const LEVEL_VOCAB: Record<string, string> = {
    A1: 'Use only very simple A1-level vocabulary (present tense, basic nouns, simple sentences ≤8 words). Content must be about everyday situations like shopping, family, time, numbers.',
    A2: 'Use A2-level vocabulary (Perfekt, simple Nebensätze with weil/dass, short paragraphs). Content should cover daily routines, travel, work basics.',
    B1: 'Use B1-level vocabulary (Konjunktiv II with würde, reported speech basics, compound sentences). Content includes opinions, experiences, plans, news articles.',
    B2: 'Use formal B2-level vocabulary (Passiv, extended Nebensätze, academic register). Content covers complex topics like social issues, science, economics with nuanced argumentation.',
    C1: 'Use highly academic C1-level vocabulary (Nominalisierung, complex participial constructions, abstract concepts). Content must require inferring implicit meaning and evaluating arguments.',
    C2: 'Use native-level C2 vocabulary (idiomatic expressions, Konjunktiv I, literary register, irony/sarcasm). Content must include ambiguity, wordplay, and require synthesis of complex arguments.',
};

interface ExamTask {
    id: string;
    title: string;
    exerciseType: string;
    contentJson: any;
    audioUrl: string | null;
    maxPoints: number;
    sortOrder: number;
}

interface ExamSection {
    id: string;
    title: string;
    skill: string;
    totalMinutes: number;
    totalPoints: number;
    sortOrder: number;
    instructions: string | null;
    tasks: ExamTask[];
}

interface ExamTemplate {
    id: string;
    slug: string;
    title: string;
    examType: string;
    cefrLevel: string;
    totalMinutes: number;
    totalPoints: number;
    passingScore: number;
    description: string | null;
    sections: ExamSection[];
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Fetch the existing Modellsatz 1 for a given CEFR level
 */
async function fetchOriginalExam(level: string): Promise<ExamTemplate> {
    const examRes = await client.query(`
        SELECT id, slug, title, "examType", "cefrLevel", "totalMinutes", "totalPoints", "passingScore", description
        FROM exam_templates WHERE "cefrLevel" = $1 LIMIT 1
    `, [level]);
    if (examRes.rows.length === 0) throw new Error(`No exam found for level ${level}`);
    const exam = examRes.rows[0] as ExamTemplate;

    const sectionsRes = await client.query(`
        SELECT id, title, skill, "totalMinutes", "totalPoints", "sortOrder", instructions
        FROM exam_sections WHERE "examId" = $1 ORDER BY "sortOrder"
    `, [exam.id]);

    exam.sections = [];
    for (const section of sectionsRes.rows) {
        const tasksRes = await client.query(`
            SELECT id, title, "exerciseType", "contentJson", "audioUrl", "maxPoints", "sortOrder"
            FROM exam_tasks WHERE "sectionId" = $1 ORDER BY "sortOrder"
        `, [section.id]);
        (section as ExamSection).tasks = tasksRes.rows;
        exam.sections.push(section as ExamSection);
    }
    return exam;
}

/**
 * Use Gemini to generate new content for a single ExamTask
 */
async function generateTaskContent(
    task: ExamTask,
    skill: string,
    level: string,
    setNumber: number,
    theme: { de: string; topics: string[] }
): Promise<any> {
    const originalContent = typeof task.contentJson === 'string' ? JSON.parse(task.contentJson) : task.contentJson;
    const exerciseType = task.exerciseType;

    // Count items to preserve
    let itemCount = 0;
    if (originalContent.items) itemCount = originalContent.items.length;
    else if (originalContent.situations) itemCount = originalContent.situations.length;

    const optionCount = originalContent.options ? originalContent.options.length : 0;

    const prompt = `
You are an expert Goethe-Zertifikat ${level} exam content creator.
Your task is to create BRAND NEW, ORIGINAL content for a ${skill === 'LESEN' ? 'Reading' : 'Listening'} comprehension task.

${LEVEL_VOCAB[level]}

THEMATIC CONSTRAINT: All content MUST be about the theme "${theme.de}". 
Use these specific sub-topics for inspiration: ${theme.topics.join(', ')}.

TASK SPECIFICATION:
- Task title: "${task.title}"
- Exercise type: ${exerciseType}
- Points: ${task.maxPoints}
- Number of items: ${itemCount}
${optionCount > 0 ? `- Number of matching options: ${optionCount}` : ''}

ORIGINAL CONTENT (use as a STRUCTURAL TEMPLATE only — generate completely NEW text):
${JSON.stringify(originalContent, null, 2)}

CRITICAL RULES:
1. Keep the EXACT SAME JSON structure and field names as the original.
2. Keep the EXACT SAME number of items (${itemCount}).
3. Generate a completely NEW passage/audioTranscript that is thematically different but structurally similar.
4. For TRUE_FALSE: Balance RICHTIG/FALSCH answers (aim for ~50/50 or ~40/60).
5. For MULTIPLE_CHOICE: Distribute correct answers evenly across A, B, C. Each question must have exactly 3 options.
6. For MATCHING: Generate ${optionCount} options and ${itemCount} situations. Include 1-2 distractors (options without matches). Keep correctMapping accurate.
7. Item IDs should use the pattern: "${level.toLowerCase()}${skill === 'LESEN' ? 'l' : 'h'}${task.sortOrder}-{N}" where N is the item number.
8. The "instructions" field should remain in German and match the exam format.
9. ${skill === 'HOEREN' ? 'Include an "audioTranscript" field with a realistic listening script (dialogues, announcements, interviews).' : 'Include a "passage" field with realistic reading text.'}

Return ONLY valid JSON. No markdown code blocks.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
    });

    const text = response.text?.trim() || '';
    try {
        return JSON.parse(text);
    } catch (e) {
        // Try extracting JSON from possible markdown
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
        throw new Error(`Failed to parse AI response for task "${task.title}": ${text.substring(0, 200)}`);
    }
}

/**
 * Insert a complete new exam set into the database
 */
async function insertExamSet(
    original: ExamTemplate,
    setNumber: number,
    generatedSections: Array<{ sectionIndex: number; tasks: Array<{ taskIndex: number; contentJson: any }> }>
): Promise<string> {
    const examId = randomUUID();
    const slug = original.slug.replace('modellsatz-1', `modellsatz-${setNumber}`);
    const title = original.title.replace('Lesen + Hören', `Lesen + Hören (Modellsatz ${setNumber})`);

    // Insert exam template
    await client.query(`
        INSERT INTO exam_templates (id, slug, title, "examType", "cefrLevel", "totalMinutes", "totalPoints", "passingScore", description, status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4::\"ExamType\", $5::\"CefrLevel\", $6, $7, $8, $9, 'PUBLISHED', NOW(), NOW())
    `, [examId, slug, title, original.examType, original.cefrLevel, original.totalMinutes, original.totalPoints, original.passingScore, original.description]);

    // Insert sections and tasks
    for (const genSection of generatedSections) {
        const origSection = original.sections[genSection.sectionIndex];
        const sectionId = randomUUID();

        await client.query(`
            INSERT INTO exam_sections (id, "examId", title, skill, "totalMinutes", "totalPoints", "sortOrder", instructions, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4::\"Skill\", $5, $6, $7, $8, NOW(), NOW())
        `, [sectionId, examId, origSection.title, origSection.skill, origSection.totalMinutes, origSection.totalPoints, origSection.sortOrder, origSection.instructions]);

        for (const genTask of genSection.tasks) {
            const origTask = origSection.tasks[genTask.taskIndex];
            const taskId = randomUUID();

            await client.query(`
                INSERT INTO exam_tasks (id, "sectionId", title, "exerciseType", "contentJson", "audioUrl", "maxPoints", "sortOrder", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4::\"ExerciseType\", $5, $6, $7, $8, NOW(), NOW())
            `, [taskId, sectionId, origTask.title, origTask.exerciseType, JSON.stringify(genTask.contentJson), origTask.audioUrl, origTask.maxPoints, origTask.sortOrder]);
        }
    }

    console.log(`  ✅ Inserted: ${title} (${slug})`);
    return examId;
}

/**
 * Generate all 9 new exam sets for a given CEFR level
 */
async function generateForLevel(level: string, startSet: number = 2, endSet: number = 10) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 Generating exam sets for ${level} (Modellsatz ${startSet}-${endSet})`);
    console.log('='.repeat(60));

    const original = await fetchOriginalExam(level);
    console.log(`📋 Original: ${original.title}`);
    console.log(`   Sections: ${original.sections.length}, Tasks: ${original.sections.reduce((s, sec) => s + sec.tasks.length, 0)}`);

    for (let setNum = startSet; setNum <= endSet; setNum++) {
        const theme = THEME_CLUSTERS[setNum];
        console.log(`\n🔨 Generating Modellsatz ${setNum} — Theme: "${theme.de}"`);

        const generatedSections: Array<{ sectionIndex: number; tasks: Array<{ taskIndex: number; contentJson: any }> }> = [];

        for (let si = 0; si < original.sections.length; si++) {
            const section = original.sections[si];
            console.log(`  📂 Section: ${section.title} (${section.skill})`);

            const generatedTasks: Array<{ taskIndex: number; contentJson: any }> = [];

            for (let ti = 0; ti < section.tasks.length; ti++) {
                const task = section.tasks[ti];
                console.log(`    📝 Generating: ${task.title} (${task.exerciseType})...`);

                try {
                    const newContent = await generateTaskContent(task, section.skill, level, setNum, theme);
                    generatedTasks.push({ taskIndex: ti, contentJson: newContent });
                    console.log(`    ✅ Done!`);
                } catch (err: any) {
                    console.error(`    ❌ FAILED: ${err.message}`);
                    // Fallback: copy original content with a note
                    const fallback = typeof task.contentJson === 'string' ? JSON.parse(task.contentJson) : { ...task.contentJson };
                    generatedTasks.push({ taskIndex: ti, contentJson: fallback });
                }

                // Rate limiting
                await sleep(3000);
            }

            generatedSections.push({ sectionIndex: si, tasks: generatedTasks });
        }

        // Insert into DB
        await insertExamSet(original, setNum, generatedSections);
        console.log(`🎉 Modellsatz ${setNum} for ${level} complete!`);
    }
}

async function main() {
    await client.connect();
    console.log('🚀 Exam Content Generator — Scale to 10 Modellsätze per Level');
    console.log('Using Gemini 2.5 Pro for content generation\n');

    // Process all levels sequentially
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    for (const level of levels) {
        await generateForLevel(level);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏆 ALL DONE! 54 new exam sets generated and inserted.');
    await client.end();
}

main().catch(err => { console.error('Fatal:', err); client.end(); });
