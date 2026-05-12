import { PrismaClient } from '../apps/web/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up dev grammar data...')

  const devTopics = await prisma.grammarTopic.findMany({
    where: { slug: { startsWith: 'dev-' } },
    include: { lessons: true, exercises: true, rules: true }
  })

  if (devTopics.length === 0) {
    console.log('No dev topics found. Database is clean.')
    return
  }

  for (const t of devTopics) {
    console.log(`Deleting topic: ${t.slug}...`)

    // Delete GrammarProgress for all lessons of this topic
    const lessonIds = t.lessons.map(l => l.id)
    if (lessonIds.length > 0) {
      await prisma.grammarProgress.deleteMany({
        where: { lessonId: { in: lessonIds } }
      })
    }

    // Delete SrsCards connected to this topic
    await prisma.srsCard.deleteMany({
      where: { grammarTopicId: t.id }
    })

    // Delete Exercises connected to this topic
    await prisma.exercise.deleteMany({
      where: { grammarTopicId: t.id }
    })

    // Delete GrammarRules
    await prisma.grammarRule.deleteMany({
      where: { topicId: t.id }
    })

    // Delete GrammarLessons
    await prisma.grammarLesson.deleteMany({
      where: { topicId: t.id }
    })

    // Delete GrammarTopic
    await prisma.grammarTopic.delete({
      where: { id: t.id }
    })

    console.log(`Successfully deleted topic: ${t.slug} and all its relations.`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
