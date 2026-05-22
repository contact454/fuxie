import { readFileSync } from 'node:fs'
import path from 'node:path'

import { prisma } from '@fuxie/database'

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

const ROOT = process.cwd()

/**
 * Surface-table aliases — Capture spec & integration `surfaces.ts` reference
 * surface-table IDs (`A1-T1-001`, `L-A1-GOETHE-001-T1`, `W-A1-T1-001`,
 * `dev-a1-goethe-mini`). To keep existing dev workflows that point at the
 * legacy `*-DEV-*` IDs working AND let the visual-capture spec hit the
 * surface-table IDs without 404s, the seed script reads each fixture once
 * and upserts the row under both IDs (legacy + surface-table).
 *
 * Idempotency contract: every upsert below uses the table's natural unique
 * key (`exerciseId`, `lessonId`, `slug`, `id`, or compound `[*Id, questionNumber]`),
 * so a second run on the same DB yields zero new rows. Children that the
 * Prisma schema marks `onDelete: Cascade` (questions) are also upserted by
 * compound key, never `deleteMany`-then-create — so child row counts are
 * also stable across reruns.
 *
 * Source of truth:
 *   - `content/a1/reading/A1-T1-001.json` (Goethe-grade A1 reading content).
 *   - `content/a1/listening/L-A1-GOETHE-001-T1.json` (Goethe-grade A1 listening).
 *   - `content/a1/writing/W-A1-T1-001.json` (Goethe-grade A1 writing).
 *
 * Speaking surface (`dev-a1-begruessung-01`) and exam surface
 * (`dev-a1-goethe-mini`) already use surface-table IDs in `seedSpeaking()` /
 * `seedExam()` below — no alias indirection needed; they are verified-only.
 *
 * Spec ref: `.kiro/specs/visual-qa-screenshot-capture/design.md` §Decision 3.
 * Pattern ref: `.kiro/specs/asset-registry-cleanup` (additive alias upserts
 * to align legacy IDs with surface-table IDs declared in
 * `tests/integration/utils/surfaces.ts`).
 */

interface ReadingFixture {
    id: string
    level: string
    teil: number
    teil_name: string
    topic: string
    texts: Array<{ id: string; type: string; sender?: string; receiver?: string; content: string }>
    images?: unknown
    scoring?: unknown
    metadata?: unknown
    questions: Array<{
        id: string
        teil: number
        linked_text?: string
        type: string
        statement?: string
        question?: string
        options?: unknown
        answer?: string | number | boolean
        points?: number
        explanation?: unknown
    }>
}

interface ListeningFixture {
    id: string
    level: string
    teil: number
    teil_name: string
    topic: string
    task_type: string
    audio_file: string
    metadata?: { generated_at?: string; version?: number }
    questions: Array<{
        id: string
        type: string
        question: string
        options: Record<string, string>
        answer: string
        points?: number
        explanation?: unknown
    }>
    transcript?: unknown
}

interface WritingFixture {
    id: string
    cefrLevel: string
    teil: number
    teilName: string
    textType: string
    register: string
    topic: string
    instruction: string
    instructionVi?: string
    situation: string
    contentPoints: string[]
    minWords: number
    maxWords?: number
    timeMinutes?: number
    rubric?: unknown
    formFields?: unknown
    modelAnswer?: string
}

function loadFixture<T>(relativePath: string): T {
    const absolute = path.join(ROOT, relativePath)
    return JSON.parse(readFileSync(absolute, 'utf8')) as T
}

