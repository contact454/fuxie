'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Headphones, PenTool, MessageCircle, Clock, Trophy, CheckCircle2, XCircle, ArrowRight, Library, Sparkles } from 'lucide-react'

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

// Animation Variants
const containerVariant = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export function ExamListClient() {
    const [exams, setExams] = useState<ExamEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filterLevel, setFilterLevel] = useState<string>('Alle')

    useEffect(() => {
        const q = filterLevel !== 'Alle' ? `?level=${filterLevel}` : ''
        fetch(`/api/v1/exams${q}`)
            .then(r => r.json())
            .then(d => { if (d.success) setExams(d.data) })
            .finally(() => setLoading(false))
    }, [filterLevel])

    // Group exams by Level to present them neatly
    const groupedExams = useMemo(() => {
        const grouped = exams.reduce((acc, exam) => {
            if (!acc[exam.cefrLevel]) acc[exam.cefrLevel] = []
            acc[exam.cefrLevel].push(exam)
            return acc
        }, {} as Record<string, ExamEntry[]>)

        // Sort levels
        const levelOrder: Record<string, number> = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 }
        return Object.keys(grouped).sort((a, b) => (levelOrder[a] || 99) - (levelOrder[b] || 99)).map(level => ({
            level,
            exams: grouped[level]
        }))
    }, [exams])

    const levels = ['Alle', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
            {/* Premium Header */}
            <div className="relative mb-12 flex flex-col items-center md:flex-row md:items-start gap-6 border-b border-gray-100 pb-8">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                    className="relative w-24 h-24 drop-shadow-2xl"
                >
                    <Image src="/mascot/learn/fuxie-learn-graduation.png" alt="Fuxie Graduation" fill className="object-contain" />
                </motion.div>
                
                <div className="text-center md:text-left pt-2">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                        <span className="text-sm font-bold tracking-wider text-yellow-600 uppercase">Zertifikatszentrum</span>
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                        Prüfung üben
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-500 max-w-lg leading-relaxed">
                        Thi thử và rèn luyện kỹ năng giải đề chính thức chuẩn khung viện Goethe, telc và ÖSD.
                    </motion.p>
                </div>
            </div>

            {/* Level Filter Ribbon */}
            <div className="flex justify-center md:justify-start mb-10 overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex gap-2 p-1.5 bg-gray-50/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-inner">
                    {levels.map((l) => {
                        const isActive = filterLevel === l
                        return (
                            <button
                                key={l}
                                onClick={() => setFilterLevel(l)}
                                className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
                                    ${isActive ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeFilter"
                                        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${l === 'Alle' ? 'from-gray-800 to-gray-700 shadow-gray-400/20' : LEVEL_COLORS[l] || 'from-gray-800 to-gray-700'}`}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    />
                                )}
                                <span className="relative z-10">{l}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-[280px] rounded-3xl bg-gray-100/60 animate-pulse border border-gray-100" />
                    ))}
                </div>
            ) : exams.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100 border-dashed">
                    <div className="w-24 h-24 mx-auto mb-6 opacity-60 mix-blend-luminosity">
                        <Image src="/mascot/core/fuxie-core-happy-wave.png" alt="Empty" width={96} height={96} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có đề thi nào</h3>
                    <p className="text-gray-500">Chưa có đề thi nào trong hệ thống cho cấp độ này. Vui lòng Seed data.</p>
                </motion.div>
            ) : (
                <div className="space-y-12">
                    <AnimatePresence mode="popLayout">
                        {groupedExams.map((group) => (
                            <motion.div 
                                key={group.level}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4 }}
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

                                {/* Exam Grid */}
                                <motion.div 
                                    variants={containerVariant}
                                    initial="hidden"
                                    animate="show"
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                                >
                                    {group.exams.map(exam => (
                                        <motion.div
                                            key={exam.id}
                                            variants={itemVariant}
                                            whileHover={{ y: -4, scale: 1.01 }}
                                            className="group relative bg-white rounded-3xl p-6 border border-gray-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300"
                                        >
                                            {/* decorative gradient blob hidden behind */}
                                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-50/50 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                            <div className="relative z-10 flex flex-col h-full">
                                                {/* Top tags */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${BOARD_COLORS[exam.examType] || BOARD_COLORS.GOETHE}`}>
                                                        {exam.examType}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                                                        <Clock className="w-3.5 h-3.5" /> {exam.totalMinutes} Min
                                                        <span className="mx-1 text-gray-300">|</span>
                                                        <Trophy className="w-3.5 h-3.5" /> {exam.totalPoints} Pkt.
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h3 className="text-xl font-bold text-gray-800 leading-tight mb-2 group-hover:text-[#FF6B35] transition-colors">{exam.title}</h3>
                                                {exam.description && (
                                                    <p className="text-xs text-gray-500 mb-5 line-clamp-2">{exam.description}</p>
                                                )}

                                                {/* Skill breakdown ribbon */}
                                                <div className="flex flex-wrap gap-2 mb-6">
                                                    {exam.sections.map((sec, i) => (
                                                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100/60 text-gray-600 rounded-lg text-xs font-medium border border-gray-200/50">
                                                            {getSkillIcon(sec.skill)}
                                                            <span className="capitalize">{sec.skill.toLowerCase()}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex-1" />

                                                {/* Action / Result row */}
                                                <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between">
                                                    {exam.bestAttempt ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-full ${exam.bestAttempt.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                                                {exam.bestAttempt.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={`text-[13px] font-bold ${exam.bestAttempt.passed ? 'text-emerald-700' : 'text-red-600'}`}>
                                                                    {exam.bestAttempt.percentScore}%
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-medium">Bester Versuch</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[13px] font-medium text-gray-400">Noch nie gemacht</span>
                                                    )}
                                                    
                                                    <Link
                                                        href={`/exam/${exam.id}`}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-[#FF6B35] hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md shadow-gray-900/10"
                                                    >
                                                        {exam.bestAttempt ? 'Wiederholen' : 'Starten'}
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
