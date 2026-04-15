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
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
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

            {/* Bottom Feedback Banner */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 border-t transition-all duration-300 md:static md:mt-8 md:rounded-2xl ${
                checked ? (isCorrect ? 'bg-emerald-100 border-emerald-200' : 'bg-red-100 border-red-200') : 'bg-white border-transparent'
            }`}>
                {checked && (
                    <div className="mb-4">
                        <div className={`font-bold text-xl mb-1 ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isCorrect ? 'Tuyệt vời!' : 'Sai rồi!'}
                        </div>
                        {!isCorrect && (
                            <div className="text-red-700 text-sm">
                                Đáp án đúng: <strong>{term}</strong>
                            </div>
                        )}
                    </div>
                )}
                
                <button
                    onClick={handleCheck}
                    disabled={!input.trim() && !checked}
                    className={`w-full py-4 rounded-2xl font-bold text-lg shadow-[0_6px_0_0_rgba(0,0,0,0.15)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        checked 
                            ? (isCorrect ? 'bg-emerald-500 text-white shadow-emerald-700' : 'bg-red-500 text-white shadow-red-700')
                            : (input.trim() ? 'bg-sky-500 text-white shadow-sky-700' : 'bg-gray-200 text-gray-400 shadow-transparent')
                    }`}
                >
                    {checked ? 'Tiếp Tục' : 'Kiểm tra'}
                </button>
            </div>
        </div>
    )
}
