import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

interface Finding {
    file: string
    line: number
    pattern: string
}

const binaryExtensions = new Set([
    '.gif',
    '.ico',
    '.jpeg',
    '.jpg',
    '.map',
    '.png',
    '.ttf',
    '.webp',
    '.woff',
    '.woff2',
])

const secretPatterns = [
    { name: 'private-key-marker', re: /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/i },
    { name: 'google-api-key-literal', re: /AIza[0-9A-Za-z_-]{20,}/ },
    { name: 'aws-access-key-literal', re: /AKIA[0-9A-Z]{16}/ },
    { name: 'github-token-literal', re: /gh[pousr]_[0-9A-Za-z_]{30,}/ },
    { name: 'database-url-with-credential', re: /postgres(?:ql)?:\/\/[^\s'"]+:[^\s'"]+@/i },
    {
        name: 'generic-secret-assignment',
        re: /(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)\s*[:=]\s*['"][^'"]{12,}['"]/i,
    },
]

function getCandidateFiles(): string[] {
    return execFileSync('git', ['ls-files'], { encoding: 'utf8' })
        .split(/\r?\n/)
        .concat(
            execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' })
                .split(/\r?\n/),
        )
        .filter(Boolean)
        .filter((file, index, files) => files.indexOf(file) === index)
}

function isAllowedExample(file: string, line: string): boolean {
    return (
        file.endsWith('.env.example') ||
        file.includes('.test.') ||
        line.includes('process.env') ||
        line.includes('stubEnv') ||
        line.includes('mock') ||
        line.includes('example') ||
        line.includes('your-') ||
        line.includes('placeholder') ||
        line.includes('REPLACE') ||
        line.includes('REDACTED')
    )
}

function scanFile(file: string): Finding[] {
    const fullPath = path.resolve(process.cwd(), file)
    if (!existsSync(fullPath) || statSync(fullPath).isDirectory()) {
        return []
    }

    if (binaryExtensions.has(path.extname(file).toLowerCase())) {
        return []
    }

    const findings: Finding[] = []
    const lines = readFileSync(fullPath, 'utf8').split(/\r?\n/)

    for (const [index, line] of lines.entries()) {
        for (const pattern of secretPatterns) {
            if (pattern.re.test(line) && !isAllowedExample(file, line)) {
                findings.push({
                    file,
                    line: index + 1,
                    pattern: pattern.name,
                })
            }
        }
    }

    return findings
}

const findings = getCandidateFiles().flatMap(scanFile)

if (findings.length > 0) {
    console.error('[secret-audit] Potential secret literals found:')
    for (const finding of findings) {
        console.error(`- ${finding.file}:${finding.line} ${finding.pattern}`)
    }
    process.exit(1)
}

console.log('[secret-audit] No secret literals found in tracked or untracked files')
