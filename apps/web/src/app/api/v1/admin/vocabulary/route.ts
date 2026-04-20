import { NextResponse } from 'next/server';
import { prisma, WordType, Gender } from '@fuxie/database';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const result = await prisma.vocabularyItem.create({
      data: {
        word: data.term_de,
        wordLower: data.term_de.toLowerCase(),
        article: data.gender === "none" ? null : data.gender.toUpperCase() as Gender,
        wordType: data.gender === "none" ? WordType.VERB : WordType.NOUN, // Simplification
        cefrLevel: data.cefrLevel,
        translations: {
          vi: data.term_vi,
          meaning: data.meaning,
          exampleDe: data.exampleDe,
          exampleVi: data.exampleVi
        }
      }
    });

    return NextResponse.json({ success: true, item: result }, { status: 201 });
  } catch (error: any) {
    console.error("Vocabulary insert error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
