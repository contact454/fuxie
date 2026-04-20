"use client";

import React, { useState } from "react";
import { ShieldCheck, UserCheck, AlertTriangle } from "lucide-react";

export default function OpsClient() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("TEACHER");
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const res = await fetch('/api/v1/admin/users/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to mutate role.");
      }
      
      setStatus({ type: 'success', message: `Successfully elevated ${email} to ${role}.` });
      setEmail("");
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Operations</h1>
        <p className="text-slate-500 mt-1">Manage infrastructure, API integrations, and access roles.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Elevate Access Role</h2>
        </div>

        <form onSubmit={handlePromote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Account Email</label>
            <input 
              type="email" 
              required
              placeholder="e.g. employee@fuxie.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Authorization Level</label>
            <select 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="TEACHER">Pedagogy / Teacher</option>
              <option value="ADMIN">System Administrator</option>
              <option value="LEARNER">Demote to Learner</option>
            </select>
          </div>

          {status.type && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {status.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              {status.message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-2 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Commit Role Mutation"}
          </button>
        </form>
      </div>

    </div>
  );
}
