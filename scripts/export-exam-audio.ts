/**
 * export-exam-audio.ts
 * 
 * Extracts 'audioTranscript' from HOEREN tasks in the Production DB,
 * uses Gemini 2.5 Pro to parse the raw text into a strictly formatted
 * multi-speaker JSON schema, and saves it to 8-Audio-Factory for rendering.
 */
import { Client } from 'pg';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const client = new Client({ connectionString });

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) throw new Error('Missing GEMINI_API_KEY');
const ai = new GoogleGenAI({ apiKey: geminiKey });

const AUDIO_FACTORY_DIR = "C:\\Users\\DMF Schule\\8-Audio-Factory\\data\\exams";

// 8-Audio-Factory Voice Registry
const VOICES = {
    narrator_f: "A 45-year-old formal German female narrator with a warm low contralto register, precise diction, controlled intonation, and no regional accent. Studio-quality microphone, close distance.",
    young_f: "A 26-year-old casual German female with a warm, natural, mid-register voice. Friendly conversational pacing, clear articulation, slight smile in delivery. Studio-quality microphone.",
    young_m: "A 24-year-old casual German male with a clear, energetic tenor voice. Natural conversational rhythm, friendly and engaged. Studio-quality microphone.",
    mid_m: "A 42-year-old formal German male with a calm, authoritative baritone voice. Precise enunciation, steady tempo, professional broadcast quality. Studio-quality microphone.",
    mid_f: "A 40-year-old professional German female with a clear, warm mezzo-soprano voice. Balanced pacing, confident delivery. Studio-quality microphone.",
    senior_m: "A 54-year-old formal German male professor voice with a deep, measured baritone. Academic authority, thoughtful pacing. Studio-quality microphone.",
    radio_f: "A 35-year-old German female radio host with a bright, engaging voice. Professional broadcast quality, varied intonation. Studio-quality microphone.",
    expert_f: "A 47-year-old formal German female scientist with a precise, analytical voice. Measured pace, academic register. Studio-quality microphone.",
};

const SYSTEM_PROMPT = `
Your ONLY job is to convert the raw text into a STRICT JSON ARRAY of spoken dialogue lines.

VOICE REGISTRY:
${JSON.stringify(VOICES, null, 2)}

CRITICAL INSTRUCTIONS:
1. Identify all speakers in the raw transcript.
2. For exam announcements (e.g., "Sie hören nun...", "Ansage 1:"), assign the speaker "Narrator", voice_description "narrator_f", and speaker_role "exam_narrator".
3. For the actual dialogue/monologue, assign logical speaker names (e.g., "Sprecher1", "Frau", "Mann"). Pick the most appropriate voice key from the registry (e.g., "young_f", "mid_m").
4. Ensure the output is EXACTLY a JSON Array of objects matching this schema:
[
  {
    "speaker": "Narrator",
    "speaker_role": "exam_narrator",
    "voice_description": "A 45-year-old formal German female narrator...",
    "instruct_control": "[Speak in formal neutral exam-announcer mode, clear and authoritative.]",
    "emotion": "neutral",
    "speed": 0.8,
    "pause_after": 1.0,
    "text": "Gespräch 1.",
    "engine": "qwen3"
  },
  {
    "speaker": "Sprecher1",
    "speaker_role": "dialogue_speaker",
    "voice_description": "A 26-year-old casual German female...",
    "instruct_control": "[Speak naturally]",
    "emotion": "happy",
    "speed": 1.0,
    "pause_after": 0.8,
    "text": "Guten Tag!",
    "engine": "qwen3"
  }
]

DO NOT WRAP THE ARRAY IN AN OBJECT. RETURN ONLY THE ARRAY.`;

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function processTask(task: any, folderPath: string) {
    const content = typeof task.contentJson === 'string' ? JSON.parse(task.contentJson) : task.contentJson;
    const rawTranscript = content.audioTranscript;
    if (!rawTranscript) {
        console.log(`  ⚠️ No audioTranscript found. Skipping.`);
        return;
    }

    const prompt = `
LEVEL: ${task.cefrLevel}
EXERCICE TYPE: ${task.exerciseType}
TITLE: ${task.title}

RAW TRANSCRIPT:
${rawTranscript}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { 
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json" 
            }
        });

        const text = response.text?.trim() || '[]';
        let rawLines = [];
        try {
            rawLines = JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) rawLines = JSON.parse(jsonMatch[1].trim());
            else throw e;
        }

        // Fuxie Internal Voice Registry Mapping
        const VOICE_MAP: Record<string, string> = {
            "narrator_f": "A 45-year-old formal German female narrator with a warm low contralto register, precise diction, controlled intonation, and no regional accent. Studio-quality microphone, close distance.",
            "young_f": "A 26-year-old casual German female with a warm, natural, mid-register voice. Friendly conversational pacing, clear articulation, slight smile in delivery. Studio-quality microphone.",
            "young_m": "A 24-year-old casual German male with a clear, energetic tenor voice. Natural conversational rhythm, friendly and engaged. Studio-quality microphone.",
            "mid_m": "A 42-year-old formal German male with a calm, authoritative baritone voice. Precise enunciation, steady tempo, professional broadcast quality. Studio-quality microphone.",
            "mid_f": "A 40-year-old professional German female with a clear, warm mezzo-soprano voice. Balanced pacing, confident delivery. Studio-quality microphone.",
            "senior_m": "A 54-year-old formal German male professor voice with a deep, measured baritone. Academic authority, thoughtful pacing. Studio-quality microphone.",
            "radio_f": "A 35-year-old German female radio host with a bright, engaging voice. Professional broadcast quality, varied intonation. Studio-quality microphone.",
            "expert_f": "A 47-year-old formal German female scientist with a precise, analytical voice. Measured pace, academic register. Studio-quality microphone."
        };

        // Pass 1: Speaker Consistency (Identify the primary voice for each speaker)
        const speakerToVoiceId = new Map<string, string>();
        for (const line of rawLines) {
            if (line.speaker && line.voice_id && !speakerToVoiceId.has(line.speaker)) {
                speakerToVoiceId.set(line.speaker, line.voice_id);
            }
        }

        // Pass 2: Hard-sanitize & construct the 'lines' array for Audio Factory
        const lines = rawLines
            .filter((l: any) => typeof l.text === 'string' && l.text.trim().length > 0)
            .map((line: any) => {
                const sName = line.speaker || "Unknown";
                // Enforce one consistent voice per speaker
                let vId = speakerToVoiceId.get(sName) || line.voice_id || "mid_f";
                
                // Fallback registry matching
                if (!VOICE_MAP[vId]) {
                    vId = "mid_f";
                    if (sName.toLowerCase().includes("herr ")) vId = "mid_m";
                }

                // Gender correction heuristic
                const isMaleName = sName.toLowerCase().includes("herr ") || sName.toLowerCase().includes("mann") || sName.toLowerCase().includes("verkäufer");
                const isFemaleName = sName.toLowerCase().includes("frau ") || sName.toLowerCase().includes("kundin") || sName.toLowerCase().includes("verkäuferin");
                if (isMaleName && vId.endsWith("_f")) vId = "mid_m";
                if (isFemaleName && vId.endsWith("_m")) vId = "mid_f";

                // Pause bound check
                const pause = Math.min(Math.max((typeof line.pause_after === 'number') ? line.pause_after : 2.0, 0), 5.0);
                const spd = Math.min(Math.max((typeof line.speed === 'number') ? line.speed : 1.0, 0.5), 2.0);

                return {
                    speaker: sName,
                    speaker_role: line.speaker_role || "dialogue_speaker",
                    voice_description: VOICE_MAP[vId],
                    instruct_control: line.instruct_control || "[Speak clearly]",
                    emotion: line.emotion || "neutral",
                    speed: spd,
                    pause_after: pause,
                    text: line.text.trim(),
                    engine: line.engine || "qwen3"
                };
            });

        // Generate the final JSON structure for Audio Factory
        const outputFilename = `${task.cefrLevel}/${task.slug}/${task.taskId}.mp3`;
        const finalJson = {
            lesson_id: task.taskId,
            level: task.cefrLevel,
            title: task.title,
            board: "GOETHE_EXAM",
            task_type: task.exerciseType,
            topic: "Exam Mock",
            background_scene: "studio", // Default, could be 'cafe' or 'station'
            background_sfx_volume: 0.1,
            output_filename: outputFilename,
            lines: lines
        };

        const filePath = path.join(folderPath, `${task.taskId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(finalJson, null, 2));
        console.log(`  ✅ Saved: ${filePath}`);

    } catch (err: any) {
        console.error(`  ❌ Parsing failed: ${err.message}`);
    }
}

