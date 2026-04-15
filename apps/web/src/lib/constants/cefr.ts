/**
 * Unified CEFR color theme — single source of truth.
 *
 * Previously duplicated 10+ times across vocabulary, listening, reading,
 * writing, speaking, dashboard, review, and practice-hub components,
 * each with slightly different type shapes. This module provides every
 * variant any consumer needs.
 */

export interface CefrColorTheme {
    /** Tailwind gradient classes, e.g. 'from-green-500 to-emerald-600' */
    gradient: string
    /** Solid background hex for badges / chips */
    bg: string
    /** Text color hex that contrasts with `bg` */
    text: string
    /** Border color hex */
    border: string
    /** CSS custom-property value, e.g. 'var(--color-cefr-a1)' */
    css: string
    /** Inline CSS gradient string for `style={{ background: ... }}` */
    cssGradient: string
    /** Box-shadow color (translucent) */
    shadow: string
}

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CefrLevel = (typeof CEFR_LEVELS)[number]

export const CEFR_THEME: Record<CefrLevel, CefrColorTheme> = {
    A1: {
        gradient: 'from-green-500 to-emerald-600',
        bg: '#DCFCE7',
        text: '#166534',
        border: '#86EFAC',
        css: 'var(--color-cefr-a1)',
        cssGradient: 'linear-gradient(135deg, #22C55E, #059669)',
        shadow: 'rgba(34, 197, 94, 0.3)',
    },
    A2: {
        gradient: 'from-lime-500 to-green-600',
        bg: '#D9F99D',
        text: '#3F6212',
        border: '#BEF264',
        css: 'var(--color-cefr-a2)',
        cssGradient: 'linear-gradient(135deg, #84CC16, #16A34A)',
        shadow: 'rgba(132, 204, 22, 0.3)',
    },
    B1: {
        gradient: 'from-orange-400 to-amber-600',
        bg: '#FED7AA',
        text: '#9A3412',
        border: '#FDBA74',
        css: 'var(--color-cefr-b1)',
        cssGradient: 'linear-gradient(135deg, #F97316, #D97706)',
        shadow: 'rgba(249, 115, 22, 0.3)',
    },
    B2: {
        gradient: 'from-red-500 to-orange-600',
        bg: '#FECACA',
        text: '#991B1B',
        border: '#FCA5A5',
        css: 'var(--color-cefr-b2)',
        cssGradient: 'linear-gradient(135deg, #EF4444, #EA580C)',
        shadow: 'rgba(239, 68, 68, 0.3)',
    },
    C1: {
        gradient: 'from-purple-500 to-violet-600',
        bg: '#E9D5FF',
        text: '#6B21A8',
        border: '#C084FC',
        css: 'var(--color-cefr-c1)',
        cssGradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
        shadow: 'rgba(168, 85, 247, 0.3)',
    },
    C2: {
        gradient: 'from-violet-600 to-purple-800',
        bg: '#DDD6FE',
        text: '#4C1D95',
        border: '#A78BFA',
        css: 'var(--color-cefr-c2)',
        cssGradient: 'linear-gradient(135deg, #7C3AED, #6B21A8)',
        shadow: 'rgba(124, 58, 237, 0.3)',
    },
}

/** Safe accessor — returns A1 theme if level is unknown */
export function getCefrTheme(level: string): CefrColorTheme {
    return CEFR_THEME[level as CefrLevel] ?? CEFR_THEME.A1
}

