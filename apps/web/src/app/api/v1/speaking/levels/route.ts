import { NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'

export async function GET() {
    try {
        const levels = await prisma.speakingTopic.findMany({
            where: { status: 'PUBLISHED' },
            select: { cefrLevel: true },
            distinct: ['cefrLevel'],
            orderBy: { cefrLevel: 'asc' },
        })

        const cefrLevels = levels.map(l => l.cefrLevel)
        if (cefrLevels.length === 0) cefrLevels.push('A1')

        return NextResponse.json({ levels: cefrLevels })
    } catch (error) {
        console.error('[Speaking Levels API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch speaking levels' },
            { status: 500 }
        )
    }
}
