import {
    FUXIE_GLOBAL_BUILDINGS,
    FUXIE_GLOBAL_LEARNING_PROPS,
    FUXIE_GLOBAL_MASCOT_STATES,
    FUXIE_GLOBAL_REWARD_ITEMS,
    FUXIE_GLOBAL_UI_FRAMES,
    FUXIE_GLOBAL_WORLD_LOCATIONS,
    FUXIE_GLOBAL_WORLD_PROPS,
} from './fuxie-global-assets'

/**
 * Default placeholder path returned by Asset Registry lookup helpers when a
 * key cannot be resolved. Lives under `apps/web/public/`.
 *
 * Validates: Requirements 1.6
 */
export const PLACEHOLDER_ASSET = '/mascot-3d/optimized/fuxie-placeholder-512.webp' as const

export const FUXIE_MASCOT_STATES = {
    neutral: FUXIE_GLOBAL_MASCOT_STATES.sessionFocusCoach,
    smile: FUXIE_GLOBAL_MASCOT_STATES.campaignHost,
    wave: FUXIE_GLOBAL_MASCOT_STATES.authWelcomer,
    avatar: FUXIE_GLOBAL_MASCOT_STATES.sessionFocusCoach,
    'tiny-icon': FUXIE_GLOBAL_MASCOT_STATES.sessionFocusCoach,
    welcome: FUXIE_GLOBAL_MASCOT_STATES.authWelcomer,
    'choose-level': FUXIE_GLOBAL_MASCOT_STATES.cefrGateGuide,
    'learning-path': FUXIE_GLOBAL_MASCOT_STATES.cefrGateGuide,
    'start-learning': FUXIE_GLOBAL_MASCOT_STATES.sessionFocusCoach,
    explain: FUXIE_GLOBAL_MASCOT_STATES.grammarMentor,
    thinking: FUXIE_GLOBAL_MASCOT_STATES.grammarMentor,
    hint: FUXIE_GLOBAL_MASCOT_STATES.teacherCoach,
    reading: FUXIE_GLOBAL_MASCOT_STATES.sessionFocusCoach,
    listening: '/mascot-3d/states/v2/fuxie-state-listening-focus-512.webp',
    speaking: '/mascot-3d/states/v2/fuxie-state-speaking-record-512.webp',
    writing: '/mascot-3d/states/v2/fuxie-state-writing-delivery-512.webp',
    grammar: FUXIE_GLOBAL_MASCOT_STATES.grammarMentor,
    correct: '/mascot-3d/states/v2/fuxie-state-result-celebration-512.webp',
    excellent: '/mascot-3d/states/v2/fuxie-state-result-celebration-512.webp',
    almost: '/mascot-3d/states/v2/fuxie-state-gentle-correction-512.webp',
    wrong: FUXIE_GLOBAL_MASCOT_STATES.errorRepairHelper,
    'try-again': '/mascot-3d/states/v2/fuxie-state-gentle-correction-512.webp',
    'reveal-answer': FUXIE_GLOBAL_MASCOT_STATES.grammarMentor,
    encourage: FUXIE_GLOBAL_MASCOT_STATES.sessionFocusCoach,
    streak: FUXIE_GLOBAL_MASCOT_STATES.campaignHost,
    'level-up': FUXIE_GLOBAL_MASCOT_STATES.leaderboardAnnouncer,
    reward: FUXIE_GLOBAL_MASCOT_STATES.rewardClerk,
    fucoin: FUXIE_GLOBAL_MASCOT_STATES.rewardClerk,
    'mission-complete': FUXIE_GLOBAL_MASCOT_STATES.campaignHost,
    loading: FUXIE_GLOBAL_MASCOT_STATES.sessionFocusCoach,
    empty: '/mascot-3d/states/v2/fuxie-state-calm-empty-512.webp',
    error: FUXIE_GLOBAL_MASCOT_STATES.errorRepairHelper,
    maintenance: FUXIE_GLOBAL_MASCOT_STATES.opsMechanic,
    'exam-focus': FUXIE_GLOBAL_MASCOT_STATES.examProctor,
    'time-warning': FUXIE_GLOBAL_MASCOT_STATES.examProctor,
    'result-review': '/mascot-3d/states/v2/fuxie-state-result-celebration-512.webp',
    questPlanner: '/mascot-3d/states/v2/fuxie-state-quest-planner-512.webp',
    gentleCorrection: '/mascot-3d/states/v2/fuxie-state-gentle-correction-512.webp',
    listeningFocus: '/mascot-3d/states/v2/fuxie-state-listening-focus-512.webp',
    speakingRecord: '/mascot-3d/states/v2/fuxie-state-speaking-record-512.webp',
    writingDelivery: '/mascot-3d/states/v2/fuxie-state-writing-delivery-512.webp',
    shopApproval: '/mascot-3d/states/v2/fuxie-state-shop-approval-512.webp',
    resultCelebration: '/mascot-3d/states/v2/fuxie-state-result-celebration-512.webp',
    calmEmpty: '/mascot-3d/states/v2/fuxie-state-calm-empty-512.webp',
    grammarMentor: FUXIE_GLOBAL_MASCOT_STATES.grammarMentor,
    reviewGardener: FUXIE_GLOBAL_MASCOT_STATES.reviewGardener,
    badgeCurator: FUXIE_GLOBAL_MASCOT_STATES.badgeCurator,
    campaignHost: FUXIE_GLOBAL_MASCOT_STATES.campaignHost,
    leaderboardAnnouncer: FUXIE_GLOBAL_MASCOT_STATES.leaderboardAnnouncer,
    sessionFocusCoach: FUXIE_GLOBAL_MASCOT_STATES.sessionFocusCoach,
    microgameReferee: FUXIE_GLOBAL_MASCOT_STATES.microgameReferee,
    roleplayWaiter: FUXIE_GLOBAL_MASCOT_STATES.roleplayWaiter,
    examProctor: FUXIE_GLOBAL_MASCOT_STATES.examProctor,
    cefrGateGuide: FUXIE_GLOBAL_MASCOT_STATES.cefrGateGuide,
    teacherCoach: FUXIE_GLOBAL_MASCOT_STATES.teacherCoach,
    classroomHelper: FUXIE_GLOBAL_MASCOT_STATES.classroomHelper,
    adminAnalyst: FUXIE_GLOBAL_MASCOT_STATES.adminAnalyst,
    contentReviewer: FUXIE_GLOBAL_MASCOT_STATES.contentReviewer,
    opsMechanic: FUXIE_GLOBAL_MASCOT_STATES.opsMechanic,
    rewardClerk: FUXIE_GLOBAL_MASCOT_STATES.rewardClerk,
    authWelcomer: FUXIE_GLOBAL_MASCOT_STATES.authWelcomer,
    privacyGuardian: FUXIE_GLOBAL_MASCOT_STATES.privacyGuardian,
    qaInspector: FUXIE_GLOBAL_MASCOT_STATES.qaInspector,
    errorRepairHelper: FUXIE_GLOBAL_MASCOT_STATES.errorRepairHelper,
    // --- asset-registry-cleanup Phase 3 (Decision 4) wire-into-registry verdicts ---
    // 11 mascot `.webp` seed plates per docs/design/asset-orphan-classification.md
    // (Block A rows 2, 4, 6, 8, 10, 12, 14, 17, 19, 21, 23) plus the placeholder
    // file (row 24). Registry membership alone clears the orphan per Task 4.3;
    // no consumer call sites are added in this PR.
    coreCelebration: '/mascot-3d/optimized/fuxie-3d-core-celebration-512.webp',
    coreDailyMission: '/mascot-3d/optimized/fuxie-3d-core-daily-mission-512.webp',
    coreHappyWave: '/mascot-3d/optimized/fuxie-3d-core-happy-wave-512.webp',
    gameFucoinReward: '/mascot-3d/optimized/fuxie-3d-game-fucoin-reward-512.webp',
    gameStreakFreezeSaved: '/mascot-3d/optimized/fuxie-3d-game-streak-freeze-saved-512.webp',
    roleExamGuide: '/mascot-3d/optimized/fuxie-3d-role-exam-guide-512.webp',
    roleLibrarian: '/mascot-3d/optimized/fuxie-3d-role-librarian-512.webp',
    rolePostOffice: '/mascot-3d/optimized/fuxie-3d-role-post-office-512.webp',
    roleRadioHost: '/mascot-3d/optimized/fuxie-3d-role-radio-host-512.webp',
    roleShopkeeper: '/mascot-3d/optimized/fuxie-3d-role-shopkeeper-512.webp',
    roleSpeakingCoach: '/mascot-3d/optimized/fuxie-3d-role-speaking-coach-512.webp',
} as const

