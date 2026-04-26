import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { chatRoutes } from './routes/chat.js'
import { gradeRoutes } from './routes/grade.js'
import { generateRoutes } from './routes/generate.js'
import { audioRoutes } from './routes/audio.js'
import { healthRoutes } from './routes/health.js'
import { validateAiServiceEnv } from './lib/env.js'
import { startWorkers } from './lib/queue/worker.js'
import { observeRequest } from './lib/observability.js'
import { attachLiveProxy } from './lib/live-proxy.js'
import { getRateLimitNumber, rateLimit } from './lib/rate-limit.js'

validateAiServiceEnv()

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
}))
app.use('*', observeRequest)

const aiRateLimit = rateLimit({
    keyPrefix: 'ai-http',
    windowMs: getRateLimitNumber('AI_SERVICE_RATE_LIMIT_WINDOW_MS', 60_000),
    max: getRateLimitNumber('AI_SERVICE_RATE_LIMIT_MAX', 120),
})

// Routes
app.route('/health', healthRoutes)
app.use('/chat', aiRateLimit)
app.use('/chat/*', aiRateLimit)
app.route('/chat', chatRoutes)
app.use('/grade', aiRateLimit)
app.use('/grade/*', aiRateLimit)
app.route('/grade', gradeRoutes)
app.use('/generate', aiRateLimit)
app.use('/generate/*', aiRateLimit)
app.route('/generate', generateRoutes)
app.use('/audio', aiRateLimit)
app.use('/audio/*', aiRateLimit)
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

startWorkers()
const server = serve({ fetch: app.fetch, port })
attachLiveProxy(server)

export default app
