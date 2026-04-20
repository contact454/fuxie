import { prisma } from '@fuxie/database';
import FeedbackClient from './FeedbackClient';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  
  const feedbacksRaw = await prisma.contentFeedback.findMany({
    where: {
      isResolved: false
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          email: true
        }
      }
    },
    take: 50
  });

  const feedbacks = feedbacksRaw.map(fb => ({
    id: fb.id,
    comment: fb.comment,
    rating: fb.rating,
    aiSentiment: fb.aiSentiment,
    targetType: fb.targetType,
    createdAt: fb.createdAt,
    user: { email: fb.user.email }
  }));

  return <FeedbackClient feedbacks={feedbacks} />;
}
