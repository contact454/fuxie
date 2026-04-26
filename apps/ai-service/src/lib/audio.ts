import { parseGeminiJson } from './parse-json.js'
import { getModel } from './gemini.js'

const DEFAULT_GCP_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'

let cachedToken: { token: string; expiresAt: number } | null = null

export interface TtsRequest {
    text: string
    lang?: string
    speed?: number
}

export interface PronunciationRequest {
    audioBase64: string
    mimeType: string
    referenceText: string
    level?: string
    exerciseType?: string
    uiLanguage?: string
}

export async function synthesizeSpeech(input: TtsRequest) {
    const text = input.text.trim()
    if (!text) {
        throw new Error('text is required')
    }

    const speed = input.speed ?? 1
    if (speed < 0.5 || speed > 2) {
        throw new Error('speed must be between 0.5 and 2.0')
    }

    const accessToken = await getAccessToken()
    const ttsRes = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: { text },
            voice: getVoiceConfig(input.lang ?? 'de'),
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: speed,
                pitch: 0,
            },
        }),
    })

    if (!ttsRes.ok) {
        throw new Error(`TTS request failed with status ${ttsRes.status}`)
    }

    const payload = (await ttsRes.json()) as { audioContent?: string }
    const audioBase64 = payload.audioContent
    if (typeof audioBase64 !== 'string' || !audioBase64) {
        throw new Error('TTS response did not include audioContent')
    }

    return {
        audioBase64,
        mimeType: 'audio/mpeg',
        text,
        lang: input.lang ?? 'de',
        speed,
    }
}

export async function evaluatePronunciation(input: PronunciationRequest) {
    if (!input.audioBase64) throw new Error('audioBase64 is required')
    if (!input.referenceText.trim()) throw new Error('referenceText is required')

    const level = input.level ?? 'A1'
    const exerciseType = input.exerciseType ?? 'nachsprechen'
    const uiLanguage = input.uiLanguage ?? 'vi'

    const prompt = `You are a strict German pronunciation coach for CEFR ${level}.
Exercise type: ${exerciseType}
Expected text: "${input.referenceText}"
Interface language: ${uiLanguage}

Tasks:
1. Transcribe exactly what is spoken.
2. Score pronunciation from 0 to 100.
3. Provide short feedback in ${uiLanguage}.
4. Return up to 5 issues.

Return JSON only:
{
  "transcript": "...",
  "score": 0,
  "feedbackNative": "...",
  "issues": [
    { "word": "...", "issueVi": "...", "tip": "..." }
  ]
}`

    const model = getModel('gemini-3-flash-preview')
    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: input.audioBase64,
                mimeType: input.mimeType || 'audio/webm',
            },
        },
    ])

    const parsed = parseGeminiJson<{
        transcript?: string
        score?: number
        feedbackNative?: string
        issues?: Array<{ word?: string; issueVi?: string; tip?: string }>
    }>(result.response.text())

    return {
        transcript: parsed.transcript ?? '',
        score: typeof parsed.score === 'number' ? parsed.score : 0,
        feedbackNative: parsed.feedbackNative ?? '',
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    }
}

async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
        return cachedToken.token
    }

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!raw) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set')
    }

    let serviceAccount: {
        client_email: string
        private_key: string
    }

    try {
        serviceAccount = JSON.parse(raw)
    } catch {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON')
    }

    const header = { alg: 'RS256', typ: 'JWT' }
    const now = Math.floor(Date.now() / 1000)
    const payload = {
        iss: serviceAccount.client_email,
        scope: DEFAULT_GCP_SCOPE,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    }

    const { createSign } = await import('node:crypto')
    const encode = (obj: Record<string, unknown>) =>
        Buffer.from(JSON.stringify(obj)).toString('base64url')

    const unsignedJwt = `${encode(header)}.${encode(payload)}`
    const signer = createSign('RSA-SHA256')
    signer.update(unsignedJwt)
    const signature = signer.sign(serviceAccount.private_key, 'base64url')
    const jwt = `${unsignedJwt}.${signature}`

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })

    if (!tokenRes.ok) {
        throw new Error(`Token exchange failed with status ${tokenRes.status}`)
    }

    const tokenData = (await tokenRes.json()) as {
        access_token?: string
        expires_in?: number
    }
    if (!tokenData.access_token || typeof tokenData.expires_in !== 'number') {
        throw new Error('Token exchange response is missing access_token or expires_in')
    }
    cachedToken = {
        token: tokenData.access_token,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
    }

    return cachedToken.token
}

function getVoiceConfig(lang: string) {
    switch (lang) {
        case 'en':
        case 'en-US':
            return { languageCode: 'en-US', name: 'en-US-Neural2-F', ssmlGender: 'FEMALE' }
        case 'vi':
        case 'vi-VN':
            return { languageCode: 'vi-VN', name: 'vi-VN-Wavenet-A', ssmlGender: 'FEMALE' }
        case 'de':
        case 'de-DE':
        default:
            return { languageCode: 'de-DE', name: 'de-DE-Wavenet-C', ssmlGender: 'FEMALE' }
    }
}
