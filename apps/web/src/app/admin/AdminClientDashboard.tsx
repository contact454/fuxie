"use client";

import dynamic from "next/dynamic";
import {
  Activity,
  AlertCircle,
  Target,
  Users,
} from "lucide-react";

interface AdminDashboardProps {
  totalUsers: number;
  dailyActive: number;
  writingPassRate: string;
  newFeedbacks: number;
  lineData: { name: string; DAU: number }[];
  pieData: { name: string; value: number }[];
}

const AdminDashboardCharts = dynamic(() => import('./AdminDashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-[348px] bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="h-4 w-48 rounded bg-slate-100 mb-6" />
        <div className="h-[300px] rounded-xl bg-slate-50" />
      </div>
      <div className="h-[348px] bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="h-4 w-40 rounded bg-slate-100 mb-3" />
        <div className="h-3 w-56 max-w-full rounded bg-slate-100 mb-6" />
        <div className="h-[250px] rounded-xl bg-slate-50" />
      </div>
    </div>
  ),
});

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
        <p className="text-slate-500 mt-1">{"Nam bat nhip dap hoc tap cua Fuxie ngay hom nay." /* // locale-allow */}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Users", value: totalUsers.toLocaleString(), trend: "Live Metric", icon: Users, isPositive: true },
          { title: "Daily Active Users", value: dailyActive.toLocaleString(), trend: "Today", icon: Activity, isPositive: true },
          { title: "Writing Pass Rate", value: writingPassRate, trend: "Overall System", icon: Target, isPositive: parseFloat(writingPassRate) > 50 },
          { title: "New Feedbacks", value: newFeedbacks.toLocaleString(), trend: "Unresolved", icon: AlertCircle, isNeutral: newFeedbacks > 0, isPositive: newFeedbacks === 0 },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
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

      <AdminDashboardCharts totalUsers={totalUsers} lineData={lineData} pieData={pieData} />
    </div>
  );
}
