import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

type Severity = "error" | "warning";
type Owner =
  | "Content QA / Linguistic Reviewer"
  | "Vietnamese-German Localization Specialist"
  | "Design System Designer";

interface Issue {
  severity: Severity;
  code: string;
  owner: Owner;
  cluster: string;
  file: string;
  line: number;
  message: string;
  recommendation: string;
}

const ROOT = process.cwd();
const DEFAULT_SCOPES = [
  "apps/web/messages",
  "apps/web/src",
  "content",
  "docs/content-quality",
  "docs/design",
  "packages/ui/src/tokens",
];

const REPORT_PATH = path.resolve(
  ROOT,
  getArgValue("--report-path") || path.join("tmp", "copy-style-audit.md"),
);
const JSON_REPORT_PATH = path.resolve(
  ROOT,
  getArgValue("--json-report-path") ||
    path.join("tmp", "copy-style-audit.json"),
);
const SCOPES = getArgValues("--scope");
const ACTIVE_SCOPES = SCOPES.length > 0 ? SCOPES : DEFAULT_SCOPES;
const FIX_MOJIBAKE = process.argv.includes("--fix-mojibake");
const REVIEWED_COPY_REGISTRY_PATH = path.resolve(
  ROOT,
  "docs/content-quality/copy-style-reviewed-files.json",
);

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".json",
  ".md",
  ".scss",
  ".ts",
  ".tsx",
]);
const VI_OR_ACCENTED_CHARS = /[\u00c0-\u1ef9]/;
const EMOJI = /[\u{1f300}-\u{1faff}]/u;
const REVIEWED_COPY_FILES = loadReviewedCopyRegistry();

const MOJIBAKE_PATTERNS: Array<{
  code: string;
  pattern: RegExp;
  message: string;
}> = [
  {
    code: "MOJIBAKE_REPLACEMENT_CHAR",
    pattern: /\uFFFD/g,
    message: "Replacement character found.",
  },
  {
    code: "MOJIBAKE_UTF8_AS_LATIN",
    pattern: /\u00c3/g,
    message: "Likely UTF-8 text decoded as Latin-1 or Windows-1252.",
  },
  {
    code: "MOJIBAKE_STRAY_LATIN_MARKER",
    pattern: /\u00c2(?=[\u0080-\u00bf\u00a0-\u00bf])/g,
    message: "Likely stray Latin-1 marker from broken encoding.",
  },
  {
    code: "MOJIBAKE_PUNCTUATION",
    pattern:
      /\u00e2[\u0080-\u00bf\u20ac\u201c\u201d\u2018\u2019\u2026\u201e\u2122]+/g,
    message: "Likely corrupted punctuation.",
  },
  {
    code: "MOJIBAKE_EMOJI",
    pattern: /\u00f0\u0178[\u0080-\u00bf]*/g,
    message: "Likely corrupted emoji.",
  },
  {
    code: "MOJIBAKE_VIETNAMESE_ACCENT",
    pattern:
      /(?:\u00e1[\u00ba\u00bb]|\u00c1[\u00ba\u00bb]|\u00c4[\u2018\u2019]|\u00c6[\u00a1-\u00bf]|\u00c5[\u201c\u201d])/g,
    message: "Likely corrupted Vietnamese accent sequence.",
  },
];

