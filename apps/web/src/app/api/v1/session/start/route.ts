import { NextRequest, NextResponse } from 'next/server'
import { withDbAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import { startSession } from '@/lib/session/attempt-service'
import { startSchema } from '@/lib/session/schemas'

export async function POST(req: NextRequest) {
    try {
        const auth = await withDbAuth(req)
        const input = startSchema.parse(await req.json())
        const data = await startSession(auth.userId, input)
        return NextResponse.json({ success: true, data })
    } catch (err) {
        return handleApiError(err)
    }
}
