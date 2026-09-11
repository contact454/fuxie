import { describe, expect, it } from 'vitest'
import { formatIntervalPreview } from './rating-buttons'

describe('formatIntervalPreview — locale-aware SRS intervals', () => {
    it('formats less-than-one-minute bucket for vi and de', () => {
        const vi = formatIntervalPreview(0, 'vi')
        const de = formatIntervalPreview(0, 'de')
        expect(vi.startsWith('<')).toBe(true)
        expect(de.startsWith('<')).toBe(true)
        // Vietnamese short minute unit typically includes "ph"
        expect(vi.toLowerCase()).toMatch(/ph|min/)
        // German short minute unit typically includes "Min"
        expect(de.toLowerCase()).toMatch(/min/)
    })

    it('formats hour previews for sub-day intervals (vi/de)', () => {
        const vi = formatIntervalPreview(0.5, 'vi') // ~12h
        const de = formatIntervalPreview(0.5, 'de')
        expect(vi.toLowerCase()).toMatch(/g|h|giờ|std/)
        expect(de.toLowerCase()).toMatch(/std|h/)
    })

    it('formats day previews for multi-day intervals (vi/de)', () => {
        const vi = formatIntervalPreview(6, 'vi')
        const de = formatIntervalPreview(6, 'de')
        expect(vi).toMatch(/6/)
        expect(de).toMatch(/6/)
        expect(vi.toLowerCase()).toMatch(/ngày|d|day|ng/)
        expect(de.toLowerCase()).toMatch(/tag|t|d/)
    })

    it('formats month and year previews (vi/de)', () => {
        const viMonth = formatIntervalPreview(60, 'vi')
        const deMonth = formatIntervalPreview(60, 'de')
        expect(viMonth.toLowerCase()).toMatch(/th|tháng|mo|m/)
        expect(deMonth.toLowerCase()).toMatch(/mon|m/)

        const viYear = formatIntervalPreview(400, 'vi')
        const deYear = formatIntervalPreview(400, 'de')
        expect(viYear.toLowerCase()).toMatch(/năm|y|yr|j/)
        expect(deYear.toLowerCase()).toMatch(/j|y|yr/)
    })

    it('treats unsupported locales as vi fallback', () => {
        const enLike = formatIntervalPreview(1, 'en')
        const vi = formatIntervalPreview(1, 'vi')
        expect(enLike).toBe(vi)
    })
})
