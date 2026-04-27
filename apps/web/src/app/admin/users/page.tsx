import { prisma } from '@fuxie/database';
import { UserAnalyticsClientDynamic } from './UserAnalyticsClientDynamic';

export const dynamic = 'force-dynamic';

export default async function UserAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const page = parseInt(params.page as string || '1', 10);
  const search = (params.search as string) || '';
  const take = 20;
  const skip = (page - 1) * take;
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

  // 2. Fetch users with search and pagination
  const whereClause = search ? {
    email: {
      contains: search,
      mode: 'insensitive' as const
    }
  } : {};

  const totalUsersInQuery = await prisma.user.count({ where: whereClause });
  const totalPages = Math.ceil(totalUsersInQuery / take);

  const usersRaw = await prisma.user.findMany({
    where: whereClause,
    take,
    skip,
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
    <UserAnalyticsClientDynamic
      users={users}
      totalLearners={totalLearners}
      totalTeachers={totalTeachers}
      totalAdmins={totalAdmins}
      currentPage={page}
      totalPages={totalPages}
      currentSearch={search}
    />
  );
}
