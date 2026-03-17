// ===== Brand =====
export const colors = {
    brand: {
        primary: '#FF6B35',
        secondary: '#004E89',
        accent: '#2EC4B6',
    },
    cefr: {
        A1: '#4CAF50',
        A2: '#8BC34A',
        B1: '#FF9800',
        B2: '#FF5722',
        C1: '#9C27B0',
        C2: '#673AB7',
    },
    feedback: {
        correct: '#4CAF50',
        incorrect: '#F44336',
        hint: '#FFC107',
        neutral: '#9E9E9E',
    },
} as const

// ===== Spacing =====
export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    base: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
} as const

// ===== Typography =====
export const fonts = {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    german: "'Noto Sans', 'Inter', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const

// ===== Breakpoints =====
export const breakpoints = {
    mobile: '375px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
} as const

// ===== Border Radius =====
export const radii = {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
} as const
