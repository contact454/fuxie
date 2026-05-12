export interface FuxieXpLevel {
    level: number
    title: string
    totalXp: number
    currentLevelXp: number
    nextLevelXp: number
    nextLevelTotalXp: number
    progress: number
}

function getTierTitle(level: number) {
    if (level >= 41) return 'Fuchs-Legende'
    if (level >= 31) return 'Meister Fuchs'
    if (level >= 21) return 'Schlauer Fuchs'
    if (level >= 11) return 'Junger Fuchs'
    return 'Fuchs-Baby'
}

function getLevelFromXp(totalXp: number) {
    if (totalXp >= 30000) return Math.min(50, 41 + Math.floor((totalXp - 30000) / 5000))
    if (totalXp >= 15000) return 31 + Math.floor((totalXp - 15000) / 1500)
    if (totalXp >= 6000) return 21 + Math.floor((totalXp - 6000) / 900)
    if (totalXp >= 2000) return 11 + Math.floor((totalXp - 2000) / 400)
    return 1 + Math.floor(totalXp / 200)
}

function getLevelStartXp(level: number) {
    if (level >= 41) return 30000 + (level - 41) * 5000
    if (level >= 31) return 15000 + (level - 31) * 1500
    if (level >= 21) return 6000 + (level - 21) * 900
    if (level >= 11) return 2000 + (level - 11) * 400
    return (level - 1) * 200
}

export function calculateFuxieXpLevel(totalXp: number): FuxieXpLevel {
    const safeTotalXp = Math.max(0, totalXp)
    const level = getLevelFromXp(safeTotalXp)
    const currentLevelXp = getLevelStartXp(level)
    const nextLevelTotalXp = getLevelStartXp(level + 1)
    const nextLevelXp = Math.max(1, nextLevelTotalXp - currentLevelXp)
    const earnedInLevel = Math.max(0, safeTotalXp - currentLevelXp)
    const progress = Math.min(100, Math.round((earnedInLevel / nextLevelXp) * 100))

    return {
        level,
        title: getTierTitle(level),
        totalXp: safeTotalXp,
        currentLevelXp,
        nextLevelXp,
        nextLevelTotalXp,
        progress,
    }
}
