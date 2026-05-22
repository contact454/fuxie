import {
    PILOT_BADGE_CATALOG,
    buildSkillMasterySnapshot,
    type BadgeProgress,
    type MasteryEvent,
    type MasterySkill,
} from './skill-mastery'

export type MicrogameId = 'speed-match' | 'cloze-streak' | 'boss-review'
export type RoleplayScenarioId = 'self-intro' | 'cafe-order'
export type CampaignNodeId = 'a1-person' | 'a1-family' | 'a1-cafe' | 'a1-directions' | 'a1-shopping'
export type CampaignNodeState = 'available' | 'in_progress' | 'ready_for_boss' | 'cleared'
export type FirstSessionPathStepStatus = 'done' | 'next' | 'not_started'

export interface VocabularyMicrogame {
    id: MicrogameId
    title: string
    subtitle: string
    objective: string
    successCriteria: string[]
    completionRule: string
    receiptExpectation: string
    nextActionLabel: string
    nextActionHrefForTheme: (themeSlug: string, level: string) => string
    practiceType: 'speed' | 'cloze' | 'mixed'
    estimatedMinutes: number
    badgeHint: string
    hrefForTheme: (themeSlug: string, level: string) => string
}

export interface GermanRoleplayScenario {
    id: RoleplayScenarioId
    title: string
    cefrLevel: 'A1' | 'A2'
    objective: string
    situation: string
    successCriteria: string[]
    suggestedStarter: string
    href: string
}

export interface QuestCampaignNode {
    id: CampaignNodeId
    title: string
    cefrLevel: 'A1'
    themeSlug: string
    primarySkill: MasterySkill
    objective: string
    href: string
    supportHrefs: Array<{ label: string; href: string; skill: MasterySkill }>
    boss?: boolean
}

export interface FirstSessionPathStep {
    id: 'speed-match' | 'cloze-streak' | 'boss-review' | 'roleplay-self-intro'
    title: string
    href: string
    skill: MasterySkill
    objective: string
    reason: string
    estimatedMinutes: number
}

export interface FirstSessionPathProgressItem extends FirstSessionPathStep {
    status: FirstSessionPathStepStatus
    completedAt: string | null
}

export interface BadgeAlbumItem extends BadgeProgress {
    displayState: 'earned' | 'ready' | 'locked'
    rarity: 'starter' | 'habit' | 'mastery'
}

type FirstSessionProgressEvent = Pick<MasteryEvent, 'eventName' | 'actionId' | 'actionType' | 'skill' | 'metadata' | 'createdAt'>

export const A1_FIRST_CONTACT_PATH: FirstSessionPathStep[] = [
    {
        id: 'speed-match',
        title: 'Speed Match',
        href: '/vocabulary/practice/speed?theme=a1-person&level=A1',
        skill: 'vocabulary',
        objective: 'Recognize A1 self-intro words quickly.',
        reason: 'Start with fast recognition before harder recall.',
        estimatedMinutes: 3,
    },
    {
        id: 'cloze-streak',
        title: 'Cloze Streak',
        href: '/vocabulary/practice/cloze?theme=a1-person&level=A1',
        skill: 'vocabulary',
        objective: 'Recall the same words inside short context.',
        reason: 'Cloze turns recognition into memory retrieval.',
        estimatedMinutes: 4,
    },
    {
        id: 'boss-review',
        title: 'Boss Review',
        href: '/vocabulary/practice/mixed?theme=a1-person&level=A1',
        skill: 'vocabulary',
        objective: 'Clear the mixed review before speaking.',
        reason: 'Boss Review checks whether the theme is stable enough to use.',
        estimatedMinutes: 6,
    },
    {
        id: 'roleplay-self-intro',
        title: 'Self-intro Roleplay',
        href: '/speaking/roleplay?scenario=self-intro&level=A1',
        skill: 'speaking',
        objective: 'Use the theme in a bounded speaking scene.',
        reason: 'After the boss review, apply the words in a real situation.',
        estimatedMinutes: 5,
    },
]

