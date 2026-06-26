// Gather Mobile — design tokens

const DARK_TEXT = {
  text:      'rgba(255,255,255,0.88)',
  textMuted: 'rgba(255,255,255,0.50)',
  textFaint: 'rgba(255,255,255,0.28)',
  border:    'rgba(255,255,255,0.10)',
};

// Each theme gets its own dark bg tinted to match its hue
const DARK_BASE       = { ...DARK_TEXT, bg: '#1A1F1B', bgCard: '#242B25' }; // default green
const DARK_WARM       = { ...DARK_TEXT, bg: '#1E1A14', bgCard: '#28221A' };
const DARK_BOTANICAL  = { ...DARK_TEXT, bg: '#121E18', bgCard: '#1A2820' };
const DARK_SLATE      = { ...DARK_TEXT, bg: '#14181E', bgCard: '#1C2228' };
const DARK_DUSK       = { ...DARK_TEXT, bg: '#16141E', bgCard: '#201C2A' };
const DARK_ROSE       = { ...DARK_TEXT, bg: '#1E1418', bgCard: '#281C22' };
const DARK_STONE      = { ...DARK_TEXT, bg: '#161820', bgCard: '#1E2028' };
const DARK_COPPER     = { ...DARK_TEXT, bg: '#1E1410', bgCard: '#281C16' };
const DARK_TIDE       = { ...DARK_TEXT, bg: '#12181E', bgCard: '#1A2028' };
const DARK_CHALK      = { ...DARK_TEXT, bg: '#161818', bgCard: '#1E2020' };
const DARK_OLIVE      = { ...DARK_TEXT, bg: '#141810', bgCard: '#1C2018' };
const DARK_TAUPE      = { ...DARK_TEXT, bg: '#1A1612', bgCard: '#221E1A' };
const DARK_WINE       = { ...DARK_TEXT, bg: '#1A1016', bgCard: '#22181E' };
const DARK_EMERALD    = { ...DARK_TEXT, bg: '#101A16', bgCard: '#182220' };
const DARK_SAPPHIRE   = { ...DARK_TEXT, bg: '#101420', bgCard: '#181C2A' };

