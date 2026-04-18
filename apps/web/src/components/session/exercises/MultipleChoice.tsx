import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { SessionItem } from '@/lib/session/builder'
import type { VocabExerciseData, GrammarExerciseData } from '@/lib/session/types'

export function MultipleChoice({ item, onNext }: { item: SessionItem, onNext: (correct: boolean) => void }) {
    const t = useTranslations('UI')
    // Determine if it's Grammar or Vocab review
    const isGrammar = item.type === 'GRAMMAR'
    const grammarData = item.data as GrammarExerciseData
    const vocabData = item.data as VocabExerciseData
    const question = isGrammar ? grammarData.questionDe : `Nghĩa của từ "${vocabData.term}" là gì?`
    const subTitle = isGrammar ? grammarData.questionNative : t('chooseCorrectAnswer')
    
    // For vocab review demo, generate some fake options if not provided
    // In real prod, builder.ts would attach distractors to the SessionItem
    let options = (isGrammar ? grammarData.options : vocabData.options) || []
    let correctIndex = (isGrammar ? grammarData.correctIndex : vocabData.correctIndex) ?? 0
    
    if (!isGrammar && options.length === 0) {
        options = [
            vocabData.meaning,
            'Con mèo (Fake)',
            'Bàn chải (Fake)',
            'Gia đình (Fake)'
        ]
        // Randomize
        options.sort(() => Math.random() - 0.5)
        correctIndex = options.indexOf(vocabData.meaning)
    }

    const [selected, setSelected] = useState<number | null>(null)
    const [checked, setChecked] = useState(false)

    const isCorrect = selected === correctIndex

    const handleCheck = () => {
        if (selected === null) return
        if (!checked) {
            setChecked(true)
        } else {
            onNext(isCorrect)
        }
    }

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{question}</h2>
                <p className="text-gray-500 mb-8">{subTitle}</p>

                <div className="space-y-3">
                    {options.map((opt: string, idx: number) => {
                        let btnStyle = "border-2 border-gray-200 hover:bg-gray-50 text-gray-700"
                        
                        if (checked) {
                            if (idx === correctIndex) {
                                btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                            } else if (idx === selected) {
                                btnStyle = "bg-red-50 border-red-400 text-red-700"
                            } else {
                                btnStyle = "border-gray-200 opacity-50"
                            }
                        } else if (selected === idx) {
                            btnStyle = "border-sky-400 bg-sky-50 text-sky-700 shadow-sm"
                        }

                        return (
                            <button
                                key={idx}
                                disabled={checked}
                                onClick={() => setSelected(idx)}
                                className={`w-full p-4 rounded-2xl text-left transition-all font-medium ${btnStyle}`}
                            >
                                {opt}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Bottom Feedback Banner */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 border-t transition-all duration-300 md:static md:mt-8 md:rounded-2xl ${
                checked ? (isCorrect ? 'bg-emerald-100 border-emerald-200' : 'bg-red-100 border-red-200') : 'bg-white border-transparent'
            }`}>
                {checked && (
                    <div className="mb-4">
                        <div className={`font-bold text-xl mb-1 ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isCorrect ? 'Tuyệt vời!' : 'Sai rồi!'}
                        </div>
                        {isGrammar && grammarData.explanation && (
                            <div className={`text-sm ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                                {grammarData.explanation}
                            </div>
                        )}
                        {!isGrammar && !isCorrect && (
                            <div className="text-red-700 text-sm">
                                Đáp án đúng: <strong>{options[correctIndex]}</strong>
                            </div>
                        )}
                    </div>
                )}
                
                <button
                    onClick={handleCheck}
                    disabled={selected === null && !checked}
                    className={`w-full py-4 rounded-2xl font-bold text-lg shadow-[0_6px_0_0_rgba(0,0,0,0.15)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        checked 
                            ? (isCorrect ? 'bg-emerald-500 text-white shadow-emerald-700' : 'bg-red-500 text-white shadow-red-700')
                            : (selected !== null ? 'bg-sky-500 text-white shadow-sky-700' : 'bg-gray-200 text-gray-400 shadow-transparent')
                    }`}
                >
                    {checked ? 'Tiếp Tục' : 'Kiểm tra'}
                </button>
            </div>
        </div>
    )
}
