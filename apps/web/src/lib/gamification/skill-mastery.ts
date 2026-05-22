export type MasterySkill =
    | 'vocabulary'
    | 'grammar'
    | 'listening'
    | 'reading'
    | 'writing'
    | 'speaking'

export interface MasteryEvent {
    userId?: string
    eventName?: string
    actionId?: string | null
    actionType?: string | null
    level?: string | null
    skill?: string | null
    metadata?: unknown
    createdAt: Date
}

export interface SkillMasteryProgress {
    skill: MasterySkill
    label: string
    cefrLevel: string
    completions: number
    activeDays: number
    qualityScore: number | null
    progress: number
    nextMilestone: string
    masteryReason: string
}

export interface BadgeProgress {
    id: string
    title: string
    description: string
    category: string
    skill?: MasterySkill
    cefrLevel?: string
    progress: number
    requirement: string
    unlocked: boolean
    receiptState?: BadgeReceiptState
}

export type BadgeReceiptState = 'preview' | 'newly_unlocked' | 'already_earned'

export interface SkillMasterySnapshot {
    skills: SkillMasteryProgress[]
    nextBadgePreview: BadgeProgress | null
    badgeReceipt: BadgeProgress | null
    masteryReason: string
    summary: {
        totalMeaningfulCompletions: number
        activeDays: number
        strongestSkill: MasterySkill | null
        skillsTouched: number
    }
}

export interface MasteryAdminReadout {
    badgeUnlocks: number
    persistentBadgeUnlocks: number
    duplicatePrevented: number
    viewed: number
    receiptClicks: number
    progressBySkill: Array<{ key: string; events: number; users: number }>
    progressByLevel: Array<{ key: string; events: number; users: number }>
    badgeUnlocksByBadge: Array<{ key: string; events: number; users: number }>
    badgeUnlocksBySkill: Array<{ key: string; events: number; users: number }>
    badgeUnlocksByLevel: Array<{ key: string; events: number; users: number }>
    meaningfulSkillPaths: Array<{ key: string; events: number; users: number }>
}

const MASTERY_TARGET_COMPLETIONS = 10
const STARTER_BADGE_COMPLETIONS = 2

const SKILL_LABELS: Record<MasterySkill, string> = {
    vocabulary: 'Từ vựng',
    grammar: 'Ngữ pháp',
    listening: 'Nghe',
    reading: 'Đọc',
    writing: 'Viết',
    speaking: 'Nói',
}

