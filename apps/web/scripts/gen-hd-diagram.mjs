/**
 * Generate HD grammar diagram via Gemini API
 * Usage: node gen-hd-diagram.mjs
 */
import fs from 'fs'
import { execSync } from 'child_process'

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDJ8tesOkLOjxNItDkLfjuz0LJRkNy63EM'
const MODEL = 'gemini-2.5-flash-image'
const OUTPUT = '/Users/huynhngocphuc/Dev-Workspace/Active-Projects/9-Fuxie/apps/web/public/images/grammar/a1/a1_sein_haben_rule_hd.png'

const prompt = `Generate a hand-drawn Excalidraw whiteboard diagram on white background. The image should be high quality and detailed.

German "sein und haben" conjugation chart.

Title: "sein & haben"
Subtitle: "là/ở & có — 2 động từ quan trọng nhất!"

LEFT side (blue border, light blue fill): sein conjugation
ich → bin
du → bist
er/sie/es → ist (circle this in red - irregular!)
wir → sind
ihr → seid
sie/Sie → sind

RIGHT side (green border, light green fill): haben conjugation
ich → habe
du → hast
er/sie/es → hat (circle this in red - irregular!)
wir → haben
ihr → habt
sie/Sie → haben

Small blue fox mascot (Fuxie) at bottom corner.
Hand-drawn Excalidraw whiteboard style, handwritten font, white background.
ALL text must be EXACTLY as specified. Do NOT add extra or garbled text.
Make this HIGH QUALITY and DETAILED.`

async function main() {
  console.log('🎨 Calling Gemini API for HD diagram...')
  console.log(`   Model: ${MODEL}`)
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  })

  if (!res.ok) {
    console.error('❌ API error:', res.status, await res.text())
    return
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  
  for (const part of parts) {
    if (part.inlineData) {
      const { mimeType, data: b64 } = part.inlineData
      const buf = Buffer.from(b64, 'base64')
      fs.writeFileSync(OUTPUT, buf)
      
      const dims = execSync(`sips -g pixelWidth -g pixelHeight "${OUTPUT}" 2>/dev/null | grep pixel | awk '{print $2}'`).toString().trim().split('\n').join('×')
      const sizeKB = Math.round(buf.length / 1024)
      
      console.log(`✅ Saved: ${OUTPUT}`)
      console.log(`   Format: ${mimeType}`)
      console.log(`   Size: ${sizeKB}KB`)
      console.log(`   Dimensions: ${dims}`)
      return
    }
    if (part.text) {
      console.log('📝 Text:', part.text.substring(0, 200))
    }
  }
  
  console.log('❌ No image in response')
}

main().catch(e => console.error('Error:', e.message))
