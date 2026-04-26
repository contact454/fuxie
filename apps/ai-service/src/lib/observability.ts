import type { Context, Next } from 'hono'

type RouteMetric = {
    count: number
    errorCount: number
    totalDurationMs: number
    maxDurationMs: number
    lastStatus: number
    lastSeenAt: string
}

type RecentRequestEvent = {
    method: string
    path: string
    status: number
    durationMs: number
    at: string
    error?: string
}

type LiveProxyMetrics = {
    activeConnections: number
    totalConnections: number
    rejectedConnections: number
    clientErrors: number
    upstreamErrors: number
    messagesToUpstream: number
    messagesToClient: number
    bytesToUpstream: number
    bytesToClient: number
    lastConnectionAt?: string
    lastRejectedAt?: string
    lastError?: string
    lastErrorAt?: string
}

const startedAt = Date.now()
const routeMetrics = new Map<string, RouteMetric>()
const recentEvents: RecentRequestEvent[] = []
const MAX_RECENT_EVENTS = 50
const liveProxyMetrics: LiveProxyMetrics = {
    activeConnections: 0,
    totalConnections: 0,
    rejectedConnections: 0,
    clientErrors: 0,
    upstreamErrors: 0,
    messagesToUpstream: 0,
    messagesToClient: 0,
    bytesToUpstream: 0,
    bytesToClient: 0,
}

export async function observeRequest(c: Context, next: Next) {
    const started = Date.now()
    let thrownError: unknown

    try {
        await next()
    } catch (error) {
        thrownError = error
        throw error
    } finally {
        const durationMs = Date.now() - started
        const status = thrownError ? 500 : c.res.status || 200
        recordRequest({
            method: c.req.method,
            path: c.req.path,
            status,
            durationMs,
            at: new Date().toISOString(),
            ...(thrownError instanceof Error ? { error: thrownError.message } : {}),
        })
    }
}

export function getTelemetrySnapshot() {
    const routes = Array.from(routeMetrics.entries())
        .map(([route, metric]) => ({
            route,
            count: metric.count,
            errorCount: metric.errorCount,
            avgDurationMs: Math.round(metric.totalDurationMs / metric.count),
            maxDurationMs: metric.maxDurationMs,
            lastStatus: metric.lastStatus,
            lastSeenAt: metric.lastSeenAt,
        }))
        .sort((a, b) => b.count - a.count)

    const totals = routes.reduce(
        (acc, route) => ({
            requests: acc.requests + route.count,
            errors: acc.errors + route.errorCount,
        }),
        { requests: 0, errors: 0 }
    )

    const weightedDuration = routes.reduce((sum, route) => sum + route.avgDurationMs * route.count, 0)
    const avgDurationMs = totals.requests > 0
        ? Math.round(weightedDuration / totals.requests)
        : 0

    return {
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        totals: {
            ...totals,
            avgDurationMs,
            errorRate: totals.requests > 0 ? Number((totals.errors / totals.requests).toFixed(4)) : 0,
        },
        routes: routes.slice(0, 20),
        recentEvents: recentEvents.slice().reverse(),
        liveProxy: { ...liveProxyMetrics },
    }
}

export function recordLiveProxyAccepted() {
    liveProxyMetrics.activeConnections += 1
    liveProxyMetrics.totalConnections += 1
    liveProxyMetrics.lastConnectionAt = new Date().toISOString()
}

export function recordLiveProxyClosed() {
    liveProxyMetrics.activeConnections = Math.max(0, liveProxyMetrics.activeConnections - 1)
}

export function recordLiveProxyRejected() {
    liveProxyMetrics.rejectedConnections += 1
    liveProxyMetrics.lastRejectedAt = new Date().toISOString()
}

export function recordLiveProxyMessage(direction: 'to_upstream' | 'to_client', bytes: number) {
    if (direction === 'to_upstream') {
        liveProxyMetrics.messagesToUpstream += 1
        liveProxyMetrics.bytesToUpstream += bytes
        return
    }

    liveProxyMetrics.messagesToClient += 1
    liveProxyMetrics.bytesToClient += bytes
}

export function recordLiveProxyError(source: 'client' | 'upstream', message: string) {
    if (source === 'client') {
        liveProxyMetrics.clientErrors += 1
    } else {
        liveProxyMetrics.upstreamErrors += 1
    }

    liveProxyMetrics.lastError = message
    liveProxyMetrics.lastErrorAt = new Date().toISOString()
}

function recordRequest(event: RecentRequestEvent) {
    const key = `${event.method} ${event.path}`
    const previous = routeMetrics.get(key)
    const isError = event.status >= 500

    routeMetrics.set(key, {
        count: (previous?.count ?? 0) + 1,
        errorCount: (previous?.errorCount ?? 0) + (isError ? 1 : 0),
        totalDurationMs: (previous?.totalDurationMs ?? 0) + event.durationMs,
        maxDurationMs: Math.max(previous?.maxDurationMs ?? 0, event.durationMs),
        lastStatus: event.status,
        lastSeenAt: event.at,
    })

    if (event.status >= 400 || event.durationMs >= 3000) {
        recentEvents.push(event)
        if (recentEvents.length > MAX_RECENT_EVENTS) {
            recentEvents.shift()
        }
    }
}