async function main() {
    const learner = await upsertUser('dev-learner', 'learner@fuxie.local', 'LEARNER', 'Dev Learner')
    const teacher = await upsertUser('dev-teacher', 'teacher@fuxie.local', 'TEACHER', 'Dev Teacher')
    await upsertUser('dev-admin', 'admin@fuxie.local', 'ADMIN', 'Dev Admin')

    const theme = await prisma.vocabularyTheme.upsert({
        where: { slug: 'dev-alltag' },
        update: {
            name: 'Dev Alltag',
            translations: { vi: 'Sinh hoat hang ngay', en: 'Daily life', de: 'Alltag' },
            cefrLevel: 'A1',
            sortOrder: 1,
        },
        create: {
            slug: 'dev-alltag',
            name: 'Dev Alltag',
            translations: { vi: 'Sinh hoat hang ngay', en: 'Daily life', de: 'Alltag' },
            cefrLevel: 'A1',
            sortOrder: 1,
        },
    })

    const words = await Promise.all([
        upsertWord(theme.id, 'Haus', 'NEUTRUM', 'NOMEN', { vi: 'ngoi nha', en: 'house', de: 'Gebaeude zum Wohnen' }),
        upsertWord(theme.id, 'Buch', 'NEUTRUM', 'NOMEN', { vi: 'quyen sach', en: 'book', de: 'gedrucktes Lesewerk' }),
        upsertWord(theme.id, 'lernen', null, 'VERB', { vi: 'hoc', en: 'learn', de: 'Wissen erwerben' }),
        upsertWord(theme.id, 'fragen', null, 'VERB', { vi: 'hoi', en: 'ask', de: 'eine Frage stellen' }),
        upsertWord(theme.id, 'schnell', null, 'ADJEKTIV', { vi: 'nhanh', en: 'fast', de: 'mit hoher Geschwindigkeit' }),
    ])

    await prisma.srsCard.upsert({
        where: { userId_vocabularyItemId: { userId: learner.id, vocabularyItemId: words[0].id } },
        update: {
            nextReviewAt: new Date(now.getTime() - 60_000),
            totalReviews: 2,
            totalCorrect: 1,
        },
        create: {
            userId: learner.id,
            vocabularyItemId: words[0].id,
            nextReviewAt: new Date(now.getTime() - 60_000),
            totalReviews: 2,
            totalCorrect: 1,
        },
    })

    await seedGrammar()
    await seedListening()
    await seedReading()
    await seedWriting()
    await seedSpeaking()
    await seedExam()
    await seedClassroom(teacher.id, learner.id)
    await seedLearnerSignals(learner.id)

    console.log('[seed-dev] Seeded local dev users and minimal learning content.')
    console.log('[seed-dev] Use /api/dev-auth/login?role=learner|teacher|admin&redirect=/dashboard')
}

async function upsertUser(firebaseUid: string, email: string, role: 'LEARNER' | 'TEACHER' | 'ADMIN', displayName: string) {
    const isLearner = role === 'LEARNER'
    const user = await prisma.user.upsert({
        where: { firebaseUid },
        update: { email, role, emailVerified: true, deletedAt: null },
        create: { firebaseUid, email, role, emailVerified: true },
    })

    await Promise.all([
        prisma.userProfile.upsert({
            where: { userId: user.id },
            update: {
                displayName,
                currentLevel: 'A1',
                targetLevel: 'B1',
                totalXp: isLearner ? 320 : 0,
                totalWordsLearned: isLearner ? 12 : 0,
                totalLessonsCompleted: isLearner ? 4 : 0,
                totalStudyMinutes: isLearner ? 95 : 0,
                onboardingCompleted: true,
            },
            create: {
                userId: user.id,
                displayName,
                uiLanguage: 'vi',
                currentLevel: 'A1',
                targetLevel: 'B1',
                totalXp: isLearner ? 320 : 0,
                totalWordsLearned: isLearner ? 12 : 0,
                totalLessonsCompleted: isLearner ? 4 : 0,
                totalStudyMinutes: isLearner ? 95 : 0,
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
                currentStreak: isLearner ? 3 : 0,
                longestStreak: isLearner ? 5 : 0,
                lastActivityDate: today,
            },
            create: {
                userId: user.id,
                currentStreak: isLearner ? 3 : 0,
                longestStreak: isLearner ? 5 : 0,
                lastActivityDate: today,
            },
        }),
        prisma.learningPath.upsert({
            where: { userId: user.id },
            update: {
                currentCefrLevel: 'A1',
                targetCefrLevel: 'B1',
                weakSkills: isLearner ? ['HOEREN', 'WORTSCHATZ'] : [],
                strongSkills: isLearner ? ['LESEN'] : [],
            },
            create: {
                userId: user.id,
                currentCefrLevel: 'A1',
                targetCefrLevel: 'B1',
                weakSkills: isLearner ? ['HOEREN', 'WORTSCHATZ'] : [],
                strongSkills: isLearner ? ['LESEN'] : [],
            },
        }),
    ])

    return user
}

