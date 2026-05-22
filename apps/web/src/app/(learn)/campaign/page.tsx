import { redirect } from 'next/navigation'
import { ArrowRight, CheckCircle2, Flag, MapPinned } from 'lucide-react'

import { prisma } from '@fuxie/database'
import { MeasuredLink } from '@/components/performance/measured-link'
import { FuxieBadge, FuxiePanel, FuxieProgressBar, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { getServerUser } from '@/lib/auth/server-auth'
import {
    A1_CAMPAIGN_NODES,
    buildCampaignNodeProgress,
} from '@/lib/gamification/lesson-gameplay-expansion'
import type { MasteryEvent } from '@/lib/gamification/skill-mastery'

export const metadata = {
    title: 'Fuxie - Quest Campaign Map',
    description: 'A1 starter campaign map for vocabulary, roleplay, listening, reading, and writing quests.',
}

export default async function CampaignMapPage() {
    const user = await getServerUser()
    if (!user) redirect('/login')

    const since = new Date()
    since.setDate(since.getDate() - 89)
    const events = await prisma.analyticsEvent.findMany({
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
    })

    const meaningfulEvents = events as MasteryEvent[]
    const progressByNode = A1_CAMPAIGN_NODES.map((node) => buildCampaignNodeProgress({ node, meaningfulEvents }))
    const completedCount = progressByNode.filter((node) => node.completed).length
    const overall = Math.round(progressByNode.reduce((sum, node) => sum + node.progress, 0) / Math.max(1, progressByNode.length))

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
            <FuxiePanel variant="hero" className="overflow-hidden p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <FuxieBadge tone="brand" className="normal-case tracking-normal">
                                Quest Campaign Map
                            </FuxieBadge>
                            <FuxieBadge tone="success" className="normal-case tracking-normal">
                                A1 Starter Path
                            </FuxieBadge>
                        </div>
                        <h1 className="mt-3 text-3xl font-black leading-tight text-text-primary sm:text-4xl">
                            Di qua mot hanh trinh tieng Duc co node ro rang
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-text-brand">
                            Campaign map gom microgame, lesson episode va roleplay thanh mot path. Learner van co the hoc tu do, nhung luon thay node tiep theo.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/75 p-4 ring-1 ring-white">
                        <p className="text-xs font-black uppercase text-text-brand">Path progress</p>
                        <p className="mt-1 text-3xl font-black text-text-primary">{completedCount}/{A1_CAMPAIGN_NODES.length}</p>
                        <FuxieProgressBar value={overall} className="mt-3 w-48" />
                        <p className="mt-2 max-w-56 text-xs font-semibold leading-relaxed text-slate-500">
                            Mỗi cột mốc là một bước tiến mới. Hoàn thành thử thách để tích lũy kinh nghiệm.
                        </p>
                    </div>
                </div>
            </FuxiePanel>

            <section className="relative grid gap-5">
                <div className="absolute bottom-8 left-8 top-8 hidden w-1 rounded-full bg-[#CCE4F0] md:block" />
                {A1_CAMPAIGN_NODES.map((node, index) => {
                    const progress = progressByNode.find((item) => item.nodeId === node.id)!
                    const isDone = progress.completed
                    const nodeTone = progress.state === 'cleared'
                        ? 'success'
                        : progress.state === 'ready_for_boss'
                            ? 'reward'
                            : progress.state === 'in_progress'
                                ? 'brand'
                                : 'neutral'

                    return (
                        <FuxiePanel key={node.id} className="relative overflow-hidden p-5 md:ml-14">
                            <span className={`absolute left-5 top-5 hidden h-10 w-10 -translate-x-[72px] place-items-center rounded-2xl text-white shadow-lg md:grid ${
                                isDone ? 'bg-emerald-500' : node.boss ? 'bg-[#FFB703]' : 'bg-[#60A8E4]'
                            }`}>
                                {isDone ? <CheckCircle2 className="h-5 w-5" /> : node.boss ? <Flag className="h-5 w-5" /> : <MapPinned className="h-5 w-5" />}
                            </span>
                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <FuxieBadge tone={isDone ? 'success' : node.boss ? 'reward' : 'brand'} className="normal-case tracking-normal">
                                            Node {index + 1}
                                        </FuxieBadge>
                                        <FuxieBadge tone={nodeTone} className="normal-case tracking-normal">
                                            {progress.stateLabel}
                                        </FuxieBadge>
                                        <FuxieBadge tone="neutral" className="normal-case tracking-normal">
                                            {node.primarySkill}
                                        </FuxieBadge>
                                    </div>
                                    <h2 className="mt-3 text-2xl font-black text-text-primary">{node.title}</h2>
                                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{node.objective}</p>
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                        {node.supportHrefs.map((support) => (
                                            <MeasuredLink
                                                key={support.href}
                                                href={support.href}
                                                flow="campaign.support.open"
                                                source={`${node.id}:${support.skill}`}
                                                analytics={{
                                                    eventName: 'quest_episode_started',
                                                    source: 'campaign_map.support_started',
                                                    actionId: `campaign:${node.id}:${support.skill}`,
                                                    actionType: support.skill === 'speaking'
                                                        ? 'speaking_submission'
                                                        : support.skill === 'writing'
                                                            ? 'writing_submission'
                                                            : support.skill === 'listening'
                                                                ? 'listening_task'
                                                                : support.skill === 'reading'
                                                                    ? 'reading_task'
                                                                    : 'vocabulary_practice',
                                                    level: node.cefrLevel,
                                                    skill: support.skill,
                                                    metadata: {
                                                        campaignNodeId: node.id,
                                                        campaignPathId: 'a1-starter',
                                                        skill: support.skill,
                                                        surface: 'campaign_map',
                                                    },
                                                }}
                                                className="rounded-2xl bg-[#F3FBFF] px-4 py-3 text-sm font-bold text-text-brand ring-1 ring-[#CCE4F0]/70 transition hover:bg-white"
                                            >
                                                {support.label}
                                            </MeasuredLink>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between text-xs font-black text-slate-500">
                                            <span>Node evidence</span>
                                            <span>{progress.progress}%</span>
                                        </div>
                                        <FuxieProgressBar value={progress.progress} tone={isDone ? 'success' : node.boss ? 'reward' : 'brand'} />
                                        <p className="mt-2 text-xs font-semibold text-slate-500">
                                            {progress.evidenceCount > 0
                                                ? `${progress.evidenceCount} learning signal(s) found in the pilot window. ${progress.stateReason}`
                                                : progress.stateReason}
                                        </p>
                                    </div>
                                    <MeasuredLink
                                        href={node.href}
                                        flow="campaign.node.start"
                                        source={node.id}
                                        analytics={{
                                            eventName: 'quest_episode_started',
                                            source: 'campaign_map.node_started',
                                            actionId: `campaign:${node.id}`,
                                            actionType: node.primarySkill === 'speaking'
                                                ? 'speaking_submission'
                                                : node.primarySkill === 'listening'
                                                    ? 'listening_task'
                                                    : 'vocabulary_practice',
                                            level: node.cefrLevel,
                                            skill: node.primarySkill,
                                            metadata: {
                                                campaignNodeId: node.id,
                                                campaignPathId: 'a1-starter',
                                                themeSlug: node.themeSlug,
                                                skill: node.primarySkill,
                                                surface: 'campaign_map',
                                            },
                                        }}
                                        className={fuxieButtonClass(node.boss ? 'reward' : 'primary', 'md', 'mt-5 w-full')}
                                    >
                                        Start node
                                        <ArrowRight className="h-4 w-4" />
                                    </MeasuredLink>
                                </div>
                            </div>
                        </FuxiePanel>
                    )
                })}
            </section>
        </div>
    )
}
