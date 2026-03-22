import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || ''

let connection: Redis | null = null

if (redisUrl) {
    try {
        connection = new Redis(redisUrl, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
        })

        connection.on('error', (err) => {
            console.warn('[BullMQ Redis] Connection Error:', err.message)
        })

        connection.on('ready', () => {
            console.log('[BullMQ Redis] Connected to', redisUrl)
        })
    } catch (err) {
        console.warn('[BullMQ Redis] Failed to init:', err)
        connection = null
    }
} else {
    console.log('[BullMQ Redis] REDIS_URL not set — workers disabled')
}

export { connection }
