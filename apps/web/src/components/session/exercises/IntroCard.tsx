import { useTranslations } from 'next-intl'
import type { CheckedSessionAnswer, PublicSessionItem, SessionAnswer } from '@/lib/session/contracts'

export function IntroCard({ item, feedback, pending, locked, onAnswer, onNext, preview = false }: {
    item: Extract<PublicSessionItem, { format: 'INTRO' }>
    feedback?: CheckedSessionAnswer
    pending: boolean
    locked: boolean
    onAnswer: (answer: SessionAnswer) => void
    onNext: () => void
    preview?: boolean
}) {
    const t = useTranslations('Session.introCard')
    const tSession = useTranslations('Session.integrity')
    const { term, meaning, exampleSentence, audioUrl } = item.data
    return (
        <div className="flex flex-col h-full animate-fade-in-up" data-session-exercise="intro">
            <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-6">{t('newWordTitle')}</h2>
                <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6 flex flex-col items-center text-center">
                    <div aria-hidden="true" className="w-24 h-24 bg-[#F3FBFF] rounded-2xl mb-6 flex items-center justify-center text-4xl">🦊</div>
                    <p className="text-3xl font-black text-fuxie-primary mb-4" lang="de">{term}</p>
                    <p className="text-lg text-gray-700 font-medium mb-6">{meaning}</p>
                    {audioUrl && <audio controls preload="none" src={audioUrl} aria-label={tSession('listenWord')} className="w-full mb-4" />}
                    {exampleSentence && <div className="w-full bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">{t('exampleTitle')}</p>
                        <p className="text-gray-700 italic" lang="de">{exampleSentence}</p>
                    </div>}
                </div>
                <p className="text-sm text-[#3C78A8] my-4">{tSession('introNoReward')}</p>
            </div>
            <div className="mt-auto pt-4 border-t border-[#CCE4F0]/30">
                {feedback && <p role="status" className="text-sm text-[#3C78A8] text-center mb-3">{tSession('acknowledged')}</p>}
                <button type="button" data-session-check disabled={pending || preview} onClick={() => feedback ? onNext() : onAnswer({ kind: 'ack', acknowledged: true })} className="w-full min-h-[48px] py-4 bg-[#2EC4B6] hover:bg-[#25b5a7] text-white font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {pending ? tSession('checking') : feedback ? tSession('next') : locked ? tSession('retryCheck') : t('understandCta')}
                </button>
            </div>
        </div>
    )
}
