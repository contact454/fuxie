const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')

const { config } = require('dotenv')
const ts = require('../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript')
const generated = require('../apps/web/generated/prisma')

const root = path.resolve(__dirname, '..')
const webRoot = path.join(root, 'apps', 'web')

config({ path: path.join(root, '.env'), override: true })

const prisma = new generated.PrismaClient()
const originalResolve = Module._resolveFilename
const originalLoad = Module._load

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    return path.join(webRoot, 'src', request.slice(2)) + '.ts'
  }
  return originalResolve.call(this, request, parent, isMain, options)
}

Module._load = function load(request, parent, isMain) {
  if (request === '@fuxie/database') {
    return {
      Prisma: generated.Prisma,
      prisma,
      ShopRedeemRequestStatus: generated.ShopRedeemRequestStatus,
    }
  }
  return originalLoad.call(this, request, parent, isMain)
}

require.extensions['.ts'] = function loadTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      isolatedModules: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  }).outputText
  module._compile(output, filename)
}

const {
  getGamificationPilotReadout,
} = require('../apps/web/src/lib/analytics/gamification-pilot-readout.ts')

function event(overrides) {
  return {
    id: `${overrides.userId || 'learner'}-${overrides.eventName || 'event'}-${overrides.actionId || 'none'}`,
    userId: 'learner-1',
    role: 'LEARNER',
    eventName: 'meaningful_action_completed',
    source: null,
    sessionId: null,
    route: null,
    actionId: null,
    actionType: null,
    level: null,
    skill: null,
    metadata: null,
    createdAt: new Date('2026-05-01T10:00:00.000Z'),
    ...overrides,
  }
}

async function verifySixSkillAggregation() {
  const skills = ['vocabulary', 'listening', 'reading', 'grammar', 'writing', 'speaking']
  const events = skills.flatMap((skill, index) => [
    event({
      userId: `learner-${index + 1}`,
      eventName: 'quest_episode_started',
      actionId: `${skill}-episode:A1:fixture`,
      actionType: `${skill}_episode`,
      skill,
      level: 'A1',
      metadata: { skill, episodeId: `${skill}-episode:A1:fixture`, checkpointId: 'start' },
    }),
    event({
      userId: `learner-${index + 1}`,
      eventName: 'quest_episode_completed',
      actionId: `${skill}-episode:A1:fixture`,
      actionType: `${skill}_episode`,
      skill,
      level: 'A1',
      metadata: { skill, episodeId: `${skill}-episode:A1:fixture`, accuracyBand: 'clear' },
      createdAt: new Date(`2026-05-01T0${index}:30:00.000Z`),
    }),
    event({
      userId: `learner-${index + 1}`,
      eventName: 'meaningful_action_completed',
      actionId: `${skill}-follow-through`,
      actionType: `${skill}_episode`,
      skill,
      level: 'A1',
      createdAt: new Date(`2026-05-01T0${index}:40:00.000Z`),
    }),
  ])

  const readout = await getGamificationPilotReadout({
    from: new Date('2026-05-01T00:00:00.000Z'),
    to: new Date('2026-05-07T23:59:59.999Z'),
    now: new Date('2026-05-03T12:00:00.000Z'),
    db: {
      analyticsEvent: { findMany: async () => events },
      shopRedeemRequest: { findMany: async () => [] },
    },
  })

  const expected = [...skills].sort().map((skill) => ({ key: skill, events: 2, users: 1 }))
  assert(readout.questEpisodes.started === 6, 'Expected six episode starts.')
  assert(readout.questEpisodes.completed === 6, 'Expected six episode completions.')
  assert(readout.questEpisodes.completionRate === 100, 'Expected 100% mock completion rate.')
  assert(
    JSON.stringify(readout.questEpisodes.bySkill) === JSON.stringify(expected),
    'Expected Episodes By Skill to include all six skills.',
  )

  return readout.questEpisodes.bySkill
}

async function verifyRealDbReadoutShape() {
  const readout = await getGamificationPilotReadout({
    from: new Date('2026-05-01T00:00:00.000Z'),
    to: new Date('2026-05-13T23:59:59.999Z'),
  })

  assert(readout.questEpisodes && Array.isArray(readout.questEpisodes.bySkill), 'Missing quest episode readout.')
  assert(readout.writingFeedback && Array.isArray(readout.writingFeedback.byFeedbackStatus), 'Missing writing feedback readout.')
  assert(readout.speakingPronunciation && Array.isArray(readout.speakingPronunciation.byScoreBand), 'Missing speaking pronunciation readout.')
  assert(readout.mastery && Array.isArray(readout.mastery.badgeUnlocksBySkill), 'Missing mastery badge readout.')
  assert(readout.opsPolicy && readout.opsPolicy.realGiftLocked === true, 'Expected real gifts to remain locked.')

  return {
    health: readout.health.warningLevel,
    questEpisodeBuckets: readout.questEpisodes.bySkill.length,
    realGiftLocked: readout.opsPolicy.realGiftLocked,
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  const [sixSkillBuckets, dbShape] = await Promise.all([
    verifySixSkillAggregation(),
    verifyRealDbReadoutShape(),
  ])

  console.log(JSON.stringify({
    status: 'PASS',
    sixSkillBuckets,
    dbShape,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error('[gamification-readout] FAIL:', error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
