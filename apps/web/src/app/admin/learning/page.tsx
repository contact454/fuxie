import { prisma } from '@fuxie/database';
import LearningClient from './LearningClient';

export const dynamic = 'force-dynamic';

export default async function AdminLearningPage() {
  
  // Find writing bottlenecks by grouping via exerciseId and calc average score
  const attempts = await prisma.writingAttempt.groupBy({
    by: ['exerciseId'],
    _count: { exerciseId: true },
    _avg: { percentScore: true },
    orderBy: {
      _avg: {
        percentScore: 'asc' // lowest score first
      }
    },
    take: 20
  });

  const bottlenecks = attempts.map(a => ({
    exerciseId: a.exerciseId,
    totalAttempts: a._count.exerciseId,
    averageScorePercent: a._avg.percentScore || 0
  })).filter(a => a.averageScorePercent < 0.6); // Only show if average is below 60%

  return <LearningClient bottlenecks={bottlenecks} />;
}
