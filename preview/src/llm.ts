import OpenAI from 'openai';
import { env } from './env.js';
import type { Brief } from './briefs.js';
import type { Persona } from './personas.js';
import type { SiteContent } from './content-schema.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const MODEL = 'gpt-4o-mini';

const USER_TEMPLATE = (brief: Brief) => `
Generate a complete homepage content package for the brand below. Return ONE valid JSON object that matches this TypeScript interface exactly:

interface SiteContent {
  brand: string;               // 1-3 word invented brand name (must look like a real startup, not generic words)
  tagline: string;             // short positioning phrase, <= 70 chars
  meta_title: string;          // <= 60 chars
  meta_description: string;    // 140-160 chars
  hero: { eyebrow: string; title: string; subtitle: string; cta_label: string };
  stats: { items: { number: string; label: string; detail?: string }[] }; // exactly 3 items
  longform: { title: string; paragraphs: string[]; lead_quote?: string }; // 4-5 paragraphs of 2-4 sentences each
  features: { title: string; subtitle: string; items: { title: string; text: string }[] }; // exactly 4 items, each text 1-2 sentences
  reviews: { title: string; items: { name: string; role: string; text: string }[] }; // exactly 3 items
  faq: { title: string; items: { q: string; a: string }[] }; // 5-6 items
  cta: { title: string; text: string; button_label: string };
  footer: { nav: { label: string; href: string }[]; copyright: string }; // 5-6 nav links
}

BRIEF:
- niche: ${brief.niche}
- primary keyword: ${brief.keyword}
- audience: ${brief.audience}
- tone hint (secondary to your persona): ${brief.tone_hint}

HARD RULES:
1. Do NOT use hype words: "cutting-edge", "seamless", "robust", "revolutionary", "state-of-the-art", "game-changing", "transform/transformative", "elevate", "unleash", "unlock", "leverage", "synergy", "world-class", "best-in-class", "next-level", "effortless".
2. Do NOT use stock openers: "In today's", "In the world of", "When it comes to", "It's no secret", "Imagine a world".
3. Do NOT use AI filler conjunctions as sentence starters: "Furthermore", "Moreover", "Additionally", "Consequently", "In conclusion".
4. Brand name mentioned no more than 6 times across the whole JSON (not counting brand field and footer.copyright).
5. No em-dash chains. No ——. Use one em-dash maximum per paragraph.
6. Reviews: realistic first-name + last-initial ("Sarah M."), realistic role tied to audience. No star emojis, no "5/5", no "highly recommend".
7. Stats.number: keep concrete and modest (e.g., "12,480", "94%", "4.2"), not round marketing numbers like "1,000,000+".
8. Return ONLY the JSON object. No explanation, no markdown fences.
`.trim();

export async function generateSiteContent(
  brief: Brief,
  persona: Persona,
): Promise<SiteContent> {
  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.95,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: persona.system_prompt },
      { role: 'user', content: USER_TEMPLATE(brief) },
    ],
  });

  const raw = resp.choices[0]?.message?.content;
  if (!raw) throw new Error(`Empty LLM response for ${brief.id}`);

  let parsed: SiteContent;
  try {
    parsed = JSON.parse(raw) as SiteContent;
  } catch (e) {
    throw new Error(`LLM returned invalid JSON for ${brief.id}: ${raw.slice(0, 200)}…`);
  }

  // Minimal sanity checks — don't over-validate, this is preview.
  if (!parsed.brand || !parsed.hero?.title) {
    throw new Error(`LLM response missing required fields for ${brief.id}`);
  }
  return parsed;
}
