import fs from 'node:fs'
import path from 'node:path'

const target = process.argv[2] ?? 'assets/models/Fuxie_Character_v8_hunyuan_animated.glb'
const buffer = fs.readFileSync(target)

if (buffer.toString('utf8', 0, 4) !== 'glTF') {
  throw new Error(`${target} is not a binary glTF file`)
}

const length = buffer.readUInt32LE(8)
let offset = 12
let json = null

while (offset < length) {
  const chunkLength = buffer.readUInt32LE(offset)
  const chunkType = buffer.toString('utf8', offset + 4, offset + 8)
  const chunk = buffer.subarray(offset + 8, offset + 8 + chunkLength)
  if (chunkType === 'JSON') {
    json = JSON.parse(chunk.toString('utf8').trim())
  }
  offset += 8 + chunkLength
}

if (!json) {
  throw new Error(`${target} has no glTF JSON chunk`)
}

const animations = (json.animations ?? []).map((item) => item.name)
const requiredAnimations = ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain']
const missingAnimations = requiredAnimations.filter((name) => !animations.includes(name))

const report = {
  file: path.normalize(target),
  bytes: buffer.length,
  meshes: json.meshes?.length ?? 0,
  skins: json.skins?.length ?? 0,
  nodes: json.nodes?.length ?? 0,
  materials: json.materials?.length ?? 0,
  images: json.images?.length ?? 0,
  animations,
  missingAnimations,
  ok: (json.meshes?.length ?? 0) > 0 && (json.skins?.length ?? 0) > 0 && missingAnimations.length === 0,
}

console.log(JSON.stringify(report, null, 2))

if (!report.ok) {
  process.exitCode = 1
}