export const PILOT_BADGE_CATALOG: Array<{
    id: string
    title: string
    description: string
    category: string
    requirement: string
    skill?: MasterySkill
    target: (context: BadgeContext) => { current: number; target: number; unlocked: boolean; cefrLevel?: string }
}> = [
    {
        id: 'first-quest',
        title: 'Phát Súng Đầu Tiên',
        description: 'Bước chân đầu tiên luôn nặng nề nhất — nhưng em đã vượt qua vạch xuất phát.',
        category: 'learning',
        requirement: '1 meaningful completion',
        target: (context) => progressTarget(context.totalMeaningfulCompletions, 1),
    },
    {
        id: 'three-day-return',
        title: 'Chuỗi Hạt Ký Ức',
        description: 'Ba ngày duy trì ngọn lửa — nhịp lặp lại chính là thuật giả kim biến ký ức thành vĩnh cửu.',
        category: 'retention',
        requirement: '3 active study days',
        target: (context) => progressTarget(context.activeDays, 3),
    },
    {
        id: 'srs-recovery',
        title: 'Hồi Sinh Ký Ức',
        description: 'Triệu hồi từ vựng từ vực thẳm lãng quên — SRS là chiếc phao cứu sinh của trí não.',
        category: 'retention',
        requirement: '3 SRS reviews',
        target: (context) => progressTarget(context.srsCompletions, 3),
    },
    ...(['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'] as const).map((skill) => ({
        id: `${skill}-starter`,
        title: `${SKILL_LABELS[skill]} Khởi Nguyên`,
        description: `${STARTER_BADGE_COMPLETIONS} mốc son ${SKILL_LABELS[skill].toLowerCase()} đầu tiên — cánh cổng của kỹ năng này đã chính thức mở ra!`,
        category: 'skill',
        requirement: `${STARTER_BADGE_COMPLETIONS} ${skill} completions`,
        skill,
        target: (context: BadgeContext) => {
            const mastery = context.bySkill.get(skill)
            return {
                ...progressTarget(mastery?.completions ?? 0, STARTER_BADGE_COMPLETIONS),
                cefrLevel: mastery?.cefrLevel,
            }
        },
    })),
    {
        id: 'balanced-learner',
        title: 'Lục Giác Hoàn Hảo',
        description: 'Chạm ngõ 3 kỹ năng khác biệt — không có tử huyệt nào trên hành trình chinh phục tiếng Đức của em.',
        category: 'learning',
        requirement: '2 completions in 3 skills',
        target: (context) => progressTarget(
            [...context.bySkill.values()].filter((skill) => skill.completions >= STARTER_BADGE_COMPLETIONS).length,
            3,
        ),
    },
    {
        id: 'comeback',
        title: 'Phượng Hoàng Lửa',
        description: 'Trở lại sau bóng tối của sự trì hoãn — gục ngã không phải là dấu chấm hết, đó là bước đà để bay cao.',
        category: 'retention',
        requirement: 'Return after 7+ days',
        target: (context) => progressTarget(context.hasComeback ? 1 : 0, 1),
    },
    {
        id: 'exam-prep',
        title: 'Chiến Binh Phòng Thi',
        description: 'Đổ mồ hôi trên thao trường — mỗi bài thi thử là một lớp giáp bọc thép cho ngày ra trận.',
        category: 'exam',
        requirement: '2 exam practice completions',
        target: (context) => progressTarget(context.examCompletions, 2),
    },
]

interface BadgeContext {
    totalMeaningfulCompletions: number
    activeDays: number
    srsCompletions: number
    examCompletions: number
    hasComeback: boolean
    bySkill: Map<MasterySkill, SkillMasteryProgress>
}

export function buildSkillMasterySnapshot(input: {
    events: MasteryEvent[]
    earnedBadgeSlugs?: string[]
    currentLevel?: string | null
}): SkillMasterySnapshot {
    const meaningfulEvents = meaningfulMasteryEvents(input.events)
    const earned = new Set(input.earnedBadgeSlugs ?? [])
    const bySkill = buildSkillProgress(meaningfulEvents, input.currentLevel ?? 'A1')
    const context = buildBadgeContext(meaningfulEvents, bySkill)
    const badges = PILOT_BADGE_CATALOG.map((badge) => toBadgeProgress(badge, context, earned))
    const badgeReceipt = badges.find((badge) => badge.unlocked && !earned.has(badge.id)) ?? null
    const nextBadgePreview = badges
        .filter((badge) => !badge.unlocked && !earned.has(badge.id))
        .sort((a, b) => b.progress - a.progress || a.id.localeCompare(b.id))[0] ?? null
    const strongest = [...bySkill.values()].sort((a, b) => b.progress - a.progress || b.completions - a.completions)[0] ?? null

    return {
        skills: [...bySkill.values()].sort((a, b) => b.progress - a.progress || a.label.localeCompare(b.label)),
        nextBadgePreview,
        badgeReceipt,
        masteryReason: strongest
            ? `Cột mốc ${strongest.label} đang rực sáng — ${strongest.completions} chiến công được ghi nhận! Thừa thắng xông lên đục phá hệ thống Mastery nào.`
            : 'Chưa có chiến công nào được xướng tên. Kích hoạt quest đầu tiên để khai mở Skill Mastery Path!',
        summary: {
            totalMeaningfulCompletions: meaningfulEvents.length,
            activeDays: context.activeDays,
            strongestSkill: strongest?.skill ?? null,
            skillsTouched: bySkill.size,
        },
    }
}

