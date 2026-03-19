'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/config'

export default function RegisterPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // 1. Create Firebase user
            const credential = await createUserWithEmailAndPassword(
                getFirebaseAuth(),
                email,
                password
            )
            const idToken = await credential.user.getIdToken()

            // 2. Set auth cookie
            const cookieRes = await fetch('/api/auth/login', {
                method: 'GET',
                headers: { Authorization: `Bearer ${idToken}` },
            })

            if (!cookieRes.ok) {
                throw new Error(`Cookie set failed: ${cookieRes.status}`)
            }

            // 3. Register in our DB
            const registerRes = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName: name,
                    nativeLanguage: 'vi',
                    targetLevel: 'B1',
                }),
            })

            if (!registerRes.ok) {
                console.error('[Fuxie] Register API failed:', registerRes.status)
                // Non-critical — server-auth.ts will auto-provision as fallback
            }

            // 4. Go to dashboard
            router.push('/dashboard')
        } catch (err: unknown) {
            const code = (err as { code?: string })?.code
            const message = (err as { message?: string })?.message
            console.error('[Fuxie] Register error:', code, message)

            if (code === 'auth/email-already-in-use') {
                setError('Email này đã được sử dụng. Hãy đăng nhập thay vì đăng ký.')
            } else if (code === 'auth/weak-password') {
                setError('Mật khẩu quá yếu. Cần ít nhất 6 ký tự.')
            } else if (code === 'auth/invalid-email') {
                setError('Email không hợp lệ.')
            } else {
                setError('Đăng ký thất bại. Vui lòng thử lại.')
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
                        <Image
                            src="/mascot/core/fuxie-core-happy-wave.png"
                            alt="Fuxie"
                            width={48}
                            height={48}
                            className="object-contain"
                        />
                        <h1 className="text-4xl font-bold">Fuxie</h1>
                    </div>
                    <p className="mt-2 text-gray-500">Dein Abenteuer beginnt hier!</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 rounded-lg bg-incorrect/10 p-3 text-sm text-incorrect">
                        {error}
                    </div>
                )}

                {/* Register Form */}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                            Tên của bạn / Dein Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition-colors focus:border-fuxie-primary focus:outline-none focus:ring-2 focus:ring-fuxie-primary/20"
                            placeholder="z.B. Phuc"
                            required
                        />
                    </div>
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
                            placeholder="Mindestens 6 Zeichen"
                            minLength={6}
                            required
                        />
                    </div>

                    {/* CEFR Level badges */}
                    <div className="rounded-lg bg-gray-50 p-3">
                        <p className="mb-2 text-xs font-medium text-gray-500">Ziel-Niveau / Mục tiêu</p>
                        <div className="flex gap-2">
                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                                <span
                                    key={level}
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${level === 'B1'
                                        ? 'bg-fuxie-primary text-white'
                                        : 'bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {level}
                                </span>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-fuxie-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-fuxie-primary/90 disabled:opacity-50"
                    >
                        {loading ? 'Laden...' : 'Konto erstellen'}
                    </button>
                </form>

                {/* Login link */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Bereits ein Konto?{' '}
                    <a href="/login" className="font-medium text-fuxie-primary hover:underline">
                        Anmelden
                    </a>
                </p>
            </div>
        </main>
    )
}
