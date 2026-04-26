import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || ''

let connection: Redis | null = null
let warnedConnectionError = false

if (redisUrl) {
    try {
        connection = new Redis(redisUrl, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
            retryStrategy: (times) => {
                if (times > 3) {
                    return null
                }

                return Math.min(times * 250, 1000)
            },
        })

        connection.on('error', (err) => {
            if (!warnedConnectionError) {
                warnedConnectionError = true
                console.warn('[BullMQ Redis] Connection error:', formatRedisError(err))
            }
        })

        connection.on('ready', () => {
            console.log('[BullMQ Redis] Connected to', redactRedisUrl(redisUrl))
        })
    } catch (err) {
        console.warn('[BullMQ Redis] Failed to init:', err)
        connection = null
    }
} else {
    console.log('[BullMQ Redis] REDIS_URL not set — workers disabled')
}

export { connection }

export function formatRedisError(error: unknown) {
    if (!(error instanceof Error)) {
        return 'Unknown Redis error'
    }

    return error.message.trim() || error.name
}

function redactRedisUrl(value: string) {
    try {
        const url = new URL(value)
        if (url.username) {
            url.username = '***'
        }
        if (url.password) {
            url.password = '***'
        }
        return url.toString()
    } catch {
        return '[configured]'
    }
}
