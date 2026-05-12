/**
 * Route-specific loading skeleton for the Writing list page.
 */
export default function WritingLoading() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-[#CCE4F0]" />
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

            {/* Writing topics grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
                        <div className="flex-1">
                            <div className="h-5 w-3/4 rounded-lg bg-gray-100 mb-2" />
                            <div className="h-3 w-1/2 rounded bg-gray-100" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex-shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    )
}
