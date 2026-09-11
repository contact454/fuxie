import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withDbAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import { checkSessionAnswer } from '@/lib/session/attempt-service'
import { checkSchema } from '@/lib/session/schemas'

const attemptIdSchema = z.string().uuid()

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ attemptId: string }> },
) {
    try {
        const auth = await withDbAuth(req)
        const { attemptId: rawAttemptId } = await params
        const attemptId = attemptIdSchema.parse(rawAttemptId)
        const input = checkSchema.parse(await req.json())
        const data = await checkSessionAnswer(auth.userId, attemptId, input)
        return NextResponse.json({ success: true, data })
    } catch (err) {
        return handleApiError(err)
    }
}
