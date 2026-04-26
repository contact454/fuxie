import { NextResponse } from 'next/server';
import { prisma, WordType, Gender, CefrLevel } from '@fuxie/database';
import { z } from 'zod';
import { getServerUser } from '@/lib/auth/server-auth';

const vocabularySchema = z.object({
  cefrLevel: z.nativeEnum(CefrLevel),
  term_de: z.string().trim().min(1).max(120),
  term_vi: z.string().trim().min(1).max(240),
  gender: z.enum(['der', 'die', 'das', 'none']),
  meaning: z.string().trim().max(1000).optional().default(''),
  exampleDe: z.string().trim().max(1000).optional().default(''),
  exampleVi: z.string().trim().max(1000).optional().default(''),
});

const genderMap: Record<z.infer<typeof vocabularySchema>['gender'], Gender | null> = {
  der: Gender.MASKULIN,
  die: Gender.FEMININ,
  das: Gender.NEUTRUM,
  none: null,
};

export async function POST(request: Request) {
  try {
    const serverUser = await getServerUser();
    if (!serverUser || !['ADMIN', 'TEACHER', 'CONTENT_CREATOR'].includes(serverUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = vocabularySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join('; ') }, { status: 400 });
    }

    const data = parsed.data;
    const article = genderMap[data.gender];

    const result = await prisma.vocabularyItem.create({
      data: {
        word: data.term_de,
        wordLower: data.term_de.toLowerCase(),
        article,
        wordType: article ? WordType.NOMEN : WordType.VERB,
        cefrLevel: data.cefrLevel,
        translations: {
          vi: data.term_vi,
          meaning: data.meaning,
          exampleDe: data.exampleDe,
          exampleVi: data.exampleVi
        }
      },
      select: {
        id: true,
        word: true,
        article: true,
        wordType: true,
        cefrLevel: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, item: result }, { status: 201 });
  } catch (error: unknown) {
    console.error("Vocabulary insert error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
