"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, CheckCircle, MailWarning } from "lucide-react";

interface FeedbackRow {
  id: string;
  comment: string;
  rating: number;
  aiSentiment: string | null;
  targetType: string;
  createdAt: Date;
  user: { email: string };
}

export default function FeedbackClient({ feedbacks }: { feedbacks: FeedbackRow[] }) {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Feedback Center</h1>
        <p className="text-slate-500 mt-1">{"Resolve outstanding issues reported by students." /* // locale-allow */}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col mt-6">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <MailWarning className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Unresolved Tickets</h2>
        </div>
        
        <div className="divide-y divide-slate-200">
          {feedbacks.map(fb => (
            <div key={fb.id} className="p-6 hover:bg-slate-50 flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className={`p-2 rounded-full ${fb.aiSentiment === 'NEGATIVE' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900">{fb.user.email}</span>
                  <span className="text-slate-400 text-sm">•</span>
                  <span className="text-slate-500 text-sm font-medium">{fb.targetType}</span>
                  <span className="text-slate-400 text-sm">•</span>
                  <span className="text-slate-400 text-sm text-right">
                    {formatDistanceToNow(new Date(fb.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-slate-700 mt-2">{fb.comment}</p>
                <div className="mt-4 flex gap-3">
                  <button className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          ))}

          {feedbacks.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              Hooray! No pending feedback tickets.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
