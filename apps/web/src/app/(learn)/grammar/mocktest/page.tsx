'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { TheoryRenderer } from '@/components/grammar/TheoryRenderer'
import { ExerciseRenderer, FeedbackToast } from '@/components/grammar/ExerciseRenderer'
import type { TheoryBlock, GrammarExercise } from '@/components/grammar/types'
import s from '@/components/grammar/grammar.module.css'

// ─── Sample Theory Data ──────────────────────────────
const SAMPLE_THEORY: TheoryBlock[] = [
  {
    type: 'rule',
    text_vi: 'Trong tiếng Đức, động từ thay đổi theo chủ ngữ. Bỏ đuôi -en để lấy gốc, rồi thêm đuôi mới. Thì hiện tại (Präsens) dùng để nói về sự việc đang xảy ra hoặc thói quen.',
    formula: 'Chủ ngữ + động từ (chia theo ngôi) + bổ ngữ',
    note_vi: 'Đuôi cơ bản: ich -e, du -st, er -t, wir -en, ihr -t, sie -en.'
  },
  {
    type: 'paradigm_table',
    title: 'Chia động từ ở thì Präsens',
    headers: ['Ngôi', 'Đuôi', 'lernen', 'spielen'],
    rows: [
      ['ich', '-e', 'lerne', 'spiele'],
      ['du', '-st', 'lernst', 'spielst'],
      ['er/sie/es', '-t', 'lernt', 'spielt'],
      ['wir', '-en', 'lernen', 'spielen'],
      ['ihr', '-t', 'lernt', 'spielt'],
      ['sie/Sie', '-en', 'lernen', 'spielen'],
    ],
    highlight_columns: [1],
  },
  {
    type: 'examples',
    items: [
      { de: 'Ich lerne Deutsch.', vi: 'Tôi học tiếng Đức.', highlight: ['lerne'] },
      { de: 'Du spielst Fußball.', vi: 'Bạn chơi bóng đá.', highlight: ['spielst'] },
      { de: 'Er wohnt in Berlin.', vi: 'Anh ấy sống ở Berlin.', highlight: ['wohnt'] },
      { de: 'Wir trinken Kaffee.', vi: 'Chúng tôi uống cà phê.', highlight: ['trinken'] },
    ],
  },
  {
    type: 'contrast',
    left_label: 'Nominativ',
    right_label: 'Akkusativ',
    rows: [['der', 'den'], ['ein', 'einen'], ['die', 'die'], ['das', 'das']],
  },
  {
    type: 'mnemonic',
    text_vi: 'Hãy nhớ: eSTeN! — ich -e, du -st, er -t, wir -en. Giống như tên một ngôi làng nhỏ ở Đức!',
    visual_emoji: '🏘️',
  },
  {
    type: 'key_takeaway',
    text_vi: 'Bỏ -en lấy gốc, thêm đuôi: -e (ich), -st (du), -t (er), -en (wir/sie). Nhớ: eSTeN!',
  },
]

