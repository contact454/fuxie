import * as fs from 'node:fs';
import * as path from 'node:path';
import * as glob from 'glob';
import { GoogleGenAI } from '@google/genai';

import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCuGxNVkX8JDBSdUlO_e5qray6geD855sI';
const ai = new GoogleGenAI({ apiKey: apiKey });

interface VocabWord {
    word: string;
    wordType: string;
    meaningVi: string;
    meaningDe?: string;
    [key: string]: any;
}

const BATCH_SIZE = 25; 
const SLEEP_MS = 2500; // Delay to prevent soft rate limit
const PROGRESS_FILE = path.resolve(process.cwd(), 'scripts', 'audit-progress.json');

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function getProgress(): Promise<Record<string, boolean>> {
    if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
    return {};
}

function saveProgress(progress: Record<string, boolean>) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

async function evaluateAndFixBatch(batch: {w: VocabWord, index: number}[], level: string, fileBase: string): Promise<any[]> {
    const prompt = `You are a strict German Linguistics Professor running an Auto-Audit on a Duden-style learner dictionary.
Evaluate the following ${batch.length} vocabulary words (CEFR Level: ${level}).

Criteria:
1. Accuracy: Is the German definition semantically correct?
2. CEFR Level: Is the vocabulary used simple enough for a learner at ${level}?
3. Duden Style: Is it an objective, descriptive sentence/phrase rather than just a synonym list? Or is it circular?

Instructions:
Rate each word 0 to 10 points.
If the score is 8, 9, or 10 -> The state is "PASS".
If the score is 7 or lower -> The state is "FIX". You MUST generate a brand new, highly accurate, simpler, and non-circular German definition in "newMeaningDe".

Words to evaluate:
${batch.map((b, i) => `[${i}] Word: "${b.w.word}" (Vietnamese: "${b.w.meaningVi}") -> Current Definition: "${b.w.meaningDe}"`).join('\n')}

Output MUST be a valid JSON array matching the exact length of the batch.
Each object must have:
{
  "index": number (matching the input index),
  "state": "PASS" | "FIX",
  "score": number,
  "reason": "1 sentence why it passed or failed",
  "newMeaningDe": "..." (Leave empty string if PASS, generate a perfect replacement if FIX)
}`;

    const response = await ai.models.generateContent({
        model: 'gemma-4-31b-it',
        contents: prompt,
        config: {
            temperature: 0.2
        }
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
}

async function main() {
    console.log(`🔍 Fuxie Auto-Audit & Repair Pipeline starting...`);
    
    // Create tracking progress
    const progress = await getProgress();

    const contentDir = path.resolve(process.cwd(), 'content');
    const jsonFiles = glob.sync(`${contentDir}/*/vocabulary/*.json`);
    
    console.log(`Found ${jsonFiles.length} vocabulary files to audit.`);
    
    let totalFixed = 0;
    let totalChecked = 0;

    for (const file of jsonFiles) {
        const fileBaseName = path.basename(file);
        
        if (progress[fileBaseName]) {
            console.log(`⏭️  Skipping ${fileBaseName} (Already Audited 100%)`);
            continue;
        }

        console.log(`\n⏳ Auditing: ${fileBaseName}`);
        const fileContent = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(fileContent);
        const cefrLevel = (file.match(/content[\\/](a1|a2|b1|b2|c1|c2)[\\/]vocabulary/i) || [])[1]?.toUpperCase() || 'B1';
        
        let modifiedFile = false;
        
        // Build batches of active records mapping their real indices
        let wordList = data.words.map((w: VocabWord, i: number) => ({w, index: i}));
        
        for (let i = 0; i < wordList.length; i += BATCH_SIZE) {
            const batch = wordList.slice(i, i + BATCH_SIZE);
            let success = false;
            let attempts = 0;

            while (!success && attempts < 3) {
                try {
                    const results = await evaluateAndFixBatch(batch, cefrLevel, fileBaseName);
                    
                    if (!Array.isArray(results) || results.length !== batch.length) {
                        throw new Error(`Length mismatch: Got ${results?.length}, expected ${batch.length}`);
                    }

                    for (let j = 0; j < results.length; j++) {
                        const res = results[j];
                        const realIndex = batch[j].index;
                        const wordObj = data.words[realIndex];
                        totalChecked++;

                        if (res.state === "FIX" && res.newMeaningDe) {
                            console.log(`   🛠️ FIXED: "${wordObj.word}" (Score: ${res.score}/10) | Reason: ${res.reason}`);
                            console.log(`      Old: ${wordObj.meaningDe}`);
                            console.log(`      New: ${res.newMeaningDe}`);
                            wordObj.meaningDe = res.newMeaningDe;
                            modifiedFile = true;
                            totalFixed++;
                        }
                    }

                    success = true;
                    await sleep(SLEEP_MS);
                    console.log(`   - Audited batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(wordList.length/BATCH_SIZE)}`);
                } catch (e: any) {
                    attempts++;
                    console.error(`   ❌ Batch error (try ${attempts}/3): ${e.message}`);
                    await sleep(SLEEP_MS * 2);
                }
            }

            if (!success) {
                console.error(`   🚨 Failed to audit batch for ${fileBaseName}. Terminating to preserve safety.`);
                process.exit(1);
            }
        }

        // Save modifications to the JSON itself
        if (modifiedFile) {
            fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
            console.log(`💾 Saved repairs for ${fileBaseName}`);
        }

        // Mark file as 100% completed
        progress[fileBaseName] = true;
        saveProgress(progress);
        console.log(`✅ Completed ${fileBaseName}`);
    }

    console.log(`\n🎉 Audit Pipeline Complete!`);
    console.log(`Total words checked: ${totalChecked}`);
    console.log(`Total defects found & fixed: ${totalFixed} (${((totalFixed/(totalChecked||1))*100).toFixed(2)}%)`);
}

main().catch(console.error);
