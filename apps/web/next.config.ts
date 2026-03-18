import type { NextConfig } from 'next'
import path from 'path'


const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Required for monorepo: trace files from packages/ for Prisma engine
    outputFileTracingRoot: path.join(__dirname, '../../'),
    transpilePackages: [
        '@fuxie/shared',
        '@fuxie/database',
        '@fuxie/srs-engine',
        '@fuxie/ui',
    ],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
        ],
    },
    // Expose env vars to both server and edge runtimes
    // (needed because Turbopack in monorepo may not inline NEXT_PUBLIC_ vars automatically)
    env: {
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        AUTH_COOKIE_SECRET: process.env.AUTH_COOKIE_SECRET,
    },
    // Rewrite /images/* to GCS in production (audio served directly from public/)
    async rewrites() {
        return [
            {
                source: '/images/:path*',
                destination: 'https://storage.googleapis.com/fuxie-images/images/:path*',
            },
        ]
    },
    // Fix COOP for Firebase signInWithPopup
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups',
                    },
                ],
            },
        ]
    },
}

export default nextConfig


