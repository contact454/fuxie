import type { SkillKey } from './today-plan'

export interface LearnerWeaknessProfileInput {
    currentLevel: string
    explicitWeakSkills?: SkillKey[]
    skillScores?: Partial<Record<SkillKey, number>>
}

export interface LearnerWeaknessSignal {
    skill: SkillKey
    scorePercent: number | null
    severity: 'critical' | 'needs_practice' | 'watch' | 'unknown'
    reason: string
}

export interface LearnerWeaknessProfile {
    currentLevel: string
    weakSkills: SkillKey[]
    signals: LearnerWeaknessSignal[]
    summary: string
}

const DEFAULT_SKILL_ORDER: SkillKey[] = ['WORTSCHATZ', 'GRAMMATIK', 'HOEREN', 'LESEN', 'SCHREIBEN', 'SPRECHEN']

const SKILL_LABELS: Record<SkillKey, string> = {
    HOEREN: 'nghe',
    LESEN: 'đọc',
    SCHREIBEN: 'viết',
    SPRECHEN: 'nói',
    GRAMMATIK: 'ngữ pháp',
    WORTSCHATZ: 'từ vựng',
}

export function buildLearnerWeaknessProfile(input: LearnerWeaknessProfileInput): LearnerWeaknessProfile {
    const explicit = new Set(input.explicitWeakSkills || [])
    const signals = DEFAULT_SKILL_ORDER.map((skill) => buildSignal(skill, explicit.has(skill), input.skillScores?.[skill] ?? null))
        .sort(compareSignals)

    const weakSkills = signals
        .filter((signal) => signal.severity === 'critical' || signal.severity === 'needs_practice' || explicit.has(signal.skill))
        .map((signal) => signal.skill)

    return {
        currentLevel: input.currentLevel,
        weakSkills: uniqueSkills(weakSkills.length > 0 ? weakSkills : DEFAULT_SKILL_ORDER),
        signals,
        summary: buildSummary(signals),
    }
}

function buildSignal(skill: SkillKey, explicitWeak: boolean, rawScore: number | null): LearnerWeaknessSignal {
    const scorePercent = normalizeScore(rawScore)
    if (explicitWeak && scorePercent === null) {
        return {
            skill,
            scorePercent,
            severity: 'needs_practice',
            reason: `${SKILL_LABELS[skill]} là đấu trường em tự chọn — lưỡi gươm sẽ được mài giũa ngay tại đây.`,
        }
    }
    if (scorePercent === null) {
        return {
            skill,
            scorePercent,
            severity: 'unknown',
            reason: `${SKILL_LABELS[skill]} vẫn còn là ẩn số — vung kiếm một lần để hệ thống quét ra tử huyệt của em.`,
        }
    }
    if (scorePercent < 50) {
        return {
            skill,
            scorePercent,
            severity: 'critical',
            reason: `${SKILL_LABELS[skill]} đang thủng lưới dưới mức 50% — đừng hoảng, hệ thống đã chuẩn bị giáp bọc lót để em lội ngược dòng.`,
        }
    }
    if (scorePercent < 68 || explicitWeak) {
        return {
            skill,
            scorePercent,
            severity: 'needs_practice',
            reason: `${SKILL_LABELS[skill]} đang kẹt dưới 68% — chỉ vài lượt đục phá nữa là điểm mù này sẽ hoàn toàn bị xóa sổ.`,
        }
    }
    if (scorePercent < 80) {
        return {
            skill,
            scorePercent,
            severity: 'watch',
            reason: `${SKILL_LABELS[skill]} phong độ đang cứng cáp — Fuxie đã cài radar để đảm bảo không một cú sẩy chân nào xảy ra.`,
        }
    }
    return {
        skill,
        scorePercent,
        severity: 'unknown',
        reason: `${SKILL_LABELS[skill]} đã đạt cảnh giới an toàn — hãy dành hỏa lực cho những mặt trận gai góc hơn hôm nay.`,
    }
}

function compareSignals(a: LearnerWeaknessSignal, b: LearnerWeaknessSignal) {
    const severityRank = { critical: 0, needs_practice: 1, watch: 2, unknown: 3 }
    const severityDiff = severityRank[a.severity] - severityRank[b.severity]
    if (severityDiff !== 0) return severityDiff
    return (a.scorePercent ?? 101) - (b.scorePercent ?? 101)
}

function normalizeScore(value: number | null) {
    if (value === null || Number.isNaN(value)) return null
    if (value <= 1) return Math.round(value * 100)
    return Math.round(value)
}

function buildSummary(signals: LearnerWeaknessSignal[]) {
    const first = signals.find((signal) => signal.severity === 'critical' || signal.severity === 'needs_practice')
    if (!first) return 'Cỗ máy kỹ năng đang vận hành trơn tru — giữ vững nhịp đập này là đủ!'
    const label = SKILL_LABELS[first.skill]
    if (first.severity === 'critical') return `${label} đang báo động đỏ — Fuxie đã dọn sẵn hỏa lực để em phản công ngay hôm nay!`
    return `Mục tiêu khóa chặt: ${label}. ${first.reason}`
}

function uniqueSkills(skills: SkillKey[]) {
    return [...new Set(skills)]
}
