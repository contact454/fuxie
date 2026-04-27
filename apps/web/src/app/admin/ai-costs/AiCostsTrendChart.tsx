"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartDataPoint {
  date: string;
  tokens: number;
  costUSD: number;
}

interface AiCostsTrendChartProps {
  chartData: ChartDataPoint[];
}

export default function AiCostsTrendChart({ chartData }: AiCostsTrendChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <Tooltip
            contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value) => [Number(value).toLocaleString(), "Tokens"]}
          />
          <Area type="monotone" dataKey="tokens" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
