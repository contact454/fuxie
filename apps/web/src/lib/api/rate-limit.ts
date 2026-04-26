import { NextRequest, NextResponse } from 'next/server'

type RateLimitOptions = {
    keyPrefix: string
    windowMs: number
    max: number
}

type Bucket = {
    count: number
    resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

export function enforceRateLimit(key: string, options: RateLimitOptions, now = Date.now()): NextResponse | null {
    cleanupExpiredBuckets(now)

    const bucketKey = `${options.keyPrefix}:${key}`
    const existing = buckets.get(bucketKey)
    const bucket = existing && existing.resetAt > now
        ? existing
        : { count: 0, resetAt: now + options.windowMs }

    bucket.count += 1
    buckets.set(bucketKey, bucket)

    if (bucket.count <= options.max) {
        return null
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
            status: 429,
            headers: {
                'Retry-After': String(retryAfterSeconds),
                'X-RateLimit-Limit': String(options.max),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
            },
        }
    )
}

export function getRateLimitNumber(name: string, fallback: number): number {
    const value = Number(process.env[name])
    return Number.isFinite(value) && value > 0 ? value : fallback
}

export function getRequestClientKey(req: NextRequest, userId?: string): string {
    if (userId) {
        return `user:${userId}`
    }

    return (
        req.headers.get('cf-connecting-ip') ||
        req.headers.get('x-real-ip') ||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown'
    )
}

function cleanupExpiredBuckets(now: number) {
    if (buckets.size < MAX_BUCKETS) {
        return
    }

    for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) {
            buckets.delete(key)
        }
    }
}
