import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai'

// ─── Lazy-init Gemini Client ─────────────────────────
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable is not set')
        }
        genAI = new GoogleGenerativeAI(API_KEY)
    }
    return genAI
}

// ─── 2-Tier Model Selection ─────────────────────────
// A1-B1: Flash-Lite (fast, cheap, sufficient for simple texts)
// B2-C2: Flash (more accurate for complex argumentation)
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
