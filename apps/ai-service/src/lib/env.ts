import { getGeminiApiKeys } from '@fuxie/shared/env'

type EnvSource = Record<string, string | undefined>

export function getOpenRouterApiKey(source: EnvSource = process.env): string {
    const apiKey = source.OPENROUTER_API_KEY?.trim()
    if (!apiKey) {
        throw new Error('[Fuxie/AI Service] Missing required environment variable: OPENROUTER_API_KEY')
    }
    return apiKey
}

export function getGeminiLiveApiKey(source: EnvSource = process.env): string {
    const apiKey = getGeminiApiKeys(source)[0]
    if (!apiKey) {
        throw new Error('[Fuxie/AI Service] Gemini Live requires GEMINI_API_KEY or GOOGLE_AI_API_KEY')
    }
    return apiKey
}

/**
 * Text chat/grading/generation in ai-service is OpenRouter-backed.
 * Gemini Live is a separate direct-Google websocket path and validates lazily
 * when a live connection is requested, so deployments that do not expose Live
 * are not forced to configure a Gemini credential.
 */
export function validateAiServiceEnv(source: EnvSource = process.env): void {
    getOpenRouterApiKey(source)
}
