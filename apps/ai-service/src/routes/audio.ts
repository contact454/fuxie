import { Hono, type Context } from 'hono'
import { ZodError, z } from 'zod'
import { evaluatePronunciation, synthesizeSpeech } from '../lib/audio.js'

export const audioRoutes = new Hono()

const ttsSchema = z.object({
    text: z.string().trim().min(1).max(500),
    lang: z.string().trim().default('de'),
    speed: z.number().min(0.5).max(2).default(1),
})

const ttsBatchSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string().trim().min(1).max(120).optional(),
                text: z.string().trim().min(1).max(500),
                lang: z.string().trim().default('de'),
                speed: z.number().min(0.5).max(2).default(1),
            }),
        )
        .min(1)
        .max(10),
})

const pronunciationJsonSchema = z.object({
    audioBase64: z.string().min(1),
    mimeType: z.string().default('audio/webm'),
    referenceText: z.string().trim().min(1),
    level: z.string().default('A1'),
    exerciseType: z.string().default('nachsprechen'),
    uiLanguage: z.string().default('vi'),
})

audioRoutes.post('/tts', async (c) => {
    try {
        const body = await c.req.json()
        const input = ttsSchema.parse(body)
        const data = await synthesizeSpeech(input)
        return c.json({ success: true, data })
    } catch (err) {
        return handleAudioError(c, err, 'TTS generation failed')
    }
})

audioRoutes.post('/tts/batch', async (c) => {
    try {
        const body = await c.req.json()
        const input = ttsBatchSchema.parse(body)

        const items = await Promise.all(
            input.items.map(async (item, index) => ({
                id: item.id ?? `item-${index + 1}`,
                ...(await synthesizeSpeech(item)),
            })),
        )

        return c.json({
            success: true,
            data: {
                count: items.length,
                items,
            },
        })
    } catch (err) {
        return handleAudioError(c, err, 'Batch TTS failed')
    }
})

audioRoutes.post('/pronunciation', async (c) => {
    try {
        const contentType = c.req.header('content-type') ?? ''

        const input = contentType.includes('multipart/form-data')
            ? await parseMultipartPronunciationRequest(c)
            : pronunciationJsonSchema.parse(await c.req.json())

        const data = await evaluatePronunciation(input)
        return c.json({ success: true, data })
    } catch (err) {
        return handleAudioError(c, err, 'Pronunciation grading failed')
    }
})

async function parseMultipartPronunciationRequest(c: Context) {
    const body = await c.req.parseBody()
    const audio = body.audio
    const referenceText = typeof body.referenceText === 'string' ? body.referenceText : ''

    if (!(audio instanceof File)) {
        throw new Error('audio file is required')
    }

    const arrayBuffer = await audio.arrayBuffer()
    return pronunciationJsonSchema.parse({
        audioBase64: Buffer.from(arrayBuffer).toString('base64'),
        mimeType: audio.type || 'audio/webm',
        referenceText,
        level: typeof body.level === 'string' ? body.level : 'A1',
        exerciseType: typeof body.exerciseType === 'string' ? body.exerciseType : 'nachsprechen',
        uiLanguage: typeof body.uiLanguage === 'string' ? body.uiLanguage : 'vi',
    })
}

function handleAudioError(c: Context, err: unknown, fallbackMessage: string) {
    if (err instanceof ZodError) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
                },
            },
            400,
        )
    }

    console.error('[Audio] Error:', err)
    const message = err instanceof Error ? err.message : fallbackMessage
    const status = message.includes('required') || message.includes('between') ? 400 : 500
    return c.json({ success: false, error: { code: 'AUDIO_ERROR', message } }, status)
}
