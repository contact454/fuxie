"use client";

import React from "react";
import { format } from "date-fns";
import { Users, UserPlus, ShieldAlert, GraduationCap } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  profile: {
    currentLevel: string;
    totalXp: number;
    displayName: string | null;
  } | null;
}

interface UserAnalyticsClientProps {
  users: UserRow[];
  totalLearners: number;
  totalTeachers: number;
  totalAdmins: number;
}

export default function UserAnalyticsClient({
  users,
  totalLearners,
  totalTeachers,
  totalAdmins
}: UserAnalyticsClientProps) {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Analytics</h1>
        <p className="text-slate-500 mt-1">Directory and segmentation of all Fuxie platform accounts.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Total Learners", value: totalLearners, icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
          { title: "Active Teachers", value: totalTeachers, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Administrators", value: totalAdmins, icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Users (Top 50)</h2>
          <button className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">CEFR Level</th>
                <th className="px-6 py-4">Total XP</th>
                <th className="px-6 py-4 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div>{user.profile?.displayName || "N/A"}</div>
                    <div className="text-slate-500 text-xs font-normal">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider
                      ${user.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 
                        user.role === 'TEACHER' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-indigo-100 text-indigo-700'}
                    `}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm">
                      {user.profile?.currentLevel || 'A1'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">
                    {user.profile?.totalXp?.toLocaleString() || "0"} XP
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">
                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No users found in database.
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