async function upsertWord(
    themeId: string,
    word: string,
    article: 'MASKULIN' | 'FEMININ' | 'NEUTRUM' | null,
    wordType: 'NOMEN' | 'VERB' | 'ADJEKTIV',
    translations: Record<string, string>,
) {
    return prisma.vocabularyItem.upsert({
        where: { word_cefrLevel: { word, cefrLevel: 'A1' } },
        update: {
            themeId,
            article,
            wordType,
            translations,
            status: 'PUBLISHED',
            exampleSentence1: `Ich benutze ${word} im Alltag.`,
            exampleTranslation1: `Toi dung ${word} trong doi song hang ngay.`,
        },
        create: {
            themeId,
            word,
            wordLower: word.toLowerCase(),
            article,
            wordType,
            cefrLevel: 'A1',
            translations,
            status: 'PUBLISHED',
            exampleSentence1: `Ich benutze ${word} im Alltag.`,
            exampleTranslation1: `Toi dung ${word} trong doi song hang ngay.`,
        },
    })
}

async function seedGrammar() {
    const exercisesJson = [
        {
            id: 'g1',
            type: 'multiple_choice',
            scaffolding_level: 1,
            difficulty: 1,
            instruction_vi: 'Chon cau dung o thi hien tai.',
            stem: 'Cau nao dung voi "ich"?',
            options: ['Ich lerne Deutsch.', 'Ich lernst Deutsch.', 'Ich lernt Deutsch.'],
            correct: 0,
            explanation_vi: 'Voi "ich", dong tu "lernen" chia thanh "lerne".',
            tags: ['praesens', 'konjugation'],
        },
        {
            id: 'g2',
            type: 'gap_fill_type',
            scaffolding_level: 1,
            difficulty: 1,
            instruction_vi: 'Dien dong tu dung.',
            stem: 'Ich ___ Deutsch.',
            answer: ['lerne'],
            hint_word: 'lernen',
            explanation_vi: 'ich + lernen -> ich lerne.',
            tags: ['praesens', 'konjugation'],
        },
        {
            id: 'g3',
            type: 'sentence_reorder',
            scaffolding_level: 1,
            difficulty: 1,
            instruction_vi: 'Sap xep thanh cau dung.',
            words: ['Deutsch.', 'lerne', 'Ich'],
            correct_order: ['Ich', 'lerne', 'Deutsch.'],
            explanation_vi: 'Trong cau tran thuat, dong tu chia dung o vi tri 2.',
            tags: ['satzbau'],
        },
    ]

    const topic = await prisma.grammarTopic.upsert({
        where: { slug: 'dev-praesens' },
        update: { title: 'Praesens', titleDe: 'Praesens', cefrLevel: 'A1', status: 'PUBLISHED', sortOrder: 1 },
        create: { slug: 'dev-praesens', title: 'Praesens', titleDe: 'Praesens', cefrLevel: 'A1', status: 'PUBLISHED', sortOrder: 1 },
    })

    await prisma.grammarLesson.upsert({
        where: { id: 'dev-a1-praesens-01' },
        update: {
            topicId: topic.id,
            titleDe: 'Verben im Praesens',
            exercisesJson,
            status: 'PUBLISHED',
        },
        create: {
            id: 'dev-a1-praesens-01',
            topicId: topic.id,
            level: 'A1',
            lessonType: 'E',
            lessonNumber: 1,
            titleDe: 'Verben im Praesens',
            exercisesJson,
            estimatedMin: 8,
            tags: ['dev', 'praesens'],
            sortOrder: 1,
            status: 'PUBLISHED',
        },
    })
}

