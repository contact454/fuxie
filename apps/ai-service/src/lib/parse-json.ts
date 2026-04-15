/**
 * Robust JSON parser for Gemini API responses.
 *
 * Gemini sometimes wraps JSON in markdown fences, adds trailing commas,
 * or truncates output. This parser handles all those cases.
 *
 * Shared utility — identical logic exists in the web app at
 * @fuxie/web/lib/ai/parse-json.ts. Keep them in sync or consider
 * moving to a shared package in the future.
 */

export function parseGeminiJson<T = Record<string, unknown>>(raw: string): T {
    // Step 1: Strip markdown code fences
    let cleaned = raw
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim()

    // Step 2: Try direct parse
    try {
        return JSON.parse(cleaned) as T
    } catch {
        // continue to fallback
    }

    // Step 3: Extract JSON object via regex
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        throw new Error(`[parseGeminiJson] No JSON object found in: ${cleaned.substring(0, 150)}`)
    }

    let candidate = jsonMatch[0]

    // Step 4: Fix common issues — trailing commas before } or ]
    candidate = candidate.replace(/,\s*([}\]])/g, '$1')

    try {
        return JSON.parse(candidate) as T
    } catch {
        // Step 5: Check for truncation (unmatched braces)
        const openBraces = (candidate.match(/\{/g) ?? []).length
        const closeBraces = (candidate.match(/\}/g) ?? []).length

        if (openBraces > closeBraces) {
            const closers = '}'.repeat(openBraces - closeBraces)
            try {
                return JSON.parse(candidate + closers) as T
            } catch {
                // fall through
            }
        }

        throw new Error(
            `[parseGeminiJson] Failed to parse after cleanup: ${candidate.substring(0, 200)}`,
        )
    }
}