export function buildMasteryAdminReadout(events: MasteryEvent[]): MasteryAdminReadout {
    const meaningfulEvents = meaningfulMasteryEvents(events)
    const badgeUnlockEvents = events.filter((event) => event.eventName === 'badge_unlocked')
    const persistentBadgeUnlockEvents = badgeUnlockEvents.filter((event) => metadataRecord(event.metadata)?.receiptState === 'newly_unlocked')
    const duplicatePreventedEvents = badgeUnlockEvents.filter((event) => metadataRecord(event.metadata)?.duplicatePrevented === true)

    return {
        badgeUnlocks: badgeUnlockEvents.length,
        persistentBadgeUnlocks: persistentBadgeUnlockEvents.length,
        duplicatePrevented: duplicatePreventedEvents.length,
        viewed: events.filter((event) => event.eventName === 'mastery_progress_viewed').length,
        receiptClicks: events.filter((event) => event.eventName === 'badge_receipt_clicked').length,
        progressBySkill: splitEvents(meaningfulEvents, (event) => normalizeMasterySkill(event.skill, event.actionType) ?? 'unknown'),
        progressByLevel: splitEvents(meaningfulEvents, (event) => normalizeLevel(event.level, event.metadata)),
        badgeUnlocksByBadge: splitEvents(badgeUnlockEvents, (event) => String(metadataRecord(event.metadata)?.badgeId ?? event.actionId ?? 'unknown')),
        badgeUnlocksBySkill: splitEvents(badgeUnlockEvents, (event) => normalizeMasterySkill(event.skill, event.actionType) ?? String(metadataRecord(event.metadata)?.skill ?? 'unknown')),
        badgeUnlocksByLevel: splitEvents(badgeUnlockEvents, (event) => normalizeLevel(event.level, event.metadata)),
        meaningfulSkillPaths: splitEvents(
            meaningfulEvents.filter((event) => normalizeMasterySkill(event.skill, event.actionType)),
            (event) => normalizeMasterySkill(event.skill, event.actionType) ?? 'unknown',
        ),
    }
}

export function normalizeMasterySkill(skill?: string | null, actionType?: string | null): MasterySkill | null {
    const raw = `${skill ?? ''} ${actionType ?? ''}`.toLowerCase()
    if (/(vocabulary|wortschatz|vocab)/.test(raw)) return 'vocabulary'
    if (/(grammar|grammatik)/.test(raw)) return 'grammar'
    if (/(listening|hoeren|hören)/.test(raw)) return 'listening'
    if (/(reading|lesen)/.test(raw)) return 'reading'
    if (/(writing|schreiben)/.test(raw)) return 'writing'
    if (/(speaking|sprechen)/.test(raw)) return 'speaking'
    return null
}

function meaningfulMasteryEvents(events: MasteryEvent[]) {
    return events.filter((event) => event.eventName === undefined || event.eventName === 'meaningful_action_completed')
}

function buildSkillProgress(events: MasteryEvent[], fallbackLevel: string) {
    const bySkill = new Map<MasterySkill, MasteryEvent[]>()

    for (const event of events) {
        const skill = normalizeMasterySkill(event.skill, event.actionType)
        if (!skill) continue
        bySkill.set(skill, [...(bySkill.get(skill) ?? []), event])
    }

    return new Map([...bySkill.entries()].map(([skill, skillEvents]) => {
        const activeDays = uniqueDays(skillEvents).length
        const qualityScore = averageQuality(skillEvents)
        const cefrLevel = mostCommon(skillEvents.map((event) => normalizeLevel(event.level, event.metadata)).filter(Boolean)) ?? fallbackLevel
        const progress = Math.min(100, Math.round((skillEvents.length / MASTERY_TARGET_COMPLETIONS) * 100))

        return [skill, {
            skill,
            label: SKILL_LABELS[skill],
            cefrLevel,
            completions: skillEvents.length,
            activeDays,
            qualityScore,
            progress,
            nextMilestone: skillEvents.length >= MASTERY_TARGET_COMPLETIONS
                ? 'Sẵn sàng nâng nhịp quest khó hơn.'
                : `${MASTERY_TARGET_COMPLETIONS - skillEvents.length} quest nữa tới mốc mastery kế tiếp.`,
            masteryReason: `${SKILL_LABELS[skill]} ${cefrLevel}: ${skillEvents.length}/${MASTERY_TARGET_COMPLETIONS} lượt học có ý nghĩa.`,
        } satisfies SkillMasteryProgress]
    }))
}

