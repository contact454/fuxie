import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getGeminiKey } from '@/lib/ai/gemini-fallback'
import { buildChatSystemPrompt } from '@/lib/ai/chat-prompt-builder'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { prisma } from '@fuxie/database'

export async function GET(req: NextRequest) {
    try {
        // Require authentication
        const auth = await withAuth(req)

        // For MVP: Return the API key to the client so it can connect directly via WebSocket
        // In production, this should ideally be proxied through a persistent WebSocket server (e.g. Node/Python)
        // to avoid exposing the key, but Vercel Serverless does not support long-lived WebSockets.
        const apiKey = getGeminiKey()

        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'No API key available' }, { status: 500 })
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

        return NextResponse.json({ success: true, apiKey, systemPrompt })
    } catch (error) {
        console.error('[Credentials API Error]', error)
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
}
