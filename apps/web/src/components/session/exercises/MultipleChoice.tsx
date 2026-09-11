import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { CheckedSessionAnswer, PublicSessionItem, SessionAnswer } from '@/lib/session/contracts'

export function MultipleChoice({ item, feedback, pending, locked, onAnswer, onNext, stepIndex, totalSteps, preview = false }: {
    item: Extract<PublicSessionItem, { format: 'MULTIPLE_CHOICE' }>
    feedback?: CheckedSessionAnswer
    pending: boolean
    locked: boolean
    onAnswer: (answer: SessionAnswer) => void
    onNext: () => void
    stepIndex: number
    totalSteps: number
    preview?: boolean
}) {
    const t = useTranslations('UI')
    const tSession = useTranslations('Session.integrity')
    const [selected, setSelected] = useState<string | null>(null)
    const selectedId = feedback?.answer.kind === 'option' ? feedback.answer.optionId : selected
    return (
        <div className="flex flex-col h-full animate-fade-in-up" data-session-exercise="multiple-choice">
            <p className="text-xs font-bold text-[#3C78A8] mb-5">{t('stepOfTotal', { current: stepIndex + 1, total: totalSteps })}</p>
            <h2 className="text-xl md:text-2xl font-black text-[#173b56] text-center mb-2">{tSession('chooseMeaning')}</h2>
            <p className="text-sm text-[#3C78A8] font-bold text-center mb-6">{t('chooseCorrectAnswer')}</p>
            <div className="bg-[#F3FBFF] border border-[#CCE4F0]/60 rounded-3xl px-6 py-6 shadow-sm text-center mb-6">
                <span aria-hidden="true" className="text-3xl mb-2 block">🦊</span>
                <p className="text-2xl font-black text-[#2E7EC4]" lang="de">{item.data.term}</p>
            </div>
            <div role="group" aria-label={t('chooseCorrectAnswer')} className="grid grid-cols-2 gap-3 mb-6">
                {item.data.options.map(option => {
                    const selectedOption = option.id === selectedId
                    const correctOption = feedback?.feedback.correctOptionId === option.id
                    const style = feedback
                        ? correctOption ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : selectedOption ? 'bg-red-50 border-red-400 text-red-700' : 'border-[#CCE4F0]/40 opacity-60'
                        : selectedOption ? 'border-[#2EC4B6] bg-[#F3FBFF] text-[#2E7EC4]' : 'border-[#CCE4F0]/60 bg-white text-[#173b56]'
                    return <button key={option.id} type="button" data-choice-btn aria-pressed={selectedOption} disabled={locked || !!feedback || preview} onClick={() => setSelected(option.id)} className={`min-h-[48px] p-3 rounded-2xl border-2 text-sm font-bold break-words shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7EC4] ${style}`}>{option.label}</button>
                })}
            </div>
            <div className="mt-auto pt-4 border-t border-[#CCE4F0]/30">
                {feedback && <div role="status" className="mb-4 text-center">
                    <p className={`font-black text-lg ${feedback.correct ? 'text-emerald-700' : 'text-red-700'}`}>{feedback.correct ? t('correctFeedback') : t('incorrectFeedback')}</p>
                    {!feedback.correct && <p className="text-sm text-red-700">{t('correctAnswerLabel')} <strong>{feedback.feedback.answerLabel}</strong></p>}
                </div>}
                <button type="button" data-session-check disabled={pending || preview || (!feedback && selectedId === null)} onClick={() => feedback ? onNext() : selectedId && onAnswer({ kind: 'option', optionId: selectedId })} className="w-full min-h-[48px] py-4 bg-[#2EC4B6] hover:bg-[#25b5a7] text-white font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {pending ? tSession('checking') : feedback ? t('nextLabel') : locked ? tSession('retryCheck') : t('checkLabel')}
                </button>
            </div>
        </div>
    )
}
