import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { chatRoutes } from './routes/chat.js'
import { gradeRoutes } from './routes/grade.js'
import { generateRoutes } from './routes/generate.js'
import { audioRoutes } from './routes/audio.js'
import { healthRoutes } from './routes/health.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
}))

// Routes
app.route('/health', healthRoutes)
app.route('/chat', chatRoutes)
app.route('/grade', gradeRoutes)
app.route('/generate', generateRoutes)
app.route('/audio', audioRoutes)

// 404
app.notFound((c) =>
    c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404)
)

// Error handler
app.onError((err, c) => {
    console.error('[AI Service Error]', err)
    return c.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
        500
    )
})

// Start server
const port = Number(process.env.PORT) || 3001
console.log(`🦊 Fuxie AI Service running on port ${port}`)

serve({ fetch: app.fetch, port })

export default app