export const VOCABULARY_MICROGAMES: VocabularyMicrogame[] = [
    {
        id: 'speed-match',
        title: 'Speed Match',
        subtitle: 'Tốc chiến từ vựng trong nháy mắt',
        objective: 'Nhận diện chớp nhoáng và chốt hạ trước khi đồng hồ cát cạn sạch — cách duy nhất ép não bộ bật phản xạ.',
        successCriteria: ['Nhận diện nhanh và chính xác', 'Giữ focus đến hết round', 'Submit kết quả để có receipt'],
        completionRule: 'Hoàn thành speed practice và submit kết quả.',
        receiptExpectation: 'Receipt hiện accuracy/speed outcome từ practice route.',
        nextActionLabel: 'Tiếp theo: Cloze Streak',
        nextActionHrefForTheme: (themeSlug, level) => `/vocabulary/practice/cloze?theme=${themeSlug}&level=${level}`,
        practiceType: 'speed',
        estimatedMinutes: 3,
        badgeHint: 'Speed starter',
        hrefForTheme: (themeSlug, level) => `/vocabulary/practice/speed?theme=${themeSlug}&level=${level}`,
    },
    {
        id: 'cloze-streak',
        title: 'Cloze Streak',
        subtitle: 'Bắn tỉa từ vựng vào đúng hồng tâm',
        objective: 'Lôi từ vựng ra khỏi ký ức và nạp đúng vào ngữ cảnh — thử thách cao hơn, nhưng sát thương gấp bội.',
        successCriteria: ['Đọc ngữ cảnh trước khi điền', 'Recall từ đúng từ đầu não', 'Submit để khóa streak'],
        completionRule: 'Hoàn thành cloze practice và submit kết quả.',
        receiptExpectation: 'Receipt hiện recall quality và mastery contribution sau submit.',
        nextActionLabel: 'Tiếp theo: Boss Review',
        nextActionHrefForTheme: (themeSlug, level) => `/vocabulary/practice/mixed?theme=${themeSlug}&level=${level}`,
        practiceType: 'cloze',
        estimatedMinutes: 4,
        badgeHint: 'Context recall',
        hrefForTheme: (themeSlug, level) => `/vocabulary/practice/cloze?theme=${themeSlug}&level=${level}`,
    },
    {
        id: 'boss-review',
        title: 'Boss Review',
        subtitle: 'Trận chiến sinh tử khóa trọn chủ đề',
        objective: 'Quét sạch mọi dạng câu hỏi trong trận địa Mixed Quest — cắm cờ chiến thắng để chứng minh em là bá chủ.',
        successCriteria: ['Làm mixed quest hết 3 dạng', 'Sửa lỗi trước khi submit', 'Dùng receipt để chọn node tiếp'],
        completionRule: 'Hoàn thành mixed practice và submit kết quả.',
        receiptExpectation: 'Receipt hiện XP/Fucoin/streak/mastery nếu completion hợp lệ.',
        nextActionLabel: 'Tiếp theo: Campaign Map',
        nextActionHrefForTheme: () => '/campaign',
        practiceType: 'mixed',
        estimatedMinutes: 6,
        badgeHint: 'Theme cleared',
        hrefForTheme: (themeSlug, level) => `/vocabulary/practice/mixed?theme=${themeSlug}&level=${level}`,
    },
]

