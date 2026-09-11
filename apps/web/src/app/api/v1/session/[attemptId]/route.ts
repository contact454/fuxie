import { NextRequest, NextResponse } from 'next/server'
import { withDbAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import { readSessionAttempt } from '@/lib/session/attempt-service'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ attemptId: string }> },
) {
    try {
        const auth = await withDbAuth(req)
        const { attemptId } = await params
        const data = await readSessionAttempt(auth.userId, attemptId)
        return NextResponse.json({ success: true, data })
    } catch (err) {
        return handleApiError(err)
    }
}
