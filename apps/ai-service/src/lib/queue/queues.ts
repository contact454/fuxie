import { Queue } from 'bullmq'
import { connection } from './connection.js'

export const gradingQueue = new Queue('grading-queue', { connection: connection as any })
export const contentQueue = new Queue('content-generation-queue', { connection: connection as any })

export async function addGradingJob(jobName: string, data: any) {
    return gradingQueue.add(jobName, data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true, // cleanup old jobs
    })
}

export async function addContentJob(jobName: string, data: any) {
    return contentQueue.add(jobName, data, {
        attempts: 1, // Gemini rarely fails, if it does, keep it simple
        removeOnComplete: true,
    })
}
