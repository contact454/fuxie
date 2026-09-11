import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withDbAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import { readSessionAttempt } from '@/lib/session/attempt-service'

const attemptIdSchema = z.string().uuid()

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ attemptId: string }> },
) {
    try {
        const auth = await withDbAuth(req)
        const { attemptId: rawAttemptId } = await params
        const attemptId = attemptIdSchema.parse(rawAttemptId)
        const data = await readSessionAttempt(auth.userId, attemptId)
        return NextResponse.json({ success: true, data })
    } catch (err) {
        return handleApiError(err)
    }
}
