import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth/server-auth'
import { getOpsSummary } from '@/lib/observability/ops-summary'

export const dynamic = 'force-dynamic'

export async function GET() {
    const user = await getServerUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const summary = await getOpsSummary()
    return NextResponse.json({ success: true, data: summary })
}
