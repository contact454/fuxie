-- Extend Fuxie mission catalog to 10 pilot-ready quest definitions.
-- No schema change: these missions reuse existing progress metrics.
INSERT INTO "mission_definitions" (
    "id", "slug", "period", "title", "description", "metric", "targetValue", "href",
    "xpReward", "fucoinReward", "sortOrder", "status", "updatedAt"
) VALUES
    (
        'mission_daily_lesson_1',
        'daily-lesson-1',
        'DAILY',
        'Clear 1 lesson quest',
        'Finish one meaningful lesson today so the daily loop rewards real learning.',
        'LESSONS_COMPLETED',
        1,
        '/course',
        20,
        12,
        40,
        'ACTIVE',
        CURRENT_TIMESTAMP
    ),
    (
        'mission_monthly_lessons_8',
        'monthly-lessons-8',
        'MONTHLY',
        'Clear 8 lesson quests',
        'Build a stable month by finishing full lesson quests, not only quick taps.',
        'LESSONS_COMPLETED',
        8,
        '/course',
        160,
        100,
        30,
        'ACTIVE',
        CURRENT_TIMESTAMP
    ),
    (
        'mission_quarterly_active_36',
        'quarterly-active-36',
        'QUARTERLY',
        '36 active learning days',
        'Keep a sustainable quarterly rhythm toward the target CEFR level.',
        'ACTIVE_DAYS',
        36,
        '/dashboard',
        260,
        160,
        30,
        'ACTIVE',
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("slug") DO UPDATE SET
    "period" = EXCLUDED."period",
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "metric" = EXCLUDED."metric",
    "targetValue" = EXCLUDED."targetValue",
    "href" = EXCLUDED."href",
    "xpReward" = EXCLUDED."xpReward",
    "fucoinReward" = EXCLUDED."fucoinReward",
    "sortOrder" = EXCLUDED."sortOrder",
    "status" = EXCLUDED."status",
    "updatedAt" = CURRENT_TIMESTAMP;