function main() {
  const files = collectFiles(ACTIVE_SCOPES);
  const issues: Issue[] = [];

  for (const file of files) {
    scanFile(file, issues);
  }

  scanRequiredMessageText(files, issues);
  writeReports(files, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.length - errors.length;

  console.log(`[copy-style-audit] Scanned ${files.length} files`);
  console.log(
    `[copy-style-audit] ${errors.length} errors, ${warnings} warnings`,
  );
  console.log(
    `[copy-style-audit] Markdown report: ${path.relative(ROOT, REPORT_PATH)}`,
  );
  console.log(
    `[copy-style-audit] JSON report: ${path.relative(ROOT, JSON_REPORT_PATH)}`,
  );

  if (errors.length > 0) {
    process.exit(1);
  }
}

function collectFiles(scopes: string[]): string[] {
  const files = new Set<string>();

  for (const scope of scopes) {
    const fullScope = path.resolve(ROOT, scope);
    if (!fs.existsSync(fullScope)) continue;

    const stat = fs.statSync(fullScope);
    if (stat.isFile()) {
      if (shouldScan(fullScope)) files.add(fullScope);
      continue;
    }

    for (const file of walk(fullScope)) {
      if (shouldScan(file)) files.add(file);
    }
  }

  return [...files].sort((a, b) => a.localeCompare(b));
}

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".turbo"
      ) {
        continue;
      }
      files.push(...walk(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function shouldScan(file: string): boolean {
  return TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function scanFile(file: string, issues: Issue[]) {
  const relativeFile = path.relative(ROOT, file).replace(/\\/g, "/");
  let raw = "";

  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (err) {
    issues.push({
      severity: "error",
      code: "READ_FAILED",
      owner: "Content QA / Linguistic Reviewer",
      cluster: clusterFor(relativeFile),
      file: relativeFile,
      line: 1,
      message: errorMessage(err),
      recommendation: "Confirm the file can be read before release QA.",
    });
    return;
  }

  if (FIX_MOJIBAKE) {
    const repaired = repairMojibake(raw);
    if (repaired !== raw) {
      fs.writeFileSync(file, repaired);
      raw = repaired;
    }
  }

  if (relativeFile.endsWith(".json") && isLearnerFacingJson(relativeFile)) {
    try {
      JSON.parse(raw);
    } catch (err) {
      issues.push({
        severity: "error",
        code: "INVALID_JSON",
        owner: "Content QA / Linguistic Reviewer",
        cluster: clusterFor(relativeFile),
        file: relativeFile,
        line: 1,
        message: errorMessage(err),
        recommendation:
          "Fix JSON syntax before running content or localization QA.",
      });
    }
  }

  scanMojibake(relativeFile, raw, issues);
  scanEmojiInMessages(relativeFile, raw, issues);
  scanHardcodedCopy(relativeFile, raw, issues);
  scanTextVisuals(relativeFile, raw, issues);
}

function scanMojibake(file: string, raw: string, issues: Issue[]) {
  for (const { code, pattern, message } of MOJIBAKE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(raw))) {
      issues.push({
        severity: "error",
        code,
        owner: "Vietnamese-German Localization Specialist",
        cluster: clusterFor(file),
        file,
        line: lineNumber(raw, match.index),
        message,
        recommendation:
          "Restore the source text as valid UTF-8 and rerun copy-style QA.",
      });
    }
  }
}

function repairMojibake(raw: string): string {
  return raw
    .split(/(\r?\n)/)
    .map((part) => {
      if (part === "\n" || part === "\r\n") return part;
      if (!hasMojibake(part)) return part;
      return repairMojibakeLine(part);
    })
    .join("");
}

function repairMojibakeLine(line: string): string {
  let repaired = line;

  for (let index = 0; index < 3; index++) {
    if (!hasMojibake(repaired)) break;
    const next = Buffer.from(repaired, "latin1").toString("utf8");
    if (next === repaired || next.includes("\uFFFD")) break;
    repaired = next;
  }

  return repaired;
}

function hasMojibake(value: string): boolean {
  return MOJIBAKE_PATTERNS.some(({ pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

function scanEmojiInMessages(file: string, raw: string, issues: Issue[]) {
  if (!file.startsWith("apps/web/messages/") || !EMOJI.test(raw)) return;

  const lines = raw.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!EMOJI.test(line)) return;
    issues.push({
      severity: "warning",
      code: "MESSAGE_EMOJI_REVIEW",
      owner: "Vietnamese-German Localization Specialist",
      cluster: clusterFor(file),
      file,
      line: index + 1,
      message: "Emoji appears in localized message copy.",
      recommendation:
        "Keep emoji only when it supports the quest tone and does not reduce exam credibility.",
    });
  });
}

function scanHardcodedCopy(file: string, raw: string, issues: Issue[]) {
  if (!isUiCopySource(file)) {
    return;
  }
  if (isReviewedRouteLocalCopy(file, raw)) {
    return;
  }

  const lines = raw.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!VI_OR_ACCENTED_CHARS.test(line)) return;
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    if (/import\s/.test(line)) return;

    const looksLikeLearnerCopy =
      />[^<{]*[\u00c0-\u1ef9][^<{]*</.test(line) ||
      /["'`][^"'`]*[\u00c0-\u1ef9][^"'`]*["'`]/.test(line);

    if (!looksLikeLearnerCopy) return;

    issues.push({
      severity: "warning",
      code: "HARDCODED_LEARNER_COPY",
      owner: "Vietnamese-German Localization Specialist",
      cluster: clusterFor(file),
      file,
      line: index + 1,
      message: "Accented learner-facing copy appears hardcoded in source.",
      recommendation:
        "Move reusable UI copy to messages or document why the string is route-local.",
    });
  });
}

function isReviewedRouteLocalCopy(file: string, raw: string): boolean {
  const reviewed = REVIEWED_COPY_FILES.get(file);
  if (!reviewed) return false;

  return reviewed.sha256 === sha256(raw);
}

function loadReviewedCopyRegistry(): Map<string, { sha256: string }> {
  if (!fs.existsSync(REVIEWED_COPY_REGISTRY_PATH)) {
    return new Map();
  }

  try {
    const parsed = JSON.parse(
      fs.readFileSync(REVIEWED_COPY_REGISTRY_PATH, "utf8"),
    ) as { files?: Array<{ file?: string; sha256?: string }> };

    return new Map(
      (parsed.files || [])
        .filter(
          (entry): entry is { file: string; sha256: string } =>
            typeof entry.file === "string" && typeof entry.sha256 === "string",
        )
        .map((entry) => [entry.file.replace(/\\/g, "/"), { sha256: entry.sha256 }]),
    );
  } catch {
    return new Map();
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function scanTextVisuals(file: string, raw: string, issues: Issue[]) {
  if (
    !file.startsWith("apps/web/src/") &&
    !file.startsWith("scripts/fixtures/copy-style-negative/")
  ) {
    return;
  }
  if (file === "apps/web/src/app/globals.css") return;

  const lines = raw.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (hasRawTextColor(line)) {
      issues.push({
        severity: "warning",
        code: "RAW_HEX_COLOR",
        owner: "Design System Designer",
        cluster: clusterFor(file),
        file,
        line: index + 1,
        message: "Raw hex color found in app source.",
        recommendation:
          "Prefer semantic text, brand, CEFR, or skill tokens for new UI work.",
      });
    }

    if (
      /text-\[(?:\d+(?:\.\d+)?(?:px|rem|em)|clamp\([^\]]+\)|var\([^\]]+\))\]/.test(
        line,
      ) ||
      /font-size:\s*(?:\d+px|[0-9.]+rem)/.test(line)
    ) {
      issues.push({
        severity: "warning",
        code: "ARBITRARY_TEXT_SIZE",
        owner: "Design System Designer",
        cluster: clusterFor(file),
        file,
        line: index + 1,
        message: "Arbitrary text size found.",
        recommendation:
          "Use the shared typography scale unless the exception is documented.",
      });
    }

    if (hasWideTrackingOnLongCopy(line)) {
      issues.push({
        severity: "warning",
        code: "TRACKING_ON_LONG_COPY",
        owner: "Design System Designer",
        cluster: clusterFor(file),
        file,
        line: index + 1,
        message: "Wide letter spacing appears on a long line.",
        recommendation:
          "Reserve wide tracking for short labels, not Vietnamese or German sentences.",
      });
    }
  });
}

