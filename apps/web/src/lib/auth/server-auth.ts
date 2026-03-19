import { cache } from 'react'
import { cookies } from 'next/headers'
import { getTokens } from 'next-firebase-auth-edge'
import { prisma } from '@fuxie/database'
import { authConfig } from './config'

interface ServerUser {
    userId: string
    email: string
    firebaseUid: string
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
            select: { id: true, email: true, firebaseUid: true },
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
        }
    } catch (error) {
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
): Promise<{ id: string; email: string; firebaseUid: string } | null> {
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
                        nativeLanguage: 'vi',
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
            }
        })
    } catch (error) {
        console.error('[Fuxie] provisionUser failed:', error)
        return null
    }
}
