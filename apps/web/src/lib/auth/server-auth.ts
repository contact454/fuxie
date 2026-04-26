import { cache } from 'react'
import { cookies } from 'next/headers'
import { getTokens } from 'next-firebase-auth-edge'
import { prisma } from '@fuxie/database'
import type { UserRole } from '@fuxie/database'
import { authConfig } from './config'

interface ServerUser {
    userId: string
    email: string
    firebaseUid: string
    role: UserRole
    uiLanguage: string
}

function isNextDynamicServerError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }

    const errorLike = error as { digest?: unknown; message?: unknown }
    const digest = typeof errorLike.digest === 'string' ? errorLike.digest : ''
    const message = error instanceof Error
        ? error.message
        : typeof errorLike.message === 'string'
            ? errorLike.message
            : ''

    return digest === 'DYNAMIC_SERVER_USAGE' ||
        message.includes('Dynamic server usage') ||
        message.includes("couldn't be rendered statically")
}

/**
 * Get authenticated user from Firebase cookie (for Server Components).
 * Auto-provisions a DB user if Firebase auth is valid but no DB record exists.
 *
 * Wrapped in React.cache() to deduplicate across layout.tsx + page.tsx
 * within the same server request (avoids 2× Firebase verify + 2× DB query).
 */
export const getServerUser = cache(async (): Promise<ServerUser | null> => {
    try {
        // 1. Verify Firebase token from cookies
        const cookieStore = await cookies()
        const tokens = await getTokens(cookieStore, authConfig)

        if (!tokens) {
            return null
        }

        const firebaseUid = tokens.decodedToken.uid
        const email = tokens.decodedToken.email ?? ''
        const displayName = tokens.decodedToken.name as string | undefined

        // 2. Look up user in DB
        let user = await prisma.user.findUnique({
            where: { firebaseUid },
            select: {
                id: true,
                email: true,
                firebaseUid: true,
                role: true,
                profile: {
                    select: {
                        uiLanguage: true,
                    },
                },
            },
        })

        // 3. Auto-provision if not found
        if (!user) {
            console.log(`[Fuxie] Auto-provisioning user: ${email} (${firebaseUid})`)
            user = await provisionUser(firebaseUid, email, displayName)
        }

        if (!user) {
            return null
        }

        return {
            userId: user.id,
            email: user.email,
            firebaseUid: user.firebaseUid,
            role: user.role,
            uiLanguage: user.profile?.uiLanguage ?? 'vi',
        }
    } catch (error) {
        if (isNextDynamicServerError(error)) {
            throw error
        }

        console.error('[Fuxie] getServerUser error:', error)
        return null
    }
})

/**
 * Create a new user with all required relations in a single transaction.
 */
async function provisionUser(
    firebaseUid: string,
    email: string,
    displayName?: string
): Promise<{
    id: string
    email: string
    firebaseUid: string
    role: UserRole
    profile: { uiLanguage: string } | null
} | null> {
    try {
        return await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    firebaseUid,
                    email,
                    role: 'LEARNER',
                    emailVerified: false,
                },
            })

            await Promise.all([
                tx.userProfile.create({
                    data: {
                        userId: newUser.id,
                        displayName: displayName ?? 'Learner',
                        uiLanguage: 'vi',
                        currentLevel: 'A1',
                        targetLevel: 'B1',
                    },
                }),
                tx.userSettings.create({
                    data: { userId: newUser.id },
                }),
                tx.userStreak.create({
                    data: { userId: newUser.id },
                }),
                tx.learningPath.create({
                    data: {
                        userId: newUser.id,
                        currentCefrLevel: 'A1',
                        targetCefrLevel: 'B1',
                    },
                }),
            ])

            return {
                id: newUser.id,
                email: newUser.email,
                firebaseUid: newUser.firebaseUid,
                role: newUser.role,
                profile: { uiLanguage: 'vi' },
            }
        })
    } catch (error) {
        console.error('[Fuxie] provisionUser failed:', error)
        return null
    }
}
