import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { prisma } from '@fuxie/database'
import { SessionPlayerDynamic } from '@/components/session/SessionPlayerDynamic'
import type { SessionAttemptView } from '@/lib/session/contracts'
import type { CefrLevel } from '@fuxie/database'
import type { ReactNode } from 'react'

export const metadata = {
    title: 'Fuxie 🦊 — Tự Động Học',
    description: 'Học thông minh với lộ trình Fuxie được thiết kế riêng cho bạn.',
}

const QA_ATTEMPT_ID = '00000000-0000-4000-8000-000000000001'
const QA_REVISION = '00000000-0000-4000-8000-000000000002'
const QA_INTRO_ID = '00000000-0000-4000-8000-000000000003'
const QA_REVIEW_ID = '00000000-0000-4000-8000-000000000004'
const QA_OPTION_OK = '00000000-0000-4000-8000-000000000005'
const QA_OPTION_BAD = '00000000-0000-4000-8000-000000000006'

function buildVisualQaPreview(level: CefrLevel, finished: boolean): SessionAttemptView {
    const savedAt = new Date(0).toISOString()
    const checkedAnswers = finished
        ? [
            {
                questionId: QA_INTRO_ID,
                answer: { kind: 'ack' as const, acknowledged: true as const },
                correct: null,
                points: 0,
                checkedAt: savedAt,
                feedback: { answerLabel: null, correctOptionId: null },
            },
            {
                questionId: QA_REVIEW_ID,
                answer: { kind: 'option' as const, optionId: QA_OPTION_OK },
                correct: true,
                points: 10,
                checkedAt: savedAt,
                feedback: { answerLabel: 'đúng giờ', correctOptionId: QA_OPTION_OK },
            },
        ]
        : []

    return {
        state: 'ready',
        attemptId: QA_ATTEMPT_ID,
        contractVersion: 2,
        publicRevision: QA_REVISION,
        level,
        status: finished ? 'COMPLETED' : 'IN_PROGRESS',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        items: [
            {
                id: QA_INTRO_ID,
                type: 'VOCAB_NEW',
                format: 'INTRO',
                points: 0,
                data: {
                    term: 'der Termin',
                    meaning: 'cuộc hẹn',
                    article: 'MASCULINE',
                    exampleSentence: 'Ich habe morgen einen Termin.',
                    audioUrl: null,
                },
            },
            {
                id: QA_REVIEW_ID,
                type: 'VOCAB_REVIEW',
                format: 'MULTIPLE_CHOICE',
                points: 10,
                data: {
                    term: 'pünktlich',
                    options: [
                        { id: QA_OPTION_OK, label: 'đúng giờ' },
                        { id: QA_OPTION_BAD, label: 'muộn' },
                    ],
                },
            },
        ],
        checkedAnswers,
        nextQuestionId: finished ? null : QA_INTRO_ID,
        heartsRemaining: 5,
        completionAvailable: finished,
        receipt: finished
            ? {
                attemptId: QA_ATTEMPT_ID,
                status: 'COMPLETED',
                reason: 'all_answered',
                level,
                gradedCount: 1,
                correctCount: 1,
                acknowledgedCount: 1,
                baseXpEarned: 10,
                streakBonusXp: 0,
                xpEarned: 10,
                heartsRemaining: 5,
                completionEligible: true,
                wordsLearned: 1,
                srsReviewed: 1,
                savedAt,
                contractVersion: 2,
                gradingVersion: 'visual-qa',
            }
            : null,
    }
}

function isSessionVisualQaFixture(params: { fixture?: string } | undefined) {
    return process.env.NODE_ENV !== 'production' && params?.fixture === 'visual-qa'
}

function SessionRouteShell({
    visualState,
    children,
}: {
    visualState: 'default' | 'success'
    children: ReactNode
}) {
    return (
        <div
            className="min-h-[100dvh] bg-gray-50 flex flex-col"
            data-route="session"
            data-slice="slice-1"
            data-module="03-session"
            data-visual-state={visualState}
        >
            {children}
        </div>
    )
}

export default async function SessionPage({
    searchParams,
}: {
    searchParams: Promise<{ state?: string; fixture?: string; level?: string }>
}) {
    const params = await searchParams
    const fixtureLevel = (params.level?.toUpperCase() || 'A1') as CefrLevel

    if (isSessionVisualQaFixture(params)) {
        const isSuccess = params.state === 'success'
        return (
            <SessionRouteShell visualState={isSuccess ? 'success' : 'default'}>
                <SessionPlayerDynamic
                    level={fixtureLevel}
                    userId="visual-qa-user"
                    preview={buildVisualQaPreview(fixtureLevel, isSuccess)}
                />
            </SessionRouteShell>
        )
    }

    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const profile = await prisma.userProfile.findUnique({
        where: { userId: serverUser.userId },
        select: { currentLevel: true },
    })

    const level = (profile?.currentLevel || 'A1') as CefrLevel

    return (
        <SessionRouteShell visualState="default">
            <SessionPlayerDynamic level={level} userId={serverUser.userId} />
        </SessionRouteShell>
    )
}
