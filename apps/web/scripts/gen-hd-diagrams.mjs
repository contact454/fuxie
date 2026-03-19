/**
 * HD Grammar Diagram Generator — Gemini API
 * Generates 1024×1024 diagrams for A1 topics
 * Usage: node gen-hd-diagrams.mjs [topicSlug]
 */
import fs from 'fs'
import { execSync } from 'child_process'

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDJ8tesOkLOjxNItDkLfjuz0LJRkNy63EM'
const MODEL = 'gemini-2.5-flash-image'
const OUT_DIR = '/Users/huynhngocphuc/Dev-Workspace/Active-Projects/9-Fuxie/apps/web/public/images/grammar/a1'
const DELAY_MS = 3000

// ─── A1 Diagram Prompts ─────────────────────────
const DIAGRAMS = {
  'a1_praesens_table': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German Präsens conjugation table.
Title: "Bảng chia Präsens"

A neat hand-drawn table with columns and rows:
Header row: Ngôi | Đuôi | lernen | spielen | wohnen
Row 1: ich | -e | lerne | spiele | wohne
Row 2: du | -st | lernst | spielst | wohnst
Row 3: er/sie/es | -t | lernt | spielt | wohnt
Row 4: wir | -en | lernen | spielen | wohnen
Row 5: ihr | -t | lernt | spielt | wohnt
Row 6: sie/Sie | -en | lernen | spielen | wohnen

The "Đuôi" column endings highlighted in color.
Small blue Fuxie fox mascot in corner (MUST be blue, not orange).
Excalidraw hand-drawn style. ALL text must be EXACTLY as shown. Do NOT misspell any words.`,

  'a1_praesens_mnemonic': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

Mnemonic for German Präsens verb endings: "eSTeN!"

Center: Large colorful text "eSTeN!" with each letter a different color.

Around it, 6 items with arrows from center:
ich → -E
du → -ST
er/sie/es → -T
wir → -EN (IMPORTANT: wir is -EN, not -T!)
ihr → -T
sie/Sie → -EN

Bottom note: "Đuôi 'ihr' giống 'er' (-t), 'sie/Sie' giống 'wir' (-en)"

Small blue Fuxie fox (MUST be blue). Excalidraw hand-drawn style.
CRITICAL: wir ending is -EN. Do NOT write -T for wir. ALL text exactly as specified.`,

  'a1_sein_haben_rule': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German sein and haben conjugation comparison.
Title: "sein & haben" with subtitle "là/ở & có"

LEFT column (blue border, light blue fill): "sein (là/ở)"
ich → bin
du → bist  
er/sie/es → ist (red circle: bất quy tắc!)
wir → sind
ihr → seid
sie/Sie → sind

RIGHT column (green border, light green fill): "haben (có)"
ich → habe
du → hast
er/sie/es → hat (red circle: bất quy tắc!)  
wir → haben
ihr → habt
sie/Sie → haben

CRITICAL: "ihr → seid" NOT "sed". "ich → habe" NOT "hast".
Small blue Fuxie fox (MUST be blue, not orange). Excalidraw hand-drawn style.`,

  'a1_sein_haben_table': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

Conjugation table for sein and haben.
Title: "Chia sein và haben"

A hand-drawn table:
Header: Ngôi | sein (là/ở) | haben (có)
ich | bin | habe
du | bist | hast
er/sie/es | ist | hat
wir | sind | haben
ihr | seid | habt
sie/Sie | sind | haben

Highlight "ist" and "hat" in the table (irregular forms).
Small blue Fuxie fox. Excalidraw hand-drawn style.
ALL text must be EXACTLY as shown. "ihr" row is "seid" and "habt".`,

  'a1_sein_haben_mnemonic': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

Mnemonic for sein and haben conjugation with music theme.

LEFT side with musical notes: "BiBI iSt SeiSei" mnemonic
Bi → Bin (ich)
Bi → Bist (du)
iSt → Ist (er/sie/es)
Sei → Sind (wir)
Sei → Seid (ihr)
→ Sind (sie/Sie)

RIGHT side with laughing emoji: "HaHaHa HaHaHa" mnemonic
Ha → Habe (ich)
Ha → Hast (du)
Ha → Hat (er/sie/es)
Ha → Haben (wir)
Ha → Habt (ihr)
Ha → Haben (sie/Sie)

IMPORTANT: haben starts with HABE for ich, not Hast.
Small blue Fuxie fox saying "BiBI iSt SeiSei!" Excalidraw hand-drawn style.`,

  'a1_artikel_rule': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German articles: der, die, das — Rules.
Title: "German articles: der, die, das"

Four colored boxes side by side:

Box 1 (blue border): "Maskulin" with ♂ symbol
der (bestimmt) / ein (unbestimmt)
Examples: der Tisch, der Stuhl
Small table/chair drawings

Box 2 (pink border): "Feminin" with ♀ symbol  
die (bestimmt) / eine (unbestimmt)
Examples: die Lampe, die Tür
Small lamp/door drawings

Box 3 (green border): "Neutrum" with ⚪ symbol
das (bestimmt) / ein (unbestimmt)
Examples: das Buch, das Haus
Small book/house drawings

Box 4 (purple border): "Plural"
die (bestimmt) / – (kein unbestimmter!)
Examples: die Tische, die Bücher

Bottom: "Mạo từ bất định: ein (♂), eine (♀), ein (⚪), – (Plural keins!)"
Small blue Fuxie fox. Excalidraw hand-drawn style. Use Maskulin/Feminin/Neutrum/Plural as labels, NOT color names.`,

  'a1_negation_rule': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German negation: nicht vs kein.
Title: "German negation: nicht vs kein"

LEFT box (red border): "NICHT" with ✗ symbol
- Dùng trước: Động từ, Tính từ, Trạng từ
- "Ich komme NICHT"
- "Das ist NICHT gut"

RIGHT box (blue border): "KEIN" with 🚫 symbol
- Thay thế "ein/eine" trước Danh từ
- "Ich habe EIN Auto → Ich habe KEIN Auto"
- "Das ist EINE Katze → Das ist KEINE Katze"

Decision flowchart below:
"Có 'ein' trước DT?" → Yes → "Dùng KEIN" / No → "Dùng NICHT"

Small blue Fuxie fox. Excalidraw hand-drawn style. ALL text exactly as specified.`,

  'a1_wfragen_rule': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German W-Fragen (W-Questions).
Title: "German W-Fragen (W-Questions)"

Six W-words in colored boxes:
1. Wer? = Ai? (Who)
2. Was? = Gì? (What)  
3. Wo? = Ở đâu? (Where)
4. Woher? = Từ đâu? (From where)
5. Wie? = Thế nào? (How)
6. Wann? = Khi nào? (When)

CRITICAL: 6th word is WANN (when), NOT Wohin!

Formula: W-Wort + VERB (pos.2) + Subjekt + ...?
Example: "WO wohnst du?" in colored boxes

Comparison: VN "Bạn ở ĐÂU?" (W at END) vs DE "WO wohnst du?" (W at START)
Small blue Fuxie fox. Excalidraw hand-drawn style.`,

  'a1_satzstellung_rule': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German V2 rule (Verb Second) - Satzstellung.
Title: "German V2 rule (Verb Second) - Satzstellung"

Three example sentences with colored position blocks:
1. [Ich] [lerne] [Deutsch] [in Berlin]
   Labels: 1.Subjekt | 2.VERB | 3.Objekt | 4.Ort

2. [Heute] [lerne] [ich] [Deutsch]
   Labels: 1.Zeit | 2.VERB | 3.Subjekt | 4.Objekt

3. [In Berlin] [lerne] [ich] [Deutsch]
   Labels: 1.Ort | 2.VERB | 3.Subjekt | 4.Objekt

Arrow pointing to VERB position: "VERB = immer Position 2!"
Bottom: "Verb ngồi ghế số 2: 'Verb sitzt fest!'"
Small blue Fuxie fox. Excalidraw hand-drawn style.`,

  'a1_akkusativ_rule': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German Akkusativ case changes.
Title: "Akkusativ: Wen? Was?"

Simple table:
Nominativ → Akkusativ
der → den (highlight in RED - this changes!)
die → die (stays same)
das → das (stays same)
die (Plural) → die (stays same)
ein → einen (only masculine changes!)

Arrow: "Chỉ nam (Maskulin) thay đổi!"

Examples:
"Ich sehe den Mann" (den = Akkusativ, changed)
"Ich sehe die Frau" (die = same)

"Nur der ändert sich!" in speech bubble from Fuxie.
Small blue Fuxie fox. Excalidraw hand-drawn style. ALL text exactly as specified.`,

  'a1_trennbare_rule': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German Separable Verbs (Trennbare Verben).
Title: "German Trennbare Verben (Separable Verbs)"

Show splitting: aufstehen → splits into "AUF" + "stehen"
Sentence: "Ich STEHE um 7 Uhr AUF"
Labels: [Pos.2: gốc chia] and [Cuối câu: tiền tố]

More examples in colors:
an|rufen → "Ich RUFE dich AN"
ein|kaufen → "Wir KAUFEN im Supermarkt EIN"
mit|kommen → "Kommst du MIT?"

Bottom: Dog metaphor: "Tiền tố = đuôi chó — luôn chạy về cuối!"
Small dachshund dog drawing.
Small blue Fuxie fox. Excalidraw hand-drawn style.`,

  'a1_modalverben_rule': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German Modal Verbs Structure.
Title: "German Modalverben (Modal Verbs) Structure"

Example: "Ich KANN gut Deutsch SPRECHEN"

Flow: Subjekt → Modalverb (pos.2) → ...Mitte... → Infinitiv (Ende)

House metaphor (Satzklammer):
Front door = Modalverb (chia, pos.2): "KANN"
Inside house = rest of sentence: "gut Deutsch"  
Back door = Infinitiv (nguyên thể, cuối câu): "SPRECHEN"
Label: "Satzklammer als Hausrahmen"

Examples:
Ich KANN schwimmen (can swim)
Du MUSST lernen (must study)
Wir MÖCHTEN essen (would like to eat)
Er DARF spielen (may play)

Small blue Fuxie fox. Excalidraw hand-drawn style.`,

  'a1_modalverben_table': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

Modal verbs conjugation table.
Title: "Chia können, müssen, möchten, dürfen"

A hand-drawn table:
Header: Ngôi | können | müssen | möchten | dürfen
ich | kann | muss | möchte | darf
du | kannst | musst | möchtest | darfst
er/sie/es | kann | muss | möchte | darf
wir | können | müssen | möchten | dürfen
ihr | könnt | müsst | möchtet | dürft
sie/Sie | können | müssen | möchten | dürfen

Circle the ich and er/sie/es forms (they're identical = irregular pattern).
Excalidraw hand-drawn style. ALL forms must be EXACTLY as shown.
Pay special attention to umlauts: ö in können/möchten, ü in müssen/dürfen.`,

  'a1_pronomen_rule': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German Personal Pronouns.
Title: "German Personal Pronouns (Đại từ nhân xưng)"

Two sides: Singular and Plural

Singular side:
- Stick figure alone: ich (tôi) — 1st person
- Pointing finger: du (bạn) — 2nd person  
- Three figures (♂ er, ♀ sie, ⚪ es): anh ấy, cô ấy, nó — 3rd person

Plural side:
- Group of people: wir (chúng tôi) — 1st person
- Group with pointer: ihr (các bạn) — 2nd person
- Large group: sie (họ) — 3rd person

Special: "Sie (formal, viết hoa) = ông/bà/quý vị"
Tips: ♂ der → er (bỏ D!), ⚪ das → es (bỏ D!)

Small blue Fuxie fox. Excalidraw hand-drawn style.`,

  'a1_artikel_table': `Hand-drawn Excalidraw whiteboard diagram, white background, high quality.

German articles table — definite and indefinite.
Title: "Mạo từ xác định và bất định"

A hand-drawn table:
Header: | Maskulin ♂ | Feminin ♀ | Neutrum ⚪ | Plural
bestimmt: | der | die | das | die
unbestimmt: | ein | eine | ein | –

Tips below the table:
die: -ung, -heit, -keit, -schaft, -tion
der: -er, -ling, -ismus
das: -chen, -lein, -ment
Gender color-coded with circles.

Excalidraw hand-drawn style, white background. ALL text exactly as specified.`,
}

// ─── Generate one diagram ─────────────────────────
async function generateDiagram(name, prompt) {
  const outPath = `${OUT_DIR}/${name}_hd.png`
  console.log(`\n🎨 Generating: ${name}...`)
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`   ❌ API error: ${res.status}`)
    console.error(`   ${err.substring(0, 200)}`)
    return null
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  
  for (const part of parts) {
    if (part.inlineData) {
      const buf = Buffer.from(part.inlineData.data, 'base64')
      fs.writeFileSync(outPath, buf)
      const dims = execSync(`sips -g pixelWidth -g pixelHeight "${outPath}" 2>/dev/null | grep pixel | awk '{print $2}'`).toString().trim().split('\n').join('×')
      console.log(`   ✅ Saved: ${name}_hd.png (${Math.round(buf.length/1024)}KB, ${dims})`)
      return outPath
    }
  }
  
  console.log(`   ❌ No image returned`)
  return null
}

// ─── Main ─────────────────────────
async function main() {
  const filter = process.argv[2] // optional: only gen specific diagram
  const entries = filter 
    ? Object.entries(DIAGRAMS).filter(([k]) => k.includes(filter))
    : Object.entries(DIAGRAMS)
  
  console.log(`📋 Generating ${entries.length} HD diagrams via Gemini API (${MODEL})`)
  console.log(`   Output: ${OUT_DIR}\n`)
  
  let success = 0, fail = 0
  for (const [name, prompt] of entries) {
    const result = await generateDiagram(name, prompt)
    if (result) success++
    else fail++
    
    // Rate limit
    if (entries.indexOf([name, prompt]) < entries.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }
  
  console.log(`\n🏁 Done! ${success}/${entries.length} success, ${fail} failed`)
}

main().catch(console.error)