function isUiCopySource(file: string): boolean {
  if (!file.startsWith("apps/web/src/")) return false;
  if (/\.(test|spec)\.[tj]sx?$/.test(file)) return false;
  if (file.includes("/api/")) return false;
  if (file.includes("/lib/")) return false;
  if (file.includes("/data/")) return false;

  return (
    file.endsWith(".tsx") ||
    (file.endsWith(".ts") && file.includes("/components/"))
  );
}

function hasRawTextColor(line: string): boolean {
  if (/text-\[#[0-9a-fA-F]{3,8}\]/.test(line)) return true;
  if (/(?<![-.])color\s*:\s*["']?#[0-9a-fA-F]{3,8}\b/.test(line)) return true;
  if (/--(?:color-)?text-[\w-]+\s*:\s*#[0-9a-fA-F]{3,8}\b/.test(line)) {
    return true;
  }

  return false;
}

function hasWideTrackingOnLongCopy(line: string): boolean {
  if (!/(tracking-wide|tracking-wider|tracking-\[[^\]]+\])/.test(line)) {
    return false;
  }

  const visibleText = [...line.matchAll(/>([^<>{}]+)</g)]
    .map((match) => match[1]?.trim() || "")
    .filter(Boolean)
    .join(" ");

  if (!visibleText) return false;

  return visibleText.length > 48 || /[\u00c0-\u1ef9]/.test(visibleText);
}

function scanRequiredMessageText(files: string[], issues: Issue[]) {
  const messageFiles = files.filter((file) => {
    const relativeFile = path.relative(ROOT, file).replace(/\\/g, "/");
    return (
      relativeFile.startsWith("apps/web/messages/") &&
      relativeFile.endsWith(".json")
    );
  });

  if (messageFiles.length === 0) return;

  const baselineFile = path.resolve(ROOT, "apps/web/messages/en.json");
  if (!fs.existsSync(baselineFile)) return;

  let baselineMessages: Record<string, unknown>;
  try {
    baselineMessages = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
  } catch {
    return;
  }

  const requiredKeys = flattenStringLeaves(baselineMessages);

  for (const file of messageFiles) {
    const relativeFile = path.relative(ROOT, file).replace(/\\/g, "/");
    let raw = "";
    let messages: Record<string, unknown>;

    try {
      raw = fs.readFileSync(file, "utf8");
      messages = JSON.parse(raw);
    } catch {
      continue;
    }

    const flattenedMessages = flattenStringLeaves(messages);

    for (const requiredKey of Object.keys(requiredKeys)) {
      const value = flattenedMessages[requiredKey];
      if (typeof value === "string" && value.trim().length > 0) continue;

      issues.push({
        severity: "error",
        code: "MISSING_REQUIRED_LEARNER_TEXT",
        owner: "Content QA / Linguistic Reviewer",
        cluster: clusterFor(relativeFile),
        file: relativeFile,
        line: lineForJsonLeafKey(raw, requiredKey),
        message: `Required learner-facing message is missing or empty: ${requiredKey}.`,
        recommendation:
          "Fill the localized learner text before release or remove the key from the baseline locale.",
      });
    }
  }
}

function flattenStringLeaves(
  value: unknown,
  prefix = "",
): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value).reduce<Record<string, string>>(
    (flattened, [key, child]) => ({
      ...flattened,
      ...flattenStringLeaves(child, prefix ? `${prefix}.${key}` : key),
    }),
    {},
  );
}

function lineForJsonLeafKey(raw: string, keyPath: string): number {
  const leafKey = keyPath.split(".").at(-1);
  if (!leafKey) return 1;

  const escapedLeafKey = leafKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`"${escapedLeafKey}"\\s*:`).exec(raw);
  return match ? lineNumber(raw, match.index) : 1;
}

