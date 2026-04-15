export default function WritingExerciseLoading() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-5 w-48 bg-gray-200 rounded" />
                <div className="ml-auto h-6 w-10 bg-gray-200 rounded-lg" />
            </div>

            {/* Task card skeleton */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 mb-6">
                <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-100 rounded mb-1" />
                <div className="h-4 w-2/3 bg-gray-100 rounded" />
            </div>

            {/* Editor skeleton */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
                <div className="h-48 bg-gray-50 rounded-xl" />
                <div className="flex justify-between mt-4">
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                    <div className="h-10 w-28 bg-gray-200 rounded-xl" />
                </div>
            </div>
        </div>
    )
}