function buildBadgeContext(events: MasteryEvent[], bySkill: Map<MasterySkill, SkillMasteryProgress>): BadgeContext {
    return {
        totalMeaningfulCompletions: events.length,
        activeDays: uniqueDays(events).length,
        srsCompletions: events.filter((event) => event.actionType === 'srs_review').length,
        examCompletions: events.filter((event) => event.actionType === 'exam_practice').length,
        hasComeback: hasComebackGap(events),
        bySkill,
    }
}

function toBadgeProgress(
    badge: (typeof PILOT_BADGE_CATALOG)[number],
    context: BadgeContext,
    earned: Set<string>,
): BadgeProgress {
    const target = badge.target(context)
    const progress = Math.min(100, Math.round((target.current / Math.max(target.target, 1)) * 100))

    return {
        id: badge.id,
        title: badge.title,
        description: badge.description,
        category: badge.category,
        ...(badge.skill ? { skill: badge.skill } : {}),
        ...(target.cefrLevel ? { cefrLevel: target.cefrLevel } : {}),
        progress,
        requirement: badge.requirement,
        unlocked: target.unlocked && !earned.has(badge.id),
    }
}

function progressTarget(current: number, target: number) {
    return {
        current,
        target,
        unlocked: current >= target,
    }
}

function uniqueDays(events: MasteryEvent[]) {
    return [...new Set(events.map((event) => event.createdAt.toISOString().slice(0, 10)))]
}

function hasComebackGap(events: MasteryEvent[]) {
    const days = uniqueDays(events).sort()
    for (let index = 1; index < days.length; index += 1) {
        if (daysApart(days[index - 1]!, days[index]!) >= 7) return true
    }
    return false
}

function daysApart(start: string, end: string) {
    return Math.round((new Date(`${end}T00:00:00.000Z`).getTime() - new Date(`${start}T00:00:00.000Z`).getTime()) / (24 * 60 * 60 * 1000))
}

function averageQuality(events: MasteryEvent[]) {
    const values = events
        .map((event) => {
            const metadata = metadataRecord(event.metadata)
            const raw = metadata?.accuracy ?? metadata?.score ?? metadata?.percentage
            return typeof raw === 'number' ? raw : null
        })
        .filter((value): value is number => value !== null)

    if (values.length === 0) return null
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function normalizeLevel(level?: string | null, metadata?: unknown) {
    const metadataLevel = metadataRecord(metadata)?.cefrLevel
    const value = typeof level === 'string' && level ? level : typeof metadataLevel === 'string' ? metadataLevel : 'unknown'
    return value.toUpperCase()
}

function mostCommon(values: string[]) {
    const counts = new Map<string, number>()
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null
}

function splitEvents(events: MasteryEvent[], getKey: (event: MasteryEvent) => string) {
    const buckets = new Map<string, { events: number; users: Set<string> }>()

    for (const event of events) {
        const key = getKey(event)
        const bucket = buckets.get(key) ?? { events: 0, users: new Set<string>() }
        bucket.events += 1
        bucket.users.add(event.userId ?? 'unknown')
        buckets.set(key, bucket)
    }

    return [...buckets.entries()]
        .map(([key, value]) => ({ key, events: value.events, users: value.users.size }))
        .sort((a, b) => b.events - a.events || a.key.localeCompare(b.key))
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}
