"use client"

import React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  BookOpen,
  Clock3,
  GraduationCap,
  ShieldAlert,
  TrendingDown,
  Users,
} from "lucide-react"

interface LearningSummary {
  learnerCount: number
  activeLast7Days: number
  atRiskCount: number
  highRiskCount: number
  averageMinutes7d: number
  pendingAssignments: number
}

interface WeakSkillRow {
  skill: string
  label: string
  averageScorePercent: number
  learnerCount: number
  below60RatePercent: number
}

interface BottleneckRow {
  exerciseId: string
  topic: string | null
  cefrLevel: string | null
  teilName: string | null
  totalAttempts: number
  averageScorePercent: number
}

interface ClassroomRow {
  id: string
  name: string
  cefrLevel: string
  teacherName: string
  studentCount: number
  atRiskCount: number
  highRiskCount: number
  averageCompletionRate: number
  overdueAssignments: number
}

interface RiskLearnerRow {
  id: string
  displayName: string
  email: string
  currentLevel: string
  totalXp: number
  level: "low" | "medium" | "high"
  reasons: string[]
  inactiveDays: number | null
  recentMinutes7d: number
  pendingAssignments: number
  weakestSkills: string[]
}

interface LearningClientProps {
  summary: LearningSummary
  weakSkills: WeakSkillRow[]
  bottlenecks: BottleneckRow[]
  topClassrooms: ClassroomRow[]
  topRiskLearners: RiskLearnerRow[]
}

function RiskBadge({ level }: { level: RiskLearnerRow["level"] }) {
  const styles =
    level === "high"
      ? "bg-rose-100 text-rose-700"
      : level === "medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700"

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {level.toUpperCase()}
    </span>
  )
}

export default function LearningClient({
  summary,
  weakSkills,
  bottlenecks,
  topClassrooms,
  topRiskLearners,
}: LearningClientProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Learning Health</h1>
        <p className="mt-1 text-slate-500">
          Track system-wide learner risk, weak skills, classroom health, and writing bottlenecks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: "Learners",
            value: summary.learnerCount,
            icon: Users,
            tone: "text-sky-600 bg-sky-50",
          },
          {
            label: "Active in 7 days",
            value: summary.activeLast7Days,
            icon: GraduationCap,
            tone: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "At-risk learners",
            value: summary.atRiskCount,
            icon: AlertTriangle,
            tone: "text-amber-600 bg-amber-50",
          },
          {
            label: "High-risk learners",
            value: summary.highRiskCount,
            icon: ShieldAlert,
            tone: "text-rose-600 bg-rose-50",
          },
          {
            label: "Avg minutes / 7 days",
            value: summary.averageMinutes7d,
            icon: Clock3,
            tone: "text-violet-600 bg-violet-50",
          },
          {
            label: "Pending assignments",
            value: summary.pendingAssignments,
            icon: BookOpen,
            tone: "text-slate-700 bg-slate-100",
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-3 inline-flex rounded-lg p-2 ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              <div className="text-sm text-slate-500">{card.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{"Weak skill trends" /* // locale-allow */}</h2>
              <p className="text-sm text-slate-500">{"Latest assessment signal by skill across learners." /* // locale-allow */}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-medium">Skill</th>
                  <th className="px-6 py-4 font-medium">Average</th>
                  <th className="px-6 py-4 font-medium">Learners</th>
                  <th className="px-6 py-4 font-medium">Below 60%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {weakSkills.map((skill) => (
                  <tr key={skill.skill}>
                    <td className="px-6 py-4 font-medium text-slate-900">{skill.label}</td>
                    <td className="px-6 py-4">
                      <span className={skill.averageScorePercent < 60 ? "font-semibold text-rose-600" : "font-semibold text-slate-900"}>
                        {skill.averageScorePercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4">{skill.learnerCount}</td>
                    <td className="px-6 py-4">{skill.below60RatePercent}%</td>
                  </tr>
                ))}
                {weakSkills.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Not enough assessment data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{"Top at-risk learners" /* // locale-allow */}</h2>
              <p className="text-sm text-slate-500">{"Learners with weak momentum or multiple pressure" /* // locale-allow */} signals.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {topRiskLearners.map((learner) => (
              <Link
                key={learner.id}
                href={`/teacher/students/${learner.id}`}
                className="block px-6 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium text-slate-900">{learner.displayName}</div>
                      <RiskBadge level={learner.level} />
                    </div>
                    <div className="truncate text-sm text-slate-500">{learner.email}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{learner.currentLevel}</span>
                      <span>{learner.recentMinutes7d} min / 7d</span>
                      <span>{learner.pendingAssignments} pending</span>
                      {learner.inactiveDays != null && <span>{learner.inactiveDays} inactive days</span>}
                    </div>
                    {(learner.reasons.length > 0 || learner.weakestSkills.length > 0) && (
                      <div className="mt-2 text-xs text-slate-500">
                        {learner.reasons.slice(0, 2).join(" | ")}
                        {learner.weakestSkills.length > 0 && (
                          <span className="ml-2 text-rose-600">
                            Weak: {learner.weakestSkills.join(", ")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">{learner.totalXp.toLocaleString()} XP</div>
                  </div>
                </div>
              </Link>
            ))}
            {topRiskLearners.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500">{"No at-risk learners flagged." /* // locale-allow */}</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Writing bottlenecks</h2>
              <p className="text-sm text-slate-500">{"Exercises with the weakest average AI score." /* // locale-allow */}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-medium">Exercise</th>
                  <th className="px-6 py-4 font-medium">Level</th>
                  <th className="px-6 py-4 font-medium">Attempts</th>
                  <th className="px-6 py-4 font-medium">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {bottlenecks.map((row) => (
                  <tr key={row.exerciseId}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{row.exerciseId}</div>
                      <div className="text-xs text-slate-500">
                        {[row.teilName, row.topic].filter(Boolean).join(" | ") || "Writing task"}
                      </div>
                    </td>
                    <td className="px-6 py-4">{row.cefrLevel || "-"}</td>
                    <td className="px-6 py-4">{row.totalAttempts}</td>
                    <td className="px-6 py-4 font-semibold text-rose-600">{row.averageScorePercent}%</td>
                  </tr>
                ))}
                {bottlenecks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No writing bottlenecks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{"Classrooms needing attention" /* // locale-allow */}</h2>
              <p className="text-sm text-slate-500">{"Classes with concentrated risk and weak completion." /* // locale-allow */}</p>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {topClassrooms.map((classroom) => (
              <Link
                key={classroom.id}
                href={`/teacher/classrooms/${classroom.id}`}
                className="block px-6 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900">{classroom.name}</div>
                    <div className="text-sm text-slate-500">
                      {classroom.teacherName} | {classroom.cefrLevel} | {classroom.studentCount} learners
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{classroom.atRiskCount} at risk</span>
                      <span>{classroom.highRiskCount} high risk</span>
                      <span>{classroom.overdueAssignments} overdue</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">{classroom.averageCompletionRate}%</div>
                    <div className="text-xs text-slate-500">completion</div>
                  </div>
                </div>
              </Link>
            ))}
            {topClassrooms.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500">{"No classroom risk signal yet." /* // locale-allow */}</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
