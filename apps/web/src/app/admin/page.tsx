import { prisma } from '@fuxie/database';
import AdminClientDashboard from './AdminClientDashboard';
import { startOfDay, subDays, format } from 'date-fns';

// Mark as dynamic since we are querying database in real-time
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  
  // 1. Total Users
  const totalUsers = await prisma.user.count();

  // 2. Daily Active Users (Today)
  const todayStart = startOfDay(new Date());
  const dailyActive = await prisma.dailyActivity.count({
    where: {
      date: {
        gte: todayStart
      }
    }
  });

  // 3. New Feedbacks
  const newFeedbacks = await prisma.contentFeedback.count({
    where: {
      isResolved: false
    }
  });

  // 4. Writing Pass Rate
  const writingAttempts = await prisma.writingAttempt.findMany({
    select: { percentScore: true }
  });
  let passCount = 0;
  writingAttempts.forEach(att => {
    if ((att.percentScore || 0) >= 0.5) passCount++;
  });
  const writingPassRate = writingAttempts.length > 0 
    ? Math.round((passCount / writingAttempts.length) * 100) + "%"
    : "N/A";

  // 5. CEFR Pie Data Breakdown
  const userProfiles = await prisma.userProfile.groupBy({
    by: ['currentLevel'],
    _count: {
      currentLevel: true
    }
  });
  
  const pieData = userProfiles.map(group => ({
    name: group.currentLevel,
    value: group._count.currentLevel
  })).sort((a, b) => a.name.localeCompare(b.name));

  // Fallback if no data
  if (pieData.length === 0) {
    pieData.push({ name: 'A1', value: 0 });
  }

  // 6. DAU Line Graph (Last 7 Days)
  const lineData = [];
  for (let i = 6; i >= 0; i--) {
    const targetDate = subDays(todayStart, i);
    const count = await prisma.dailyActivity.count({
      where: {
        date: targetDate
      }
    });

    lineData.push({
      name: format(targetDate, 'EEE'), // e.g. "Mon", "Tue"
      DAU: count
    });
  }

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
