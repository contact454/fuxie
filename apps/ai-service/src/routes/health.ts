import { Hono } from 'hono'
import { getQueueOverview } from '../lib/queue/queues.js'
import { getTelemetrySnapshot } from '../lib/observability.js'

export const healthRoutes = new Hono()

healthRoutes.get('/', async (c) =>
    c.json({
        status: 'ok',
        service: 'fuxie-ai-service',
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        queues: await getQueueOverview(),
        telemetry: getTelemetrySnapshot(),
    })
)
