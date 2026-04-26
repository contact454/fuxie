import { Hono, type Context } from 'hono'
import { ZodError } from 'zod'
import {
    gradeGrammarSentence,
    gradeSpeakingAudio,
    gradeWritingSubmission,
    parseGrammarGradeRequest,
    parseSpeakingGradeRequest,
    parseWritingGradeRequest,
    type GradeJobType,
} from '../lib/grading.js'
import {
    addGradingJob,
    getGradingJobStatus,
    listDeadLetterJobs,
} from '../lib/queue/queues.js'

export const gradeRoutes = new Hono()

gradeRoutes.post('/writing', async (c) => {
    try {
        const body = await c.req.json()
        const data = await gradeWritingSubmission(parseWritingGradeRequest(body))
        return c.json({ success: true, data })
    } catch (err) {
        return handleGradeError(c, err, 'Writing grading failed')
    }
})

gradeRoutes.post('/speaking', async (c) => {
    try {
        const data = await parseSpeakingRequest(c)
        const result = await gradeSpeakingAudio(data)
        return c.json({ success: true, data: result })
    } catch (err) {
        return handleGradeError(c, err, 'Speaking grading failed')
    }
})

gradeRoutes.post('/grammar', async (c) => {
    try {
        const body = await c.req.json()
        const data = await gradeGrammarSentence(parseGrammarGradeRequest(body))
        return c.json({ success: true, data })
    } catch (err) {
        return handleGradeError(c, err, 'Grammar analysis failed')
    }
})

gradeRoutes.post('/async', async (c) => {
    try {
        const body = await c.req.json()
        const type = normalizeGradeType(body?.type)
        if (!type) {
            return c.json(
                {
                    success: false,
                    error: 'Unsupported type. Use "writing", "speaking", or "grammar".',
                },
                400,
            )
        }

        const payload = validateAsyncPayload(type, body)
        const idempotencyKey = typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : undefined
        const job = await addGradingJob(type, payload, { idempotencyKey })

        return c.json({
            success: true,
            data: {
                message: 'Job enqueued successfully',
                jobId: job.id,
                type,
            },
        })
    } catch (err) {
        return handleGradeError(c, err, 'Failed to enqueue grading job')
    }
})

gradeRoutes.get('/jobs/:jobId', async (c) => {
    try {
        const job = await getGradingJobStatus(c.req.param('jobId'))
        if (!job) {
            return c.json({ success: false, error: 'Job not found' }, 404)
        }

        return c.json({ success: true, data: job })
    } catch (err) {
        return handleGradeError(c, err, 'Failed to fetch grading job status')
    }
})

gradeRoutes.get('/dead-letter', async (c) => {
    try {
        const requestedLimit = Number(c.req.query('limit') || 20)
        const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(100, requestedLimit)) : 20
        const jobs = await listDeadLetterJobs('grading', limit)
        return c.json({ success: true, data: jobs })
    } catch (err) {
        return handleGradeError(c, err, 'Failed to fetch dead-letter jobs')
    }
})

function normalizeGradeType(type: unknown): GradeJobType | null {
    if (type === 'writing' || type === 'speaking' || type === 'grammar') {
        return type
    }

    return null
}

function validateAsyncPayload(type: GradeJobType, body: Record<string, unknown>) {
    switch (type) {
        case 'writing':
            return parseWritingGradeRequest(body)
        case 'grammar':
            return parseGrammarGradeRequest(body)
        case 'speaking':
            return parseSpeakingGradeRequest(body)
    }
}

async function parseSpeakingRequest(c: Context) {
    const contentType = c.req.header('content-type') || ''
    if (contentType.includes('application/json')) {
        return parseSpeakingGradeRequest(await c.req.json())
    }

    const body = await c.req.parseBody()
    const audioFile = body.audio
    if (!audioFile || !(audioFile instanceof File)) {
        throw new Error('audio file is required')
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    return parseSpeakingGradeRequest({
        cefrLevel: typeof body.cefrLevel === 'string' ? body.cefrLevel : 'A1',
        expectedText: typeof body.expectedText === 'string' ? body.expectedText : undefined,
        exerciseType: typeof body.exerciseType === 'string' ? body.exerciseType : 'free-speech',
        audioBase64: Buffer.from(arrayBuffer).toString('base64'),
        mimeType: audioFile.type || 'audio/webm',
    })
}

function handleGradeError(c: Context, err: unknown, fallbackMessage: string) {
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

    console.error('[Grade] Error:', err)
    const message = err instanceof Error ? err.message : fallbackMessage
    const status = message.includes('queue is disabled')
        ? 503
        : message.includes('audio file is required')
            ? 400
            : 500

    return c.json({ success: false, error: { code: 'GRADE_ERROR', message } }, status)
}
