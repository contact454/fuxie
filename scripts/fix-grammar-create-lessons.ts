import { PrismaClient, CefrLevel, ContentStatus } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

const p = new PrismaClient()
const ai = new GoogleGenerativeAI('AIzaSyA8jCaVXLsIQBU-_zXTO3I3c_1cB2wu3uc')

const TOPICS = [
  {
    slug: 'a1-g01-alphabet-aussprache',
    titleDe: 'Das Alphabet und die Aussprache',
    titleVi: 'Bảng chữ cái và phát âm',
    tags: ['alphabet', 'aussprache', 'phonetik', 'A1'],
    prompt: `German A1 topic: Das Alphabet und die Aussprache (The German Alphabet and Pronunciation).
Cover: 26 letters + Ä, Ö, Ü, ß. Pronunciation rules: W=/v/, V=/f/, Z=/ts/, Ch=/ç/ or /x/, Sch=/ʃ/, Sp/St at start=/ʃp//ʃt/.
Situation: Two people at a language cafe, one spelling their name.`
  },
  {
    slug: 'a1-g07-nomen-genus-plural',
    titleDe: 'Nomen: Genus und Plural',
    titleVi: 'Danh từ: Giống và Số nhiều',
    tags: ['nomen', 'genus', 'plural', 'maskulin', 'feminin', 'neutrum', 'A1'],
    prompt: `German A1 topic: Nomen: Genus und Plural (Nouns: Gender and Plural).
Cover: 3 genders (der/die/das), gender rules (endings: -ung=F, -chen=N, etc.), 5 plural forms (-e, -er, -en/-n, -s, Ø), Umlaut in plural. Capitalize all nouns.
Situation: Two friends shopping at a supermarket, discussing items and their genders.`
  },
  {
    slug: 'a1-g11-possessivpronomen',
    titleDe: 'Possessivpronomen',
    titleVi: 'Đại từ sở hữu',
    tags: ['possessivpronomen', 'mein', 'dein', 'sein', 'ihr', 'A1'],
    prompt: `German A1 topic: Possessivpronomen (Possessive Pronouns).
Cover: mein, dein, sein, ihr, sein, unser, euer, ihr, Ihr. Endings match ein/kein pattern. Nominativ + Akkusativ.
Situation: A family gathering where people introduce family members and talk about their things.`
  }
]

function buildEPrompt(topic: typeof TOPICS[0]) {
  return `You are a German language teaching expert creating an A1 grammar lesson.

Topic: ${topic.prompt}

Create an Einführung (Introduction) lesson with EXACTLY this JSON structure. Output ONLY valid JSON, no markdown.

{
  "theory": {
    "blocks": [
      {
        "type": "situation",
        "context_vi": "1-2 sentences setting the scene in Vietnamese",
        "scene_emoji": "one emoji",
        "dialogue": [
          { "speaker": "Name", "text_de": "German sentence", "text_vi": "Vietnamese translation" }
        ],
        "grammar_focus": "1-2 sentences highlighting the grammar pattern in Vietnamese"
      },
      {
        "type": "discovery",
        "question_vi": "A guiding question in Vietnamese to help students notice the pattern",
        "hints": ["hint1 in Vietnamese", "hint2"],
        "reveal_text_vi": "The answer explaining the pattern in Vietnamese"
      },
      {
        "type": "rule",
        "text_vi": "Clear explanation of the main rule in Vietnamese",
        "steps_vi": ["Step 1...", "Step 2...", "Step 3..."],
        "comparison_vi": "🇻🇳 Vietnamese comparison\\n🇩🇪 German comparison",
        "formula": "Grammar formula"
      },
      {
        "type": "paradigm_table",
        "title": "Table title in German",
        "headers": ["col1", "col2", "col3"],
        "rows": [["row1col1", "row1col2", "row1col3"]],
        "highlight_columns": [1]
      },
      {
        "type": "examples",
        "items": [
          { "de": "German sentence", "vi": "Vietnamese translation", "highlight": ["highlighted word"], "context_vi": "When to use this" }
        ]
      },
      {
        "type": "common_mistakes",
        "title_vi": "Lỗi người Việt hay mắc",
        "mistakes": [
          { "wrong": "❌ Wrong sentence", "correct": "✅ Correct sentence", "explanation_vi": "Why it's wrong in Vietnamese" }
        ]
      },
      {
        "type": "mnemonic",
        "text_vi": "Creative memory tip in Vietnamese",
        "visual_emoji": "🧠"
      },
      {
        "type": "key_takeaway",
        "text_vi": "Summary of the key points in Vietnamese (2-3 sentences)"
      }
    ]
  },
  "exercises": [
    {
      "id": "ex-01",
      "type": "multiple_choice",
      "scaffolding_level": 1,
      "difficulty": 1,
      "instruction_vi": "Instruction in Vietnamese",
      "stem": "Question sentence with ___",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation_vi": "Why this is correct",
      "tags": ["tag1"]
    }
  ]
}

REQUIREMENTS:
- Dialogue: 4-5 exchanges, natural and realistic
- Examples: 6-8 items with highlights
- Common mistakes: 3-4 realistic mistakes Vietnamese learners make
- Exercises: EXACTLY 10 exercises with these types in order:
  1-2: multiple_choice (scaffolding_level:1, difficulty:1-2)
  3: matching (pairs of 5 items)
  4-5: gap_fill_bank (with bank array of word choices)
  6-7: gap_fill_type (free typing, with answer array)
  8: error_spotting (sentence_words array, error_index, correct_word, correct_sentence)
  9: sentence_reorder (words array, correct_order array)
  10: multiple_choice (scaffolding_level:3, difficulty:4)
- ALL German must be grammatically perfect
- ALL Vietnamese must be natural
- Exercise difficulty increases from 1 to 4`
}

