// ===== Brand =====
export const colors = {
  brand: {
    primary: "#60A8E4",
    secondary: "#3C78A8",
    accent: "#2EC4B6",
    energy: "#FF8A3D",
    reward: "#FFB703",
    sky: {
      50: "#F3FBFF",
      100: "#E4F0F0",
      200: "#CCE4F0",
      400: "#60A8E4",
      500: "#54A8E4",
      600: "#3C78A8",
      700: "#3078B4",
      900: "#173B56",
    },
  },
  cefr: {
    A1: "#4CAF50",
    A2: "#8BC34A",
    B1: "#FF9800",
    B2: "#FF5722",
    C1: "#9C27B0",
    C2: "#673AB7",
  },
  feedback: {
    correct: "#4CAF50",
    incorrect: "#F44336",
    hint: "#FFC107",
    neutral: "#9E9E9E",
  },
  text: {
    primary: "#173B56",
    secondary: "#3C78A8",
    muted: "#64748B",
    subtle: "#94A3B8",
    inverse: "#FFFFFF",
    brand: "#3C78A8",
    success: "#166534",
    warning: "#92400E",
    danger: "#991B1B",
    reward: "#B45309",
  },
} as const;

// ===== Spacing =====
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  base: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "96px",
} as const;

// ===== Typography =====
export const fonts = {
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  german: "'Noto Sans', 'Inter', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

export const typography = {
  text: {
    xs: { fontSize: "12px", lineHeight: "16px" },
    sm: { fontSize: "14px", lineHeight: "20px" },
    base: { fontSize: "16px", lineHeight: "24px" },
    lg: { fontSize: "18px", lineHeight: "28px" },
    xl: { fontSize: "20px", lineHeight: "28px" },
    "2xl": { fontSize: "24px", lineHeight: "32px" },
    "3xl": { fontSize: "30px", lineHeight: "36px" },
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  tracking: {
    normal: "0",
    label: "0.025em",
  },
} as const;

// ===== Breakpoints =====
export const breakpoints = {
  mobile: "375px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1440px",
} as const;

// ===== Border Radius =====
export const radii = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

// ===== 2.5D / mobile-first additions (redesign 2026-06) =====
export const elevation = {
  iso: "0 8px 16px -8px rgba(23,59,86,.28)",
  card: "0 2px 8px -2px rgba(23,59,86,.16)",
  press: "inset 0 1px 2px rgba(23,59,86,.24)",
} as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 } as const;
export const type = {
  display: { size: 28, leading: 34 }, h1: { size: 22, leading: 28 },
  h2: { size: 18, leading: 24 }, body: { size: 16, leading: 24 },
  caption: { size: 13, leading: 18 }, font: '"Nunito", system-ui, sans-serif',
} as const;
export const motion = { easeTactile: "cubic-bezier(.2,.8,.2,1.2)", durTap: 120, durReward: 480 } as const;
export const tapMin = 44 as const;
