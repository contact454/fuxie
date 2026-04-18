/**
 * Static course.json data for all CEFR levels.
 * Replaces runtime fs.readFileSync which fails on Vercel serverless.
 */

// Static imports — bundled at build time
// Files are in apps/web/src/data/courses/ (copies from content/<level>/course.json)
import a1Course from '@/data/courses/a1.json'
import a2Course from '@/data/courses/a2.json'
import b1Course from '@/data/courses/b1.json'
import b2Course from '@/data/courses/b2.json'
import c1Course from '@/data/courses/c1.json'
import c2Course from '@/data/courses/c2.json'

import type { CefrLevel } from '@/lib/types/cefr'

interface SkillLink {
    skill: 'listening' | 'reading' | 'writing' | 'speaking'
    label: string
    labelNative: string
    href: string
    emoji: string
}

/** Extended module shape including optional fields from course JSON */
interface CourseModuleJson {
    slug: string
    vocabularyThemes?: string[]
    grammarTopics?: string[]
    skillLinks?: SkillLink[]
    [key: string]: unknown
}

interface CourseModuleMapping {
    vocabularyThemes: string[]
    grammarTopics: string[]
    skillLinks: SkillLink[]
}

const COURSE_DATA: Record<CefrLevel, { modules: CourseModuleJson[] }> = {
    A1: a1Course as unknown as { modules: CourseModuleJson[] },
    A2: a2Course as unknown as { modules: CourseModuleJson[] },
    B1: b1Course as unknown as { modules: CourseModuleJson[] },
    B2: b2Course as unknown as { modules: CourseModuleJson[] },
    C1: c1Course as unknown as { modules: CourseModuleJson[] },
    C2: c2Course as unknown as { modules: CourseModuleJson[] },
}

/**
 * Get the module mapping for a given CEFR level.
 * Returns a Record of module slug → { vocabularyThemes, grammarTopics, skillLinks }
 */
export function getCourseModuleMap(level: CefrLevel): Record<string, CourseModuleMapping> {
    const courseJson = COURSE_DATA[level]
    if (!courseJson) return {}

    const moduleMap: Record<string, CourseModuleMapping> = {}
    for (const mod of courseJson.modules) {
        moduleMap[mod.slug] = {
            vocabularyThemes: mod.vocabularyThemes ?? [],
            grammarTopics: mod.grammarTopics ?? [],
            skillLinks: mod.skillLinks ?? [],
        }
    }
    return moduleMap
}

