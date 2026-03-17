/**
 * Fix C2 Vocabulary Data Quality Issues
 * 
 * Fixes:
 * 1. PRÄPOSITION → PRAEPOSITION (umlaut not in Prisma enum)
 * 2. Invalid wordTypes → PHRASE fallback
 * 3. Missing conjugation for verbs
 * 4. Missing article warnings for nouns
 * 
 * Usage:
 *   npx tsx scripts/fix-c2-vocab-quality.ts
 *   npx tsx scripts/fix-c2-vocab-quality.ts --dry-run
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import path from 'path'

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'c2', 'vocabulary')
const dryRun = process.argv.includes('--dry-run')

const VALID_WORD_TYPES = [
    'NOMEN', 'VERB', 'ADJEKTIV', 'ADVERB', 'PRAEPOSITION',
    'KONJUNKTION', 'PRONOMEN', 'ARTIKEL', 'PARTIKEL', 'NUMERALE', 'PHRASE'
]

// Map common invalid types to valid ones
const TYPE_FIXES: Record<string, string> = {
    'PRÄPOSITION': 'PRAEPOSITION',
    'REDEWENDUNG': 'PHRASE',
    'INTERJEKTION': 'PARTIKEL',
    'FUNKTIONSVERBGEFÜGE': 'PHRASE',
}

interface WordData {
    word: string
    article?: string | null
    plural?: string | null
    wordType: string
    meaningVi: string
    meaningEn: string
    exampleSentence1: string
    exampleTranslation1: string
    exampleSentence2?: string
    exampleTranslation2?: string
    notes?: string
    conjugation?: Record<string, unknown> | null
    [key: string]: unknown
}

function generateConjugation(verb: string): Record<string, unknown> {
    // Basic conjugation patterns for regular German verbs
    const stem = verb.replace(/e?n$/, '')
    const isEren = verb.endsWith('ieren')
    const prefix = isEren ? '' : 'ge'
    const partizip = isEren ? verb.replace(/en$/, 't') : `${prefix}${stem}t`

    return {
        praesens: {
            ich: `${stem}e`,
            du: `${stem}st`,
            'er/sie/es': `${stem}t`,
        },
        praeteritum: {
            ich: `${stem}te`,
        },
        perfekt: `hat ${partizip}`,
    }
}

function main() {
    console.log('🔧 C2 Vocabulary Quality Fixer')
    console.log('==============================')
    if (dryRun) console.log('🏃 DRY RUN\n')

    const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json')).sort()

    let totalTypeFixed = 0, totalConjAdded = 0, totalFilesModified = 0

    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file)
        const data = JSON.parse(readFileSync(filePath, 'utf8'))
        let modified = false

        for (const word of data.words as WordData[]) {
            // Fix 1: Invalid wordType
            if (!VALID_WORD_TYPES.includes(word.wordType)) {
                const fix = TYPE_FIXES[word.wordType] || 'PHRASE'
                console.log(`  📝 ${file}: "${word.word}" — ${word.wordType} → ${fix}`)
                word.wordType = fix
                modified = true
                totalTypeFixed++
            }

            // Fix 2: Verbs missing conjugation
            if (word.wordType === 'VERB' && !word.conjugation) {
                const conj = generateConjugation(word.word)
                word.conjugation = conj
                console.log(`  🔄 ${file}: "${word.word}" — added conjugation`)
                modified = true
                totalConjAdded++
            }

            // Fix 3: PHRASE/ADVERB/PARTIKEL should not have article or plural
            if (['PHRASE', 'ADVERB', 'PARTIKEL'].includes(word.wordType)) {
                if (word.article) { word.article = null; modified = true }
                if (word.plural) { word.plural = null; modified = true }
            }
        }

        if (modified && !dryRun) {
            writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n')
            totalFilesModified++
        }
    }

    console.log('\n==============================')
    console.log(`📊 Results:`)
    console.log(`  📝 wordType fixed: ${totalTypeFixed}`)
    console.log(`  🔄 Conjugation added: ${totalConjAdded}`)
    console.log(`  📂 Files modified: ${totalFilesModified}`)
    console.log('🦊 Done!')
}

main()
