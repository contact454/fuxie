import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { withAuth, NotFoundError } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { handleApiError } from '@/lib/api/error-handler'

interface RouteParams {
    params: Promise<{ conversationId: string }>
}

/**
 * GET /api/v1/chat/history/[conversationId]
 * Load full conversation with all messages.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const auth = await withAuth(req)
        const user = await getDbUserByFirebaseUid(auth.userId)
        if (!user) throw new NotFoundError('User not found')

        const { conversationId } = await params

        const conv = await prisma.aiConversation.findFirst({
            where: {
                id: conversationId,
                userId: user.id,
                deletedAt: null,
            },
            select: {
                id: true,
                title: true,
                cefrLevel: true,
                totalMessages: true,
                createdAt: true,
                updatedAt: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        role: true,
                        content: true,
                        corrections: true,
                        createdAt: true,
                    },
                },
            },
        })

        if (!conv) throw new NotFoundError('Conversation not found')

        return NextResponse.json({
            success: true,
            data: {
                id: conv.id,
                title: conv.title,
                level: conv.cefrLevel,
                totalMessages: conv.totalMessages,
                createdAt: conv.createdAt.toISOString(),
                updatedAt: conv.updatedAt.toISOString(),
                messages: conv.messages.map(m => ({
                    id: m.id,
                    role: m.role,
                    text: m.content,
                    corrections: m.corrections ?? [],
                    timestamp: m.createdAt.toISOString(),
                })),
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
