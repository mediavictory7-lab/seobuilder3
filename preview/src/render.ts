import type { SiteContent } from './content-schema.js';
import type { Theme } from './themes.js';
import type { Layout } from './layouts.js';
import { registry } from './sections.js';
import { themeToCSS } from './themes.js';
import { baseCSS } from './base-css.js';

export interface RenderSitePayload {
  content: SiteContent;
  theme: Theme;
  layout: Layout;
  hero_image_url?: string;
  google_fonts_href: string;
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function renderSite(p: RenderSitePayload): string {
  const parts = p.layout.sections.map((key) => {
    const fn = registry[key];
    if (!fn) throw new Error(`Unknown section "${key}"`);
    return fn({ content: p.content, hero_image_url: p.hero_image_url });
  });

  const html = parts.map((x) => x.html).join('\n\n');
  const sectionCss = parts.map((x) => x.css).join('\n');
  const themeCss = themeToCSS(p.theme);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escAttr(p.content.meta_title)}</title>
<meta name="description" content="${escAttr(p.content.meta_description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${escAttr(p.google_fonts_href)}">
<style>
${themeCss}
${baseCSS}
${sectionCss}
</style>
</head>
<body>
${html}
</body>
</html>
`;
}

// Maps our --font-heading / --font-body references to a Google Fonts URL.
// We embed all fonts used across themes in one URL per site (only the two for that theme).
export function googleFontsHref(theme: Theme): string {
  // Parse first font family name out of the CSS font string.
  const firstName = (css: string) => {
    const m = css.match(/['"]?([^,'"]+)['"]?/);
    return m ? m[1].trim() : 'Inter';
  };
  const headingFam = firstName(theme.typography.heading);
  const bodyFam = firstName(theme.typography.body);
  const fams = new Set<string>();
  fams.add(headingFam);
  fams.add(bodyFam);
  const params = Array.from(fams)
    .filter((f) => !/(ui-sans|system-ui|serif|sans-serif|Georgia|monospace)/i.test(f))
    .map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
