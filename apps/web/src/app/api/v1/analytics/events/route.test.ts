import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    withDbAuthMock,
    analyticsEventCreateMock,
} = vi.hoisted(() => ({
    withDbAuthMock: vi.fn(),
    analyticsEventCreateMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withDbAuth: withDbAuthMock,
    AuthError: class AuthError extends Error {},
    NotFoundError: class NotFoundError extends Error {},
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        analyticsEvent: {
            create: analyticsEventCreateMock,
        },
    },
}))

import { AuthError } from '@/lib/auth/middleware'
import { POST } from './route'

describe('POST /api/v1/analytics/events', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        withDbAuthMock.mockResolvedValue({
            userId: 'db-user-1',
            role: 'LEARNER',
        })
        analyticsEventCreateMock.mockResolvedValue({ id: 'event-1' })
    })

    it('accepts a safe dashboard next action event', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'dashboard_next_action_clicked',
            source: 'dashboard.quest.primary',
            route: '/dashboard',
            actionId: 'fresh-start-vocabulary',
            actionType: 'vocabulary_practice',
            level: 'A1',
            skill: 'WORTSCHATZ',
            metadata: { href: '/vocabulary' },
        }))

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({ success: true })
        expect(analyticsEventCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'db-user-1',
                role: 'LEARNER',
                eventName: 'dashboard_next_action_clicked',
                source: 'dashboard.quest.primary',
                route: '/dashboard',
                actionId: 'fresh-start-vocabulary',
                actionType: 'vocabulary_practice',
                level: 'A1',
                skill: 'WORTSCHATZ',
                metadata: { href: '/vocabulary' },
            }),
        })
    })

    it('rejects events outside the allowlist', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'freeform_event',
            actionType: 'vocabulary_practice',
        }))

        expect(response.status).toBe(400)
        expect(analyticsEventCreateMock).not.toHaveBeenCalled()
    })

    it('accepts safe gamification intervention events', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'gamification_intervention_clicked',
            actionId: 'adaptive_reward_only_risk',
            actionType: 'vocabulary_practice',
            level: 'A1',
            skill: 'WORTSCHATZ',
            metadata: {
                interventionCode: 'adaptive_reward_only_risk',
                learnerPacingState: 'reward_only_risk',
                href: '/vocabulary',
            },
        }))

        expect(response.status).toBe(200)
        expect(analyticsEventCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                eventName: 'gamification_intervention_clicked',
                source: 'dashboard.quest.intervention.clicked',
                actionId: 'adaptive_reward_only_risk',
                metadata: {
                    interventionCode: 'adaptive_reward_only_risk',
                    learnerPacingState: 'reward_only_risk',
                    href: '/vocabulary',
                },
            }),
        })
    })

    it('rejects client-supplied completion events', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'meaningful_action_completed',
            actionType: 'reading_task',
        }))

        expect(response.status).toBe(400)
        expect(analyticsEventCreateMock).not.toHaveBeenCalled()
    })

    it('accepts safe vocabulary quest episode events', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'quest_episode_completed',
            actionId: 'vocab-episode:A1:essen',
            actionType: 'vocabulary_practice',
            level: 'A1',
            skill: 'WORTSCHATZ',
            metadata: {
                episodeId: 'vocab-episode:A1:essen',
                themeSlug: 'essen',
                cefrLevel: 'A1',
                checkpointId: 'lock_in',
                questionCount: 10,
                accuracyBand: 'clear',
            },
        }))

        expect(response.status).toBe(200)
        expect(analyticsEventCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                eventName: 'quest_episode_completed',
                source: 'vocabulary.quest_episode.completed',
                actionId: 'vocab-episode:A1:essen',
                metadata: {
                    episodeId: 'vocab-episode:A1:essen',
                    themeSlug: 'essen',
                    cefrLevel: 'A1',
                    checkpointId: 'lock_in',
                    questionCount: 10,
                    accuracyBand: 'clear',
                },
            }),
        })
    })

    it('accepts safe listening quest episode events', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'quest_episode_checkpoint_reached',
            source: 'listening.quest_episode.checkpoint',
            actionId: 'listening-episode:A1:L-A1-GOETHE-001-T1',
            actionType: 'listening_task',
            level: 'A1',
            skill: 'listening',
            metadata: {
                episodeId: 'listening-episode:A1:L-A1-GOETHE-001-T1',
                skill: 'listening',
                lessonId: 'L-A1-GOETHE-001-T1',
                cefrLevel: 'A1',
                checkpointId: 'gist',
                questionCount: 4,
            },
        }))

        expect(response.status).toBe(200)
        expect(analyticsEventCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                eventName: 'quest_episode_checkpoint_reached',
                source: 'listening.quest_episode.checkpoint',
                actionId: 'listening-episode:A1:L-A1-GOETHE-001-T1',
                actionType: 'listening_task',
                skill: 'listening',
                metadata: {
                    episodeId: 'listening-episode:A1:L-A1-GOETHE-001-T1',
                    skill: 'listening',
                    lessonId: 'L-A1-GOETHE-001-T1',
                    cefrLevel: 'A1',
                    checkpointId: 'gist',
                    questionCount: 4,
                },
            }),
        })
    })

    it('accepts safe reading quest episode events', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'quest_episode_checkpoint_reached',
            source: 'reading.quest_episode.checkpoint',
            actionId: 'reading-episode:A1:A1-T1-001',
            actionType: 'reading_task',
            level: 'A1',
            skill: 'reading',
            metadata: {
                episodeId: 'reading-episode:A1:A1-T1-001',
                skill: 'reading',
                exerciseId: 'A1-T1-001',
                cefrLevel: 'A1',
                checkpointId: 'understand',
                questionCount: 5,
            },
        }))

        expect(response.status).toBe(200)
        expect(analyticsEventCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                eventName: 'quest_episode_checkpoint_reached',
                source: 'reading.quest_episode.checkpoint',
                actionId: 'reading-episode:A1:A1-T1-001',
                actionType: 'reading_task',
                skill: 'reading',
                metadata: {
                    episodeId: 'reading-episode:A1:A1-T1-001',
                    skill: 'reading',
                    exerciseId: 'A1-T1-001',
                    cefrLevel: 'A1',
                    checkpointId: 'understand',
                    questionCount: 5,
                },
            }),
        })
    })

    it('accepts safe grammar quest episode events', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'quest_episode_checkpoint_reached',
            source: 'grammar.quest_episode.checkpoint',
            actionId: 'grammar-episode:A1:a1-word-order-1',
            actionType: 'lesson_session',
            level: 'A1',
            skill: 'grammar',
            metadata: {
                episodeId: 'grammar-episode:A1:a1-word-order-1',
                skill: 'grammar',
                lessonId: 'a1-word-order-1',
                cefrLevel: 'A1',
                checkpointId: 'apply',
                questionCount: 4,
            },
        }))

        expect(response.status).toBe(200)
        expect(analyticsEventCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                eventName: 'quest_episode_checkpoint_reached',
                source: 'grammar.quest_episode.checkpoint',
                actionId: 'grammar-episode:A1:a1-word-order-1',
                actionType: 'lesson_session',
                skill: 'grammar',
                metadata: {
                    episodeId: 'grammar-episode:A1:a1-word-order-1',
                    skill: 'grammar',
                    lessonId: 'a1-word-order-1',
                    cefrLevel: 'A1',
                    checkpointId: 'apply',
                    questionCount: 4,
                },
            }),
        })
    })

    it('accepts safe writing quest episode events without submitted text metadata', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'quest_episode_checkpoint_reached',
            source: 'writing.quest_episode.checkpoint',
            actionId: 'writing-episode:A1:W-A1-EMAIL-001',
            actionType: 'writing_submission',
            level: 'A1',
            skill: 'writing',
            metadata: {
                episodeId: 'writing-episode:A1:W-A1-EMAIL-001',
                skill: 'writing',
                exerciseId: 'W-A1-EMAIL-001',
                cefrLevel: 'A1',
                checkpointId: 'draft',
                checkpointCount: 3,
            },
        }))

        expect(response.status).toBe(200)
        expect(analyticsEventCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                eventName: 'quest_episode_checkpoint_reached',
                source: 'writing.quest_episode.checkpoint',
                actionId: 'writing-episode:A1:W-A1-EMAIL-001',
                actionType: 'writing_submission',
                skill: 'writing',
                metadata: {
                    episodeId: 'writing-episode:A1:W-A1-EMAIL-001',
                    skill: 'writing',
                    exerciseId: 'W-A1-EMAIL-001',
                    cefrLevel: 'A1',
                    checkpointId: 'draft',
                    checkpointCount: 3,
                },
            }),
        })
    })

    it('accepts safe speaking quest episode events without audio or transcript metadata', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'quest_episode_checkpoint_reached',
            source: 'speaking.quest_episode.checkpoint',
            actionId: 'speaking-episode:A1:S-A1-001',
            actionType: 'speaking_submission',
            level: 'A1',
            skill: 'speaking',
            metadata: {
                episodeId: 'speaking-episode:A1:S-A1-001',
                skill: 'speaking',
                lessonId: 'S-A1-001',
                topicSlug: 'a1-begruessung',
                cefrLevel: 'A1',
                checkpointId: 'record',
                checkpointCount: 3,
                sentenceCount: 6,
                exerciseType: 'nachsprechen',
            },
        }))

        expect(response.status).toBe(200)
        expect(analyticsEventCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                eventName: 'quest_episode_checkpoint_reached',
                source: 'speaking.quest_episode.checkpoint',
                actionId: 'speaking-episode:A1:S-A1-001',
                actionType: 'speaking_submission',
                skill: 'speaking',
                metadata: {
                    episodeId: 'speaking-episode:A1:S-A1-001',
                    skill: 'speaking',
                    lessonId: 'S-A1-001',
                    topicSlug: 'a1-begruessung',
                    cefrLevel: 'A1',
                    checkpointId: 'record',
                    checkpointCount: 3,
                    sentenceCount: 6,
                    exerciseType: 'nachsprechen',
                },
            }),
        })
    })

    it('accepts safe roleplay practice-note evidence without marking completion', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'quest_episode_practice_note',
            source: 'speaking.roleplay.practice_note',
            actionId: 'roleplay:self-intro:A1',
            actionType: 'speaking_submission',
            level: 'A1',
            skill: 'speaking',
            metadata: {
                episodeId: 'roleplay:self-intro:A1',
                skill: 'speaking',
                scenarioId: 'self-intro',
                cefrLevel: 'A1',
                receiptState: 'practice_note',
                scoredResponses: 0,
                nextAction: 'retry-roleplay',
            },
        }))

        expect(response.status).toBe(200)
        expect(analyticsEventCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                eventName: 'quest_episode_practice_note',
                source: 'speaking.roleplay.practice_note',
                actionId: 'roleplay:self-intro:A1',
                actionType: 'speaking_submission',
                skill: 'speaking',
                metadata: expect.objectContaining({
                    receiptState: 'practice_note',
                    scoredResponses: 0,
                    nextAction: 'retry-roleplay',
                }),
            }),
        })
    })

    it('does not allow raw answers in quest episode metadata', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'quest_episode_checkpoint_reached',
            actionType: 'vocabulary_practice',
            metadata: {
                checkpointId: 'recall',
                answerText: 'raw answer',
            },
        }))

        expect(response.status).toBe(400)
        expect(analyticsEventCreateMock).not.toHaveBeenCalled()
    })

    it('does not allow audio or transcript metadata in speaking quest events', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'quest_episode_checkpoint_reached',
            actionType: 'speaking_submission',
            metadata: {
                checkpointId: 'record',
                audioBlob: 'base64-audio',
                transcript: 'raw learner speech',
            },
        }))

        expect(response.status).toBe(400)
        expect(analyticsEventCreateMock).not.toHaveBeenCalled()
    })

    it('rejects raw-text-like metadata keys', async () => {
        const response = await POST(analyticsRequest({
            eventName: 'dashboard_next_action_clicked',
            actionType: 'vocabulary_practice',
            metadata: { answerText: 'raw learner answer' },
        }))

        expect(response.status).toBe(400)
        await expect(response.json()).resolves.toMatchObject({
            success: false,
            error: { code: 'UNSAFE_METADATA' },
        })
        expect(analyticsEventCreateMock).not.toHaveBeenCalled()
    })

    it('rejects unauthenticated requests', async () => {
        withDbAuthMock.mockRejectedValueOnce(new AuthError('No valid authentication token found'))

        const response = await POST(analyticsRequest({
            eventName: 'dashboard_next_action_clicked',
            actionType: 'vocabulary_practice',
        }))

        expect(response.status).toBe(401)
        expect(analyticsEventCreateMock).not.toHaveBeenCalled()
    })
})

function analyticsRequest(body: unknown) {
    return new NextRequest('http://localhost/api/v1/analytics/events', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
    })
}