export const FUXIE_MODULE_MASCOTS = {
    vocabulary: FUXIE_GLOBAL_MASCOT_STATES.microgameReferee,
    grammar: FUXIE_GLOBAL_MASCOT_STATES.grammarMentor,
    reading: FUXIE_GLOBAL_MASCOT_STATES.sessionFocusCoach,
    listening: FUXIE_MASCOT_STATES.listeningFocus,
    writing: FUXIE_MASCOT_STATES.writingDelivery,
    speaking: FUXIE_MASCOT_STATES.speakingRecord,
    chat: FUXIE_GLOBAL_MASCOT_STATES.roleplayWaiter,
    exam: FUXIE_GLOBAL_MASCOT_STATES.examProctor,
    review: FUXIE_GLOBAL_MASCOT_STATES.reviewGardener,
    course: FUXIE_GLOBAL_MASCOT_STATES.cefrGateGuide,
    dashboard: FUXIE_GLOBAL_MASCOT_STATES.campaignHost,
    shop: FUXIE_GLOBAL_MASCOT_STATES.rewardClerk,
} as const

export const FUXIE_GAMIFICATION_MASCOTS = {
    fucoin: FUXIE_GLOBAL_REWARD_ITEMS.fucoinPouch,
    streak: FUXIE_GLOBAL_REWARD_ITEMS.comebackCandle,
    badge: FUXIE_GLOBAL_REWARD_ITEMS.badgePolishKit,
    shopkeeper: FUXIE_GLOBAL_MASCOT_STATES.rewardClerk,
    mission: FUXIE_GLOBAL_MASCOT_STATES.campaignHost,
    'daily-goal': FUXIE_GLOBAL_REWARD_ITEMS.dailyGoalStamp,
    'rank-up': FUXIE_GLOBAL_MASCOT_STATES.leaderboardAnnouncer,
    'perfect-score': FUXIE_MASCOT_STATES.resultCelebration,
    'xp-star': FUXIE_GLOBAL_REWARD_ITEMS.xpStarBundle,
    'streak-freeze': FUXIE_GLOBAL_REWARD_ITEMS.streakFreezeCrystal,
    'achievement-unlocked': FUXIE_GLOBAL_REWARD_ITEMS.cefrGateKey,
    'reward-chest': FUXIE_GLOBAL_REWARD_ITEMS.rewardChestSmall,
} as const

