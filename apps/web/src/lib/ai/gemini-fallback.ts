import { GoogleGenerativeAI } from '@google/generative-ai'

const defaultKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
const fallbackKey = process.env.GEMINI_API_KEY_FALLBACK || ''

const keys = [defaultKey, fallbackKey].filter(k => k.trim().length > 0)
let currentKeyIndex = 0

export function getGeminiKey(): string {
    if (keys.length === 0) throw new Error('GEMINI_API_KEY is not set')
    return keys[currentKeyIndex] ?? keys[0] ?? ''
}

export function getGeminiClient(): GoogleGenerativeAI {
    return new GoogleGenerativeAI(getGeminiKey())
}

export function rotateGeminiKey() {
    if (keys.length > 1) {
        const oldIndex = currentKeyIndex
        currentKeyIndex = (currentKeyIndex + 1) % keys.length
        console.log(`[Gemini Fallback] Rate limit hit. Rotated API Key from index ${oldIndex} to ${currentKeyIndex}`)
    }
}

/**
 * Wraps any Gemini API call with a retry mechanism that rotates the API key
 * if a 429 Too Many Requests or quota error is encountered.
 */
export async function withGeminiFallback<T>(
    operation: (client: GoogleGenerativeAI, key: string) => Promise<T>,
    maxRetries = 2
): Promise<T> {
    let attempt = 0
    let lastError: unknown

    while (attempt <= maxRetries) {
        try {
            const client = getGeminiClient()
            return await operation(client, getGeminiKey())
        } catch (error: unknown) {
            lastError = error
            const errMsg = error instanceof Error ? error.message : String(error)
            const errStatus = (error as { status?: number })?.status
            const isRateLimit = 
                errStatus === 429 || 
                errMsg.includes('429') || 
                errMsg.includes('quota') || 
                errMsg.includes('exhausted')
            if (keys.length > 1) {
                if (errStatus === 403 || errMsg.includes('suspended') || errMsg.includes('PERMISSION_DENIED')) {
                    console.warn(`[Gemini Fallback] Key at index ${currentKeyIndex} is invalid/suspended. Removing it.`);
                    keys.splice(currentKeyIndex, 1);
                    currentKeyIndex = currentKeyIndex % keys.length;
                    attempt++;
                    continue;
                }
                if (isRateLimit) {
                    rotateGeminiKey()
                    attempt++
                    // Small delay before retrying
                    await new Promise(resolve => setTimeout(resolve, 500))
                    continue
                }
            }
            throw error
        }
    }
    throw lastError
}