function buildVPrompt(topic: typeof TOPICS[0]) {
  return `You are a German language teaching expert. Create a Vertiefung (deep practice) lesson for A1 topic: ${topic.titleDe}.

Output ONLY valid JSON:
{
  "theory": {
    "blocks": [
      { "type": "key_takeaway", "text_vi": "Quick recap of core rules (3-4 bullet points in Vietnamese)" },
      { "type": "rule", "text_vi": "Advanced nuances or exceptions in Vietnamese", "note_vi": "Important note" }
    ]
  },
  "exercises": [10 exercises, more challenging than Einführung, types: gap_fill_type(3), gap_fill_bank(2), transformation(2), error_spotting(1), cloze(1), multiple_choice(1). difficulty 2-4, scaffolding_level 2-3]
}

Each exercise needs: id (ex-01 to ex-10), type, scaffolding_level, difficulty, instruction_vi, and type-specific fields. ALL German must be correct.`
}

function buildAPrompt(topic: typeof TOPICS[0]) {
  return `You are a German language teaching expert. Create an Anwendung (application) lesson for A1 topic: ${topic.titleDe}.

Output ONLY valid JSON:
{
  "theory": {
    "blocks": [
      { "type": "situation", "context_vi": "Real-world scenario description", "scene_emoji": "emoji", "dialogue": [{"speaker":"Name","text_de":"...","text_vi":"..."}], "grammar_focus": "How this grammar is used in real life" }
    ]
  },
  "exercises": [10 exercises, real-world application focus, types: cloze(2), transformation(2), gap_fill_type(3), error_spotting(1), sentence_reorder(1), multiple_choice(1). difficulty 3-4, scaffolding_level 3]
}

Each exercise needs: id (ex-01 to ex-10), type, scaffolding_level, difficulty, instruction_vi, and type-specific fields. ALL German must be grammatically perfect.`
}

async function generate(prompt: string, label: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  ⏳ Generating ${label}... (attempt ${attempt})`)
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const res = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 16000 }
      })
      const text = res.response.text() || ''
      const json = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(json)
      console.log(`  ✅ ${label} generated`)
      return parsed
    } catch (e: any) {
      console.log(`  ⚠️ Attempt ${attempt} failed: ${e.message?.slice(0, 100)}`)
      if (attempt === retries) throw e
      await new Promise(r => setTimeout(r, 2000))
    }
  }
}

async function main() {
  console.log('=== Creating lessons for 3 unique A1 topics ===\n')

  for (const topic of TOPICS) {
    console.log(`📚 ${topic.slug}`)

    const topicRecord = await p.grammarTopic.findFirst({ where: { slug: topic.slug } })
    if (!topicRecord) { console.log('  ❌ Topic not found!'); continue }

    // Generate E lesson
    const eData = await generate(buildEPrompt(topic), 'Einführung')
    await p.grammarLesson.create({
      data: {
        id: `${topic.slug}-01-E`,
        topicId: topicRecord.id,
        level: 'A1',
        lessonType: 'E',
        lessonNumber: 1,
        titleDe: `${topic.titleDe} — Einführung`,
        titleVi: `${topic.titleVi} — Giới thiệu`,
        estimatedMin: 12,
        tags: [...topic.tags, 'einfuehrung'],
        theoryJson: eData.theory,
        exercisesJson: eData.exercises,
        sortOrder: 1,
        status: 'PUBLISHED',
      }
    })
    console.log(`  ✅ E lesson created`)

    // Generate V lesson
    const vData = await generate(buildVPrompt(topic), 'Vertiefung')
    await p.grammarLesson.create({
      data: {
        id: `${topic.slug}-02-V`,
        topicId: topicRecord.id,
        level: 'A1',
        lessonType: 'V',
        lessonNumber: 2,
        titleDe: `${topic.titleDe} — Vertiefung`,
        titleVi: `${topic.titleVi} — Luyện sâu`,
        estimatedMin: 10,
        tags: [...topic.tags, 'vertiefung'],
        theoryJson: vData.theory,
        exercisesJson: vData.exercises,
        sortOrder: 2,
        status: 'PUBLISHED',
      }
    })
    console.log(`  ✅ V lesson created`)

    // Generate A lesson
    const aData = await generate(buildAPrompt(topic), 'Anwendung')
    await p.grammarLesson.create({
      data: {
        id: `${topic.slug}-03-A`,
        topicId: topicRecord.id,
        level: 'A1',
        lessonType: 'A',
        lessonNumber: 3,
        titleDe: `${topic.titleDe} — Anwendung`,
        titleVi: `${topic.titleVi} — Ứng dụng`,
        estimatedMin: 10,
        tags: [...topic.tags, 'anwendung'],
        theoryJson: aData.theory,
        exercisesJson: aData.exercises,
        sortOrder: 3,
        status: 'PUBLISHED',
      }
    })
    console.log(`  ✅ A lesson created\n`)
  }

  // Verify
  const check = await p.grammarTopic.findMany({
    where: { cefrLevel: 'A1' },
    include: { lessons: { select: { id: true, lessonType: true } } },
    orderBy: { sortOrder: 'asc' }
  })
  console.log('=== FINAL A1 STATUS ===')
  check.forEach(t => {
    const types = t.lessons.map(l => l.lessonType).sort().join(',')
    const ok = t.lessons.length >= 3
    console.log(`${ok ? '✅' : '❌'} ${t.slug} | ${t.lessons.length} lessons (${types})`)
  })

  await p.$disconnect()
}

main().catch(console.error)
