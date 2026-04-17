import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from './env.js';
import { briefs } from './briefs.js';
import { personas } from './personas.js';
import { themes } from './themes.js';
import { layouts } from './layouts.js';
import {
  generateHomeContent,
  generateSecondaryPages,
  generateBlog,
  sanitizeArticle,
} from './llm.js';
import { generateHeroImage } from './images.js';
import { renderPage, googleFontsHref, buildNav } from './render.js';
import type { SiteContent } from './content-schema.js';

const OUT_ROOT = join(process.cwd(), 'out');

const pairings = [
  { brief: 'site-1', persona: 'persona-skeptic',   theme: 'theme-midnight-cyan',    layout: 'layout-1' },
  { brief: 'site-2', persona: 'persona-expert',    theme: 'theme-clinic-mono',      layout: 'layout-2' },
  { brief: 'site-3', persona: 'persona-friend',    theme: 'theme-coral-compact',    layout: 'layout-3' },
  { brief: 'site-4', persona: 'persona-teacher',   theme: 'theme-sunlit-editorial', layout: 'layout-4' },
  { brief: 'site-5', persona: 'persona-performer', theme: 'theme-stage-amber',      layout: 'layout-5' },
] as const;

function pick<T extends { id: string }>(arr: T[], id: string): T {
  const x = arr.find((a) => a.id === id);
  if (!x) throw new Error(`Not found: ${id}`);
  return x;
}

async function buildOne(p: (typeof pairings)[number]): Promise<void> {
  const brief = pick(briefs, p.brief);
  const persona = pick(personas, p.persona);
  const theme = pick(themes, p.theme);
  const layout = layouts[p.layout];

  const outDir = join(OUT_ROOT, brief.id);
  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, 'blog'), { recursive: true });

  const nav = buildNav();
  const fontsHref = googleFontsHref(theme);

  process.stdout.write(`\n[${brief.id}] ${brief.brand_override} · ${persona.name} · ${theme.id}\n`);

  // 1) Home identity + all home sections
  process.stdout.write(`[${brief.id}] generating home content…\n`);
  const home = await generateHomeContent(brief, persona);

  // 2) Secondary pages
  process.stdout.write(`[${brief.id}] generating secondary pages…\n`);
  const pages = await generateSecondaryPages(brief, persona, home.identity.brand);

  // 3) Blog (3 articles)
  process.stdout.write(`[${brief.id}] generating blog…\n`);
  const blog = await generateBlog(brief, persona, home.identity.brand);
  blog.articles = blog.articles.map(sanitizeArticle);

  // Compose full content object.
  const content: SiteContent = {
    identity: home.identity,
    home: home.home,
    pages,
    blog,
  };

  // 4) Hero image (for home).
  let heroImageUrl: string | undefined;
  if (!env.SKIP_IMAGES) {
    try {
      process.stdout.write(`[${brief.id}] generating hero image…\n`);
      const imgPath = join(outDir, 'hero.webp');
      await generateHeroImage(brief.hero_image_prompt, imgPath);
      heroImageUrl = 'hero.webp';
    } catch (e) {
      process.stdout.write(`[${brief.id}] image failed, skipping: ${(e as Error).message}\n`);
    }
  }

  // Save raw content JSON + manifest for audit.
  writeFileSync(join(outDir, 'content.json'), JSON.stringify(content, null, 2), 'utf8');
  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify(
      {
        brief: brief.id,
        brand: home.identity.brand,
        niche: brief.niche,
        persona: persona.id,
        theme: theme.id,
        layout: p.layout,
        built_at: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );

  // 5) Render all pages.
  process.stdout.write(`[${brief.id}] rendering pages…\n`);

  // /index.html
  writeFileSync(
    join(outDir, 'index.html'),
    renderPage({
      content,
      theme,
      layout,
      nav,
      current_slug: 'home',
      sections: layout.home,
      hero_image_url: heroImageUrl,
      google_fonts_href: fontsHref,
    }),
    'utf8',
  );

  // /features.html
  writeFileSync(
    join(outDir, 'features.html'),
    renderPage({
      content,
      theme,
      layout,
      nav,
      current_slug: 'features',
      sections: layout.page_features,
      subpage_hero: pages.features.hero,
      google_fonts_href: fontsHref,
    }),
    'utf8',
  );

  // /how-it-works.html
  writeFileSync(
    join(outDir, 'how-it-works.html'),
    renderPage({
      content,
      theme,
      layout,
      nav,
      current_slug: 'how-it-works',
      sections: layout.page_how_it_works,
      subpage_hero: pages.how_it_works.hero,
      google_fonts_href: fontsHref,
    }),
    'utf8',
  );

  // /faq.html
  writeFileSync(
    join(outDir, 'faq.html'),
    renderPage({
      content,
      theme,
      layout,
      nav,
      current_slug: 'faq',
      sections: layout.page_faq,
      subpage_hero: pages.faq.hero,
      google_fonts_href: fontsHref,
    }),
    'utf8',
  );

  // /about.html
  writeFileSync(
    join(outDir, 'about.html'),
    renderPage({
      content,
      theme,
      layout,
      nav,
      current_slug: 'about',
      sections: layout.page_about,
      subpage_hero: pages.about.hero,
      google_fonts_href: fontsHref,
    }),
    'utf8',
  );

  // /contact.html
  writeFileSync(
    join(outDir, 'contact.html'),
    renderPage({
      content,
      theme,
      layout,
      nav,
      current_slug: 'contact',
      sections: layout.page_contact,
      subpage_hero: pages.contact.hero,
      google_fonts_href: fontsHref,
    }),
    'utf8',
  );

  // /blog/index.html
  writeFileSync(
    join(outDir, 'blog', 'index.html'),
    renderPage({
      content,
      theme,
      layout,
      nav,
      current_slug: 'blog',
      sections: layout.blog_index,
      subpage_hero: blog.index.hero,
      google_fonts_href: fontsHref,
    }),
    'utf8',
  );

  // /blog/{slug}.html
  for (const art of blog.articles) {
    writeFileSync(
      join(outDir, 'blog', `${art.slug}.html`),
      renderPage({
        content,
        theme,
        layout,
        nav,
        current_slug: 'blog-article',
        sections: layout.blog_article,
        article: art,
        google_fonts_href: fontsHref,
      }),
      'utf8',
    );
  }

  process.stdout.write(`[${brief.id}] done → ${outDir}\n`);
}

async function main(): Promise<void> {
  mkdirSync(OUT_ROOT, { recursive: true });
  for (const p of pairings) {
    try {
      await buildOne(p);
    } catch (e) {
      process.stderr.write(`[${p.brief}] FAILED: ${(e as Error).stack ?? String(e)}\n`);
    }
  }
  process.stdout.write(`\nall done. serve preview/out/ and open site-{1..5}/.\n`);
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + '\n');
  process.exit(1);
});
