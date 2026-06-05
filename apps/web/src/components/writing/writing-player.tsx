'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FUXIE_3D_ASSETS, FuxieRoleMascot, RewardPreview, SkillMotivationRail, type RewardPreviewItem } from '@/components/gamification/quest-visuals'
import { FuxieProgressBar } from '@/components/ui/fuxie-ui'
import { ConfirmExitDialog } from '@/components/ui/confirm-exit-dialog'
import { trackClientAnalyticsEvent } from '@/lib/analytics/client-events'
import {
    buildWritingQuestEpisode,
    getWritingQuestCheckpoint,
    type WritingQuestEpisodeReceipt,
} from '@/lib/gamification/writing-quest-episode'

// ─── Types ──────────────────────────────────────────
interface FormField {
    label: string
    type: string
    placeholder?: string
}

interface RubricCriterion {
    id: string
    name: string
    nameNative?: string
    maxScore: number
}

interface AiFeedback {
    totalScore: number
    maxScore: number
    percentScore: number
    estimatedLevel: string
    criteria: Array<{
        id: string
        name: string
        nameNative?: string
        score: number
        maxScore: number
        reasoning: string
        reasoningNative?: string
        suggestions: string[]
        suggestionsNative?: string[]
    }>
    overallFeedback: string
    overallFeedbackNative?: string
    corrections: Array<{
        original: string
        corrected: string
        type: string
        typeNative?: string
        explanation: string
        explanationNative?: string
    }>
    xpEarned?: number
    rewardPreview?: RewardPreviewItem[]
    questEpisodeReceipt?: WritingQuestEpisodeReceipt
    nextEpisodeHref?: string
    badgeReceiptState?: 'preview' | 'newly_unlocked' | 'already_earned'
    badgeReceipt?: {
        title: string
        description: string
        progress: number
        receiptState?: string
    } | null
    nextBadgePreview?: {
        title: string
        description: string
        progress: number
        receiptState?: string
    } | null
}

interface WritingPlayerProps {
    exerciseId: string
    cefrLevel: string
    teil: number
    teilName: string
    textType: string
    register: string
    topic: string
    instruction: string
    instructionNative: string | null
    situation: string
    contentPoints: string[]
    formFields: FormField[] | null
    sourceText: string | null
    sourceTextType: string | null
    grafikDesc: string | null
    minWords: number
    maxWords: number | null
    timeMinutes: number
    maxScore: number
    rubricJson: { criteria: RubricCriterion[]; maxScore: number }
}

// ─── Constants ──────────────────────────────────────
const CEFR_COLORS: Record<string, { bg: string; text: string; css: string; shadow: string }> = {
    A1: { bg: '#DCFCE7', text: '#166534', css: 'linear-gradient(135deg, #22C55E, #059669)', shadow: 'rgba(34,197,94,0.3)' },
    A2: { bg: '#D9F99D', text: '#3F6212', css: 'linear-gradient(135deg, #84CC16, #16A34A)', shadow: 'rgba(132,204,22,0.3)' },
    B1: { bg: '#FED7AA', text: '#9A3412', css: 'linear-gradient(135deg, #F97316, #D97706)', shadow: 'rgba(249,115,22,0.3)' },
    B2: { bg: '#FECACA', text: '#991B1B', css: 'linear-gradient(135deg, #EF4444, #EA580C)', shadow: 'rgba(239,68,68,0.3)' },
    C1: { bg: '#E9D5FF', text: '#6B21A8', css: 'linear-gradient(135deg, #A855F7, #7C3AED)', shadow: 'rgba(168,85,247,0.3)' },
    C2: { bg: '#DDD6FE', text: '#4C1D95', css: 'linear-gradient(135deg, #7C3AED, #6B21A8)', shadow: 'rgba(124,58,237,0.3)' },
}

