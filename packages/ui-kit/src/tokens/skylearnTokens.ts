/**
 * Skylearn Design System Tokens
 * Authoritative color palette, typography stacks, radii, elevation shadows, and motion curves.
 * Meets WCAG-AAA accessibility standards, Atkinson Hyperlegible dyslexia support, and calm clinical UX.
 */

export const SKYLEARN_COLORS = {
  // Brand Sky
  sky: '#3B82F6',
  skyBright: '#60A5FA',
  skyDeep: '#1D4ED8',
  skySoft: '#DBEAFE',

  // Achievement Sun
  sun: '#FBBF24',
  sunBright: '#FCD34D',
  sunDeep: '#D97706',

  // Progress Leaf
  leaf: '#22C55E',
  leafSoft: '#DCFCE7',
  leafDeep: '#16A34A',

  // Gentle Error Coral (Never punitive red)
  coral: '#F87171',
  coralSoft: '#FEE2E2',

  // Secondary Berry
  berry: '#A855F7',

  // Neutrals & Surfaces
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceElevated: '#FFFFFF',
  surfaceSunken: '#F1F5F9',

  // Typography Inks
  ink: '#0F172A',
  inkMuted: '#475569',
  inkSubtle: '#94A3B8',
  inkFaint: '#CBD5E1',

  // Outlines
  outline: '#E2E8F0',
  outlineStrong: '#94A3B8',
} as const;

export type SkylearnColorKey = keyof typeof SKYLEARN_COLORS;

export const SKYLEARN_TYPOGRAPHY = {
  fonts: {
    display: "'Hubot Sans', 'Nunito', 'Quicksand', sans-serif",
    body: "'Atkinson Hyperlegible', 'Nunito Sans', 'Inter', sans-serif",
    reading: "'Lexend Deca', 'Source Serif 4', serif",
    mono: "'JetBrains Mono', monospace",
  },
  letterSpacing: {
    display: '-0.02em',
    body: '0.01em', // Dyslexia-friendly spacing
    mono: '0',
  },
  scale: {
    hero: {
      fontSize: '56px',
      lineHeight: '60px',
      fontWeight: 700,
      fontFamily: "'Hubot Sans', 'Nunito', 'Quicksand', sans-serif",
    },
    h1: {
      fontSize: '40px',
      lineHeight: '48px',
      fontWeight: 700,
      fontFamily: "'Hubot Sans', 'Nunito', 'Quicksand', sans-serif",
    },
    h2: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 700,
      fontFamily: "'Hubot Sans', 'Nunito', 'Quicksand', sans-serif",
    },
    h3: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 600,
      fontFamily: "'Hubot Sans', 'Nunito', 'Quicksand', sans-serif",
    },
    h4: {
      fontSize: '19px',
      lineHeight: '28px',
      fontWeight: 600,
      fontFamily: "'Atkinson Hyperlegible', 'Nunito Sans', 'Inter', sans-serif",
    },
    bodyLarge: {
      fontSize: '20px',
      lineHeight: '32px',
      fontWeight: 500,
      fontFamily: "'Atkinson Hyperlegible', 'Nunito Sans', 'Inter', sans-serif",
    },
    body: {
      fontSize: '18px',
      lineHeight: '28px',
      fontWeight: 400,
      fontFamily: "'Atkinson Hyperlegible', 'Nunito Sans', 'Inter', sans-serif",
    },
    small: {
      fontSize: '16px', // Minimum allowed crew UI text size
      lineHeight: '24px',
      fontWeight: 400,
      fontFamily: "'Atkinson Hyperlegible', 'Nunito Sans', 'Inter', sans-serif",
    },
    caption: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
      fontFamily: "'Atkinson Hyperlegible', 'Nunito Sans', 'Inter', sans-serif",
    },
    scoreNumber: {
      fontSize: '56px',
      lineHeight: '56px',
      fontWeight: 700,
      fontFamily: "'Hubot Sans', 'Nunito', 'Quicksand', sans-serif",
      fontVariantNumeric: 'tabular-nums',
    },
  },
} as const;

export const SKYLEARN_RADII = {
  sm: '8px',       // Chips, inputs, compact badges
  md: '12px',      // Standard text/number inputs
  button: '16px',  // BigFriendlyButton, AnswerTile
  card: '20px',    // LessonCard, HudCard, HelpBubble
  modal: '28px',   // GuidedExamModal, large panels
  full: '999px',   // Pills, StarBadge, ProgressBar, Avatars
} as const;

export const SKYLEARN_SHADOWS = {
  restingCard: '0 0 0 1px #E2E8F0',
  cardHover: '0 8px 24px rgba(15, 23, 42, 0.06)',
  cardActive: '0 12px 32px rgba(59, 130, 246, 0.15)',
  rewardGlow: '0 0 24px rgba(252, 211, 77, 0.4)',
  modal: '0 24px 48px rgba(15, 23, 42, 0.12)',
  subtle: '0 2px 8px rgba(15, 23, 42, 0.04)',
} as const;

export const SKYLEARN_SPACING = {
  base: 4,
  scale: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const,
  minTapTarget: '56px',
} as const;

export const SKYLEARN_MOTION = {
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  durations: {
    snap: 120,          // Quick snap, button active scale
    standard: 240,      // Standard hover lift, tile shake
    burst: 320,         // Step completion sparkle
    progress: 480,      // Bar fill, star scale-in
    celebration: 1600,  // Full confetti completion
    glow: 2000,         // Newly earned star reward glow
  },
  reducedDurations: {
    snap: 80,
    standard: 120,
    burst: 120,
    progress: 180,
    celebration: 300,
    glow: 800,
  },
} as const;

export interface SeverityTheme {
  bg: string;
  border: string;
  text: string;
  accent: string;
  label: string;
  iconName: 'check-circle' | 'alert-triangle' | 'alert-octagon';
}

export const SEVERITY_THEME_MAP: Record<'green' | 'yellow' | 'red', SeverityTheme> = {
  green: {
    bg: '#DCFCE7',
    border: '#22C55E',
    text: '#16A34A',
    accent: '#22C55E',
    label: 'NOMINAL',
    iconName: 'check-circle',
  },
  yellow: {
    bg: '#FEF3C7',
    border: '#FBBF24',
    text: '#D97706',
    accent: '#FBBF24',
    label: 'CAUTION',
    iconName: 'alert-triangle',
  },
  red: {
    bg: '#FEE2E2',
    border: '#F87171',
    text: '#B91C1C',
    accent: '#F87171',
    label: 'ACTION REQUIRED',
    iconName: 'alert-octagon',
  },
} as const;

export const skylearnTokens = {
  colors: SKYLEARN_COLORS,
  typography: SKYLEARN_TYPOGRAPHY,
  radii: SKYLEARN_RADII,
  shadows: SKYLEARN_SHADOWS,
  spacing: SKYLEARN_SPACING,
  motion: SKYLEARN_MOTION,
  severity: SEVERITY_THEME_MAP,
} as const;

export default skylearnTokens;
