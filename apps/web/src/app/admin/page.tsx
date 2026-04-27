import { prisma } from '@fuxie/database';
import AdminClientDashboard from './AdminClientDashboard';
import { startOfDay, subDays, format } from 'date-fns';
import { cacheWrap } from '@/lib/cache/redis';

// Mark as dynamic since we are querying database in real-time
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const {
    totalUsers,
    dailyActive,
    writingPassRate,
    newFeedbacks,
    lineData,
    pieData,
  } = await cacheWrap('admin:dashboard:v1', 30, getAdminDashboardData);

  return (
    <AdminClientDashboard
      totalUsers={totalUsers}
      dailyActive={dailyActive}
      writingPassRate={writingPassRate}
      newFeedbacks={newFeedbacks}
      lineData={lineData}
      pieData={pieData}
    />
  );
}

async function getAdminDashboardData() {
  const todayStart = startOfDay(new Date());
  const sevenDaysAgo = subDays(todayStart, 6);

  const [
    totalUsers,
    newFeedbacks,
    writingAttemptCount,
    writingPassCount,
    userProfiles,
    dailyActivityGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.contentFeedback.count({ where: { isResolved: false } }),
    prisma.writingAttempt.count(),
    prisma.writingAttempt.count({ where: { percentScore: { gte: 0.5 } } }),
    prisma.userProfile.groupBy({
      by: ['currentLevel'],
      _count: { currentLevel: true },
    }),
    prisma.dailyActivity.groupBy({
      by: ['date'],
      where: { date: { gte: sevenDaysAgo } },
      _count: { _all: true },
    }),
  ]);

  const writingPassRate = writingAttemptCount > 0
    ? Math.round((writingPassCount / writingAttemptCount) * 100) + "%"
    : "N/A";

  const pieData = userProfiles.map(group => ({
    name: group.currentLevel,
    value: group._count.currentLevel,
  })).sort((a, b) => a.name.localeCompare(b.name));

  if (pieData.length === 0) {
    pieData.push({ name: 'A1', value: 0 });
  }

  const dailyCounts = new Map(
    dailyActivityGroups.map(group => [group.date.toISOString().slice(0, 10), group._count._all]),
  );

  const lineData = Array.from({ length: 7 }, (_, index) => {
    const targetDate = subDays(todayStart, 6 - index);
    return {
      name: format(targetDate, 'EEE'),
      DAU: dailyCounts.get(targetDate.toISOString().slice(0, 10)) ?? 0,
    };
  });

  const dailyActive = lineData[lineData.length - 1]?.DAU ?? 0;

  return {
    totalUsers,
    dailyActive,
    writingPassRate,
    newFeedbacks,
    lineData,
    pieData,
  };
}
