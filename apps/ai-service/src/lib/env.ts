import { getGeminiApiKeys } from '@fuxie/shared/env'

export function validateAiServiceEnv(): void {
    if (getGeminiApiKeys(process.env).length === 0) {
        throw new Error(
            '[Fuxie/AI Service] Missing required environment variables: GEMINI_API_KEY or GOOGLE_AI_API_KEY'
        )
    }
}