async function seedListening() {
    // Load Goethe-grade A1 listening fixture once; upsert under legacy +
    // surface-table IDs so /listening/L-A1-GOETHE-001-T1 resolves.
    const fixture = loadFixture<ListeningFixture>('content/a1/listening/L-A1-GOETHE-001-T1.json')

    const firstQuestion = fixture.questions[0]
    if (!firstQuestion) {
        throw new Error('[seed-dev] Listening fixture L-A1-GOETHE-001-T1 has no questions.')
    }
    // Fixture options come as { a, b, c } map; flatten into ordered array
    // matching Prisma's `options Json` (string[]).
    const optionsArray = Object.entries(firstQuestion.options).map(
        ([key, label]) => `${key}) ${label}`,
    )
    const questionData = {
        questionNumber: 1,
        questionType: firstQuestion.type ?? 'mc_abc',
        questionText: firstQuestion.question,
        options: optionsArray as never,
        correctAnswer: firstQuestion.answer,
        explanation: typeof (firstQuestion.explanation as { de?: string } | undefined)?.de === 'string'
            ? (firstQuestion.explanation as { de: string }).de
            : null,
        sortOrder: 1,
    }

    for (const lessonId of ['L-A1-DEV-001', fixture.id] as const) {
        const lesson = await prisma.listeningLesson.upsert({
            where: { lessonId },
            update: {
                cefrLevel: 'A1',
                title: `Hoeren: ${fixture.topic}`,
                topic: fixture.topic,
                taskType: fixture.task_type === 'mc_abc' ? 'MC a/b/c' : fixture.task_type,
                audioUrl: fixture.audio_file,
                sortOrder: 1,
            },
            create: {
                lessonId,
                cefrLevel: 'A1',
                board: 'GOETHE',
                teil: fixture.teil,
                teilName: fixture.teil_name,
                title: `Hoeren: ${fixture.topic}`,
                topic: fixture.topic,
                taskType: fixture.task_type === 'mc_abc' ? 'MC a/b/c' : fixture.task_type,
                audioUrl: fixture.audio_file,
                sortOrder: 1,
            },
        })

        await prisma.listeningQuestion.upsert({
            where: {
                lessonId_questionNumber: {
                    lessonId: lesson.id,
                    questionNumber: questionData.questionNumber,
                },
            },
            update: questionData,
            create: { lessonId: lesson.id, ...questionData },
        })
    }
}

async function seedReading() {
    // Load Goethe-grade A1 fixture once; upsert under legacy + surface-table IDs.
    const fixture = loadFixture<ReadingFixture>('content/a1/reading/A1-T1-001.json')

    // Map fixture questions to ReadingQuestion shape (use first question only —
    // dev seed needs ≥1 question per exercise; keeping it minimal preserves
    // existing seed footprint).
    const firstQuestion = fixture.questions[0]
    if (!firstQuestion) {
        throw new Error('[seed-dev] Reading fixture A1-T1-001 has no questions.')
    }
    const questionData = {
        questionNumber: 1,
        questionType: firstQuestion.type ?? 'richtig_falsch',
        linkedText: firstQuestion.linked_text ?? 'TextA',
        statement: firstQuestion.statement ?? firstQuestion.question ?? '',
        correctAnswer: String(firstQuestion.answer ?? 'richtig'),
        points: firstQuestion.points ?? 1,
        explanation: (firstQuestion.explanation ?? null) as never,
        sortOrder: 1,
    }

    for (const exerciseId of ['R-A1-DEV-001', fixture.id] as const) {
        const exercise = await prisma.readingExercise.upsert({
            where: { exerciseId },
            update: {
                cefrLevel: 'A1',
                teil: fixture.teil,
                teilName: fixture.teil_name,
                topic: fixture.topic,
                textsJson: fixture.texts as never,
                imagesJson: (fixture.images ?? null) as never,
                scoringJson: (fixture.scoring ?? null) as never,
                metadataJson: (fixture.metadata ?? null) as never,
                sortOrder: 1,
            },
            create: {
                exerciseId,
                cefrLevel: 'A1',
                teil: fixture.teil,
                teilName: fixture.teil_name,
                topic: fixture.topic,
                textsJson: fixture.texts as never,
                imagesJson: (fixture.images ?? null) as never,
                scoringJson: (fixture.scoring ?? null) as never,
                metadataJson: (fixture.metadata ?? null) as never,
                sortOrder: 1,
            },
        })

        // Compound natural key: idempotent across reruns.
        await prisma.readingQuestion.upsert({
            where: {
                exerciseId_questionNumber: {
                    exerciseId: exercise.id,
                    questionNumber: questionData.questionNumber,
                },
            },
            update: questionData,
            create: { exerciseId: exercise.id, ...questionData },
        })
    }
}

