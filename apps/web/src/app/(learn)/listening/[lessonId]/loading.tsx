export default function ListeningLessonLoading() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse">
            {/* Header: progress bar + level badge */}
            <div className="flex items-center gap-4 mb-6">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full" />
                <div className="h-6 w-10 bg-gray-200 rounded-lg" />
            </div>

            {/* Audio player skeleton */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="flex-1">
                        <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-32 bg-gray-100 rounded" />
                    </div>
                </div>
                {/* Waveform placeholder */}
                <div className="h-16 bg-gray-50 rounded-xl mb-3" />
                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200" />
                </div>
            </div>

            {/* Question skeleton */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
                <div className="h-5 w-full bg-gray-200 rounded mb-6" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 w-full bg-gray-100 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    )
}
