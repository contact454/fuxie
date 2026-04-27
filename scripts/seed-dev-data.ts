import { prisma } from '@fuxie/database'

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

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
            exercisesJson: [{ id: 'g1', prompt: 'Ich ___ Deutsch.', answer: 'lerne' }],
            status: 'PUBLISHED',
        },
        create: {
            id: 'dev-a1-praesens-01',
            topicId: topic.id,
            level: 'A1',
            lessonType: 'E',
            lessonNumber: 1,
            titleDe: 'Verben im Praesens',
            exercisesJson: [{ id: 'g1', prompt: 'Ich ___ Deutsch.', answer: 'lerne' }],
            estimatedMin: 8,
            tags: ['dev', 'praesens'],
            sortOrder: 1,
            status: 'PUBLISHED',
        },
    })
}

async function seedListening() {
    const lesson = await prisma.listeningLesson.upsert({
        where: { lessonId: 'L-A1-DEV-001' },
        update: {
            cefrLevel: 'A1',
            title: 'Dev Hoeren Alltag',
            topic: 'Begruessung',
            taskType: 'MC a/b/c',
            audioUrl: '/audio/dev/sample.mp3',
            sortOrder: 1,
        },
        create: {
            lessonId: 'L-A1-DEV-001',
            cefrLevel: 'A1',
            board: 'GOETHE',
            teil: 1,
            teilName: 'Kurze Gespraeche',
            title: 'Dev Hoeren Alltag',
            topic: 'Begruessung',
            taskType: 'MC a/b/c',
            audioUrl: '/audio/dev/sample.mp3',
            sortOrder: 1,
        },
    })

    await prisma.listeningQuestion.deleteMany({ where: { lessonId: lesson.id } })
    await prisma.listeningQuestion.create({
        data: {
            lessonId: lesson.id,
            questionNumber: 1,
            questionType: 'mc_abc',
            questionText: 'Was sagt die Person?',
            options: ['Hallo', 'Tschuess', 'Danke'],
            correctAnswer: 'Hallo',
            explanation: 'Die Person begruesst jemanden.',
            sortOrder: 1,
        },
    })
}

async function seedReading() {
    const exercise = await prisma.readingExercise.upsert({
        where: { exerciseId: 'R-A1-DEV-001' },
        update: {
            cefrLevel: 'A1',
            topic: 'Eine kurze Nachricht',
            textsJson: [{ id: 'text-a', text: 'Hallo! Ich lerne Deutsch.' }],
            sortOrder: 1,
        },
        create: {
            exerciseId: 'R-A1-DEV-001',
            cefrLevel: 'A1',
            teil: 1,
            teilName: 'Kurze Texte lesen',
            topic: 'Eine kurze Nachricht',
            textsJson: [{ id: 'text-a', text: 'Hallo! Ich lerne Deutsch.' }],
            sortOrder: 1,
        },
    })

    await prisma.readingQuestion.deleteMany({ where: { exerciseId: exercise.id } })
    await prisma.readingQuestion.create({
        data: {
            exerciseId: exercise.id,
            questionNumber: 1,
            questionType: 'richtig_falsch',
            linkedText: 'text-a',
            statement: 'Die Person lernt Deutsch.',
            correctAnswer: 'richtig',
            points: 1,
            sortOrder: 1,
        },
    })
}

async function seedWriting() {
    await prisma.writingExercise.upsert({
        where: { exerciseId: 'W-A1-DEV-001' },
        update: { cefrLevel: 'A1', topic: 'Sich vorstellen', instruction: 'Schreiben Sie eine kurze Vorstellung.', status: 'PUBLISHED' },
        create: {
            exerciseId: 'W-A1-DEV-001',
            cefrLevel: 'A1',
            teil: 1,
            teilName: 'Kurze E-Mail',
            textType: 'E-Mail',
            register: 'informell',
            topic: 'Sich vorstellen',
            instruction: 'Schreiben Sie eine kurze Vorstellung.',
            situation: 'Sie schreiben an einen neuen Freund.',
            contentPoints: ['Name', 'Herkunft', 'Hobby'],
            minWords: 30,
            maxWords: 60,
            timeMinutes: 10,
            rubricJson: { criteria: ['Inhalt', 'Korrektheit'] },
            status: 'PUBLISHED',
            sortOrder: 1,
        },
    })
}

async function seedSpeaking() {
    const topic = await prisma.speakingTopic.upsert({
        where: { slug: 'dev-begruessung' },
        update: { titleDe: 'Begruessung', cefrLevel: 'A1', status: 'PUBLISHED', sortOrder: 1 },
        create: { slug: 'dev-begruessung', titleDe: 'Begruessung', cefrLevel: 'A1', status: 'PUBLISHED', sortOrder: 1 },
    })

    await prisma.speakingLesson.upsert({
        where: { id: 'dev-a1-begruessung-01' },
        update: { topicId: topic.id, titleDe: 'Hallo sagen', exercisesJson: [{ id: 's1', text: 'Hallo, ich heisse Anna.' }], status: 'PUBLISHED' },
        create: {
            id: 'dev-a1-begruessung-01',
            topicId: topic.id,
            level: 'A1',
            lessonType: 'E',
            lessonNumber: 1,
            titleDe: 'Hallo sagen',
            exerciseType: 'nachsprechen',
            exercisesJson: [{ id: 's1', text: 'Hallo, ich heisse Anna.' }],
            estimatedMin: 5,
            sortOrder: 1,
            status: 'PUBLISHED',
        },
    })
}

async function seedExam() {
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
