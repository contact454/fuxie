import { Hono } from 'hono'

export const generateRoutes = new Hono()

import { addContentJob } from '../lib/queue/queues.js'

generateRoutes.post('/exercises', async (c) => {
    // TODO: Generate exercises with Gemini
    return c.json({ success: true, data: { message: 'Exercise generation — Coming soon!' } })
})

generateRoutes.post('/async', async (c) => {
    try {
        const body = await c.req.json()
        const { topic, level, type } = body
        
        if (!topic || !level || !type) {
            return c.json({ success: false, error: 'Missing topic, level or type' }, 400)
        }

        const job = await addContentJob(`generate-${type}`, body)
        
        return c.json({
            success: true,
            data: {
                message: 'Job enqueued successfully',
                jobId: job.id,
            }
        })
    } catch (err) {
        console.error('[Generate] Queue error:', err)
        return c.json({ success: false, error: 'Failed to enqueue job' }, 500)
    }
})

generateRoutes.post('/vocabulary-context', async (c) => {
    // TODO: Generate example sentences for vocabulary
    return c.json({ success: true, data: { message: 'Vocabulary context — Coming soon!' } })
})

generateRoutes.post('/exam-task', async (c) => {
    // TODO: Generate exam-format tasks
    return c.json({ success: true, data: { message: 'Exam task generation — Coming soon!' } })
})
