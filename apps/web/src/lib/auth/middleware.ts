import { NextRequest } from 'next/server'
import { getTokens } from 'next-firebase-auth-edge'
import { prisma, type UserRole } from '@fuxie/database'
import { authConfig } from './config'
import { DEV_AUTH_COOKIE, getDevAuthUser } from './dev-auth'

export class AuthError extends Error {
    constructor(message: string = 'Unauthorized') {
        super(message)
        this.name = 'AuthError'
    }
}

export class NotFoundError extends Error {
    constructor(message: string = 'Resource not found') {
        super(message)
        this.name = 'NotFoundError'
    }
}

/**
 * Verify Firebase token from request and return userId.
 * Use this in API Route Handlers.
 */
export async function withAuth(req: NextRequest): Promise<{ userId: string; email: string }> {
    const devUser = getDevAuthUser(
        req.cookies.get(DEV_AUTH_COOKIE)?.value ||
        req.headers.get('x-fuxie-dev-user')
    )
    if (devUser) {
        return {
            userId: devUser.firebaseUid,
            email: devUser.email,
        }
    }

    const tokens = await getTokens(req.cookies, authConfig)

    if (!tokens) {
        throw new AuthError('No valid authentication token found')
    }

    return {
        userId: tokens.decodedToken.uid,
        email: tokens.decodedToken.email ?? '',
    }
}

export async function withDbAuth(req: NextRequest): Promise<{
    userId: string
    firebaseUid: string
    email: string
    role: UserRole
}> {
    const auth = await withAuth(req)
    const user = await prisma.user.findFirst({
        where: {
            firebaseUid: auth.userId,
            deletedAt: null,
        },
        select: {
            id: true,
            firebaseUid: true,
            email: true,
            role: true,
        },
    })

    if (!user) {
        throw new NotFoundError('User not found')
    }

    return {
        userId: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email || auth.email,
        role: user.role,
    }
}
