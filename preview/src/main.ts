import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from './env.js';
import { briefs } from './briefs.js';
import { personas } from './personas.js';
import { themes } from './themes.js';
import { layouts } from './layouts.js';
import { generateSiteContent } from './llm.js';
import { generateHeroImage } from './images.js';
import { renderSite, googleFontsHref } from './render.js';

const OUT_ROOT = join(process.cwd(), 'out');

// Pairing: 5 sites with 1:1:1:1 mapping across briefs/personas/themes/layouts.
// This is the diversity surface we want to evaluate.
const pairings = [
  { brief: 'site-1', persona: 'persona-skeptic',    theme: 'theme-midnight-cyan',   layout: 'layout-1' },
  { brief: 'site-2', persona: 'persona-teacher',    theme: 'theme-sunlit-editorial',layout: 'layout-2' },
  { brief: 'site-3', persona: 'persona-friend',     theme: 'theme-coral-compact',   layout: 'layout-3' },
  { brief: 'site-4', persona: 'persona-expert',     theme: 'theme-clinic-mono',     layout: 'layout-4' },
  { brief: 'site-5', persona: 'persona-performer',  theme: 'theme-stage-amber',     layout: 'layout-5' },
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

  process.stdout.write(`[${brief.id}] ${brief.niche} · ${persona.name} · ${theme.id}\n`);
  process.stdout.write(`[${brief.id}] generating content…\n`);

  const content = await generateSiteContent(brief, persona);

  // Save raw content JSON for debugging/audit.
  writeFileSync(
    join(outDir, 'content.json'),
    JSON.stringify(content, null, 2),
    'utf8',
  );

  // Hero image (optional).
  let heroImageUrl: string | undefined;
  if (!env.SKIP_IMAGES) {
    try {
      process.stdout.write(`[${brief.id}] generating hero image…\n`);
      const imgPath = join(outDir, 'hero.webp');
      await generateHeroImage(brief.hero_image_prompt, imgPath);
      heroImageUrl = 'hero.webp';
    } catch (e) {
      process.stdout.write(`[${brief.id}] image failed, continuing without: ${(e as Error).message}\n`);
    }
  }

  const html = renderSite({
    content,
    theme,
    layout,
    hero_image_url: heroImageUrl,
    google_fonts_href: googleFontsHref(theme),
  });
  writeFileSync(join(outDir, 'index.html'), html, 'utf8');

  // Manifest for later comparison.
  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify(
      {
        brief: brief.id,
        niche: brief.niche,
        persona: persona.id,
        theme: theme.id,
        layout: layout.id,
        sections: layout.sections,
        built_at: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );

  process.stdout.write(`[${brief.id}] done → ${join(outDir, 'index.html')}\n\n`);
}

async function main(): Promise<void> {
  mkdirSync(OUT_ROOT, { recursive: true });

  // Simple guard: run sites in sequence to avoid API rate hiccups.
  for (const p of pairings) {
    try {
      await buildOne(p);
    } catch (e) {
      process.stderr.write(`[${p.brief}] FAILED: ${(e as Error).stack ?? String(e)}\n`);
    }
  }

  process.stdout.write(`all done. open preview/out/*/index.html in a browser.\n`);
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + '\n');
  process.exit(1);
});
