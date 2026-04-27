import { prisma } from '@fuxie/database';
import AiCostsClient from './AiCostsClient';
import { startOfDay, subDays, format } from 'date-fns';
import { cacheWrap } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

const GEMINI_FLASH_COST_PER_MILLION = 0.15; // 0.15 USD per 1M tokens

export default async function AiCostsPage() {
  const {
    totalTokensAllTime,
    totalCostAllTime,
    chartData,
  } = await cacheWrap('admin:ai-costs:v1', 30, getAiCostsData);

  return (
    <AiCostsClient
      totalTokensAllTime={totalTokensAllTime}
      totalCostAllTime={totalCostAllTime}
      chartData={chartData}
    />
  );
}

async function getAiCostsData() {
  const todayStart = startOfDay(new Date());
  const sevenDaysAgo = subDays(todayStart, 6);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);

  const [allTimeAgg, recentConversations] = await Promise.all([
    prisma.aiConversation.aggregate({
      _sum: {
        totalTokensUsed: true
      }
    }),
    prisma.aiConversation.findMany({
      where: {
        updatedAt: {
          gte: sevenDaysAgo,
          lt: tomorrowStart,
        },
      },
      select: {
        updatedAt: true,
        totalTokensUsed: true,
      },
    }),
  ]);

  const totalTokensAllTime = allTimeAgg._sum.totalTokensUsed || 0;
  const totalCostAllTime = (totalTokensAllTime / 1000000) * GEMINI_FLASH_COST_PER_MILLION;
  const tokensByDay = new Map<string, number>();

  for (const conversation of recentConversations) {
    const key = conversation.updatedAt.toISOString().slice(0, 10);
    tokensByDay.set(key, (tokensByDay.get(key) ?? 0) + conversation.totalTokensUsed);
  }

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const targetDate = subDays(todayStart, 6 - index);
    const dailyTokens = tokensByDay.get(targetDate.toISOString().slice(0, 10)) ?? 0;

    return {
      date: format(targetDate, 'MMM dd'),
      tokens: dailyTokens,
      costUSD: (dailyTokens / 1000000) * GEMINI_FLASH_COST_PER_MILLION,
    };
  });

  return {
    totalTokensAllTime,
    totalCostAllTime,
    chartData,
  };
}
