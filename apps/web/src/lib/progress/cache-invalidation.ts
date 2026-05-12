import { cacheInvalidatePrefix } from '@/lib/cache/redis'

export async function invalidateLearnerProgressCaches(userId: string): Promise<void> {
    await Promise.all([
        cacheInvalidatePrefix(`dash:stats:${userId}`),
        cacheInvalidatePrefix(`dash:content:${userId}`),
        cacheInvalidatePrefix(`dash:today-plan:${userId}`),
        cacheInvalidatePrefix(`dash:mission-board:${userId}`),
        cacheInvalidatePrefix(`personalization:today:${userId}`),
    ])
}

export async function invalidateLearnerSrsCaches(userId: string): Promise<void> {
    await Promise.all([
        cacheInvalidatePrefix(`srs:due:${userId}`),
        cacheInvalidatePrefix(`srs:progress:${userId}`),
        invalidateLearnerProgressCaches(userId),
    ])
}
