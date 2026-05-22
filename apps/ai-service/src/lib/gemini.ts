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

export interface GenerativeModel {
    generateContent(prompt: string | any[]): Promise<any>
    startChat(config: any): any
}

// A1-B1: Lighter free model for simpler prompts.
// B2-C2: Strongest free model for complex tasks.
const BASIC_LEVELS = new Set(['A1', 'A2', 'B1'])

export function getModelForLevel(level: string): string {
    return BASIC_LEVELS.has(level)
        ? 'google/gemma-4-31b-it:free'
        : 'meta-llama/llama-3.3-70b-instruct:free'
}

export function getModel(modelName?: string): GenerativeModel {
    const name = modelName || 'meta-llama/llama-3.3-70b-instruct:free'
    return createWrapper(name)
}

export function getChatModel(level: string): GenerativeModel {
    const name = getModelForLevel(level)
    return createWrapper(name)
}

function createWrapper(modelName: string): GenerativeModel {
    const ai = getOpenAI()

    return {
        generateContent: async (prompt: string | any[]) => {
            let messages: any[] = []

            if (typeof prompt === 'string') {
                messages = [{ role: 'user', content: prompt }]
            } else if (Array.isArray(prompt)) {
                const contentParts = prompt.map((part) => {
                    if (typeof part === 'string') {
                        return { type: 'text', text: part }
                    } else if (part.inlineData) {
                        return {
                            type: 'image_url',
                            image_url: {
                                url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                            },
                        }
                    }
                    return null
                }).filter(Boolean)
                messages = [{ role: 'user', content: contentParts }]
            }

            const response = await ai.chat.completions.create({
                model: modelName,
                messages: messages,
                max_tokens: 2000,
            })

            const content = response.choices[0]?.message?.content || ''
            return {
                response: {
                    text: () => content,
                },
            }
        },

        startChat: (config: any) => {
            const systemInstruction = config.systemInstruction || ''
            const history = config.history || []

            return {
                sendMessageStream: async (message: string) => {
                    const messages: any[] = []
                    if (systemInstruction) {
                        messages.push({ role: 'system', content: systemInstruction })
                    }

                    for (const h of history) {
                        const role = h.role === 'model' ? 'assistant' : 'user'
                        const content = h.parts?.[0]?.text || ''
                        messages.push({ role, content })
                    }

                    messages.push({ role: 'user', content: message })

                    const stream = await ai.chat.completions.create({
                        model: modelName,
                        messages: messages,
                        stream: true,
                        max_tokens: 2000,
                    })

                    return {
                        stream: (async function* () {
                            for await (const chunk of stream) {
                                const delta = chunk.choices[0]?.delta?.content || ''
                                yield { text: () => delta }
                            }
                        })(),
                    }
                },
            }
        },
    }
}
