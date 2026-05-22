'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { BookOpen, Headphones, PenTool, MessageCircle, Clock, Trophy, CheckCircle2, XCircle, ArrowRight, Library } from 'lucide-react'
import { FUXIE_3D_ASSETS, FuxieCoach, QuestProgressHero, RewardPreview } from '@/components/gamification/quest-visuals'
import { FuxieLevelTabs, FuxiePanel, FuxieQuestCard, fuxieButtonClass } from '@/components/ui/fuxie-ui'

interface ExamEntry {
    id: string
    slug: string
    title: string
    examType: string
    cefrLevel: string
    totalMinutes: number
    totalPoints: number
    passingScore: number
    description: string | null
    sections: Array<{ skill: string; totalMinutes: number; totalPoints: number }>
    bestAttempt: {
        totalScore: number | null
        maxScore: number | null
        passed: boolean | null
        percentScore: number | null
        completedAt: string | null
    } | null
}

const BOARD_COLORS: Record<string, string> = {
    GOETHE: 'bg-blue-500/10 text-blue-600 border-blue-200',
    TELC: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    OESD: 'bg-rose-500/10 text-rose-600 border-rose-200',
}

const LEVEL_COLORS: Record<string, string> = {
    A1: 'from-emerald-400 to-emerald-500 shadow-emerald-500/20',
    A2: 'from-teal-400 to-teal-500 shadow-teal-500/20',
    B1: 'from-blue-400 to-blue-500 shadow-blue-500/20',
    B2: 'from-indigo-400 to-indigo-500 shadow-indigo-500/20',
    C1: 'from-purple-400 to-purple-500 shadow-purple-500/20',
    C2: 'from-rose-400 to-rose-500 shadow-rose-500/20',
}

const getSkillIcon = (skillName: string) => {
    switch (skillName.toUpperCase()) {
        case 'LESEN': return <BookOpen className="w-3.5 h-3.5" />
        case 'HOEREN': return <Headphones className="w-3.5 h-3.5" />
        case 'SCHREIBEN': return <PenTool className="w-3.5 h-3.5" />
        case 'SPRECHEN': return <MessageCircle className="w-3.5 h-3.5" />
        default: return <Library className="w-3.5 h-3.5" />
    }
}

