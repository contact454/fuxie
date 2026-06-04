'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Flame,
    LockKeyhole,
    Map,
    RotateCcw,
    Sparkles,
} from 'lucide-react'

import { FuxieCoach, RewardPreview, type RewardPreviewItem } from '@/components/gamification/quest-visuals'
import { MeasuredLink } from '@/components/performance/measured-link'
import { Mascot } from '@/components/ui/mascot'
import { FuxieBadge, FuxieLevelTabs, FuxiePanel, FuxieProgressBar, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { getCefrTheme } from '@/lib/constants/cefr'
import { FUXIE_UI_FRAMES, FUXIE_WORLD_PROPS } from '@/lib/mascot/fuxie-assets'
import { useLevelSwitcher } from '@/hooks/use-level-switcher'

import { ProgressRing, type Theme, type VocabItem } from './vocabulary-types'

const WordCard = dynamic(() => import('./WordCard').then(mod => mod.WordCard), {
    ssr: false,
    loading: () => <div className="h-[132px] rounded-xl border border-gray-100 bg-gray-50 animate-pulse" />,
})

// ─── Props ──────────────────────────────────────────
interface VocabularyClientProps {
    themes: Theme[]
    totalWords: number
    totalDue: number
    availableLevels: string[]
    initialLevel: string
}

interface VocabularyQuestWorldProps {
    themes: Theme[]
    selectedSlug: string
    selectedIndex: number
    selectedTheme: Theme | null
    currentLevel: string
    availableLevels: string[]
    totalWords: number
    totalLearned: number
    totalDue: number
    overallProgress: number
    cefrGradient: string
    isLevelLoading: boolean
    isAdding: boolean
    practiceError: string | null
    onSelect: (slug: string) => void
    onSwitchLevel: (level: string) => void
    onPracticeTheme: (surface: 'world' | 'detail') => void
}

const WORLD_NODE_GRADIENTS = [
    'from-[#60A8E4] to-[#2EC4B6]',
    'from-[#54A8E4] to-[#3C78A8]',
    'from-[#7C3AED] to-[#60A8E4]',
    'from-[#56B947] to-[#2EC4B6]',
    'from-[#0EA5E9] to-[#2EC4B6]',
    'from-[#F43F5E] to-[#FF8A3D]',
]

function getThemeProgress(theme: Theme) {
    return theme.wordCount > 0
        ? Math.round((theme.srsProgress.learned / theme.wordCount) * 100)
        : 0
}

function getVocabularyRewards(selectedTheme: Theme | null, totalDue: number): RewardPreviewItem[] {
    const dueCount = selectedTheme?.srsProgress.due ?? totalDue
    const wordCount = selectedTheme?.wordCount ?? 0

    return [
        { type: 'xp', label: `+${Math.max(20, Math.round(wordCount / 2))} XP`, detail: 'Hoàn thành chủ đề' },
        { type: dueCount > 0 ? 'streak' : 'unlock', label: dueCount > 0 ? `${dueCount} cần ôn` : 'SRS sạch', detail: 'Giữ nhịp nhớ từ' },
        { type: 'unlock', label: 'Next theme', detail: 'Mở chặng tiếp theo' },
    ]
}

function PracticeErrorMessage({ message, className = '' }: { message: string | null; className?: string }) {
    if (!message) return null

    return (
        <p
            role="alert"
            className={`rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold leading-relaxed text-rose-700 ring-1 ring-rose-100 ${className}`}
        >
            {message}
        </p>
    )
}

function VocabularyQuestWorld({
    themes,
    selectedSlug,
    selectedIndex,
    selectedTheme,
    currentLevel,
    availableLevels,
    totalWords,
    totalLearned,
    totalDue,
    overallProgress,
    cefrGradient,
    isLevelLoading,
    isAdding,
    practiceError,
    onSelect,
    onSwitchLevel,
    onPracticeTheme,
}: VocabularyQuestWorldProps) {
    const t = useTranslations('Gamification')
    const selectedProgress = selectedTheme ? getThemeProgress(selectedTheme) : 0
    const nextTheme = themes[selectedIndex + 1] ?? themes.find(theme => getThemeProgress(theme) < 100)
    const selectedWordCount = selectedTheme?.wordCount ?? 0
    const practiceCtaLabel = isAdding
        ? 'Đang mở ôn tập...'
        : selectedTheme
            ? `Ôn ${selectedWordCount} từ`
            : 'Chọn chủ đề'
    const mapWidth = Math.max(720, themes.length * 132)
    const pathPercent = themes.length > 1
        ? Math.min(100, Math.round((selectedIndex / (themes.length - 1)) * 100))
        : 0

    return (
        <FuxiePanel variant="hero" className="mb-8 overflow-hidden">
            <div className="relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(96,168,228,0.32),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(46,196,182,0.24),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.72),transparent_42%)]" />

                <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="min-w-0">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <FuxieBadge tone="brand" className="bg-white/75">
                                <Map className="h-3.5 w-3.5 text-fuxie-accent" />
                                Word world {currentLevel}
                            </FuxieBadge>
                            <FuxieBadge tone="brand" className="bg-white/75">
                                <BookOpen className="h-3.5 w-3.5 text-fuxie-reward" />
                                {totalWords} từ
                            </FuxieBadge>
                            <FuxieBadge tone="reward" className="bg-white/75">
                                <Flame className="h-3.5 w-3.5 text-fuxie-energy" />
                                {totalDue} cần ôn
                            </FuxieBadge>
                        </div>

                        {availableLevels.length > 1 && (
                            <FuxieLevelTabs
                                items={availableLevels}
                                activeItem={currentLevel}
                                onSelect={onSwitchLevel}
                                disabled={isLevelLoading}
                                getActiveClassName={(level) => {
                                    const colors = getCefrTheme(level)
                                    return `bg-gradient-to-r ${colors.gradient} text-white shadow-lg shadow-slate-950/20`
                                }}
                                ariaLabel="Vocabulary CEFR level filter"
                                className="mb-5 bg-white/45"
                            />
                        )}

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-bold uppercase text-text-brand">{t('worldMapTitle')}</p>
                                <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                                    Mở khóa từng đảo từ vựng
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
                                    {t('vocabMapDesc')}
                                </p>
                            </div>

                            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                                <MeasuredLink
                                    href={`/vocabulary/microgames?theme=${selectedTheme?.slug ?? ''}&level=${currentLevel}`}
                                    flow="vocabulary.microgames.open"
                                    source={selectedTheme?.slug ?? 'none'}
                                    className={fuxieButtonClass('secondary', 'lg', 'rounded-2xl')}
                                >
                                    Microgames
                                    <Sparkles className="h-4 w-4" />
                                </MeasuredLink>
                                <button
                                    onClick={() => onPracticeTheme('world')}
                                    disabled={!selectedTheme || isAdding || isLevelLoading}
                                    className={fuxieButtonClass('primary', 'lg', 'rounded-2xl')}
                                >
                                    {practiceCtaLabel}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <PracticeErrorMessage message={practiceError} className="mt-4" />

                        <div className="mt-5 rounded-2xl bg-white/70 p-3 ring-1 ring-[#60A8E4]/20">
                            <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                                <span>{totalLearned}/{totalWords} từ đã học</span>
                                <span>{overallProgress}% hoàn thành</span>
                            </div>
                            <FuxieProgressBar value={overallProgress} className="mt-2 h-3" />
                        </div>

                        <div className="mt-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div
                                className="relative flex items-center justify-between px-4 py-12"
                                style={{ width: mapWidth }}
                            >
                                <div className="absolute left-12 right-12 top-1/2 h-3 -translate-y-1/2 rounded-full bg-[#CCE4F0]/70" />
                                <div
                                    className={`absolute left-12 top-1/2 h-3 -translate-y-1/2 rounded-full bg-gradient-to-r ${cefrGradient}`}
                                    style={{ width: `calc((100% - 6rem) * ${pathPercent / 100})` }}
                                />

                                {themes.map((theme, index) => {
                                    const isSelected = theme.slug === selectedSlug
                                    const progress = getThemeProgress(theme)
                                    const isDone = progress >= 100
                                    const gradient = WORLD_NODE_GRADIENTS[index % WORLD_NODE_GRADIENTS.length]
                                    const offsetClass = index % 2 === 0 ? 'translate-y-5' : '-translate-y-5'

                                    return (
                                        <button
                                            key={theme.id}
                                            onClick={() => onSelect(theme.slug)}
                                            className={`group relative z-10 flex w-24 flex-col items-center ${offsetClass}`}
                                            aria-label={`Chọn chủ đề ${theme.name}`}
                                        >
                                            <span
                                                className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-xl ring-4 transition group-hover:-translate-y-1 ${
                                                    isSelected
                                                        ? 'ring-[#FFD166]/80'
                                                        : isDone
                                                            ? 'ring-[#2EC4B6]/45'
                                                            : 'ring-white/25'
                                                } bg-gradient-to-br ${gradient}`}
                                            >
                                                {theme.imageUrl ? (
                                                    <Image
                                                        src={theme.imageUrl}
                                                        alt=""
                                                        fill
                                                        sizes="64px"
                                                        className="object-cover opacity-85"
                                                    />
                                                ) : null}
                                                <span className="absolute inset-0 bg-slate-950/15" />
                                                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-text-brand shadow-sm">
                                                    {isDone ? (
                                                        <CheckCircle2 className="h-5 w-5 text-text-success" />
                                                    ) : isSelected ? (
                                                        <Sparkles className="h-5 w-5 text-text-brand" />
                                                    ) : (
                                                        <BookOpen className="h-5 w-5" />
                                                    )}
                                                </span>
                                                <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5">
                                                    <ProgressRing progress={progress} size={26} strokeWidth={3} />
                                                </span>
                                            </span>
                                            <span className={`mt-3 max-w-24 truncate text-center text-xs font-black ${isSelected ? 'text-text-brand' : 'text-slate-500'}`}>
                                                {theme.name}
                                            </span>
                                            <span className="mt-1 text-xs font-bold text-slate-400">{progress}%</span>
                                        </button>
                                    )
                                })}

                                <div className="-translate-y-7">
                                    <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD166] to-[#FF8A3D] text-white shadow-xl ring-4 ring-white/70">
                                        <LockKeyhole className="h-7 w-7" />
                                    </span>
                                    <span className="mt-3 block text-center text-xs font-black text-fuxie-reward">Next reward</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-col gap-4">
                        <div className="grid grid-cols-3 gap-2">
                            {[FUXIE_WORLD_PROPS.collectionBookTable, FUXIE_WORLD_PROPS.phraseStamp, FUXIE_WORLD_PROPS.postcardFragment].map((src) => (
                                <div key={src} className="grid h-20 place-items-center rounded-2xl bg-white/70 p-2 shadow-sm ring-1 ring-white/90">
                                    <Image
                                        src={src}
                                        alt=""
                                        width={64}
                                        height={64}
                                        className="h-full w-full object-contain drop-shadow-sm"
                                    />
                                </div>
                            ))}
                        </div>
                        <FuxiePanel className="relative overflow-hidden p-4 shadow-lg ring-1 ring-white/70">
                            <Image
                                src={FUXIE_UI_FRAMES.collectionCardFrame}
                                alt=""
                                width={124}
                                height={124}
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 object-contain opacity-[0.18]"
                            />
                            <div className="relative flex items-start gap-4">
                                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                                    {selectedTheme?.imageUrl ? (
                                        <Image
                                            src={selectedTheme.imageUrl}
                                            alt={selectedTheme.name}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <BookOpen className="h-8 w-8 text-text-brand" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black uppercase text-text-brand">{t('selecting')}</p>
                                    <h2 className="mt-1 truncate text-xl font-black text-slate-950">
                                        {selectedTheme?.name ?? t('selectTheme')}
                                    </h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        {selectedTheme?.nameNative ?? t('startWithAnIsland')}
                                    </p>
                                </div>
                            </div>

                            <div className="relative mt-4">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                    <span>Theme mastery</span>
                                    <span>{selectedProgress}%</span>
                                </div>
                                <FuxieProgressBar value={selectedProgress} tone="success" className="mt-2" />
                            </div>

                            <div className="relative mt-4 grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => onPracticeTheme('world')}
                                    disabled={!selectedTheme || isAdding || isLevelLoading}
                                    className={fuxieButtonClass('primary', 'md', 'rounded-xl px-3')}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {practiceCtaLabel}
                                </button>
                                <MeasuredLink
                                    href={`/vocabulary/microgames?theme=${selectedTheme?.slug ?? ''}&level=${currentLevel}`}
                                    flow="vocabulary.detail.microgames"
                                    source={selectedTheme?.slug ?? 'none'}
                                    className={fuxieButtonClass('secondary', 'md', 'rounded-xl px-3')}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Microgames
                                </MeasuredLink>
                            </div>
                        </FuxiePanel>

                        <FuxieCoach
                            role="coach"
                            eyebrow="Fuxie tip"
                            title={nextTheme ? `Tiếp theo: ${nextTheme.name}` : 'Giữ nhịp học hôm nay'}
                            message={t('vocabMapTip')}
                            className="bg-white"
                        />

                        <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                            <RewardPreview
                                layout="stack"
                                rewards={getVocabularyRewards(selectedTheme, totalDue)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </FuxiePanel>
    )
}

// ─── Main Component ─────────────────────────────────
export function VocabularyClient({ themes, totalWords, totalDue, availableLevels, initialLevel }: VocabularyClientProps) {
    const router = useRouter()
    const [currentThemes, setCurrentThemes] = useState(themes)
    const [currentTotalWords, setCurrentTotalWords] = useState(totalWords)
    const [currentTotalDue, setCurrentTotalDue] = useState(totalDue)
    const [selectedThemeSlug, setSelectedThemeSlug] = useState<string>(themes[0]?.slug ?? '')
    const [words, setWords] = useState<VocabItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showAllWords, setShowAllWords] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [practiceError, setPracticeError] = useState<string | null>(null)
    const [practiceErrorSurface, setPracticeErrorSurface] = useState<'world' | 'detail' | null>(null)
    const locale = useLocale()
    const detailRef = useRef<HTMLDivElement>(null)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── useLevelSwitcher hook ──
    const { currentLevel, isLevelLoading, switchLevel } = useLevelSwitcher<Theme[]>({
        initialLevel,
        apiEndpoint: '/api/v1/vocabulary/themes?level={level}',
        transformData: (data: { success: boolean; data: Theme[] }) => {
            if (!data.success) return []
            return data.data.map((t: Theme) => ({
                ...t,
                srsProgress: t.srsProgress ?? { total: 0, learned: 0, due: 0 },
            }))
        },
        onSuccess: (newThemes, level) => {
            setCurrentThemes(newThemes)
            setCurrentTotalWords(newThemes.reduce((s, t) => s + t.wordCount, 0))
            setCurrentTotalDue(newThemes.reduce((s, t) => s + (t.srsProgress?.due ?? 0), 0))
            setWords([])
            setShowAllWords(false)
            setPracticeError(null)
            setPracticeErrorSurface(null)
            if (newThemes[0]) {
                setSelectedThemeSlug(newThemes[0].slug)
                loadWordsForLevel(newThemes[0].slug, level)
            } else {
                setWords([])
                setSelectedThemeSlug('')
            }
        },
    })

    const cefrColors = getCefrTheme(currentLevel)
    const selectedTheme = currentThemes.find(t => t.slug === selectedThemeSlug) ?? null
    const totalLearned = currentThemes.reduce((s, t) => s + t.srsProgress.learned, 0)
    const overallProgress = currentTotalWords > 0 ? Math.round((totalLearned / currentTotalWords) * 100) : 0
    const selectedThemeIndex = Math.max(0, currentThemes.findIndex(t => t.slug === selectedThemeSlug))

    // ── Data fetching ──
    const loadWordsForLevel = useCallback(async (slug: string, level: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/v1/vocabulary?theme=${slug}&level=${level}&limit=100&locale=${locale}`)

            const data = await res.json()
            if (data.success) setWords(data.data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [locale])

    const loadWords = useCallback(async (slug: string) => {
        loadWordsForLevel(slug, currentLevel)
    }, [loadWordsForLevel, currentLevel])

    // Auto-load first theme
    useEffect(() => {
        if (themes[0]) loadWordsForLevel(themes[0].slug, initialLevel)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        }
    }, [])

    // ── Handlers ──
    const selectTheme = (slug: string) => {
        setSelectedThemeSlug(slug)
        setShowAllWords(false)
        setPracticeError(null)
        setPracticeErrorSurface(null)
        loadWords(slug)
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = setTimeout(() => {
            detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 100)
    }

    const addToSrsAndPractice = async (surface: 'world' | 'detail') => {
        if (!selectedTheme) return
        setIsAdding(true)
        setPracticeError(null)
        setPracticeErrorSurface(null)
        try {
            const res = await fetch('/api/v1/srs/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ themeSlug: selectedTheme.slug }),
            })
            if (!res.ok) throw new Error(`Could not open review for ${selectedTheme.slug}`)
            router.push('/review')
        } catch (err) {
            console.error(err)
            setPracticeError('Chưa mở được ôn tập. Kiểm tra kết nối rồi thử lại nhé.')
            setPracticeErrorSurface(surface)
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <VocabularyQuestWorld
                themes={currentThemes}
                selectedSlug={selectedThemeSlug}
                selectedIndex={selectedThemeIndex}
                selectedTheme={selectedTheme}
                currentLevel={currentLevel}
                availableLevels={availableLevels}
                totalWords={currentTotalWords}
                totalLearned={totalLearned}
                totalDue={currentTotalDue}
                overallProgress={overallProgress}
                cefrGradient={cefrColors?.gradient ?? 'from-[#60A8E4] to-[#3C78A8]'}
                isLevelLoading={isLevelLoading}
                isAdding={isAdding}
                practiceError={practiceErrorSurface === 'world' ? practiceError : null}
                onSelect={selectTheme}
                onSwitchLevel={switchLevel}
                onPracticeTheme={addToSrsAndPractice}
            />

            {selectedTheme && (
                <div
                    ref={detailRef}
                    className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm animate-fade-in-up"
                >
                    <Image
                        src={FUXIE_UI_FRAMES.collectionCardFrame}
                        alt=""
                        width={128}
                        height={128}
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 object-contain opacity-[0.14]"
                    />
                    {/* Theme Header */}
                    <div className="relative p-6 flex items-start gap-5">
                        <div className="relative w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
                            {selectedTheme.imageUrl ? (
                                <Image
                                    src={selectedTheme.imageUrl}
                                    alt={selectedTheme.name}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                />
                            ) : (
                                <BookOpen className="h-9 w-9 text-text-brand" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-gray-900">{selectedTheme.name}</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {selectedTheme.nameNative} • {selectedTheme.wordCount} từ
                            </p>

                            {/* Progress */}
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{selectedTheme.srsProgress.learned}/{selectedTheme.wordCount} đã học</span>
                                    <span>
                                        {selectedTheme.wordCount > 0
                                            ? Math.round((selectedTheme.srsProgress.learned / selectedTheme.wordCount) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <FuxieProgressBar
                                    value={selectedTheme.wordCount > 0
                                        ? (selectedTheme.srsProgress.learned / selectedTheme.wordCount) * 100
                                        : 0}
                                    tone="success"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setShowAllWords(!showAllWords)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all
                                        ${showAllWords
                                            ? 'border-[#3C78A8] bg-[#60A8E4]/10 text-text-brand'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span>📖</span>
                                    Xem từ
                                </button>
                                <button
                                    onClick={() => addToSrsAndPractice('detail')}
                                    disabled={isAdding}
                                    className={fuxieButtonClass('primary', 'md', 'flex-1 rounded-xl py-2.5 px-4 shadow-sm')}
                                >
                                    <span>🎯</span>
                                    {isAdding ? 'Đang mở ôn tập...' : `Ôn ${selectedTheme.wordCount} từ`}
                                </button>
                            </div>
                            <PracticeErrorMessage
                                message={practiceErrorSurface === 'detail' ? practiceError : null}
                                className="mt-3"
                            />
                        </div>
                    </div>

                    {/* Word Preview — horizontal scroll */}
                    {!showAllWords && (
                        <div className="relative px-6 pb-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">
                                Xem nhanh từ
                            </p>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Mascot variant="loading" size={56} />
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {words.slice(0, 12).map((w) => (
                                            <WordCard key={w.id} word={w} variant="preview" />
                                        ))}
                                    </div>
                                    {words.length > 0 && (
                                        <button
                                            onClick={() => setShowAllWords(true)}
                                            className="mt-3 text-sm font-semibold text-text-brand hover:text-text-brand transition-colors flex items-center gap-1"
                                        >
                                            {words.length > 12
                                                ? `Xem tất cả ${selectedTheme.wordCount} từ`
                                                : 'Xem chi tiết'
                                            }
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Full Word List — expanded */}
                    {showAllWords && (
                        <div className="px-6 pb-6 animate-fade-in-up">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase">
                                    Tất cả từ ({words.length})
                                </p>
                                <button
                                    onClick={() => setShowAllWords(false)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                    </svg>
                                    Thu gọn
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Mascot variant="loading" size={64} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {words.map((w) => (
                                        <WordCard key={w.id} word={w} variant="list" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
