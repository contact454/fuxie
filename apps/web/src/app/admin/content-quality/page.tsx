import dashboardData from '@/data/content-quality/content-quality-dashboard-data.json'
import learningOutcomeMap from '@/data/content-quality/learning-outcome-map.json'

export const dynamic = 'force-static'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const SKILLS = ['vocabulary', 'grammar', 'reading', 'listening', 'writing', 'speaking'] as const

export default function AdminContentQualityPage() {
  const { summary, transcriptParity, spotCheckSamples, pilotPack } = dashboardData
  const sourceReadyRate = transcriptParity.totalListening > 0
    ? Math.round((transcriptParity.sourceReadyCount / transcriptParity.totalListening) * 100)
    : 0

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Content Quality</h1>
        <p className="text-slate-500 mt-1">Release-candidate view for learning content, QA metadata, transcript parity, and pilot readiness.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Content Files" value={summary.totalFiles.toLocaleString()} detail="Scanned JSON records" tone="indigo" />
        <MetricCard title="QA Metadata" value={summary.cefrAuditCount.toLocaleString()} detail="Files with CEFR audit" tone="emerald" />
        <MetricCard title="Learning Outcomes" value={summary.learningOutcomeTotal.toLocaleString()} detail="Can-do statements mapped" tone="sky" />
        <MetricCard title="Source Transcript Parity" value={`${sourceReadyRate}%`} detail={`${transcriptParity.sourceReadyCount}/${transcriptParity.totalListening} source scripts found`} tone={sourceReadyRate === 100 ? 'emerald' : 'amber'} />
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Coverage By CEFR</h2>
          <p className="text-sm text-slate-500">Files, audits, outcomes, and skill distribution by level.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Level</th>
                <th className="px-4 py-3 text-right font-medium">Files</th>
                <th className="px-4 py-3 text-right font-medium">Audits</th>
                <th className="px-4 py-3 text-right font-medium">Outcomes</th>
                {SKILLS.map((skill) => (
                  <th key={skill} className="px-4 py-3 text-right font-medium capitalize">{skill}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LEVELS.map((level) => {
                const row = summary.byLevel[level]
                return (
                  <tr key={level} className="text-slate-700">
                    <td className="px-4 py-3 font-semibold text-slate-900">{level}</td>
                    <td className="px-4 py-3 text-right">{row.files}</td>
                    <td className="px-4 py-3 text-right">{row.cefrAudit}</td>
                    <td className="px-4 py-3 text-right">{row.learningOutcomes}</td>
                    {SKILLS.map((skill) => (
                      <td key={skill} className="px-4 py-3 text-right">{row.skills[skill]}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900">Academic Spot-Check Queue</h2>
          <p className="text-sm text-slate-500 mt-1">60 deterministic samples, 10 per CEFR level.</p>
          <div className="mt-4 space-y-3">
            {spotCheckSamples.slice(0, 8).map((sample) => (
              <div key={`${sample.level}-${sample.id}`} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{sample.id}</p>
                  <p className="text-xs text-slate-500">{sample.level} / {sample.skill}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">{sample.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900">Personalized Path Readiness</h2>
          <p className="text-sm text-slate-500 mt-1">Learning outcomes are mapped for future recommendation logic.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricMini label="Outcome entries" value={learningOutcomeMap.outcomes.length.toLocaleString()} />
            <MetricMini label="Routing rules" value={learningOutcomeMap.nextStepRules.length.toLocaleString()} />
            <MetricMini label="Pilot sessions" value={pilotPack.sessions.length.toLocaleString()} />
            <MetricMini label="Survey prompts" value={pilotPack.surveyQuestions.length.toLocaleString()} />
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ title, value, detail, tone }: { title: string; value: string; detail: string; tone: 'indigo' | 'emerald' | 'sky' | 'amber' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
      <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${colors[tone]}`}>{detail}</p>
    </div>
  )
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}
