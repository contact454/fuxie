import { Hono } from 'hono'

export const audioRoutes = new Hono()

audioRoutes.post('/tts', async (c) => {
    // TODO: Google Cloud TTS
    return c.json({ success: true, data: { message: 'TTS — Coming soon!' } })
})

audioRoutes.post('/tts/batch', async (c) => {
    // TODO: Batch TTS via Cloud Tasks
    return c.json({ success: true, data: { message: 'Batch TTS — Coming soon!' } })
})

audioRoutes.post('/pronunciation', async (c) => {
    // TODO: Google Cloud STT pronunciation grading
    return c.json({ success: true, data: { message: 'Pronunciation grading — Coming soon!' } })
})
