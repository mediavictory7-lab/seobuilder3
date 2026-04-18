export interface Theme {
  id: string;
  mode: 'light' | 'dark' | 'duotone';
  palette: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    accent_contrast: string;
    border: string;
  };
  typography: {
    heading: string; // CSS font-family string
    body: string;
    heading_weight: number;
    body_weight: number;
    heading_transform: 'none' | 'uppercase';
    heading_tracking: string; // letter-spacing
  };
  tokens: {
    radius: string;          // --radius
    container_max: string;   // --container-max
    space_section: string;   // vertical gap between sections
    space_block: string;     // internal paddings
    grid_gap: string;
  };
}

export const themes: Theme[] = [
  // A — dark navy with cyan accent (ArbitPad-style AI trading)
  {
    id: 'theme-midnight-cyan',
    mode: 'dark',
    palette: {
      bg: '#091229',
      surface: '#0f1a38',
      text: '#e8eef9',
      muted: '#8897b5',
      accent: '#3ad0d9',
      accent_contrast: '#04111c',
      border: '#1a2448',
    },
    typography: {
      heading: `'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      body: `'Inter', ui-sans-serif, system-ui, sans-serif`,
      heading_weight: 700,
      body_weight: 400,
      heading_transform: 'none',
      heading_tracking: '-0.035em',
    },
    tokens: {
      radius: '14px',
      container_max: '1200px',
      space_section: '112px',
      space_block: '24px',
      grid_gap: '24px',
    },
  },

  // B — LIGHT warm editorial (paper cream, burnt sienna accent, Playfair serif headings)
  {
    id: 'theme-sunlit-editorial',
    mode: 'light',
    palette: {
      bg: '#f7f1e6',
      surface: '#ffffff',
      text: '#1a1612',
      muted: '#6a5e4e',
      accent: '#c04a1e',
      accent_contrast: '#fff8f2',
      border: '#e4d9c4',
    },
    typography: {
      heading: `'Playfair Display', 'Georgia', serif`,
      body: `'Source Sans 3', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      heading_weight: 700,
      body_weight: 400,
      heading_transform: 'none',
      heading_tracking: '-0.02em',
    },
    tokens: {
      radius: '4px',
      container_max: '1100px',
      space_section: '132px',
      space_block: '32px',
      grid_gap: '36px',
    },
  },

  // C — deep midnight with hot-pink/coral accent (retail everyday app — the light-ish exception)
  {
    id: 'theme-coral-compact',
    mode: 'dark',
    palette: {
      bg: '#120a1f',
      surface: '#1b1030',
      text: '#f6f1ff',
      muted: '#9990ad',
      accent: '#ff5d8f',
      accent_contrast: '#1a0410',
      border: '#2a1a3f',
    },
    typography: {
      heading: `'DM Sans', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      body: `'DM Sans', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      heading_weight: 700,
      body_weight: 400,
      heading_transform: 'none',
      heading_tracking: '-0.03em',
    },
    tokens: {
      radius: '20px',
      container_max: '1140px',
      space_section: '104px',
      space_block: '24px',
      grid_gap: '22px',
    },
  },

  // D — LIGHT institutional clean (white paper, forest-green accent, IBM Plex)
  {
    id: 'theme-clinic-mono',
    mode: 'light',
    palette: {
      bg: '#fafbfc',
      surface: '#ffffff',
      text: '#0c1a1f',
      muted: '#5b6b73',
      accent: '#2b7a5e',
      accent_contrast: '#ffffff',
      border: '#e3e7eb',
    },
    typography: {
      heading: `'IBM Plex Sans', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      body: `'IBM Plex Sans', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      heading_weight: 700,
      body_weight: 400,
      heading_transform: 'none',
      heading_tracking: '-0.03em',
    },
    tokens: {
      radius: '8px',
      container_max: '1200px',
      space_section: '120px',
      space_block: '28px',
      grid_gap: '28px',
    },
  },

  // E — dark violet with electric purple accent (DeFi/performance)
  {
    id: 'theme-stage-amber',
    mode: 'dark',
    palette: {
      bg: '#0a0824',
      surface: '#110e35',
      text: '#eeeaff',
      muted: '#8a85b5',
      accent: '#9b7dff',
      accent_contrast: '#0a0620',
      border: '#1f1a48',
    },
    typography: {
      heading: `'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      body: `'Inter', ui-sans-serif, system-ui, sans-serif`,
      heading_weight: 700,
      body_weight: 400,
      heading_transform: 'none',
      heading_tracking: '-0.035em',
    },
    tokens: {
      radius: '12px',
      container_max: '1200px',
      space_section: '112px',
      space_block: '24px',
      grid_gap: '22px',
    },
  },
];

// Simple color utilities for derived tokens.
function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${m(ar, br)}, ${m(ag, bg)}, ${m(ab, bb)})`;
}

export function themeToCSS(t: Theme): string {
  const isDark = t.mode === 'dark';
  const surfaceAlt = isDark ? mix(t.palette.surface, '#ffffff', 0.06) : mix(t.palette.surface, '#000000', 0.04);
  const accentGlow = rgba(t.palette.accent, 0.18);
  const accentGlowStrong = rgba(t.palette.accent, 0.4);
  const heroRing = rgba(t.palette.accent, 0.25);
  // Form/card insert — inverts theme mode for contrast (dark card on light themes, light card on dark themes).
  const cardBg = isDark ? '#ffffff' : '#0e1627';
  const cardText = isDark ? '#0b1221' : '#f2f4f9';
  const cardBorder = isDark ? '#dfe3ec' : '#243049';
  const cardMuted = isDark ? '#51607a' : '#9aa4b8';
  const cardInputBg = isDark ? '#ffffff' : '#1a2438';
  return `
:root {
  color-scheme: ${isDark ? 'dark' : 'light'};
  --bg: ${t.palette.bg};
  --surface: ${t.palette.surface};
  --surface-alt: ${surfaceAlt};
  --text: ${t.palette.text};
  --muted: ${t.palette.muted};
  --accent: ${t.palette.accent};
  --accent-2: ${t.palette.accent};
  --accent-contrast: ${t.palette.accent_contrast};
  --accent-glow: ${accentGlow};
  --accent-glow-strong: ${accentGlowStrong};
  --hero-ring: ${heroRing};
  --border: ${t.palette.border};
  --card-bg: ${cardBg};
  --card-text: ${cardText};
  --card-border: ${cardBorder};
  --card-muted: ${cardMuted};
  --card-input-bg: ${cardInputBg};
  --radius: ${t.tokens.radius};
  --container-max: ${t.tokens.container_max};
  --space-section: ${t.tokens.space_section};
  --space-block: ${t.tokens.space_block};
  --grid-gap: ${t.tokens.grid_gap};
  --font-heading: ${t.typography.heading};
  --font-body: ${t.typography.body};
  --heading-weight: ${t.typography.heading_weight};
  --body-weight: ${t.typography.body_weight};
  --heading-transform: ${t.typography.heading_transform};
  --heading-tracking: ${t.typography.heading_tracking};
}
`.trim();
}
