import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// BullMQ requires maxRetriesPerRequest to be null
export const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
})

connection.on('error', (err) => {
    console.error('[BullMQ Redis] Connection Error:', err)
})

connection.on('ready', () => {
    console.log('[BullMQ Redis] Connected to', redisUrl)
})
