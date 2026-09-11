'use client'

import * as React from 'react'
import { IsoPlate, FrostedPanel, PrimaryCta } from '@fuxie/ui/components'
import { FuxiePose } from './fuxie-pose'

export interface LessonIntroProps {
    themeName: string
    wordCount: number
    onStart: () => void
    onExit: () => void
}

export function LessonIntro({ themeName, wordCount, onStart, onExit }: LessonIntroProps) {
    // Estimate practice duration: roughly 30 seconds per word
    const estimatedMinutes = Math.ceil(wordCount * 0.5)

    return (
        <div className="fixed inset-0 z-50 flex flex-col fuxie-learn-bg overflow-y-auto">
            {/* Header / Back button */}
            <div className="fuxie-header-base flex items-center shrink-0">
                <button
                    onClick={onExit}
                    aria-label={"Back to overview" /* // locale-allow */}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-[#F3FBFF] hover:text-text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/40"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <span className="ml-3 text-sm font-bold text-slate-500">{"Giới thiệu bài học" /* // locale-allow */}</span>
            </div>

            {/* Content Stage */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md flex flex-col gap-6 z-10 relative">
                    {/* Nửa trên: IsoPlate containing static plate */}
                    <div className="w-full aspect-[4/3] flex items-center justify-center">
                        <IsoPlate
                            src="/fig/m2-markt-plate.png"
                            alt="Marktplatz scene"
                            bleed
                            className="rounded-[var(--fuxie-radius-lg)] shadow-[var(--fuxie-shadow-iso)] border border-[var(--fuxie-blue-200)] bg-[var(--fuxie-blue-50)]"
                        />
                    </div>

                    {/* Nửa dưới: FrostedPanel */}
                    <FrostedPanel className="flex flex-col items-center text-center p-6">
                        {/* Title */}
                        <h1 className="text-2xl font-black text-[var(--fuxie-blue-900)] leading-tight mb-2">
                            {themeName}
                        </h1>

                        {/* Meta information */}
                        <div className="text-sm font-bold text-[#3C78A8] mb-4 flex items-center gap-1.5 justify-center">
                            <span>{wordCount} từ vựng</span>
                            <span className="text-slate-300">•</span>
                            <span>⏱ ~ {estimatedMinutes} phút</span>
                        </div>

                        {/* Mascot presenter container */}
                        <div className="mb-6 flex justify-center">
                            <FuxiePose
                                pose="idle-wave"
                                size={120}
                                className="transform hover:scale-105 transition-transform duration-300"
                            />
                        </div>

                        {/* Primary Action Button */}
                        <PrimaryCta
                            onClick={onStart}
                            className="w-full py-4 text-base font-black tracking-wide"
                        >
                            Bắt đầu
                        </PrimaryCta>
                    </FrostedPanel>
                </div>
            </div>
        </div>
    )
}
