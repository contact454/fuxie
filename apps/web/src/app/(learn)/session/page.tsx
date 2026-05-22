import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { prisma } from '@fuxie/database'
import { SessionPlayerDynamic } from '@/components/session/SessionPlayerDynamic'
import { buildDailySession, type SessionItem } from '@/lib/session/builder'
import type { ExerciseResult } from '@/lib/session/types'
import type { CefrLevel } from '@fuxie/database'
import type { ReactNode } from 'react'

export const metadata = {
    title: 'Fuxie 🦊 — Tự Động Học',
    description: 'Học thông minh với lộ trình Fuxie được thiết kế riêng cho bạn.',
}

const SESSION_VISUAL_QA_ITEMS: SessionItem[] = [
    {
        id: 'visual-session-1',
        type: 'VOCAB_NEW',
        format: 'INTRO',
        points: 10,
        data: {
            term: 'der Termin',
            meaning: 'cuộc hẹn',
            article: 'der',
            partOfSpeech: 'noun',
            exampleSentence: 'Ich habe morgen einen Termin.',
        },
    },
    {
        id: 'visual-session-2',
        type: 'VOCAB_REVIEW',
        format: 'MULTIPLE_CHOICE',
        points: 10,
        data: {
            term: 'pünktlich',
            meaning: 'đúng giờ',
            partOfSpeech: 'adjective',
            options: ['đúng giờ', 'muộn', 'đắt', 'mệt'],
            correctIndex: 0,
        },
    },
    {
        id: 'visual-session-3',
        type: 'GRAMMAR',
        format: 'MULTIPLE_CHOICE',
        points: 15,
        data: {
            lessonId: 'visual-grammar-a1',
            topicTitle: 'Perfekt',
            questionDe: 'Ich ___ gestern gelernt.',
            questionNative: 'Chọn trợ động từ đúng.',
            options: ['bin', 'habe', 'war', 'werde'],
            correctIndex: 1,
            explanation: 'Mit lernen nutzt du im Perfekt meistens haben.',
        },
    },
    {
        id: 'visual-session-4',
        type: 'VOCAB_REVIEW',
        format: 'TYPING',
        points: 10,
        data: {
            term: 'wiederholen',
            meaning: 'ôn lại',
            partOfSpeech: 'verb',
            exampleSentence: 'Wir wiederholen die Wörter.',
        },
    },
]

const SESSION_VISUAL_QA_RESULTS: ExerciseResult[] = SESSION_VISUAL_QA_ITEMS.map((item) => ({
    id: item.id,
    type: item.type,
    data: item.data,
    correct: true,
}))

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

    if (isSessionVisualQaFixture(params) && params.state === 'success') {
        return (
            <SessionRouteShell visualState="success">
                <SessionPlayerDynamic
                    level={fixtureLevel}
                    initialItems={SESSION_VISUAL_QA_ITEMS}
                    initialFinished
                    initialResults={SESSION_VISUAL_QA_RESULTS}
                    initialScore={45}
                    initialHearts={5}
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
    const initialItems = await buildDailySession(serverUser.userId, level)

    return (
        <SessionRouteShell visualState="default">
            <SessionPlayerDynamic level={level} initialItems={initialItems} />
        </SessionRouteShell>
    )
}