export function ExamListClient() {
    const t = useTranslations('Gamification')
    const [exams, setExams] = useState<ExamEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filterLevel, setFilterLevel] = useState<string>('Tất cả')

    useEffect(() => {
        const q = filterLevel !== 'Tất cả' ? `?level=${filterLevel}` : ''
        fetch(`/api/v1/exams${q}`)
            .then(r => r.json())
            .then(d => { if (d.success) setExams(d.data) })
            .finally(() => setLoading(false))
    }, [filterLevel])

    // Group exams by Level and then by Skill to present them cleanly
    const groupedExams = useMemo(() => {
        const grouped = exams.reduce((acc, exam) => {
            const levelBucket = acc[exam.cefrLevel] ?? (acc[exam.cefrLevel] = {})

            // Determine primary skill block based on actual sections
            let primarySkill = 'MIXED'
            const distinctSkills = new Set(exam.sections.map(s => s.skill))
            
            if (distinctSkills.size === 1) {
                const skill = Array.from(distinctSkills)[0]?.toUpperCase()
                if (skill && ['LESEN', 'HOEREN', 'SCHREIBEN', 'SPRECHEN'].includes(skill)) {
                    primarySkill = skill
                }
            } else if (distinctSkills.size > 1) {
                primarySkill = 'MIXED'
            } else {
                // Fallback to title matching if sections are empty
                const t = exam.title.toLowerCase()
                if (t.includes('nghe') || t.includes('hören') && !t.includes('lesen')) primarySkill = 'HOEREN'
                else if (t.includes('đọc') || t.includes('lesen') && !t.includes('hören')) primarySkill = 'LESEN'
                else if (t.includes('viết') || t.includes('schreiben')) primarySkill = 'SCHREIBEN'
                else if (t.includes('nói') || t.includes('sprechen')) primarySkill = 'SPRECHEN'
            }

            if (!levelBucket[primarySkill]) levelBucket[primarySkill] = []
            levelBucket[primarySkill]!.push(exam)
            return acc
        }, {} as Record<string, Record<string, ExamEntry[]>>)

        // Sort levels
        const levelOrder: Record<string, number> = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 }
        const skillOrder: Record<string, number> = { 'MIXED': 1, 'LESEN': 2, 'HOEREN': 3, 'SCHREIBEN': 4, 'SPRECHEN': 5 }

        return Object.keys(grouped).sort((a, b) => (levelOrder[a] || 99) - (levelOrder[b] || 99)).map(level => {
            const examsBySkill = grouped[level] ?? {}
            const skillGroups = Object.keys(examsBySkill).sort((a, b) => (skillOrder[a] || 99) - (skillOrder[b] || 99)).map(skill => ({
                skill,
                exams: examsBySkill[skill] ?? [],
            }))
            return { level, skillGroups }
        })
    }, [exams])

    const levels = ['Tất cả', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const SKILL_NAMES: Record<string, string> = {
        MIXED: 'Đề tổng hợp',
        LESEN: 'Đọc hiểu',
        HOEREN: 'Nghe hiểu',
        SCHREIBEN: 'Viết',
        SPRECHEN: 'Nói',
    }
    const SKILL_LABELS: Record<string, string> = {
        LESEN: 'Đọc',
        HOEREN: 'Nghe',
        SCHREIBEN: 'Viết',
        SPRECHEN: 'Nói',
        MIXED: 'Tổng hợp',
    }



    const nextExam = exams.find(exam => !exam.bestAttempt) ?? exams[0] ?? null
    const attemptedCount = exams.filter(exam => exam.bestAttempt).length
    const passedCount = exams.filter(exam => exam.bestAttempt?.passed).length
    const totalVisibleMinutes = exams.reduce((sum, exam) => sum + exam.totalMinutes, 0)
    const selectedLevelLabel = filterLevel === 'Tất cả' ? 'mọi cấp độ' : filterLevel

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 pb-32">
            <QuestProgressHero
                variant="exam"
                eyebrow="Exam gate"
                title="Thử phòng thi, mở khóa tự tin"
                message="Chọn đề theo cấp độ, luyện với thời gian thật và theo dõi mức sẵn sàng trước khi bước vào Goethe/telc/OESD."
                stats={[
                    { label: 'Đề đang mở', value: String(exams.length), detail: selectedLevelLabel },
                    { label: 'Đã thử', value: String(attemptedCount), detail: attemptedCount > 0 ? 'có dữ liệu điểm' : 'bắt đầu từ đề đầu' },
                    { label: 'Đã đạt', value: String(passedCount), detail: `${totalVisibleMinutes} phút luyện tập` },
                ]}
                rewards={[
                    { type: 'exam', label: 'Exam badge', detail: 'mốc sẵn sàng thi' },
                    { type: 'xp', label: '+80 XP', detail: 'khi hoàn thành đề' },
                    { type: 'unlock', label: 'Skill signal', detail: 'biết điểm yếu tiếp theo' },
                ]}
                mascotSrc={FUXIE_3D_ASSETS.examGuide}
                className="mb-8"
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {nextExam ? (
                        <Link
                            href={`/exam/${nextExam.id}`}
                            className={fuxieButtonClass('primary', 'lg', 'rounded-2xl active:scale-[0.98]')}
                        >
                            {nextExam.bestAttempt ? 'Luyện lại đề tốt nhất' : 'Bắt đầu đề tiếp theo'}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    ) : (
                        <Link
                            href="/course"
                            className={fuxieButtonClass('primary', 'lg', 'rounded-2xl active:scale-[0.98]')}
                        >
                            Vào lộ trình học
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs font-bold text-text-brand">
                        {['Lesen', 'Hören', 'Schreiben', 'Sprechen'].map(skill => (
                            <span key={skill} className="rounded-full bg-white/70 px-3 py-1.5 shadow-sm ring-1 ring-white/90">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </QuestProgressHero>
            {/* Level Filter Ribbon */}
            <div className="flex justify-center md:justify-start mb-10 overflow-x-auto pb-4 hide-scrollbar">
                <FuxieLevelTabs
                    items={levels}
                    activeItem={filterLevel}
                    onSelect={setFilterLevel}
                    ariaLabel="Exam level filter"
                    className="backdrop-blur-md"
                    buttonClassName="px-5 py-2.5"
                />
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-[280px] rounded-3xl bg-gray-100/60 animate-pulse border border-gray-100" />
                    ))}
                </div>
            ) : exams.length === 0 ? (
                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <FuxieCoach
                        role="locked"
                        eyebrow="Exam gate"
                        title="Cấp độ này chưa mở đề thi"
                        message={t('examEmptyTip')}
                        mascotSrc={FUXIE_3D_ASSETS.examGuide}
                        className="min-h-[220px]"
                    />
                    <FuxiePanel className="rounded-3xl border-dashed border-slate-200 p-5">
                        <p className="text-xs font-black uppercase tracking-wide text-text-brand">Next best action</p>
                        <h3 className="mt-2 text-xl font-black text-slate-950">Rèn giũa kỹ năng trước khi thi cử</h3>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                            Khi chưa có đề ở bộ lọc này, màn hình nên giữ động lực học thay vì báo lỗi dữ liệu.
                        </p>
                        <div className="mt-5 flex flex-col gap-2">
                            <button
                                onClick={() => setFilterLevel('Tất cả')}
                                className={fuxieButtonClass('primary', 'lg', 'rounded-2xl')}
                            >
                                Xem tất cả đề
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <Link
                                href="/course"
                                className={fuxieButtonClass('ghost', 'lg', 'rounded-2xl')}
                            >
                                Về lộ trình học
                            </Link>
                        </div>
                    </FuxiePanel>
                </div>
            ) : (
                <div className="space-y-12">
                    <div>
                        {groupedExams.map((group) => (
                            <div
                                key={group.level}
                                className="relative"
                            >
                                {/* Level Section Header */}
                                <div className="flex items-center gap-3 mb-6 ml-2">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${LEVEL_COLORS[group.level] || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow-sm`}>
                                        <span className="text-white font-bold text-sm tracking-widest">{group.level}</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Khung {group.level}</h2>
                                    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-4" />
                                </div>

                                {/* Skill Groupings */}
                                <div className="space-y-10 pl-2">
                                    {group.skillGroups.map(sg => (
                                        <div key={sg.skill}>
                                            <h3 className="text-lg font-bold text-gray-700 mb-5 flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${sg.skill === 'MIXED' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                                                    {sg.skill === 'MIXED' ? <Library className="w-4 h-4" /> : getSkillIcon(sg.skill)}
                                                </div>
                                                {SKILL_NAMES[sg.skill] || sg.skill}
                                            </h3>
                                            
                                            <div
                                                className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                                            >
                                                {sg.exams.map(exam => (
                                                    <FuxieQuestCard
                                                        key={exam.id}
                                                        className="rounded-3xl border-gray-200/60 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:scale-[1.01] hover:shadow-[0_12px_40px_rgba(60,120,168,0.14)]"
                                                    >
                                                        {/* decorative gradient blob hidden behind */}
                                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-50/50 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                        <div className="relative z-10 flex flex-col h-full">
                                                            {/* Top tags */}
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${BOARD_COLORS[exam.examType] || BOARD_COLORS.GOETHE}`}>
                                                                    {exam.examType}
                                                                </span>
                                                                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                                                                    <Clock className="w-3.5 h-3.5" /> {exam.totalMinutes} phút
                                                                    <span className="mx-1 text-gray-300">|</span>
                                                                    <Trophy className="w-3.5 h-3.5" /> {exam.totalPoints} điểm
                                                                </span>
                                                            </div>

                                                            {/* Title */}
                                                            <h3 className="text-xl font-bold text-gray-800 leading-tight mb-2 group-hover:text-text-brand transition-colors">{exam.title}</h3>
                                                            {exam.description && (
                                                                <p className="text-xs text-gray-500 mb-5 line-clamp-2">{exam.description}</p>
                                                            )}

                                                            {/* Skill breakdown ribbon */}
                                                            <div className="flex flex-wrap gap-2 mb-6">
                                                                {exam.sections.map((sec, i) => (
                                                                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100/60 text-gray-600 rounded-lg text-xs font-medium border border-gray-200/50">
                                                                        {getSkillIcon(sec.skill)}
                                                                        <span>{SKILL_LABELS[sec.skill.toUpperCase()] ?? sec.skill}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <RewardPreview
                                                                className="mb-5"
                                                                rewards={[
                                                                    { type: 'exam', label: `${exam.passingScore}% mục tiêu`, detail: 'điểm đạt' },
                                                                    { type: 'xp', label: '+80 XP', detail: `${exam.totalMinutes} phút` },
                                                                    {
                                                                        type: exam.bestAttempt?.passed ? 'badge' : 'unlock',
                                                                        label: exam.bestAttempt?.passed ? 'Đã đạt' : 'Boss gate',
                                                                        detail: exam.bestAttempt ? 'luyện để tăng điểm' : 'thử sức lần đầu',
                                                                    },
                                                                ]}
                                                            />

                                                            <div className="flex-1" />

                                                            {/* Action / Result row */}
                                                            <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between">
                                                                {exam.bestAttempt ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`p-1.5 rounded-full ${exam.bestAttempt.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                                                            {exam.bestAttempt.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className={`text-xs font-bold ${exam.bestAttempt.passed ? 'text-emerald-700' : 'text-red-600'}`}>
                                                                                {exam.bestAttempt.percentScore}%
                                                                            </span>
                                                                            <span className="text-xs text-gray-400 font-medium">Lần tốt nhất</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs font-medium text-gray-400">Chưa làm lần nào</span>
                                                                )}
                                                                
                                                                <Link
                                                                    href={`/exam/${exam.id}`}
                                                                    className={fuxieButtonClass('primary', 'md', 'rounded-xl px-5 shadow-md shadow-sky-900/10 hover:scale-[1.02] active:scale-95')}
                                                                >
                                                                    {exam.bestAttempt ? 'Luyện lại' : 'Bắt đầu'}
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </FuxieQuestCard>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
