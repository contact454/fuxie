'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Gauge, Layers3, Swords } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { MeasuredLink } from '@/components/performance/measured-link'
import { FuxieBadge, FuxieLevelTabs, FuxiePanel, FuxieQuestCard, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { VOCABULARY_MICROGAMES } from '@/lib/gamification/lesson-gameplay-expansion'

interface MicrogameTheme {
    id: string
    slug: string
    name: string
    nameNative?: string | null
    cefrLevel: string
    wordCount: number
}

interface VocabularyMicrogameHubProps {
    themes: MicrogameTheme[]
    availableLevels: string[]
    initialLevel: string
    initialTheme?: string | null
}

const GAME_ICONS = {
    'speed-match': Gauge,
    'cloze-streak': Layers3,
    'boss-review': Swords,
}

export function VocabularyMicrogameHub({
    themes,
    availableLevels,
    initialLevel,
    initialTheme,
}: VocabularyMicrogameHubProps) {
    const t = useTranslations('VocabularyMicrogame')
    const [level, setLevel] = useState(initialLevel)
    const levelThemes = useMemo(
        () => themes.filter((theme) => theme.cefrLevel === level),
        [level, themes],
    )
    const [selectedSlug, setSelectedSlug] = useState(
        initialTheme && themes.some((theme) => theme.slug === initialTheme)
            ? initialTheme
            : levelThemes[0]?.slug ?? themes[0]?.slug ?? '',
    )
    const selectedTheme = levelThemes.find((theme) => theme.slug === selectedSlug) ?? levelThemes[0] ?? null

    const handleLevel = (nextLevel: string) => {
        setLevel(nextLevel)
        const firstTheme = themes.find((theme) => theme.cefrLevel === nextLevel)
        if (firstTheme) setSelectedSlug(firstTheme.slug)
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
            <FuxiePanel variant="hero" className="overflow-hidden p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <FuxieBadge tone="brand" className="normal-case tracking-normal">{t('packTitle')}</FuxieBadge>
                            <FuxieBadge tone="reward" className="normal-case tracking-normal">{t('rewardOnCompletion')}</FuxieBadge>
                        </div>
                        <h1 className="mt-3 text-3xl font-black leading-tight text-text-primary sm:text-4xl">
                            Chọn một ván từ vựng ngắn
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-text-brand">
                            Speed Match, Cloze Streak và Boss Review dùng lại submit route hiện có, nên XP/Fucoin/streak vẫn chỉ tính khi em hoàn thành bài học thật.
                        </p>
                    </div>
                    <MeasuredLink
                        href="/campaign"
                        flow="microgames.campaign.open"
                        source="microgame-hub"
                        className={fuxieButtonClass('secondary', 'md', 'shrink-0')}
                    >
                        Xem campaign map
                        <ArrowRight className="h-4 w-4" />
                    </MeasuredLink>
                </div>

                {availableLevels.length > 1 ? (
                    <FuxieLevelTabs
                        items={availableLevels}
                        activeItem={level}
                        onSelect={handleLevel}
                        className="mt-5"
                        ariaLabel="Microgame CEFR level"
                    />
                ) : null}
            </FuxiePanel>

            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <FuxiePanel className="p-4">
                    <p className="text-xs font-black uppercase text-text-brand">Theme deck</p>
                    <div className="mt-3 grid gap-2">
                        {levelThemes.slice(0, 12).map((theme) => (
                            <button
                                key={theme.id}
                                type="button"
                                onClick={() => setSelectedSlug(theme.slug)}
                                className={`rounded-2xl px-3 py-3 text-left ring-1 transition ${
                                    selectedTheme?.slug === theme.slug
                                        ? 'bg-[#F3FBFF] text-text-brand ring-[#60A8E4]/35'
                                        : 'bg-white text-slate-600 ring-slate-100 hover:bg-slate-50'
                                }`}
                            >
                                <p className="truncate text-sm font-black">{theme.name}</p>
                                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                                    {theme.nameNative || `${theme.wordCount} words`}
                                </p>
                            </button>
                        ))}
                    </div>
                </FuxiePanel>

                <div className="grid gap-4 md:grid-cols-3">
                    {VOCABULARY_MICROGAMES.map((game) => {
                        const Icon = GAME_ICONS[game.id]
                        const href = selectedTheme ? game.hrefForTheme(selectedTheme.slug, level) : '/vocabulary/practice'
                        return (
                            <FuxieQuestCard key={game.id} className="flex min-h-[430px] flex-col p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F3FBFF] text-text-brand ring-1 ring-[#60A8E4]/20">
                                        <Icon className="h-6 w-6" />
                                    </span>
                                    <FuxieBadge tone="neutral" className="normal-case tracking-normal">
                                        ~{game.estimatedMinutes} min
                                    </FuxieBadge>
                                </div>
                                <h2 className="mt-4 text-xl font-black text-text-primary">{game.title}</h2>
                                <p className="mt-1 text-sm font-bold text-text-brand">{game.subtitle}</p>
                                <p className="mt-3 flex-1 text-sm font-medium leading-relaxed text-slate-600">
                                    {game.objective}
                                </p>
                                <div className="mt-4 space-y-3 rounded-2xl bg-white/85 p-3 text-sm ring-1 ring-[#CCE4F0]/70">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-text-brand">Success criteria</p>
                                        <ul className="mt-2 space-y-1 text-xs font-bold text-slate-700">
                                            {game.successCriteria.map((criterion) => (
                                                <li key={criterion} className="flex gap-2">
                                                    <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#60A8E4]" />
                                                    <span>{criterion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="grid gap-2 text-xs font-bold text-slate-700">
                                        <div className="rounded-xl bg-[#F3FBFF] p-2">
                                            <span className="block text-[11px] uppercase tracking-[0.08em] text-text-brand">Completion rule</span>
                                            {game.completionRule}
                                        </div>
                                        <div className="rounded-xl bg-[#F3FBFF] p-2">
                                            <span className="block text-[11px] uppercase tracking-[0.08em] text-text-brand">{t('receiptAfterSubmit')}</span>
                                            {game.receiptExpectation}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 rounded-2xl bg-[#FFF7D6]/70 p-3 text-xs font-bold text-text-warning ring-1 ring-[#FFD166]/45">
                                    Badge hook: {game.badgeHint}. Không có thưởng cho click, chỉ có receipt sau submit.
                                </div>
                                <div className="mt-4 rounded-2xl bg-[#F3FBFF] px-3 py-2 text-xs font-black text-text-brand ring-1 ring-[#CCE4F0]/70">
                                    <span className="block text-[11px] uppercase tracking-[0.08em] text-text-brand/70">{t('afterRoundLabel')}</span>
                                    {game.nextActionLabel}
                                </div>
                                <MeasuredLink
                                    href={href}
                                    flow="vocabulary.microgame.start"
                                    source={game.id}
                                    analytics={{
                                        eventName: 'quest_episode_started',
                                        source: 'vocabulary.microgame.started',
                                        actionId: `microgame:${game.id}:${selectedTheme?.slug ?? 'unknown'}`,
                                        actionType: 'vocabulary_practice',
                                        level,
                                        skill: 'vocabulary',
                                        metadata: {
                                            microgameId: game.id,
                                            gameplayMode: game.id,
                                            completionRuleCode: game.practiceType,
                                            nextAction: game.id === 'speed-match' ? 'cloze-streak' : game.id === 'cloze-streak' ? 'boss-review' : 'campaign-map',
                                            themeSlug: selectedTheme?.slug ?? 'unknown',
                                            cefrLevel: level,
                                            surface: 'microgame_hub',
                                        },
                                    }}
                                    className={fuxieButtonClass('primary', 'md', 'mt-5 w-full')}
                                >
                                    Chơi {game.title}
                                    <ArrowRight className="h-4 w-4" />
                                </MeasuredLink>
                            </FuxieQuestCard>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
