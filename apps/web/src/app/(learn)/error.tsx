'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LearnError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const router = useRouter()

    useEffect(() => {
        console.error('[Learn] Unhandled error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Etwas ist schiefgelaufen
                </h2>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut oder kehre zur Startseite zurück.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
                    >
                        Startseite
                    </button>
                    <button
                        onClick={reset}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#004E89] to-blue-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-200 transition-all"
                    >
                        Erneut versuchen
                    </button>
                </div>

                {/* Error digest for debugging */}
                {error.digest && (
                    <p className="mt-6 text-[10px] text-gray-300 font-mono">
                        Fehler-ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    )
}
