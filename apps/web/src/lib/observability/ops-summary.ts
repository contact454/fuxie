import { prisma } from '@fuxie/database'

const GEMINI_FLASH_COST_PER_MILLION = 0.15
const AI_SERVICE_HEALTH_TIMEOUT_MS = 2500

type HealthStatus = 'ok' | 'error' | 'not_configured'
type AlertLevel = 'info' | 'warning' | 'critical'

export interface OpsSummary {
    generatedAt: string
    database: {
        status: Exclude<HealthStatus, 'not_configured'>
        latencyMs: number
        error?: string
    }
    aiService: {
        status: HealthStatus
        url?: string
        latencyMs?: number
        httpStatus?: number
        service?: string
        error?: string
        queues?: unknown
        telemetry?: unknown
    }
    activity: {
        usersTotal: number
        activeUsers24h: number
        lessonCompletions24h: number
        submissions24h: number
        srsReviews24h: number
        aiMessages24h: number
        aiConversations24h: number
        aiTokens7d: number
        aiEstimatedCost7d: number
        avgAiLatencyMs: number
        error?: string
    }
    alerts: Array<{
        level: AlertLevel
        title: string
        message: string
    }>
}

export async function getOpsSummary(): Promise<OpsSummary> {
    const generatedAt = new Date()
    const since24h = new Date(generatedAt.getTime() - 24 * 60 * 60 * 1000)
    const since7d = new Date(generatedAt.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [database, aiService] = await Promise.all([
        checkDatabaseHealth(),
        checkAiServiceHealth(),
    ])

    const activity = await collectActivityMetrics(since24h, since7d)

    const summary: OpsSummary = {
        generatedAt: generatedAt.toISOString(),
        database,
        aiService,
        activity,
        alerts: [],
    }

    return {
        ...summary,
        alerts: buildAlerts(summary),
    }
}

async function checkDatabaseHealth(): Promise<OpsSummary['database']> {
    const started = Date.now()

    try {
        await prisma.$queryRaw`SELECT 1`
        return {
            status: 'ok',
            latencyMs: Date.now() - started,
        }
    } catch (error) {
        return {
            status: 'error',
            latencyMs: Date.now() - started,
            error: getErrorMessage(error),
        }
    }
}

async function checkAiServiceHealth(): Promise<OpsSummary['aiService']> {
    const url = normalizeAiServiceUrl(process.env.AI_SERVICE_URL)
    if (!url) {
        return { status: 'not_configured' }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), AI_SERVICE_HEALTH_TIMEOUT_MS)
    const started = Date.now()

    try {
        const response = await fetch(`${url}/health`, {
            cache: 'no-store',
            signal: controller.signal,
        })
        const body = await readJsonObject(response)
        const healthStatus = body?.status === 'ok' && response.ok ? 'ok' : 'error'

        return {
            status: healthStatus,
            url,
            latencyMs: Date.now() - started,
            httpStatus: response.status,
            service: typeof body?.service === 'string' ? body.service : undefined,
            queues: body?.queues,
            telemetry: body?.telemetry,
            ...(healthStatus === 'error'
                ? { error: typeof body?.error === 'string' ? body.error : `HTTP ${response.status}` }
                : {}),
        }
    } catch (error) {
        return {
            status: 'error',
            url,
            latencyMs: Date.now() - started,
            error: getErrorMessage(error),
        }
    } finally {
        clearTimeout(timeout)
    }
}

