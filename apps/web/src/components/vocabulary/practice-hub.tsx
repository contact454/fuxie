'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Mascot } from '@/components/ui/mascot'

interface Theme {
    id: string
    slug: string
    name: string
    nameVi: string | null
    cefrLevel: string
    imageUrl: string | null
    wordCount: number
}

interface PracticeHubProps {
    themes: Theme[]
    availableLevels: string[]
    initialLevel: string
}

const CEFR_COLORS: Record<string, { gradient: string }> = {
    A1: { gradient: 'from-green-500 to-emerald-600' },
    A2: { gradient: 'from-lime-500 to-green-600' },
    B1: { gradient: 'from-orange-400 to-amber-600' },
    B2: { gradient: 'from-red-500 to-orange-600' },
    C1: { gradient: 'from-purple-500 to-violet-600' },
    C2: { gradient: 'from-violet-600 to-purple-800' },
}

export function PracticeHub({ themes, availableLevels, initialLevel }: PracticeHubProps) {
    const router = useRouter()
    const [currentLevel, setCurrentLevel] = useState(initialLevel)
    const [currentThemes, setCurrentThemes] = useState(themes)
    const [isLevelLoading, setIsLevelLoading] = useState(false)

    // Switch CEFR level
    const switchLevel = useCallback(async (level: string) => {
        if (level === currentLevel) return
        setIsLevelLoading(true)
        setCurrentLevel(level)
        try {
            const res = await fetch(`/api/v1/vocabulary/themes?level=${level}`)
            const data = await res.json()
            if (data.success) {
                const newThemes = data.data.map((t: any) => ({
                    id: t.id,
                    slug: t.slug,
                    name: t.name,
                    nameVi: t.nameVi,
                    cefrLevel: t.cefrLevel,
                    imageUrl: t.imageUrl,
                    wordCount: t.wordCount ?? t._count?.items ?? 0,
                }))
                setCurrentThemes(newThemes)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLevelLoading(false)
        }
    }, [currentLevel])

    const startMixedLesson = (themeSlug: string) => {
        // Vào thẳng luồng Mixed Bài học có Flashcard
        router.push(`/vocabulary/practice/mixed?theme=${themeSlug}&level=${currentLevel}`)
    }

    return (
        <div className="max-w-2xl mx-auto mb-20">
            {/* ═══ Top Sticky Banner ═══ */}
            <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 pt-4 pb-2 px-4 shadow-sm">
                {availableLevels.length > 1 && (
                    <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        {availableLevels.map(level => {
                            const colors = CEFR_COLORS[level] ?? CEFR_COLORS['A1']!
                            const isActive = level === currentLevel
                            return (
                                <button
                                    key={level}
                                    onClick={() => switchLevel(level)}
                                    disabled={isLevelLoading}
                                    className={`px-6 py-2 rounded-2xl text-base font-black transition-all ${isActive
                                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-md scale-105`
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    } ${isLevelLoading ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    Niveau {level}
                                </button>
                            )
                        })}
                    </div>
                )}
                <div className="flex items-center gap-4 bg-[#004E89]/5 p-4 rounded-3xl border border-blue-100 mt-2">
                    <Mascot variant="studying" size={56} className="drop-shadow-sm" />
                    <div>
                        <h1 className="text-xl font-black text-[#004E89] uppercase tracking-wide">
                            Lộ trình Từ vựng
                        </h1>
                        <p className="text-sm font-semibold text-gray-500">
                            Học bài theo từng chủ điểm nhé!
                        </p>
                    </div>
                </div>
            </div>

            {/* ═══ Duolingo Z-Path UI ═══ */}
            <div className="relative mt-12 py-8 flex flex-col items-center gap-14 ml-4 mr-4 overflow-hidden">
                {/* SVG Đường kẻ zíc zắc (Giả lập bằng absolute line cho nhanh - sẽ thay bằng viền xoắn nếu đủ không gian) */}
                <div className="absolute top-10 bottom-10 left-1/2 w-4 -ml-2 bg-[#e5e5e5] rounded-full z-0 
                                shadow-[inset_0_0_8px_rgba(0,0,0,0.08)] hidden md:block" />

                {currentThemes.map((theme, idx) => {
                    const cycle = idx % 4
                    let alignClass = ''
                    if (cycle === 1) alignClass = 'translate-x-12 sm:translate-x-20'
                    if (cycle === 3) alignClass = '-translate-x-12 sm:-translate-x-20'
                    
                    return (
                        <div key={theme.id} className={`relative z-10 w-full flex justify-center`}>
                            <div className={`relative flex flex-col items-center ${alignClass} group`}>
                                
                                {/* Nút tròn to (Thẻ Bài học) */}
                                <button
                                    onClick={() => startMixedLesson(theme.slug)}
                                    className="relative w-24 h-24 rounded-full bg-[#58cc02] 
                                               border-b-[8px] border-[#46a302] hover:-translate-y-1 
                                               hover:border-b-[10px] active:border-b-0 active:translate-y-2 
                                               transition-all flex items-center justify-center p-2
                                               shadow-xl shadow-green-100/50"
                                >
                                    <div className="w-full h-full rounded-full bg-white/20 overflow-hidden relative border-2 border-white/40 flex items-center justify-center">
                                        {theme.imageUrl ? (
                                            <Image 
                                                src={theme.imageUrl} 
                                                fill 
                                                className="object-cover drop-shadow-sm mix-blend-multiply" 
                                                alt={theme.name} 
                                            />
                                        ) : (
                                            <span className="text-4xl text-white drop-shadow-md">★</span>
                                        )}
                                    </div>
                                    
                                    {/* Mép phản quang trên nút */}
                                    <div className="absolute top-1.5 left-3 right-3 h-4 bg-white/30 rounded-full blur-[1px]"></div>
                                </button>
                                
                                {/* Khung Tooltip chứa tên chủ đề */}
                                <div className="mt-4 bg-white px-5 py-2.5 rounded-2xl border-2 border-[#e5e5e5] 
                                                shadow-sm font-bold text-gray-700 text-center relative pointer-events-none
                                                group-hover:border-[#58cc02] transition-colors">
                                    {/* Mũi tên trỏ lên */}
                                    <div className="absolute -top-2 left-1/2 -ml-2 w-4 h-4 bg-white border-l-2 border-t-2 border-[#e5e5e5] 
                                                    rotate-45 group-hover:border-[#58cc02] transition-colors"></div>
                                    <span className="relative z-10 block text-[#4b4b4b] uppercase tracking-wide text-xs mb-0.5">
                                        {theme.name}
                                    </span>
                                    <span className="relative z-10 block text-[#afafaf] font-medium text-[11px] leading-tight max-w-[120px]">
                                        {theme.nameVi || (theme.wordCount + ' Wörter')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            {/* End of Path Decorator */}
            <div className="flex justify-center mt-12 mb-10 opacity-70">
                <Mascot variant="lesen" size={80} className="grayscale mix-blend-multiply" />
            </div>
        </div>
    )
}
