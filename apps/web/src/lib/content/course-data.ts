/**
 * Static course.json data for all CEFR levels.
 * Replaces runtime fs.readFileSync which fails on Vercel serverless.
 */

// Static imports — bundled at build time
import a1Course from '../../../../../content/a1/course.json'
import a2Course from '../../../../../content/a2/course.json'
import b1Course from '../../../../../content/b1/course.json'
import b2Course from '../../../../../content/b2/course.json'
import c1Course from '../../../../../content/c1/course.json'
import c2Course from '../../../../../content/c2/course.json'

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface SkillLink {
    skill: 'listening' | 'reading' | 'writing' | 'speaking'
    label: string
    labelVi: string
    href: string
    emoji: string
}

interface CourseModuleMapping {
    vocabularyThemes: string[]
    grammarTopics: string[]
    skillLinks: SkillLink[]
}

const COURSE_DATA: Record<CefrLevel, typeof a1Course> = {
    A1: a1Course,
    A2: a2Course,
    B1: b1Course,
    B2: b2Course,
    C1: c1Course,
    C2: c2Course,
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
            vocabularyThemes: (mod as any).vocabularyThemes ?? [],
            grammarTopics: (mod as any).grammarTopics ?? [],
            skillLinks: ((mod as any).skillLinks ?? []) as SkillLink[],
        }
    }
    return moduleMap
}
