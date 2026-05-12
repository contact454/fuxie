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

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:static md:bg-transparent md:border-none md:p-0 md:mt-8">
                <button
                    onClick={onNext}
                    className="w-full py-4 rounded-2xl bg-fuxie-primary text-white font-bold text-lg shadow-[0_6px_0_0_rgb(221,98,40)] hover:-translate-y-1 hover:shadow-[0_8px_0_0_rgb(221,98,40)] active:translate-y-2 active:shadow-none transition-all"
                >
                    Đã hiểu
                </button>
            </div>
        </div>
    )
}
