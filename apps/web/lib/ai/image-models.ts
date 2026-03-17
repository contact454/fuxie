/**
 * Fuxie Image Generation — Tiered Model Strategy with Fallback
 *
 * Models updated: March 2026
 * TIER_VOCAB:   Fast, high-volume — for bulk vocabulary flashcard images
 * TIER_PREMIUM: Highest quality — for mascot, article covers, marketing
 * TIER_BALANCED: Mid quality — for exam/exercise UI assets
 */
import { GoogleGenAI, Modality } from '@google/genai'

// ──── Model Definitions ────

export interface ImageModel {
    id: string
    codename: string
    quality: 1 | 2 | 3 | 4 | 5
    maxInputTokens: number
    maxOutputTokens: number
    description: string
}

export const MODELS: Record<string, ImageModel> = {
    NANO_BANANA_2: {
        id: 'gemini-3.1-flash-image-preview',
        codename: 'Nano Banana 2',
        quality: 4,
        maxInputTokens: 131072,
        maxOutputTokens: 32768,
        description: 'Fast + high quality. Best for bulk vocab and UI assets. (Feb 2026)',
    },
    NANO_BANANA_PRO: {
        id: 'gemini-3-pro-image-preview',
        codename: 'Nano Banana Pro',
        quality: 5,
        maxInputTokens: 131072,
        maxOutputTokens: 32768,
        description: 'Highest quality. Best for mascot, article covers, marketing. (2025)',
    },
    NANO_BANANA: {
        id: 'gemini-2.5-flash-image',
        codename: 'Nano Banana',
        quality: 3,
        maxInputTokens: 32768,
        maxOutputTokens: 32768,
        description: 'Stable GA. Good fallback for vocabulary images. (Oct 2025)',
    },
    IMAGEN_4_FAST: {
        id: 'imagen-4.0-fast-generate-001',
        codename: 'Imagen 4 Fast',
        quality: 3,
        maxInputTokens: 480,
        maxOutputTokens: 0,
        description: 'Ultra-fast text-to-image. Near real-time. (May 2025)',
    },
} as const

// ──── Tier Definitions (Model Fallback Chains) ────

export type TierName = 'TIER_VOCAB' | 'TIER_PREMIUM' | 'TIER_BALANCED'

/**
 * TIER_VOCAB: Vocabulary flashcard images — prioritize speed and volume
 * Fallback: Nano Banana 2 → Nano Banana
 */
export const TIER_VOCAB: ImageModel[] = [
    MODELS.NANO_BANANA_2!,
    MODELS.NANO_BANANA!,
]

/**
 * TIER_PREMIUM: Mascot, article covers, marketing — prioritize quality
 * Fallback: Nano Banana Pro → Nano Banana 2 → Nano Banana
 */
export const TIER_PREMIUM: ImageModel[] = [
    MODELS.NANO_BANANA_PRO!,
    MODELS.NANO_BANANA_2!,
    MODELS.NANO_BANANA!,
]

/**
 * TIER_BALANCED: Exercise illustrations, UI assets — balanced quality/speed
 * Fallback: Nano Banana 2 → Nano Banana
 */
export const TIER_BALANCED: ImageModel[] = [
    MODELS.NANO_BANANA_2!,
    MODELS.NANO_BANANA!,
]

// Lookup helper
export const TIERS: Record<TierName, ImageModel[]> = {
    TIER_VOCAB,
    TIER_PREMIUM,
    TIER_BALANCED,
}

// ──── Image Generation with Fallback ────

export interface GenerateImageOptions {
    prompt: string
    tier: ImageModel[]
    apiKey: string
    maxRetries?: number
    retryDelayMs?: number
}

export interface GenerateImageResult {
    imageBuffer: Buffer
    modelUsed: string
    modelCodename: string
}

/**
 * Generate an image using the specified tier's fallback chain.
 * Tries each model in order; on rate limit/error, falls back to the next.
 */
export async function generateImageWithFallback(
    options: GenerateImageOptions
): Promise<GenerateImageResult | null> {
    const { prompt, tier, apiKey, maxRetries = 2, retryDelayMs = 5000 } = options
    const genai = new GoogleGenAI({ apiKey })

    for (const model of tier) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await genai.models.generateContent({
                    model: model.id,
                    contents: prompt,
                    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
                })

                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData?.mimeType?.startsWith('image/')) {
                        return {
                            imageBuffer: Buffer.from(part.inlineData.data!, 'base64'),
                            modelUsed: model.id,
                            modelCodename: model.codename,
                        }
                    }
                }

                // No image in response — retry with same model
                console.warn(`[${model.codename}] No image returned, attempt ${attempt + 1}/${maxRetries + 1}`)
            } catch (error: any) {
                const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')
                const isUnavailable = error.message?.includes('503') || error.message?.includes('UNAVAILABLE')

                if (isRateLimit) {
                    console.warn(`[${model.codename}] Rate limited — falling back to next model`)
                    break // Skip to next model in tier
                }

                if (isUnavailable && attempt < maxRetries) {
                    console.warn(`[${model.codename}] Unavailable, retrying in ${retryDelayMs / 1000}s...`)
                    await new Promise(r => setTimeout(r, retryDelayMs))
                    continue
                }

                if (error.message?.includes('404')) {
                    console.warn(`[${model.codename}] Model not found — skipping`)
                    break // Skip to next model
                }

                console.error(`[${model.codename}] Error: ${error.message?.slice(0, 100)}`)
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, retryDelayMs))
                }
            }
        }
    }

    return null // All models exhausted
}

// ──── Helper: Get tier by name ────

export function getTierByName(name: TierName): ImageModel[] {
    return TIERS[name] || TIER_VOCAB
}

// ──── Helper: List available models ────

export function listModels(): void {
    console.log('\n🦊 Fuxie Image Generation Models\n')
    console.log('Model ID'.padEnd(45) + '| Codename'.padEnd(20) + '| Quality')
    console.log('-'.repeat(75))
    for (const [key, model] of Object.entries(MODELS)) {
        console.log(
            model.id.padEnd(45) +
            '| ' + model.codename.padEnd(18) +
            '| ' + '⭐'.repeat(model.quality)
        )
    }
    console.log('\n📋 Tiers:')
    console.log('  TIER_VOCAB:    ' + TIER_VOCAB.map(m => m.codename).join(' → '))
    console.log('  TIER_PREMIUM:  ' + TIER_PREMIUM.map(m => m.codename).join(' → '))
    console.log('  TIER_BALANCED: ' + TIER_BALANCED.map(m => m.codename).join(' → '))
}
