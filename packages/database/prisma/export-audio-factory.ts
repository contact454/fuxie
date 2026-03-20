import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONTENT_DIR = path.resolve(__dirname, '../../../content/a1/speaking')
const AUDIO_FACTORY_DIR = path.resolve(__dirname, '../../../../8-Audio-Factory')
const OUTPUT_SCRIPTS_DIR = path.join(AUDIO_FACTORY_DIR, 'data/scripts/Sprechen-Nachsprechen-Phase2')

const VOICE_Config = {
    speaker: "Modell_Sprecher",
    speaker_role: "pronunciation_model",
    voice_description: "A 30-year-old clear German female with a warm, neutral mid-register voice. Precise Hochdeutsch pronunciation with ideal articulation speed for language learners. Clear enunciation of each syllable, natural rhythm, no regional accent. Studio-quality microphone, close distance.",
    instruct_control: "[Speak slowly and clearly as a pronunciation model for German language learners. Articulate each word precisely with natural intonation. Maintain consistent warm, encouraging tone.]",
    emotion: "neutral",
    speed: 0.65,
    pause_after: 0.5,
    engine: "qwen3"
}

interface RichContentFile {
  topicSlug: string
  titleDe: string
  titleVi: string
  cefrLevel: string
  lessons: Array<{
    lessonId: string
     टॉपिकSlug: string
    lessonNumber: number
    titleDe: string
    titleVi: string
    originalSentence: string
    sentences: Array<{
      id: string
      textDe: string
      textVi: string
      ipa: string
      audioUrl: string
      expectedDurationSec: number
      pronunciationNotes: string
    }>
  }>
}

async function main() {
    console.log('🎤 Fuxie: Exporting 480 Sentences to Audio Factory')
    console.log('================================================\n')

    fs.mkdirSync(OUTPUT_SCRIPTS_DIR, { recursive: true })

    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json'))
    let totalGenerated = 0

    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file)
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RichContentFile
        const topicDir = path.join(OUTPUT_SCRIPTS_DIR, data.topicSlug)
        fs.mkdirSync(topicDir, { recursive: true })

        // Process lessons
        for (const lesson of data.lessons) {
            const lessonNumPad = String(lesson.lessonNumber).padStart(2, '0')
            
            for (let i = 0; i < lesson.sentences.length; i++) {
                const sentence = lesson.sentences[i]!
                const sentenceNum = i + 1
                const audioRef = `s${lessonNumPad}_${sentenceNum}`
                
                // 1. Update our content db JSON
                sentence.audioUrl = `/audio/speaking/a1/${data.topicSlug}/${audioRef}.mp3`

                // 2. Generate Audio Factory JSON
                const factoryJson = {
                    lesson_id: `L-SPR-A1-${data.topicSlug.replace('a1-', '').toUpperCase()}-${lessonNumPad}-S${sentenceNum}`,
                    level: "A1",
                    title: `Nachsprechen (${lessonNumPad}-${sentenceNum}): ${sentence.textDe}`,
                    board: "FUXIE",
                    teil: 0,
                    teil_name: "Nachsprechen",
                    task_type: "repeat_after_me",
                    topic: data.topicSlug,
                    background_scene: "none",
                    background_sfx_volume: 0,
                    output_filename: `Sprechen-Nachsprechen-Phase2/${data.topicSlug}/${audioRef}.mp3`,
                    lines: [
                        {
                            ...VOICE_Config,
                            text: sentence.textDe
                        }
                    ]
                }

                const outPath = path.join(topicDir, `L-SPR-A1-${data.topicSlug.replace('a1-', '').toUpperCase()}-${lessonNumPad}-S${sentenceNum}.json`)
                fs.writeFileSync(outPath, JSON.stringify(factoryJson, null, 2), 'utf-8')
                totalGenerated++
            }
        }

        // Save updated content jsons
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
        console.log(`  ✅ ${data.topicSlug}: Exported factory scripts & updated audioUrls`)
    }

    console.log(`\n🎉 Successfully exported ${totalGenerated} audio script files!`)
    console.log(`Output Directory: ${OUTPUT_SCRIPTS_DIR}`)
    console.log(`Now run seed-speaking.ts to push the updated audioUrls to DB.`)
}

main().catch(console.error)
