import OpenAI from 'openai'

let openai: OpenAI | null = null

export function getGeminiApiKey(): string {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || ''
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY or GEMINI_API_KEY environment variable is not set')
    }
    return apiKey
}

function getOpenAI(): OpenAI {
    if (!openai) {
        openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: getGeminiApiKey(),
        })
    }
    return openai
}

export async function generateContentOpenRouter(prompt: string, modelName: string): Promise<string> {
    const ai = getOpenAI()
    
    // Add retry logic for rate limits/failures
    let maxRetries = 2;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
        try {
            const response = await ai.chat.completions.create({
                model: modelName,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 3000,
            })
            return response.choices[0]?.message?.content || ''
        } catch (err: any) {
            const errStatus = err?.status || err?.response?.status;
            if (errStatus === 429 || String(err).includes('429')) {
                attempt++;
                await new Promise(r => setTimeout(r, 1000));
                continue;
            }
            throw err;
        }
    }
    throw new Error('OpenRouter API rate limit exceeded after retries');
}

const BASIC_LEVELS = new Set(['A1', 'A2', 'B1'])

export function getModelForLevel(level: string): string {
    return BASIC_LEVELS.has(level)
        ? 'google/gemma-4-31b-it:free'
        : 'meta-llama/llama-3.3-70b-instruct:free'
}
