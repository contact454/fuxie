import { describe, expect, it } from 'vitest'

import { buildLearningQuestRewardPayload } from './learning-quest-rewards'

describe('buildLearningQuestRewardPayload', () => {
    it('builds a quest reward receipt with Fucoin and streak state', () => {
        const payload = buildLearningQuestRewardPayload({
            skill: 'reading',
            xpEarned: 10,
            fucoin: {
                fucoinEarned: 3,
                walletBalance: 18,
                duplicate: false,
                intendedAmount: 3,
                dailyCap: 60,
                dailyEarnedBefore: 5,
                dailyRemainingAfter: 52,
                capReached: false,
            },
            streak: {
                currentStreak: 4,
                isNewDay: true,
                freezeUsed: false,
                freezesAvailable: 1,
                freezesUsed: 0,
                freezeUsageId: null,
            },
        })

        expect(payload).toMatchObject({
            fucoinEarned: 3,
            walletBalance: 18,
            fucoinDailyEarned: 8,
            fucoinDailyRemaining: 52,
            nextQuestHref: '/reading',
            streakReceipt: {
                freezeUsed: false,
                currentStreak: 4,
                freezesAvailable: 1,
                freezesUsed: 0,
            },
        })
        expect(payload.rewardPreview.map((reward) => reward.type)).toEqual(['xp', 'fucoin', 'streak'])
    })

    it('keeps duplicate and daily-cap receipts understandable', () => {
        const payload = buildLearningQuestRewardPayload({
            skill: 'grammar',
            xpEarned: 15,
            fucoin: {
                fucoinEarned: 0,
                walletBalance: 60,
                duplicate: true,
                intendedAmount: 5,
                dailyCap: 60,
                dailyEarnedBefore: 60,
                dailyRemainingAfter: 0,
                capReached: true,
            },
        })

        expect(payload.fucoinDuplicate).toBe(true)
        expect(payload.fucoinCapReached).toBe(true)
        expect(payload.rewardPreview).toEqual([
            expect.objectContaining({ type: 'xp', label: '+15 XP' }),
            expect.objectContaining({
                type: 'fucoin',
                label: '+0 Fucoin',
                detail: 'Reward already recorded',
            }),
        ])
    })

    it('uses pending copy for ungraded quest results', () => {
        const payload = buildLearningQuestRewardPayload({
            skill: 'speaking',
            xpEarned: 0,
            graded: false,
        })

        expect(payload.nextQuestHref).toBe('/speaking')
        expect(payload.rewardPreview).toEqual([
            expect.objectContaining({ type: 'xp', label: 'XP pending' }),
            expect.objectContaining({ type: 'fucoin', label: 'Fucoin pending' }),
        ])
    })

    it('adds mastery and badge receipt previews when a quest contributes to progression', () => {
        const payload = buildLearningQuestRewardPayload({
            skill: 'vocabulary',
            xpEarned: 12,
            skillMasteryProgress: {
                skill: 'vocabulary',
                label: 'Từ vựng',
                cefrLevel: 'A1',
                completions: 2,
                activeDays: 1,
                qualityScore: 88,
                progress: 20,
                nextMilestone: '8 quest nữa tới mốc mastery kế tiếp.',
                masteryReason: 'Từ vựng A1: 2/10 lượt học có ý nghĩa.',
            },
            badgeReceipt: {
                id: 'vocabulary-starter',
                title: 'Từ vựng Starter',
                description: 'Hoàn thành 2 quest từ vựng đầu tiên.',
                category: 'skill',
                skill: 'vocabulary',
                cefrLevel: 'A1',
                progress: 100,
                requirement: '2 vocabulary completions',
                unlocked: true,
            },
            masteryReason: 'Từ vựng đang dẫn mastery nhờ 2 lượt học có ý nghĩa.',
        })

        expect(payload.skillMasteryProgress?.skill).toBe('vocabulary')
        expect(payload.badgeReceipt?.id).toBe('vocabulary-starter')
        expect(payload.rewardPreview.map((reward) => reward.type)).toEqual(['xp', 'unlock', 'badge'])
    })
})
