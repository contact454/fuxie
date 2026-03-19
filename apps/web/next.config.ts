import type { NextConfig } from 'next'
import path from 'path'


const nextConfig: NextConfig = {
    typescript: {
        // TypeScript checks re-enabled: tsc --noEmit passes cleanly (0 errors)
        ignoreBuildErrors: false,
    },
    eslint: {
        // ESLint re-enabled: 0 errors with eslint-config-next v16 (flat config)
        ignoreDuringBuilds: false,
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
    // Rewrite /images/* to GCS, /audio/* to Cloudflare R2 in production
    async rewrites() {
        return [
            {
                source: '/images/:path*',
                destination: 'https://storage.googleapis.com/fuxie-images/images/:path*',
            },
            {
                source: '/audio/:path*',
                destination: 'https://pub-625435748a97403aae6db93258050afd.r2.dev/audio/:path*',
            },
        ]
    },
    // Fix COOP for Firebase signInWithPopup + CDN cache headers for static media
    async headers() {
        return [
            // COOP for Firebase popup auth
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups',
                    },
                ],
            },
            // GCS images — immutable, cache 1 year at Vercel Edge + browser
            {
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // Audio lessons — immutable, cache 1 year
            {
                source: '/audio/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // Mascot images — cache 30 days (may update occasionally)
            {
                source: '/mascot/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=2592000, stale-while-revalidate=86400',
                    },
                ],
            },
            // Grammar diagrams — immutable, cache 1 year
            {
                source: '/grammar/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ]
    },
}

export default nextConfig


