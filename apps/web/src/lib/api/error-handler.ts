import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthError, NotFoundError } from '@/lib/auth/middleware'

export function handleApiError(error: unknown): NextResponse {
    // Zod validation
    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
            },
            { status: 400 }
        )
    }

    // Auth error
    if (error instanceof AuthError) {
        return NextResponse.json(
            { success: false, error: { code: 'UNAUTHORIZED', message: error.message } },
            { status: 401 }
        )
    }

    // Not found
    if (error instanceof NotFoundError) {
        return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: error.message } },
            { status: 404 }
        )
    }

    if (hasHttpStatus(error)) {
        const status = Number(error.status)

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: status === 403 ? 'FORBIDDEN' : 'REQUEST_ERROR',
                    message: error instanceof Error ? error.message : 'Request failed',
                },
            },
            { status }
        )
    }

    // Prisma unique constraint
    if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
    ) {
        return NextResponse.json(
            { success: false, error: { code: 'CONFLICT', message: 'Resource already exists' } },
            { status: 409 }
        )
    }

    // Unknown
    console.error('[API Error]', error)
    return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
        { status: 500 }
    )
}

function hasHttpStatus(error: unknown): error is { status: number | string } {
    if (!error || typeof error !== 'object' || !('status' in error)) return false

    const status = Number((error as { status?: unknown }).status)
    return Number.isInteger(status) && status >= 400 && status < 600
}
