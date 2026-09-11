import { NextRequest, NextResponse } from 'next/server'
import { withDbAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import { completeSession } from '@/lib/session/attempt-service'
import { completeSchema } from '@/lib/session/schemas'

export async function POST(req: NextRequest) {
    try {
        const auth = await withDbAuth(req)
        const input = completeSchema.parse(await req.json())
        const receipt = await completeSession(auth.userId, input)
        return NextResponse.json({ success: true, data: { receipt } })
    } catch (err) {
        return handleApiError(err)
    }
}
