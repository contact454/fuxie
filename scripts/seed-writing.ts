import { PrismaClient, CefrLevel, ContentStatus } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const CONTENT_BASE = path.join(__dirname, '..', 'content')
const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')

  console.log('🦊 Seeding Schreiben exercises...\n')

  let totalExercises = 0
  let totalSkipped = 0

  for (const level of LEVELS) {
    const dir = path.join(CONTENT_BASE, level.toLowerCase(), 'writing')
    if (!fs.existsSync(dir)) {
      console.log(`⏭️  ${level} — no writing directory`)
      continue
    }

    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json') && f.startsWith('W-'))
      .sort()

    if (files.length === 0) {
      console.log(`⏭️  ${level} — no exercises`)
      continue
    }

    console.log(`📝 ${level} — ${files.length} exercises`)

    for (const filename of files) {
      const filepath = path.join(dir, filename)
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'))

      const exerciseId = data.id

      // Check if exists
      const existing = await prisma.writingExercise.findUnique({
        where: { exerciseId }
      })

      if (existing && !force) {
        totalSkipped++
        continue
      }

      const exerciseData = {
        exerciseId,
        cefrLevel: data.cefrLevel as CefrLevel,
        teil: data.teil,
        teilName: data.teilName,
        textType: data.textType,
        register: data.register,
        topic: data.topic,
        instruction: data.instruction,
        instructionVi: data.instructionVi || null,
        situation: data.situation,
        contentPoints: data.contentPoints,
        sampleResponse: data.sampleResponse || null,
        formFields: data.formFields || null,
        sourceText: data.sourceText || null,
        sourceTextType: data.sourceTextType || null,
        grafikUrl: data.grafikUrl || null,
        grafikDesc: data.grafikDesc || null,
        minWords: data.minWords,
        maxWords: data.maxWords || null,
        timeMinutes: data.timeMinutes || 15,
        rubricJson: data.rubric,
        maxScore: data.maxScore || 25,
        imageUrl: data.imageUrl || null,
        sortOrder: totalExercises,
        status: 'PUBLISHED' as ContentStatus,
      }

      if (existing) {
        await prisma.writingExercise.update({
          where: { exerciseId },
          data: exerciseData,
        })
      } else {
        await prisma.writingExercise.create({
          data: exerciseData,
        })
      }

      totalExercises++
    }

    console.log(`  ✅ ${level} done`)
  }

  console.log(`\n${'═'.repeat(35)}`)
  console.log(`📊 SUMMARY:`)
  console.log(`  ✅ Exercises: ${totalExercises}`)
  console.log(`  ⏭️  Skipped:   ${totalSkipped}`)
  console.log(`\n🦊 Done!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
