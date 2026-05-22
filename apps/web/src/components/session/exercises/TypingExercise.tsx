import { useState, useRef, useEffect } from 'react'
import type { SessionItem } from '@/lib/session/builder'
import type { VocabExerciseData } from '@/lib/session/types'

export function TypingExercise({ item, onNext }: { item: SessionItem, onNext: (correct: boolean) => void }) {
    const { term, meaning } = item.data as VocabExerciseData

    const [input, setInput] = useState('')
    const [checked, setChecked] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!checked) {
            inputRef.current?.focus()
        }
    }, [checked])

    // Simple evaluation: case insensitive, ignore extra spaces
    const isCorrect = input.trim().toLowerCase() === term.toLowerCase()

    const handleCheck = () => {
        if (!input.trim()) return
        if (!checked) {
            setChecked(true)
        } else {
            onNext(isCorrect)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCheck()
        }
    }

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Viết bằng tiếng Đức</h2>
                <p className="text-gray-500 mb-8">Nghĩa là: <strong>{meaning}</strong></p>

                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#CCE4F0] rounded-full flex items-center justify-center shrink-0">
                        <span className="text-2xl">🦊</span>
                    </div>
                    <div className="flex-1 bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={checked}
                            placeholder="Nhập tiếng Đức..."
                            className="w-full text-lg outline-none bg-transparent"
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Button inside Card */}
            <div className="mt-auto pt-4 border-t border-[#CCE4F0]/30">
                {checked && (
                    <div className="mb-4 text-center">
                        <div className={`font-black text-lg mb-1 ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isCorrect ? 'Tuyệt vời!' : 'Chưa đúng rồi!'}
                        </div>
                        {!isCorrect && (
                            <div className="text-red-700 text-xs font-bold">
                                Đáp án đúng: <strong>{term}</strong>
                            </div>
                        )}
                    </div>
                )}
                
                <button
                    onClick={handleCheck}
                    disabled={!input.trim() && !checked}
                    className="w-full py-4 bg-[#2EC4B6] hover:bg-[#25b5a7] active:bg-[#1fa093] text-white text-base font-black rounded-2xl transition-all duration-300 shadow-md shadow-[#2EC4B6]/25 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <span>{checked ? 'Weiter' : 'Kiểm tra'}</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    )
}