export const FUXIE_WORLD_PROPS = {
    villageSquare: '/mascot-3d/world/optimized/v1/fuxie-world-01-village-square-512.webp',
    missionBoard: '/mascot-3d/world/optimized/v1/fuxie-world-02-mission-board-512.webp',
    courseSignpost: FUXIE_GLOBAL_WORLD_PROPS.villageSignpostCluster,
    marketStall: FUXIE_GLOBAL_BUILDINGS.marketStall,
    library: FUXIE_GLOBAL_BUILDINGS.readingLibrary,
    radioBooth: FUXIE_GLOBAL_BUILDINGS.radioListeningTower,
    postOffice: FUXIE_GLOBAL_BUILDINGS.writingPostOffice,
    townHallExam: FUXIE_GLOBAL_BUILDINGS.rathausExamHall,
    reviewGarden: FUXIE_GLOBAL_WORLD_LOCATIONS.reviewGardenGreenhouse,
    chatCafe: FUXIE_GLOBAL_WORLD_LOCATIONS.speakingRoleplayCafeRoom,
    grammarScroll: FUXIE_GLOBAL_LEARNING_PROPS.grammarGearScroll,
    speakingStage: FUXIE_GLOBAL_BUILDINGS.speakingStageCafe,
    collectionBook: FUXIE_GLOBAL_LEARNING_PROPS.vocabularyFlashcardBox,
    phraseStamp: '/mascot-3d/world/optimized/v1/fuxie-world-14-phrase-stamp-512.webp',
    postcardFragment: '/mascot-3d/world/optimized/v1/fuxie-world-15-postcard-fragment-512.webp',
    badgeShelf: FUXIE_GLOBAL_WORLD_LOCATIONS.badgeMuseumShelfRoom,
    villageSquareMissionBoard: '/mascot-3d/world/optimized/v2/fuxie-world-village-square-mission-board-512.webp',
    // --- asset-registry-cleanup Phase 3 (Decision 4) wire-into-registry rewires ---
    // 7 v2 world plates per docs/design/asset-orphan-classification.md Block C
    // (rows 53–59). Existing keys are repointed from /world/global/ paths to the
    // v2 plates that match the design manifest's integrationTarget exactly.
    courseSignpostPath: '/mascot-3d/world/optimized/v2/fuxie-world-course-signpost-path-512.webp',
    collectionBookTable: '/mascot-3d/world/optimized/v2/fuxie-world-collection-book-table-512.webp',
    readingLibraryDesk: '/mascot-3d/world/optimized/v2/fuxie-world-reading-library-desk-512.webp',
    radioBoothConsole: '/mascot-3d/world/optimized/v2/fuxie-world-radio-booth-console-512.webp',
    speakingStageCafe: '/mascot-3d/world/optimized/v2/fuxie-world-speaking-stage-cafe-512.webp',
    postOfficeCounter: '/mascot-3d/world/optimized/v2/fuxie-world-post-office-counter-512.webp',
    marketBackpackStall: '/mascot-3d/world/optimized/v2/fuxie-world-market-backpack-stall-512.webp',
    grammarWorkshopInterior: FUXIE_GLOBAL_WORLD_LOCATIONS.grammarWorkshopInterior,
    examResultHall: FUXIE_GLOBAL_WORLD_LOCATIONS.examResultHall,
    leaderboardGuildHall: FUXIE_GLOBAL_WORLD_LOCATIONS.leaderboardGuildHall,
    campaignFestivalBoard: FUXIE_GLOBAL_WORLD_LOCATIONS.campaignFestivalBoard,
    sessionFocusDojo: FUXIE_GLOBAL_WORLD_LOCATIONS.sessionFocusDojo,
    teacherAcademyExterior: FUXIE_GLOBAL_WORLD_LOCATIONS.teacherAcademyExterior,
    adminCommandCenter: FUXIE_GLOBAL_WORLD_LOCATIONS.adminCommandCenter,
} as const

