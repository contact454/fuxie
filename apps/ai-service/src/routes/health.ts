import { Hono } from 'hono'

export const healthRoutes = new Hono()

healthRoutes.get('/', (c) =>
    c.json({
        status: 'ok',
        service: 'fuxie-ai-service',
        version: '0.0.1',
        timestamp: new Date().toISOString(),
    })
)