function writeReports(files: string[], issues: Issue[]) {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_REPORT_PATH), { recursive: true });

  const bySeverity = countBy(issues, (issue) => issue.severity);
  const byCode = countBy(issues, (issue) => issue.code);
  const byOwner = countBy(issues, (issue) => issue.owner);
  const byCluster = countBy(issues, (issue) => issue.cluster);
  const sampleIssues = issues.slice(0, 250);

  const markdown = [
    "# Copy Style Audit Report",
    "",
    `Scanned files: ${files.length}`,
    `Errors: ${bySeverity.error || 0}`,
    `Warnings: ${bySeverity.warning || 0}`,
    "",
    "## Counts By Cluster",
    "",
    renderTable(["Cluster", "Count"], Object.entries(byCluster)),
    "",
    "## Counts By Owner",
    "",
    renderTable(["Owner", "Count"], Object.entries(byOwner)),
    "",
    "## Counts By Code",
    "",
    renderTable(["Code", "Count"], Object.entries(byCode)),
    "",
    "## Sample Issues",
    "",
    sampleIssues.length > 0
      ? renderTable(
          [
            "Severity",
            "Code",
            "Cluster",
            "Owner",
            "File",
            "Line",
            "Recommendation",
          ],
          sampleIssues.map((issue) => [
            issue.severity,
            issue.code,
            issue.cluster,
            issue.owner,
            issue.file,
            String(issue.line),
            issue.recommendation,
          ]),
        )
      : "No issues found.",
    "",
    issues.length > sampleIssues.length
      ? `Showing ${sampleIssues.length} of ${issues.length} issues.`
      : "",
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_PATH, markdown);
  fs.writeFileSync(
    JSON_REPORT_PATH,
    JSON.stringify(
      {
        scannedFiles: files.length,
        counts: {
          bySeverity,
          byCode,
          byOwner,
          byCluster,
        },
        issues,
      },
      null,
      2,
    ),
  );
}

