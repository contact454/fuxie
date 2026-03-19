'use client'

/**
 * Grammar Diagram Registry
 * Maps topicSlug + blockType → React component
 * React diagrams take priority over PNG images
 */

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// Lazy-load diagram components
const SeinHabenRule = dynamic(() => import('./SeinHabenRule'), { ssr: false })

export type DiagramBlockType = 'rule' | 'table' | 'mnemonic'

const registry: Record<string, Partial<Record<DiagramBlockType, ComponentType>>> = {
  'a1-sein-haben': {
    rule: SeinHabenRule,
  },
}

/**
 * Get a React diagram component for a given topic + block type
 * Returns undefined if no component exists (falls back to PNG)
 */
export function getDiagramComponent(
  topicSlug: string,
  blockType: DiagramBlockType
): ComponentType | undefined {
  return registry[topicSlug]?.[blockType]
}