async function seedWriting() {
    // Load A1 writing fixture once; upsert under legacy + surface-table IDs.
    const fixture = loadFixture<WritingFixture>('content/a1/writing/W-A1-T1-001.json')

    for (const exerciseId of ['W-A1-DEV-001', fixture.id] as const) {
        await prisma.writingExercise.upsert({
            where: { exerciseId },
            update: {
                cefrLevel: 'A1',
                topic: fixture.topic,
                instruction: fixture.instruction,
                situation: fixture.situation,
                contentPoints: fixture.contentPoints as never,
                minWords: fixture.minWords,
                maxWords: fixture.maxWords ?? null,
                timeMinutes: fixture.timeMinutes ?? 10,
                rubricJson: (fixture.rubric ?? { criteria: ['Inhalt', 'Korrektheit'] }) as never,
                status: 'PUBLISHED',
            },
            create: {
                exerciseId,
                cefrLevel: 'A1',
                teil: fixture.teil,
                teilName: fixture.teilName,
                textType: fixture.textType,
                register: fixture.register,
                topic: fixture.topic,
                instruction: fixture.instruction,
                situation: fixture.situation,
                contentPoints: fixture.contentPoints as never,
                minWords: fixture.minWords,
                maxWords: fixture.maxWords ?? null,
                timeMinutes: fixture.timeMinutes ?? 10,
                rubricJson: (fixture.rubric ?? { criteria: ['Inhalt', 'Korrektheit'] }) as never,
                formFields: (fixture.formFields ?? null) as never,
                status: 'PUBLISHED',
                sortOrder: 1,
            },
        })
    }
}

