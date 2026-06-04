'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type {
  GrammarExercise, MultipleChoiceExercise, GapFillBankExercise,
  GapFillTypeExercise, MatchingExercise, SentenceReorderExercise,
  ErrorSpottingExercise, TransformationExercise, ClozeExercise
} from './types'
import s from './grammar.module.css'

// ─── Helper ──────────────────────────────────────────
function stemToHtml(stem: string) {
  return stem.replace(/___(\(\d+\))?___/g, '<span class="' + s.blank + '">___</span>')
    .replace(/___/g, '<span class="' + s.blank + '">___</span>')
}

// ─── Feedback Toast ──────────────────────────────────
export function FeedbackToast({
  isCorrect, correctAnswer, explanation, onContinue
}: {
  isCorrect: boolean
  correctAnswer?: string
  explanation?: string
  onContinue: () => void
}) {
  const t = useTranslations('Grammar')
  return (
    <div className={s.feedbackOverlay} onClick={onContinue}>
      <div
        className={`${s.feedbackToast} ${isCorrect ? s.feedbackCorrect : s.feedbackWrong}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`${s.feedbackTitle} ${isCorrect ? s.feedbackTitleCorrect : s.feedbackTitleWrong}`}>
          {isCorrect ? t('feedbackCorrect') : t('feedbackIncorrect')}
          {isCorrect && <span className={s.xpBadge}>+10 XP</span>}
        </div>
        {!isCorrect && correctAnswer && (
          <div className={s.feedbackDetail}>
            {t('correctAnswerLabel')} <strong>{correctAnswer}</strong>
          </div>
        )}
        {explanation && <div className={s.feedbackExplanation}>{explanation}</div>}
        <button
          className={`${s.feedbackBtn} ${isCorrect ? s.feedbackBtnCorrect : s.feedbackBtnWrong}`}
          onClick={onContinue}
        >
          {isCorrect ? t('nextChallengeBtn') : t('understoodNextBtn')}
        </button>
      </div>
    </div>
  )
}

function GradingUnavailablePanel() {
  const t = useTranslations('Grammar')

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        marginTop: 14,
        borderRadius: 14,
        border: '1px solid #CCE4F0',
        background: '#F3FBFF',
        padding: '12px 14px',
        color: '#173B56',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800 }}>
        {t('gradingUnavailableTitle')}
      </div>
      <p style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: '#3C78A8' }}>
        {t('gradingUnavailableDetail')}
      </p>
    </div>
  )
}

// ─── 1. Multiple Choice ──────────────────────────────
function MultipleChoice({
  exercise, onAnswer
}: {
  exercise: MultipleChoiceExercise
  onAnswer: (correct: boolean, answer: string) => void
}) {
  const t = useTranslations('Grammar')
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  const handleSelect = (idx: number) => {
    if (answered) return
    setSelected(idx)
  }

  const handleCheck = () => {
    if (selected === null || answered) return
    setAnswered(true)
    onAnswer(selected === exercise.correct, exercise.options[exercise.correct]!)
  }

  return (
    <div className={s.exerciseContainer}>
      <div className={s.exerciseLabel}>{t('multipleChoice')}</div>
      <div className={s.exerciseInstruction}>📝 {exercise.instruction_vi}</div>
      <div className={s.exerciseStem} dangerouslySetInnerHTML={{ __html: stemToHtml(exercise.stem) }} />
      <div className={s.mcOptions}>
        {exercise.options.map((opt, i) => {
          let cls = s.mcOption
          if (answered) {
            if (i === exercise.correct) cls += ` ${s.mcCorrect}`
            else if (i === selected && i !== exercise.correct) cls += ` ${s.mcWrong}`
          } else if (i === selected) {
            cls += ` ${s.mcSelected}`
          }
          return (
            <div key={i} className={cls} onClick={() => handleSelect(i)}>
              <div className={s.mcRadio}>
                {answered && i === exercise.correct && <span className={s.checkMark}>✓</span>}
                {answered && i === selected && i !== exercise.correct && <span className={s.checkMark}>✕</span>}
                {!answered && i === selected && <span className={s.radioInner} />}
              </div>
              <span>{opt}</span>
            </div>
          )
        })}
      </div>
      {!answered && (
        <button
          style={{ marginTop: 16, width: '100%', padding: '14px', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: selected !== null ? 'pointer' : 'not-allowed', background: selected !== null ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#E5E7EB', color: selected !== null ? '#fff' : '#9CA3AF' }}
          disabled={selected === null}
          onClick={handleCheck}
        >
          {t('checkBtn')}
        </button>
      )}
    </div>
  )
}

// ─── 2. Gap Fill Bank ────────────────────────────────
function GapFillBank({
  exercise, onAnswer
}: {
  exercise: GapFillBankExercise
  onAnswer: (correct: boolean, answer: string) => void
}) {
  const t = useTranslations('Grammar')
  const [selections, setSelections] = useState<Record<number, string>>({})
  const [activeSlot, setActiveSlot] = useState<number>(exercise.blanks[0]?.id ?? 1)
  const [answered, setAnswered] = useState(false)

  const handleChipClick = (word: string) => {
    if (answered) return
    const prev = selections[activeSlot]
    const newSel = { ...selections, [activeSlot]: word }
    setSelections(newSel)

    // Move to next empty slot
    const next = exercise.blanks.find(b => !newSel[b.id])
    if (next) setActiveSlot(next.id)
  }

  const usedWords = new Set(Object.values(selections))
  const allFilled = exercise.blanks.every(b => selections[b.id])

  const handleCheck = () => {
    if (!allFilled || answered) return
    setAnswered(true)
    const isCorrect = exercise.blanks.every(
      b => selections[b.id]?.toLowerCase() === b.answer.toLowerCase()
    )
    onAnswer(isCorrect, exercise.blanks.map(b => b.answer).join(', '))
  }

  return (
    <div className={s.exerciseContainer}>
      <div className={s.exerciseLabel}>{t('fillWord')}</div>
      <div className={s.exerciseInstruction}>📝 {exercise.instruction_vi}</div>
      <div className={s.exerciseStem} dangerouslySetInnerHTML={{ __html: stemToHtml(exercise.stem) }} />
      <div className={s.gapBlanks}>
        {exercise.blanks.map(b => (
          <div
            key={b.id}
            className={`${s.gapSlot} ${activeSlot === b.id ? s.gapSlotActive : ''} ${selections[b.id] ? s.gapSlotFilled : ''}`}
            onClick={() => !answered && setActiveSlot(b.id)}
          >
            {selections[b.id] || <span className={s.slotLabel}>Ô {b.id}</span>}
          </div>
        ))}
      </div>
      <div className={s.hintHelper}>{t('chooseAbove')}</div>
      <div className={s.wordBank}>
        {exercise.bank.map((w, i) => (
          <div
            key={i}
            className={`${s.wordChip} ${usedWords.has(w) ? s.chipUsed : ''}`}
            onClick={() => handleChipClick(w)}
          >
            {w}
          </div>
        ))}
      </div>
      {!answered && (
        <button
          style={{ marginTop: 16, width: '100%', padding: '14px', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: allFilled ? 'pointer' : 'not-allowed', background: allFilled ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#E5E7EB', color: allFilled ? '#fff' : '#9CA3AF' }}
          disabled={!allFilled}
          onClick={handleCheck}
        >
          {t('checkBtn')}
        </button>
      )}
    </div>
  )
}

// ─── 3. Gap Fill Type ────────────────────────────────
function GapFillType({
  exercise, onAnswer, cefrLevel
}: {
  exercise: GapFillTypeExercise
  onAnswer: (correct: boolean, answer: string, aiFeedback?: any) => void
  cefrLevel?: string
}) {
  const t = useTranslations('Grammar')
  const [value, setValue] = useState('')
  const [answered, setAnswered] = useState(false)
  const [isAiGrading, setIsAiGrading] = useState(false)
  const [gradingError, setGradingError] = useState(false)

  const handleCheck = async () => {
    if (!value.trim() || answered || isAiGrading) return
    const val = value.trim().toLowerCase()
    const isHeuristicCorrect =
      exercise.answer.some(a => a.toLowerCase() === val) ||
      (exercise.accept_alt ?? []).some(a => a.toLowerCase() === val)
    
    if (isHeuristicCorrect) {
      setAnswered(true)
      onAnswer(true, exercise.answer.join(' / '))
      return
    }

    setIsAiGrading(true)
    setGradingError(false)
    try {
      const res = await fetch('/api/v1/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'grammar',
          cefrLevel: cefrLevel || 'A1',
          exerciseContext: `Điền vào chỗ trống: ${exercise.stem}. Hint: ${exercise.hint_word || ''}`,
          expectedAnswer: exercise.answer.join(' / '),
          userAnswer: value
        })
      })
      const data = await res.json()
      if (res.ok && data.success && data.data) {
        setAnswered(true)
        onAnswer(data.data.correct, exercise.answer.join(' / '), data.data)
      } else {
        setGradingError(true)
      }
    } catch (e) {
      setGradingError(true)
    } finally {
      setIsAiGrading(false)
    }
  }

  return (
    <div className={s.exerciseContainer}>
      <div className={s.exerciseLabel}>{t('selfFill')}</div>
      <div className={s.exerciseInstruction}>📝 {exercise.instruction_vi}</div>
      <div className={s.exerciseStem} dangerouslySetInnerHTML={{ __html: stemToHtml(exercise.stem) }} />
      {exercise.hint_word && (
        <div className={s.hintHelper}>💡 Gợi ý: {exercise.hint_word}</div>
      )}
      <input
        className={s.textInput}
        type="text"
        placeholder={t('enterAnswerPlaceholder')}
        value={value}
        onChange={e => {
          setValue(e.target.value)
          setGradingError(false)
        }}
        onKeyDown={e => e.key === 'Enter' && handleCheck()}
        disabled={answered}
        autoComplete="off"
        spellCheck={false}
      />
      {gradingError && <GradingUnavailablePanel />}
      {!answered && (
        <button
          style={{ marginTop: 16, width: '100%', padding: '14px', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: value.trim() && !isAiGrading ? 'pointer' : 'not-allowed', background: value.trim() && !isAiGrading ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#E5E7EB', color: value.trim() && !isAiGrading ? '#fff' : '#9CA3AF' }}
          disabled={!value.trim() || isAiGrading}
          onClick={handleCheck}
        >
          {isAiGrading ? t('aiGrading') : gradingError ? t('gradingRetry') : t('checkBtn')}
        </button>
      )}
    </div>
  )
}

// ─── 4. Matching ─────────────────────────────────────
function Matching({
  exercise, onAnswer
}: {
  exercise: MatchingExercise
  onAnswer: (correct: boolean, answer: string) => void
}) {
  const t = useTranslations('Grammar')
  const shuffledRight = useMemo(
    () => [...exercise.pairs].sort(() => Math.random() - 0.5),
    [exercise.pairs]
  )
  const [matches, setMatches] = useState<Record<number, string>>({})
  const [activeRow, setActiveRow] = useState(0)
  const [answered, setAnswered] = useState(false)

  const usedRights = new Set(Object.values(matches))
  const allMatched = exercise.pairs.every((_, i) => matches[i] !== undefined)

  const handleRightClick = (rightText: string) => {
    if (answered || usedRights.has(rightText)) return
    const newMatches = { ...matches, [activeRow]: rightText }
    setMatches(newMatches)
    // Move to next unmatched row
    const nextRow = exercise.pairs.findIndex((_, i) => !newMatches[i] && i !== activeRow)
    if (nextRow >= 0) setActiveRow(nextRow)
  }

  const handleCheck = () => {
    if (!allMatched || answered) return
    setAnswered(true)
    const isCorrect = exercise.pairs.every(
      (p, i) => matches[i]?.toLowerCase() === p.right.toLowerCase()
    )
    onAnswer(isCorrect, exercise.pairs.map(p => `${p.left} → ${p.right}`).join(', '))
  }

  return (
    <div className={s.exerciseContainer}>
      <div className={s.exerciseLabel}>{t('matchPairs')}</div>
      <div className={s.exerciseInstruction}>📝 {exercise.instruction_vi}</div>
      <div className={s.matchingContainer}>
        {exercise.pairs.map((p, i) => (
          <div key={i} className={s.matchingRow}>
            <div className={s.matchLeft}>{p.left}</div>
            <span className={s.matchArrow}>→</span>
            <div
              className={`${matches[i] ? s.matchDropFilled : s.matchDropZone} ${activeRow === i && !answered ? s.matchDropActive : ''}`}
              onClick={() => !answered && setActiveRow(i)}
            >
              {matches[i] || '?'}
            </div>
          </div>
        ))}
      </div>
      <div className={s.shuffledOptions}>
        {shuffledRight.map((p, i) => (
          <div
            key={i}
            className={`${s.wordChip} ${usedRights.has(p.right) ? s.chipUsed : ''}`}
            onClick={() => handleRightClick(p.right)}
          >
            {p.right}
          </div>
        ))}
      </div>
      {!answered && (
        <button
          style={{ marginTop: 16, width: '100%', padding: '14px', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: allMatched ? 'pointer' : 'not-allowed', background: allMatched ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#E5E7EB', color: allMatched ? '#fff' : '#9CA3AF' }}
          disabled={!allMatched}
          onClick={handleCheck}
        >
          {t('checkBtn')}
        </button>
      )}
    </div>
  )
}

// ─── 5. Sentence Reorder ─────────────────────────────
function SentenceReorder({
  exercise, onAnswer
}: {
  exercise: SentenceReorderExercise
  onAnswer: (correct: boolean, answer: string) => void
}) {
  const t = useTranslations('Grammar')
  const shuffled = useMemo(
    () => [...exercise.words].sort(() => Math.random() - 0.5),
    [exercise.words]
  )
  const [placed, setPlaced] = useState<string[]>([])
  const [answered, setAnswered] = useState(false)

  const handleWordClick = (word: string) => {
    if (answered) return
    if (placed.includes(word)) {
      setPlaced(placed.filter(w => w !== word))
    } else {
      setPlaced([...placed, word])
    }
  }

  const handleCheck = () => {
    if (placed.length === 0 || answered) return
    setAnswered(true)
    const ans = placed.join(' ').replace(/\.$/, '')
    const corr = exercise.correct_order.join(' ').replace(/\.$/, '')
    let isCorrect = ans.toLowerCase() === corr.toLowerCase()
    if (!isCorrect && exercise.alt_orders) {
      isCorrect = exercise.alt_orders.some(
        alt => alt.join(' ').replace(/\.$/, '').toLowerCase() === ans.toLowerCase()
      )
    }
    onAnswer(isCorrect, exercise.correct_order.join(' '))
  }

  return (
    <div className={s.exerciseContainer}>
      <div className={s.exerciseLabel}>{t('scrambleSentence')}</div>
      <div className={s.exerciseInstruction}>📝 {exercise.instruction_vi}</div>
      <div className={`${s.reorderResult} ${placed.length > 0 ? s.reorderHasWords : ''}`}>
        {placed.length === 0
          ? <span className={s.reorderPlaceholder}>{t('scramblePlaceholder')}</span>
          : placed.map((w, i) => <span key={i} style={{ fontSize: 16, fontWeight: 500 }}>{w}</span>)
        }
      </div>
      <div className={s.hintHelper}>{t('tapToBuild')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {shuffled.map((w, i) => (
          <div
            key={i}
            className={`${s.reorderWord} ${placed.includes(w) ? s.reorderPlaced : ''}`}
            onClick={() => handleWordClick(w)}
          >
            {w}
          </div>
        ))}
      </div>
      {!answered && (
        <button
          style={{ marginTop: 16, width: '100%', padding: '14px', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: placed.length > 0 ? 'pointer' : 'not-allowed', background: placed.length > 0 ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#E5E7EB', color: placed.length > 0 ? '#fff' : '#9CA3AF' }}
          disabled={placed.length === 0}
          onClick={handleCheck}
        >
          {t('checkBtn')}
        </button>
      )}
    </div>
  )
}

// ─── 6. Error Spotting ───────────────────────────────
function ErrorSpotting({
  exercise, onAnswer
}: {
  exercise: ErrorSpottingExercise
  onAnswer: (correct: boolean, answer: string) => void
}) {
  const t = useTranslations('Grammar')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [correction, setCorrection] = useState('')
  const [answered, setAnswered] = useState(false)

  const handleCheck = () => {
    if (selectedIdx === null || !correction.trim() || answered) return
    setAnswered(true)
    const isCorrect =
      selectedIdx === exercise.error_index &&
      correction.trim().toLowerCase() === exercise.correct_word.toLowerCase()
    onAnswer(isCorrect, exercise.correct_sentence)
  }

  return (
    <div className={s.exerciseContainer}>
      <div className={s.exerciseLabel}>{t('findError')}</div>
      <div className={s.exerciseInstruction}>📝 {exercise.instruction_vi}</div>
      <div className={s.errorSentence}>
        {exercise.sentence_words.map((w, i) => (
          <span
            key={i}
            className={`${s.errorWord} ${selectedIdx === i ? s.errorWordSelected : ''}`}
            onClick={() => !answered && setSelectedIdx(i)}
          >
            {w}{' '}
          </span>
        ))}
      </div>
      {selectedIdx !== null && (
        <div className={s.errorCorrection}>
          <div className={s.hintHelper}>{t('enterCorrection')}</div>
          <input
            className={s.textInput}
            type="text"
            placeholder={t('correctWordPlaceholder')}
            value={correction}
            onChange={e => setCorrection(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            disabled={answered}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}
      {!answered && (
        <button
          style={{ marginTop: 16, width: '100%', padding: '14px', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: selectedIdx !== null && correction.trim() ? 'pointer' : 'not-allowed', background: selectedIdx !== null && correction.trim() ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#E5E7EB', color: selectedIdx !== null && correction.trim() ? '#fff' : '#9CA3AF' }}
          disabled={selectedIdx === null || !correction.trim()}
          onClick={handleCheck}
        >
          {t('checkBtn')}
        </button>
      )}
    </div>
  )
}

// ─── 7. Transformation ───────────────────────────────
function Transformation({
  exercise, onAnswer, cefrLevel
}: {
  exercise: TransformationExercise
  onAnswer: (correct: boolean, answer: string, aiFeedback?: any) => void
  cefrLevel?: string
}) {
  const t = useTranslations('Grammar')
  const [value, setValue] = useState('')
  const [answered, setAnswered] = useState(false)
  const [isAiGrading, setIsAiGrading] = useState(false)
  const [gradingError, setGradingError] = useState(false)

  const handleCheck = async () => {
    if (!value.trim() || answered || isAiGrading) return
    const val = value.trim().toLowerCase().replace(/\.$/, '')
    const isHeuristicCorrect = exercise.accepted_answers.some(
      a => a.toLowerCase().replace(/\.$/, '') === val
    )
    
    if (isHeuristicCorrect) {
      setAnswered(true)
      onAnswer(true, exercise.accepted_answers[0]!)
      return
    }

    setIsAiGrading(true)
    setGradingError(false)
    try {
      const res = await fetch('/api/v1/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'grammar',
          cefrLevel: cefrLevel || 'A1',
          exerciseContext: `Viết lại câu sau với ngữ pháp ${exercise.target_form}. Câu gốc: ${exercise.source_sentence}`,
          expectedAnswer: exercise.accepted_answers[0],
          userAnswer: value
        })
      })
      const data = await res.json()
      if (res.ok && data.success && data.data) {
        setAnswered(true)
        onAnswer(data.data.correct, exercise.accepted_answers[0]!, data.data)
      } else {
        setGradingError(true)
      }
    } catch (e) {
      setGradingError(true)
    } finally {
      setIsAiGrading(false)
    }
  }

  return (
    <div className={s.exerciseContainer}>
      <div className={s.exerciseLabel}>{t('transformSentence')}</div>
      <div className={s.exerciseInstruction}>📝 {exercise.instruction_vi}</div>
      <div className={s.sourceBox}>
        <strong>{t('originalSentence')}</strong> {exercise.source_sentence}
      </div>
      <div className={s.targetForm}>🎯 {exercise.target_form}</div>
      <textarea
        className={s.textArea}
        placeholder={t('writeNewSentencePlaceholder')}
        value={value}
        onChange={e => {
          setValue(e.target.value)
          setGradingError(false)
        }}
        disabled={answered}
      />
      {gradingError && <GradingUnavailablePanel />}
      {!answered && (
        <button
          style={{ marginTop: 16, width: '100%', padding: '14px', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: value.trim() && !isAiGrading ? 'pointer' : 'not-allowed', background: value.trim() && !isAiGrading ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#E5E7EB', color: value.trim() && !isAiGrading ? '#fff' : '#9CA3AF' }}
          disabled={!value.trim() || isAiGrading}
          onClick={handleCheck}
        >
          {isAiGrading ? t('aiGrading') : gradingError ? t('gradingRetry') : t('checkBtn')}
        </button>
      )}
    </div>
  )
}

// ─── 8. Cloze ────────────────────────────────────────
function ClozeComponent({
  exercise, onAnswer
}: {
  exercise: ClozeExercise
  onAnswer: (correct: boolean, answer: string) => void
}) {
  const t = useTranslations('Grammar')
  const [values, setValues] = useState<Record<number, string>>({})
  const [answered, setAnswered] = useState(false)

  const allFilled = exercise.gaps.every(g => values[g.id]?.trim())

  const handleCheck = () => {
    if (!allFilled || answered) return
    setAnswered(true)
    const isCorrect = exercise.gaps.every(
      g => values[g.id]?.trim().toLowerCase() === g.answer.toLowerCase()
    )
    onAnswer(isCorrect, exercise.gaps.map(g => g.answer).join(', '))
  }

  // Parse cloze text — replace (N)___ with input fields
  const renderClozeText = () => {
    const parts = exercise.text.split(/\((\d+)\)___/)
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        // This is a gap ID
        const gapId = parseInt(part)
        return (
          <input
            key={`gap-${gapId}`}
            className={s.clozeInput}
            type="text"
            value={values[gapId] || ''}
            onChange={e => setValues({ ...values, [gapId]: e.target.value })}
            disabled={answered}
            placeholder={`(${gapId})`}
            autoComplete="off"
            spellCheck={false}
          />
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className={s.exerciseContainer}>
      <div className={s.exerciseLabel}>{t('fillInBlanks')}</div>
      <div className={s.exerciseInstruction}>📝 {exercise.instruction_vi}</div>
      <div className={s.clozeText} style={{ whiteSpace: 'pre-wrap' }}>
        {renderClozeText()}
      </div>
      {!answered && (
        <button
          style={{ marginTop: 16, width: '100%', padding: '14px', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: allFilled ? 'pointer' : 'not-allowed', background: allFilled ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#E5E7EB', color: allFilled ? '#fff' : '#9CA3AF' }}
          disabled={!allFilled}
          onClick={handleCheck}
        >
          {t('checkBtn')}
        </button>
      )}
    </div>
  )
}

// ─── ExerciseRenderer Dispatcher ─────────────────────
export function ExerciseRenderer({
  exercise, onAnswer, cefrLevel
}: {
  exercise: GrammarExercise
  onAnswer: (correct: boolean, correctAnswer: string, aiFeedback?: any) => void
  cefrLevel?: string
}) {
  const t = useTranslations('Grammar')
  switch (exercise.type) {
    case 'multiple_choice':   return <MultipleChoice exercise={exercise} onAnswer={onAnswer} />
    case 'gap_fill_bank':     return <GapFillBank exercise={exercise} onAnswer={onAnswer} />
    case 'gap_fill_type':     return <GapFillType exercise={exercise} onAnswer={onAnswer} cefrLevel={cefrLevel} />
    case 'matching':          return <Matching exercise={exercise} onAnswer={onAnswer} />
    case 'sentence_reorder':  return <SentenceReorder exercise={exercise} onAnswer={onAnswer} />
    case 'error_spotting':    return <ErrorSpotting exercise={exercise} onAnswer={onAnswer} />
    case 'transformation':    return <Transformation exercise={exercise} onAnswer={onAnswer} cefrLevel={cefrLevel} />
    case 'cloze':             return <ClozeComponent exercise={exercise} onAnswer={onAnswer} />
    default:                  return <div>{t('unknownType')}</div>
  }
}

export {
  MultipleChoice, GapFillBank, GapFillType, Matching,
  SentenceReorder, ErrorSpotting, Transformation, ClozeComponent
}
