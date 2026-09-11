import { describe, expect, it } from 'vitest'

import {
  buildRedTeamPrompt,
  findRedTeamLeaks,
  type RedTeamPrompt,
} from '../../scripts/lib/review-board-redteam'

describe('red-team leak detector provenance semantics', () => {
  it('does not flag a stored answer that legitimately equals the blind stem', () => {
    const prompt = buildRedTeamPrompt({ stem: 'ref', answer: 'ref' })

    expect(findRedTeamLeaks(prompt, 'ref')).toEqual([])
  })

  it('does not flag a stored answer that legitimately equals an exposed option', () => {
    const prompt = buildRedTeamPrompt({
      stem: 'Welche Antwort passt?',
      options: ['Berlin', 'Hamburg'],
      answer: 'Berlin',
    })

    expect(findRedTeamLeaks(prompt, 'Berlin')).toEqual([])
  })

  it('flags a stored answer absent from blind inputs if it is interpolated elsewhere into the rendered prompt', () => {
    const secret = 'SECRET_ANSWER_TOKEN_XYZ'
    const clean = buildRedTeamPrompt({
      stem: 'Welche Antwort passt?',
      options: ['Berlin', 'Hamburg'],
      answer: secret,
    })
    const leaked: RedTeamPrompt = {
      ...clean,
      prompt: `${clean.prompt}\nINTERNAL STORED ANSWER: ${secret}`,
    }

    expect(findRedTeamLeaks(leaked, secret)).toContain('stored-answer-value-outside-blind-payload')
  })
})
