import { GoogleGenerativeAI } from '@google/generative-ai'
import { getGeminiApiKeys } from '@fuxie/shared/env'

let currentKeyIndex = 0
/** Keys that have been detected as invalid/suspended during this runtime */
const evictedKeys = new Set<string>()

function getActiveKeys(): string[] {
    return getGeminiApiKeys(process.env)
}

export function getGeminiKey(): string {
    const keys = getActiveKeys()
    // Find the next non-evicted key
    const availableKeys = keys.filter(k => !evictedKeys.has(k))
    if (availableKeys.length === 0) throw new Error('GEMINI_API_KEY is not set or all keys evicted')
    return availableKeys[currentKeyIndex % availableKeys.length] ?? availableKeys[0] ?? ''
}

export function getGeminiClient(): GoogleGenerativeAI {
    return new GoogleGenerativeAI(getGeminiKey())
}

export function rotateGeminiKey() {
    const keys = getActiveKeys()
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
            const keys = getActiveKeys()
            if (keys.length > 1) {
                if (errStatus === 403 || errMsg.includes('suspended') || errMsg.includes('PERMISSION_DENIED')) {
                    const evictedKey = getGeminiKey();
                    evictedKeys.add(evictedKey);
                    console.warn(`[Gemini Fallback] Key ${evictedKey.substring(0,4)}*** is invalid/suspended. Evicted (${evictedKeys.size}/${keys.length}).`);
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
