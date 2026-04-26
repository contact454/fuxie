import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai'
import { getGeminiApiKeys } from '@fuxie/shared/env'

let genAI: GoogleGenerativeAI | null = null

export function getGeminiApiKey(): string {
    const apiKey = getGeminiApiKeys(process.env)[0] ?? ''
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable is not set')
    }

    return apiKey
}

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(getGeminiApiKey())
    }

    return genAI
}

// A1-B1: Flash-Lite for cheaper, simpler prompts.
// B2-C2: Flash for stronger reasoning on complex tasks.
const BASIC_LEVELS = new Set(['A1', 'A2', 'B1'])

export function getModelForLevel(level: string): string {
    return BASIC_LEVELS.has(level)
        ? 'gemini-3.1-flash-lite-preview'
        : 'gemini-3-flash-preview'
}

export function getModel(modelName?: string): GenerativeModel {
    const name = modelName || 'gemini-3-flash-preview'
    return getGenAI().getGenerativeModel({ model: name })
}

export function getChatModel(level: string): GenerativeModel {
    const name = getModelForLevel(level)
    return getGenAI().getGenerativeModel({ model: name })
}