// ─── Sample Exercise Data ────────────────────────────
const SAMPLE_EXERCISES: GrammarExercise[] = [
  {
    id: 'mock-mc-01',
    type: 'multiple_choice',
    scaffolding_level: 1,
    difficulty: 1,
    instruction_vi: 'Chọn đáp án đúng.',
    stem: 'Er ___ in Hamburg.',
    options: ['wohne', 'wohnst', 'wohnt', 'wohnen'],
    correct: 2,
    explanation_vi: '"Er" dùng đuôi -t → wohnt.',
    tags: ['Chia theo ngôi'],
  },
  {
    id: 'mock-gfb-01',
    type: 'gap_fill_bank',
    scaffolding_level: 2,
    difficulty: 2,
    instruction_vi: 'Điền từ thích hợp từ ngân hàng từ.',
    stem: 'Du ___(1)___ gern Fußball. Wir ___(2)___ gern Musik.',
    blanks: [{ id: 1, answer: 'spielst' }, { id: 2, answer: 'hören' }],
    bank: ['spielst', 'hören', 'spielt', 'höre', 'spielen'],
    explanation_vi: 'du + spielen = spielst (-st). wir + hören = hören (-en).',
    tags: ['Chia theo ngôi'],
  },
  {
    id: 'mock-gft-01',
    type: 'gap_fill_type',
    scaffolding_level: 3,
    difficulty: 4,
    instruction_vi: 'Điền dạng đúng của động từ trong ngoặc.',
    stem: 'Du ___ (trinken) gern Tee.',
    hint_word: 'trinken',
    answer: ['trinkst'],
    explanation_vi: 'du + trinken → trinkst (gốc trink + đuôi -st).',
    tags: ['Chia theo ngôi'],
  },
  {
    id: 'mock-match-01',
    type: 'matching',
    scaffolding_level: 1,
    difficulty: 2,
    instruction_vi: 'Nối ngôi với dạng đúng của "machen".',
    pairs: [
      { left: 'ich', right: 'mache' },
      { left: 'du', right: 'machst' },
      { left: 'er', right: 'macht' },
      { left: 'wir', right: 'machen' },
    ],
    explanation_vi: 'ich -e, du -st, er -t, wir -en.',
    tags: ['Chia theo ngôi'],
  },
  {
    id: 'mock-reorder-01',
    type: 'sentence_reorder',
    scaffolding_level: 2,
    difficulty: 3,
    instruction_vi: 'Sắp xếp các từ thành câu đúng.',
    words: ['Deutsch', 'lerne', 'Ich'],
    correct_order: ['Ich', 'lerne', 'Deutsch'],
    explanation_vi: 'Trật tự: Chủ ngữ (Ich) + Động từ (lerne) + Bổ ngữ (Deutsch).',
    tags: ['Trật tự từ'],
  },
  {
    id: 'mock-error-01',
    type: 'error_spotting',
    scaffolding_level: 3,
    difficulty: 3,
    instruction_vi: 'Tìm và sửa từ sai trong câu.',
    sentence_words: ['Er', 'kauft', 'ein', 'Computer'],
    error_index: 2,
    correct_word: 'einen',
    correct_sentence: 'Er kauft einen Computer.',
    explanation_vi: '"Computer" là giống đực → Akkusativ cần "einen" thay vì "ein".',
    tags: ['Akkusativ'],
  },
  {
    id: 'mock-transform-01',
    type: 'transformation',
    scaffolding_level: 4,
    difficulty: 5,
    instruction_vi: 'Chuyển câu sau sang thì Perfekt.',
    source_sentence: 'Ich lerne Deutsch.',
    target_form: 'Perfekt',
    accepted_answers: ['Ich habe Deutsch gelernt.', 'Ich habe Deutsch gelernt'],
    explanation_vi: 'lerne → haben + gelernt. "Ich" → "habe".',
    tags: ['Perfekt'],
  },
  {
    id: 'mock-cloze-01',
    type: 'cloze',
    scaffolding_level: 4,
    difficulty: 4,
    instruction_vi: 'Điền dạng đúng vào chỗ trống.',
    text: 'Gestern (1)___ ich ins Kino. (gehen)\nIch (2)___ einen Film (3)___. (sehen)',
    gaps: [{ id: 1, answer: 'bin' }, { id: 2, answer: 'habe' }, { id: 3, answer: 'gesehen' }],
    explanation_vi: '"gehen" dùng sein → bin. "sehen" dùng haben → habe...gesehen.',
    tags: ['Perfekt'],
  },
]

