import { PrismaClient } from '@fuxie/database'

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding Roleplay Speaking Lesson...");

  // Create or find a topic
  const topic = await prisma.speakingTopic.upsert({
    where: { slug: "a1-cafe-roleplay" },
    update: {},
    create: {
      slug: "a1-cafe-roleplay",
      titleDe: "Im Cafe",
      titleVi: "Trong quán Cafe",
      description: "Giao tiếp cơ bản khi gọi đồ uống",
      cefrLevel: "A1",
      sortOrder: 1,
      status: "PUBLISHED"
    }
  });

  console.log("Topic upserted:", topic.slug);

  // Create or find the lesson
  const lesson = await prisma.speakingLesson.upsert({
    where: { id: "a1-cafe-roleplay-01" },
    update: {},
    create: {
      id: "a1-cafe-roleplay-01",
      topicId: topic.id,
      level: "A1",
      lessonType: "A",
      lessonNumber: 1,
      titleDe: "Getränke bestellen",
      titleVi: "Gọi đồ uống",
      exerciseType: "roleplay",
      exercisesJson: { sentences: [] }, // Roleplay doesn't need predefined sentences
      configJson: { 
        scenario: "Du bist in einem Café in Berlin. Du möchtest einen Kaffee und ein Stück Kuchen bestellen. Der Kellner (Fuxie) begrüßt dich.",
      },
      estimatedMin: 5,
      sortOrder: 1,
      status: "PUBLISHED"
    }
  });

  console.log("Lesson upserted:", lesson.id);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
