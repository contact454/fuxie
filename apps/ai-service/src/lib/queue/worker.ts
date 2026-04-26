import { Worker, type Job } from 'bullmq'
import { generateContentByType, type GenerateType } from '../content-generation.js'
import { gradeByType, type GradeJobType } from '../grading.js'
import { connection, formatRedisError } from './connection.js'
import { addDeadLetterEntry } from './queues.js'

let gradingWorker: Worker | null = null
let contentWorker: Worker | null = null

if (connection) {
    gradingWorker = new Worker(
        'grading-queue',
        async (job) => {
            console.log(`[Worker/Grading] Processing job ${job.id} of type ${job.name}`)
            await job.updateProgress(10)
            const data = await gradeByType(job.name as GradeJobType, job.data)
            await job.updateProgress(100)
            console.log(`[Worker/Grading] Job ${job.id} completed`)

            return {
                success: true,
                type: job.name,
                data,
            }
        },
        {
            connection: connection as any,
            concurrency: 5,
        },
    )

    contentWorker = new Worker(
        'content-generation-queue',
        async (job) => {
            console.log(`[Worker/Content] Processing job ${job.id} of type ${job.name}`)
            await job.updateProgress(10)

            const data = await generateContentByType(job.name as GenerateType, job.data)

            await job.updateProgress(100)
            console.log(`[Worker/Content] Job ${job.id} completed`)

            return {
                success: true,
                type: job.name,
                data,
            }
        },
        {
            connection: connection as any,
            concurrency: 2,
        },
    )

    gradingWorker.on('failed', async (job, err) => {
        console.error(`[Worker/Grading] Job ${job?.id} failed:`, err.message)
        if (job && isTerminalFailure(job)) {
            await addDeadLetterEntry('grading', toDeadLetterEntry(job, err))
        }
    })

    contentWorker.on('failed', async (job, err) => {
        console.error(`[Worker/Content] Job ${job?.id} failed:`, err.message)
        if (job && isTerminalFailure(job)) {
            await addDeadLetterEntry('content', toDeadLetterEntry(job, err))
        }
    })

    attachWorkerErrorHandler('grading', gradingWorker)
    attachWorkerErrorHandler('content', contentWorker)
}

export function startWorkers() {
    if (connection) {
        console.log('[Workers] Grading and content workers started')
    } else {
        console.log('[Workers] Skipped - Redis not available')
    }
}

function isTerminalFailure(job: Job) {
    return job.attemptsMade >= (job.opts.attempts ?? 1)
}

function toDeadLetterEntry(job: Job, err: Error) {
    return {
        queue: job.queueName,
        originalJobId: String(job.id),
        name: job.name,
        data: job.data,
        failedReason: err.message,
        attemptsMade: job.attemptsMade,
        attemptsAllowed: job.opts.attempts ?? 1,
        progress: job.progress,
        failedAt: new Date().toISOString(),
    }
}

const warnedWorkerErrors = new Set<string>()

function attachWorkerErrorHandler(name: string, worker: Worker) {
    worker.on('error', (error) => {
        if (warnedWorkerErrors.has(name)) {
            return
        }

        warnedWorkerErrors.add(name)
        console.warn(`[Worker/${name}] Redis error: ${formatRedisError(error)}`)
    })
}

export { gradingWorker, contentWorker }
