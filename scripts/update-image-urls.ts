/**
 * Update all JSON files with imageUrl for words that have generated images
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import path from 'path'

function slugify(word: string): string {
    return word
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
}

function main() {
    const vocabDir = 'content/a1/vocabulary'
    const files = readdirSync(vocabDir).filter(f => f.endsWith('.json')).sort()

    let totalUpdated = 0, totalMissing = 0

    for (const file of files) {
        const filePath = path.join(vocabDir, file)
        const data = JSON.parse(readFileSync(filePath, 'utf8'))
        const themeSlug = data.theme.slug
        const imgDir = `apps/web/public/images/vocab/${themeSlug}`

        let updated = 0, missing = 0

        for (const word of data.words) {
            const slug = slugify(word.word)
            const imgPath = path.join(imgDir, `${slug}.png`)
            const imgUrl = `/images/vocab/${themeSlug}/${slug}.png`

            if (!word.imageUrl && existsSync(imgPath)) {
                word.imageUrl = imgUrl
                updated++
            } else if (!word.imageUrl && !existsSync(imgPath)) {
                missing++
            }
        }

        if (updated > 0) {
            writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8')
            console.log(`  ✅ ${file}: +${updated} imageUrl (${missing} missing)`)
        } else if (missing > 0) {
            console.log(`  ⚠️ ${file}: ${missing} missing images`)
        }
        totalUpdated += updated
        totalMissing += missing
    }

    console.log(`\n📊 Updated: ${totalUpdated} | Missing: ${totalMissing}`)
}

main()
