/**
 * Route-specific loading skeleton for the Vocabulary list page.
 */
export default function VocabularyLoading() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-6 animate-pulse">
            {/* Hero banner skeleton */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                <div className="flex gap-2 mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-10 w-14 rounded-xl bg-gray-100" />
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-orange-100" />
                    <div className="flex-1">
                        <div className="h-6 w-36 rounded-lg bg-gray-100 mb-2" />
                        <div className="h-3 w-24 rounded bg-gray-100" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-12 w-20 rounded-xl bg-gray-100" />
                        <div className="h-12 w-28 rounded-xl bg-orange-100" />
                    </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-gray-100" />
            </div>

            {/* Theme selector skeleton */}
            <div className="mb-6">
                <div className="h-3 w-24 rounded bg-gray-100 mb-3" />
                <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[110px] h-[110px] rounded-2xl bg-gray-100" />
                    ))}
                </div>
            </div>

            {/* Detail panel skeleton */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start gap-5">
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 shrink-0" />
                    <div className="flex-1">
                        <div className="h-6 w-40 rounded-lg bg-gray-100 mb-2" />
                        <div className="h-3 w-28 rounded bg-gray-100 mb-4" />
                        <div className="h-2.5 rounded-full bg-gray-100 mb-4" />
                        <div className="flex gap-3">
                            <div className="flex-1 h-11 rounded-xl bg-gray-100" />
                            <div className="flex-1 h-11 rounded-xl bg-orange-100" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
