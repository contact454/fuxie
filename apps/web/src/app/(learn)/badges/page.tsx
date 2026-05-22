import { redirect } from 'next/navigation'
import Image from 'next/image'
import { Award, CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react'

import { prisma } from '@fuxie/database'
import { MeasuredLink } from '@/components/performance/measured-link'
import { FuxieBadge, FuxiePanel, FuxieProgressBar, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { getServerUser } from '@/lib/auth/server-auth'
import { buildBadgeAlbum } from '@/lib/gamification/lesson-gameplay-expansion'
import { FUXIE_WORLD_PROPS } from '@/lib/mascot/fuxie-assets'
import type { MasteryEvent } from '@/lib/gamification/skill-mastery'
import {
    isSlice3VisualQaFixture,
    Slice3RewardsSuccessFixture,
} from '@/components/visual-fixtures/slice-3-motivation-fixtures'

export const metadata = {
    title: 'Fuxie - Badge Album',
    description: 'Persistent badge album and collection shelf for Fuxie learners.',
}

export default async function BadgeAlbumPage({ searchParams }: { searchParams: Promise<{ state?: string; fixture?: string }> }) {
    const visualParams = await searchParams
    if (isSlice3VisualQaFixture(visualParams, 'success')) {
        return <Slice3RewardsSuccessFixture />
    }

    const user = await getServerUser()
    if (!user) redirect('/login')

    const since = new Date()
    since.setDate(since.getDate() - 89)

    const [events, userAchievements, profile] = await Promise.all([
        prisma.analyticsEvent.findMany({
            where: {
                userId: user.userId,
                role: 'LEARNER',
                eventName: 'meaningful_action_completed',
                createdAt: { gte: since },
            },
            select: {
                userId: true,
                eventName: true,
                actionId: true,
                actionType: true,
                level: true,
                skill: true,
                metadata: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.userAchievement.findMany({
            where: { userId: user.userId },
            select: {
                achievementId: true,
                earnedAt: true,
            },
            orderBy: { earnedAt: 'desc' },
        }),
        prisma.userProfile.findUnique({
            where: { userId: user.userId },
            select: { currentLevel: true },
        }),
    ])
    const achievements = userAchievements.length > 0
        ? await prisma.achievement.findMany({
            where: { id: { in: userAchievements.map((item) => item.achievementId) } },
            select: { id: true, slug: true },
        })
        : []

    const album = buildBadgeAlbum({
        events: events as MasteryEvent[],
        earnedBadgeSlugs: achievements.map((item) => item.slug),
        currentLevel: profile?.currentLevel ?? 'A1',
    })
    const earned = album.filter((badge) => badge.displayState === 'earned')
    const ready = album.filter((badge) => badge.displayState === 'ready')
    const locked = album.filter((badge) => badge.displayState === 'locked')

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
            <FuxiePanel variant="hero" className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <FuxieBadge tone="reward" className="normal-case tracking-normal">
                                Badge Album
                            </FuxieBadge>
                            <FuxieBadge tone="neutral" className="normal-case tracking-normal">
                                {earned.length}/{album.length} earned
                            </FuxieBadge>
                        </div>
                        <h1 className="mt-3 text-3xl font-black text-text-primary sm:text-4xl">
                            Ke thanh tuu hoc tap cua em
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-text-brand">
                            Badge chi mo tu meaningful completion. Album giup learner thay thanh tuu that, khong bien shop hay click thanh dong luc chinh.
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <Image
                            src={FUXIE_WORLD_PROPS.badgeShelf}
                            alt=""
                            width={112}
                            height={112}
                            className="hidden h-24 w-24 object-contain drop-shadow-sm sm:block"
                        />
                        <MeasuredLink
                            href="/campaign"
                            flow="badges.campaign.next"
                            source="badge-album"
                            className={fuxieButtonClass('primary', 'md', 'shrink-0')}
                        >
                            Tim badge tiep theo
                        </MeasuredLink>
                    </div>
                </div>
            </FuxiePanel>

            <div className="grid gap-4 sm:grid-cols-3">
                <AlbumStat label="Earned" value={earned.length} tone="success" />
                <AlbumStat label="Ready" value={ready.length} tone="reward" />
                <AlbumStat label="Locked" value={locked.length} tone="brand" />
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {album.map((badge) => (
                    <FuxiePanel
                        key={badge.id}
                        className={`p-5 ${
                            badge.displayState === 'earned'
                                ? 'ring-2 ring-emerald-200'
                                : badge.displayState === 'ready'
                                    ? 'ring-2 ring-[#FFD166]/70'
                                    : ''
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${
                                badge.displayState === 'earned'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : badge.displayState === 'ready'
                                        ? 'bg-[#FFF7D6] text-text-reward'
                                        : 'bg-slate-100 text-slate-500'
                            }`}>
                                {badge.displayState === 'earned'
                                    ? <CheckCircle2 className="h-6 w-6" />
                                    : badge.displayState === 'ready'
                                        ? <Sparkles className="h-6 w-6" />
                                        : <LockKeyhole className="h-6 w-6" />}
                            </span>
                            <FuxieBadge tone={badge.displayState === 'earned' ? 'success' : badge.displayState === 'ready' ? 'reward' : 'neutral'} className="normal-case tracking-normal">
                                {badge.displayState}
                            </FuxieBadge>
                        </div>
                        <h2 className="mt-4 text-lg font-black text-text-primary">{badge.title}</h2>
                        <p className="mt-2 min-h-[52px] text-sm font-semibold leading-relaxed text-slate-600">
                            {badge.description}
                        </p>
                        <div className="mt-4">
                            <div className="mb-1.5 flex items-center justify-between text-xs font-black text-slate-500">
                                <span>{badge.requirement}</span>
                                <span>{badge.progress}%</span>
                            </div>
                            <FuxieProgressBar value={badge.displayState === 'earned' ? 100 : badge.progress} tone={badge.displayState === 'earned' ? 'success' : 'reward'} />
                        </div>
                    </FuxiePanel>
                ))}
            </section>
        </div>
    )
}

function AlbumStat({
    label,
    value,
    tone,
}: {
    label: string
    value: number
    tone: 'brand' | 'reward' | 'success'
}) {
    return (
        <FuxiePanel className="p-5">
            <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#F3FBFF] text-text-brand">
                    <Award className="h-5 w-5" />
                </span>
                <div>
                    <p className="text-sm font-bold text-slate-500">{label}</p>
                    <p className="text-3xl font-black text-text-primary">{value}</p>
                </div>
            </div>
            <FuxieProgressBar value={Math.min(100, value * 12)} tone={tone} className="mt-4" />
        </FuxiePanel>
    )
}
