'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface LeaderboardEntry {
    rank: number
    userId: string
    displayName: string
    avatarUrl: string | null
    currentLevel: string
    weeklyXp: number
    totalXp: number
    streak: number
    isCurrentUser: boolean
}

const LEVEL_COLORS: Record<string, string> = {
    A1: '#4CAF50', A2: '#26A69A', B1: '#2196F3', B2: '#5C6BC0',
    C1: '#9C27B0', C2: '#E91E63',
}

const PODIUM_STYLES = [
    { bg: 'from-yellow-400 to-amber-500', size: 'w-16 h-16', crown: '👑', textSize: 'text-2xl' },
    { bg: 'from-gray-300 to-gray-400', size: 'w-14 h-14', crown: '🥈', textSize: 'text-xl' },
    { bg: 'from-orange-400 to-orange-600', size: 'w-12 h-12', crown: '🥉', textSize: 'text-lg' },
]

export function LeaderboardClient() {
    const [period, setPeriod] = useState<'weekly' | 'alltime'>('weekly')
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchLeaderboard = useCallback(async (p: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/v1/leaderboard?period=${p}`)
            const data = await res.json()
            if (data.success) {
                setEntries(data.data.entries)
                setCurrentUser(data.data.currentUser)
            }
        } catch (err) {
            console.error('Leaderboard error:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLeaderboard(period)
    }, [period, fetchLeaderboard])

    const top3 = entries.slice(0, 3)
    const rest = entries.slice(3)

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                    🏆 Rangliste
                    <Image src="/mascot/core/fuxie-core-happy-wave.png" alt="Fuxie" width={32} height={32} className="object-contain" />
                </h1>
                <p className="text-sm text-gray-500 mt-1">Bảng xếp hạng · Wer lernt am meisten?</p>
            </div>

            {/* Period Tabs */}
            <div className="flex gap-1.5 bg-gray-100 rounded-full p-1 mb-6">
                {[
                    { key: 'weekly' as const, label: 'Diese Woche', emoji: '📅' },
                    { key: 'alltime' as const, label: 'Alle Zeiten', emoji: '🌟' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setPeriod(tab.key)}
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200
                            ${period === tab.key
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.emoji} {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-16">
                    <Image src="/mascot/core/fuxie-core-happy-wave.png" alt="Fuxie" width={64} height={64} className="mx-auto mb-4 object-contain" />
                    <p className="text-gray-500">Noch keine Daten!</p>
                    <p className="text-xs text-gray-400 mt-1">Học để lên bảng xếp hạng nhé! 🦊</p>
                </div>
            ) : (
                <>
                    {/* Top 3 Podium */}
                    {top3.length >= 3 && (
                        <div className="flex items-end justify-center gap-3 mb-8 px-4">
                            {/* 2nd Place */}
                            <PodiumCard entry={top3[1]!} style={PODIUM_STYLES[1]!} period={period} height="h-28" />
                            {/* 1st Place */}
                            <PodiumCard entry={top3[0]!} style={PODIUM_STYLES[0]!} period={period} height="h-36" />
                            {/* 3rd Place */}
                            <PodiumCard entry={top3[2]!} style={PODIUM_STYLES[2]!} period={period} height="h-24" />
                        </div>
                    )}

                    {/* Remaining Entries */}
                    <div className="space-y-2">
                        {(top3.length < 3 ? entries : rest).map(entry => (
                            <div
                                key={entry.userId}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                    ${entry.isCurrentUser
                                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 ring-2 ring-amber-200 shadow-sm'
                                        : 'bg-white ring-1 ring-gray-100 hover:ring-gray-200'
                                    }`}
                            >
                                {/* Rank */}
                                <div className="w-8 text-center">
                                    <span className={`text-sm font-bold ${entry.rank <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                                    </span>
                                </div>

                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {entry.avatarUrl ? (
                                        <Image src={entry.avatarUrl} alt="" width={40} height={40} className="object-cover rounded-full" />
                                    ) : (
                                        <span className="text-lg">🦊</span>
                                    )}
                                </div>

                                {/* Name + Level */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${entry.isCurrentUser ? 'text-amber-800' : 'text-gray-800'}`}>
                                        {entry.displayName} {entry.isCurrentUser && '(Du)'}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span
                                            className="inline-block px-1.5 py-0.5 text-[9px] font-bold text-white rounded"
                                            style={{ backgroundColor: LEVEL_COLORS[entry.currentLevel] ?? '#9E9E9E' }}
                                        >
                                            {entry.currentLevel}
                                        </span>
                                        {entry.streak > 0 && (
                                            <span className="text-[10px] text-gray-400">🔥 {entry.streak}</span>
                                        )}
                                    </div>
                                </div>

                                {/* XP */}
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-gray-800">
                                        {(period === 'weekly' ? entry.weeklyXp : entry.totalXp).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-400">XP</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Current User (if not in top list) */}
                    {currentUser && !entries.some(e => e.isCurrentUser) && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                            <p className="text-xs text-gray-400 mb-2">Dein Platz</p>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 ring-2 ring-amber-200">
                                <div className="w-8 text-center">
                                    <span className="text-sm font-bold text-gray-500">#{currentUser.rank}</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <span className="text-lg">🦊</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-amber-800">{currentUser.displayName} (Du)</p>
                                    <span
                                        className="inline-block px-1.5 py-0.5 text-[9px] font-bold text-white rounded mt-0.5"
                                        style={{ backgroundColor: LEVEL_COLORS[currentUser.currentLevel] ?? '#9E9E9E' }}
                                    >
                                        {currentUser.currentLevel}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-800">
                                        {(period === 'weekly' ? currentUser.weeklyXp : currentUser.totalXp).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-400">XP</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

function PodiumCard({
    entry,
    style,
    period,
    height,
}: {
    entry: LeaderboardEntry
    style: typeof PODIUM_STYLES[number]
    period: string
    height: string
}) {
    return (
        <div className="flex flex-col items-center flex-1 max-w-[120px]">
            {/* Crown / Medal */}
            <div className="text-2xl mb-1">{style.crown}</div>
            {/* Avatar */}
            <div className={`${style.size} rounded-full bg-gradient-to-br ${style.bg} flex items-center justify-center p-0.5 shadow-lg mb-2`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {entry.avatarUrl ? (
                        <Image src={entry.avatarUrl} alt="" width={50} height={50} className="object-cover rounded-full" />
                    ) : (
                        <span className={style.textSize}>🦊</span>
                    )}
                </div>
            </div>
            {/* Name */}
            <p className="text-xs font-medium text-gray-800 truncate w-full text-center">
                {entry.displayName}
            </p>
            {/* XP Bar */}
            <div className={`w-full ${height} rounded-t-xl bg-gradient-to-t ${style.bg} mt-2 flex items-end justify-center pb-2`}>
                <p className="text-sm font-bold text-white">
                    {(period === 'weekly' ? entry.weeklyXp : entry.totalXp).toLocaleString()}
                </p>
            </div>
        </div>
    )
}
