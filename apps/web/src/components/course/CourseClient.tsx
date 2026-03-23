'use client'

import Link from 'next/link'

interface SkillLink {
    skill: 'listening' | 'reading' | 'writing' | 'speaking'
    label: string
    labelVi: string
    href: string
    emoji: string
    count?: number
}

interface CourseData {
    courseTitle: string
    courseTitleDe: string
    courseDescription: string | null
    cefrLevel?: string
    modules: Array<{
        id: string
        slug: string
        title: string
        titleDe: string | null
        description: string | null
        sortOrder: number
        estimatedMinutes: number
        vocabThemes: Array<{
            slug: string
            name: string
            nameVi: string | null
            itemCount: number
            learnedCount: number
        }>
        grammarTopics: Array<{
            slug: string
            titleDe: string
            titleVi: string
            lessonCount: number
            completedCount: number
            totalStars: number
        }>
        skillLinks: SkillLink[]
        isUnlocked: boolean
    }>
}

const MODULE_GRADIENTS = [
    'from-green-500 to-emerald-600',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-violet-600',
    'from-orange-500 to-amber-600',
    'from-teal-500 to-cyan-600',
    'from-rose-500 to-pink-600',
    'from-sky-500 to-blue-600',
    'from-fuchsia-500 to-purple-600',
]

const MODULE_EMOJIS = ['👋', '👨‍👩‍👧‍👦', '🏠', '🍽️', '⏰', '🚌', '💼', '🎯']

