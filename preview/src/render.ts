import type { SiteContent, BlogArticle } from './content-schema.js';
import type { Theme } from './themes.js';
import type { Layout } from './layouts.js';
import type { NavLink } from './sections.js';
import { registry } from './sections.js';
import { themeToCSS } from './themes.js';
import { baseCSS } from './base-css.js';

export interface RenderArgs {
  content: SiteContent;
  theme: Theme;
  layout: Layout;
  current_slug: string;
  nav: NavLink[];
  sections: string[];
  hero_image_url?: string;
  subpage_hero?: { title: string; subtitle: string };
  article?: BlogArticle;
  google_fonts_href: string;
  canonical_url?: string;
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function renderPage(p: RenderArgs): string {
  const parts = p.sections.map((key) => {
    const fn = registry[key];
    if (!fn) throw new Error(`Unknown section "${key}"`);
    return fn({
      content: p.content,
      hero_image_url: p.hero_image_url,
      current_slug: p.current_slug,
      nav: p.nav,
      subpage_hero: p.subpage_hero,
      article: p.article,
    });
  });

  const bodyHtml = parts.map((x) => x.html).join('\n\n');
  const sectionCss = parts.map((x) => x.css).join('\n');
  const themeCss = themeToCSS(p.theme);

  const title = p.article
    ? `${p.article.title} · ${p.content.identity.brand}`
    : p.subpage_hero
      ? `${p.subpage_hero.title} · ${p.content.identity.brand}`
      : p.content.identity.meta_title;

  const description = p.article
    ? p.article.excerpt
    : p.subpage_hero
      ? p.subpage_hero.subtitle
      : p.content.identity.meta_description;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escAttr(title)}</title>
<meta name="description" content="${escAttr(description)}">
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
${bodyHtml}
</body>
</html>
`;
}

export function googleFontsHref(theme: Theme): string {
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

export function buildNav(): NavLink[] {
  return [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features.html' },
    { label: 'How It Works', href: '/how-it-works.html' },
    { label: 'FAQ', href: '/faq.html' },
    { label: 'About', href: '/about.html' },
    { label: 'Blog', href: '/blog/' },
    { label: 'Contact', href: '/contact.html' },
  ];
}