async function collectActivityMetrics(
    since24h: Date,
    since7d: Date
): Promise<OpsSummary['activity']> {
    try {
        const [
            usersTotal,
            activeUsers24h,
            lessonCompletions24h,
            examAttempts24h,
            readingAttempts24h,
            listeningAttempts24h,
            vocabAttempts24h,
            writingAttempts24h,
            srsReviews24h,
            aiMessages24h,
            aiConversations24h,
            aiMessageAgg,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.dailyActivity.count({ where: { date: { gte: since24h } } }),
            prisma.userProgress.count({ where: { completedAt: { gte: since24h } } }),
            prisma.examAttempt.count({ where: { completedAt: { gte: since24h } } }),
            prisma.readingAttempt.count({ where: { completedAt: { gte: since24h } } }),
            prisma.listeningAttempt.count({ where: { completedAt: { gte: since24h } } }),
            prisma.vocabExerciseAttempt.count({ where: { createdAt: { gte: since24h } } }),
            prisma.writingAttempt.count({ where: { submittedAt: { gte: since24h } } }),
            prisma.srsReviewLog.count({ where: { reviewedAt: { gte: since24h } } }),
            prisma.aiMessage.count({ where: { createdAt: { gte: since24h } } }),
            prisma.aiConversation.count({ where: { updatedAt: { gte: since24h } } }),
            prisma.aiMessage.aggregate({
                where: { createdAt: { gte: since7d } },
                _sum: { tokensUsed: true },
                _avg: { latencyMs: true },
            }),
        ])

        const aiTokens7d = aiMessageAgg._sum.tokensUsed ?? 0

        return {
            usersTotal,
            activeUsers24h,
            lessonCompletions24h,
            submissions24h: examAttempts24h + readingAttempts24h + listeningAttempts24h + vocabAttempts24h + writingAttempts24h,
            srsReviews24h,
            aiMessages24h,
            aiConversations24h,
            aiTokens7d,
            aiEstimatedCost7d: (aiTokens7d / 1_000_000) * GEMINI_FLASH_COST_PER_MILLION,
            avgAiLatencyMs: Math.round(aiMessageAgg._avg.latencyMs ?? 0),
        }
    } catch (error) {
        return {
            ...emptyActivityMetrics(),
            error: getErrorMessage(error),
        }
    }
}

function buildAlerts(summary: Omit<OpsSummary, 'alerts'>): OpsSummary['alerts'] {
    const alerts: OpsSummary['alerts'] = []

    if (summary.database.status === 'error') {
        alerts.push({
            level: 'critical',
            title: 'Database unavailable',
            message: summary.database.error ?? 'Database health check failed.',
        })
    } else if (summary.database.latencyMs > 1000) {
        alerts.push({
            level: 'warning',
            title: 'Database latency is high',
            message: `Health query took ${summary.database.latencyMs} ms.`,
        })
    }

    if (summary.aiService.status === 'not_configured') {
        alerts.push({
            level: 'info',
            title: 'AI service URL is not configured',
            message: 'Set AI_SERVICE_URL to include AI-service health and queue telemetry.',
        })
    } else if (summary.aiService.status === 'error') {
        alerts.push({
            level: 'warning',
            title: 'AI service health check failed',
            message: summary.aiService.error ?? 'AI service did not return a healthy response.',
        })
    }

    const failedQueueJobs = countFailedQueueJobs(summary.aiService.queues)
    if (failedQueueJobs > 0) {
        alerts.push({
            level: 'warning',
            title: 'AI queue failures detected',
            message: `${failedQueueJobs} failed jobs are currently reported by the AI service queues.`,
        })
    }

    if (summary.activity.error) {
        alerts.push({
            level: 'warning',
            title: 'Activity metrics unavailable',
            message: summary.activity.error,
        })
    } else if (summary.activity.avgAiLatencyMs > 5000) {
        alerts.push({
            level: 'warning',
            title: 'AI latency is high',
            message: `Average stored AI message latency is ${summary.activity.avgAiLatencyMs} ms over the last 7 days.`,
        })
    }

    return alerts
}

function countFailedQueueJobs(queues: unknown): number {
    if (!queues || typeof queues !== 'object') {
        return 0
    }

    return Object.values(queues as Record<string, unknown>).reduce<number>((sum, queue) => {
        if (!queue || typeof queue !== 'object') {
            return sum
        }

        const failed = (queue as Record<string, unknown>).failed
        return sum + (typeof failed === 'number' ? failed : 0)
    }, 0)
}

function emptyActivityMetrics(): OpsSummary['activity'] {
    return {
        usersTotal: 0,
        activeUsers24h: 0,
        lessonCompletions24h: 0,
        submissions24h: 0,
        srsReviews24h: 0,
        aiMessages24h: 0,
        aiConversations24h: 0,
        aiTokens7d: 0,
        aiEstimatedCost7d: 0,
        avgAiLatencyMs: 0,
    }
}

function normalizeAiServiceUrl(value: string | undefined): string | null {
    const trimmed = value?.trim()
    if (!trimmed) {
        return null
    }

    return trimmed.replace(/\/+$/, '')
}

async function readJsonObject(response: Response): Promise<Record<string, unknown> | null> {
    try {
        const value = await response.json()
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return null
        }

        return value as Record<string, unknown>
    } catch {
        return null
    }
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message
    }

    return 'Unknown error'
}
