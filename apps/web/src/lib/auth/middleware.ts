import { NextRequest } from 'next/server'
import { getTokens } from 'next-firebase-auth-edge'
import { authConfig } from './config'

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
    const tokens = await getTokens(req.cookies, authConfig)

    if (!tokens) {
        throw new AuthError('No valid authentication token found')
    }

    return {
        userId: tokens.decodedToken.uid,
        email: tokens.decodedToken.email ?? '',
    }
}