const REGISTER_LABELS: Record<string, { de: string; emoji: string }> = {
    formell: { de: 'Formell', emoji: '👔' },
    informell: { de: 'Informell', emoji: '👋' },
    halbformell: { de: 'Halbformell', emoji: '🤝' },
    neutral: { de: 'Neutral', emoji: '📝' },
    sachlich: { de: 'Sachlich', emoji: '📊' },
    akademisch: { de: 'Akademisch', emoji: '🎓' },
    variiert: { de: 'Variiert', emoji: '🔄' },
}

// ─── Word Count ─────────────────────────────────────
function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

// ─── Timer Format ───────────────────────────────────
function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Progress Ring ──────────────────────────────────
function ScoreRing({ score, maxScore, size = 120 }: { score: number; maxScore: number; size?: number }) {
    const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percent / 100) * circumference
    const color = percent >= 80 ? '#10B981' : percent >= 60 ? '#F59E0B' : '#EF4444'

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={color} strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{score}<span className="text-lg text-gray-400">/{maxScore}</span></span>
                <span className="text-sm text-gray-500">{percent}%</span>
            </div>
        </div>
    )
}

// ─── Stimulus Box ───────────────────────────────────
function StimulusBox({ sourceText, sourceTextType, cefrLevel, colors }: {
    sourceText: string
    sourceTextType: string | null
    cefrLevel: string
    colors: { bg: string; text: string; css: string; shadow: string }
}) {
    const t = useTranslations('WritingPlayer')
    const type = (sourceTextType || '').toLowerCase()

    // Determine styling based on text type
    const isEmail = type.includes('email') || type.includes('e-mail')
    const isForum = type.includes('forum')
    const isArticle = type.includes('article') || type.includes('artikel') || type.includes('zeitung')
    const isVortrag = type.includes('vortrag') || type.includes('rede') || type.includes('lecture')

    if (isEmail) {
        return (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-100/60 border-b border-blue-200">
                    <span className="text-sm">📧</span>
                    <span className="text-xs font-bold text-blue-800">E-Mail</span>
                    {sourceTextType && !isEmail && (
                        <span className="text-xs text-blue-600 ml-auto">{sourceTextType}</span>
                    )}
                </div>
                <div className="px-3 py-2.5">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{sourceText}</p>
                </div>
            </div>
        )
    }

    if (isForum) {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-100/60 border-b border-amber-200">
                    <span className="text-sm">💬</span>
                    <span className="text-xs font-bold text-amber-800">Online-Forum</span>
                </div>
                <div className="px-3 py-2.5">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{sourceText}</p>
                </div>
            </div>
        )
    }

    if (isArticle) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200">
                    <span className="text-sm">📰</span>
                    <span className="text-xs font-bold text-gray-800">{t('articleLabel')}</span>
                </div>
                <div className="px-3 py-2.5">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{sourceText}</p>
                </div>
            </div>
        )
    }

    if (isVortrag) {
        return (
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-100/60 border-b border-purple-200">
                    <span className="text-sm">🎤</span>
                    <span className="text-xs font-bold text-purple-800">{t('vortragLabel')}</span>
                </div>
                <div className="px-3 py-2.5">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap italic">{sourceText}</p>
                </div>
            </div>
        )
    }

    // Default: generic stimulus box
    return (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: colors.bg }}>
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ backgroundColor: colors.bg, borderColor: colors.bg }}>
                <span className="text-sm">📄</span>
                <span className="text-xs font-bold" style={{ color: colors.text }}>
                    {sourceTextType || 'Văn bản nguồn'}
                </span>
            </div>
            <div className="px-3 py-2.5 bg-white">
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{sourceText}</p>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export function WritingPlayer(props: WritingPlayerProps) {
    const router = useRouter()
    const t = useTranslations('WritingPlayer')
    const colors = CEFR_COLORS[props.cefrLevel] ?? CEFR_COLORS.A1!
    const registerInfo = REGISTER_LABELS[props.register] ?? REGISTER_LABELS.neutral!
    const isFormular = props.textType === 'Formular' && props.formFields

    // ─── State ──────────────────────────────────────
    const [phase, setPhase] = useState<'writing' | 'submitting' | 'feedback'>('writing')
    const [text, setText] = useState('')
    const [formValues, setFormValues] = useState<Record<string, string>>({})
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [feedback, setFeedback] = useState<AiFeedback | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showExitDialog, setShowExitDialog] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const isMountedRef = useRef(true)
    const submitAbortRef = useRef<AbortController | null>(null)
    const trackedCheckpoints = useRef<Set<string>>(new Set())

    const wordCount = countWords(text)
    const isFormComplete = isFormular
        ? Object.keys(formValues).length >= (props.formFields?.length ?? 0) && Object.values(formValues).every(v => v.trim().length > 0)
        : wordCount >= props.minWords
    const hasUnsavedDraft = isFormular
        ? Object.values(formValues).some(value => value.trim().length > 0)
        : text.trim().length > 0
    const completedFormFields = isFormular
        ? Object.values(formValues).filter(value => value.trim().length > 0).length
        : 0
    const writingProgress = isFormular
        ? ((props.formFields?.length ?? 0) > 0 ? (completedFormFields / (props.formFields?.length ?? 1)) * 100 : 0)
        : Math.min(100, (wordCount / Math.max(1, props.minWords)) * 100)
    const writingReadiness = isFormComplete ? 'Ready' : isFormular ? 'Fill fields' : 'Build draft'
    const questEpisode = useMemo(() => buildWritingQuestEpisode({
        exerciseId: props.exerciseId,
        topic: props.topic,
        textType: props.textType,
        cefrLevel: props.cefrLevel,
        minWords: Math.max(3, props.minWords),
        nextEpisodeHref: '/writing',
    }), [props.cefrLevel, props.exerciseId, props.minWords, props.textType, props.topic])
    const episodeProgressIndex = isFormular
        ? Math.max(0, Math.round((writingProgress / 100) * Math.max(1, props.minWords - 1)))
        : Math.max(0, Math.min(Math.max(1, props.minWords) - 1, wordCount))
    const activeCheckpoint = getWritingQuestCheckpoint({ episode: questEpisode, currentIndex: episodeProgressIndex })
    const completedCheckpoints = isFormComplete
        ? questEpisode.checkpoints.length
        : Math.max(1, questEpisode.checkpoints.findIndex((checkpoint) => checkpoint.id === activeCheckpoint.id) + 1)

    // ─── Timer ──────────────────────────────────────
    useEffect(() => {
        isMountedRef.current = true
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_started',
            source: 'writing.quest_episode.started',
            actionId: questEpisode.episodeId,
            actionType: 'writing_submission',
            level: props.cefrLevel,
            skill: 'writing',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'writing',
                exerciseId: props.exerciseId,
                cefrLevel: props.cefrLevel,
                checkpointId: 'plan',
                checkpointCount: questEpisode.checkpoints.length,
            },
        })
        timerRef.current = setInterval(() => {
            setTimeElapsed(prev => prev + 1)
        }, 1000)
        return () => {
            isMountedRef.current = false
            submitAbortRef.current?.abort()
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [props.cefrLevel, props.exerciseId, questEpisode.episodeId, questEpisode.checkpoints.length])

    useEffect(() => {
        if (phase !== 'writing') return
        if (trackedCheckpoints.current.has(activeCheckpoint.id)) return
        trackedCheckpoints.current.add(activeCheckpoint.id)
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_checkpoint_reached',
            source: 'writing.quest_episode.checkpoint',
            actionId: questEpisode.episodeId,
            actionType: 'writing_submission',
            level: props.cefrLevel,
            skill: 'writing',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'writing',
                exerciseId: props.exerciseId,
                cefrLevel: props.cefrLevel,
                checkpointId: activeCheckpoint.id,
                checkpointCount: questEpisode.checkpoints.length,
            },
        })
    }, [activeCheckpoint.id, phase, props.cefrLevel, props.exerciseId, questEpisode.episodeId, questEpisode.checkpoints.length])

    const exitToWritingList = useCallback(() => {
        router.push('/writing')
    }, [router])

    const handleExitRequest = useCallback(() => {
        if (phase === 'writing' && hasUnsavedDraft) {
            setShowExitDialog(true)
            return
        }

        exitToWritingList()
    }, [exitToWritingList, hasUnsavedDraft, phase])

    // ─── Submit ─────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (phase !== 'writing') return
        setPhase('submitting')
        setError(null)

        const submittedText = isFormular
            ? Object.entries(formValues).map(([k, v]) => `${k}: ${v}`).join('\n')
            : text

        try {
            submitAbortRef.current?.abort()
            const controller = new AbortController()
            submitAbortRef.current = controller

            const res = await fetch('/api/v1/writing/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exerciseId: props.exerciseId,
                    submittedText,
                    wordCount: countWords(submittedText),
                    timeSpentSeconds: timeElapsed,
                    questEpisode: {
                        episodeId: questEpisode.episodeId,
                        skill: questEpisode.skill,
                        sourceId: questEpisode.sourceId,
                        cefrLevel: questEpisode.cefrLevel,
                        checkpointCount: questEpisode.checkpoints.length,
                        completedCheckpoints,
                        nextEpisodeHref: questEpisode.nextEpisodeHref,
                    },
                }),
                signal: controller.signal,
            })
            const data = await res.json()
            if (!isMountedRef.current || controller.signal.aborted) return
            if (data.success) {
                setFeedback(data.data)
                setPhase('feedback')
                if (timerRef.current) clearInterval(timerRef.current)
            } else {
                setError(data.error || 'Fehler beim Einreichen')
                setPhase('writing')
            }
        } catch (err) {
            if (!isMountedRef.current) return
            if (err instanceof Error && err.name === 'AbortError') return
            setError('Verbindungsfehler. Bitte versuche es erneut.')
            setPhase('writing')
        }
    }, [phase, isFormular, formValues, text, props.exerciseId, timeElapsed, questEpisode, completedCheckpoints])

    // ─── Word Count Color ───────────────────────────
    const getWordCountColor = () => {
        if (wordCount === 0) return 'text-gray-400'
        if (wordCount < props.minWords) return 'text-amber-500'
        if (props.maxWords && wordCount > props.maxWords) return 'text-red-500'
        return 'text-green-600'
    }

    // ═══ FEEDBACK PHASE ═══
    if (phase === 'feedback' && feedback) {
        const episodeReceipt = feedback.questEpisodeReceipt
        const badgeReceipt = feedback.badgeReceipt ?? feedback.nextBadgePreview
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {/* ─── Score Header ─── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <FuxieRoleMascot src={FUXIE_3D_ASSETS.postOffice} alt={t('altWritingCoach')} size={96} motion="reward" />
                    </div>
                    <div className="flex justify-center mb-3">
                        <ScoreRing score={feedback.totalScore} maxScore={feedback.maxScore} />
                    </div>
                    {feedback.estimatedLevel && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <span className="text-sm text-gray-500">{t('estimatedLevelLabel')}</span>
                            <span className="text-sm font-bold px-2.5 py-1 rounded-lg"
                                style={{ color: (CEFR_COLORS[feedback.estimatedLevel] ?? colors).text, backgroundColor: (CEFR_COLORS[feedback.estimatedLevel] ?? colors).bg }}>
                                {feedback.estimatedLevel}
                            </span>
                        </div>
                    )}
                    <p className="text-gray-600 mt-3 text-sm">{feedback.overallFeedback}</p>
                    {feedback.overallFeedbackNative && (
                        <p className="text-gray-400 mt-1 text-xs italic">🇻🇳 {feedback.overallFeedbackNative}</p>
                    )}
                </div>

                {episodeReceipt && (
                    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{t('receiptTitle')}</p>
                                <h3 className="mt-1 text-lg font-bold text-gray-900">
                                    {episodeReceipt.completedCheckpoints}/{episodeReceipt.checkpointCount} checkpoints done
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">{episodeReceipt.masteryContribution}</p>
                                <p className="mt-1 text-xs font-semibold text-gray-500">
                                    Feedback: {episodeReceipt.feedbackSummaryState.replaceAll('_', ' ')} - Score band: {episodeReceipt.scoreBand.replaceAll('_', ' ')}
                                </p>
                            </div>
                            <button
                                onClick={() => router.push(episodeReceipt.recommendedAction === 'next_episode' ? episodeReceipt.nextEpisodeHref : `/writing/${props.exerciseId}`)}
                                className="px-4 py-2 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                                style={{ background: colors.css, boxShadow: `0 4px 16px ${colors.shadow}` }}
                            >
                                {episodeReceipt.recommendedAction === 'next_episode' ? 'Bai tiep theo' : 'Sua va nop lai'}
                            </button>
                        </div>
                        <div className="mt-4">
                            <FuxieProgressBar
                                value={Math.round((episodeReceipt.completedCheckpoints / Math.max(1, episodeReceipt.checkpointCount)) * 100)}
                                tone={episodeReceipt.recommendedAction === 'next_episode' ? 'success' : 'reward'}
                            />
                        </div>
                    </div>
                )}

                {feedback.rewardPreview && feedback.rewardPreview.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-black uppercase tracking-wide text-gray-500">Reward receipt</p>
                        <div className="mt-3">
                            <RewardPreview rewards={feedback.rewardPreview} layout="row" />
                        </div>
                        {badgeReceipt && (
                            <p className="mt-3 text-sm font-semibold text-gray-600">
                                Badge: {badgeReceipt.title} - {feedback.badgeReceiptState ?? badgeReceipt.receiptState ?? 'preview'}
                            </p>
                        )}
                    </div>
                )}

                {/* ─── Criteria Scores ─── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Bewertung</h3>
                    <div className="space-y-4">
                        {feedback.criteria.map((c) => {
                            const percent = c.maxScore > 0 ? (c.score / c.maxScore) * 100 : 0
                            const barColor = percent >= 80 ? '#10B981' : percent >= 60 ? '#F59E0B' : '#EF4444'
                            return (
                                <div key={c.id}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                                            {c.nameNative && <span className="text-xs text-gray-400 ml-2">{c.nameNative}</span>}
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: barColor }}>{c.score}/{c.maxScore}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${percent}%`, backgroundColor: barColor }} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 italic">{c.reasoning}</p>
                                    {c.reasoningNative && <p className="text-xs text-gray-400 italic">🇻🇳 {c.reasoningNative}</p>}
                                    {c.suggestionsNative && c.suggestionsNative.length > 0 && (
                                        <div className="mt-1.5 pl-2 border-l-2 border-blue-200">
                                            <p className="text-xs font-medium text-blue-600 mb-0.5">{t('suggestionsLabel')}</p>
                                            {c.suggestionsNative.map((s: string, si: number) => (
                                                <p key={si} className="text-xs text-blue-500">• {s}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ─── Corrections ─── */}
                {feedback.corrections.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Fehlerkorrektur</h3>
                        <div className="space-y-3">
                            {feedback.corrections.map((c, i) => (
                                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <div className="flex items-start gap-2">
                                        <div className="shrink-0 flex flex-col gap-0.5">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">{c.type}</span>
                                            {c.typeNative && <span className="text-xs text-gray-400 text-center">{c.typeNative}</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm">
                                                <span className="line-through text-red-500">{c.original}</span>
                                                <span className="mx-1">→</span>
                                                <span className="text-green-600 font-medium">{c.corrected}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{c.explanation}</p>
                                            {c.explanationNative && <p className="text-xs text-gray-400">🇻🇳 {c.explanationNative}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Actions ─── */}
                <div className="flex gap-3 justify-center pt-2">
                    <button
                        onClick={() => { setText(''); setFormValues({}); setTimeElapsed(0); setFeedback(null); setPhase('writing') }}
                        className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                        🔄 Thử lại
                    </button>
                    <button
                        onClick={() => router.push(feedback.nextEpisodeHref ?? '/writing')}
                        className="px-6 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                        style={{ background: colors.css, boxShadow: `0 4px 16px ${colors.shadow}` }}
                    >
                        Bài tiếp theo →
                    </button>
                </div>
            </div>
        )
    }

    // ═══ WRITING PHASE ═══
    return (
        <div>
            <ConfirmExitDialog
                open={showExitDialog}
                title={t('quitTitle')}
                description={t('quitDescription')}
                stayLabel={t('quitStay')}
                exitLabel={t('quitExit')}
                ariaLabel={t('quitTitle')}
                onStay={() => setShowExitDialog(false)}
                onExit={exitToWritingList}
            />
            {/* ─── Top Bar ─── */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={handleExitRequest} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors" title={t('quitTitle')}>
                    ✕
                </button>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: '100%', background: colors.css }} />
                </div>
                <span className="text-sm text-gray-500 font-medium">1/1</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: colors.text, backgroundColor: colors.bg }}>
                    {props.cefrLevel}
                </span>
                <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                    ⏱️ {formatTime(timeElapsed)}
                </span>
            </div>

            {/* ─── Main Layout ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* LEFT: Instructions */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Writing Quest</p>
                                <h2 className="mt-1 text-lg font-bold text-gray-900">{questEpisode.objective}</h2>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: colors.text, backgroundColor: colors.bg }}>
                                {questEpisode.cefrLevel}
                            </span>
                        </div>
                        <div className="mt-4 space-y-2">
                            {questEpisode.checkpoints.map((checkpoint, index) => {
                                const active = checkpoint.id === activeCheckpoint.id
                                const done = index < completedCheckpoints - 1 || (isFormComplete && active)
                                return (
                                    <div key={checkpoint.id} className={`rounded-xl border px-3 py-2 ${active ? 'border-emerald-200 bg-emerald-50' : done ? 'border-slate-200 bg-slate-50' : 'border-gray-100 bg-white'}`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-bold text-gray-900">{checkpoint.title}</span>
                                            <span className={`text-xs font-bold ${done ? 'text-emerald-700' : active ? 'text-amber-700' : 'text-gray-400'}`}>
                                                {done ? 'done' : active ? 'active' : 'next'}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs leading-relaxed text-gray-500">{checkpoint.objective}</p>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="mt-4">
                            <RewardPreview rewards={questEpisode.rewardPreview} layout="stack" />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">✏️</span>
                            <h2 className="text-lg font-bold text-gray-900">{t('promptHeader')}</h2>
                        </div>

                        {/* Text Type + Register badges */}
                        <div className="flex gap-2 mb-3">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: colors.text, backgroundColor: colors.bg }}>
                                {props.textType}
                            </span>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                                {registerInfo.emoji} {registerInfo.de}
                            </span>
                        </div>

                        {/* Situation */}
                        <p className="text-sm text-gray-800 leading-relaxed mb-2">{props.situation}</p>
                        {props.instructionNative && (
                            <p className="text-xs text-gray-400 mb-4 italic">{props.instructionNative}</p>
                        )}

                        {/* ─── Stimulus Material ─── */}
                        {props.sourceText && (
                            <div className="mt-3 mb-3">
                                <StimulusBox
                                    sourceText={props.sourceText}
                                    sourceTextType={props.sourceTextType}
                                    cefrLevel={props.cefrLevel}
                                    colors={colors}
                                />
                            </div>
                        )}

                        {/* Grafik Description */}
                        {props.grafikDesc && !props.sourceText?.includes(props.grafikDesc) && (
                            <div className="mt-3 mb-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">📊</span>
                                    <span className="text-xs font-bold text-indigo-700">{t('grafikLabel')}</span>
                                </div>
                                <p className="text-xs text-indigo-600 leading-relaxed">{props.grafikDesc}</p>
                            </div>
                        )}

                        {/* Content Points */}
                        <div className="border-t border-gray-100 pt-3">
                            <h4 className="text-sm font-bold text-gray-700 mb-2">📋 {t('contentPointsHeader')}</h4>
                            <ul className="space-y-1.5">
                                {props.contentPoints.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <span className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 text-xs"
                                            style={{ backgroundColor: colors.bg, color: colors.text }}>
                                            {i + 1}
                                        </span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Word count + time requirements */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                                📏 {props.minWords}{props.maxWords ? `-${props.maxWords}` : '+'} từ
                            </span>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700">
                                ⏱️ {props.timeMinutes} min
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Editor */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
                        {isFormular && props.formFields ? (
                            /* ─── FORM MODE ─── */
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-gray-900 mb-4">📋 {props.topic}</h3>
                                <div className="space-y-4">
                                    {props.formFields.map((field, i) => (
                                        <div key={i}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                            <input
                                                type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                                                placeholder={field.placeholder || field.label}
                                                value={formValues[field.label] || ''}
                                                onChange={e => setFormValues(prev => ({ ...prev, [field.label]: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 transition-all"
                                                style={{ '--tw-ring-color': colors.text } as any}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* ─── TEXT EDITOR MODE ─── */
                            <div className="flex-1 flex flex-col">
                                <textarea
                                    ref={textareaRef}
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder={t('draftPlaceholder')}
                                    className="flex-1 w-full min-h-[320px] p-4 rounded-xl border border-gray-200 text-sm text-gray-800 leading-relaxed resize-none focus:outline-none focus:ring-2 transition-all placeholder:text-gray-300"
                                    style={{ '--tw-ring-color': colors.text } as any}
                                    disabled={phase === 'submitting'}
                                />
                                {/* Word counter */}
                                <div className="flex justify-end mt-2">
                                    <span className={`text-sm font-medium ${getWordCountColor()}`}>
                                        {wordCount} / {props.minWords}{props.maxWords ? `-${props.maxWords}` : '+'} từ
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormComplete || phase === 'submitting'}
                                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isFormComplete
                                    ? 'text-white hover:opacity-90 shadow-lg'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                style={isFormComplete ? { background: colors.css, boxShadow: `0 4px 16px ${colors.shadow}` } : undefined}
                            >
                                {phase === 'submitting' ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        AI đang chấm...
                                    </>
                                ) : (
                                    <>{t('submitLabel')} →</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <SkillMotivationRail
                        skill="writing"
                        phaseLabel={isFormular ? 'Formular draft' : 'Writing draft'}
                        title={isFormComplete ? 'Ready for AI feedback' : activeCheckpoint.objective}
                        message="Plan, draft, then revise. Rewards and badge progress only happen after graded submit."
                        progressLabel="Draft readiness"
                        progressPercent={writingProgress}
                        metrics={[
                            { label: 'Words', value: isFormular ? `${completedFormFields}/${props.formFields?.length ?? 0}` : `${wordCount}/${props.minWords}+` },
                            { label: 'Time', value: formatTime(timeElapsed) },
                            { label: 'Level', value: props.cefrLevel },
                            { label: 'Status', value: writingReadiness },
                        ]}
                        rewards={[
                            { type: 'xp', label: `+${Math.max(15, Math.round(props.timeMinutes / 2))} XP`, detail: 'Nộp bài viết' },
                            { type: 'badge', label: 'Draft ready', detail: 'Đủ yêu cầu đề' },
                            { type: 'exam', label: 'Exam skill', detail: `${props.textType} practice` },
                        ]}
                    />
                </div>
            </div>
        </div>
    )
}