async function seedSpeaking() {
    const topic = await prisma.speakingTopic.upsert({
        where: { slug: 'dev-begruessung' },
        update: { titleDe: 'Begruessung', cefrLevel: 'A1', status: 'PUBLISHED', sortOrder: 1 },
        create: { slug: 'dev-begruessung', titleDe: 'Begruessung', cefrLevel: 'A1', status: 'PUBLISHED', sortOrder: 1 },
    })

    await prisma.speakingLesson.upsert({
        where: { id: 'dev-a1-begruessung-01' },
        update: {
            topicId: topic.id,
            titleDe: 'Hallo sagen',
            exercisesJson: {
                sentences: [
                    {
                        id: 's1',
                        textDe: 'Hallo, ich heisse Anna.',
                        textNative: 'Xin chao, toi ten la Anna.',
                        ipa: 'ha-lo, ikh hai-se Anna',
                        audioUrl: '/audio/dev/speaking-hallo-anna.mp3',
                        expectedDurationSec: 4,
                        pronunciationNotes: 'Tap trung vao am ich trong heisse.',
                        keywords: ['Hallo', 'heisse'],
                    },
                    {
                        id: 's2',
                        textDe: 'Ich komme aus Vietnam.',
                        textNative: 'Toi den tu Viet Nam.',
                        ipa: 'ikh ko-me aus Viet-nam',
                        audioUrl: '/audio/dev/speaking-vietnam.mp3',
                        expectedDurationSec: 4,
                        pronunciationNotes: 'Noi ro am ch trong ich.',
                        keywords: ['komme', 'Vietnam'],
                    },
                    {
                        id: 's3',
                        textDe: 'Ich lerne Deutsch.',
                        textNative: 'Toi hoc tieng Duc.',
                        ipa: 'ikh ler-ne doytsh',
                        audioUrl: '/audio/dev/speaking-lerne-deutsch.mp3',
                        expectedDurationSec: 3,
                        pronunciationNotes: 'Giu nguyen am ngan trong lerne.',
                        keywords: ['lerne', 'Deutsch'],
                    },
                ],
            },
            configJson: {
                maxRecordingSec: 10,
                minAccuracyToPass: 60,
                attemptsAllowed: 3,
                showIPA: true,
                showTranslation: true,
                autoPlayModel: true,
            },
            status: 'PUBLISHED',
        },
        create: {
            id: 'dev-a1-begruessung-01',
            topicId: topic.id,
            level: 'A1',
            lessonType: 'E',
            lessonNumber: 1,
            titleDe: 'Hallo sagen',
            exerciseType: 'nachsprechen',
            exercisesJson: {
                sentences: [
                    {
                        id: 's1',
                        textDe: 'Hallo, ich heisse Anna.',
                        textNative: 'Xin chao, toi ten la Anna.',
                        ipa: 'ha-lo, ikh hai-se Anna',
                        audioUrl: '/audio/dev/speaking-hallo-anna.mp3',
                        expectedDurationSec: 4,
                        pronunciationNotes: 'Tap trung vao am ich trong heisse.',
                        keywords: ['Hallo', 'heisse'],
                    },
                    {
                        id: 's2',
                        textDe: 'Ich komme aus Vietnam.',
                        textNative: 'Toi den tu Viet Nam.',
                        ipa: 'ikh ko-me aus Viet-nam',
                        audioUrl: '/audio/dev/speaking-vietnam.mp3',
                        expectedDurationSec: 4,
                        pronunciationNotes: 'Noi ro am ch trong ich.',
                        keywords: ['komme', 'Vietnam'],
                    },
                    {
                        id: 's3',
                        textDe: 'Ich lerne Deutsch.',
                        textNative: 'Toi hoc tieng Duc.',
                        ipa: 'ikh ler-ne doytsh',
                        audioUrl: '/audio/dev/speaking-lerne-deutsch.mp3',
                        expectedDurationSec: 3,
                        pronunciationNotes: 'Giu nguyen am ngan trong lerne.',
                        keywords: ['lerne', 'Deutsch'],
                    },
                ],
            },
            configJson: {
                maxRecordingSec: 10,
                minAccuracyToPass: 60,
                attemptsAllowed: 3,
                showIPA: true,
                showTranslation: true,
                autoPlayModel: true,
            },
            estimatedMin: 5,
            sortOrder: 1,
            status: 'PUBLISHED',
        },
    })
}

async function seedExam() {
    // Surface-table alias: `dev-a1-goethe-mini` slug below already matches
    // `tests/integration/utils/surfaces.ts` P0_SURFACES.exam.path. No alias
    // indirection needed — this seed function is the verification (Decision 3
    // in `.kiro/specs/visual-qa-screenshot-capture/design.md`). The function
    // upserts the ExamTemplate and (re)creates ≥1 ExamSection + ≥1 ExamTask
    // per run; row counts remain stable because sections + tasks are
    // deleted-then-recreated as a pair on every run.
    const exam = await prisma.examTemplate.upsert({
        where: { slug: 'dev-a1-goethe-mini' },
        update: { status: 'PUBLISHED', title: 'Dev A1 Goethe Mini' },
        create: {
            slug: 'dev-a1-goethe-mini',
            title: 'Dev A1 Goethe Mini',
            examType: 'GOETHE',
            cefrLevel: 'A1',
            totalMinutes: 10,
            totalPoints: 10,
            passingScore: 6,
            status: 'PUBLISHED',
        },
    })

    const existingSections = await prisma.examSection.findMany({
        where: { examId: exam.id },
        select: { id: true },
    })

    if (existingSections.length > 0) {
        await prisma.examTask.deleteMany({
            where: { sectionId: { in: existingSections.map((section) => section.id) } },
        })
        await prisma.examSection.deleteMany({ where: { examId: exam.id } })
    }

    await prisma.examSection.create({
        data: {
            examId: exam.id,
            title: 'Lesen',
            skill: 'LESEN',
            totalMinutes: 10,
            totalPoints: 10,
            sortOrder: 1,
            tasks: {
                create: {
                    title: 'Mini Aufgabe',
                    exerciseType: 'TRUE_FALSE',
                    contentJson: { statement: 'Deutsch lernen ist gut.', correctAnswer: true },
                    maxPoints: 10,
                    sortOrder: 1,
                },
            },
        },
    })
}

