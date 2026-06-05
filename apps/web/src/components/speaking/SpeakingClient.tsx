'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { FUXIE_3D_ASSETS, FuxieRoleMascot } from '@/components/gamification/quest-visuals'
import { MeasuredLink } from '@/components/performance/measured-link'
import { GERMAN_ROLEPLAY_SCENARIOS } from '@/lib/gamification/lesson-gameplay-expansion'
import { FUXIE_WORLD_PROPS } from '@/lib/mascot/fuxie-assets'
import styles from './speaking.module.css'
import type { SpeakingTopicData, CefrLevel } from './types'

interface Props {
  topics: SpeakingTopicData[]
  availableLevels: CefrLevel[]
  initialLevel: CefrLevel
  totalLessons: number
  completedLessons: number
  totalStars: number
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#4CAF50', A2: '#8BC34A',
  B1: '#FF9800', B2: '#FF5722',
  C1: '#9C27B0', C2: '#673AB7',
}

const LEVEL_ICONS: Record<string, string> = {
  A1: '🌱', A2: '🌿', B1: '🌳', B2: '🔥', C1: '⭐', C2: '👑',
}

export default function SpeakingClient({
  topics: initialTopics,
  availableLevels,
  initialLevel,
  totalLessons: initialTotalLessons,
  completedLessons: initialCompletedLessons,
  totalStars: initialTotalStars,
}: Props) {
  const t = useTranslations('Gamification')
  const router = useRouter()
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>(initialLevel)
  const [topics, setTopics] = useState(initialTopics)
  const [totalLessons, setTotalLessons] = useState(initialTotalLessons)
  const [completedLessons, setCompletedLessons] = useState(initialCompletedLessons)
  const [totalStars, setTotalStars] = useState(initialTotalStars)
  const [selectedTopic, setSelectedTopic] = useState<SpeakingTopicData | null>(null)

  const handleLevelChange = useCallback(async (level: CefrLevel) => {
    setSelectedLevel(level)
    setSelectedTopic(null)
    try {
      const res = await fetch(`/api/v1/speaking/topics?level=${level}`)
      if (res.ok) {
        const data = await res.json()
        setTopics(data.topics)
        setTotalLessons(data.totalLessons)
        setCompletedLessons(data.completedLessons)
        setTotalStars(data.totalStars)
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err)
    }
  }, [])

  // Viewing lessons for a topic
  if (selectedTopic) {
    // Re-read topic from state to get fresh completion data
    const freshTopic = topics.find(t => t.id === selectedTopic.id) || selectedTopic
    const topicCompleted = freshTopic.lessons.filter(l => l.completion?.completed).length
    const topicStars = freshTopic.lessons.reduce((s, l) => s + (l.completion?.stars ?? 0), 0)

    return (
      <div className={styles.lessonPlayer}>
        <div className={styles.progressBarWrap}>
          <div className={styles.progressBarInner}>
            <button className={styles.progressBarClose} onClick={() => setSelectedTopic(null)}>←</button>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                {freshTopic.titleNative}
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                {freshTopic.titleDe} · {t('completedOfTotal', { completed: topicCompleted, total: freshTopic.lessons.length })} · ⭐ {topicStars}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.topicGrid} style={{ paddingTop: 16 }}>
          {freshTopic.lessons.map((lesson, idx) => {
            const comp = lesson.completion
            const isCompleted = comp?.completed
            const lessonStars = comp?.stars ?? 0

            return (
              <div
                key={lesson.id}
                className={styles.topicCard}
                onClick={() => {
                  router.push(`/speaking/${lesson.id}`)
                }}
              >
                <div
                  className={styles.topicIcon}
                  style={{ background: isCompleted ? '#ECFDF515' : `${LEVEL_COLORS[lesson.level]}15` }}
                >
                  {isCompleted ? '✅' : lesson.lessonType === 'E' ? '📖' : lesson.lessonType === 'V' ? '🔄' : '🎯'}
                </div>
                <div className={styles.topicInfo}>
                  <div className={styles.topicTitle}>{lesson.titleNative}</div>
                  <div className={styles.topicSubtitle}>
                    {lesson.lessonType === 'E' ? 'Einführung' : lesson.lessonType === 'V' ? 'Vertiefung' : 'Anwendung'}
                    {' · '}{lesson.estimatedMin} {t('minutes', { min: lesson.estimatedMin ?? 0 })}
                    {isCompleted && ` · ${comp!.bestScore}%`}
                  </div>
                </div>
                {isCompleted ? (
                  <span className={styles.starsDisplay}>
                    {'⭐'.repeat(lessonStars)}{'☆'.repeat(3 - lessonStars)}
                  </span>
                ) : (
                  <span className={`${styles.topicBadge} ${styles.badgeNew}`}>{t('newBadge')}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Topic list with level filter
  const groupedByLevel = topics.reduce<Record<string, SpeakingTopicData[]>>((acc, topic) => {
    const level = topic.cefrLevel
    if (!acc[level]) acc[level] = []
    acc[level].push(topic)
    return acc
  }, {})

  return (
    <div className={styles.lessonPlayer} style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '24px 0 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <FuxieRoleMascot
          src={FUXIE_3D_ASSETS.speakingCoach}
          alt={t('altSpeakingCoach')}
          size={76}
          motion="speak"
          className="rounded-2xl bg-white shadow-sm ring-1 ring-sky-100"
        />
        <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text-primary)", margin: '0 0 4px' }}>
          🎤 {t('practiceSkill', { skill: 'nói', level: '' })}
        </h1>
        <p style={{ fontSize: 15, color: "var(--color-text-muted)", margin: 0 }}>
          {t('speakingDesc')}
        </p>
        </div>
        <Image
          src={FUXIE_WORLD_PROPS.speakingStageCafe}
          alt=""
          width={112}
          height={112}
          className="ml-auto hidden h-24 w-24 shrink-0 object-contain drop-shadow-sm sm:block"
        />
      </div>

      <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {GERMAN_ROLEPLAY_SCENARIOS.map((scenario) => (
            <MeasuredLink
              key={scenario.id}
              href={scenario.href}
              flow="speaking.roleplay.open"
              source={scenario.id}
              className={styles.topicCard}
              style={{ minWidth: 260, textDecoration: 'none' }}
            >
              <div className={styles.topicIcon} style={{ background: '#EEF7FF' }}>RP</div>
              <div className={styles.topicInfo}>
                <div className={styles.topicTitle}>{scenario.title}</div>
                <div className={styles.topicSubtitle}>{scenario.cefrLevel} roleplay · receipt only</div>
              </div>
              <span className={`${styles.topicBadge} ${styles.badgeNew}`}>AI</span>
            </MeasuredLink>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{completedLessons}/{totalLessons}</span>
          <span className={styles.statLabel}>{t('statLessons')}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>⭐ {totalStars}</span>
          <span className={styles.statLabel}>{t('statTotalStars')}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%
          </span>
          <span className={styles.statLabel}>{t('statProgress')}</span>
        </div>
      </div>

      {/* Level Filter */}
      {availableLevels.length > 1 && (
        <div className={styles.levelTabs}>
          {availableLevels.map(level => (
            <button
              key={level}
              className={`${styles.levelTab} ${selectedLevel === level ? styles.levelTabActive : ''}`}
              style={{
                '--level-color': LEVEL_COLORS[level],
              } as React.CSSProperties}
              onClick={() => handleLevelChange(level)}
            >
              {LEVEL_ICONS[level]} {level}
            </button>
          ))}
        </div>
      )}

      {/* Topic List */}
      {Object.entries(groupedByLevel).map(([level, levelTopics]) => (
        <div key={level} style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 12, padding: '8px 14px',
            background: `${LEVEL_COLORS[level]}10`,
            borderRadius: 12,
            border: `1px solid ${LEVEL_COLORS[level]}30`,
          }}>
            <span style={{ fontSize: 20 }}>{LEVEL_ICONS[level]}</span>
            <span style={{
              fontSize: 14, fontWeight: 800, color: LEVEL_COLORS[level],
              textTransform: 'uppercase', letterSpacing: 1
            }}>
              {level}
            </span>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              · {t('topicCount', { count: levelTopics.length })}
            </span>
          </div>

          <div className={styles.topicGrid}>
            {levelTopics.map((topic) => {
              const topicCompleted = topic.lessons.filter(l => l.completion?.completed).length
              const topicTotal = topic.lessons.length

              return (
                <div
                  key={topic.id}
                  className={styles.topicCard}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div
                    className={styles.topicIcon}
                    style={{ background: `${LEVEL_COLORS[level]}15` }}
                  >
                    {topicCompleted === topicTotal && topicTotal > 0 ? '✅' : '🗣️'}
                  </div>
                  <div className={styles.topicInfo}>
                    <div className={styles.topicTitle}>{topic.titleNative}</div>
                    <div className={styles.topicSubtitle}>
                      {topic.titleDe} · {t('lessonsCompletedShort', { completed: topicCompleted, total: topicTotal })}
                    </div>
                  </div>
                  {topicCompleted > 0 ? (
                    <div className={styles.progressMini}>
                      <div
                        className={styles.progressMiniFill}
                        style={{
                          width: `${Math.round((topicCompleted / topicTotal) * 100)}%`,
                          background: LEVEL_COLORS[level],
                        }}
                      />
                    </div>
                  ) : (
                    <span className={`${styles.topicBadge} ${styles.badgeNew}`}>{t('newBadge')}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {topics.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: "var(--color-text-subtle)", fontSize: 15
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🦊</div>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--color-text-muted)" }}>
            {t('speakingEmpty')}
          </div>
          <div>{t('speakingEmptyDesc')}</div>
        </div>
      )}
    </div>
  )
}