export const PALETTES = {
  default: {
    label:       'Default',
    swatch:      '#5D6E63',
    bg:          '#F5F0E6',
    bgCard:      '#FFFFFF',
    bgNav:       '#5D6E63',
    text:        '#1E2820',
    textMuted:   '#6B7A6F',
    textFaint:   '#9EAB9E',
    border:      '#E2DDD6',
    accent:      '#C4953A',
    accentLight: '#F5EDDA',
    sage:        '#5D6E63',
    danger:      '#C0392B',
    dark: { ...DARK_WARM, bgNav: '#1A2220', accent: '#D4A84B', accentLight: 'rgba(212,168,75,0.15)', sage: '#7A9A82' },
  },
  botanical: {
    label:       'Botanical',
    swatch:      '#3D7D5D',
    bg:          '#EEF5F0',
    bgCard:      '#FFFFFF',
    bgNav:       '#3D7D5D',
    text:        '#1A2A20',
    textMuted:   '#4A6854',
    textFaint:   '#7A9882',
    border:      '#D9E5DC',
    accent:      '#C85A3A',
    accentLight: '#EFD8D0',
    sage:        '#3D7D5D',
    danger:      '#C0392B',
    dark: { ...DARK_BOTANICAL, bgNav: '#0F1E18', accent: '#E67B5B', accentLight: 'rgba(230,123,91,0.15)', sage: '#5AA87A' },
  },
  slate: {
    label:       'Slate',
    swatch:      '#4A5E7D',
    bg:          '#EFF2F6',
    bgCard:      '#FFFFFF',
    bgNav:       '#4A5E7D',
    text:        '#1A1F2E',
    textMuted:   '#52617A',
    textFaint:   '#8A9FB8',
    border:      '#DDE3ED',
    accent:      '#B8956A',
    accentLight: '#EFE5D8',
    sage:        '#4A5E7D',
    danger:      '#C0392B',
    dark: { ...DARK_SLATE, bgNav: '#121820', accent: '#D4B896', accentLight: 'rgba(212,184,150,0.15)', sage: '#6A8AAD' },
  },
  dusk: {
    label:       'Dusk',
    swatch:      '#5D4E7D',
    bg:          '#F3EFF6',
    bgCard:      '#FFFFFF',
    bgNav:       '#5D4E7D',
    text:        '#1E1C28',
    textMuted:   '#6B5E78',
    textFaint:   '#9E91B0',
    border:      '#E5DDF0',
    accent:      '#D4A84B',
    accentLight: '#F5EDDA',
    sage:        '#5D4E7D',
    danger:      '#C0392B',
    dark: { ...DARK_DUSK, bgNav: '#181420', accent: '#E6D68F', accentLight: 'rgba(230,214,143,0.15)', sage: '#8A7BAA' },
  },
  rose: {
    label:       'Rose',
    swatch:      '#7D4E5D',
    bg:          '#F6EEF0',
    bgCard:      '#FFFFFF',
    bgNav:       '#7D4E5D',
    text:        '#2E1E26',
    textMuted:   '#7B5E6B',
    textFaint:   '#AE91A0',
    border:      '#EDD9E5',
    accent:      '#C85A6B',
    accentLight: '#F0D9E3',
    sage:        '#7D4E5D',
    danger:      '#C0392B',
    dark: { ...DARK_ROSE, bgNav: '#201018', accent: '#E67B96', accentLight: 'rgba(230,123,150,0.15)', sage: '#AA7A8F' },
  },
  stone: {
    label:       'Stone',
    swatch:      '#5D6E7D',
    bg:          '#F3F4F5',
    bgCard:      '#FFFFFF',
    bgNav:       '#5D6E7D',
    text:        '#1E2228',
    textMuted:   '#6B7278',
    textFaint:   '#9EA4B0',
    border:      '#E2E5E8',
    accent:      '#C97D54',
    accentLight: '#F0E0D8',
    sage:        '#5D6E7D',
    danger:      '#C0392B',
    dark: { ...DARK_STONE, bgNav: '#181C20', accent: '#E69A6F', accentLight: 'rgba(230,154,111,0.15)', sage: '#8A9BAA' },
  },
  copper: {
    label:       'Copper',
    swatch:      '#8B6339',
    bg:          '#F5F0EB',
    bgCard:      '#FFFFFF',
    bgNav:       '#8B6339',
    text:        '#2E1E18',
    textMuted:   '#7B5E52',
    textFaint:   '#AE9186',
    border:      '#EDD9CC',
    accent:      '#C97D54',
    accentLight: '#F0DCCF',
    sage:        '#8B6339',
    danger:      '#C0392B',
    dark: { ...DARK_COPPER, bgNav: '#201410', accent: '#E69A6F', accentLight: 'rgba(230,154,111,0.15)', sage: '#AA8861' },
  },
  tide: {
    label:       'Tide',
    swatch:      '#4E6B7D',
    bg:          '#EEF2F5',
    bgCard:      '#FFFFFF',
    bgNav:       '#4E6B7D',
    text:        '#1A2228',
    textMuted:   '#526270',
    textFaint:   '#8A9FB8',
    border:      '#DDE6ED',
    accent:      '#C88A7D',
    accentLight: '#EFE0D8',
    sage:        '#4E6B7D',
    danger:      '#C0392B',
    dark: { ...DARK_TIDE, bgNav: '#121C22', accent: '#E6A89A', accentLight: 'rgba(230,168,154,0.15)', sage: '#6A8BAA' },
  },
  chalk: {
    label: 'Chalk', swatch: '#8B8B8B',
    bg: '#F8F8F8', bgCard: '#FFFFFF', bgNav: '#5D6B6E', text: '#1E1E1E', textMuted: '#6B6B6B', textFaint: '#9E9E9E',
    border: '#E8E8E8', accent: '#5D6E63', accentLight: '#E8EFEB', sage: '#5D6E63', danger: '#C0392B',
    dark: { ...DARK_CHALK, bgNav: '#181C1E', accent: '#7A9A82', accentLight: 'rgba(122,154,130,0.15)', sage: '#7A9A82' },
  },
  olive: {
    label: 'Olive', swatch: '#6B7A3A',
    bg: '#F2F4EC', bgCard: '#FFFFFF', bgNav: '#6B7A3A', text: '#1E2218', textMuted: '#5A6442', textFaint: '#8A946A',
    border: '#DDE4CC', accent: '#6B7A3A', accentLight: '#E8EDDA', sage: '#6B7A3A', danger: '#C0392B',
    dark: { ...DARK_OLIVE, bgNav: '#1A1E10', accent: '#8AA04E', accentLight: 'rgba(138,160,78,0.15)', sage: '#8AA04E' },
  },
  taupe: {
    label: 'Taupe', swatch: '#8B7B6B',
    bg: '#F5F2EE', bgCard: '#FFFFFF', bgNav: '#8B7B6B', text: '#2A1E18', textMuted: '#7B6B5E', textFaint: '#AE9E8E',
    border: '#E8E2DA', accent: '#8B7B6B', accentLight: '#EDE8E2', sage: '#8B7B6B', danger: '#C0392B',
    dark: { ...DARK_TAUPE, bgNav: '#201A14', accent: '#AA9A8A', accentLight: 'rgba(170,154,138,0.15)', sage: '#AA9A8A' },
  },
  wine: {
    label: 'Wine', swatch: '#7D2E45',
    bg: '#F6EEF1', bgCard: '#FFFFFF', bgNav: '#7D2E45', text: '#2A1820', textMuted: '#7A4A58', textFaint: '#AE8090',
    border: '#EDD8DF', accent: '#7D2E45', accentLight: '#F0D8DF', sage: '#7D2E45', danger: '#C0392B',
    dark: { ...DARK_WINE, bgNav: '#1E0C14', accent: '#AA5070', accentLight: 'rgba(170,80,112,0.15)', sage: '#AA5070' },
  },
  accessibleEmerald: {
    label: 'Accessible Emerald', swatch: '#1A5C3A', accessible: true,
    bg: '#FFFFFF', bgCard: '#F4F9F6', bgNav: '#1A5C3A', text: '#0A1A10', textMuted: '#2E6644', textFaint: '#6A9A7A',
    border: '#C8DDD2', accent: '#2255CC', accentLight: '#DDEAFF', sage: '#1A5C3A', danger: '#B91C1C',
    dark: { ...DARK_EMERALD, bgNav: '#0A1E16', accent: '#6699FF', accentLight: 'rgba(102,153,255,0.15)', sage: '#4A9A6A' },
  },
  accessibleSapphire: {
    label: 'Accessible Sapphire', swatch: '#1A2E6E', accessible: true,
    bg: '#FFFFFF', bgCard: '#F4F6FB', bgNav: '#1A2E6E', text: '#0A0E22', textMuted: '#2A4A9A', textFaint: '#6A82CC',
    border: '#C8D2EE', accent: '#C2470A', accentLight: '#FDEADE', sage: '#1A2E6E', danger: '#B91C1C',
    dark: { ...DARK_SAPPHIRE, bgNav: '#0A1020', accent: '#FF8C55', accentLight: 'rgba(255,140,85,0.15)', sage: '#4A6ABE' },
  },
  accessibleWarm: {
    label: 'Accessible Warm', swatch: '#2E4A2A', accessible: true,
    bg: '#FFFDF7', bgCard: '#FFFFFF', bgNav: '#2E4A2A', text: '#1A1208', textMuted: '#4A3A20', textFaint: '#8A7A60',
    border: '#E2D8C4', accent: '#C2470A', accentLight: '#FDEADE', sage: '#2E4A2A', danger: '#B91C1C',
    dark: { ...DARK_WARM, bgNav: '#141E10', accent: '#FF8C55', accentLight: 'rgba(255,140,85,0.15)', sage: '#6A8A5A' },
  },
};

