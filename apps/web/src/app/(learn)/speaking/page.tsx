import { prisma } from '@fuxie/database'
import SpeakingClient from '@/components/speaking/SpeakingClient'

export const metadata = {
  title: 'Sprechen | Fuxie',
  description: 'Luyện nói tiếng Đức — Phát âm, hội thoại, trình bày',
}

export default async function SpeakingPage() {
  const topics = await prisma.speakingTopic.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      lessons: {
        where: { status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [
      { cefrLevel: 'asc' },
      { sortOrder: 'asc' },
    ],
  })

  return <SpeakingClient topics={topics} />
}
