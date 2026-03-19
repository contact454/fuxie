/**
 * Dashboard skeleton loading components for Suspense boundaries.
 * Show animated pulse placeholders while data loads.
 */

export function StatsSkeleton() {
    return (
        <div className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="relative overflow-hidden rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-gray-100 animate-pulse"
                >
                    <div className="h-3 w-16 rounded bg-gray-200 mb-3" />
                    <div className="h-8 w-20 rounded bg-gray-200 mb-2" />
                    <div className="h-2.5 w-28 rounded bg-gray-100" />
                </div>
            ))}
        </div>
    )
}

export function ContentSkeleton() {
    return (
        <>
            {/* CEFR + Weekly chart row */}
            <div className="mb-6 grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-pulse">
                    <div className="h-3 w-32 rounded bg-gray-200 mb-4" />
                    <div className="flex items-center gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gray-200" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 h-2.5 w-full rounded-full bg-gray-100" />
                    <div className="mt-4 grid grid-cols-4 gap-3">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="rounded-xl bg-gray-50 p-2.5 h-14" />
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-pulse">
                    <div className="h-3 w-28 rounded bg-gray-200 mb-4" />
                    <div className="flex items-end gap-1.5 h-32">
                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex items-end justify-center h-24">
                                    <div
                                        className="w-full max-w-8 rounded-t-md bg-gray-200"
                                        style={{ height: `${20 + Math.random() * 60}%` }}
                                    />
                                </div>
                                <div className="h-2 w-6 rounded bg-gray-100" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Skills + Actions + Achievements row */}
            <div className="grid gap-4 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-pulse">
                        <div className="h-3 w-20 rounded bg-gray-200 mb-4" />
                        <div className="space-y-3">
                            {[0, 1, 2, 3].map((j) => (
                                <div key={j}>
                                    <div className="h-3 w-24 rounded bg-gray-200 mb-1.5" />
                                    <div className="h-2 w-full rounded-full bg-gray-100" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
