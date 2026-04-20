"use client";

import React from "react";
import { BrainCircuit, DollarSign, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <Tooltip 
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [Number(value).toLocaleString(), "Tokens"]}
              />
              <Area type="monotone" dataKey="tokens" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
