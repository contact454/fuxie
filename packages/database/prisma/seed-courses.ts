/**
 * seed-courses.ts
 *
 * Seeds Course + CourseModule records for all CEFR levels (A1–C2).
 * Reads from content/{level}/course.json.
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx prisma/seed-courses.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONTENT_DIR = path.resolve(__dirname, '../../../content')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const

interface CourseJson {
    course: {
        slug: string
        title: string
        titleDe?: string
        description?: string
        cefrLevel: string
        examTypes?: string[]
        imageUrl?: string
        sortOrder: number
    }
    modules: Array<{
        slug: string
        title: string
        titleDe?: string
        description?: string
        cefrLevel: string
        sortOrder: number
        estimatedMinutes: number
    }>
}

async function main() {
    console.log('📚 Seeding courses A1–C2...\n')

    let totalCourses = 0
    let totalModules = 0

    for (const level of LEVELS) {
        const jsonPath = path.join(CONTENT_DIR, level, 'course.json')

        if (!fs.existsSync(jsonPath)) {
            console.warn(`⚠️  No course.json for ${level.toUpperCase()}, skipping`)
            continue
        }

        const data: CourseJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
        const c = data.course

        // Upsert Course
        const course = await prisma.course.upsert({
            where: { slug: c.slug },
            update: {
                title: c.title,
                titleDe: c.titleDe ?? c.title,
                description: c.description,
                cefrLevel: c.cefrLevel as any,
                imageUrl: c.imageUrl,
                sortOrder: c.sortOrder,
                status: 'PUBLISHED',
            },
            create: {
                slug: c.slug,
                title: c.title,
                titleDe: c.titleDe ?? c.title,
                description: c.description,
                cefrLevel: c.cefrLevel as any,
                imageUrl: c.imageUrl,
                sortOrder: c.sortOrder,
                status: 'PUBLISHED',
            },
        })
        totalCourses++
        console.log(`📗 ${c.cefrLevel}: ${c.slug} (${data.modules.length} modules)`)

        // Upsert Modules
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
                    titleDe: mod.titleDe ?? mod.title,
                    description: mod.description,
                    cefrLevel: c.cefrLevel as any,
                    sortOrder: mod.sortOrder,
                    estimatedMinutes: mod.estimatedMinutes,
                    status: 'PUBLISHED',
                },
                create: {
                    courseId: course.id,
                    slug: mod.slug,
                    title: mod.title,
                    titleDe: mod.titleDe ?? mod.title,
                    description: mod.description,
                    cefrLevel: c.cefrLevel as any,
                    sortOrder: mod.sortOrder,
                    estimatedMinutes: mod.estimatedMinutes,
                    status: 'PUBLISHED',
                },
            })
            totalModules++
        }
    }

    console.log(`\n✅ Seed complete!`)
    console.log(`   Courses: ${totalCourses}`)
    console.log(`   Modules: ${totalModules}`)

    await prisma.$disconnect()
}

main().catch((e) => {
    console.error('❌ Seed failed:', e)
    prisma.$disconnect()
    process.exit(1)
})
