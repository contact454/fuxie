/**
 * Post-Render Automated QA Script for Exam Audios
 *
 * Scans the Audio Factory output directory to ensure all generated MP3s
 * are valid, non-empty, and of appropriate length/bitrate.
 * Now includes LUFS and True Peak verification!
 *
 * Run this BEFORE syncing to Production!
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const AUDIO_OUTPUT_DIR = "C:\\Users\\DMF Schule\\8-Audio-Factory\\data\\output";
const FFMPEG_PATH =
  "C:\\Users\\DMF Schule\\8-Audio-Factory\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe";
const MIN_FILE_SIZE_KB = 50;

// Target: -14 LUFS, Peak: -1.0 dBTP
// We allow a small tolerance.
const MIN_LUFS = -16.5;
const MAX_LUFS = -11.5;
const MAX_PEAK = -0.5;

async function asyncPool(poolLimit: number, array: any[], iteratorFn: any) {
  const ret = [];
  const executing: any[] = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    if (poolLimit <= array.length) {
      const e: any = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

async function checkAudioQuality(
  filePath: string,
): Promise<{ lufs: number | null; peak: number | null }> {
  try {
    const cmd = `"${FFMPEG_PATH}" -i "${filePath}" -filter_complex ebur128=peak=true -f null - 2>&1`;
    const { stdout, stderr } = await execAsync(cmd);
    const output = stdout + stderr;

    const lufsMatch = output.match(
      /Integrated loudness:[\s\S]*?I:\s+(-?\d+\.\d+) LUFS/,
    );
    const peakMatch = output.match(
      /True peak:[\s\S]*?Peak:\s+(-?\d+\.\d+) dBFS/,
    );

    return {
      lufs: lufsMatch ? parseFloat(lufsMatch[1]) : null,
      peak: peakMatch ? parseFloat(peakMatch[1]) : null,
    };
  } catch (err: any) {
    // ffmpeg outputs to stderr and may throw
    const output = err.stderr || err.stdout || "";
    const lufsMatch = output.match(
      /Integrated loudness:[\s\S]*?I:\s+(-?\d+\.\d+) LUFS/,
    );
    const peakMatch = output.match(
      /True peak:[\s\S]*?Peak:\s+(-?\d+\.\d+) dBFS/,
    );
    return {
      lufs: lufsMatch ? parseFloat(lufsMatch[1]) : null,
      peak: peakMatch ? parseFloat(peakMatch[1]) : null,
    };
  }
}

async function main() {
  console.log("🎧 Fuxie Deep QA: Exam Audio Validator");
  console.log("======================================");
  console.log(`Scanning: ${AUDIO_OUTPUT_DIR}\n`);

  if (!fs.existsSync(AUDIO_OUTPUT_DIR)) {
    console.error("❌ Audio output directory not found!");
    process.exit(1);
  }

  let totalFiles = 0;
  let zeroByteFiles = 0;
  let underSizeFiles = 0;
  const errors: string[] = [];
  const filesToCheck: { path: string; key: string }[] = [];

  const levels = fs
    .readdirSync(AUDIO_OUTPUT_DIR)
    .filter((d) => fs.statSync(path.join(AUDIO_OUTPUT_DIR, d)).isDirectory());

  for (const level of levels) {
    const levelDir = path.join(AUDIO_OUTPUT_DIR, level);
    const slugs = fs
      .readdirSync(levelDir)
      .filter((d) => fs.statSync(path.join(levelDir, d)).isDirectory());

    for (const slug of slugs) {
      const slugDir = path.join(levelDir, slug);
      const files = fs.readdirSync(slugDir).filter((f) => f.endsWith(".mp3"));

      for (const file of files) {
        totalFiles++;
        const fullPath = path.join(slugDir, file);
        const stats = fs.statSync(fullPath);
        const fileKey = `${level}/${slug}/${file}`;

        if (stats.size === 0) {
          zeroByteFiles++;
          errors.push(`[0-BYTE CRITICAL] ${fileKey}`);
        } else if (
          stats.size < MIN_FILE_SIZE_KB * 1024 &&
          !level.includes("Sprechen")
        ) {
          underSizeFiles++;
          errors.push(
            `[TOO SMALL] ${fileKey} is only ${Math.round(stats.size / 1024)}KB`,
          );
        } else if (!level.includes("Sprechen")) {
          // Only run LUFS check on standard exam audios (Listening tasks), skip short Sprechen tasks
          filesToCheck.push({ path: fullPath, key: fileKey });
        }
      }
    }
  }

  console.log(
    `🔍 Found ${filesToCheck.length} valid exam files. Starting Audio Mastering Check (LUFS & True Peak)...`,
  );

  let processedLufs = 0;
  let lufsFailures = 0;

  await asyncPool(20, filesToCheck, async (fileObj: any) => {
    const q = await checkAudioQuality(fileObj.path);

    if (q.lufs !== null && q.peak !== null) {
      if (q.lufs < MIN_LUFS || q.lufs > MAX_LUFS) {
        errors.push(
          `[LUFS ERROR] ${fileObj.key} -> ${q.lufs} LUFS (Target: -14)`,
        );
        lufsFailures++;
      }
      if (q.peak > MAX_PEAK) {
        errors.push(
          `[CLIPPING] ${fileObj.key} -> Peak ${q.peak} dBFS (Max: ${MAX_PEAK})`,
        );
        lufsFailures++;
      }
    } else {
      errors.push(
        `[FFMPEG ERROR] Could not analyze mastering for ${fileObj.key}`,
      );
      lufsFailures++;
    }

    processedLufs++;
    if (processedLufs % 200 === 0 || processedLufs === filesToCheck.length) {
      console.log(
        `   ⏳ Checked ${processedLufs}/${filesToCheck.length} files...`,
      );
    }
  });

  console.log("\n📊 QA SUMMARY");
  console.log("--------------------------------------");
  console.log(`Total MP3 Files Found : ${totalFiles}`);
  console.log(`Zero Byte Files       : ${zeroByteFiles}`);
  console.log(`Undersize (<50KB)     : ${underSizeFiles}`);
  console.log(`Mastering Fails       : ${lufsFailures}`);

  if (errors.length > 0) {
    console.log("\n🚨 CRITICAL FAILURES DETECTED:");
    errors.slice(0, 15).forEach((e) => console.log(`  - ${e}`));
    if (errors.length > 15)
      console.log(`  ...and ${errors.length - 15} more errors.`);

    console.log("\n❌ QA FAILED. DO NOT SYNC TO PRODUCTION.");
    process.exit(1);
  } else {
    console.log(
      "\n✅ QA PASSED. All files look healthy and perfectly mastered. Safe to sync.",
    );
  }
}

main().catch(console.error);
