import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import type { CheckedSessionAnswer, PublicSessionItem, SessionAnswer } from '@/lib/session/contracts'

export function TypingExercise({ item, feedback, pending, locked, onAnswer, onNext, preview = false }: {
    item: Extract<PublicSessionItem, { format: 'TYPING' }>
    feedback?: CheckedSessionAnswer
    pending: boolean
    locked: boolean
    onAnswer: (answer: SessionAnswer) => void
    onNext: () => void
    preview?: boolean
}) {
    const t = useTranslations('Session.typingExercise')
    const tSession = useTranslations('Session.integrity')
    const [input, setInput] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const answerText = feedback?.answer.kind === 'text' ? feedback.answer.text : input
    useEffect(() => { if (!feedback && !locked) inputRef.current?.focus() }, [feedback, locked])
    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (pending || preview) return
        if (feedback) onNext()
        else if (input.trim()) onAnswer({ kind: 'text', text: input })
    }
    return (
        <form onSubmit={submit} className="flex flex-col h-full animate-fade-in-up" data-session-exercise="typing">
            <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('writeInGerman')}</h2>
                <p className="text-gray-600 mb-8">{t('meaningLabel')} <strong>{item.data.meaning}</strong></p>
                <div className="flex items-center gap-4 mb-4">
                    <div aria-hidden="true" className="w-12 h-12 bg-[#CCE4F0] rounded-full flex items-center justify-center shrink-0 text-2xl">🦊</div>
                    <div className="flex-1 min-w-0 bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm focus-within:border-[#2E7EC4]">
                        <input ref={inputRef} type="text" aria-label={t('writeInGerman')} value={answerText} onChange={event => setInput(event.target.value)} readOnly={locked || !!feedback || preview} maxLength={256} placeholder={t('inputPlaceholder')} className="w-full text-lg outline-none bg-transparent" autoComplete="off" autoCapitalize="off" spellCheck={false} lang="de" />
                    </div>
                </div>
            </div>
            <div className="mt-auto pt-4 border-t border-[#CCE4F0]/30">
                {feedback && <div role="status" className="mb-4 text-center">
                    <p className={`font-black text-lg ${feedback.correct ? 'text-emerald-700' : 'text-red-700'}`}>{feedback.correct ? t('correctFeedback') : t('incorrectFeedback')}</p>
                    {!feedback.correct && <p className="text-red-700 text-sm">{t('correctAnswerLabel')} <strong lang="de">{feedback.feedback.answerLabel}</strong></p>}
                </div>}
                <button type="submit" data-session-check disabled={pending || preview || (!feedback && !input.trim())} className="w-full min-h-[48px] py-4 bg-[#2EC4B6] hover:bg-[#25b5a7] text-white font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {pending ? tSession('checking') : feedback ? t('nextLabel') : locked ? tSession('retryCheck') : t('checkLabel')}
                </button>
            </div>
        </form>
    )
}
