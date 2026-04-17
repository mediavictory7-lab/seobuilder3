import OpenAI from 'openai';
import { env } from './env.js';
import type { Brief } from './briefs.js';
import type { Persona } from './personas.js';
import type {
  SiteIdentity,
  HomeContent,
  SecondaryPages,
  BlogContent,
  BlogArticle,
} from './content-schema.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const MODEL = 'gpt-4o-mini';

const HARD_RULES = `
HARD RULES:
1. Do NOT use hype words: "cutting-edge", "seamless", "robust", "revolutionary", "state-of-the-art", "game-changing", "transformative", "elevate", "unleash", "unlock", "leverage", "synergy", "world-class", "best-in-class", "next-level", "effortless", "empower".
2. Do NOT use stock openers: "In today's", "In the world of", "When it comes to", "It's no secret", "Imagine a world".
3. Do NOT use AI filler sentence-starters: "Furthermore", "Moreover", "Additionally", "Consequently", "In conclusion".
4. Mention brand name at most 8 times across the whole JSON (excluding footer copyright and legal fields).
5. Reviews: realistic first name + last initial ("Sarah M.") with realistic role tied to the audience. No star emojis, no "5/5", no generic "highly recommend".
6. Stats.number: concrete and modest ("12,480", "94%", "4.2"), not round marketing figures like "1,000,000+".
7. Do NOT use em-dash chains (no ——).
8. Return ONLY the JSON object. No markdown fences.
`.trim();

// ------- 1) identity + home -------

const HOME_TEMPLATE = (brief: Brief) => `
Produce ONE JSON object with the following structure:

{
  "identity": {
    "brand": string (MUST be exactly "${brief.brand_override}"),
    "tagline": string (<=70 chars),
    "meta_title": string (<=60 chars),
    "meta_description": string (140-160 chars),
    "company_name": string (realistic full legal name for brand),
    "company_address": string (realistic plausible street address),
    "company_phone": string,
    "company_email": string,
    "company_registration": string (e.g. "Reg. No. HE 123456")
  },
  "home": {
    "hero":           { "eyebrow": "...", "title": "...", "subtitle": "...", "cta_label": "..." },
    "value_prop":     { "title": "...", "lead": "... short positioning sentence ...", "paragraphs": [p1, p2, p3, p4] },   // 4 paragraphs, each 3-5 sentences
    "stats":          { "items": [ {number,label,detail}, {number,label,detail}, {number,label,detail} ] },
    "smarter_trading":{ "title": "...", "subtitle": "...", "items": [ {title,text} x 6 ] },          // text: 2-3 sentences each
    "trust_security": { "title": "...", "subtitle": "...", "cards": [ {title,text} x 4 ] },         // text: 2-3 sentences each
    "how_it_works":   { "title": "...", "subtitle": "...", "steps": [ {title,description} x 5 ] }, // description: 1-2 sentences
    "tools":          { "title": "...", "subtitle": "...", "items": [ {title,text} x 4 ] },         // text: 1-2 sentences
    "longform":       { "title": "...", "paragraphs": [p1,p2,p3,p4], "lead_quote": "..." },         // paragraphs 3-5 sentences each
    "reviews":        { "title": "...", "items": [ {name,role,text} x 6 ] },                        // text: 2-4 sentences, first-name + initial, role fits audience
    "faq":            { "title": "...", "items": [ {q,a} x 8 ] },                                   // a: 2-4 sentences
    "cta":            { "title": "...", "text": "...", "button_label": "..." },
    "footer":         { "nav": [ {label,href} x 6 ], "copyright": "© 2026 ... All rights reserved." }
  }
}

BRIEF
- brand (do not change): ${brief.brand_override}
- niche: ${brief.niche}
- primary keyword: ${brief.keyword}
- angle: ${brief.angle}
- audience: ${brief.audience}
- secondary tone hint: ${brief.tone_hint}

${HARD_RULES}
`.trim();

// ------- 2) secondary pages -------

