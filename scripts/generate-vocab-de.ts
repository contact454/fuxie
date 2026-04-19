import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as glob from 'glob';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

// Initialize Gemini Client
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing from environment.');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const BATCH_SIZE = 40; // Max words to ask per prompt to avoid overload

interface VocabWord {
    word: string;
    wordType: string;
    meaningVi: string;
    meaningEn?: string;
    meaningDe?: string;
    [key: string]: any;
}

const SLEEP_MS = 3000;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log('🤖 Fuxie AI - Generating German Explanations (Duden-Style)');
    const contentDir = path.resolve(process.cwd(), 'content');
    
    // Find all vocabulary JSON files
    const jsonFiles = glob.sync(`${contentDir}/*/vocabulary/*.json`);
    console.log(`Found ${jsonFiles.length} vocabulary files.`);

    for (const file of jsonFiles) {
        const fileContent = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(fileContent);
        const levelMatch = file.match(/content\\(a1|a2|b1|b2|c1|c2)\\vocabulary/i) || file.match(/content\/(a1|a2|b1|b2|c1|c2)\/vocabulary/i);
        const cefrLevel = levelMatch ? levelMatch[1].toUpperCase() : 'B1';

        const missingWords = data.words.filter((w: VocabWord) => !w.meaningDe);
        
        if (missingWords.length === 0) {
            console.log(`✅ ${path.basename(file)}: Already complete.`);
            continue;
        }

        console.log(`⏳ ${path.basename(file)}: ${missingWords.length} words missing meaningDe.`);
        let modified = false;

        // Process in batches
        for (let i = 0; i < missingWords.length; i += BATCH_SIZE) {
            const batch = missingWords.slice(i, i + BATCH_SIZE);
            const prompt = `You are a German language teacher crafting an immersive CEFR-graded dictionary (Duden-style).
Target Learner Level: ${cefrLevel}
Task: Given the list of German words and their native translations, provide exactly ONE simple German definition/explanation (meaningDe) for each word.
The German explanation MUST use vocabulary appropriate for the ${cefrLevel} level or LOWER.
For nouns, describe what it is. For adjectives, provide simpler synonyms or antonyms if easier. For verbs, explain the action simply.

Here are the words:
${batch.map((w: VocabWord, idx: number) => `[${idx}] Word: "${w.word}" (Type: ${w.wordType}, Vietnamese: "${w.meaningVi}")`).join('\n')}

Reply ONLY with a strictly valid minified JSON Array of strings. The array must contain exactly ${batch.length} strings. The string at index i must be the German explanation for word [i]. Do not include markdown codeblocks (\`\`\`json). Just the raw JSON array. Example: ["ein Wort für...", "sehr schnell", "das Gegenteil von..."]`;

            let success = false;
            let attempts = 0;

            while (!success && attempts < 3) {
                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                        config: {
                            temperature: 0.2,
                            responseMimeType: "application/json"
                        }
                    });

                    const responseText = response.text || '[]';
                    const results: string[] = JSON.parse(responseText);

                    if (results.length !== batch.length) {
                        throw new Error(`Array length mismatch: expected ${batch.length}, got ${results.length}`);
                    }

                    // Map results back to original data structure
                    batch.forEach((w: VocabWord, idx: number) => {
                        w.meaningDe = results[idx]?.trim();
                    });

                    modified = true;
                    success = true;
                    console.log(`   - Generated batch ${Math.round(i/BATCH_SIZE) + 1}/${Math.ceil(missingWords.length/BATCH_SIZE)}`);
                    await sleep(SLEEP_MS); // Rate limiting
                } catch (err: any) {
                    attempts++;
                    console.error(`   ❌ Batch error (try ${attempts}/3): ${err.message}`);
                    await sleep(SLEEP_MS * 2);
                }
            }
            if (!success) {
                console.error(`   🚨 Failed to process batch for ${path.basename(file)}. Skipping file.`);
                break; // Skip to next file so we can save partial progress
            }
        }

        if (modified) {
            fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
            console.log(`💾 Saved ${path.basename(file)}`);
        }
    }
    console.log('🎉 Generation complete!');
}

main().catch(console.error);
