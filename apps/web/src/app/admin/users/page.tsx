import { prisma } from '@fuxie/database';
import UserAnalyticsClient from './UserAnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function UserAnalyticsPage() {
  
  // 1. Group by role to get counts
  const roleGroups = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      role: true
    }
  });

  let totalLearners = 0;
  let totalTeachers = 0;
  let totalAdmins = 0;

  roleGroups.forEach(group => {
    if (group.role === 'LEARNER') totalLearners = group._count.role;
    if (group.role === 'TEACHER') totalTeachers = group._count.role;
    if (group.role === 'ADMIN') totalAdmins = group._count.role;
  });

  // 2. Fetch recent 50 users with their profiles
  const usersRaw = await prisma.user.findMany({
    take: 50,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      profile: {
        select: {
          currentLevel: true,
          totalXp: true,
          displayName: true
        }
      }
    }
  });

  // Serialize exactly what the client needs
  const users = usersRaw.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    profile: u.profile ? {
      currentLevel: u.profile.currentLevel,
      totalXp: u.profile.totalXp,
      displayName: u.profile.displayName
    } : null
  }));

  return (
    <UserAnalyticsClient 
      users={users}
      totalLearners={totalLearners}
      totalTeachers={totalTeachers}
      totalAdmins={totalAdmins}
    />
  );
}