// Default export — default light, kept for any legacy imports
export const COLORS = {
  ...PALETTES.default,
  dark: PALETTES.default.dark,
};

export const FONT_OPTIONS = {
  system:       { label: 'DM Sans (Default)',    body: 'DMSans_400Regular',               heading: 'DMSans_700Bold',               italic: 'DMSans_400Regular_Italic'               },
  lato:         { label: 'Lato',                 body: 'Lato_400Regular',                  heading: 'Lato_700Bold',                  italic: 'Lato_400Regular_Italic'                 },
  raleway:      { label: 'Raleway',              body: 'Raleway_400Regular',               heading: 'Raleway_700Bold',               italic: 'Raleway_400Regular_Italic'              },
  merriweather: { label: 'Merriweather',         body: 'Merriweather_400Regular',          heading: 'Merriweather_700Bold',          italic: 'Merriweather_400Regular_Italic'         },
  outfit:       { label: 'Outfit',               body: 'Outfit_400Regular',                heading: 'Outfit_700Bold',                italic: 'Outfit_400Regular'                      },
  nunito:       { label: 'Nunito',               body: 'Nunito_400Regular',                heading: 'Nunito_700Bold',                italic: 'Nunito_400Regular_Italic'               },
  playfair:     { label: 'Playfair Display',     body: 'PlayfairDisplay_400Regular',       heading: 'PlayfairDisplay_700Bold',       italic: 'PlayfairDisplay_400Regular_Italic'      },
  josefin:      { label: 'Josefin Sans',         body: 'JosefinSans_400Regular',           heading: 'JosefinSans_700Bold',           italic: 'JosefinSans_400Regular_Italic'          },
  sourceserif:  { label: 'Source Serif',         body: 'SourceSerif4_400Regular',          heading: 'SourceSerif4_700Bold',          italic: 'SourceSerif4_400Regular_Italic'         },
  // ── Accessible ────────────────────────────────────────────────────────────
  atkinson:     { label: 'Atkinson Hyperlegible', accessible: true, body: 'AtkinsonHyperlegible_400Regular', heading: 'AtkinsonHyperlegible_700Bold', italic: 'AtkinsonHyperlegible_400Regular_Italic' },
  comicneue:    { label: 'Comic Neue',            accessible: true, body: 'ComicNeue_400Regular',            heading: 'ComicNeue_700Bold',            italic: 'ComicNeue_400Regular_Italic'            },
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
