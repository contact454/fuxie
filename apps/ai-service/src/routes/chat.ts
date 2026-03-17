import { Hono } from 'hono'

export const chatRoutes = new Hono()

chatRoutes.post('/', async (c) => {
    // TODO: Implement Gemini chat with streaming
    return c.json({
        success: true,
        data: { message: '🦊 Fuxie AI Chat — Coming soon!' },
    })
})

chatRoutes.post('/start', async (c) => {
    // TODO: Start new conversation
    return c.json({
        success: true,
        data: { conversationId: crypto.randomUUID(), message: 'Conversation started' },
    })
})
