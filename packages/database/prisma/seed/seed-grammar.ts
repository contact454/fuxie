import { PrismaClient, type CefrLevel, type ContentStatus } from '@prisma/client'
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

    return { topics: totalTopics, rules: totalRules, errors }
}
