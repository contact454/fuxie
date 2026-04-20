import * as fs from 'node:fs';
import * as path from 'node:path';
import * as glob from 'glob';
import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyCWKjhNim3BqAGigHJ5FRI1NC8YlFUVUXc';
const ai = new GoogleGenAI({ apiKey: apiKey });

interface VocabWord {
    word: string;
    wordType: string;
    meaningVi: string;
    meaningDe?: string;
    level: string;
}

const SAMPLE_SIZE = 50; 
const REPORT_PATH = path.resolve(process.cwd(), 'qa_report.md');

function getRandomSample(arr: VocabWord[], n: number) {
    const result = new Array(n);
    let len = arr.length;
    const taken = new Array(len);
    if (n > len) return arr;
    while (n--) {
        const x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

async function evaluateBatch(batch: VocabWord[]): Promise<any> {
    const prompt = `You are a strict German Linguistics Professor evaluating auto-generated Duden-style dictionary explanations for language learners.
Evaluate the following ${batch.length} vocabulary words.

Criteria:
1. Accuracy: Is the German definition semantically correct for the target word? (Max 4 points)
2. CEFR Level: Is the vocabulary used in the explanation simple enough for a learner at the target level? (Max 3 points)
3. Duden Style: Is it an objective, descriptive sentence/phrase rather than just a synonym list? (Max 3 points)
Total Score = 10 points.

Words to evaluate:
${batch.map((w, i) => `[${i}] Word: "${w.word}" (Level: ${w.level}, Vietnamese: "${w.meaningVi}") -> Definition: "${w.meaningDe}"`).join('\n')}

Output MUST be a valid JSON array matching the exact length of the batch.
Each object must have:
{
  "word": string,
  "score": number (0-10),
  "feedback": "Short 1-sentence feedback explaining the score"
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
    console.log(`🔍 Fuxie QA - Sampling ${SAMPLE_SIZE} words to evaluate Duden standard...`);
    const contentDir = path.resolve(process.cwd(), 'content');
    const jsonFiles = glob.sync(`${contentDir}/*/vocabulary/*.json`);
    
    let allWords: VocabWord[] = [];

    for (const file of jsonFiles) {
        const fileContent = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(fileContent);
        const cefrLevel = (file.match(/content[\\/](a1|a2|b1|b2|c1|c2)[\\/]vocabulary/i) || [])[1]?.toUpperCase() || 'B1';
        
        for (const w of data.words) {
            if (w.meaningDe && w.meaningDe.trim() !== '') {
                allWords.push({
                    word: w.word,
                    wordType: w.wordType,
                    meaningVi: w.meaningVi,
                    meaningDe: w.meaningDe,
                    level: cefrLevel
                });
            }
        }
    }

    if (allWords.length === 0) {
        console.error("❌ No generated meaningDe found to evaluate!");
        return;
    }

    const sample = getRandomSample(allWords, SAMPLE_SIZE);
    console.log(`Evaluated sample size: ${sample.length} words from total ${allWords.length} available.`);

    let reportMarkdown = `# 🎯 Duden Definition Quality Assurance Report\n\n`;
    reportMarkdown += `**Sample Size**: ${sample.length} random words.\n`;
    reportMarkdown += `**Total Words Pool**: ${allWords.length} words.\n\n`;
    reportMarkdown += `| Level | Word | Score (/10) | Generated Definition | AI Evaluation Feedback |\n`;
    reportMarkdown += `|---|---|---|---|---|\n`;

    let totalScore = 0;
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < sample.length; i += BATCH_SIZE) {
        const batch = sample.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(sample.length/BATCH_SIZE)}...`);
        
        try {
            const results = await evaluateBatch(batch);
            
            for (let j = 0; j < results.length; j++) {
                const res = results[j];
                const original = batch[j];
                totalScore += res.score;
                reportMarkdown += `| ${original.level} | **${original.word}** | **${res.score}** | ${original.meaningDe} | ${res.feedback} |\n`;
            }
        } catch (e: any) {
            console.error(`Error processing batch: ${e.message}`);
        }
    }

    const averageScore = totalScore / sample.length;
    reportMarkdown = `## 🏆 **Average Score: ${averageScore.toFixed(2)}/10**\n\n` + reportMarkdown;

    fs.writeFileSync(REPORT_PATH, reportMarkdown, 'utf-8');
    console.log(`\n✅ QA Completed! Average Score: ${averageScore.toFixed(2)}/10`);
    console.log(`📄 Report saved to: ${REPORT_PATH}`);
}

main().catch(console.error);
