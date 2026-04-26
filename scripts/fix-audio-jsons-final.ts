import * as fs from 'fs';
import * as path from 'path';

const AUDIO_FACTORY_DIR = "C:\\Users\\DMF Schule\\8-Audio-Factory\\data\\exams";

const VALID_NARRATOR_VOICE = "A 42-year-old formal German male with a calm, authoritative baritone voice. Precise enunciation, steady tempo, professional broadcast quality. Studio-quality microphone.";

function walkDir(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else if (file.endsWith('.json')) {
            results.push(fullPath);
        }
    });
    return results;
}

function main() {
    const files = walkDir(AUDIO_FACTORY_DIR);
    console.log(`Found ${files.length} JSON files to fix.`);
    
    let fixedCount = 0;

    for (const file of files) {
        let isDirty = false;
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

        if (data.lines && Array.isArray(data.lines)) {
            // Fix Narrator voice drift & hallucination
            data.lines.forEach((line: any) => {
                if (line.speaker === 'Narrator') {
                    // Standardize all Narrator voices to the valid mid_m voice
                    if (line.voice_description !== VALID_NARRATOR_VOICE) {
                        line.voice_description = VALID_NARRATOR_VOICE;
                        isDirty = true;
                    }
                }
            });
        }

        if (isDirty) {
            fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
            fixedCount++;
        }
    }

    console.log(`Successfully fixed ${fixedCount} files.`);
}

main();
