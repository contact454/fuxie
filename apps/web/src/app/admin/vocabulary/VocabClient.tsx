"use client";

import React, { useState } from "react";
import { BookPlus, CheckCircle, Database } from "lucide-react";

export default function VocabClient() {
  const [formData, setFormData] = useState({
    themeId: "general", // dummy default
    cefrLevel: "A1",
    term_vi: "",
    term_de: "",
    gender: "das",
    meaning: "",
    exampleDe: "",
    exampleVi: ""
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/v1/admin/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to insert into database");
      
      setStatus("Successfully added to vocabulary database!");
      setFormData(prev => ({ ...prev, term_vi: "", term_de: "", meaning: "", exampleDe: "", exampleVi: "" })); // reset form
    } catch (e: any) {
      if (typeof window !== "undefined") window.alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Content Management</h1>
        <p className="text-slate-500 mt-1">Add new vocabulary directly to the production curriculum.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <BookPlus className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Insert Vocabulary Term</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CEFR Level</label>
              <select className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={formData.cefrLevel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, cefrLevel: e.target.value })}>
                <option value="A1">A1</option><option value="A2">A2</option>
                <option value="B1">B1</option><option value="B2">B2</option>
                <option value="C1">C1</option><option value="C2">C2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender (Article)</label>
              <select className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={formData.gender} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="der">Der (Masc)</option>
                <option value="die">Die (Fem)</option>
                <option value="das">Das (Neut)</option>
                <option value="none">None (Verb/Adj)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">German Word</label>
              <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="e.g. Apfel" value={formData.term_de} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, term_de: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vietnamese Translation</label>
              <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g. quả táo" value={formData.term_vi} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, term_vi: e.target.value })} />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Meaning Context (Optional)</label>
             <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g. used for eating" value={formData.meaning} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, meaning: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">German Example Sentence</label>
              <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg font-serif" placeholder="e.g. Ich esse einen Apfel." value={formData.exampleDe} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, exampleDe: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vietnamese Example Sentence</label>
              <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg font-serif" placeholder="e.g. Tôi ăn một quả táo." value={formData.exampleVi} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, exampleVi: e.target.value })} />
            </div>
          </div>

          {status && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {status}
            </div>
          )}

          <button type="submit" disabled={loading} className="mt-4 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            <Database className="w-4 h-4" />
            {loading ? "Writing to Database..." : "Publish to Course"}
          </button>
        </form>
      </div>
    </div>
  );
}
