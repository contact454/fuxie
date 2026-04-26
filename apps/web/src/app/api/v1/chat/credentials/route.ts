import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'node:crypto'
import { AuthError, withAuth } from '@/lib/auth/middleware'
import { enforceRateLimit, getRateLimitNumber, getRequestClientKey } from '@/lib/api/rate-limit'
import { getGeminiKey } from '@/lib/ai/gemini-fallback'
import { buildChatSystemPrompt } from '@/lib/ai/chat-prompt-builder'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { prisma } from '@fuxie/database'

export const dynamic = 'force-dynamic'

function canExposeClientGeminiKey() {
    if (process.env.ALLOW_CLIENT_GEMINI_KEY_EXPOSURE === 'true') {
        return true
    }

    return process.env.NODE_ENV !== 'production'
}

function getLiveProxyBaseUrl() {
    const configuredUrl = process.env.AI_SERVICE_WS_URL || process.env.NEXT_PUBLIC_AI_SERVICE_WS_URL
    if (configuredUrl) {
        return configuredUrl
    }

    const serviceUrl = process.env.AI_SERVICE_URL
    if (serviceUrl) {
        return `${serviceUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:').replace(/\/+$/, '')}/live`
    }

    return process.env.NODE_ENV === 'production' ? null : 'ws://localhost:3001/live'
}

function signLiveProxyToken(subject: string) {
    const secret = process.env.AI_SERVICE_PROXY_SECRET?.trim()
    if (!secret) {
        return null
    }

    const payload = Buffer.from(JSON.stringify({
        sub: subject,
        exp: Math.floor(Date.now() / 1000) + 60,
    })).toString('base64url')
    const signature = createHmac('sha256', secret).update(payload).digest('base64url')
    return `${payload}.${signature}`
}

function getLiveProxyUrl(subject: string) {
    const baseUrl = getLiveProxyBaseUrl()
    const token = signLiveProxyToken(subject)
    if (!baseUrl || !token) {
        return null
    }

    const url = new URL(baseUrl)
    url.searchParams.set('token', token)
    return url.toString()
}

export async function GET(req: NextRequest) {
    try {
        // Require authentication
        const auth = await withAuth(req)
        const limited = enforceRateLimit(getRequestClientKey(req, auth.userId), {
            keyPrefix: 'web-live-credentials',
            windowMs: getRateLimitNumber('WEB_LIVE_CREDENTIALS_RATE_LIMIT_WINDOW_MS', 60_000),
            max: getRateLimitNumber('WEB_LIVE_CREDENTIALS_RATE_LIMIT_MAX', 20),
        })
        if (limited) {
            return limited
        }

        // Fetch context for system prompt
        const user = await getDbUserByFirebaseUid(auth.userId)
        let systemPrompt = "Du bist Fuxie, ein freundlicher Deutschlehrer. Antworte kurz und präzise."
        if (user) {
            const [profile, learningPath, memories] = await Promise.all([
                prisma.userProfile.findUnique({ where: { userId: user.id } }),
                prisma.learningPath.findUnique({ where: { userId: user.id } }),
                prisma.userChatMemory.findMany({
                    where: { userId: user.id },
                    orderBy: { updatedAt: 'desc' },
                    take: 5,
                    select: { content: true }
                })
            ])
            const streak = await prisma.userStreak.findUnique({ where: { userId: user.id } })
            
            systemPrompt = buildChatSystemPrompt({
                displayName: profile?.displayName ?? 'Learner',
                level: profile?.currentLevel ?? 'A1',
                weakSkills: learningPath?.weakSkills ?? [],
                strongSkills: learningPath?.strongSkills ?? [],
                recentVocab: [], // simplified for MVP
                longTermMemories: memories.map(m => m.content),
                streak: streak?.currentStreak ?? 0,
                totalXp: profile?.totalXp ?? 0,
            })
        }

        const liveProxyUrl = getLiveProxyUrl(user?.id ?? auth.userId)
        if (liveProxyUrl) {
            return NextResponse.json({
                success: true,
                liveApiEnabled: true,
                transport: 'proxy',
                liveProxyUrl,
                systemPrompt,
            })
        }

        if (!canExposeClientGeminiKey()) {
            return NextResponse.json({
                success: true,
                liveApiEnabled: false,
                systemPrompt,
                error: 'Live voice chat requires a server-side WebSocket proxy in production.',
            })
        }

        const apiKey = getGeminiKey()
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'No API key available' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            liveApiEnabled: true,
            transport: 'direct',
            apiKey,
            systemPrompt,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        console.error('[Credentials API Error]', error)
        return NextResponse.json({ success: false, error: 'Failed to create live credentials' }, { status: 500 })
    }
}
