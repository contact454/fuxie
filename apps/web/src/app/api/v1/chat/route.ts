import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { withAuth, NotFoundError } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { handleApiError } from '@/lib/api/error-handler'
import { withGeminiFallback } from '@/lib/ai/gemini-fallback'
import { parseGeminiJson } from '@/lib/ai/parse-json'
import { cookies } from 'next/headers'
import {
    buildChatSystemPrompt,
    CHAT_GREETINGS,
    SUGGESTED_TOPICS,
    type ChatUserContext,
} from '@/lib/ai/chat-prompt-builder'

const BASIC_LEVELS = new Set(['A1', 'A2', 'B1'])

// ─── Types ─────────────────────────────────────────
interface ChatCorrection {
    original: string
    corrected: string
    explanation: string
    rule: string
}

interface ChatResponse {
    text: string
    corrections: ChatCorrection[]
    suggestedFollowUps: string[]
}

// ─── Helpers ───────────────────────────────────────

/** Fetch enriched user context for the system prompt. */
async function getUserContext(dbUserId: string): Promise<ChatUserContext> {
    const [profile, learningPath, recentCards, memories] = await Promise.all([
        prisma.userProfile.findUnique({
            where: { userId: dbUserId },
            select: {
                displayName: true,
                currentLevel: true,
                totalXp: true,
            },
        }),
        prisma.learningPath.findUnique({
            where: { userId: dbUserId },
            select: {
                weakSkills: true,
                strongSkills: true,
            },
        }),
        // Fetch recently learned vocabulary (last 20 words reviewed successfully)
        prisma.srsCard.findMany({
            where: {
                userId: dbUserId,
                vocabularyItemId: { not: null },
                totalCorrect: { gt: 0 },
            },
            orderBy: { lastReviewedAt: 'desc' },
            take: 20,
            select: {
                vocabularyItem: {
                    select: { word: true, translations: true },
                },
            },
        }),
        prisma.userChatMemory.findMany({
            where: { userId: dbUserId },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            select: { content: true },
        }),
    ])

    const streak = await prisma.userStreak.findUnique({
        where: { userId: dbUserId },
        select: { currentStreak: true },
    })

    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'vi'

    return {
        displayName: profile?.displayName ?? 'Learner',
        level: profile?.currentLevel ?? 'A1',
        weakSkills: learningPath?.weakSkills ?? [],
        strongSkills: learningPath?.strongSkills ?? [],
        recentVocab: recentCards
            .filter(c => c.vocabularyItem)
            .map(c => `${c.vocabularyItem!.word} (${(c.vocabularyItem!.translations as any)?.[locale] || ''})`),
        longTermMemories: memories.map(m => m.content),
        streak: streak?.currentStreak ?? 0,
        totalXp: profile?.totalXp ?? 0,
    }
}

/** Generate a conversation title from the first user message. */
function generateTitle(text: string): string {
    const cleaned = text.trim().replace(/\n/g, ' ')
    return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned
}

// ─── POST /api/v1/chat ─────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const user = await getDbUserByFirebaseUid(auth.userId)
        if (!user) throw new NotFoundError('User not found')

        const body = await req.json()
        const {
            message,
            history = [],
            level,
            action,
            conversationId: existingConvId,
        } = body

        // ── Start conversation ────────────────────────
        if (action === 'start') {
            const userCtx = await getUserContext(user.id)
            const effectiveLevel = level ?? userCtx.level

            // Create DB conversation record
            const conv = await prisma.aiConversation.create({
                data: {
                    userId: user.id,
                    cefrLevel: effectiveLevel,
                    title: 'Neues Gespräch',
                    context: 'chat',
                },
            })

            const greetingText = CHAT_GREETINGS[effectiveLevel] ?? CHAT_GREETINGS.A1 ?? ''

            // Save the greeting as first message
            await prisma.aiMessage.create({
                data: {
                    conversationId: conv.id,
                    role: 'assistant',
                    content: greetingText as string,
                },
            })

            await prisma.aiConversation.update({
                where: { id: conv.id },
                data: { totalMessages: 1 },
            })

            return NextResponse.json({
                success: true,
                data: {
                    conversationId: conv.id,
                    message: greetingText,
                    level: effectiveLevel,
                    suggestedTopics: SUGGESTED_TOPICS[effectiveLevel] ?? SUGGESTED_TOPICS.A1,
                },
            })
        }

        // ── Chat message ──────────────────────────────
        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json(
                { success: false, error: 'Message is required' },
                { status: 400 },
            )
        }

        const userCtx = await getUserContext(user.id)
        const effectiveLevel = level ?? userCtx.level
        const modelName = BASIC_LEVELS.has(effectiveLevel) ? 'gemini-2.5-flash' : 'gemini-2.5-pro'

        // Resolve or create conversation
        let convId = existingConvId
        if (!convId) {
            const conv = await prisma.aiConversation.create({
                data: {
                    userId: user.id,
                    cefrLevel: effectiveLevel,
                    title: generateTitle(message),
                    context: 'chat',
                },
            })
            convId = conv.id
        }

        // Save user message
        await prisma.aiMessage.create({
            data: {
                conversationId: convId,
                role: 'user',
                content: message,
            },
        })

        // Build conversation history for Gemini
        const chatHistory = (history as Array<{ role: string; text: string }>).map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: msg.text }],
        }))

        // Build dynamic system prompt
        const systemPrompt = buildChatSystemPrompt(userCtx)

        // Call Gemini with fallback
        const result = await withGeminiFallback(async (client) => {
            const model = client.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    responseMimeType: 'application/json',
                },
            })
            const chat = model.startChat({
                history: chatHistory,
                systemInstruction: systemPrompt,
            })
            return await chat.sendMessage(message)
        })

        // Parse structured response
        const rawText = result.response.text()
        let parsed: ChatResponse

        try {
            parsed = parseGeminiJson<ChatResponse>(rawText)

            // Ensure required fields exist
            if (!parsed.text) parsed.text = rawText
            if (!Array.isArray(parsed.corrections)) parsed.corrections = []
            if (!Array.isArray(parsed.suggestedFollowUps)) parsed.suggestedFollowUps = []
        } catch {
            // Fallback: treat entire response as text
            parsed = {
                text: rawText,
                corrections: [],
                suggestedFollowUps: [],
            }
        }

        // Save assistant message to DB (async, non-blocking)
        const savePromise = Promise.all([
            prisma.aiMessage.create({
                data: {
                    conversationId: convId,
                    role: 'assistant',
                    content: parsed.text,
                    model: modelName,
                    corrections: parsed.corrections.length > 0
                        ? (parsed.corrections as unknown as import('@fuxie/database').Prisma.InputJsonValue)
                        : undefined,
                },
            }),
            prisma.aiConversation.update({
                where: { id: convId },
                data: {
                    totalMessages: { increment: 2 }, // user + assistant
                    // Update title from first user message if it was "Neues Gespräch"
                    ...(existingConvId ? {} : { title: generateTitle(message) }),
                },
            }),
        ])

        // Don't await save — respond fast
        savePromise.catch(err => console.error('[Chat] DB save error:', err))

        return NextResponse.json({
            success: true,
            data: {
                conversationId: convId,
                text: parsed.text,
                corrections: parsed.corrections,
                suggestedFollowUps: parsed.suggestedFollowUps,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
