import { PrismaClient } from '../apps/web/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting Fuxie Speaking DB Cleanup & Formatting Fix')
  console.log('='.repeat(60))

  const lessons = await prisma.speakingLesson.findMany({
    where: { exerciseType: 'nachsprechen' },
    select: { id: true, topicId: true, exercisesJson: true }
  })

  // 1. Deduplication
  console.log('\n🔍 Phase 1: Deduplication')
  const topics: Record<string, string[]> = {}
  for (const l of lessons) {
    if (!topics[l.topicId]) topics[l.topicId] = []
    topics[l.topicId].push(l.id)
  }

  const idsToDelete: string[] = []
  for (const [topicId, ids] of Object.entries(topics)) {
    if (ids.length > 1) {
      const nachsprechenIds = ids.filter(id => id.endsWith('-nachsprechen'))
      const oldIds = ids.filter(id => !id.endsWith('-nachsprechen'))
      
      if (nachsprechenIds.length > 0 && oldIds.length > 0) {
        idsToDelete.push(...oldIds)
      }
    }
  }

  if (idsToDelete.length > 0) {
    console.log(`Found ${idsToDelete.length} duplicate old records to delete.`)
    
    // Delete progress first to avoid foreign key constraints
    const delProgress = await prisma.speakingProgress.deleteMany({
      where: { lessonId: { in: idsToDelete } }
    })
    console.log(`  🗑️ Deleted ${delProgress.count} related speakingProgress records.`)

    const delLessons = await prisma.speakingLesson.deleteMany({
      where: { id: { in: idsToDelete } }
    })
    console.log(`  ✅ Deleted ${delLessons.count} duplicate SpeakingLesson records.`)
  } else {
    console.log('✅ No duplicates found.')
  }

  // 2. IPA Formatting Fix
  console.log('\n🔍 Phase 2: IPA Formatting Fix')
  const remainingLessons = await prisma.speakingLesson.findMany({
    where: { exerciseType: 'nachsprechen' }
  })

  let updatedCount = 0
  let totalFixedSentences = 0

  for (const lesson of remainingLessons) {
    let isDirty = false
    const exercisesJson = lesson.exercisesJson as any

    if (exercisesJson && exercisesJson.sentences && Array.isArray(exercisesJson.sentences)) {
      for (const s of exercisesJson.sentences) {
        if (s.ipa) {
          s.ipa = s.ipa.trim()
          if (s.ipa.startsWith('[') && s.ipa.endsWith(']')) {
            s.ipa = '/' + s.ipa.slice(1, -1) + '/'
            isDirty = true
            totalFixedSentences++
          } else if (!s.ipa.startsWith('/') && !s.ipa.startsWith('[')) {
            s.ipa = '/' + s.ipa + '/'
            isDirty = true
            totalFixedSentences++
          }
        }
      }
    }

    if (isDirty) {
      await prisma.speakingLesson.update({
        where: { id: lesson.id },
        data: { exercisesJson }
      })
      updatedCount++
    }
  }

  console.log(`  ✅ Fixed IPA formatting in ${totalFixedSentences} sentences across ${updatedCount} lessons.`)

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Cleanup and Fix Complete!')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