// ─── Confetti Component ──────────────────────────────
function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      color: ['#3B82F6', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#EC4899'][i % 6],
      size: 6 + Math.random() * 8,
      duration: 1.5 + Math.random() * 1,
    })),
    []
  )
  return (
    <div className={s.confettiContainer}>
      {pieces.map(p => (
        <div
          key={p.id}
          className={s.confetti}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Score Ring SVG ───────────────────────────────────
function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const pct = total === 0 ? 0 : correct / total
  const r = 65
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)

  return (
    <div className={s.scoreRingWrap}>
      <svg className={s.scoreRingSvg} viewBox="0 0 160 160">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle className={s.ringBg} cx="80" cy="80" r={r} />
        <circle
          className={s.ringFill}
          cx="80" cy="80" r={r}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={s.scoreValue}>
        <span className={s.scoreNumber}>{correct}/{total}</span>
        <span className={s.scorePercent}>{Math.round(pct * 100)}%</span>
      </div>
    </div>
  )
}

// ─── Step Types ──────────────────────────────────────
type Step =
  | { type: 'hero' }
  | { type: 'theory'; blockIndex: number }
  | { type: 'exercise'; exerciseIndex: number }
  | { type: 'results' }

// ─── Main Mocktest Page ──────────────────────────────
export default function GrammarMocktestPage() {
  const [steps] = useState<Step[]>(() => {
    const all: Step[] = [{ type: 'hero' }]
    SAMPLE_THEORY.forEach((_, i) => all.push({ type: 'theory', blockIndex: i }))
    SAMPLE_EXERCISES.forEach((_, i) => all.push({ type: 'exercise', exerciseIndex: i }))
    all.push({ type: 'results' })
    return all
  })

  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [answers, setAnswers] = useState<{ correct: boolean; tags: string[] }[]>([])
  const [feedbackState, setFeedbackState] = useState<{
    isCorrect: boolean
    correctAnswer: string
    explanation: string
  } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  const currentStep = steps[currentStepIdx]
  if (!currentStep) return null
  const totalSteps = steps.length
  const progress = ((currentStepIdx) / (totalSteps - 1)) * 100

  // Track elapsed time on results
  useEffect(() => {
    if (currentStep.type === 'results') {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }
  }, [currentStep, startTime])

  const goNext = useCallback(() => {
    setCurrentStepIdx(prev => Math.min(prev + 1, totalSteps - 1))
  }, [totalSteps])

  const handleExerciseAnswer = useCallback((correct: boolean, correctAnswer: string) => {
    const step = steps[currentStepIdx]!
    if (step.type !== 'exercise') return

    const ex = SAMPLE_EXERCISES[(step as { type: 'exercise'; exerciseIndex: number }).exerciseIndex]!
    setAnswers(prev => [...prev, { correct, tags: ex.tags || [] }])

    if (correct) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    }

    setFeedbackState({
      isCorrect: correct,
      correctAnswer,
      explanation: ex.explanation_vi || '',
    })
  }, [currentStepIdx, steps])

  const handleFeedbackContinue = useCallback(() => {
    setFeedbackState(null)
    goNext()
  }, [goNext])

  const handleRestart = useCallback(() => {
    setCurrentStepIdx(0)
    setAnswers([])
    setFeedbackState(null)
  }, [])

  // Compute results
  const correctCount = answers.filter(a => a.correct).length
  const totalExercises = SAMPLE_EXERCISES.length
  const stars = correctCount === totalExercises ? 3 : correctCount >= totalExercises * 0.7 ? 2 : correctCount >= totalExercises * 0.4 ? 1 : 0
  const xp = correctCount * 10

  // Compute strengths/weaknesses
  const tagResults = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {}
    answers.forEach(a => {
      a.tags.forEach(tag => {
        if (!map[tag]) map[tag] = { correct: 0, total: 0 }
        map[tag].total++
        if (a.correct) map[tag].correct++
      })
    })
    return map
  }, [answers])

  const strengths = Object.entries(tagResults).filter(([, v]) => v.correct === v.total).map(([k]) => k)
  const weaknesses = Object.entries(tagResults).filter(([, v]) => v.correct < v.total).map(([k]) => k)

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s2 = secs % 60
    return `${m} phút ${s2 < 10 ? '0' : ''}${s2} giây`
  }

  return (
    <div className={s.lessonPlayer} style={{ background: '#F8FAFC' }}>
      {/* Progress Bar (hidden on hero & results) */}
      {currentStep.type !== 'hero' && currentStep.type !== 'results' && (
        <div className={s.progressBarWrap}>
          <div className={s.progressBarInner}>
            <button className={s.progressBarClose} onClick={() => setCurrentStepIdx(0)}>✕</button>
            <div className={s.progressBarTrack}>
              <div className={s.progressBarFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={s.progressBarStep}>
              {currentStep.type === 'theory'
                ? `${currentStep.blockIndex + 1}/${SAMPLE_THEORY.length}`
                : `Câu ${currentStep.exerciseIndex + 1}/${totalExercises}`
              }
            </span>
          </div>
        </div>
      )}

      {/* ═══ HERO SCREEN ═══ */}
      {currentStep.type === 'hero' && (
        <div className={s.heroCard}>
          <div className={s.heroGradient}>
            <span className={s.heroEmoji}>📖</span>
            <h1 className={s.heroTitle}>Thì hiện tại — Präsens</h1>
            <p className={s.heroSubtitle}>Bài E-01 · A1</p>
            <div className={s.heroChips}>
              <span className={s.heroChip}>📝 {SAMPLE_THEORY.length} phần lý thuyết</span>
              <span className={s.heroChip}>🎯 {totalExercises} bài tập</span>
              <span className={s.heroChip}>⏱️ ~6 phút</span>
            </div>
          </div>
          <button className={s.heroStartBtn} onClick={goNext}>
            Bắt đầu học →
          </button>
        </div>
      )}

      {/* ═══ THEORY SCREEN ═══ */}
      {currentStep.type === 'theory' && (
        <div className={s.stepContainer} key={`theory-${currentStep.blockIndex}`}>
          <div className={s.stepContent}>
            <TheoryRenderer blocks={[SAMPLE_THEORY[currentStep.blockIndex]!]} />
          </div>
          <div className={s.stepFooter}>
            <div className={s.stepFooterInner}>
              <button className={`${s.btnPrimary} ${s.btnBlue}`} onClick={goNext}>
                {currentStep.blockIndex === SAMPLE_THEORY.length - 1 ? '🎯 Bắt đầu luyện tập' : 'Tiếp tục →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXERCISE SCREEN ═══ */}
      {currentStep.type === 'exercise' && (
        <div className={s.stepContainer} key={`ex-${currentStep.exerciseIndex}`}>
          <div className={s.stepContent}>
            <ExerciseRenderer
              exercise={SAMPLE_EXERCISES[currentStep.exerciseIndex]!}
              onAnswer={handleExerciseAnswer}
            />
          </div>
        </div>
      )}

      {/* ═══ RESULTS SCREEN ═══ */}
      {currentStep.type === 'results' && (
        <div className={s.resultsScreen}>
          <h1 className={s.resultsTitle}>🎉 Hoàn thành!</h1>
          <ScoreRing correct={correctCount} total={totalExercises} />
          <div className={s.starsRow}>
            {[1, 2, 3].map(i => (
              <span
                key={i}
                className={`${s.star} ${i <= stars ? s.starActive : s.starDim}`}
                style={i <= stars ? { animationDelay: `${(i - 1) * 0.2}s` } : undefined}
              >
                ⭐
              </span>
            ))}
          </div>
          <div className={s.statsRow}>
            <span className={s.statItem}>⏱️ {formatTime(elapsedTime)}</span>
            <span className={`${s.statItem} ${s.xpStat}`}>⚡ +{xp} XP</span>
          </div>
          {strengths.length > 0 && (
            <div className={s.strengthSection}>
              <div className={`${s.strengthHeader} ${s.strengthGood}`}>✅ Làm tốt</div>
              {strengths.map(t => <div key={t} className={s.strengthItem}>{t}</div>)}
            </div>
          )}
          {weaknesses.length > 0 && (
            <div className={s.strengthSection}>
              <div className={`${s.strengthHeader} ${s.strengthWeak}`}>⚠️ Cần ôn</div>
              {weaknesses.map(t => <div key={t} className={s.strengthItem}>{t}</div>)}
            </div>
          )}
          <div className={s.resultsBtns}>
            <button className={`${s.btnPrimary} ${s.btnBlue}`} onClick={handleRestart}>
              🔄 Làm lại
            </button>
            <button className={`${s.btnPrimary} ${s.btnOutline}`} onClick={() => window.history.back()}>
              → Quay lại
            </button>
          </div>
        </div>
      )}

      {/* ═══ FEEDBACK TOAST ═══ */}
      {feedbackState && (
        <FeedbackToast
          isCorrect={feedbackState.isCorrect}
          correctAnswer={feedbackState.isCorrect ? undefined : feedbackState.correctAnswer}
          explanation={feedbackState.explanation}
          onContinue={handleFeedbackContinue}
        />
      )}

      {/* ═══ CONFETTI ═══ */}
      {showConfetti && <Confetti />}
    </div>
  )
}
