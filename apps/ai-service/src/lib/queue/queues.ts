import { Job, Queue, type JobsOptions } from 'bullmq'
import { connection, formatRedisError } from './connection.js'

type QueueKind = 'grading' | 'content'

type EnqueueOptions = {
    idempotencyKey?: string
}

const DEFAULT_JOB_OPTIONS: JobsOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 50,
    removeOnFail: 100,
}

export const gradingQueue = createQueue('grading-queue')

export const contentQueue = createQueue('content-generation-queue')

export const gradingDeadLetterQueue = createQueue('grading-dead-letter-queue')

export const contentDeadLetterQueue = createQueue('content-dead-letter-queue')

const warnedQueueErrors = new Set<string>()

function createQueue(name: string) {
    if (!connection) {
        return null
    }

    const queue = new Queue(name, { connection: connection as any })
    queue.on('error', (error) => {
        if (warnedQueueErrors.has(name)) {
            return
        }

        warnedQueueErrors.add(name)
        console.warn(`[BullMQ Redis] ${name} error: ${formatRedisError(error)}`)
    })
    return queue
}

export async function addGradingJob(jobName: string, data: unknown, options?: EnqueueOptions) {
    return enqueueJob('grading', gradingQueue, jobName, data, options)
}

export async function addContentJob(jobName: string, data: unknown, options?: EnqueueOptions) {
    return enqueueJob('content', contentQueue, jobName, data, options)
}

export async function getGradingJobStatus(jobId: string) {
    return getJobStatus('grading', gradingQueue, jobId)
}

export async function getContentJobStatus(jobId: string) {
    return getJobStatus('content', contentQueue, jobId)
}

export async function addDeadLetterEntry(kind: QueueKind, entry: DeadLetterEntry) {
    const queue = kind === 'grading' ? gradingDeadLetterQueue : contentDeadLetterQueue
    if (!queue) {
        return null
    }

    const jobId = `${entry.queue}:${entry.originalJobId}`
    const existing = await queue.getJob(jobId)
    if (existing) {
        return existing
    }

    return queue.add(entry.name, entry, {
        jobId,
        removeOnComplete: false,
        removeOnFail: false,
    })
}

export async function listDeadLetterJobs(kind: QueueKind, limit = 20) {
    const queue = kind === 'grading' ? gradingDeadLetterQueue : contentDeadLetterQueue
    if (!queue) {
        throw new Error(`${kind} dead-letter queue is disabled because REDIS_URL is not configured`)
    }

    const jobs = await queue.getJobs(['waiting', 'delayed', 'prioritized'], 0, Math.max(limit - 1, 0), true)
    return jobs.map((job) => ({
        id: job.id,
        name: job.name,
        ...job.data,
    }))
}

export async function getQueueOverview() {
    return {
        redisEnabled: Boolean(connection),
        grading: await getQueueCounts(gradingQueue),
        content: await getQueueCounts(contentQueue),
        gradingDeadLetter: await getQueueCounts(gradingDeadLetterQueue),
        contentDeadLetter: await getQueueCounts(contentDeadLetterQueue),
    }
}

export type DeadLetterEntry = {
    queue: string
    originalJobId: string
    name: string
    data: unknown
    failedReason: string
    attemptsMade: number
    attemptsAllowed: number
    progress: Job['progress']
    failedAt: string
}

async function enqueueJob(
    kind: QueueKind,
    queue: Queue | null,
    jobName: string,
    data: unknown,
    options?: EnqueueOptions,
) {
    if (!queue) {
        throw new Error(`${kind} queue is disabled because REDIS_URL is not configured`)
    }

    const jobId = buildJobId(jobName, options?.idempotencyKey)
    if (jobId) {
        const existing = await queue.getJob(jobId)
        if (existing) {
            return existing
        }
    }

    return queue.add(jobName, data, {
        ...DEFAULT_JOB_OPTIONS,
        ...(jobId ? { jobId } : {}),
    })
}

async function getJobStatus(kind: QueueKind, queue: Queue | null, jobId: string) {
    if (!queue) {
        throw new Error(`${kind} queue is disabled because REDIS_URL is not configured`)
    }

    const job = await queue.getJob(jobId)
    if (!job) {
        return null
    }

    return serializeJob(job, await job.getState())
}

function serializeJob(job: Job, state: string) {
    return {
        id: job.id,
        name: job.name,
        queue: job.queueName,
        state,
        attemptsMade: job.attemptsMade,
        attemptsAllowed: job.opts.attempts ?? 1,
        progress: job.progress,
        data: job.data,
        result: job.returnvalue ?? null,
        failedReason: job.failedReason ?? null,
        timestamp: job.timestamp,
        processedOn: job.processedOn ?? null,
        finishedOn: job.finishedOn ?? null,
        idempotent: Boolean(job.opts.jobId),
        retryBackoff: job.opts.backoff ?? null,
    }
}

function buildJobId(jobName: string, idempotencyKey?: string) {
    if (!idempotencyKey) {
        return undefined
    }

    const normalized = idempotencyKey
        .toLowerCase()
        .replace(/[^a-z0-9:_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120)

    if (!normalized) {
        return undefined
    }

    return `${jobName}:${normalized}`
}

async function getQueueCounts(queue: Queue | null) {
    if (!queue) {
        return { enabled: false, healthy: true }
    }

    try {
        const counts = await queue.getJobCounts(
            'waiting',
            'active',
            'completed',
            'failed',
            'delayed',
            'paused',
            'prioritized',
        )

        return {
            enabled: true,
            healthy: true,
            ...counts,
        }
    } catch (error) {
        return {
            enabled: true,
            healthy: false,
            error: formatRedisError(error),
        }
    }
}
