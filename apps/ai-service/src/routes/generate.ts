import { Hono, type Context } from 'hono'
import { ZodError } from 'zod'
import {
    generateExamTask,
    generateExercises,
    generateVocabularyContext,
    parseExamTaskRequest,
    parseExercisesRequest,
    parseVocabularyContextRequest,
    type GenerateType,
} from '../lib/content-generation.js'
import { addContentJob, getContentJobStatus, listDeadLetterJobs } from '../lib/queue/queues.js'

export const generateRoutes = new Hono()

generateRoutes.post('/exercises', async (c) => {
    try {
        const body = await c.req.json()
        const data = await generateExercises(parseExercisesRequest(body))
        return c.json({ success: true, data })
    } catch (err) {
        return handleGenerateError(c, err, 'Exercise generation failed')
    }
})

generateRoutes.post('/vocabulary-context', async (c) => {
    try {
        const body = await c.req.json()
        const data = await generateVocabularyContext(parseVocabularyContextRequest(body))
        return c.json({ success: true, data })
    } catch (err) {
        return handleGenerateError(c, err, 'Vocabulary context generation failed')
    }
})

generateRoutes.post('/exam-task', async (c) => {
    try {
        const body = await c.req.json()
        const data = await generateExamTask(parseExamTaskRequest(body))
        return c.json({ success: true, data })
    } catch (err) {
        return handleGenerateError(c, err, 'Exam task generation failed')
    }
})

generateRoutes.post('/async', async (c) => {
    try {
        const body = await c.req.json()
        const type = normalizeGenerateType(body?.type)
        if (!type) {
            return c.json(
                {
                    success: false,
                    error: 'Unsupported type. Use "exercises", "vocabulary-context", or "exam-task".',
                },
                400,
            )
        }

        // Validate before enqueueing so the queue only receives executable jobs.
        switch (type) {
            case 'exercises':
                parseExercisesRequest(body)
                break
            case 'vocabulary-context':
                parseVocabularyContextRequest(body)
                break
            case 'exam-task':
                parseExamTaskRequest(body)
                break
        }

        const idempotencyKey = typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : undefined
        const job = await addContentJob(type, body, { idempotencyKey })

        return c.json({
            success: true,
            data: {
                message: 'Job enqueued successfully',
                jobId: job.id,
                type,
            },
        })
    } catch (err) {
        return handleGenerateError(c, err, 'Failed to enqueue generation job')
    }
})

generateRoutes.get('/jobs/:jobId', async (c) => {
    try {
        const jobId = c.req.param('jobId')
        const job = await getContentJobStatus(jobId)

        if (!job) {
            return c.json({ success: false, error: 'Job not found' }, 404)
        }

        return c.json({
            success: true,
            data: job,
        })
    } catch (err) {
        return handleGenerateError(c, err, 'Failed to fetch job status')
    }
})

generateRoutes.get('/dead-letter', async (c) => {
    try {
        const requestedLimit = Number(c.req.query('limit') || 20)
        const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(100, requestedLimit)) : 20
        const jobs = await listDeadLetterJobs('content', limit)

        return c.json({
            success: true,
            data: jobs,
        })
    } catch (err) {
        return handleGenerateError(c, err, 'Failed to fetch dead-letter jobs')
    }
})

function normalizeGenerateType(type: unknown): GenerateType | null {
    if (type === 'exercises' || type === 'vocabulary-context' || type === 'exam-task') {
        return type
    }

    return null
}

function handleGenerateError(c: Context, err: unknown, fallbackMessage: string) {
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

    console.error('[Generate] Error:', err)
    const message = err instanceof Error ? err.message : fallbackMessage
    const status = message.includes('queue is disabled') ? 503 : 500
    return c.json({ success: false, error: { code: 'GENERATION_ERROR', message } }, status)
}
