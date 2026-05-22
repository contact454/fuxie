import { prisma } from '@fuxie/database'

const now = new Date()

async function main() {
    const userNew = await upsertUser('dev-learner-new', 'learner-new@fuxie.local', 'Dev Learner New')
    const userSpeed = await upsertUser('dev-learner-speed', 'learner-speed@fuxie.local', 'Dev Learner Speed')
    const userBoss = await upsertUser('dev-learner-boss', 'learner-boss@fuxie.local', 'Dev Learner Boss')
    const userRoleplay = await upsertUser('dev-learner-roleplay', 'learner-roleplay@fuxie.local', 'Dev Learner Roleplay')

    // Seed events for userSpeed (Completed Speed)
    await seedAnalyticsEvent(userSpeed.id, 'meaningful_action_completed', 'vocabulary_practice', 'vocabulary', {
        themeSlug: 'a1-person',
        exerciseType: 'speed',
    })

    // Seed events for userBoss (Completed Boss)
    await seedAnalyticsEvent(userBoss.id, 'meaningful_action_completed', 'vocabulary_practice', 'vocabulary', {
        themeSlug: 'a1-person',
        exerciseType: 'speed',
    })
    await seedAnalyticsEvent(userBoss.id, 'meaningful_action_completed', 'vocabulary_practice', 'vocabulary', {
        themeSlug: 'a1-person',
        exerciseType: 'cloze',
    })
    await seedAnalyticsEvent(userBoss.id, 'meaningful_action_completed', 'vocabulary_practice', 'vocabulary', {
        themeSlug: 'a1-person',
        exerciseType: 'mixed',
    })

    // Seed events for userRoleplay (Into roleplay)
    await seedAnalyticsEvent(userRoleplay.id, 'meaningful_action_completed', 'vocabulary_practice', 'vocabulary', {
        themeSlug: 'a1-person',
        exerciseType: 'speed',
    })
    await seedAnalyticsEvent(userRoleplay.id, 'meaningful_action_completed', 'vocabulary_practice', 'vocabulary', {
        themeSlug: 'a1-person',
        exerciseType: 'cloze',
    })
    await seedAnalyticsEvent(userRoleplay.id, 'meaningful_action_completed', 'vocabulary_practice', 'vocabulary', {
        themeSlug: 'a1-person',
        exerciseType: 'mixed',
    })
    await seedAnalyticsEvent(userRoleplay.id, 'quest_episode_completed', 'speaking_submission', 'speaking', {
        scenarioId: 'self-intro',
    })

    console.log('[seed-first-contact] Seeded 4 local dev learners for First Contact QA.')
    console.log('[seed-first-contact] Login using these emails:')
    console.log(' - learner-new@fuxie.local')
    console.log(' - learner-speed@fuxie.local')
    console.log(' - learner-boss@fuxie.local')
    console.log(' - learner-roleplay@fuxie.local')
}

async function upsertUser(firebaseUid: string, email: string, displayName: string) {
    const user = await prisma.user.upsert({
        where: { firebaseUid },
        update: { email, role: 'LEARNER', emailVerified: true, deletedAt: null },
        create: { firebaseUid, email, role: 'LEARNER', emailVerified: true },
    })

    await Promise.all([
        prisma.userProfile.upsert({
            where: { userId: user.id },
            update: {
                displayName,
                currentLevel: 'A1',
                targetLevel: 'B1',
                totalXp: 100,
                onboardingCompleted: true,
            },
            create: {
                userId: user.id,
                displayName,
                uiLanguage: 'vi',
                currentLevel: 'A1',
                targetLevel: 'B1',
                totalXp: 100,
                onboardingCompleted: true,
            },
        }),
        prisma.userSettings.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
        }),
        prisma.userStreak.upsert({
            where: { userId: user.id },
            update: {
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: now,
            },
            create: {
                userId: user.id,
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: now,
            },
        }),
        prisma.learningPath.upsert({
            where: { userId: user.id },
            update: {
                currentCefrLevel: 'A1',
                targetCefrLevel: 'B1',
                weakSkills: [],
                strongSkills: [],
            },
            create: {
                userId: user.id,
                currentCefrLevel: 'A1',
                targetCefrLevel: 'B1',
                weakSkills: [],
                strongSkills: [],
            },
        }),
    ])

    return user
}

async function seedAnalyticsEvent(userId: string, eventName: string, actionType: string, skill: string, metadata: any) {
    await prisma.analyticsEvent.create({
        data: {
            userId,
            role: 'LEARNER',
            eventName,
            source: 'seed',
            actionId: 'seed',
            actionType,
            skill,
            level: 'A1',
            metadata,
            createdAt: now,
        }
    })
}

main()
    .catch((error) => {
        console.error('[seed-first-contact] Failed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
