export default function LearnLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="text-center">
                {/* Animated Fuxie loader */}
                <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#004E89] animate-spin" />
                    <span className="absolute inset-0 flex items-center justify-center text-2xl">🦊</span>
                </div>

                <p className="text-gray-400 text-sm font-medium animate-pulse">
                    Wird geladen...
                </p>
            </div>
        </div>
    )
}
