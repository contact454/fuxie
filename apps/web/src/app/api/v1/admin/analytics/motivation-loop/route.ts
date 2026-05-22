import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerUser } from '@/lib/auth/server-auth'
import { getMotivationLoopReadout } from '@/lib/analytics/motivation-loop-readout'

const motivationLoopQuerySchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(req: NextRequest) {
    const serverUser = await getServerUser()
    if (!serverUser || serverUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = motivationLoopQuerySchema.safeParse({
        from: req.nextUrl.searchParams.get('from'),
        to: req.nextUrl.searchParams.get('to'),
    })
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Query params from and to must use YYYY-MM-DD' },
            { status: 400 },
        )
    }

    const from = startOfDay(parsed.data.from)
    const to = endOfDay(parsed.data.to)

    if (from.getTime() > to.getTime()) {
        return NextResponse.json(
            { error: 'from must be before or equal to to' },
            { status: 400 },
        )
    }

    const readout = await getMotivationLoopReadout({ from, to })

    return NextResponse.json({ success: true, data: readout })
}

function startOfDay(value: string) {
    return new Date(`${value}T00:00:00.000Z`)
}

function endOfDay(value: string) {
    return new Date(`${value}T23:59:59.999Z`)
}
