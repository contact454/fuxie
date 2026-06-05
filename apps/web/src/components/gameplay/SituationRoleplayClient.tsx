'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { FuxieCoach, RewardPreview } from '@/components/gamification/quest-visuals'
import { MeasuredLink } from '@/components/performance/measured-link'
import { FuxieBadge, FuxiePanel, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { trackClientAnalyticsEvent } from '@/lib/analytics/client-events'
import {
    GERMAN_ROLEPLAY_SCENARIOS,
    type GermanRoleplayScenario,
} from '@/lib/gamification/lesson-gameplay-expansion'

const TurnBasedSpeakingPlayer = dynamic(() => import('@/components/speaking/TurnBasedSpeakingPlayer'), {
    ssr: false,
    loading: () => <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-text-brand">Loading roleplay...</div>,
})

interface SituationRoleplayClientProps {
    scenario: GermanRoleplayScenario
    level: string
}

type Phase = 'briefing' | 'play' | 'receipt'
type RoleplayReceiptState = 'practice_note' | 'completed_scored'

export function SituationRoleplayClient({ scenario, level }: SituationRoleplayClientProps) {
    const t = useTranslations('SituationRoleplay')
    const router = useRouter()
    const [phase, setPhase] = useState<Phase>('briefing')
    const [score, setScore] = useState(0)
    const [receiptState, setReceiptState] = useState<RoleplayReceiptState>('practice_note')
    const [scoredResponses, setScoredResponses] = useState(0)
    const [gradingResult, setGradingResult] = useState<any>(null)

    const episodeId = `roleplay:${scenario.id}:${level}`
    const showQaScoredReceipt = process.env.NODE_ENV !== 'production'

    const startRoleplay = () => {
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_started',
            source: 'speaking.roleplay.started',
            actionId: episodeId,
            actionType: 'speaking_submission',
            level,
            skill: 'speaking',
            metadata: {
                episodeId,
                skill: 'speaking',
                scenarioId: scenario.id,
                cefrLevel: level,
                surface: 'situation_roleplay',
                checkpointId: 'briefing',
                checkpointCount: 3,
            },
        })
        setPhase('play')
    }

    const completeRoleplay = (finalScore: number, detail?: { scoredResponses?: number, gradingResult?: any }) => {
        const responseCount = detail?.scoredResponses ?? (finalScore > 0 ? 1 : 0)
        const nextReceiptState: RoleplayReceiptState = responseCount > 0 ? 'completed_scored' : 'practice_note'
        setScore(finalScore)
        setScoredResponses(responseCount)
        if (detail?.gradingResult) {
            setGradingResult(detail.gradingResult)
        }
        setReceiptState(nextReceiptState)
        if (nextReceiptState === 'completed_scored') {
            trackClientAnalyticsEvent({
                eventName: 'quest_episode_completed',
                source: 'speaking.roleplay.completed',
                actionId: episodeId,
                actionType: 'speaking_submission',
                level,
                skill: 'speaking',
                metadata: {
                    episodeId,
                    skill: 'speaking',
                    scenarioId: scenario.id,
                    cefrLevel: level,
                    scorePercent: finalScore,
                    accuracyBand: scoreBand(finalScore),
                    checkpointCount: 3,
                    completedCheckpoints: 3,
                    receiptState: nextReceiptState,
                    scoredResponses: responseCount,
                    nextAction: finalScore >= 50 ? 'speaking-index' : 'retry-roleplay',
                    surface: 'situation_roleplay',
                },
            })
        } else {
            trackClientAnalyticsEvent({
                eventName: 'quest_episode_practice_note',
                source: 'speaking.roleplay.practice_note',
                actionId: episodeId,
                actionType: 'speaking_submission',
                level,
                skill: 'speaking',
                metadata: {
                    episodeId,
                    skill: 'speaking',
                    scenarioId: scenario.id,
                    cefrLevel: level,
                    checkpointCount: 3,
                    completedCheckpoints: 1,
                    receiptState: nextReceiptState,
                    scoredResponses: responseCount,
                    nextAction: 'retry-roleplay',
                    surface: 'situation_roleplay',
                },
            })
        }
        setPhase('receipt')
    }

    if (phase === 'play') {
        return (
            <TurnBasedSpeakingPlayer
                level={level}
                scenario={scenario.title}
                onClose={() => setPhase('briefing')}
                onComplete={completeRoleplay}
            />
        )
    }

    if (phase === 'receipt') {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <FuxiePanel variant="hero" className="p-6">
                    <div className="text-center">
                        <FuxieBadge tone={score >= 70 ? 'success' : 'reward'} className="normal-case tracking-normal">
                            {receiptState === 'completed_scored' ? 'Hoàn thành Roleplay' : 'Chưa tính điểm'}
                        </FuxieBadge>
                        <h1 className="mt-4 text-3xl font-black text-text-primary">
                            {receiptState === 'completed_scored'
                                ? score >= 70 ? 'Tình huống đã xử lý tốt' : 'Cần thêm một vòng nói chậm'
                                : 'Chưa hoàn thành Roleplay'}
                        </h1>
                        <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-relaxed text-text-brand">
                            {receiptState === 'completed_scored'
                                ? `Điểm đánh giá tổng hợp: ${score}%`
                                : 'Em cần ghi âm ít nhất một câu và bấm kết thúc roleplay để có kết quả.'}
                        </p>
                    </div>

                    {gradingResult ? (
                        <div className="mt-8 space-y-6">
                            {/* Overall Feedback */}
                            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">{t('overallFeedbackTitle')}</h3>
                                <p className="mt-2 text-base font-medium text-slate-800">{gradingResult.overallFeedbackNative}</p>
                            </div>
                            
                            {/* Rubric Criteria */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                {gradingResult.criteria.map((cr: any) => (
                                    <div key={cr.id} className="rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/70">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-700">{cr.nameNative}</p>
                                            <span className="text-sm font-black text-blue-600">{cr.score}/{cr.maxScore}</span>
                                        </div>
                                        <p className="mt-2 text-xs font-semibold text-slate-600">{cr.reasoningNative}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Corrections */}
                            {gradingResult.corrections && gradingResult.corrections.length > 0 && (
                                <div>
                                    <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">{t('errorsToFixTitle')}</h3>
                                    <div className="space-y-3">
                                        {gradingResult.corrections.map((corr: any, idx: number) => (
                                            <div key={idx} className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                    <span className="text-sm font-medium text-red-600 line-through">{corr.original}</span>
                                                    <span className="hidden sm:inline text-slate-400">→</span>
                                                    <span className="text-sm font-bold text-emerald-600">{corr.corrected}</span>
                                                    <span className="ml-auto inline-flex items-center rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500">{corr.typeNative}</span>
                                                </div>
                                                <p className="mt-2 text-xs font-medium text-slate-600">{corr.explanationNative}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="mx-auto mt-5 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
                                {[
                                    { label: 'Listen', detail: 'Nghe Fuxie đặt tình huống' },
                                    { label: 'Record', detail: 'Nói ít nhất một câu của em' },
                                    { label: 'Refine', detail: 'Xem điểm rồi quyết định luyện lại' },
                                ].map((checkpoint) => (
                                    <div key={checkpoint.label} className="rounded-2xl bg-[#F3FBFF] p-3 ring-1 ring-[#CCE4F0]/70">
                                        <p className="text-xs font-black uppercase text-text-brand">{checkpoint.label}</p>
                                        <p className="mt-1 text-sm font-bold text-slate-700">{checkpoint.detail}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 grid gap-3 text-left sm:grid-cols-3">
                                {scenario.successCriteria.map((criterion) => (
                                    <div key={criterion} className="rounded-2xl bg-white/80 p-3 text-sm font-bold text-slate-700 ring-1 ring-white">
                                        {criterion}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button type="button" onClick={() => setPhase('briefing')} className={fuxieButtonClass('secondary', 'md')}>
                            {receiptState === 'completed_scored' ? 'Luyện lại để nâng điểm' : 'Thử lại roleplay'}
                        </button>
                        <MeasuredLink href="/speaking" flow="roleplay.back.speaking" source={scenario.id} className={fuxieButtonClass('primary', 'md')}>
                            Về trang Speaking
                            <ArrowRight className="h-4 w-4" />
                        </MeasuredLink>
                    </div>
                </FuxiePanel>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
            <button type="button" onClick={() => router.push('/speaking')} className={fuxieButtonClass('ghost', 'sm')}>
                <ArrowLeft className="h-4 w-4" />
                Ve Speaking
            </button>

            <FuxiePanel variant="hero" className="overflow-hidden p-5 sm:p-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <FuxieBadge tone="brand" className="normal-case tracking-normal">
                                German Situation Roleplay
                            </FuxieBadge>
                            <FuxieBadge tone="neutral" className="normal-case tracking-normal">
                                {level} bounded scenario
                            </FuxieBadge>
                        </div>
                        <h1 className="mt-4 text-3xl font-black leading-tight text-text-primary sm:text-4xl">
                            {scenario.title}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-text-brand">
                            {scenario.situation} Muc tieu: {scenario.objective}
                        </p>
                        <p className="mt-2 max-w-2xl text-xs font-bold uppercase tracking-[0.08em] text-text-brand/75">
                            Completion receipt chi hien sau khi em ket thuc mot luot co diem.
                        </p>
                        <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-bold text-slate-700 ring-1 ring-white">
                            <p className="text-xs font-black uppercase tracking-[0.08em] text-text-brand">{t('roleplayChecklistTitle')}</p>
                            <p className="mt-2">{t('roleplayChecklistDetail')}</p>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {scenario.successCriteria.map((criterion) => (
                                <div key={criterion} className="rounded-2xl bg-white/75 p-4 ring-1 ring-white">
                                    <ShieldCheck className="h-5 w-5 text-text-success" />
                                    <p className="mt-2 text-sm font-bold text-slate-700">{criterion}</p>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={startRoleplay} className={fuxieButtonClass('primary', 'lg', 'mt-6 w-full sm:w-auto')}>
                            Bat dau roleplay
                            <MessageCircle className="h-4 w-4" />
                        </button>
                        {showQaScoredReceipt ? (
                            <button
                                type="button"
                                onClick={() => completeRoleplay(82, { scoredResponses: 1 })}
                                className={fuxieButtonClass('secondary', 'md', 'mt-3 w-full sm:w-auto sm:ml-3')}
                            >
                                QA scored receipt
                            </button>
                        ) : null}
                    </div>

                    <div className="space-y-4">
                        <FuxieCoach
                            role="coach"
                            eyebrow="Safe AI loop"
                            title={t('noRawSpeechTitle')}
                            message="Scenario v1 chi track scenario id, score band va completion. Audio/transcript khong duoc dua vao metadata."
                            className="bg-white"
                        />
                        <FuxiePanel className="p-4">
                            <p className="text-xs font-black uppercase text-text-brand">Starter phrase</p>
                            <p className="mt-2 text-lg font-black text-text-primary">{scenario.suggestedStarter}</p>
                        </FuxiePanel>
                        <FuxiePanel className="p-4">
                            <RewardPreview
                                layout="stack"
                                rewards={[
                                    { type: 'unlock', label: 'Speaking evidence', detail: 'Completion receipt only' },
                                    { type: 'badge', label: 'Speaking mastery', detail: 'Badge route stays completion-based' },
                                    { type: 'streak', label: 'No click reward', detail: 'Khong thuong khi mo mic' },
                                ]}
                            />
                        </FuxiePanel>
                    </div>
                </div>
            </FuxiePanel>

            <FuxiePanel className="p-5">
                <h2 className="text-lg font-black text-text-primary">{t('otherSituationsTitle')}</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {GERMAN_ROLEPLAY_SCENARIOS.map((item) => (
                        <MeasuredLink
                            key={item.id}
                            href={item.href}
                            flow="roleplay.scenario.switch"
                            source={item.id}
                            className="rounded-2xl bg-[#F3FBFF] p-4 text-sm font-bold text-text-brand ring-1 ring-[#CCE4F0]/70 transition hover:bg-white"
                        >
                            {item.title}
                        </MeasuredLink>
                    ))}
                </div>
            </FuxiePanel>
        </div>
    )
}

function scoreBand(score: number) {
    if (score >= 90) return 'mastered'
    if (score >= 70) return 'clear'
    if (score >= 50) return 'practice_again'
    return 'rebuild'
}
