import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { flipLine } from '../tests/property/visual-capture/_helpers'

const VISUAL_AUDIT_FOLDER = 'docs/design/visual-audit/qa-runs/2026-05-16'
const CAPTURE_DATE = '2026-05-16'

function main() {
    const dir = path.resolve(VISUAL_AUDIT_FOLDER)
    const files = readdirSync(dir).filter(name => name.endsWith('.md') && name !== 'README.md')
    
    let totalFlips = 0

    for (const name of files) {
        const filePath = path.join(dir, name)
        const content = readFileSync(filePath, 'utf8')
        const lines = content.split(/\r?\n/)
        const newLines = lines.map(line => {
            const flipped = flipLine(line, CAPTURE_DATE, (evidencePath) => {
                const pngPath = path.join(dir, evidencePath)
                return existsSync(pngPath)
            })
            if (flipped !== line) {
                totalFlips++
            }
            return flipped
        })
        writeFileSync(filePath, newLines.join('\n'), 'utf8')
        console.log(`[marker-flip] Updated ${name}`)
    }

    console.log(`[marker-flip] Successfully flipped ${totalFlips} markers.`)

    // Task 7.2: Update qa-runs/2026-05-16/README.md sign-off row
    const readmePath = path.join(dir, 'README.md')
    let readmeContent = readFileSync(readmePath, 'utf8')
    const searchString = '| FE | _capture pass_ | _pending_ | Playwright screenshot capture against seeded local DB. |'
    const replacementString = '| FE | _capture pass_ | 2026-05-16 | Visual QA screenshots generated per visual-qa-screenshot-capture. |'
    
    if (readmeContent.includes(searchString)) {
        readmeContent = readmeContent.replace(searchString, replacementString)
        writeFileSync(readmePath, readmeContent, 'utf8')
        console.log(`[marker-flip] Updated sign-off in README.md`)
    } else {
        console.log(`[marker-flip] WARNING: Could not find sign-off row in README.md to update!`)
    }
}

main()