export const FUXIE_UI_FRAMES = {
    // --- asset-registry-cleanup Phase 3 (Decision 4) wire-into-registry rewires ---
    // 8 v1 UI frame plates per docs/design/asset-orphan-classification.md Block D
    // (rows 60–67). Existing keys are repointed from /ui/global/ paths to the
    // v1 frame plates per the design manifest's integrationTarget.
    noticeBoard: '/mascot-3d/ui/optimized/v1/fuxie-ui-notice-board-frame-512.webp',
    courseCheckpointNode: '/mascot-3d/ui/optimized/v1/fuxie-ui-course-checkpoint-node-512.webp',
    collectionCardFrame: '/mascot-3d/ui/optimized/v1/fuxie-ui-collection-card-frame-512.webp',
    audioBroadcastPanel: '/mascot-3d/ui/optimized/v1/fuxie-ui-audio-broadcast-panel-512.webp',
    letterReceiptFrame: '/mascot-3d/ui/optimized/v1/fuxie-ui-letter-receipt-frame-512.webp',
    resultRevealFrame: '/mascot-3d/ui/optimized/v1/fuxie-ui-result-reveal-frame-512.webp',
    marketShelfFrame: '/mascot-3d/ui/optimized/v1/fuxie-ui-market-shelf-frame-512.webp',
    emptyStateSignpost: '/mascot-3d/ui/optimized/v1/fuxie-ui-empty-state-signpost-512.webp',
    badgeReceiptFrame: FUXIE_GLOBAL_UI_FRAMES.badgeReceipt,
    dailyGoalNoticeFrame: FUXIE_GLOBAL_UI_FRAMES.dailyGoalNotice,
    chatBubbleVillageFrame: FUXIE_GLOBAL_UI_FRAMES.chatBubbleVillage,
    authWelcomePanel: FUXIE_GLOBAL_UI_FRAMES.authWelcomePanel,
    teacherClassroomCard: FUXIE_GLOBAL_UI_FRAMES.teacherClassroomCard,
    adminAnalyticsPanel: FUXIE_GLOBAL_UI_FRAMES.adminAnalyticsPanel,
} as const

