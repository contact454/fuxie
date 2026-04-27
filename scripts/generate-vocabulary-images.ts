/**
 * Batch Image Generation for Fuxie Vocabulary
 *
 * Generates flat illustration images for vocabulary words using
 * Google Gemini Imagen API. Saves locally to apps/web/public/images/vocab/
 * and updates the JSON files.
 *
 * Usage:
 *   npx tsx scripts/generate-vocabulary-images.ts [--dry-run] [--force]
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { GoogleGenAI, Modality } from "@google/genai";

// ===== CONFIG =====
const DELAY_MS = 6000; // 6 seconds to stay under 15 RPM
const RETRY_DELAY_MS = 60000; // 60 seconds wait on quota error
const MAX_RETRIES = 3;
const LEVELS = ["a1", "a2", "b1", "b2", "c1", "c2"];

// ===== ARGS =====
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");

// ===== CLIENTS =====
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildPrompt(word: string, meaningVi: string): string {
  return `Create a simple, cute flat design illustration of "${word}" (${meaningVi}) for a language learning flashcard.
Featuring a cute light blue fox mascot named Fuxie interacting with the object or concept.
Style: Clean flat vector illustration, cheerful, educational, soft pastel colors with blue (#5B9BD5) and orange (#FF6B35) accent tones, white/transparent background, no text, no border.
Single centered scene, 256x256 scale.`;
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      const response = await genai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: prompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.mimeType?.startsWith("image/")) {
            return Buffer.from(part.inlineData.data!, "base64");
          }
        }
      }
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Image gen error: ${msg}`);
      if (
        msg.includes("429") ||
        msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("exhausted")
      ) {
        console.log(`  ⏳ Quota hit, waiting ${RETRY_DELAY_MS / 1000}s...`);
        await sleep(RETRY_DELAY_MS);
        retries++;
      } else {
        return null; // Fail immediately on non-quota errors
      }
    }
  }
  return null;
}

// ===== MAIN =====
async function main() {
  console.log("🦊 Fuxie Vocabulary Image Generator (Local + File-First)");
  console.log("========================================================");
  console.log(`Mode: ${DRY_RUN ? "🔍 DRY RUN" : "🔴 LIVE"} | Force: ${FORCE}`);
  console.log(`Delay between requests: ${DELAY_MS}ms\n`);

  const tasks: Array<{
    level: string;
    file: string;
    themeSlug: string;
    wordObj: any;
    wordIdx: number;
    path: string;
  }> = [];

  for (const level of LEVELS) {
    const dir = path.join("content", level, "vocabulary");
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      if (!data.words || !Array.isArray(data.words)) continue;

      const themeSlug = data.theme?.slug || "other";

      for (let i = 0; i < data.words.length; i++) {
        const word = data.words[i];
        if (!word.imageUrl || FORCE) {
          tasks.push({
            level,
            file,
            themeSlug,
            wordObj: word,
            wordIdx: i,
            path: fullPath,
          });
        }
      }
    }
  }

  console.log(`📊 Found ${tasks.length} words needing images\n`);

  if (tasks.length === 0) {
    console.log("✅ All vocabulary words already have images!");
    return;
  }

  let success = 0;
  let failed = 0;
  const errors: Array<{ word: string; error: string }> = [];

  for (const task of tasks) {
    const word = task.wordObj.word;
    const wordSlug = slugify(word);
    const themeSlug = task.themeSlug;

    const imgDir = path.join(
      "apps",
      "web",
      "public",
      "images",
      "vocab",
      themeSlug,
    );
    if (!DRY_RUN && !fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }

    const imgPath = path.join(imgDir, `${wordSlug}.png`);
    const relativeImgPath = `/images/vocab/${themeSlug}/${wordSlug}.png`;
    const prompt = buildPrompt(word, task.wordObj.meaningVi);

    if (DRY_RUN) {
      console.log(`🔍 [DRY] ${word} -> ${relativeImgPath}`);
      continue;
    }

    console.log(`🎨 Generating: ${word} (${wordSlug})...`);
    const imageBuffer = await generateImage(prompt);

    if (!imageBuffer) {
      console.log(`  ⚠️ ${word}: No image generated (skipped)`);
      failed++;
      errors.push({ word, error: "No image in response" });
      continue;
    }

    // Save image
    fs.writeFileSync(imgPath, imageBuffer);

    // Update JSON file directly
    const fileContent = fs.readFileSync(task.path, "utf8");
    const data = JSON.parse(fileContent);
    data.words[task.wordIdx].imageUrl = relativeImgPath;
    fs.writeFileSync(task.path, JSON.stringify(data, null, 2) + "\n");

    console.log(`  ✅ Saved to ${relativeImgPath}`);
    success++;

    await sleep(DELAY_MS);
  }

  console.log("\n========================================");
  console.log("📊 Summary:");
  console.log(`  Total: ${tasks.length}`);
  if (!DRY_RUN) {
    console.log(`  ✅ Success: ${success}`);
    console.log(`  ❌ Failed: ${failed}`);
  }

  if (errors.length > 0) {
    console.log("\n❌ Failed words:");
    errors.forEach((e) => console.log(`  - ${e.word}: ${e.error}`));
  }

  console.log("\n🦊 Done!");
}

main().catch(console.error);
