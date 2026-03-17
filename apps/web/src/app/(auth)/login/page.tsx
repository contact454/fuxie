'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/config'

export default function LoginPage() {
    return (
        <Suspense fallback={
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fuxie-primary/5 via-white to-fuxie-secondary/5">
                <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl animate-pulse">
                    <div className="h-12 w-32 mx-auto bg-gray-200 rounded mb-8" />
                    <div className="space-y-4">
                        <div className="h-10 bg-gray-200 rounded" />
                        <div className="h-10 bg-gray-200 rounded" />
                        <div className="h-10 bg-gray-200 rounded" />
                    </div>
                </div>
            </main>
        }>
            <LoginContent />
        </Suspense>
    )
}

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect') || '/dashboard'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    /**
     * Shared post-login flow:
     * 1. Set auth cookie via middleware endpoint
     * 2. Ensure user exists in DB (idempotent register)
     * 3. Redirect to dashboard
     */
    async function postLoginFlow(idToken: string, displayName: string): Promise<void> {
        // Set auth cookie
        const cookieRes = await fetch('/api/auth/login', {
            method: 'GET',
            headers: { Authorization: `Bearer ${idToken}` },
        })

        if (!cookieRes.ok) {
            throw new Error(`Cookie set failed: ${cookieRes.status}`)
        }

        // Ensure user exists in DB (idempotent — ignores if already exists)
        await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                displayName,
                nativeLanguage: 'vi',
                targetLevel: 'B1',
            }),
        }).catch(() => {
            // Non-critical — server-auth.ts will auto-provision as fallback
        })

        router.push(redirectTo)
    }

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const credential = await signInWithEmailAndPassword(
                getFirebaseAuth(),
                email,
                password
            )
            const idToken = await credential.user.getIdToken()
            await postLoginFlow(idToken, credential.user.displayName || 'Learner')
        } catch (err: unknown) {
            const code = (err as { code?: string })?.code
            console.error('[Fuxie] Login error:', code)

            if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                setError('Email hoặc mật khẩu không đúng.')
            } else if (code === 'auth/too-many-requests') {
                setError('Quá nhiều lần thử. Vui lòng đợi vài phút.')
            } else {
                setError('Đăng nhập thất bại. Vui lòng thử lại.')
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogleLogin() {
        setLoading(true)
        setError(null)

        try {
            const auth = getFirebaseAuth()
            const provider = new GoogleAuthProvider()
            provider.setCustomParameters({ prompt: 'select_account' })

            const credential = await signInWithPopup(auth, provider)
            const idToken = await credential.user.getIdToken()
            await postLoginFlow(idToken, credential.user.displayName || 'Learner')
        } catch (err: unknown) {
            const code = (err as { code?: string })?.code
            console.error('[Fuxie] Google Sign-In error:', code)

            if (code === 'auth/popup-closed-by-user') {
                setError('Popup đã bị đóng. Vui lòng thử lại.')
            } else if (code === 'auth/popup-blocked') {
                setError('Popup bị chặn. Vui lòng cho phép popup.')
            } else if (code === 'auth/unauthorized-domain') {
                setError('Domain chưa được cấp quyền trong Firebase.')
            } else if (code === 'auth/cancelled-popup-request') {
                // User clicked again before popup finished — ignore
            } else {
                setError('Đăng nhập Google thất bại. Vui lòng thử lại.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fuxie-primary/5 via-white to-fuxie-secondary/5">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <img
                            src="/mascot/core/fuxie-core-happy-wave.png"
                            alt="Fuxie"
                            width={48}
                            height={48}
                            className="object-contain"
                        />
                        <h1 className="text-4xl font-bold">Fuxie</h1>
                    </div>
                    <p className="mt-2 text-gray-500">Willkommen zurück!</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 rounded-lg bg-incorrect/10 p-3 text-sm text-incorrect">
                        {error}
                    </div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition-colors focus:border-fuxie-primary focus:outline-none focus:ring-2 focus:ring-fuxie-primary/20"
                            placeholder="dein@email.de"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                            Passwort
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition-colors focus:border-fuxie-primary focus:outline-none focus:ring-2 focus:ring-fuxie-primary/20"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-fuxie-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-fuxie-primary/90 disabled:opacity-50"
                    >
                        {loading ? 'Laden...' : 'Anmelden'}
                    </button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-sm text-gray-400">oder</span>
                    <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Google Sign-In */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09A6.97 6.97 0 0 1 5.84 9.9V7.07H2.18A11.97 11.97 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Mit Google anmelden
                </button>

                {/* Register link */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Noch kein Konto?{' '}
                    <a href="/register" className="font-medium text-fuxie-primary hover:underline">
                        Registrieren
                    </a>
                </p>
            </div>
        </main>
    )
}