export type FuxieMascotState = keyof typeof FUXIE_MASCOT_STATES
export type FuxieModuleMascot = keyof typeof FUXIE_MODULE_MASCOTS
export type FuxieGamificationMascot = keyof typeof FUXIE_GAMIFICATION_MASCOTS
export type FuxieWorldProp = keyof typeof FUXIE_WORLD_PROPS
export type FuxieUiFrame = keyof typeof FUXIE_UI_FRAMES

export const FUXIE_LEGACY_MASCOT_ALIASES = {
    wortschatz: 'reading',
    grammatik: 'grammar',
    hoeren: 'listening',
    lesen: 'reading',
    schreiben: 'writing',
    sprechen: 'speaking',
    encouragement: 'encourage',
    studying: 'reading',
    lightbulb: 'hint',
    graduation: 'excellent',
    celebrate: 'excellent',
    'happy-wave': 'wave',
    'sad-tears': 'encourage',
    surprised: 'almost',
    'streak-fire': 'streak',
    'streak-sick': 'try-again',
    achievement: 'reward',
    'daily-goal': 'mission-complete',
    levelup: 'level-up',
    'perfect-score': 'excellent',
    rankup: 'level-up',
    'xp-earned': 'reward',
    angry: 'wrong',
    cool: 'smile',
    love: 'encourage',
    sleepy: 'loading',
    landing: 'wave',
    onboarding: 'welcome',

    'core-happy-wave': 'wave',
    'core-sad-tears': 'encourage',
    'core-thinking': 'thinking',
    'core-surprised': 'almost',
    'core-celebrate': 'excellent',
    'learn-correct': 'correct',
    'learn-wrong': 'wrong',
    'learn-studying': 'reading',
    'learn-graduation': 'excellent',
    'learn-lightbulb': 'hint',
    'learn-encouragement': 'encourage',
    'skill-hoeren': 'listening',
    'skill-lesen': 'reading',
    'skill-schreiben': 'writing',
    'skill-sprechen': 'speaking',
    'skill-grammatik': 'grammar',
    'skill-wortschatz': 'reading',
    'state-empty': 'empty',
    'state-error': 'error',
    'state-loading': 'loading',
    'state-welcome': 'welcome',
    'game-streak-sick': 'try-again',
    'game-streak-fire': 'streak',
    'game-levelup': 'level-up',
    'game-achievement': 'reward',
    'game-xp-earned': 'reward',
    'game-daily-goal': 'mission-complete',
    'game-perfect-score': 'excellent',
    'game-rankup': 'level-up',
    'hero-landing': 'wave',
    'hero-onboarding': 'welcome',
    'sticker-love': 'encourage',
    'sticker-sleepy': 'loading',
    'sticker-angry': 'wrong',
    'sticker-cool': 'smile',
} as const satisfies Record<string, FuxieMascotState>

export type FuxieLegacyMascotKey = keyof typeof FUXIE_LEGACY_MASCOT_ALIASES
export type FuxieMascotKey = FuxieMascotState | FuxieLegacyMascotKey

/**
 * Emit a console warning when an Asset Registry lookup misses, but only in
 * development. Production keeps the log noise off so a missing key falls
 * through silently to {@link PLACEHOLDER_ASSET}.
 *
 * Validates: Requirements 1.6, 18.2
 */
function warnAssetMiss(group: string, key: string): void {
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(
            `[asset-registry] miss: group="${group}" key="${key}" — falling back to PLACEHOLDER_ASSET`,
        )
    }
}

/**
 * Object membership check that ignores inherited prototype keys.
 *
 * Plain object literals inherit `__proto__`, `constructor`, `toString`,
 * `valueOf`, `hasOwnProperty`, etc. from `Object.prototype`. Using
 * `key in MAP` for Asset Registry lookups would let those inherited names
 * register as hits and surface a function or prototype object as the
 * "asset path", violating Req 1.6 (every helper SHALL return a string;
 * miss SHALL fall through to PLACEHOLDER_ASSET).
 *
 * Validates: Requirements 1.6
 */
