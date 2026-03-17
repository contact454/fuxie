import { PrismaClient } from '@prisma/client'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedVocabulary } from './seed/seed-vocabulary.js'
import { seedGrammar } from './seed/seed-grammar.js'
import { seedCourse } from './seed/seed-course.js'

const prisma = new PrismaClient()

async function main(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const contentDir = path.resolve(__dirname, '../../../content')

    console.log('🦊 Fuxie Content Seed (Multi-Level)')
    console.log('====================================\n')

    // Phase 1: Vocabulary (auto-detects all available levels: A1, A2, etc.)
    console.log('📚 Phase 1: Vocabulary Themes + Items')
    console.log('--------------------------------------')
    const vocabResult = await seedVocabulary(contentDir)
    console.log(`\n  Themes: ${vocabResult.themes}`)
    console.log(`  Words:  ${vocabResult.words}`)
    if (vocabResult.errors.length > 0) {
        console.log(`  Errors: ${vocabResult.errors.length}`)
        vocabResult.errors.forEach(e => console.log(`    ${e}`))
    }

    // Phase 2: Grammar
    console.log('\n📖 Phase 2: Grammar Topics + Rules')
    console.log('-----------------------------------')
    const grammarResult = await seedGrammar(contentDir)
    console.log(`\n  Topics: ${grammarResult.topics}`)
    console.log(`  Rules:  ${grammarResult.rules}`)
    if (grammarResult.errors.length > 0) {
        console.log(`  Errors: ${grammarResult.errors.length}`)
        grammarResult.errors.forEach(e => console.log(`    ${e}`))
    }

    // Phase 3: Course Structure
    console.log('\n🏗️  Phase 3: Course + Modules')
    console.log('-----------------------------')
    const courseResult = await seedCourse(contentDir)
    console.log(`\n  Courses: ${courseResult.courses}`)
    console.log(`  Modules: ${courseResult.modules}`)
    if (courseResult.errors.length > 0) {
        console.log(`  Errors: ${courseResult.errors.length}`)
        courseResult.errors.forEach(e => console.log(`    ${e}`))
    }

    // Summary — count per level
    console.log('\n====================================')
    console.log('📊 SEED SUMMARY')
    console.log('====================================')

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
    for (const level of levels) {
        const themes = await prisma.vocabularyTheme.count({ where: { cefrLevel: level } })
        const words = await prisma.vocabularyItem.count({ where: { cefrLevel: level } })
        if (themes > 0 || words > 0) {
            console.log(`  ${level}: ${themes} themes, ${words} words`)
        }
    }

    const dbGrammar = await prisma.grammarTopic.count()
    const dbRules = await prisma.grammarRule.count()
    const dbCourses = await prisma.course.count()
    const dbModules = await prisma.module.count()

    console.log(`  Grammar:  ${dbGrammar} topics, ${dbRules} rules`)
    console.log(`  Courses:  ${dbCourses} courses, ${dbModules} modules`)

    const allErrors = [
        ...vocabResult.errors,
        ...grammarResult.errors,
        ...courseResult.errors,
    ]

    if (allErrors.length === 0) {
        console.log('\n✅ All content seeded successfully! 🦊')
    } else {
        console.log(`\n⚠️  Completed with ${allErrors.length} warning(s)/error(s)`)
    }
}

main()
    .catch(e => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