const PAGES_TEMPLATE = (brief: Brief, brand: string) => `
Produce ONE JSON object for SECONDARY pages of the site for "${brand}". Structure:

{
  "features": {
    "hero": { "title": "...", "subtitle": "..." },
    "sections": [ { "heading": "...", "paragraphs": [p1,p2,p3] } x 5 ],
    "cta": { "title": "...", "text": "...", "button_label": "..." }
  },
  "how_it_works": {
    "hero": { "title": "...", "subtitle": "..." },
    "intro_paragraphs": [p1,p2,p3],
    "steps": [ { "title": "...", "description": "..." } x 6 ],
    "cta": { "title": "...", "text": "...", "button_label": "..." }
  },
  "faq": {
    "hero": { "title": "...", "subtitle": "..." },
    "items": [ { "q": "...", "a": "..." } x 14 ]       // a: 2-4 sentences
  },
  "about": {
    "hero": { "title": "...", "subtitle": "..." },
    "story_paragraphs": [p1,p2,p3,p4,p5],                // each 3-5 sentences
    "values": [ { "title": "...", "text": "..." } x 3 ]
  },
  "contact": {
    "hero": { "title": "...", "subtitle": "..." },
    "intro": "one sentence invitation",
    "company": { "name": "...", "address": "...", "phone": "...", "email": "..." },
    "hours": "e.g. Mon–Fri, 09:00–18:00 CET"
  }
}

BRIEF
- niche: ${brief.niche}
- primary keyword: ${brief.keyword}
- angle: ${brief.angle}
- audience: ${brief.audience}

${HARD_RULES}
`.trim();

// ------- 3) blog articles -------

const BLOG_TEMPLATE = (brief: Brief, brand: string) => `
Produce ONE JSON object with 3 blog articles for "${brand}". Topics (use exactly these, one per article):

${brief.blog_topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Structure:

{
  "index": {
    "hero": { "title": "...", "subtitle": "..." }
  },
  "articles": [
    {
      "slug": "kebab-case-from-title",
      "title": "...",                                // use the topic, may refine wording
      "excerpt": "... 1-2 sentence summary ...",
      "author": "Realistic First Last",              // vary between articles
      "read_time_min": integer (5..10),
      "lead_paragraph": "... 2-4 sentence opening ...",
      "sections": [ { "heading": "...", "paragraphs": [p1,p2,p3] } x 5 ],   // 5 sections, each 2-3 paragraphs, 3-5 sentences each
      "key_takeaways": [ "...", "...", "...", "..." ],
      "faq": [ { "q": "...", "a": "..." } x 3 ]
    },
    { ... article 2 ... },
    { ... article 3 ... }
  ]
}

Each article MUST be educational and useful. Brand "${brand}" may be mentioned at most once per article, and only in a natural context. No promotional tone. Use concrete examples, numbers, named mechanisms rather than adjectives.

${HARD_RULES}
`.trim();

async function callJson<T>(systemPrompt: string, userPrompt: string, label: string): Promise<T> {
  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.9,
    response_format: { type: 'json_object' },
    max_tokens: 10000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
  const raw = resp.choices[0]?.message?.content;
  if (!raw) throw new Error(`Empty LLM response for ${label}`);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Invalid JSON for ${label}: ${raw.slice(0, 250)}…`);
  }
}

export async function generateHomeContent(
  brief: Brief,
  persona: Persona,
): Promise<{ identity: SiteIdentity; home: HomeContent }> {
  return callJson(persona.system_prompt, HOME_TEMPLATE(brief), `${brief.id}/home`);
}

export async function generateSecondaryPages(
  brief: Brief,
  persona: Persona,
  brand: string,
): Promise<SecondaryPages> {
  return callJson(persona.system_prompt, PAGES_TEMPLATE(brief, brand), `${brief.id}/pages`);
}

export async function generateBlog(
  brief: Brief,
  persona: Persona,
  brand: string,
): Promise<BlogContent> {
  return callJson<BlogContent>(persona.system_prompt, BLOG_TEMPLATE(brief, brand), `${brief.id}/blog`);
}

// Post-processing: enforce brand name exactness (LLM sometimes drops the exact brand case/spacing).
export function enforceBrand(obj: unknown, brand: string): unknown {
  if (typeof obj === 'string') {
    // leave as-is; brand substitution below targets only the identity field
    return obj;
  }
  return obj;
}

// Ensures each article has non-empty fields and slug.
export function sanitizeArticle(a: BlogArticle): BlogArticle {
  if (!a.slug) a.slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!a.key_takeaways) a.key_takeaways = [];
  if (!a.faq) a.faq = [];
  return a;
}
