import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { withAuth, NotFoundError } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { handleApiError } from '@/lib/api/error-handler'

/**
 * GET /api/v1/chat/history
 * List all conversations for the authenticated user.
 *
 * Query params:
 *   - limit (default: 30)
 *   - cursor (for pagination, optional conversation id)
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const user = await getDbUserByFirebaseUid(auth.userId)
        if (!user) throw new NotFoundError('User not found')

        const limit = Number(req.nextUrl.searchParams.get('limit') ?? '30')
        const cursor = req.nextUrl.searchParams.get('cursor')

        const conversations = await prisma.aiConversation.findMany({
            where: {
                userId: user.id,
                deletedAt: null,
                context: 'chat',
            },
            orderBy: { updatedAt: 'desc' },
            take: limit + 1, // +1 to check if there's a next page
            ...(cursor ? {
                cursor: { id: cursor },
                skip: 1,
            } : {}),
            select: {
                id: true,
                title: true,
                cefrLevel: true,
                totalMessages: true,
                updatedAt: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        content: true,
                        role: true,
                        createdAt: true,
                    },
                },
            },
        })

        const hasNextPage = conversations.length > limit
        const items = hasNextPage ? conversations.slice(0, limit) : conversations
        const nextCursor = hasNextPage ? items[items.length - 1]?.id : undefined

        return NextResponse.json({
            success: true,
            data: {
                conversations: items.map(c => ({
                    id: c.id,
                    title: c.title ?? 'Neues Gespräch',
                    level: c.cefrLevel,
                    totalMessages: c.totalMessages,
                    lastMessage: c.messages[0]?.content?.substring(0, 100) ?? '',
                    lastMessageRole: c.messages[0]?.role ?? 'assistant',
                    updatedAt: c.updatedAt.toISOString(),
                })),
                nextCursor,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}

/**
 * DELETE /api/v1/chat/history
 * Soft-delete a conversation by ID.
 *
 * Body: { conversationId: string }
 */
export async function DELETE(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const user = await getDbUserByFirebaseUid(auth.userId)
        if (!user) throw new NotFoundError('User not found')

        const body = await req.json()
        const { conversationId } = body

        if (!conversationId) {
            return NextResponse.json(
                { success: false, error: 'conversationId is required' },
                { status: 400 },
            )
        }

        // Verify ownership
        const conv = await prisma.aiConversation.findFirst({
            where: { id: conversationId, userId: user.id, deletedAt: null },
        })

        if (!conv) throw new NotFoundError('Conversation not found')

        // Soft delete
        await prisma.aiConversation.update({
            where: { id: conversationId },
            data: { deletedAt: new Date() },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return handleApiError(error)
    }
}
