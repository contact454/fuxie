import { Worker } from 'bullmq'
import { connection } from './connection.js'

export const gradingWorker = new Worker('grading-queue', async (job) => {
    console.log(`[Worker/Grading] Processing job ${job.id} of type ${job.name}`)
    // Logic for grading can be imported here
    // e.g., if (job.name === 'grade-writing') { ... }
    
    // Simulate grading time
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log(`[Worker/Grading] Job ${job.id} completed.`)
    return { success: true }
}, {
    connection: connection as any,
    concurrency: 5, // Process 5 grading jobs concurrently
})

export const contentWorker = new Worker('content-generation-queue', async (job) => {
    console.log(`[Worker/Content] Processing job ${job.id} of type ${job.name}`)
    
    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log(`[Worker/Content] Job ${job.id} completed.`)
    return { success: true }
}, {
    connection: connection as any,
    concurrency: 2, // Content generation is heavier, lower concurrency
})

// Error handling
gradingWorker.on('failed', (job, err) => {
    console.error(`[Worker/Grading] Job ${job?.id} failed with error:`, err.message)
})

contentWorker.on('failed', (job, err) => {
    console.error(`[Worker/Content] Job ${job?.id} failed with error:`, err.message)
})

export function startWorkers() {
    console.log('[Workers] Grading & Content workers started')
}
