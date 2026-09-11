import { describe, expect, it } from 'vitest'
import { getGeminiLiveApiKey, getOpenRouterApiKey, validateAiServiceEnv } from './env.js'

describe('AI service provider credential contract', () => {
    it('accepts OpenRouter-only configuration for text runtime startup', () => {
        const env = { OPENROUTER_API_KEY: 'openrouter-test-key' }

        expect(() => validateAiServiceEnv(env)).not.toThrow()
        expect(getOpenRouterApiKey(env)).toBe('openrouter-test-key')
        expect(() => getGeminiLiveApiKey(env)).toThrow(/Gemini Live requires/)
    })

    it('rejects Gemini-only configuration for the OpenRouter text runtime', () => {
        const env = { GEMINI_API_KEY: 'gemini-test-key' }

        expect(() => validateAiServiceEnv(env)).toThrow(/OPENROUTER_API_KEY/)
        expect(() => getOpenRouterApiKey(env)).toThrow(/OPENROUTER_API_KEY/)
        expect(getGeminiLiveApiKey(env)).toBe('gemini-test-key')
    })

    it('rejects configuration with no provider credential', () => {
        expect(() => validateAiServiceEnv({})).toThrow(/OPENROUTER_API_KEY/)
        expect(() => getGeminiLiveApiKey({})).toThrow(/GEMINI_API_KEY or GOOGLE_AI_API_KEY/)
    })

    it('keeps OpenRouter and direct Gemini credentials separate when both are configured', () => {
        const env = {
            OPENROUTER_API_KEY: 'openrouter-test-key',
            GEMINI_API_KEY: 'gemini-test-key',
        }

        expect(() => validateAiServiceEnv(env)).not.toThrow()
        expect(getOpenRouterApiKey(env)).toBe('openrouter-test-key')
        expect(getGeminiLiveApiKey(env)).toBe('gemini-test-key')
    })

    it('supports the documented GOOGLE_AI_API_KEY alias for direct Gemini Live only', () => {
        const env = {
            OPENROUTER_API_KEY: 'openrouter-test-key',
            GOOGLE_AI_API_KEY: 'google-ai-test-key',
        }

        expect(getOpenRouterApiKey(env)).toBe('openrouter-test-key')
        expect(getGeminiLiveApiKey(env)).toBe('google-ai-test-key')
    })
})