function hasOwn<T extends object>(map: T, key: PropertyKey): key is keyof T {
    return Object.prototype.hasOwnProperty.call(map, key)
}

export function resolveFuxieMascotState(key: string): FuxieMascotState | null {
    if (hasOwn(FUXIE_MASCOT_STATES, key)) return key as FuxieMascotState
    if (hasOwn(FUXIE_LEGACY_MASCOT_ALIASES, key)) {
        return FUXIE_LEGACY_MASCOT_ALIASES[key as FuxieLegacyMascotKey]
    }
    return null
}

/**
 * Resolve a mascot pose key (state or legacy alias) to a public path.
 *
 * Total: any unknown key resolves to {@link PLACEHOLDER_ASSET} and emits a
 * dev-only console warning.
 *
 * Validates: Requirements 1.2, 1.6, 18.2
 */
export function getFuxieMascotSrc(key: string): string {
    const state = resolveFuxieMascotState(key)
    if (state) return FUXIE_MASCOT_STATES[state]
    warnAssetMiss('FUXIE_MASCOT_STATES', key)
    return PLACEHOLDER_ASSET
}

/**
 * Resolve a module mascot key to a public path. Total: unknown keys fall
 * through to {@link PLACEHOLDER_ASSET}.
 *
 * Validates: Requirements 1.2, 1.6, 18.2
 */
export function getFuxieModuleMascotSrc(key: string): string {
    if (hasOwn(FUXIE_MODULE_MASCOTS, key)) {
        return FUXIE_MODULE_MASCOTS[key as FuxieModuleMascot]
    }
    warnAssetMiss('FUXIE_MODULE_MASCOTS', key)
    return PLACEHOLDER_ASSET
}

/**
 * Resolve a gamification mascot key to a public path. Total: unknown keys
 * fall through to {@link PLACEHOLDER_ASSET}.
 *
 * Validates: Requirements 1.2, 1.6, 18.2
 */
export function getFuxieGameMascotSrc(key: string): string {
    if (hasOwn(FUXIE_GAMIFICATION_MASCOTS, key)) {
        return FUXIE_GAMIFICATION_MASCOTS[key as FuxieGamificationMascot]
    }
    warnAssetMiss('FUXIE_GAMIFICATION_MASCOTS', key)
    return PLACEHOLDER_ASSET
}

/**
 * Resolve a world prop key to a public path. Total: unknown keys fall through
 * to {@link PLACEHOLDER_ASSET}.
 *
 * Validates: Requirements 1.2, 1.6, 18.2
 */
export function getFuxieWorldPropSrc(key: string): string {
    if (hasOwn(FUXIE_WORLD_PROPS, key)) {
        return FUXIE_WORLD_PROPS[key as FuxieWorldProp]
    }
    warnAssetMiss('FUXIE_WORLD_PROPS', key)
    return PLACEHOLDER_ASSET
}

/**
 * Resolve a UI frame key to a public path. Total: unknown keys fall through
 * to {@link PLACEHOLDER_ASSET}.
 *
 * Validates: Requirements 1.2, 1.6, 18.2
 */
export function getFuxieUiFrameSrc(key: string): string {
    if (hasOwn(FUXIE_UI_FRAMES, key)) {
        return FUXIE_UI_FRAMES[key as FuxieUiFrame]
    }
    warnAssetMiss('FUXIE_UI_FRAMES', key)
    return PLACEHOLDER_ASSET
}

/**
 * Mascot 3D assets used by gamification surfaces. Values resolve to optimized
 * 512x512 webp files under `apps/web/public/mascot-3d/`.
 *
 * Validates: Requirements 1.1, 1.4
 */
