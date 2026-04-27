"use client";

import dynamic from "next/dynamic";
import { BrainCircuit, DollarSign, Activity } from "lucide-react";

interface ChartDataPoint {
  date: string;
  tokens: number;
  costUSD: number;
}

interface AiCostsClientProps {
  totalTokensAllTime: number;
  totalCostAllTime: number;
  chartData: ChartDataPoint[];
}

const AiCostsTrendChart = dynamic(() => import('./AiCostsTrendChart'), {
  ssr: false,
  loading: () => <div className="h-72 w-full rounded-xl bg-slate-50" />,
});

export default function AiCostsClient({ totalTokensAllTime, totalCostAllTime, chartData }: AiCostsClientProps) {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Compute & Usage</h1>
        <p className="text-slate-500 mt-1">Monitor Gemini/Gemma token ingestion and estimated financial impact.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-500">Total Tokens Processed</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">{totalTokensAllTime.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-500">Estimated Cost (USD)</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">${totalCostAllTime.toFixed(4)}</p>
          <p className="text-xs text-slate-400 mt-2">Based on Gemini Flash rate ($0.15/1M)</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">7-Day Ingestion Trend</h2>
        </div>
        <AiCostsTrendChart chartData={chartData} />
      </div>
    </div>
  );
}
