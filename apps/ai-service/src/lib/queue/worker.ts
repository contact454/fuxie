import { Worker } from 'bullmq'
import { connection } from './connection.js'

let gradingWorker: Worker | null = null
let contentWorker: Worker | null = null

if (connection) {
    gradingWorker = new Worker('grading-queue', async (job) => {
        console.log(`[Worker/Grading] Processing job ${job.id} of type ${job.name}`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log(`[Worker/Grading] Job ${job.id} completed.`)
        return { success: true }
    }, {
        connection: connection as any,
        concurrency: 5,
    })

    contentWorker = new Worker('content-generation-queue', async (job) => {
        console.log(`[Worker/Content] Processing job ${job.id} of type ${job.name}`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log(`[Worker/Content] Job ${job.id} completed.`)
        return { success: true }
    }, {
        connection: connection as any,
        concurrency: 2,
    })

    gradingWorker.on('failed', (job, err) => {
        console.error(`[Worker/Grading] Job ${job?.id} failed:`, err.message)
    })

    contentWorker.on('failed', (job, err) => {
        console.error(`[Worker/Content] Job ${job?.id} failed:`, err.message)
    })
}

export function startWorkers() {
    if (connection) {
        console.log('[Workers] Grading & Content workers started')
    } else {
        console.log('[Workers] Skipped — Redis not available')
    }
}

export { gradingWorker, contentWorker }
