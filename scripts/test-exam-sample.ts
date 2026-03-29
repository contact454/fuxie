/**
 * test-exam-sample.ts — Test generating a single exam set (A1, Modellsatz 2)
 * This is a dry-run that generates but does NOT insert into DB.
 * Instead, saves the output to scripts/exam_sample_output.json for review.
 */
import { Client } from 'pg';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const connectionString = "postgresql://neondb_owner:npg_aU0YPhW6zZQp@ep-rough-thunder-a1m0qm18.ap-southeast-1.aws.neon.tech/fuxie_prod?sslmode=require";
const client = new Client({ connectionString });

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) throw new Error('Missing GEMINI_API_KEY');
const ai = new GoogleGenAI({ apiKey: geminiKey });

const LEVEL_VOCAB: Record<string, string> = {
    A1: 'Use only very simple A1-level vocabulary (present tense, basic nouns, simple sentences ≤8 words). Content must be about everyday situations like shopping, family, time, numbers.',
};

const theme = { de: 'Arbeit & Beruf', topics: ['Bewerbungsgespräch', 'Büroalltag', 'Berufsausbildung', 'Homeoffice', 'Gehaltsverhandlung'] };

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function generateTaskContent(task: any, skill: string, level: string): Promise<any> {
    const originalContent = typeof task.contentJson === 'string' ? JSON.parse(task.contentJson) : task.contentJson;
    const exerciseType = task.exerciseType;
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
5. For MULTIPLE_CHOICE: Distribute correct answers evenly across A, B, C.
6. For MATCHING: Generate ${optionCount} options and ${itemCount} situations. Include 1-2 distractors. Keep correctMapping accurate.
7. Item IDs: use "${level.toLowerCase()}${skill === 'LESEN' ? 'l' : 'h'}${task.sortOrder}-{N}" where N is the item number.
8. The "instructions" field should remain in German.
9. ${skill === 'HOEREN' ? 'Include an "audioTranscript" field with a realistic listening script.' : 'Include a "passage" field with realistic reading text.'}

Return ONLY valid JSON. No markdown code blocks.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const text = response.text?.trim() || '';
    return JSON.parse(text);
}

async function main() {
    await client.connect();
    console.log('🧪 Testing A1 Modellsatz 2 — Theme: "Arbeit & Beruf"\n');

    // Fetch original A1
    const examRes = await client.query(`SELECT id FROM exam_templates WHERE "cefrLevel" = 'A1' LIMIT 1`);
    const examId = examRes.rows[0].id;
    
    const sectionsRes = await client.query(`SELECT id, title, skill, "sortOrder" FROM exam_sections WHERE "examId" = $1 ORDER BY "sortOrder"`, [examId]);

    const output: any = { level: 'A1', setNumber: 2, theme: theme.de, sections: [] };

    for (const section of sectionsRes.rows) {
        console.log(`📂 ${section.title} (${section.skill})`);
        const tasksRes = await client.query(`SELECT title, "exerciseType", "contentJson", "maxPoints", "sortOrder" FROM exam_tasks WHERE "sectionId" = $1 ORDER BY "sortOrder"`, [section.id]);

        const sectionOut: any = { skill: section.skill, title: section.title, tasks: [] };

        for (const task of tasksRes.rows) {
            console.log(`  📝 Generating: ${task.title}...`);
            try {
                const newContent = await generateTaskContent(task, section.skill, 'A1');
                sectionOut.tasks.push({ title: task.title, exerciseType: task.exerciseType, contentJson: newContent });
                console.log(`  ✅ Done!`);
            } catch (err: any) {
                console.error(`  ❌ FAILED: ${err.message}`);
                sectionOut.tasks.push({ title: task.title, exerciseType: task.exerciseType, error: err.message });
            }
            await sleep(3000);
        }
        output.sections.push(sectionOut);
    }

    fs.writeFileSync('scripts/exam_sample_output.json', JSON.stringify(output, null, 2));
    console.log('\n✅ Sample saved to scripts/exam_sample_output.json');
    await client.end();
}

main().catch(err => { console.error('Fatal:', err); client.end(); });
