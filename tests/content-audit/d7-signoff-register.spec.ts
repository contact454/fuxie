import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  buildRegister,
  validateRegister,
} from '../../scripts/content-d7-signoff-sweep'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const REGISTER = path.join(ROOT, 'docs', 'content-quality', 'audit-2026-06', 'd7-signoff-register.json')

describe('D7 academic signoff register', () => {
  it('covers every cell and every prepared manual-review input', () => {
    const register = buildRegister('2026-06-10T00:00:00.000Z')
    expect(validateRegister(register)).toEqual([])
    expect(register.summary.totalCells).toBe(36)
    expect(register.summary.humanSpotCheckSamples).toBe(60)
    expect(register.summary.d2ManualSamples).toBe(24)
    expect(register.summary.d3ManualSamples).toBe(24)
    expect(register.summary.d4ManualSamples).toBe(12)
    expect(register.summary.vocabularyD7ReviewRows).toBe(1_482)
    expect(register.summary.vocabularyD7P1Rows).toBe(626)
    expect(register.summary.missingSampleFiles).toBe(0)
  })

  it('keeps machine-clean cells separate from academic/native signoff', () => {
    const register = buildRegister('2026-06-10T00:00:00.000Z')
    expect(register.summary.qaMachinePassCells).toBe(36)
    expect(register.summary.academicSignedCells).toBe(1)
    expect(register.summary.academicPendingCells).toBe(35)
    expect(register.summary.audioPendingCells).toBe(6)
    expect(register.cells.filter((cell) => cell.decisionState !== 'signed').length).toBe(35)
  })

  it('checks the committed register artifact shape', () => {
    expect(fs.existsSync(REGISTER)).toBe(true)
    const register = JSON.parse(fs.readFileSync(REGISTER, 'utf8'))
    expect(validateRegister(register)).toEqual([])
  })
})
