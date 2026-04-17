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
  // A — dark trading ethos, cyan accent, geometric sans
  {
    id: 'theme-midnight-cyan',
    mode: 'dark',
    palette: {
      bg: '#0a1020',
      surface: '#121a2e',
      text: '#e8eef9',
      muted: '#8897b5',
      accent: '#3ad0d9',
      accent_contrast: '#06121a',
      border: '#1f2a44',
    },
    typography: {
      heading: `'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      body: `'Inter', ui-sans-serif, system-ui, sans-serif`,
      heading_weight: 600,
      body_weight: 400,
      heading_transform: 'none',
      heading_tracking: '-0.02em',
    },
    tokens: {
      radius: '6px',
      container_max: '1120px',
      space_section: '96px',
      space_block: '24px',
      grid_gap: '24px',
    },
  },

  // B — warm light, serif editorial, lots of breathing room
  {
    id: 'theme-sunlit-editorial',
    mode: 'light',
    palette: {
      bg: '#f8f4ec',
      surface: '#ffffff',
      text: '#201a15',
      muted: '#6a5f54',
      accent: '#8b5a2b',
      accent_contrast: '#fefcf7',
      border: '#e7dfd1',
    },
    typography: {
      heading: `'Source Serif 4', 'Georgia', serif`,
      body: `'Source Sans 3', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      heading_weight: 500,
      body_weight: 400,
      heading_transform: 'none',
      heading_tracking: '-0.01em',
    },
    tokens: {
      radius: '2px',
      container_max: '960px',
      space_section: '128px',
      space_block: '32px',
      grid_gap: '40px',
    },
  },

  // C — duotone muted coral/navy, rounded, playful-practical
  {
    id: 'theme-coral-compact',
    mode: 'duotone',
    palette: {
      bg: '#fcf7f3',
      surface: '#ffffff',
      text: '#1f2a44',
      muted: '#5b6782',
      accent: '#e26d5a',
      accent_contrast: '#fff8f3',
      border: '#efe2d7',
    },
    typography: {
      heading: `'DM Sans', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      body: `'DM Sans', ui-sans-serif, system-ui, sans-serif`,
      heading_weight: 700,
      body_weight: 400,
      heading_transform: 'none',
      heading_tracking: '-0.025em',
    },
    tokens: {
      radius: '18px',
      container_max: '1040px',
      space_section: '80px',
      space_block: '20px',
      grid_gap: '18px',
    },
  },

  // D — clinical light mono, tight, authoritative
  {
    id: 'theme-clinic-mono',
    mode: 'light',
    palette: {
      bg: '#ffffff',
      surface: '#f6f7f9',
      text: '#0f1216',
      muted: '#51585f',
      accent: '#20483e',
      accent_contrast: '#f6fbf7',
      border: '#dde0e5',
    },
    typography: {
      heading: `'IBM Plex Sans', 'Inter', ui-sans-serif, system-ui, sans-serif`,
      body: `'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif`,
      heading_weight: 600,
      body_weight: 400,
      heading_transform: 'uppercase',
      heading_tracking: '0.04em',
    },
    tokens: {
      radius: '4px',
      container_max: '1080px',
      space_section: '112px',
      space_block: '28px',
      grid_gap: '28px',
    },
  },

  // E — warm dark amber, theatrical, rhythmic
  {
    id: 'theme-stage-amber',
    mode: 'dark',
    palette: {
      bg: '#141007',
      surface: '#1f1810',
      text: '#f5ecd8',
      muted: '#a8997a',
      accent: '#e9b450',
      accent_contrast: '#1a1309',
      border: '#3a2e1c',
    },
    typography: {
      heading: `'Playfair Display', 'Georgia', serif`,
      body: `'Inter', ui-sans-serif, system-ui, sans-serif`,
      heading_weight: 600,
      body_weight: 400,
      heading_transform: 'none',
      heading_tracking: '-0.015em',
    },
    tokens: {
      radius: '10px',
      container_max: '1000px',
      space_section: '104px',
      space_block: '26px',
      grid_gap: '22px',
    },
  },
];

export function themeToCSS(t: Theme): string {
  return `
:root {
  color-scheme: ${t.mode === 'dark' ? 'dark' : 'light'};
  --bg: ${t.palette.bg};
  --surface: ${t.palette.surface};
  --text: ${t.palette.text};
  --muted: ${t.palette.muted};
  --accent: ${t.palette.accent};
  --accent-contrast: ${t.palette.accent_contrast};
  --border: ${t.palette.border};
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
