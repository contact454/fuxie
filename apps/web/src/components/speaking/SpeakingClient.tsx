'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NachsprechenPlayer from './NachsprechenPlayer'
import styles from './speaking.module.css'
import type { SpeakingTopicData, NachsprechenConfig } from './types'

interface Props {
  topics: SpeakingTopicData[]
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#4CAF50', A2: '#8BC34A',
  B1: '#FF9800', B2: '#FF5722',
  C1: '#9C27B0', C2: '#673AB7',
}

const LEVEL_ICONS: Record<string, string> = {
  A1: '🌱', A2: '🌿', B1: '🌳', B2: '🔥', C1: '⭐', C2: '👑',
}

const DEFAULT_CONFIG: NachsprechenConfig = {
  maxRecordingSec: 10,
  minAccuracyToPass: 70,
  attemptsAllowed: 3,
  showIPA: true,
  showTranslation: true,
  autoPlayModel: true,
}

export default function SpeakingClient({ topics }: Props) {
  const router = useRouter()
  const [selectedTopic, setSelectedTopic] = useState<SpeakingTopicData | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null)

  // Playing a lesson
  if (selectedTopic && selectedLesson !== null) {
    const lesson = selectedTopic.lessons[selectedLesson]
    if (!lesson) return null

    const exercises = lesson.exercisesJson as { sentences: any[] }
    const config = (lesson.configJson as NachsprechenConfig) || DEFAULT_CONFIG

    return (
      <NachsprechenPlayer
        sentences={exercises.sentences || []}
        config={config}
        lessonTitle={lesson.titleVi}
        onComplete={(score) => {
          // TODO: Save progress via API
          console.log(`Lesson complete! Score: ${score}`)
          setSelectedLesson(null)
        }}
        onClose={() => setSelectedLesson(null)}
      />
    )
  }

  // Viewing lessons for a topic
  if (selectedTopic) {
    return (
      <div className={styles.lessonPlayer}>
        <div className={styles.progressBarWrap}>
          <div className={styles.progressBarInner}>
            <button className={styles.progressBarClose} onClick={() => setSelectedTopic(null)}>←</button>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                {selectedTopic.titleVi}
              </h2>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{selectedTopic.titleDe}</p>
            </div>
          </div>
        </div>

        <div className={styles.topicGrid} style={{ paddingTop: 16 }}>
          {selectedTopic.lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              className={styles.topicCard}
              onClick={() => setSelectedLesson(idx)}
            >
              <div
                className={styles.topicIcon}
                style={{ background: `${LEVEL_COLORS[lesson.level]}15` }}
              >
                {lesson.lessonType === 'E' ? '📖' : lesson.lessonType === 'V' ? '🔄' : '🎯'}
              </div>
              <div className={styles.topicInfo}>
                <div className={styles.topicTitle}>{lesson.titleVi}</div>
                <div className={styles.topicSubtitle}>
                  {lesson.lessonType === 'E' ? 'Einführung' : lesson.lessonType === 'V' ? 'Vertiefung' : 'Anwendung'}
                  {' · '}{lesson.estimatedMin} phút
                </div>
              </div>
              <span className={`${styles.topicBadge} ${styles.badgeNew}`}>Mới</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Topic list (grouped by level)
  const groupedByLevel = topics.reduce<Record<string, SpeakingTopicData[]>>((acc, topic) => {
    const level = topic.cefrLevel
    if (!acc[level]) acc[level] = []
    acc[level].push(topic)
    return acc
  }, {})

  return (
    <div className={styles.lessonPlayer} style={{ paddingBottom: 40 }}>
      <div style={{ padding: '24px 0 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
          🎤 Sprechen
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>
          Luyện phát âm tiếng Đức theo chuẩn Goethe-Zertifikat
        </p>
      </div>

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
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              · {levelTopics.length} chủ đề
            </span>
          </div>

          <div className={styles.topicGrid}>
            {levelTopics.map((topic) => (
              <div
                key={topic.id}
                className={styles.topicCard}
                onClick={() => setSelectedTopic(topic)}
              >
                <div
                  className={styles.topicIcon}
                  style={{ background: `${LEVEL_COLORS[level]}15` }}
                >
                  🗣️
                </div>
                <div className={styles.topicInfo}>
                  <div className={styles.topicTitle}>{topic.titleVi}</div>
                  <div className={styles.topicSubtitle}>
                    {topic.titleDe} · {topic.lessons.length} bài
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {topics.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: '#9CA3AF', fontSize: 15
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🦊</div>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#6B7280' }}>
            Chưa có bài tập nào
          </div>
          <div>Nội dung Sprechen đang được chuẩn bị...</div>
        </div>
      )}
    </div>
  )
}
