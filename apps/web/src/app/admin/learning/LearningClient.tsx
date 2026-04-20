"use client";

import React from "react";
import { BookOpen, AlertTriangle, TrendingDown } from "lucide-react";

interface BottleneckRow {
  exerciseId: string;
  totalAttempts: number;
  averageScorePercent: number;
}

export default function LearningClient({ bottlenecks }: { bottlenecks: BottleneckRow[] }) {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Learning Progress</h1>
        <p className="text-slate-500 mt-1">Identify curriculum bottlenecks and student struggle points.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col mt-6">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Highest Failure Rates (Writing)</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Exercise ID</th>
                <th className="px-6 py-4">Total Submissions</th>
                <th className="px-6 py-4">Average AI Score</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {bottlenecks.map((row) => (
                <tr key={row.exerciseId} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium font-mono text-slate-900">{row.exerciseId}</td>
                  <td className="px-6 py-4">{row.totalAttempts}</td>
                  <td className="px-6 py-4 font-mono text-rose-600 font-bold">
                    {(row.averageScorePercent * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 font-semibold text-xs w-max">
                      <TrendingDown className="w-3 h-3" />
                      Needs Review
                    </span>
                  </td>
                </tr>
              ))}
              {bottlenecks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No bottleneck data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
