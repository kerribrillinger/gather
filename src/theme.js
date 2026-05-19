// Gather Mobile — design tokens, mirrored from desktop styles.css

export const COLORS = {
  // Warm palette (default) — light
  bg:          '#F5F0E6',
  bgCard:      '#FFFFFF',
  text:        '#1E2820',
  textMuted:   '#6B7A6F',
  textFaint:   '#9EAB9E',
  border:      '#E2DDD6',
  accent:      '#C4953A',
  accentLight: '#F5EDDA',
  sage:        '#5D6E63',
  // Dark overrides applied at component level when theme === 'dark'
  dark: {
    bg:          '#1A1F1B',
    bgCard:      '#242B25',
    text:        'rgba(255,255,255,0.88)',
    textMuted:   'rgba(255,255,255,0.50)',
    textFaint:   'rgba(255,255,255,0.28)',
    border:      'rgba(255,255,255,0.10)',
    accent:      '#D4A84B',
    accentLight: 'rgba(212,168,75,0.15)',
    sage:        '#7A9A82',
  },
};

export const FONTS = {
  sans:    'System',
  display: 'System',
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
};

// List badge color palette — same 20 colours as desktop
export const LIST_BADGE_COLORS = [
  { bg: '#E8D5C4', text: '#7B5E3A' },
  { bg: '#F5C5A3', text: '#8B4513' },
  { bg: '#F4D4A0', text: '#8B6914' },
  { bg: '#D4E8C4', text: '#3A6B2A' },
  { bg: '#C4D8E8', text: '#2A4B6B' },
  { bg: '#D8C4E8', text: '#5A3A7B' },
  { bg: '#E8C4D4', text: '#7B3A5A' },
  { bg: '#C4E8D8', text: '#2A6B5A' },
  { bg: '#E8E4C4', text: '#6B6014' },
  { bg: '#C4E4E8', text: '#1A5A6B' },
  { bg: '#E8C4C4', text: '#7B2A2A' },
  { bg: '#C8D8C4', text: '#3A5A3A' },
  { bg: '#E0D0C8', text: '#6B4A3A' },
  { bg: '#D0C8E0', text: '#4A3A7B' },
  { bg: '#C8E0D0', text: '#2A5A4A' },
  { bg: '#E0C8D0', text: '#7B3A5A' },
  { bg: '#D8D0C0', text: '#5A4A2A' },
  { bg: '#C0D0D8', text: '#2A4A5A' },
  { bg: '#D0D8C0', text: '#3A5A2A' },
  { bg: '#D8C0C0', text: '#5A2A2A' },
];