async function main() {
    console.log('🚀 Exam Audio Exporter — DB to Audio Factory');

    // Make sure base dirs exist
    if (!fs.existsSync(AUDIO_FACTORY_DIR)) {
        fs.mkdirSync(AUDIO_FACTORY_DIR, { recursive: true });
    }

    // ── PHASE 1: Fetch all tasks from DB, then immediately disconnect ──
    await client.connect();
    const query = `
        SELECT 
            t.id AS "taskId", t.title, t."exerciseType", t."contentJson",
            s.skill,
            e."cefrLevel", e.slug
        FROM exam_tasks t
        JOIN exam_sections s ON t."sectionId" = s.id
        JOIN exam_templates e ON s."examId" = e.id
        WHERE s.skill = 'HOEREN' AND (t."audioUrl" IS NULL OR t."audioUrl" = '')
        ORDER BY e."cefrLevel", e.slug, t."sortOrder"
    `;
    const res = await client.query(query);
    const tasks = res.rows;
    await client.end(); // Close immediately to prevent NeonDB idle timeout (57P01)
    console.log(`📦 Fetched ${tasks.length} HOEREN tasks from DB (connection closed).`);

    // ── PHASE 2: Process each task offline against Gemini ──
    let processed = 0;
    let skipped = 0;
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const levelDir = path.join(AUDIO_FACTORY_DIR, task.cefrLevel);
        const examDir = path.join(levelDir, task.slug);
        const outFile = path.join(examDir, `${task.taskId}.json`);

        // Skip if already exported (resumability)
        if (fs.existsSync(outFile)) {
            skipped++;
            continue;
        }

        console.log(`\n[${i + 1}/${tasks.length}] Level: ${task.cefrLevel} | Exam: ${task.slug} | Task: ${task.title}`);
        
        if (!fs.existsSync(examDir)) {
            fs.mkdirSync(examDir, { recursive: true });
        }

        await processTask(task, examDir);
        processed++;
        await sleep(3000); // Rate limit
    }

    console.log(`\n🎉 Finished! Processed: ${processed}, Skipped (already exists): ${skipped}, Total: ${tasks.length}`);
}

main().catch(err => { console.error('Fatal:', err); });
