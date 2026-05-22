/**
 * World prop tag taxonomy.
 *
 * Maps every `FuxieWorldProp` key declared in `FUXIE_WORLD_PROPS` to a small
 * set of `WorldTag` descriptors so surfaces (Reading, Listening, Speaking,
 * Writing, Dashboard, ...) can request a world prop by intent ("library",
 * "studio") instead of hardcoding asset keys.
 *
 * Validates Requirements 6.4–6.8: each skill surface picks its background
 * identity via tags rather than a literal `FuxieWorldProp` key.
 *
 * Owner: Frontend Engineer.
 * Co-author: Design System Designer (tag taxonomy review).
 */

import type { FuxieWorldProp } from './fuxie-assets'

/**
 * Closed set of world tags. Kept deliberately small so `pickWorldProp` callers
 * cannot drift into ad-hoc strings.
 *
 * If you need a new tag, add it here and update `FUXIE_WORLD_PROP_TAGS` in the
 * same change so every surface continues to resolve to a valid prop.
 */
export type WorldTag =
    // Village / dashboard / mission entry points
    | 'village'
    | 'plaza'
    | 'town-square'
    | 'signpost'
    | 'path'
    | 'notice'
    // Market / shop / inventory
    | 'market'
    | 'shop'
    | 'inventory'
    // Reading
    | 'library'
    | 'library-shelf'
    | 'reading-room'
    // Listening
    | 'studio'
    | 'radio'
    | 'broadcast-room'
    // Speaking
    | 'cafe'
    | 'stage'
    // Writing / grammar workshops
    | 'desk'
    | 'workshop'
    | 'study-room'
    // Vocabulary collection
    | 'vocabulary'
    | 'collection'
    // Grammar / exam / review
    | 'grammar'
    | 'exam-hall'
    | 'town-hall'
    | 'garden'
    | 'review'
    // Cosmetics / community / focus
    | 'badge'
    | 'shelf'
    | 'guild'
    | 'hall'
    | 'festival'
    | 'dojo'
    | 'focus'
    // Non-learner staging worlds (kept for completeness; learner UI does not
    // pick these via tags but they still need a tag set so the registry is
    // total).
    | 'teacher'
    | 'admin'

/**
 * Tag map covering every key in `FUXIE_WORLD_PROPS`. Typed as
 * `Record<FuxieWorldProp, ...>` so TypeScript fails the build if a new world
 * prop is added without a tag entry.
 */
export const FUXIE_WORLD_PROP_TAGS: Record<FuxieWorldProp, ReadonlyArray<WorldTag>> = {
    // Village / dashboard
    villageSquare: ['village', 'plaza', 'town-square'],
    missionBoard: ['village', 'notice'],
    villageSquareMissionBoard: ['village', 'notice', 'plaza'],

    // Course path
    courseSignpost: ['signpost', 'path'],
    courseSignpostPath: ['signpost', 'path'],

    // Market / shop / inventory
    marketStall: ['market', 'shop'],
    marketBackpackStall: ['market', 'shop', 'inventory'],

    // Reading
    library: ['library', 'reading-room'],
    readingLibraryDesk: ['library', 'library-shelf', 'reading-room'],

    // Listening
    radioBooth: ['studio', 'radio', 'broadcast-room'],
    radioBoothConsole: ['studio', 'radio'],

    // Writing
    postOffice: ['desk', 'workshop', 'study-room'],
    postOfficeCounter: ['desk', 'workshop'],

    // Exam / town hall
    townHallExam: ['exam-hall', 'town-hall'],
    examResultHall: ['exam-hall'],

    // Review
    reviewGarden: ['garden', 'review'],

    // Speaking / chat
    chatCafe: ['cafe', 'plaza'],
    speakingStage: ['stage', 'cafe'],
    speakingStageCafe: ['cafe', 'plaza', 'town-square', 'stage'],

    // Vocabulary collection
    collectionBook: ['vocabulary', 'collection'],
    collectionBookTable: ['vocabulary', 'collection', 'desk'],
    phraseStamp: ['vocabulary', 'collection'],
    postcardFragment: ['vocabulary', 'collection'],

    // Grammar
    grammarScroll: ['grammar', 'workshop'],
    grammarWorkshopInterior: ['grammar', 'workshop', 'study-room'],

    // Badges / community / festivals / focus sessions
    badgeShelf: ['badge', 'shelf'],
    leaderboardGuildHall: ['guild', 'hall'],
    campaignFestivalBoard: ['festival', 'notice'],
    sessionFocusDojo: ['dojo', 'focus'],

    // Non-learner staging worlds
    teacherAcademyExterior: ['teacher'],
    adminCommandCenter: ['admin'],
}

/**
 * Deterministic fallback returned by `pickWorldProp` when no key in
 * `FUXIE_WORLD_PROP_TAGS` intersects the requested tags. Picked because
 * `villageSquare` is the canonical entry-point background for every learner
 * journey and is guaranteed to exist in `FUXIE_WORLD_PROPS`.
 */
export const DEFAULT_WORLD_PROP: FuxieWorldProp = 'villageSquare'

/**
 * Pick the first `FuxieWorldProp` whose tag set intersects the supplied tags.
 *
 * Iteration order follows the declaration order of `FUXIE_WORLD_PROP_TAGS`,
 * which makes the result deterministic for a given input. Falls back to
 * {@link DEFAULT_WORLD_PROP} (`villageSquare`) when no candidate matches.
 *
 * Typical usage from a skill player:
 *
 * ```ts
 * const propKey = pickWorldProp(['library'])
 * const src = getFuxieWorldPropSrc(propKey)
 * ```
 */
export function pickWorldProp(tags: WorldTag[]): FuxieWorldProp {
    if (tags.length === 0) {
        return DEFAULT_WORLD_PROP
    }

    const wanted = new Set<WorldTag>(tags)
    const keys = Object.keys(FUXIE_WORLD_PROP_TAGS) as FuxieWorldProp[]

    for (const key of keys) {
        const propTags = FUXIE_WORLD_PROP_TAGS[key]
        for (const tag of propTags) {
            if (wanted.has(tag)) {
                return key
            }
        }
    }

    return DEFAULT_WORLD_PROP
}