export const GERMAN_ROLEPLAY_SCENARIOS: GermanRoleplayScenario[] = [
    {
        id: 'self-intro',
        title: 'Phá Băng Giao Tiếp',
        cefrLevel: 'A1',
        objective: 'Phóng thích cái tôi qua vài câu bản lề — một màn chào sân gọn gàng là đủ để mở ra mọi cuộc hội thoại.',
        situation: 'Ánh mắt chạm nhau giữa lớp học tiếng Đức — em hãy là người tung ra phát súng đầu tiên!',
        successCriteria: ['Chào hỏi tự nhiên', 'Nói tên và quê quán', 'Hỏi lại một câu đơn giản'],
        suggestedStarter: 'Hallo, ich heiße ...',
        href: '/speaking/roleplay?scenario=self-intro&level=A1',
    },
    {
        id: 'cafe-order',
        title: 'Thực Khách Tự Tin',
        cefrLevel: 'A1',
        objective: 'Chiếm lĩnh quầy order, chốt món và phong thái lịch thiệp — quán cafe chính là thao trường hoàn hảo.',
        situation: 'Em đang đứng giữa một quán cafe sầm uất tại Berlin — hãy dùng thứ tiếng Đức em đang có để giành lấy ly đồ uống!',
        successCriteria: ['Gọi được một món chính xác', 'Hỏi giá hoặc kích cỡ', 'Kết thúc lịch sự'],
        suggestedStarter: 'Ich möchte bitte einen Kaffee.',
        href: '/speaking/roleplay?scenario=cafe-order&level=A1',
    },
]

export const A1_CAMPAIGN_NODES: QuestCampaignNode[] = [
    {
        id: 'a1-person',
        title: 'Bản Ngã Của Tôi',
        cefrLevel: 'A1',
        themeSlug: 'a1-person',
        primarySkill: 'vocabulary',
        objective: 'Vũ trang từ vựng về bản thân — ngôn từ là viên gạch đầu tiên để xây đắp hình ảnh của em.',
        href: '/vocabulary/microgames?theme=a1-person&level=A1',
        supportHrefs: [
            { label: 'Speaking intro', href: '/speaking/roleplay?scenario=self-intro&level=A1', skill: 'speaking' },
            { label: 'Writing intro', href: '/writing/W-A1-T1-001', skill: 'writing' },
        ],
    },
    {
        id: 'a1-family',
        title: 'Huyết Thống & Gắn Kết',
        cefrLevel: 'A1',
        themeSlug: 'a1-familie',
        primarySkill: 'vocabulary',
        objective: 'Khai quật từ vựng gia đình — chủ đề cốt lõi thường xuyên chọc thủng phòng tuyến thi A1.',
        href: '/vocabulary/microgames?theme=a1-familie&level=A1',
        supportHrefs: [
            { label: 'Reading A1', href: '/reading/A1-T1-001', skill: 'reading' },
            { label: 'Listening A1', href: '/listening/L-A1-GOETHE-001-T1', skill: 'listening' },
        ],
    },
    {
        id: 'a1-cafe',
        title: 'Làm Chủ Bàn Tiệc',
        cefrLevel: 'A1',
        themeSlug: 'a1-essen-trinken',
        primarySkill: 'speaking',
        objective: 'Vác bộ từ vựng ẩm thực thẳng tiến ra chiến trường thực tế — gọi món chuẩn vị, không sợ sai.',
        href: '/speaking/roleplay?scenario=cafe-order&level=A1',
        supportHrefs: [
            { label: 'Vocab food', href: '/vocabulary/microgames?theme=a1-essen-trinken&level=A1', skill: 'vocabulary' },
            { label: 'Listening cafe', href: '/listening/L-A1-GOETHE-002-T1', skill: 'listening' },
        ],
    },
    {
        id: 'a1-directions',
        title: 'Giải Mã Bản Đồ',
        cefrLevel: 'A1',
        themeSlug: 'a1-reisen-verkehr',
        primarySkill: 'listening',
        objective: 'Bắt sóng chỉ đường qua từng bảng hiệu và giọng nói — để không một ngã rẽ nào đánh lừa được em.',
        href: '/listening/L-A1-GOETHE-003-T1',
        supportHrefs: [
            { label: 'Travel vocab', href: '/vocabulary/microgames?theme=a1-reisen-verkehr&level=A1', skill: 'vocabulary' },
            { label: 'Reading signs', href: '/reading/A1-T1-002', skill: 'reading' },
        ],
    },
    {
        id: 'a1-shopping',
        title: 'Thương Trường Khốc Liệt',
        cefrLevel: 'A1',
        themeSlug: 'a1-einkaufen',
        primarySkill: 'vocabulary',
        objective: 'Triệu hồi kho từ vựng để giáp lá cà với Boss Node — trận chiến này sẽ quyết định em có đi tiếp được không.',
        href: '/vocabulary/practice/mixed?theme=a1-einkaufen&level=A1',
        supportHrefs: [
            { label: 'Cloze streak', href: '/vocabulary/practice/cloze?theme=a1-einkaufen&level=A1', skill: 'vocabulary' },
            { label: 'Writing note', href: '/writing/W-A1-T1-002', skill: 'writing' },
        ],
        boss: true,
    },
]

