import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@fuxie/database'
import { withGeminiFallback } from '@/lib/ai/gemini-fallback'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'

export async function POST(req: NextRequest) {
    try {
        const auth = await withAuth(req as any)
        const user = await getDbUserByFirebaseUid(auth.userId)
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
        }

        const { fullTranscript } = await req.json()
        if (!fullTranscript || fullTranscript.trim().length < 50) {
            return NextResponse.json({ success: true, message: 'Transcript too short to extract memory.' })
        }

        // Use Gemini to extract facts
        const prompt = `Analysiere das folgende Transkript eines Gesprächs zwischen einem Deutschschüler und seinem Tutor.
Extrahiere maximal 3 wichtige Fakten für das Langzeitgedächtnis über den Schüler (z.B. spezifische Grammatikfehler, Interessen, Hobbys, Berufsziele).
Gib NUR ein JSON-Array mit Strings zurück. Wenn es keine neuen wichtigen Fakten gibt, gib ein leeres Array [] zurück.

Beispielausgabe:
["Der Schüler interessiert sich für Fußball.", "Der Schüler hat Schwierigkeiten mit dem Dativ."]

Transkript:
${fullTranscript}`

        const memories = await withGeminiFallback(async (client) => {
            const model = client.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } })
            const response = await model.generateContent(prompt)
            const text = response.response.text()
            try {
                return JSON.parse(text) as string[]
            } catch {
                return []
            }
        })

        if (Array.isArray(memories) && memories.length > 0) {
            // 1. Generate Embeddings using Gemini
            const embeddings = await withGeminiFallback(async (client) => {
                const model = client.getGenerativeModel({ model: 'text-embedding-004' })
                const results = await Promise.all(memories.map(content => model.embedContent(content)))
                return results.map(r => r.embedding.values)
            })

            // 2. Save to database using executeRaw for pgvector
            const queries = memories.map((content, i) => {
                const vectorString = `[${embeddings[i].join(',')}]`
                return prisma.$executeRaw`
                    INSERT INTO user_chat_memories (id, "userId", content, embedding, "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), ${user.id}, ${content}, ${vectorString}::vector, NOW(), NOW())
                `
            })
            await prisma.$transaction(queries)
        }

        return NextResponse.json({ success: true, memoriesExtracted: memories?.length || 0 })
    } catch (error) {
        console.error('[Chat Memory API]', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
