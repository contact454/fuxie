"use client";

import React from "react";
import { 
  Users, 
  Activity, 
  Target, 
  AlertCircle
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AdminDashboardProps {
  totalUsers: number;
  dailyActive: number;
  writingPassRate: string;
  newFeedbacks: number;
  lineData: { name: string; DAU: number }[];
  pieData: { name: string; value: number }[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981'];

export default function AdminClientDashboard({
  totalUsers,
  dailyActive,
  writingPassRate,
  newFeedbacks,
  lineData,
  pieData
}: AdminDashboardProps) {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
        <p className="text-slate-500 mt-1">Nắm bắt nhịp đập học tập của Fuxie ngay hôm nay.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Users", value: totalUsers.toLocaleString(), trend: "Live Metric", icon: Users, isPositive: true },
          { title: "Daily Active Users", value: dailyActive.toLocaleString(), trend: "Today", icon: Activity, isPositive: true },
          { title: "Writing Pass Rate", value: writingPassRate, trend: "Overall System", icon: Target, isPositive: parseFloat(writingPassRate) > 50 },
          { title: "New Feedbacks", value: newFeedbacks.toLocaleString(), trend: "Unresolved", icon: AlertCircle, isNeutral: newFeedbacks > 0, isPositive: newFeedbacks === 0 },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">{kpi.value}</p>
              <p className={`mt-1 text-sm font-medium ${
                kpi.isPositive ? 'text-emerald-600' : 
                kpi.isNeutral ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {kpi.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-6">Trưởng trưởng DAU (7 Ngày)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} allowDecimals={false} />
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
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-slate-900 mb-2">Trình độ học viên</h2>
          <p className="text-sm text-slate-500 mb-6">Phân bổ mục tiêu CEFR hiện tại</p>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-2xl font-bold text-slate-900">{totalUsers.toLocaleString()}</span>
              <span className="text-xs text-slate-500">Người dùng</span>
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

    </div>
  );
}
