/**
 * Speaking lesson roleplay sub-route.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (companion behavior)
 *
 * Spec source-of-truth:
 *   - Task 11.2 (gamified-ui-asset-rollout)
 *   - design.md §I.4 — Speaking roleplay layout (companion mascot opposite
 *     learner avatar on the same horizontal axis).
 *   - requirements.md Req 6.7
 *
 * Layout contract delivered by this page:
 *   - Renders a `RoleplayStage` shell whose two slots
 *     (`data-role="roleplay-mascot-slot"` and
 *     `data-role="roleplay-avatar-slot"`) sit on the same y-axis with
 *     opposite x positions (Requirement 6.7 acceptance).
 *   - The companion mascot is resolved through `MascotRoleHost
 *     surfaceId="speaking-roleplay" state="default"` so the role comes from
 *     `SURFACE_MASCOT_CONFIG['speaking-roleplay'].states.default ===
 *     'companion'`.
 *   - The existing `SituationRoleplayClient` is mounted underneath the
 *     stage so the bounded AI roleplay flow keeps working unchanged.
 *
 * Validates: Requirement 6.7
 */

import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'

import { prisma } from '@fuxie/database'

import { SituationRoleplayClient } from '@/components/gameplay/SituationRoleplayClient'
import { RoleplayStage } from '@/components/speaking/roleplay-stage'
import { getServerUser } from '@/lib/auth/server-auth'
import { getRoleplayScenarioById } from '@/lib/gamification/lesson-gameplay-expansion'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lessonId: string }>
}) {
    const { lessonId } = await params
    const lesson = await prisma.speakingLesson.findUnique({
        where: { id: lessonId },
        select: { titleDe: true, translations: true },
    })
    return {
        title: lesson
            ? `Fuxie - Roleplay ${(lesson.translations as any)?.['vi'] || lesson.titleDe}`
            : 'Fuxie - Speaking Roleplay',
        description: 'Bounded AI roleplay scenario for speaking practice.',
    }
}

export default async function SpeakingLessonRoleplayPage({
    params,
    searchParams,
}: {
    params: Promise<{ lessonId: string }>
    searchParams?: Promise<{ scenario?: string; level?: string }>
}) {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const { lessonId } = await params
    const search = (await searchParams) ?? {}

    const lesson = await prisma.speakingLesson.findUnique({
        where: { id: lessonId },
        select: {
            id: true,
            titleDe: true,
            translations: true,
            level: true,
        },
    })
    if (!lesson) notFound()

    const scenario = getRoleplayScenarioById(search.scenario)
    const cefrLevel =
        search.level && /^[ABC][12]$/.test(search.level)
            ? search.level
            : (lesson.level || scenario.cefrLevel)

    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'vi'
    const lessonTitle =
        (lesson.translations as any)?.[locale] || lesson.titleDe

    // Resolve a friendly learner display name for the avatar placeholder.
    // Falls back gracefully when the auth payload omits it.
    const learnerName =
        (serverUser as { displayName?: string; name?: string; email?: string })
            .displayName ||
        (serverUser as { name?: string }).name ||
        (serverUser as { email?: string }).email ||
        null

    return (
        <main
            data-surface-id="speaking-roleplay"
            className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8"
        >
            <RoleplayStage
                learnerName={learnerName}
                mascotAlt="Fuxie companion"
            >
                <span
                    data-role="roleplay-stage-title"
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#173B56] shadow-sm ring-1 ring-[#CCE4F0]/70"
                >
                    {lessonTitle}
                </span>
            </RoleplayStage>

            <div data-role="roleplay-flow" className="mt-6">
                <SituationRoleplayClient
                    scenario={scenario}
                    level={cefrLevel}
                />
            </div>
        </main>
    )
}