export function CourseClient({ data }: { data: CourseData }) {
    const totalVocabItems = data.modules.reduce((s, m) => s + m.vocabThemes.reduce((ss, t) => ss + t.itemCount, 0), 0)
    const totalVocabLearned = data.modules.reduce((s, m) => s + m.vocabThemes.reduce((ss, t) => ss + t.learnedCount, 0), 0)
    const totalGrammarLessons = data.modules.reduce((s, m) => s + m.grammarTopics.reduce((ss, t) => ss + t.lessonCount, 0), 0)
    const totalGrammarCompleted = data.modules.reduce((s, m) => s + m.grammarTopics.reduce((ss, t) => ss + t.completedCount, 0), 0)

    const level = data.cefrLevel ?? 'A1'
    const levelColors: Record<string, string> = {
        A1: 'bg-green-500', A2: 'bg-teal-500', B1: 'bg-blue-500',
        B2: 'bg-indigo-500', C1: 'bg-purple-500', C2: 'bg-rose-500',
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Course Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full ${levelColors[level] ?? 'bg-green-500'} text-white text-sm font-bold`}>{level}</span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        📚 {data.courseTitleDe}
                    </h1>
                </div>
                {data.courseDescription && (
                    <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                        {data.courseDescription}
                    </p>
                )}
                {/* Course summary stats */}
                <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <span className="text-base">📖</span>
                        <span className="font-medium text-gray-700">{data.modules.length}</span> Module
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <span className="text-base">📝</span>
                        <span className="font-medium text-gray-700">{totalVocabLearned}/{totalVocabItems}</span> Wörter
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <span className="text-base">📐</span>
                        <span className="font-medium text-gray-700">{totalGrammarCompleted}/{totalGrammarLessons}</span> Grammatik
                    </div>
                </div>
            </div>

            {/* Module Timeline */}
            <div className="relative">
                {/* Vertical timeline line */}
                <div
                    className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-300 via-blue-300 to-purple-300"
                    aria-hidden
                />

                <div className="space-y-6">
                    {data.modules.map((mod, idx) => {
                        const gradient = MODULE_GRADIENTS[idx % MODULE_GRADIENTS.length]
                        const emoji = MODULE_EMOJIS[idx] ?? '📘'
                        const totalItems = mod.vocabThemes.reduce((s, t) => s + t.itemCount, 0) +
                            mod.grammarTopics.reduce((s, t) => s + t.lessonCount, 0)
                        const completedItems = mod.vocabThemes.reduce((s, t) => s + t.learnedCount, 0) +
                            mod.grammarTopics.reduce((s, t) => s + t.completedCount, 0)
                        const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
                        const isDone = progressPercent >= 100

                        return (
                            <div key={mod.id} className="relative pl-14">
                                {/* Timeline dot */}
                                <div className={`absolute left-3 top-5 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md
                                    bg-gradient-to-br ${gradient} ${isDone ? 'ring-2 ring-offset-2 ring-green-400' : ''}`}>
                                    {isDone ? '✓' : mod.sortOrder}
                                </div>

                                {/* Module Card */}
                                <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden
                                    transition-all hover:shadow-md ${!mod.isUnlocked ? 'opacity-60' : ''}`}>
                                    {/* Card Header */}
                                    <div className={`bg-gradient-to-r ${gradient} p-4 sm:p-5`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-white/60 text-xs font-medium mb-1">
                                                    Modul {mod.sortOrder}
                                                </div>
                                                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                                    <span>{emoji}</span> {mod.titleDe ?? mod.title}
                                                </h2>
                                            </div>
                                            {/* Progress ring */}
                                            <div className="relative flex items-center justify-center w-12 h-12">
                                                <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                                                    <circle
                                                        cx="18" cy="18" r="14"
                                                        fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3"
                                                    />
                                                    <circle
                                                        cx="18" cy="18" r="14"
                                                        fill="none" stroke="white" strokeWidth="3"
                                                        strokeDasharray={`${progressPercent * 0.88} 88`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span className="absolute text-xs font-bold text-white">
                                                    {progressPercent}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 sm:p-5">
                                        {mod.description && (
                                            <p className="text-sm text-gray-500 mb-4">{mod.description}</p>
                                        )}

                                        {/* Vocab Themes */}
                                        {mod.vocabThemes.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                                    📚 Wortschatz
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {mod.vocabThemes.map(theme => {
                                                        const pct = theme.itemCount > 0
                                                            ? Math.round((theme.learnedCount / theme.itemCount) * 100)
                                                            : 0
                                                        return (
                                                            <Link
                                                                key={theme.slug}
                                                                href="/vocabulary"
                                                                className="group flex items-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 px-3 py-2 transition-colors"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                                        {theme.name}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400">
                                                                        {theme.nameVi} · {theme.learnedCount}/{theme.itemCount}
                                                                    </p>
                                                                </div>
                                                                {/* Mini progress */}
                                                                <div className="w-8 h-8 relative shrink-0">
                                                                    <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                                                                        <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                                                        <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="3"
                                                                            strokeDasharray={`${pct * 0.88} 88`}
                                                                            strokeLinecap="round" />
                                                                    </svg>
                                                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-blue-600">
                                                                        {pct}%
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Grammar Topics */}
                                        {mod.grammarTopics.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                                    📐 Grammatik
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {mod.grammarTopics.map(topic => {
                                                        const pct = topic.lessonCount > 0
                                                            ? Math.round((topic.completedCount / topic.lessonCount) * 100)
                                                            : 0
                                                        return (
                                                            <Link
                                                                key={topic.slug}
                                                                href={`/grammar/${topic.slug}`}
                                                                className="group flex items-center gap-2 rounded-xl bg-amber-50 hover:bg-amber-100 px-3 py-2 transition-colors"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                                        {topic.titleDe}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400">
                                                                        {topic.titleVi} · {topic.completedCount}/{topic.lessonCount} · {topic.totalStars}⭐
                                                                    </p>
                                                                </div>
                                                                {/* Mini progress */}
                                                                <div className="w-8 h-8 relative shrink-0">
                                                                    <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                                                                        <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                                                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="3"
                                                                            strokeDasharray={`${pct * 0.88} 88`}
                                                                            strokeLinecap="round" />
                                                                    </svg>
                                                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-amber-600">
                                                                        {pct}%
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Skill Links (Listening, Reading, Writing, Speaking) */}
                                        {mod.skillLinks && mod.skillLinks.length > 0 && (
                                            <div className="mt-4">
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                                    🎯 Kỹ năng
                                                </h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {mod.skillLinks.map(skill => (
                                                        <Link
                                                            key={skill.skill}
                                                            href={skill.href}
                                                            className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 hover:bg-gray-100 px-3 py-3 transition-colors text-center"
                                                        >
                                                            <span className="text-xl">{skill.emoji}</span>
                                                            <span className="text-xs font-medium text-gray-700">{skill.label}</span>
                                                            <span className="text-[10px] text-gray-400">{skill.labelVi}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Empty state */}
                                        {mod.vocabThemes.length === 0 && mod.grammarTopics.length === 0 && (!mod.skillLinks || mod.skillLinks.length === 0) && (
                                            <p className="text-sm text-gray-400 italic">
                                                Tổng ôn — không có nội dung mới
                                            </p>
                                        )}

                                        {/* Footer with estimated time */}
                                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                            <span>⏱️ ~{Math.round(mod.estimatedMinutes / 60)} giờ</span>
                                            {isDone && <span className="text-green-600 font-medium">✅ Hoàn thành</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
