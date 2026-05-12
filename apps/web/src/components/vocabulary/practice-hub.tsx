'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { MeasuredLink } from '@/components/performance/measured-link'
import { Mascot } from '@/components/ui/mascot'
import {
    FuxieBadge,
    FuxieLevelTabs,
    FuxiePanel,
    FuxieQuestCard,
} from '@/components/ui/fuxie-ui'

interface Theme {
    id: string
    slug: string
    name: string
    nameNative: string | null
    cefrLevel: string
    imageUrl: string | null
    wordCount: number
}

interface PracticeHubProps {
    themes: Theme[]
    availableLevels: string[]
    initialLevel: string
}



export function PracticeHub({ themes, availableLevels, initialLevel }: PracticeHubProps) {
    const t = useTranslations('UI')
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
                    nameNative: (t.translations as any)?.['vi'] || t.name,
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

    const getMixedLessonHref = (themeSlug: string) => `/vocabulary/practice/mixed?theme=${themeSlug}&level=${currentLevel}`
    return (
        <div className="max-w-2xl mx-auto mb-20">
            {/* ═══ Top Sticky Banner ═══ */}
            <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 pt-4 pb-2 px-4 shadow-sm">
                {availableLevels.length > 1 && (
                    <div className="mb-4 flex justify-center">
                        <FuxieLevelTabs
                            items={availableLevels}
                            activeItem={currentLevel}
                            onSelect={switchLevel}
                            disabled={isLevelLoading}
                            getLabel={(level) => <>Niveau {level}</>}
                            ariaLabel="Vocabulary CEFR level"
                        />
                    </div>
                )}
                <FuxiePanel variant="soft" className="mt-2 flex items-center gap-4 p-4">
                    <Mascot variant="studying" size={56} className="drop-shadow-sm" />
                    <div className="min-w-0 flex-1">
                        <FuxieBadge tone="brand" className="mb-2">
                            {currentLevel} Path
                        </FuxieBadge>
                        <h1 className="text-xl font-black text-[#3C78A8] uppercase tracking-wide">
                            Lộ trình Từ vựng
                        </h1>
                        <p className="text-sm font-semibold text-gray-500">
                            {t('studyByTheme')}
                        </p>
                    </div>
                </FuxiePanel>
            </div>

            {/* ═══ Duolingo Z-Path UI ═══ */}
            <div className="relative mt-12 py-8 flex flex-col items-center gap-14 ml-4 mr-4 overflow-hidden">
                {/* SVG Đường kẻ zíc zắc (Giả lập bằng absolute line cho nhanh - sẽ thay bằng viền xoắn nếu đủ không gian) */}
                <div className="absolute top-10 bottom-10 left-1/2 z-0 -ml-2 hidden w-4 rounded-full bg-gradient-to-b from-[#60A8E4]/20 via-[#2EC4B6]/35 to-[#60A8E4]/20 shadow-[inset_0_0_8px_rgba(46,196,182,0.18)] md:block" />

                {currentThemes.map((theme, idx) => {
                    const cycle = idx % 4
                    let alignClass = ''
                    if (cycle === 1) alignClass = 'translate-x-12 sm:translate-x-20'
                    if (cycle === 3) alignClass = '-translate-x-12 sm:-translate-x-20'
                    
                    return (
                        <div key={theme.id} className={`relative z-10 w-full flex justify-center`}>
                            <div className={`relative flex flex-col items-center ${alignClass} group`}>
                                
                                {/* Nút tròn to (Thẻ Bài học) */}
                                <MeasuredLink
                                    href={getMixedLessonHref(theme.slug)}
                                    flow="vocabulary.practice.theme"
                                    source={theme.slug}
                                    prefetch={idx < 4}
                                    className="relative flex h-24 w-24 items-center justify-center rounded-full border-b-[8px] border-[#2A8F97] bg-gradient-to-br from-[#60A8E4] via-[#2EC4B6] to-[#3C78A8] p-2 shadow-xl shadow-sky-900/15 transition-all hover:-translate-y-1 hover:border-b-[10px] active:translate-y-2 active:border-b-0"
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
                                </MeasuredLink>
                                
                                {/* Khung Tooltip chứa tên chủ đề */}
                                <FuxieQuestCard
                                    interactive={false}
                                    className="pointer-events-none relative mt-4 px-5 py-2.5 text-center font-bold text-gray-700 transition-colors group-hover:border-[#60A8E4]/45"
                                >
                                    {/* Mũi tên trỏ lên */}
                                    <div className="absolute -top-2 left-1/2 -ml-2 h-4 w-4 rotate-45 border-l border-t border-slate-100 bg-white transition-colors group-hover:border-[#60A8E4]/45"></div>
                                    <span className="relative z-10 block text-[#4b4b4b] uppercase tracking-wide text-xs mb-0.5">
                                        {theme.name}
                                    </span>
                                    <span className="relative z-10 block text-[#afafaf] font-medium text-[11px] leading-tight max-w-[120px]">
                                        {theme.nameNative || (theme.wordCount + ' từ')}
                                    </span>
                                </FuxieQuestCard>
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
