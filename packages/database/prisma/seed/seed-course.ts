import { PrismaClient, type CefrLevel, type ExamType, type ContentStatus } from '@prisma/client'
import * as fs from 'node:fs'
import * as path from 'node:path'

const prisma = new PrismaClient()

interface ModuleData {
    slug: string
    title: string
    titleDe?: string | null
    description?: string | null
    cefrLevel: string
    sortOrder: number
    estimatedMinutes: number
    vocabularyThemes: string[]
    grammarTopics: string[]
}

interface CourseFile {
    course: {
        slug: string
        title: string
        titleDe?: string | null
        description?: string | null
        cefrLevel: string
        examTypes: string[]
        imageUrl?: string | null
        sortOrder: number
    }
    modules: ModuleData[]
}

export async function seedCourse(contentDir: string): Promise<{ courses: number; modules: number; errors: string[] }> {
    const courseFile = path.join(contentDir, 'a1', 'course.json')
    const data: CourseFile = JSON.parse(fs.readFileSync(courseFile, 'utf-8'))

    const errors: string[] = []

    try {
        // Upsert course
        const course = await prisma.course.upsert({
            where: { slug: data.course.slug },
            update: {
                title: data.course.title,
                titleDe: data.course.titleDe,
                description: data.course.description,
                cefrLevel: data.course.cefrLevel as CefrLevel,
                examTypes: data.course.examTypes as ExamType[],
                imageUrl: data.course.imageUrl,
                sortOrder: data.course.sortOrder,
                status: 'PUBLISHED' as ContentStatus,
            },
            create: {
                slug: data.course.slug,
                title: data.course.title,
                titleDe: data.course.titleDe,
                description: data.course.description,
                cefrLevel: data.course.cefrLevel as CefrLevel,
                examTypes: data.course.examTypes as ExamType[],
                imageUrl: data.course.imageUrl,
                sortOrder: data.course.sortOrder,
                status: 'PUBLISHED' as ContentStatus,
            },
        })

        console.log(`  ✅ Course: "${course.title}"`)

        // Upsert modules
        let totalModules = 0
        for (const mod of data.modules) {
            await prisma.module.upsert({
                where: {
                    courseId_slug: {
                        courseId: course.id,
                        slug: mod.slug,
                    },
                },
                update: {
                    title: mod.title,
                    titleDe: mod.titleDe,
                    description: mod.description,
                    cefrLevel: mod.cefrLevel as CefrLevel,
                    sortOrder: mod.sortOrder,
                    estimatedMinutes: mod.estimatedMinutes,
                    status: 'PUBLISHED' as ContentStatus,
                },
                create: {
                    courseId: course.id,
                    slug: mod.slug,
                    title: mod.title,
                    titleDe: mod.titleDe,
                    description: mod.description,
                    cefrLevel: mod.cefrLevel as CefrLevel,
                    sortOrder: mod.sortOrder,
                    estimatedMinutes: mod.estimatedMinutes,
                    status: 'PUBLISHED' as ContentStatus,
                },
            })
            totalModules++
            console.log(`  ✅ Module ${mod.sortOrder}: "${mod.title}"`)
        }

        return { courses: 1, modules: totalModules, errors }
    } catch (err: any) {
        errors.push(`❌ Course seed error: ${err.message?.slice(0, 200)}`)
        return { courses: 0, modules: 0, errors }
    }
}
