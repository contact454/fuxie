import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Target, UserRound } from 'lucide-react'
import { prisma } from '@fuxie/database'

import { PrimaryCta } from '@/components/ui/primary-cta'
import {
    isSlice3VisualQaFixture,
    Slice3ProfileSuccessFixture,
} from '@/components/visual-fixtures/slice-3-motivation-fixtures'
import { getServerUser } from '@/lib/auth/server-auth'

export const metadata = {
    title: 'Fuxie - Profile',
    description: 'Learner profile and personal study goals.',
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ state?: string; fixture?: string }> }) {
    const visualParams = await searchParams
    if (isSlice3VisualQaFixture(visualParams, 'success')) {
        return <Slice3ProfileSuccessFixture />
    }

    const user = await getServerUser()
    if (!user) redirect('/login')

    const profile = await prisma.userProfile.findUnique({
        where: { userId: user.userId },
        select: {
            displayName: true,
            currentLevel: true,
            targetLevel: true,
            targetExam: true,
            studyGoalMinutes: true,
            totalXp: true,
            totalWordsLearned: true,
        },
    })

    const displayName = profile?.displayName ?? 'Learner'
    const currentLevel = profile?.currentLevel ?? 'A1'
    const targetLevel = profile?.targetLevel ?? 'B1'
    const targetExam = profile?.targetExam ?? 'GOETHE'
    const studyGoalMinutes = profile?.studyGoalMinutes ?? 15

    return (
        <main className="min-h-[100dvh] bg-[var(--fuxie-blue-50)] px-4 py-6 text-slate-900">
            <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="rounded-[24px] border border-white/70 bg-white p-5 shadow-lg shadow-sky-900/10">
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--fuxie-blue-50)] text-2xl font-black text-[color:var(--color-text-brand)]">
                        {displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <h1 className="mt-4 break-words text-3xl font-black">{displayName}</h1>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                        {currentLevel} to {targetLevel} - {targetExam}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                            {profile?.totalXp ?? 0} XP
                        </span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            {profile?.totalWordsLearned ?? 0} words
                        </span>
                    </div>
                </aside>

                <div className="space-y-5">
                    <section className="rounded-[24px] border border-white/70 bg-white p-5 shadow-lg shadow-sky-900/10">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-50 text-sky-700">
                                <Target className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-sm font-bold text-slate-500">Study goal</p>
                                <h2 className="text-xl font-black">{studyGoalMinutes} minutes per day</h2>
                            </div>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {[
                                ['Current level', currentLevel],
                                ['Target level', targetLevel],
                                ['Exam target', targetExam],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-xs font-black uppercase tracking-normal text-slate-500">
                                        {label}
                                    </p>
                                    <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <PrimaryCta asChild>
                                <Link href="/onboarding">Ziel bearbeiten</Link>
                            </PrimaryCta>
                            <PrimaryCta asChild variant="secondary">
                                <Link href="/dashboard">Dashboard</Link>
                            </PrimaryCta>
                        </div>
                    </section>

                    <section className="rounded-[24px] border border-white/70 bg-white p-5 shadow-md shadow-sky-900/10">
                        <div className="flex items-center gap-3">
                            <UserRound className="h-5 w-5 text-slate-500" aria-hidden="true" />
                            <p className="text-sm font-black text-slate-900">Profile settings</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Goal editing currently routes through onboarding so learners keep the same
                            level, exam, and daily-time flow in one place.
                        </p>
                    </section>
                </div>
            </section>
        </main>
    )
}
