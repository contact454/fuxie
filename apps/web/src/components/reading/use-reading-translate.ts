'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { LookedUpWord, TooltipState } from './reading-types'
import styles from './reading.module.css'

/**
 * Hook for click-to-translate functionality in the Reading Player.
 * Handles tooltip display, word lookup via translate API, and vocabulary list management.
 */
export function useReadingTranslate() {
    const [tooltip, setTooltip] = useState<TooltipState | null>(null)
    const [vocabList, setVocabList] = useState<LookedUpWord[]>([])
    const [showVocabPanel, setShowVocabPanel] = useState(false)
    const tooltipRef = useRef<HTMLDivElement>(null)

    // Close tooltip on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
                setTooltip(null)
            }
        }
        if (tooltip) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [tooltip])

    // Look up word translation via API
    const lookupWord = useCallback(async (word: string, x: number, y: number) => {
        const cleanWord = word.replace(/[.,!?;:()\"\u00AB\u00BB\u201E\u201C\[\]]/g, '').trim()
        if (!cleanWord || cleanWord.length < 2) return

        // Check if already in vocab list
        const existing = vocabList.find(v => v.word.toLowerCase() === cleanWord.toLowerCase())
        if (existing) {
            setTooltip({ word: cleanWord, translation: existing.translation, loading: false, x, y })
            return
        }

        setTooltip({ word: cleanWord, translation: null, loading: true, x, y })

        try {
            const res = await fetch(`/api/v1/translate?word=${encodeURIComponent(cleanWord)}`)
            const data = await res.json()
            const translation = data.translation || 'Keine \u00dcbersetzung gefunden'
            setTooltip({ word: cleanWord, translation, loading: false, x, y })
            setVocabList(prev => {
                if (prev.some(v => v.word.toLowerCase() === cleanWord.toLowerCase())) return prev
                return [...prev, { word: cleanWord, translation, timestamp: Date.now() }]
            })
        } catch {
            setTooltip({ word: cleanWord, translation: '\u00dcbersetzung nicht verf\u00fcgbar', loading: false, x, y })
        }
    }, [vocabList])

    // Handle text click — detect word at click position
    const handleTextClick = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest(`.${styles.textBody}`) && !target.closest(`.${styles.readingText}`)) return

        let range: Range | null = null
        if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(e.clientX, e.clientY)
        }
        if (!range) return

        const textNode = range.startContainer
        if (textNode.nodeType !== Node.TEXT_NODE) return

        const text = textNode.textContent || ''
        const offset = range.startOffset

        // Find word boundaries
        let start = offset
        let end = offset
        while (start > 0 && /[\wÄÖÜäöüß]/.test(text[start - 1] || '')) start--
        while (end < text.length && /[\wÄÖÜäöüß]/.test(text[end] || '')) end++

        const word = text.slice(start, end)
        if (word.length >= 2) {
            lookupWord(word, e.clientX, e.clientY)
        }
    }, [lookupWord])

    return {
        tooltip,
        setTooltip,
        vocabList,
        showVocabPanel,
        setShowVocabPanel,
        tooltipRef,
        handleTextClick,
    }
}
