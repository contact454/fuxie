import { Hono } from 'hono'

export const generateRoutes = new Hono()

generateRoutes.post('/exercises', async (c) => {
    // TODO: Generate exercises with Gemini
    return c.json({ success: true, data: { message: 'Exercise generation — Coming soon!' } })
})

generateRoutes.post('/vocabulary-context', async (c) => {
    // TODO: Generate example sentences for vocabulary
    return c.json({ success: true, data: { message: 'Vocabulary context — Coming soon!' } })
})

generateRoutes.post('/exam-task', async (c) => {
    // TODO: Generate exam-format tasks
    return c.json({ success: true, data: { message: 'Exam task generation — Coming soon!' } })
})
