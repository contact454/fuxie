/**
 * Generate Theme Images for Fuxie Vocabulary Themes (File-First approach)
 *
 * Generates illustrated circular icons for each vocabulary theme using
 * Google Gemini Imagen API. Saves locally to apps/web/public/images/themes/
 * and updates the JSON files. Runs DB seed when complete.
 *
 * Usage:
 *   npx tsx scripts/generate-theme-images.ts [--all]
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { GoogleGenAI, Modality } from "@google/genai";

// ===== CONFIG =====
const DELAY_MS = 6000; // 6 seconds to stay under 15 RPM
const RETRY_DELAY_MS = 60000; // 60 seconds wait on quota error
const MAX_RETRIES = 3;
const LEVELS = ["a1", "a2", "b1", "b2", "c1", "c2"];

// ===== ARGS =====
const RUN_ALL = process.argv.includes("--all");

// ===== CLIENTS =====
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildThemePrompt(name: string): string {
  return `Create a cute, simple flat design circular icon illustration for a German language learning app theme called "${name}".
Featuring a cute light blue fox mascot named Fuxie interacting with the theme.
Style: Clean flat vector illustration, cheerful, educational, soft pastel colors with blue (#5B9BD5) and orange (#FF6B35) accent tones, solid background color, no text, no border.
The illustration should be contained within a soft circle shape. 256x256 scale.`;
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
  console.log("🦊 Fuxie Bulk Theme Image Generator (Local + File-First)");
  console.log("======================================================");
  console.log(`Mode: ${RUN_ALL ? "ALL LEVELS" : "A2-C2 ONLY (Skipping A1)"}`);
  console.log(`Delay between requests: ${DELAY_MS}ms\n`);

  const activeLevels = RUN_ALL ? LEVELS : LEVELS.filter((l) => l !== "a1");
  const tasks: Array<{ level: string; file: string; data: any; path: string }> =
    [];

  for (const level of activeLevels) {
    const dir = path.join("content", level, "vocabulary");
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      if (data.theme) {
        tasks.push({ level, file, data, path: fullPath });
      }
    }
  }

  console.log(`📊 Found ${tasks.length} themes to process\n`);

  let success = 0;
  let failed = 0;

  // Ensure output directory exists
  const imgDir = path.join("apps", "web", "public", "images", "themes");
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
  }

  for (const task of tasks) {
    const theme = task.data.theme;
    const slug = theme.slug;
    const imgPath = path.join(imgDir, `${slug}.png`);
    const relativeImgPath = `/images/themes/${slug}.png`;

    const prompt = buildThemePrompt(theme.name);

    console.log(
      `🎨 Generating [${task.level.toUpperCase()}]: ${theme.name} (${slug})...`,
    );
    const imageBuffer = await generateImage(prompt);

    if (!imageBuffer) {
      console.log(`  ⚠️ ${theme.name}: No image generated (skipped)`);
      failed++;
      continue;
    }

    // Save image
    fs.writeFileSync(imgPath, imageBuffer);

    // Update JSON
    task.data.theme.imageUrl = relativeImgPath;
    fs.writeFileSync(task.path, JSON.stringify(task.data, null, 2) + "\n");

    console.log(`  ✅ Saved to ${relativeImgPath}`);
    success++;

    await sleep(DELAY_MS);
  }

  console.log("\n================================");
  console.log("📊 Summary:");
  console.log(`  Total: ${tasks.length}`);
  console.log(`  ✅ Success: ${success}`);
  console.log(`  ❌ Failed: ${failed}`);

  console.log("\n🌱 Running Database Seed to sync local DB...");
  try {
    execSync("npx tsx packages/database/prisma/seed.ts", { stdio: "inherit" });
    console.log("✅ Database seeded successfully!");
  } catch (e) {
    console.log(
      "⚠️ Failed to run pnpm db:seed automatically. Please run it manually.",
    );
  }

  console.log("\n🦊 All Done!");
}

main().catch(console.error);
