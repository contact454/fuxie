import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
// We will grab the key from apps/web/.env
const webEnvPath = path.join(__dirname, '../apps/web/.env');
let geminiKey = process.env.GEMINI_API_KEY;

if (fs.existsSync(webEnvPath)) {
    const envLines = fs.readFileSync(webEnvPath, 'utf8').split('\n');
    for (const line of envLines) {
        if (line.startsWith('GEMINI_API_KEY=')) {
            geminiKey = line.split('=')[1].trim().replace(/^"|"$/g, '');
            break;
        }
    }
}

if (!geminiKey) {
    console.error("GEMINI_API_KEY not found in apps/web/.env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: geminiKey });

// Paths
const fuxieListeningDir = path.join(__dirname, '../content/c2/listening');
const audioFactoryScriptsDir = path.join(__dirname, '../../8-Audio-Factory/data/scripts/C2');

const TARGET_DIR = fuxieListeningDir;
const TARGET_FILE = 'L-C2-GOETHE-001-T1.json';

type TeilMap = { [key: number]: string };
const TEIL_FOLDER_MAP: TeilMap = {
    1: 'Teil1-Radiosendungen',
    2: 'Teil2-Spontanes-Gespraech',
    3: 'Teil3-Experteninterview-lang'
};

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function rebuildFile(filename: string) {
    console.log(`\n========================================`);
    console.log(`Processing: ${filename}`);
    const fuxiePath = path.join(fuxieListeningDir, filename);
    if (!fs.existsSync(fuxiePath)) {
        console.error(`File not found: ${fuxiePath}`);
        return;
    }

    const fuxieData = JSON.parse(fs.readFileSync(fuxiePath, 'utf8'));
    const teil = fuxieData.teil;
    const taskType = fuxieData.task_type; // 'mc_abc' or 'richtig_falsch'
    
    const factoryFolder = TEIL_FOLDER_MAP[teil as number];
    if (!factoryFolder) {
        console.error(`Unknown Teil: ${teil}`);
        return;
    }

    const factoryPath = path.join(audioFactoryScriptsDir, factoryFolder, filename);
    if (!fs.existsSync(factoryPath)) {
        console.error(`Audio-Factory script not found: ${factoryPath}`);
        return;
    }

    const factoryData = JSON.parse(fs.readFileSync(factoryPath, 'utf8'));
    
    // Extract Context
    let context = `This is the transcript for Goethe B2 Hören Teil ${teil}. \n\n`;
    
    // Group lines by Gespräche, Ansage, or Item
    let currentBlock = 0;
    for (const line of factoryData.lines) {
        if (line.speaker_role === 'exam_narrator') {
            context += `\n[NARRATOR] ${line.text}\n`;
            if (line.text.includes("Gespräch") || line.text.includes("Ansage") || line.text.includes("Nummer")) {
                currentBlock++;
            }
        } else {
            const blockPrefix = currentBlock > 0 ? `[Part ${currentBlock}] ` : '';
            context += `${blockPrefix}${line.speaker}: ${line.text}\n`;
        }
    }

    console.log("Extracted Context:");
    console.log(context);
    console.log("-----------------------------------------");

    const targetQCount = fuxieData.questions ? fuxieData.questions.length : 7;

    const prompt = `
You are an expert Goethe-Zertifikat C2 (GDS - Großes Deutsches Sprachdiplom) test creator and strict Quality Assurance (QA) reviewer.
Your task is to create hyper-realistic Goethe C2 listening comprehension questions based ONLY on the provided transcript.

CRITICAL QUALITY ASSURANCE (QA) RULES YOU MUST FOLLOW:
1. NATIVE-LIKE C2 LEVEL: C2 tests absolute mastery of the German language. You MUST test the understanding of deep implicit meaning, idioms, sarcasm, irony, wordplay, and nuanced speaker intent. Questions must NOT ask for direct facts.
2. LEXICAL TRAPPING: Distractors MUST be brutally sophisticated. Trap the listener by using exact words from the audio in the WRONG option, while the CORRECT option uses highly abstract paraphrasing or idiomatic equivalents.
3. IDIOMS AND ACADEMIC VOCABULARY: The language in the questions and options must be highly advanced, utilizing redensarten, sprichwörter, and C2 academic verbs.
4. EXPLANATION QUALITY: The explanation must clearly state WHY the answer is correct and WHY the lexical trap is wrong in German ("de") and Vietnamese ("vi"). The "key_evidence" MUST be an exact quote from the transcript.

Task Guidelines for Goethe C2 Hören:
Generate EXACTLY ${targetQCount} questions.
${teil === 1 ? '- Teil 1 (Radiosendungen): Type: "ja_nein". Your questions must use the field "statement" instead of "question". Determine if the statement is true ("ja") or false ("nein").' : ''}
${teil === 2 ? '- Teil 2 (Spontanes Gespräch): Type: "mc_abc" (Multiple Choice A, B, C).' : ''}
${teil === 3 ? '- Teil 3 (Experteninterview lang): Type: "richtig_falsch". Determine if the statements are right (richtig) or wrong (falsch) based on the interview.' : ''}

General Format Rules:
1. For mc_abc: Exactly 3 options (a, b, c). Answer must be a, b, or c.
2. For ja_nein: The answer must be exactly "ja" or "nein". Use "statement" field, not "question".
3. For richtig_falsch: The answer must be exactly "richtig" or "falsch". Use "statement" field.
4. The output must strictly follow the expected JSON schema: an array of question objects.

Here is the transcript context:
${context}

Return ONLY standard raw JSON array data. Do not include markdown code blocks.
Example JSON output for Teil 1 (ja_nein):
[
  {
    "id": "Q1",
    "item": 1,
    "type": "ja_nein",
    "statement": "Der Moderator impliziert, dass die politische Debatte lediglich Makulatur sei.",
    "answer": "ja",
    "points": 1,
    "explanation": {
      "de": "Der Experte bestätigt, dass die aktuellen Maßnahmen nur Augenwischerei sind (Makulatur).",
      "vi": "Chuyên gia ngụ ý rằng các cuộc tranh luận chính trị chỉ là trò tẩy não / che mắt.",
      "key_evidence": "Das Ganze ist doch reinste Augenwischerei und Makulatur.",
      "key_vocabulary": []
    }
  }
]
`;

    console.log("Calling Gemini API...");
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        });
        
        let responseText = response.text || "[]";
        let newQuestions = JSON.parse(responseText);

        fuxieData.questions = newQuestions;
        fs.writeFileSync(fuxiePath, JSON.stringify(fuxieData, null, 2));
        fs.writeFileSync(path.join(__dirname, 'sample_output_C2.json'), JSON.stringify(newQuestions, null, 2));
        console.log(`✅ successfully updated ${filename} with ${newQuestions.length} questions. Saved sample to scripts/sample_output_C2.json`);

    } catch (e: any) {
        console.error(`❌ Failed to generate for ${filename}:`);
        console.error(e.message || e);
        if (e.status) console.error("Status:", e.status);
    }
}

async function main() {
    const files = fs.readdirSync(TARGET_DIR).filter(f => f.endsWith('.json') && f.startsWith('L-C2-GOETHE'));
    console.log(`Found ${files.length} files to process.`);
    for (const file of files) {
        await rebuildFile(file);
        console.log("Waiting 5 seconds...");
        await sleep(5000);
    }
    console.log("🎉 Mass generation complete!");
}

main();
