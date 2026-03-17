import { PrismaClient, type CefrLevel, type Gender, type WordType, type ContentStatus } from '@prisma/client'
import * as fs from 'node:fs'
import * as path from 'node:path'

const prisma = new PrismaClient()

interface VocabWord {
    word: string
    article?: Gender | null
    plural?: string | null
    wordType: WordType
    meaningVi: string
    meaningEn?: string | null
    exampleSentence1?: string | null
    exampleTranslation1?: string | null
    exampleSentence2?: string | null
    exampleTranslation2?: string | null
    notes?: string | null
    conjugation?: Record<string, unknown> | null
    imageUrl?: string | null
}

interface VocabFile {
    theme: {
        slug: string
        name: string
        nameVi?: string | null
        nameEn?: string | null
        imageUrl?: string | null
        sortOrder: number
    }
    words: VocabWord[]
}

/**
 * Seed vocabulary for a specific CEFR level.
 * Auto-detects level from directory name (a1, a2, b1, etc.)
 */
export async function seedVocabulary(
    contentDir: string,
    cefrLevel?: CefrLevel
): Promise<{ themes: number; words: number; errors: string[] }> {
    // If no level specified, seed all available levels
    const levels = cefrLevel
        ? [cefrLevel]
        : detectAvailableLevels(contentDir)

    let totalThemes = 0
    let totalWords = 0
    const errors: string[] = []

    for (const level of levels) {
        const levelDir = level.toLowerCase() // A1 → a1, A2 → a2
        const vocabDir = path.join(contentDir, levelDir, 'vocabulary')

        if (!fs.existsSync(vocabDir)) {
            console.log(`  ⏭️  No vocabulary directory for ${level}: ${vocabDir}`)
            continue
        }

        console.log(`\n  📚 Seeding ${level} vocabulary...`)
        const files = fs.readdirSync(vocabDir).filter(f => f.endsWith('.json')).sort()

        for (const file of files) {
            const filePath = path.join(vocabDir, file)
            const data: VocabFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

            // Upsert theme
            const theme = await prisma.vocabularyTheme.upsert({
                where: { slug: data.theme.slug },
                update: {
                    name: data.theme.name,
                    nameVi: data.theme.nameVi,
                    nameEn: data.theme.nameEn,
                    imageUrl: data.theme.imageUrl,
                    cefrLevel: level,
                    sortOrder: data.theme.sortOrder,
                },
                create: {
                    slug: data.theme.slug,
                    name: data.theme.name,
                    nameVi: data.theme.nameVi,
                    nameEn: data.theme.nameEn,
                    imageUrl: data.theme.imageUrl,
                    cefrLevel: level,
                    sortOrder: data.theme.sortOrder,
                },
            })
            totalThemes++

            // Upsert words
            for (const w of data.words) {
                // Quality validation
                if (w.wordType === 'NOMEN' && !w.article && !w.notes?.includes('Plural')) {
                    if (!['Eltern', 'Geschwister', 'Leute', 'Möbel', 'Schmerzen', 'Ferien'].includes(w.word) && w.wordType === 'NOMEN') {
                        errors.push(`⚠️  ${level}/${file}: "${w.word}" is NOMEN but missing article`)
                    }
                }
                if (w.wordType === 'VERB' && !w.conjugation) {
                    errors.push(`⚠️  ${level}/${file}: "${w.word}" is VERB but missing conjugation`)
                }

                const wordForSearch = w.word.replace(/^(der|die|das)\s+/, '')

                try {
                    await prisma.vocabularyItem.upsert({
                        where: {
                            word_cefrLevel: {
                                word: w.word,
                                cefrLevel: level,
                            },
                        },
                        update: {
                            article: w.article ?? undefined,
                            plural: w.plural,
                            wordType: w.wordType,
                            meaningVi: w.meaningVi,
                            meaningEn: w.meaningEn,
                            exampleSentence1: w.exampleSentence1,
                            exampleTranslation1: w.exampleTranslation1,
                            exampleSentence2: w.exampleSentence2,
                            exampleTranslation2: w.exampleTranslation2,
                            notes: w.notes,
                            conjugation: w.conjugation ? (w.conjugation as any) : undefined,
                            imageUrl: w.imageUrl,
                            themeId: theme.id,
                        },
                        create: {
                            word: w.word,
                            wordLower: wordForSearch.toLowerCase(),
                            article: w.article,
                            plural: w.plural,
                            wordType: w.wordType,
                            cefrLevel: level,
                            meaningVi: w.meaningVi,
                            meaningEn: w.meaningEn,
                            exampleSentence1: w.exampleSentence1,
                            exampleTranslation1: w.exampleTranslation1,
                            exampleSentence2: w.exampleSentence2,
                            exampleTranslation2: w.exampleTranslation2,
                            notes: w.notes,
                            conjugation: w.conjugation ? (w.conjugation as any) : undefined,
                            imageUrl: w.imageUrl,
                            themeId: theme.id,
                            status: 'PUBLISHED' as ContentStatus,
                        },
                    })
                    totalWords++
                } catch (err: any) {
                    errors.push(`❌ ${level}/${file}: "${w.word}" — ${err.message?.slice(0, 100)}`)
                }
            }

            console.log(`  ✅ ${level}/${file}: ${data.words.length} words → theme "${data.theme.name}"`)
        }
    }

    return { themes: totalThemes, words: totalWords, errors }
}

/**
 * Detect available CEFR levels by looking for content directories
 */
function detectAvailableLevels(contentDir: string): CefrLevel[] {
    const validLevels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const detected: CefrLevel[] = []

    for (const level of validLevels) {
        const vocabDir = path.join(contentDir, level.toLowerCase(), 'vocabulary')
        if (fs.existsSync(vocabDir)) {
            const files = fs.readdirSync(vocabDir).filter(f => f.endsWith('.json'))
            if (files.length > 0) {
                detected.push(level)
            }
        }
    }

    return detected
}
