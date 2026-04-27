"use client";

import React from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AdminDashboardChartsProps {
  totalUsers: number;
  lineData: { name: string; DAU: number }[];
  pieData: { name: string; value: number }[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981'];

export default function AdminDashboardCharts({
  totalUsers,
  lineData,
  pieData,
}: AdminDashboardChartsProps) {
  const lineChartRef = React.useRef<HTMLDivElement>(null);
  const pieChartRef = React.useRef<HTMLDivElement>(null);
  const [lineChartWidth, setLineChartWidth] = React.useState(0);
  const [pieChartWidth, setPieChartWidth] = React.useState(0);

  React.useEffect(() => {
    const observers: ResizeObserver[] = [];

    const observe = (
      node: HTMLDivElement | null,
      setWidth: React.Dispatch<React.SetStateAction<number>>
    ) => {
      if (!node) return;

      const updateWidth = () => {
        setWidth(Math.max(0, Math.floor(node.getBoundingClientRect().width)));
      };
      const observer = new ResizeObserver(updateWidth);
      observer.observe(node);
      observers.push(observer);
      updateWidth();
    };

    observe(lineChartRef.current, setLineChartWidth);
    observe(pieChartRef.current, setPieChartWidth);

    return () => {
      for (const observer of observers) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-6">DAU growth, last 7 days</h2>
        <div ref={lineChartRef} className="h-[300px] min-h-[300px] w-full min-w-0">
          {lineChartWidth > 0 ? (
            <LineChart width={lineChartWidth} height={300} data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="DAU"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <div className="h-full w-full rounded-xl bg-slate-50" />
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Learner levels</h2>
        <p className="text-sm text-slate-500 mb-6">Current CEFR target distribution</p>
        <div ref={pieChartRef} className="relative h-[250px] min-h-[250px] w-full min-w-0">
          {pieChartWidth > 0 ? (
            <PieChart width={pieChartWidth} height={250}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          ) : (
            <div className="h-full w-full rounded-xl bg-slate-50" />
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
            <span className="text-2xl font-bold text-slate-900">{totalUsers.toLocaleString()}</span>
            <span className="text-xs text-slate-500">Users</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {pieData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-xs text-slate-600 font-medium truncate" title={entry.name}>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