function isLearnerFacingJson(file: string): boolean {
  return file.startsWith("apps/web/messages/") || file.startsWith("content/");
}

function clusterFor(file: string): string {
  if (file.startsWith("apps/web/messages/")) return "Navigation/Auth";
  if (file.includes("/auth/") || file.includes("/onboarding/")) {
    return "Navigation/Auth";
  }
  if (file.includes("/dashboard/") || file.includes("/course/")) {
    return "Dashboard/Course";
  }
  if (file.includes("/vocabulary/") || file.includes("/grammar/")) {
    return "Vocabulary/Grammar";
  }
  if (
    file.includes("/reading/") ||
    file.includes("/listening/") ||
    file.includes("/writing/") ||
    file.includes("/speaking/")
  ) {
    return "Reading/Listening/Writing/Speaking";
  }
  if (file.includes("/exam") || file.includes("/review")) return "Exam/Review";
  if (file.includes("/admin/") || file.includes("/teacher/")) {
    return "Admin/Teacher";
  }
  if (file.startsWith("content/")) return "Content Library";
  if (file.startsWith("docs/")) return "Standards/Docs";
  if (file.startsWith("packages/ui/")) return "Design Tokens";
  return "Shared UI";
}

function lineNumber(raw: string, index: number): number {
  return raw.slice(0, index).split(/\r?\n/).length;
}

function countBy<T extends string>(
  items: Issue[],
  key: (item: Issue) => T,
): Record<T, number> {
  return items.reduce(
    (counts, item) => {
      const value = key(item);
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    },
    {} as Record<T, number>,
  );
}

function renderTable(
  headers: string[],
  rows: Array<Array<string> | [string, number]>,
): string {
  const normalizedRows = rows.map((row) =>
    row.map((cell) => escapeCell(String(cell))),
  );
  const escapedHeaders = headers.map(escapeCell);
  return [
    `| ${escapedHeaders.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...normalizedRows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function getArgValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) return null;
  return process.argv[index + 1] || null;
}

function getArgValues(name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index++) {
    if (process.argv[index] === name && process.argv[index + 1]) {
      values.push(process.argv[index + 1]);
    }
  }
  return values;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

main();
