export default function ReadingExerciseLoading() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-6 animate-pulse">
            {/* Back button skeleton */}
            <div className="h-4 w-16 bg-gray-200 rounded mb-6" />

            {/* Intro card skeleton */}
            <div className="max-w-lg mx-auto rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
                {/* Mascot placeholder */}
                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4" />

                {/* Title */}
                <div className="h-6 w-3/4 bg-gray-200 rounded mx-auto mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 rounded mx-auto mb-6" />

                {/* Info pills */}
                <div className="flex justify-center gap-2 mb-6">
                    <div className="h-6 w-12 bg-gray-200 rounded-full" />
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                    <div className="h-6 w-24 bg-gray-100 rounded-full" />
                </div>

                {/* Strategy tip skeleton */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                </div>

                {/* Button skeleton */}
                <div className="h-12 w-full bg-gray-200 rounded-2xl" />
            </div>
        </div>
    )
}
