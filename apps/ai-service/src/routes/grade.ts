import { Hono } from 'hono'

export const gradeRoutes = new Hono()

gradeRoutes.post('/writing', async (c) => {
    // TODO: Implement writing grading with Gemini
    return c.json({ success: true, data: { message: 'Writing grading — Coming soon!' } })
})

gradeRoutes.post('/speaking', async (c) => {
    // TODO: Implement pronunciation grading with Cloud STT
    return c.json({ success: true, data: { message: 'Speaking grading — Coming soon!' } })
})

gradeRoutes.post('/grammar', async (c) => {
    // TODO: Implement grammar analysis with Gemini
    return c.json({ success: true, data: { message: 'Grammar grading — Coming soon!' } })
})
