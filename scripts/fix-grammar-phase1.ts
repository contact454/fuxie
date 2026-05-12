/**
 * Phase 1: Merge Gen2 A1 topics into Gen1
 * - Move rules from Gen2 → Gen1
 * - Copy description from Gen2 → Gen1
 * - Delete empty Gen2 topics
 */
import { PrismaClient } from '../apps/web/generated/prisma'
const prisma = new PrismaClient()

const MERGE_PAIRS = [
  { gen1: 'a1-artikel', gen2: 'a1-g05-artikel' },
  { gen1: 'a1-negation', gen2: 'a1-g06-verneinung' },
  { gen1: 'a1-modalverben', gen2: 'a1-g09-modalverben' },
  { gen1: 'a1-akkusativ', gen2: 'a1-g10-akkusativ' },
  { gen1: 'a1-trennbare-verben', gen2: 'a1-g12-trennbare-verben' },
]

async function main() {
  console.log('🔧 Phase 1: Merging Gen2 topics into Gen1...\n')

  for (const { gen1, gen2 } of MERGE_PAIRS) {
    const t1 = await prisma.grammarTopic.findUnique({ where: { slug: gen1 }, include: { rules: true } })
    const t2 = await prisma.grammarTopic.findUnique({ where: { slug: gen2 }, include: { rules: true, lessons: true, exercises: true } })

    if (!t1 || !t2) {
      console.log(`⏭️ Skipping ${gen1} ↔ ${gen2}: one not found`)
      continue
    }

    // Safety: Gen2 should have no lessons or exercises
    if (t2.lessons.length > 0 || t2.exercises.length > 0) {
      console.log(`⚠️ ${gen2} has ${t2.lessons.length} lessons and ${t2.exercises.length} exercises — skipping (not safe to delete)`)
      continue
    }

    // 1. Move rules from Gen2 → Gen1
    if (t2.rules.length > 0) {
      await prisma.grammarRule.updateMany({
        where: { topicId: t2.id },
        data: { topicId: t1.id }
      })
      console.log(`  ✅ Moved ${t2.rules.length} rules: ${gen2} → ${gen1}`)
    }

    // 2. Copy description if Gen1 is missing
    if (!t1.description && t2.description) {
      await prisma.grammarTopic.update({
        where: { id: t1.id },
        data: { description: t2.description }
      })
      console.log(`  ✅ Copied description to ${gen1}`)
    }

    // 3. Copy formula if available
    if (!t1.formula && t2.formula) {
      await prisma.grammarTopic.update({
        where: { id: t1.id },
        data: { formula: t2.formula }
      })
      console.log(`  ✅ Copied formula to ${gen1}`)
    }

    // 4. Copy mnemonicTip if available
    if (!t1.mnemonicTip && t2.mnemonicTip) {
      await prisma.grammarTopic.update({
        where: { id: t1.id },
        data: { mnemonicTip: t2.mnemonicTip }
      })
    }

    // 5. Delete empty Gen2 topic
    await prisma.grammarTopic.delete({ where: { id: t2.id } })
    console.log(`  🗑️ Deleted empty topic: ${gen2}`)
    console.log(`  ✅ Merged: ${gen2} → ${gen1}\n`)
  }

  console.log('🎉 Phase 1 complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
