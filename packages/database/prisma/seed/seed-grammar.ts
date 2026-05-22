import { PrismaClient, type CefrLevel, type ContentStatus } from '@fuxie/database'
import * as fs from 'node:fs'
import * as path from 'node:path'

const prisma = new PrismaClient()

interface GrammarRule {
    title: string
    titleDe?: string | null
    ruleText: string
    ruleTextDe?: string | null
    examples: string[]
    exceptions?: string[] | null
    tableData?: Record<string, unknown> | null
    sortOrder: number
}

interface GrammarTopicData {
    slug: string
    title: string
    titleDe?: string | null
    description?: string | null
    cefrLevel: string
    sortOrder: number
    rules: GrammarRule[]
    formula?: string | null
    mnemonicTip?: string | null
}

interface GrammarFile {
    topics: GrammarTopicData[]
}

export async function seedGrammar(contentDir: string): Promise<{ topics: number; rules: number; errors: string[] }> {
    const grammarFile = path.join(contentDir, 'a1', 'grammar', 'grammar-topics.json')
    const data: GrammarFile = JSON.parse(fs.readFileSync(grammarFile, 'utf-8'))

    let totalTopics = 0
    let totalRules = 0
    const errors: string[] = []

    for (const topic of data.topics) {
        try {
            const upsertedTopic = await prisma.grammarTopic.upsert({
                where: { slug: topic.slug },
                update: {
                    title: topic.title,
                    titleDe: topic.titleDe,
                    description: topic.description,
                    cefrLevel: topic.cefrLevel as CefrLevel,
                    sortOrder: topic.sortOrder,
                    formula: topic.formula,
                    mnemonicTip: topic.mnemonicTip,
                    status: 'PUBLISHED' as ContentStatus,
                },
                create: {
                    slug: topic.slug,
                    title: topic.title,
                    titleDe: topic.titleDe,
                    description: topic.description,
                    cefrLevel: topic.cefrLevel as CefrLevel,
                    sortOrder: topic.sortOrder,
                    formula: topic.formula,
                    mnemonicTip: topic.mnemonicTip,
                    status: 'PUBLISHED' as ContentStatus,
                },
            })
            totalTopics++

            // Delete existing rules for this topic (clean re-seed)
            await prisma.grammarRule.deleteMany({
                where: { topicId: upsertedTopic.id },
            })

            // Create rules
            for (const rule of topic.rules) {
                await prisma.grammarRule.create({
                    data: {
                        topicId: upsertedTopic.id,
                        title: rule.title,
                        titleDe: rule.titleDe,
                        ruleText: rule.ruleText,
                        ruleTextDe: rule.ruleTextDe,
                        examples: rule.examples,
                        exceptions: rule.exceptions ? (rule.exceptions as any) : undefined,
                        tableData: rule.tableData ? (rule.tableData as any) : undefined,
                        sortOrder: rule.sortOrder,
                    },
                })
                totalRules++
            }

            console.log(`  ✅ ${topic.slug}: ${topic.rules.length} rules`)
        } catch (err: any) {
            errors.push(`❌ ${topic.slug}: ${err.message?.slice(0, 100)}`)
        }
    }

    await seedPilotGrammarLessonFallback()

    return { topics: totalTopics, rules: totalRules, errors }
}

async function seedPilotGrammarLessonFallback() {
    const existingLesson = await prisma.grammarLesson.findFirst({
        where: { level: 'A1', status: 'PUBLISHED' },
        select: { id: true },
    })
    if (existingLesson) return

    const topic = await prisma.grammarTopic.findFirst({
        where: { cefrLevel: 'A1', status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, slug: true, title: true, titleDe: true },
    })
    if (!topic) return

    await prisma.grammarLesson.upsert({
        where: { id: 'pilot-a1-grammar-episode-01-E' },
        update: {
            topicId: topic.id,
            level: 'A1',
            lessonType: 'E',
            lessonNumber: 1,
            titleDe: topic.titleDe ?? topic.title,
            translations: { vi: 'Pilot grammar episode fixture' },
            estimatedMin: 8,
            tags: ['pilot', 'grammar', 'episode'],
            theoryJson: {
                blocks: [
                    {
                        type: 'rule',
                        text_vi: 'Fixture on dinh cho QA pilot Grammar Episode khi du lieu dev chua seed lesson tu Grammatik Factory.',
                        formula: 'Subject + verb + object',
                    },
                ],
            },
            exercisesJson: pilotGrammarExercises(),
            metadataJson: {
                source: 'pilot_fixture',
                stablePath: `/grammar/${topic.slug}/pilot-a1-grammar-episode-01-E`,
            },
            sortOrder: 1,
            status: 'PUBLISHED',
        },
        create: {
            id: 'pilot-a1-grammar-episode-01-E',
            topicId: topic.id,
            level: 'A1',
            lessonType: 'E',
            lessonNumber: 1,
            titleDe: topic.titleDe ?? topic.title,
            translations: { vi: 'Pilot grammar episode fixture' },
            estimatedMin: 8,
            tags: ['pilot', 'grammar', 'episode'],
            theoryJson: {
                blocks: [
                    {
                        type: 'rule',
                        text_vi: 'Fixture on dinh cho QA pilot Grammar Episode khi du lieu dev chua seed lesson tu Grammatik Factory.',
                        formula: 'Subject + verb + object',
                    },
                ],
            },
            exercisesJson: pilotGrammarExercises(),
            metadataJson: {
                source: 'pilot_fixture',
                stablePath: `/grammar/${topic.slug}/pilot-a1-grammar-episode-01-E`,
            },
            sortOrder: 1,
            status: 'PUBLISHED',
        },
    })
}

function pilotGrammarExercises() {
    return [
        {
            type: 'multiple_choice',
            question_de: 'Welche Satzstellung ist korrekt?',
            question_vi: 'Cau nao dung trat tu tu tieng Duc?',
            options: ['Ich lerne Deutsch.', 'Ich Deutsch lerne.', 'Lerne ich Deutsch.'],
            answer: ['Ich lerne Deutsch.'],
            explanation_vi: 'Trong cau tran thuat, dong tu chia dung o vi tri thu 2.',
        },
        {
            type: 'multiple_choice',
            question_de: 'Wo steht das Verb in "Heute lerne ich Deutsch"?',
            question_vi: 'Dong tu trong cau "Heute lerne ich Deutsch" o vi tri nao?',
            options: ['Position 1', 'Position 2', 'Am Ende'],
            answer: ['Position 2'],
            explanation_vi: 'Heute la vi tri 1, nen lerne dung o vi tri 2.',
        },
        {
            type: 'sort_words',
            instruction_vi: 'Sap xep thanh cau dung.',
            words: ['Deutsch.', 'lerne', 'Ich'],
            correct_order: ['Ich', 'lerne', 'Deutsch.'],
            explanation_vi: 'Ich lerne Deutsch.',
        },
    ]
}
