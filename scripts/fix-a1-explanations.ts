import { PrismaClient } from '../apps/web/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  const missingEx = [
    { lessonId: 'a1-g01-alphabet-aussprache-03-A', type: 'error_spotting' },
    { lessonId: 'a1-g04-satzbau-fragen-03-A', type: 'error_spotting' },
    { lessonId: 'a1-g07-nomen-genus-plural-01-E', type: 'multiple_choice' },
    { lessonId: 'a1-g07-nomen-genus-plural-03-A', type: 'error_spotting' },
    { lessonId: 'a1-g11-possessivpronomen-01-E', type: 'multiple_choice' },
    { lessonId: 'a1-g11-possessivpronomen-03-A', type: 'error_spotting' }
  ]

  for (const item of missingEx) {
    const lesson = await prisma.grammarLesson.findUnique({
      where: { id: item.lessonId }
    })
    
    if (!lesson) continue

    const exercises = lesson.exercisesJson as any[]
    if (!Array.isArray(exercises)) continue

    let changed = false
    exercises.forEach((ex, idx) => {
      // For now, if explanation_de/vi is missing, add a placeholder or simple explanation.
      if (!ex.explanation_de && !ex.explanation_vi) {
        if (ex.type === 'error_spotting') {
          ex.explanation_de = 'Achten Sie auf die genaue Schreibweise und grammatikalische Form.'
          ex.explanation_vi = 'Hãy chú ý đến cách viết chính xác và hình thức ngữ pháp.'
          changed = true
          console.log(`Added explanation for ${item.lessonId} exercise ${idx + 1}`)
        } else if (ex.type === 'multiple_choice') {
          ex.explanation_de = 'Prüfen Sie die Grammatikregel für dieses Thema.'
          ex.explanation_vi = 'Hãy kiểm tra lại quy tắc ngữ pháp cho chủ đề này.'
          changed = true
          console.log(`Added explanation for ${item.lessonId} exercise ${idx + 1}`)
        } else {
          ex.explanation_de = 'Wenden Sie die gelernte Regel an.'
          ex.explanation_vi = 'Hãy áp dụng quy tắc đã học.'
          changed = true
          console.log(`Added explanation for ${item.lessonId} exercise ${idx + 1}`)
        }
      }
    })

    if (changed) {
      await prisma.grammarLesson.update({
        where: { id: lesson.id },
        data: { exercisesJson: exercises }
      })
    }
  }

  // Also fix missing explanations on Topics
  const topics = await prisma.grammarTopic.findMany()
  for (const t of topics) {
    if (!t.explanation) {
      await prisma.grammarTopic.update({
        where: { id: t.id },
        data: { 
          explanation: t.description || 'Lernen Sie die Regeln für dieses Thema.',
          explanationDe: t.titleDe || 'Lernen Sie die Regeln für dieses Thema.'
        }
      })
      console.log(`Updated topic explanation for ${t.slug}`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
