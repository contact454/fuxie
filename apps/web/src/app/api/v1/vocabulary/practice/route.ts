import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import { generateVocabularyPractice, VocabPracticeError, VOCAB_PRACTICE_TYPES } from '@/lib/vocabulary/practice'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

const querySchema = z.object({
    level: z.enum(VALID_LEVELS).default('A1'),
    theme: z.string(),
    type: z.enum(VOCAB_PRACTICE_TYPES).default('mc'),
    count: z.coerce.number().min(4).max(20).default(10),
})

/**
 * GET /api/v1/vocabulary/practice
 * Generate vocabulary exercise questions.
 */
export async function GET(req: NextRequest) {
    try {
        await withAuth(req)

        const params = Object.fromEntries(req.nextUrl.searchParams)
        const { level, theme, type, count } = querySchema.parse(params)
        const cookieStore = await cookies()
        const locale = cookieStore.get('NEXT_LOCALE')?.value || 'vi'

        const data = await generateVocabularyPractice({ level, theme, type, count, locale })

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error) {
        if (error instanceof VocabPracticeError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.status },
            )
        }

        return handleApiError(error)
    }
}
