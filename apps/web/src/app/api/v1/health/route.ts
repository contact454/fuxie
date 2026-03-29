import { NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'

/**
 * Health check / keep-alive endpoint.
 * Called by Vercel Cron every 5 minutes to prevent:
 * 1. Vercel serverless function cold starts
 * 2. Neon DB compute auto-suspend (most critical!)
 * 
 * Cron config: see vercel.json
 */
export async function GET() {
    const start = Date.now()

    try {
        // Ping the database to keep Neon compute warm
        await prisma.$queryRaw`SELECT 1`

        const latencyMs = Date.now() - start
        return NextResponse.json({
            status: 'ok',
            db: 'connected',
            latencyMs,
            timestamp: new Date().toISOString(),
        })
    } catch (err: any) {
        return NextResponse.json({
            status: 'error',
            db: 'disconnected',
            error: err.message,
            latencyMs: Date.now() - start,
        }, { status: 503 })
    }
}
