import { useState } from 'react'
import type { SessionItem } from '@/lib/session/builder'
import type { VocabExerciseData } from '@/lib/session/types'

export function IntroCard({ item, onNext }: { item: SessionItem, onNext: () => void }) {
    const { term, meaning, partOfSpeech, article, exampleSentence, imageUrl } = item.data as VocabExerciseData

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Từ mới</h2>
                
                <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6 flex flex-col items-center text-center">
                    {/* Placeholder for image if unavailable */}
                    <div className="w-32 h-32 bg-[#F3FBFF] rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                            <img src={imageUrl} alt={term} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl">🖼️</span>
                        )}
                    </div>
                    
                    <div className="text-3xl font-black text-fuxie-primary mb-2">
                        {article ? <span className="opacity-50 text-xl font-medium mr-2">{article}</span> : null}
                        {term}
                    </div>
                    
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-6">
                        {partOfSpeech}
                    </div>

                    <div className="text-lg text-gray-700 font-medium mb-6">
                        {meaning}
                    </div>

                    {exampleSentence && (
                        <div className="w-full bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                            <div className="text-xs text-gray-400 font-bold uppercase mb-1">Ví dụ</div>
                            <div className="text-gray-700 italic">&quot;{exampleSentence}&quot;</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-[#CCE4F0]/30">
                <button
                    onClick={onNext}
                    className="w-full py-4 bg-[#2EC4B6] hover:bg-[#25b5a7] active:bg-[#1fa093] text-white text-base font-black rounded-2xl transition-all duration-300 shadow-md shadow-[#2EC4B6]/25 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <span>Đã hiểu</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    )
}
