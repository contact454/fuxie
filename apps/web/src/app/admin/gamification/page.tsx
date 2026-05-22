import { redirect } from 'next/navigation'

import { getServerUser } from '@/lib/auth/server-auth'
import { getGamificationPilotReadout } from '@/lib/analytics/gamification-pilot-readout'

export const dynamic = 'force-dynamic'

export default async function AdminGamificationPage({
    searchParams,
}: {
    searchParams?: Promise<{ from?: string; to?: string }>
}) {
    const user = await getServerUser()

    if (!user || user.role !== 'ADMIN') {
        redirect('/admin')
    }

    const params = await searchParams
    const range = parseRange(params)
    const readout = await getGamificationPilotReadout(range)

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                        Gamification Pilot
                    </div>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Pilot Balance Readout</h1>
                    <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
                        Measures whether quests, Fucoin, missions, and shop rewards are driving learning behavior instead of reward-only loops.
                    </p>
                </div>

                <form className="grid gap-2 rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-200 sm:grid-cols-[1fr_1fr_auto]">
                    <label className="grid gap-1 font-semibold text-slate-600">
                        From
                        <input name="from" defaultValue={range.from.toISOString().slice(0, 10)} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900" />
                    </label>
                    <label className="grid gap-1 font-semibold text-slate-600">
                        To
                        <input name="to" defaultValue={range.to.toISOString().slice(0, 10)} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900" />
                    </label>
                    <button className="self-end rounded-xl bg-sky-600 px-4 py-2 font-bold text-white hover:bg-sky-700">
                        Refresh
                    </button>
                </form>
            </div>

            <section className={readout.health.warningLevel === 'green'
                ? 'rounded-2xl border border-emerald-200 bg-emerald-50 p-4'
                : readout.health.warningLevel === 'red'
                    ? 'rounded-2xl border border-rose-200 bg-rose-50 p-4'
                    : 'rounded-2xl border border-amber-200 bg-amber-50 p-4'}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={getDecisionPillClass(readout.health.warningLevel)}>
                                {readout.health.warningLevel} pilot state
                            </span>
                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-white">
                                Cohort {readout.health.cohortLabel}
                            </span>
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-950">{readout.health.warningReason}</p>
                        <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-700">
                            {readout.health.recommendedAction}
                        </p>
                    </div>
                    <div className="grid shrink-0 grid-cols-2 gap-2 text-xs font-bold text-slate-700 sm:min-w-[280px]">
                        <PilotRule label="Weekly review" value="PM + Data" />
                        <PilotRule label="Prices/cap" value="Frozen" />
                    </div>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Active Learners" value={readout.counts.activeLearners} detail={`${readout.counts.meaningfulActionUsers} with learning actions`} />
                <MetricCard title="Lesson Completion" value={`${readout.learningLoop.lessonCompletionRate}%`} detail={`${readout.counts.meaningfulActions} meaningful actions`} />
                <MetricCard title="Repeat Study 7d" value={`${readout.learningLoop.repeatStudyWithin7DaysRate}%`} detail={`${readout.learningLoop.repeatStudyWithin7DaysUsers} repeat learners`} />
                <MetricCard title="Reward-Only Risk" value={`${readout.economy.rewardOnlyRate}%`} detail={`${readout.counts.rewardOnlyUsers} reward-only users`} tone={readout.health.rewardOnly} />
                <MetricCard title="Fucoin Earned" value={readout.economy.fucoinEarned} detail={`${readout.economy.averageEarnedPerActiveLearner} avg / active learner`} />
                <MetricCard title="Fucoin Spent" value={readout.economy.fucoinSpent} detail={`${readout.economy.spendToEarnRate}% of earned`} tone={readout.health.spendToEarn} />
                <MetricCard title="Pending Queue" value={readout.rewards.pending} detail={`${readout.rewards.pendingOverSla} over ${readout.thresholds.pendingSlaHours}h`} tone={readout.health.pendingSla} />
                <MetricCard title="Mission Claim Rate" value={`${readout.learningLoop.missionClaimRate}%`} detail={`${readout.learningLoop.missionClaims} claims`} />
                <MetricCard title="Intervention CTR" value={`${readout.interventions.clickThroughRate}%`} detail={`${readout.interventions.clicked}/${readout.interventions.shown} clicked`} />
                <MetricCard title="Intervention Follow-through" value={`${readout.interventions.followThroughRate}%`} detail={`${readout.interventions.followThroughUsers} learners studied after shown`} />
                <MetricCard title="Badge Unlocks" value={readout.mastery.badgeUnlocks} detail={`${readout.mastery.persistentBadgeUnlocks} persistent unlocks`} />
                <MetricCard title="Badge Receipt Clicks" value={readout.mastery.receiptClicks} detail="Learners inspecting badge receipts" />
                <MetricCard title="Quest Episode Completion" value={`${readout.questEpisodes.completionRate}%`} detail={`${readout.questEpisodes.completed}/${readout.questEpisodes.started} completed`} />
                <MetricCard title="Episode Repeat Study" value={`${readout.questEpisodes.repeatStudyAfterEpisodeRate}%`} detail={`${readout.questEpisodes.repeatStudyAfterEpisodeUsers} learners studied after episode`} />
                <MetricCard title="Microgame Completion" value={`${readout.lessonGameplay.microgames.completionRate}%`} detail={`${readout.lessonGameplay.microgames.completed}/${readout.lessonGameplay.microgames.started} completed`} />
                <MetricCard title="Roleplay Completion" value={`${readout.lessonGameplay.roleplay.completionRate}%`} detail={`${readout.lessonGameplay.roleplay.completed}/${readout.lessonGameplay.roleplay.started} completed, ${readout.lessonGameplay.roleplay.practiceNotes} practice notes`} />
                <MetricCard title="First Contact Path" value={readout.lessonGameplay.firstSessionPath.starts} detail={`${readout.lessonGameplay.firstSessionPath.users} users, ${readout.lessonGameplay.firstSessionPath.bossToRoleplayFollowThroughUsers} boss-to-roleplay`} />
                <MetricCard title="Campaign Starts" value={readout.lessonGameplay.campaign.nodeStarts} detail="A1 map node launches" />
                <MetricCard title="Writing Feedback" value={`${readout.writingFeedback.graded}/${readout.writingFeedback.submitted}`} detail={`${readout.writingFeedback.feedbackFailed} AI feedback failures`} tone={readout.writingFeedback.feedbackFailed > 0 ? 'warning' : 'healthy'} />
                <MetricCard title="Writing Follow-through" value={readout.writingFeedback.meaningfulFollowThroughUsers} detail={`${readout.writingFeedback.failureRate}% AI failure rate`} tone={readout.writingFeedback.failureRate > 0 ? 'warning' : 'healthy'} />
                <MetricCard title="Speaking Pronunciation" value={`${readout.speakingPronunciation.evaluated}/${readout.speakingPronunciation.submitted}`} detail={`${readout.speakingPronunciation.feedbackFailed} evaluation failures`} tone={readout.speakingPronunciation.feedbackFailed > 0 ? 'warning' : 'healthy'} />
                <MetricCard title="Speaking Follow-through" value={readout.speakingPronunciation.meaningfulFollowThroughUsers} detail={`${readout.speakingPronunciation.failureRate}% evaluation failure rate`} tone={readout.speakingPronunciation.failureRate > 0 ? 'warning' : 'healthy'} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader title="Action Board" detail="Warning-to-action map for the current pilot window." />
                    <div className="space-y-3 p-5">
                        {readout.health.actions.length > 0 ? readout.health.actions.map((action) => (
                            <ActionRow key={action.code} action={action} />
                        )) : (
                            <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold leading-relaxed text-emerald-800 ring-1 ring-emerald-100">
                                No intervention required. Keep the weekly readout ritual active and continue sending learner CTAs back to meaningful quests.
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader title="Reward Pipeline" detail="Request, approval spend, fulfillment, and rejection counts." />
                    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                        <MiniStat label="Requested" value={readout.rewards.requested} />
                        <MiniStat label="Approved Spend" value={readout.rewards.approvedSpends} />
                        <MiniStat label="Awaiting Fulfillment" value={readout.rewards.awaitingFulfillment} />
                        <MiniStat label="Fulfilled" value={readout.rewards.fulfilled} />
                        <MiniStat label="Rejected" value={readout.rewards.rejected} />
                        <MiniStat label="Freeze Used" value={readout.learningLoop.streakFreezeUsed} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader title="Intervention Loop" detail="Learner nudges shown, clicked, and followed by meaningful study." />
                    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                        <MiniStat label="Shown" value={readout.interventions.shown} />
                        <MiniStat label="Clicked" value={readout.interventions.clicked} />
                        <MiniStat label="Followed Through" value={readout.interventions.followThroughUsers} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader title="Mastery Loop" detail="Skill path progress and badge receipt signals from meaningful study." />
                    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                        <MiniStat label="Mastery Views" value={readout.mastery.viewed} />
                        <MiniStat label="Badge Unlocks" value={readout.mastery.badgeUnlocks} />
                        <MiniStat label="Persistent Unlocks" value={readout.mastery.persistentBadgeUnlocks} />
                        <MiniStat label="Duplicate Guard" value={readout.mastery.duplicatePrevented} />
                        <MiniStat label="Receipt Clicks" value={readout.mastery.receiptClicks} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader title="Quest Episodes" detail="Vocabulary, listening, reading, grammar, writing, and speaking episode starts, checkpoint reach, completion, and post-episode study." />
                    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                        <MiniStat label="Started" value={readout.questEpisodes.started} />
                        <MiniStat label="Checkpoint" value={readout.questEpisodes.checkpointReached} />
                        <MiniStat label="Completed" value={readout.questEpisodes.completed} />
                        <MiniStat label="Dropoff" value={readout.questEpisodes.checkpointDropoff} />
                        <MiniStat label="Repeat Study" value={readout.questEpisodes.repeatStudyAfterEpisodeUsers} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader title="Lesson Gameplay Expansion" detail="First Contact path, microgame pack, situation roleplay, and campaign map launches." />
                    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                        <MiniStat label="First Contact Starts" value={readout.lessonGameplay.firstSessionPath.starts} />
                        <MiniStat label="Path Users" value={readout.lessonGameplay.firstSessionPath.users} />
                        <MiniStat label="Boss to Roleplay" value={readout.lessonGameplay.firstSessionPath.bossToRoleplayFollowThroughUsers} />
                        <MiniStat label="Microgame Starts" value={readout.lessonGameplay.microgames.started} />
                        <MiniStat label="Microgame Done" value={readout.lessonGameplay.microgames.completed} />
                        <MiniStat label="Roleplay Starts" value={readout.lessonGameplay.roleplay.started} />
                        <MiniStat label="Roleplay Done" value={readout.lessonGameplay.roleplay.completed} />
                        <MiniStat label="Practice Notes" value={readout.lessonGameplay.roleplay.practiceNotes} />
                        <MiniStat label="Campaign Starts" value={readout.lessonGameplay.campaign.nodeStarts} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader title="Writing AI Evidence" detail="AI grading reliability for Writing Quest Episodes without storing submitted text." />
                    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                        <MiniStat label="Submitted" value={readout.writingFeedback.submitted} />
                        <MiniStat label="Graded" value={readout.writingFeedback.graded} />
                        <MiniStat label="Feedback Failed" value={readout.writingFeedback.feedbackFailed} />
                        <MiniStat label="Follow-through" value={readout.writingFeedback.meaningfulFollowThroughUsers} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader title="Speaking Pronunciation Evidence" detail="Nachsprechen evaluation reliability without storing audio, transcript, or raw speech." />
                    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                        <MiniStat label="Submitted" value={readout.speakingPronunciation.submitted} />
                        <MiniStat label="Evaluated" value={readout.speakingPronunciation.evaluated} />
                        <MiniStat label="Evaluation Failed" value={readout.speakingPronunciation.feedbackFailed} />
                        <MiniStat label="Follow-through" value={readout.speakingPronunciation.meaningfulFollowThroughUsers} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader title="Ops Policy" detail="Pilot guardrails that must stay true during this sprint." />
                    <div className="space-y-3 p-5 text-sm font-medium text-slate-600">
                        <PolicyRow label="Approve only requestable digital rewards" active={readout.opsPolicy.approveOnlyRequestableDigitalRewards} />
                        <PolicyRow label="Reject reason required for unsupported items" active={readout.opsPolicy.rejectReasonRequiredForUnsupportedItems} />
                        <PolicyRow label="Fulfillment receipt required" active={readout.opsPolicy.fulfillmentReceiptRequired} />
                        <PolicyRow label="Real gifts remain locked" active={readout.opsPolicy.realGiftLocked} />
                    </div>
                </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <SplitTable title="Skill Split" rows={readout.splits.skill} />
                <SplitTable title="Level Split" rows={readout.splits.level} />
                <SplitTable title="Reward Requests" rows={readout.splits.rewardRequestsByCategory} />
                <SplitTable title="Reward Approvals" rows={readout.splits.rewardApprovalsByCategory} />
                <SplitTable title="Reward Fulfillments" rows={readout.splits.rewardFulfillmentsByCategory} />
                <SplitTable title="Rejected Reasons" rows={readout.splits.rejectedReasons} />
                <SplitTable title="Interventions" rows={readout.interventions.byCode} />
                <SplitTable title="Mastery By Skill" rows={readout.mastery.progressBySkill} />
                <SplitTable title="Mastery By CEFR" rows={readout.mastery.progressByLevel} />
                <SplitTable title="Badge Unlocks" rows={readout.mastery.badgeUnlocksByBadge} />
                <SplitTable title="Badge Unlocks By Skill" rows={readout.mastery.badgeUnlocksBySkill} />
                <SplitTable title="Badge Unlocks By CEFR" rows={readout.mastery.badgeUnlocksByLevel} />
                <SplitTable title="Episodes By Skill" rows={readout.questEpisodes.bySkill} />
                <SplitTable title="Episodes By Theme" rows={readout.questEpisodes.byTheme} />
                <SplitTable title="Episodes By CEFR" rows={readout.questEpisodes.byLevel} />
                <SplitTable title="Episode Accuracy" rows={readout.questEpisodes.byAccuracyBand} />
                <SplitTable title="Episode Checkpoints" rows={readout.questEpisodes.checkpointById} />
                <SplitTable title="First Contact Steps" rows={readout.lessonGameplay.firstSessionPath.byStep} />
                <SplitTable title="Microgames By Game" rows={readout.lessonGameplay.microgames.byGame} />
                <SplitTable title="Microgames By Theme" rows={readout.lessonGameplay.microgames.byTheme} />
                <SplitTable title="Roleplay Scenarios" rows={readout.lessonGameplay.roleplay.byScenario} />
                <SplitTable title="Roleplay Receipt States" rows={readout.lessonGameplay.roleplay.byReceiptState} />
                <SplitTable title="Roleplay Score Bands" rows={readout.lessonGameplay.roleplay.byScoreBand} />
                <SplitTable title="Campaign Nodes" rows={readout.lessonGameplay.campaign.byNode} />
                <SplitTable title="Campaign Paths" rows={readout.lessonGameplay.campaign.byPath} />
                <SplitTable title="Writing Feedback Status" rows={readout.writingFeedback.byFeedbackStatus} />
                <SplitTable title="Writing Feedback Errors" rows={readout.writingFeedback.byErrorType} />
                <SplitTable title="Speaking Feedback Status" rows={readout.speakingPronunciation.byFeedbackStatus} />
                <SplitTable title="Speaking Feedback Errors" rows={readout.speakingPronunciation.byErrorType} />
                <SplitTable title="Speaking Score Bands" rows={readout.speakingPronunciation.byScoreBand} />
            </div>
        </div>
    )
}

function ActionRow({
    action,
}: {
    action: {
        code: string
        warningLevel: 'green' | 'yellow' | 'red'
        warningReason: string
        recommendedAction: string
        owner: string
    }
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={getDecisionPillClass(action.warningLevel)}>{action.code.replaceAll('_', ' ')}</span>
                <span className="text-xs font-bold text-slate-500">{action.owner}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">{action.warningReason}</p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">{action.recommendedAction}</p>
        </div>
    )
}

function MetricCard({
    title,
    value,
    detail,
    tone = 'healthy',
}: {
    title: string
    value: number | string
    detail: string
    tone?: 'healthy' | 'warning'
}) {
    const toneClass = tone === 'warning'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-emerald-50 text-emerald-700 ring-emerald-200'

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{formatValue(value)}</p>
            <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneClass}`}>{detail}</p>
        </div>
    )
}

function PilotRule({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-white">
            <p className="uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-slate-950">{value}</p>
        </div>
    )
}

function getDecisionPillClass(level: 'green' | 'yellow' | 'red') {
    if (level === 'red') return 'rounded-full bg-rose-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white'
    if (level === 'yellow') return 'rounded-full bg-amber-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white'
    return 'rounded-full bg-emerald-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white'
}

function MiniStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value.toLocaleString('vi-VN')}</p>
        </div>
    )
}

function SplitTable({
    title,
    rows,
}: {
    title: string
    rows: Array<{ key: string; events: number; users: number }>
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader title={title} detail="Events and unique learner count." />
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Key</th>
                            <th className="px-4 py-3 text-right font-medium">Events</th>
                            <th className="px-4 py-3 text-right font-medium">Users</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.length > 0 ? rows.slice(0, 8).map((row) => (
                            <tr key={row.key}>
                                <td className="max-w-48 truncate px-4 py-3 font-semibold text-slate-800">{row.key}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{row.events.toLocaleString('vi-VN')}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{row.users.toLocaleString('vi-VN')}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">No data in range.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

function SectionHeader({ title, detail }: { title: string; detail: string }) {
    return (
        <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
    )
}

function PolicyRow({ label, active }: { label: string; active: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
            <span>{label}</span>
            <span className={active ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>
                {active ? 'Active' : 'Off'}
            </span>
        </div>
    )
}

function parseRange(params?: { from?: string; to?: string }) {
    const today = new Date()
    const to = isDateParam(params?.to) ? endOfDay(params.to) : endOfDay(today.toISOString().slice(0, 10))
    const defaultFrom = new Date(to)
    defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 13)
    const from = isDateParam(params?.from) ? startOfDay(params.from) : startOfDay(defaultFrom.toISOString().slice(0, 10))

    return from.getTime() <= to.getTime()
        ? { from, to }
        : { from: startOfDay(defaultFrom.toISOString().slice(0, 10)), to }
}

function isDateParam(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function startOfDay(value: string) {
    return new Date(`${value}T00:00:00.000Z`)
}

function endOfDay(value: string) {
    return new Date(`${value}T23:59:59.999Z`)
}

function formatValue(value: number | string) {
    return typeof value === 'number' ? value.toLocaleString('vi-VN') : value
}