export function buildBadgeAlbum(input: {
    events: MasteryEvent[]
    earnedBadgeSlugs: string[]
    currentLevel?: string | null
}): BadgeAlbumItem[] {
    const snapshot = buildSkillMasterySnapshot(input)
    const earned = new Set(input.earnedBadgeSlugs)
    const progressById = new Map<string, BadgeProgress>()
    for (const badge of PILOT_BADGE_CATALOG) {
        progressById.set(badge.id, {
            id: badge.id,
            title: badge.title,
            description: badge.description,
            category: badge.category,
            ...(badge.skill ? { skill: badge.skill } : {}),
            progress: 0,
            requirement: badge.requirement,
            unlocked: false,
        })
    }
    if (snapshot.nextBadgePreview) progressById.set(snapshot.nextBadgePreview.id, snapshot.nextBadgePreview)
    if (snapshot.badgeReceipt) progressById.set(snapshot.badgeReceipt.id, snapshot.badgeReceipt)

    return PILOT_BADGE_CATALOG.map((badge) => {
        const progress = progressById.get(badge.id) ?? {
            id: badge.id,
            title: badge.title,
            description: badge.description,
            category: badge.category,
            ...(badge.skill ? { skill: badge.skill } : {}),
            progress: 0,
            requirement: badge.requirement,
            unlocked: false,
        }
        const isEarned = earned.has(badge.id)
        const isReady = !isEarned && progress.progress >= 100

        return {
            ...progress,
            unlocked: isEarned,
            displayState: isEarned ? 'earned' : isReady ? 'ready' : 'locked',
            rarity: badge.category === 'retention' ? 'habit' : badge.category === 'learning' ? 'mastery' : 'starter',
        }
    })
}

export function buildCampaignNodeProgress(input: {
    node: QuestCampaignNode
    meaningfulEvents: MasteryEvent[]
}) {
    const nodeEvents = input.meaningfulEvents.filter((event) => {
        const raw = `${event.actionId ?? ''} ${event.skill ?? ''} ${event.actionType ?? ''}`.toLowerCase()
        return raw.includes(input.node.themeSlug.replace(/^a1-/, '')) || raw.includes(input.node.primarySkill)
    })
    const supportSkills = new Set(input.node.supportHrefs.map((href) => href.skill))
    const supportTouches = input.meaningfulEvents.filter((event) => {
        const raw = `${event.skill ?? ''} ${event.actionType ?? ''}`.toLowerCase()
        return [...supportSkills].some((skill) => raw.includes(skill))
    }).length
    const progress = Math.min(100, Math.round(((nodeEvents.length * 45) + Math.min(2, supportTouches) * 20 + (input.node.boss ? 10 : 0))))
    const state = campaignNodeState({
        boss: Boolean(input.node.boss),
        evidenceCount: nodeEvents.length + supportTouches,
        progress,
    })

    return {
        nodeId: input.node.id,
        progress,
        completed: progress >= 100,
        evidenceCount: nodeEvents.length + supportTouches,
        state,
        stateLabel: campaignNodeStateLabel(state),
        stateReason: campaignNodeStateReason(state),
    }
}

export function getFirstSessionPathStep(stepId: FirstSessionPathStep['id'] | null | undefined) {
    return A1_FIRST_CONTACT_PATH.find((step) => step.id === stepId) ?? A1_FIRST_CONTACT_PATH[0]!
}

