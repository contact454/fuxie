import { prisma } from '@fuxie/database';
import AiCostsClient from './AiCostsClient';
import { subDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

const GEMINI_FLASH_COST_PER_MILLION = 0.15; // 0.15 USD per 1M tokens

export default async function AiCostsPage() {
  
  // 1. Get all-time totals
  const allTimeAgg = await prisma.aiConversation.aggregate({
    _sum: {
      totalTokensUsed: true
    }
  });

  const totalTokensAllTime = allTimeAgg._sum.totalTokensUsed || 0;
  const totalCostAllTime = (totalTokensAllTime / 1000000) * GEMINI_FLASH_COST_PER_MILLION;

  // 2. Calculate daily ingestion for the last 7 days
  const today = new Date();
  const chartData = [];

  for (let i = 6; i >= 0; i--) {
    const targetDate = subDays(today, i);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    const dailyAgg = await prisma.aiConversation.aggregate({
      where: {
        updatedAt: {
          gte: targetDate,
          lt: nextDate
        }
      },
      _sum: {
        totalTokensUsed: true
      }
    });

    const dailyTokens = dailyAgg._sum.totalTokensUsed || 0;
    
    chartData.push({
      date: format(targetDate, 'MMM dd'),
      tokens: dailyTokens,
      costUSD: (dailyTokens / 1000000) * GEMINI_FLASH_COST_PER_MILLION
    });
  }

  return (
    <AiCostsClient 
      totalTokensAllTime={totalTokensAllTime}
      totalCostAllTime={totalCostAllTime}
      chartData={chartData}
    />
  );
}
