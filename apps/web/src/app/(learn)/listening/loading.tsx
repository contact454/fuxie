/**
 * Route-specific loading skeleton for the Listening list page.
 */
export default function ListeningLoading() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-teal-100" />
                <div>
                    <div className="h-7 w-36 rounded-lg bg-gray-100 mb-2" />
                    <div className="h-3 w-48 rounded bg-gray-100" />
                </div>
            </div>

            {/* Level tabs */}
            <div className="flex gap-2 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 w-14 rounded-xl bg-gray-100" />
                ))}
            </div>

            {/* Lesson cards */}
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0" />
                        <div className="flex-1">
                            <div className="h-4 w-48 rounded bg-gray-100 mb-2" />
                            <div className="h-3 w-32 rounded bg-gray-100" />
                        </div>
                        <div className="h-8 w-20 rounded-lg bg-teal-100" />
                    </div>
                ))}
            </div>
        </div>
    )
}
