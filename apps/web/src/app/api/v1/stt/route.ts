import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import { enforceRateLimit, getRateLimitNumber, getRequestClientKey } from '@/lib/api/rate-limit'

/**
 * POST /api/v1/stt
 * 
 * Uses Groq Whisper (whisper-large-v3) to transcribe uploaded audio.
 * Expects multipart/form-data with a `file` field containing an audio file.
 */
export async function POST(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        
        const limited = enforceRateLimit(getRequestClientKey(req, auth.userId), {
            keyPrefix: 'web-stt',
            windowMs: getRateLimitNumber('WEB_STT_RATE_LIMIT_WINDOW_MS', 60_000),
            max: getRateLimitNumber('WEB_STT_RATE_LIMIT_MAX', 10),
        })
        if (limited) {
            return limited
        }
        
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const language = formData.get('language') as string | null || 'de'
        
        if (!file) {
            return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
        }

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ success: false, error: 'GROQ_API_KEY is not configured' }, { status: 500 })
        }
        
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        
        // Transcribe using Whisper on Groq
        const transcription = await groq.audio.transcriptions.create({
            file,
            model: "whisper-large-v3",
            prompt: language === 'de' ? "Das ist ein Sprechbeitrag auf Deutsch." : "",
            response_format: "json",
            language: language,
        });

        return NextResponse.json({ success: true, data: { transcript: transcription.text } })
    } catch (err: any) {
        console.error('[STT API] Error:', err)
        return handleApiError(err)
    }
}
