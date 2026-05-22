'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import s from './grammar.module.css'

import type { CefrLevel } from '@/lib/types/cefr'
import { FUXIE_WORLD_PROPS } from '@/lib/mascot/fuxie-assets'

interface LessonSummary {
    id: string
    lessonType: string
    lessonNumber: number
    titleNative: string
    estimatedMin: number
    progress: { score: number; stars: number; completed: boolean } | null
}

interface TopicSummary {
    id: string
    slug: string
    titleDe: string
    titleNative: string
    cefrLevel: string
    lessons: LessonSummary[]
    totalStars: number
    maxStars: number
    completedLessons: number
}

interface Props {
    topics: TopicSummary[]
    totalTopics: number
    totalCompleted: number
    availableLevels: CefrLevel[]
    initialLevel: CefrLevel
}

const LEVEL_COLORS: Record<CefrLevel, { bg: string; text: string; gradient: string }> = {
    A1: { bg: '#DCFCE7', text: '#16A34A', gradient: 'linear-gradient(135deg, #22C55E, #16A34A)' },
    A2: { bg: '#D1FAE5', text: '#059669', gradient: 'linear-gradient(135deg, #10B981, #059669)' },
    B1: { bg: '#DBEAFE', text: '#2563EB', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
    B2: { bg: '#E0E7FF', text: '#4F46E5', gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)' },
    C1: { bg: '#F3E8FF', text: '#7C3AED', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
    C2: { bg: '#FCE7F3', text: '#DB2777', gradient: 'linear-gradient(135deg, #EC4899, #DB2777)' },
}

const LESSON_TYPE_LABELS: Record<string, { key: string; emoji: string }> = {
    E: { key: 'intro', emoji: '📖' },
    V: { key: 'deepPractice', emoji: '🔬' },
    A: { key: 'application', emoji: '🎯' },
}

function StarDisplay({ stars, max }: { stars: number; max: number }) {
    return (
        <span className={s.topicStars}>
            {Array.from({ length: Math.ceil(max / 3) }, (_, i) => {
                const lessonStars = Math.min(3, Math.max(0, stars - i * 3))
                return (
                    <span
                        key={i}
                        className={lessonStars >= 2 ? s.starActive : s.starDim}
                        style={{ fontSize: '14px' }}
                    >
                        {lessonStars >= 2 ? '⭐' : '☆'}
                    </span>
                )
            })}
        </span>
    )
}

export function GrammarClient({ topics, totalTopics, totalCompleted, availableLevels, initialLevel }: Props) {
    const t = useTranslations('Grammar')
    const [activeLevel, setActiveLevel] = useState<CefrLevel>(initialLevel)
    const [isPending, startTransition] = useTransition()
    const [currentTopics, setCurrentTopics] = useState(topics)
    const [stats, setStats] = useState({ totalTopics, totalCompleted })
    const router = useRouter()

    const handleLevelChange = (level: CefrLevel) => {
        setActiveLevel(level)
        startTransition(async () => {
            const res = await fetch(`/api/v1/grammar/topics?level=${level}`)
            if (res.ok) {
                const data = await res.json()
                setCurrentTopics(data.topics)
                setStats({ totalTopics: data.totalTopics, totalCompleted: data.totalCompleted })
            }
        })
    }

    const colors = LEVEL_COLORS[activeLevel]

    return (
        <div>
            {/* Header */}
            <div className={s.grammarHomeHeader}>
                <div>
                    <h1 className={s.grammarHomeTitle}>📚 Grammatik</h1>
                    <p className={s.grammarHomeSubtitle}>
                        {stats.totalCompleted}/{stats.totalTopics} {t('topicsCompleted')}
                    </p>
                </div>
                <Image
                    src={FUXIE_WORLD_PROPS.grammarScroll}
                    alt=""
                    width={104}
                    height={104}
                    className="h-24 w-24 shrink-0 object-contain drop-shadow-sm"
                />
            </div>

            {/* Level tabs */}
            <div className={s.levelTabs}>
                {availableLevels.map(level => (
                    <button
                        key={level}
                        className={`${s.levelTab} ${activeLevel === level ? s.levelTabActive : ''}`}
                        style={activeLevel === level ? {
                            background: LEVEL_COLORS[level].gradient,
                            color: "var(--color-text-inverse)",
                        } : {
                            background: LEVEL_COLORS[level].bg,
                            color: LEVEL_COLORS[level].text,
                        }}
                        onClick={() => handleLevelChange(level)}
                    >
                        {level}
                    </button>
                ))}
            </div>

            {/* Topic cards grid */}
            <div className={s.topicGrid} style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                {currentTopics.map((topic, idx) => {
                    const allCompleted = topic.completedLessons === topic.lessons.length
                    return (
                        <div
                            key={topic.id}
                            className={`${s.topicCard} ${allCompleted ? s.topicCardCompleted : ''}`}
                            onClick={() => router.push(`/grammar/${topic.slug}`)}
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            <div className={s.topicCardHeader} style={{ background: colors.gradient }}>
                                <span className={s.topicOrder}>{idx + 1}</span>
                                <span className={s.topicTitleDe}>{topic.titleDe}</span>
                                {allCompleted && <span className={s.topicCheckmark}>✅</span>}
                            </div>
                            <div className={s.topicCardBody}>
                                <div className={s.topicTitleVi}>{topic.titleNative}</div>
                                <div className={s.topicLessonDots}>
                                    {topic.lessons.map(l => {
                                        const typeInfo = LESSON_TYPE_LABELS[l.lessonType] || { key: l.lessonType, emoji: '📄' }
                                        const done = l.progress?.completed
                                        const stars = l.progress?.stars ?? 0
                                        return (
                                            <div
                                                key={l.id}
                                                className={`${s.lessonDot} ${done ? s.lessonDotDone : ''}`}
                                                title={`${typeInfo.key === l.lessonType ? l.lessonType : t(typeInfo.key as any)} — ${done ? `${stars}⭐` : t('notDone')}`}
                                            >
                                                <span className={s.lessonDotEmoji}>{typeInfo.emoji}</span>
                                                <span className={s.lessonDotLabel}>{typeInfo.key === l.lessonType ? l.lessonType : t(typeInfo.key as any)}</span>
                                                {done && (
                                                    <span className={s.lessonDotStars}>
                                                        {'⭐'.repeat(stars)}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className={s.topicMeta}>
                                    <span>{topic.lessons.length} {t('lessons')}</span>
                                    <StarDisplay stars={topic.totalStars} max={topic.maxStars} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {currentTopics.length === 0 && (
                <div className={s.emptyState}>
                    <p>{t('noTopicsForLevel', { level: activeLevel })}</p>
                </div>
            )}
        </div>
    )
}
