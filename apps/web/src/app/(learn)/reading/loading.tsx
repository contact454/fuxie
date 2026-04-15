/**
 * Route-specific loading skeleton for the Reading list page.
 */
export default function ReadingLoading() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-orange-100" />
                <div>
                    <div className="h-7 w-40 rounded-lg bg-gray-100 mb-2" />
                    <div className="h-3 w-56 rounded bg-gray-100" />
                </div>
            </div>

            {/* Level tabs */}
            <div className="flex gap-2 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 w-14 rounded-xl bg-gray-100" />
                ))}
            </div>

            {/* Text cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col h-40">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-6 w-3/4 rounded-lg bg-gray-100" />
                            <div className="w-10 h-10 rounded-full bg-gray-50 shrink-0" />
                        </div>
                        <div className="space-y-2 mt-auto">
                            <div className="h-3 w-full rounded bg-gray-100" />
                            <div className="h-3 w-5/6 rounded bg-gray-100" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