export const FUXIE_3D_ASSETS = {
    happyWave: FUXIE_MASCOT_STATES.wave,
    questPlanner: FUXIE_MASCOT_STATES.questPlanner,
    gentleCorrection: FUXIE_MASCOT_STATES.gentleCorrection,
    listeningFocus: FUXIE_MASCOT_STATES.listeningFocus,
    speakingRecord: FUXIE_MASCOT_STATES.speakingRecord,
    writingDelivery: FUXIE_MASCOT_STATES.writingDelivery,
    shopApproval: FUXIE_MASCOT_STATES.shopApproval,
    resultCelebration: FUXIE_MASCOT_STATES.resultCelebration,
    calmEmpty: FUXIE_MASCOT_STATES.calmEmpty,
    dailyMission: FUXIE_GAMIFICATION_MASCOTS['daily-goal'],
    fucoinReward: FUXIE_GAMIFICATION_MASCOTS.fucoin,
    streakFreezeSaved: FUXIE_GAMIFICATION_MASCOTS['streak-freeze'],
    shopkeeper: FUXIE_MODULE_MASCOTS.shop,
    librarian: FUXIE_MODULE_MASCOTS.reading,
    radioHost: FUXIE_MODULE_MASCOTS.listening,
    postOffice: FUXIE_MODULE_MASCOTS.writing,
    examGuide: FUXIE_MODULE_MASCOTS.exam,
    speakingCoach: FUXIE_MODULE_MASCOTS.speaking,
    celebration: FUXIE_GAMIFICATION_MASCOTS['perfect-score'],
    vocabularyCoach: FUXIE_MODULE_MASCOTS.vocabulary,
    grammarCoach: FUXIE_MODULE_MASCOTS.grammar,
    chatTutor: FUXIE_MODULE_MASCOTS.chat,
    reviewGuide: FUXIE_MODULE_MASCOTS.review,
    courseGuide: FUXIE_MODULE_MASCOTS.course,
    dashboardGuide: FUXIE_MODULE_MASCOTS.dashboard,
    badgeEarned: FUXIE_GAMIFICATION_MASCOTS.badge,
    mission: FUXIE_GAMIFICATION_MASCOTS.mission,
    rankUp: FUXIE_GAMIFICATION_MASCOTS['rank-up'],
    xpStar: FUXIE_GAMIFICATION_MASCOTS['xp-star'],
    achievementUnlocked: FUXIE_GAMIFICATION_MASCOTS['achievement-unlocked'],
    rewardChest: FUXIE_GAMIFICATION_MASCOTS['reward-chest'],
} as const

export type FuxieMascot3DAsset = keyof typeof FUXIE_3D_ASSETS

/**
 * Living 3D mascot prototype assets (model + poster + animation frames).
 * Wrapped by `FuxieLive3DDynamic` consumers; values resolve under
 * `apps/web/public/mascot-3d/live/`.
 *
 * Validates: Requirements 1.1
 */
export const FUXIE_LIVING_3D_ASSETS = {
    model: '/mascot-3d/live/fuxie-living-prototype.glb',
    poster: '/mascot-3d/live/fuxie-living-prototype-poster.png',
    frames: [
        '/mascot-3d/live/fuxie-living-prototype-frame-1.webp',
        '/mascot-3d/live/fuxie-living-prototype-frame-2.webp',
        '/mascot-3d/live/fuxie-living-prototype-frame-3.webp',
        '/mascot-3d/live/fuxie-living-prototype-frame-4.webp',
    ],
} as const

export type FuxieLiving3DAssetKey = keyof typeof FUXIE_LIVING_3D_ASSETS

/**
 * Resolve a living-3D asset key (`'model' | 'poster' | 'frames'`) to its
 * public path or paths. Total: unknown keys return {@link PLACEHOLDER_ASSET}
 * and emit a dev-only console warning.
 *
 * - `'model'` → `.glb` model path (string)
 * - `'poster'` → poster image path (string)
 * - `'frames'` → array of webp frame paths (`string[]`)
 *
 * Validates: Requirements 1.2, 1.6, 18.2
 */
export function getFuxieLiving3dAsset(key: 'model' | 'poster'): string
export function getFuxieLiving3dAsset(key: 'frames'): readonly string[]
export function getFuxieLiving3dAsset(key: string): string | readonly string[]
export function getFuxieLiving3dAsset(key: string): string | readonly string[] {
    if (hasOwn(FUXIE_LIVING_3D_ASSETS, key)) {
        return FUXIE_LIVING_3D_ASSETS[key as FuxieLiving3DAssetKey]
    }
    warnAssetMiss('FUXIE_LIVING_3D_ASSETS', key)
    return PLACEHOLDER_ASSET
}