async function seedClassroom(teacherId: string, learnerId: string) {
    const classroom = await prisma.classroom.upsert({
        where: { joinCode: 'FUX-DEV' },
        update: { teacherId, name: 'Dev A1 Klasse', isArchived: false },
        create: {
            teacherId,
            joinCode: 'FUX-DEV',
            name: 'Dev A1 Klasse',
            description: 'Local test classroom',
            cefrLevel: 'A1',
        },
    })

    await prisma.classEnrollment.upsert({
        where: { classroomId_studentId: { classroomId: classroom.id, studentId: learnerId } },
        update: { removedAt: null },
        create: { classroomId: classroom.id, studentId: learnerId },
    })

    await prisma.assignment.deleteMany({ where: { classroomId: classroom.id, title: 'Dev Wortschatz Aufgabe' } })
    const assignment = await prisma.assignment.create({
        data: {
            classroomId: classroom.id,
            title: 'Dev Wortschatz Aufgabe',
            targetType: 'vocabulary',
            targetMeta: { themeSlug: 'dev-alltag', cefrLevel: 'A1' },
            dueDate: new Date(now.getTime() + 86400000),
        },
    })

    await prisma.assignmentSubmission.create({
        data: {
            assignmentId: assignment.id,
            studentId: learnerId,
            status: 'pending',
        },
    })
}

async function seedLearnerSignals(userId: string) {
    for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        await prisma.dailyActivity.upsert({
            where: { userId_date: { userId, date } },
            update: {
                totalMinutes: i === 0 ? 12 : 8 + i,
                xpEarned: i === 0 ? 45 : 20 + i * 5,
                lessonsCompleted: i % 2 === 0 ? 1 : 0,
                exercisesCompleted: 2,
                srsReviewed: i === 0 ? 5 : 2,
                wordsLearned: i === 0 ? 3 : 1,
            },
            create: {
                userId,
                date,
                totalMinutes: i === 0 ? 12 : 8 + i,
                xpEarned: i === 0 ? 45 : 20 + i * 5,
                lessonsCompleted: i % 2 === 0 ? 1 : 0,
                exercisesCompleted: 2,
                srsReviewed: i === 0 ? 5 : 2,
                wordsLearned: i === 0 ? 3 : 1,
            },
        })
    }

    await prisma.skillAssessment.deleteMany({
        where: {
            userId,
            skill: { in: ['HOEREN', 'LESEN', 'WORTSCHATZ'] },
            cefrLevel: 'A1',
        },
    })

    await prisma.skillAssessment.createMany({
        data: [
            { userId, skill: 'HOEREN', cefrLevel: 'A1', score: 58, strengths: ['short dialogs'], weaknesses: ['numbers'] },
            { userId, skill: 'LESEN', cefrLevel: 'A1', score: 76, strengths: ['short texts'], weaknesses: [] },
            { userId, skill: 'WORTSCHATZ', cefrLevel: 'A1', score: 62, strengths: ['daily words'], weaknesses: ['articles'] },
        ],
    })
}

main()
    .catch((error) => {
        console.error('[seed-dev] Failed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
