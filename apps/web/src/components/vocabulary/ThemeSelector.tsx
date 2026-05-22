'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ProgressRing, type Theme } from './vocabulary-types'

interface ThemeSelectorProps {
    themes: Theme[]
    selectedSlug: string
    onSelect: (slug: string) => void
}

export function ThemeSelector({ themes, selectedSlug, onSelect }: ThemeSelectorProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scrollThemes = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
    }

    return (
        <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Deine Themen
            </h2>
            <div className="relative group">
                {/* Left scroll button */}
                <button
                    onClick={() => scrollThemes('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity -ml-3"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Scrollable theme row */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {themes.map((theme) => {
                        const isSelected = selectedSlug === theme.slug
                        const progress = theme.wordCount > 0
                            ? Math.round((theme.srsProgress.learned / theme.wordCount) * 100)
                            : 0

                        return (
                            <button
                                key={theme.id}
                                onClick={() => onSelect(theme.slug)}
                                className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 w-[110px]
                                    ${isSelected
                                        ? 'border-[#60A8E4] bg-[#F3FBFF] shadow-md shadow-sky-100'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                    }`}
                            >
                                {/* Theme image */}
                                <div className="relative mb-2">
                                    {theme.imageUrl ? (
                                        <Image
                                            src={theme.imageUrl}
                                            alt={theme.name}
                                            width={56}
                                            height={56}
                                            className="rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                                            📖
                                        </div>
                                    )}
                                    {/* Mini progress ring overlay */}
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                        <ProgressRing progress={progress} size={22} strokeWidth={2.5} />
                                    </div>
                                </div>
                                {/* Theme name */}
                                <span className={`text-xs font-medium text-center leading-tight line-clamp-2
                                    ${isSelected ? 'text-text-brand' : 'text-gray-700'}`}
                                >
                                    {theme.name}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Right scroll button */}
                <button
                    onClick={() => scrollThemes('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity -mr-3"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