export function getFirstSessionNextStep(stepId: FirstSessionPathStep['id'] | null | undefined) {
    const index = A1_FIRST_CONTACT_PATH.findIndex((step) => step.id === stepId)
    if (index < 0) return A1_FIRST_CONTACT_PATH[0]!
    return A1_FIRST_CONTACT_PATH[index + 1] ?? A1_FIRST_CONTACT_PATH[index]!
}

export function buildFirstSessionPathProgress(events: FirstSessionProgressEvent[]): FirstSessionPathProgressItem[] {
    const completedAtByStep = new Map<FirstSessionPathStep['id'], Date>()

    for (const event of events) {
        const stepId = firstSessionStepFromEvent(event)
        if (!stepId) continue
        const existing = completedAtByStep.get(stepId)
        if (!existing || event.createdAt < existing) {
            completedAtByStep.set(stepId, event.createdAt)
        }
    }

    const firstIncompleteIndex = A1_FIRST_CONTACT_PATH.findIndex((step) => !completedAtByStep.has(step.id))

    return A1_FIRST_CONTACT_PATH.map((step, index) => {
        const completedAt = completedAtByStep.get(step.id)
        return {
            ...step,
            status: completedAt
                ? 'done'
                : index === (firstIncompleteIndex < 0 ? A1_FIRST_CONTACT_PATH.length - 1 : firstIncompleteIndex)
                    ? 'next'
                    : 'not_started',
            completedAt: completedAt?.toISOString() ?? null,
        }
    })
}

function firstSessionStepFromEvent(event: FirstSessionProgressEvent): FirstSessionPathStep['id'] | null {
    const metadata = metadataRecord(event.metadata)
    const raw = `${event.actionId ?? ''} ${event.actionType ?? ''} ${event.skill ?? ''}`.toLowerCase()
    const theme = String(metadata?.themeSlug ?? metadata?.theme_slug ?? '').toLowerCase()
    const exerciseType = String(metadata?.exerciseType ?? metadata?.exercise_type ?? '').toLowerCase()

    if (event.eventName === 'meaningful_action_completed' && (theme === 'a1-person' || raw.includes('a1-person'))) {
        if (exerciseType === 'speed' || raw.includes(':speed') || raw.includes(' speed')) return 'speed-match'
        if (exerciseType === 'cloze' || raw.includes(':cloze') || raw.includes(' cloze')) return 'cloze-streak'
        if (exerciseType === 'mixed' || raw.includes(':mixed') || raw.includes(' mixed')) return 'boss-review'
    }

    if (
        event.eventName === 'quest_episode_completed'
        && metadata?.scenarioId === 'self-intro'
    ) {
        return 'roleplay-self-intro'
    }

    return null
}

function campaignNodeState(input: {
    boss: boolean
    evidenceCount: number
    progress: number
}): CampaignNodeState {
    if (input.progress >= 100) return 'cleared'
    if (input.boss && input.progress >= 70) return 'ready_for_boss'
    if (input.evidenceCount > 0) return 'in_progress'
    return 'available'
}

function campaignNodeStateLabel(state: CampaignNodeState) {
    if (state === 'cleared') return 'Cleared'
    if (state === 'ready_for_boss') return 'Ready for boss'
    if (state === 'in_progress') return 'In progress'
    return 'Available'
}

function campaignNodeStateReason(state: CampaignNodeState) {
    if (state === 'cleared') return 'Enough learning evidence found for this node.'
    if (state === 'ready_for_boss') return 'This boss node has enough prep evidence for a final review.'
    if (state === 'in_progress') return 'Some learning evidence exists; one more activity will push the node forward.'
    return 'No evidence yet. Start one meaningful activity to light up this node.'
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}

export function getMicrogameById(id: string | null | undefined) {
    return VOCABULARY_MICROGAMES.find((game) => game.id === id) ?? VOCABULARY_MICROGAMES[0]!
}

export function getRoleplayScenarioById(id: string | null | undefined) {
    return GERMAN_ROLEPLAY_SCENARIOS.find((scenario) => scenario.id === id) ?? GERMAN_ROLEPLAY_SCENARIOS[0]!
}
