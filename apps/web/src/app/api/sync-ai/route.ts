import { NextResponse } from 'next/server';
import { prisma } from '@fuxie/database';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

async function syncLevel(level: string) {
    // Navigate from apps/web/.next/... to /content
    const CONTENT_DIR = path.join(process.cwd(), '../../content');
    const listeningDir = path.join(CONTENT_DIR, level, 'listening');

    if (!fs.existsSync(listeningDir)) {
        return { error: `Dir not found: ${listeningDir}` };
    }

    const files = fs.readdirSync(listeningDir).filter(f => f.endsWith('.json'));
    let updatedLessons = 0;
    let totalQuestions = 0;

    for (const file of files) {
        const filePath = path.join(listeningDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        const lesson = await prisma.listeningLesson.findUnique({
            where: { lessonId: data.id }
        });

        if (!lesson) continue;

        await prisma.listeningQuestion.deleteMany({
            where: { lessonId: lesson.id }
        });

        if (!data.questions || !Array.isArray(data.questions)) continue;

        const prismaQuestions = data.questions.map((q: any, i: number) => {
            let optionsArray: string[] = [];
            let correctAns = q.answer;

            if (q.type === 'mc_abc' && q.options) {
                optionsArray = [`a) ${q.options.a}`, `b) ${q.options.b}`, `c) ${q.options.c}`];
            } else if (q.type === 'richtig_falsch' || q.type === 'ja_nein') {
                if (q.type === 'richtig_falsch') {
                     optionsArray = ['Richtig', 'Falsch'];
                     correctAns = q.answer === 'richtig' ? 'a' : 'b';
                } else {
                     optionsArray = ['Ja', 'Nein'];
                     correctAns = q.answer === 'ja' ? 'a' : 'b';
                }
            } else {
                 if (q.options) optionsArray = Object.values(q.options);
            }

            return {
                lessonId: lesson.id,
                questionNumber: i + 1,
                questionType: q.type,
                questionText: q.question || q.statement || `Frage ${i+1}`,
                questionTextVi: "",
                options: optionsArray,
                correctAnswer: correctAns,
                explanation: q.explanation?.de || '',
                explanationVi: q.explanation?.vi || '',
                sortOrder: i + 1
            };
        });

        if (prismaQuestions.length > 0) {
            await prisma.listeningQuestion.createMany({ data: prismaQuestions });
            updatedLessons++;
            totalQuestions += prismaQuestions.length;
        }
    }

    return { level, updatedLessons, totalQuestions };
}

export async function GET() {
    try {
        const results = await Promise.all([
            syncLevel('a1'),
            syncLevel('a2'),
            syncLevel('b1'),
            syncLevel('b2')
        ]);
        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || e });
    }
}
