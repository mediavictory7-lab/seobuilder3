import type { SiteContent, BlogArticle } from './content-schema.js';
import { iconByIndex, iconFor } from './icons.js';

export interface NavLink { label: string; href: string; }

export interface RenderCtx {
  content: SiteContent;
  hero_image_url?: string;
  current_slug: string;
  nav: NavLink[];
  subpage_hero?: { title: string; subtitle: string };
  article?: BlogArticle;
}

export interface SectionOutput { html: string; css: string; }
export type SectionRenderer = (ctx: RenderCtx) => SectionOutput;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Splits a title and wraps the accent_phrase in an <em class="accent-word">.
function titleWithAccent(title: string, phrase: string): string {
  if (!phrase) return esc(title);
  const idx = title.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx < 0) return esc(title);
  const before = title.slice(0, idx);
  const match = title.slice(idx, idx + phrase.length);
  const after = title.slice(idx + phrase.length);
  return `${esc(before)}<em class="accent-word">${esc(match)}</em>${esc(after)}`;
}

// Small stars string
const starsSvg = `<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>`;

// ============================== HEADER ==============================

const headerV1: SectionRenderer = ({ content, nav }) => ({
  html: `
<header class="hdr hdr--v1">
  <div class="container hdr__row">
    <a class="hdr__brand" href="/">
      <span class="hdr__mark" aria-hidden="true"></span>
      <span>${esc(content.identity.brand)}</span>
    </a>
    <nav class="hdr__nav" aria-label="Main">
      ${nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('\n      ')}
    </nav>
    <a href="#cta" class="btn btn--primary hdr__cta">Get Started</a>
  </div>
</header>`.trim(),
  css: `
.hdr--v1 { position: sticky; top: 0; z-index: 20; padding-block: 16px; background: color-mix(in srgb, var(--bg) 85%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); }
.hdr--v1 .hdr__row { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.hdr--v1 .hdr__brand { display: inline-flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; font-family: var(--font-heading); font-weight: 800; font-size: 1.08rem; letter-spacing: -0.015em; }
.hdr--v1 .hdr__mark { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, var(--bg))); box-shadow: inset 0 -6px 12px -8px rgba(0,0,0,0.35); }
.hdr--v1 .hdr__nav { display: flex; gap: 22px; }
.hdr--v1 .hdr__nav a { color: color-mix(in srgb, var(--muted) 80%, var(--text)); text-decoration: none; font-size: 0.92rem; font-weight: 500; }
.hdr--v1 .hdr__nav a:hover { color: var(--text); }
.hdr--v1 .hdr__cta { padding: 10px 18px; font-size: 0.9rem; }
@media (max-width: 900px) { .hdr--v1 .hdr__nav { display: none; } }
`,
});

const headerV2: SectionRenderer = ({ content, nav }) => ({
  html: `
<header class="hdr hdr--v2">
  <div class="container hdr__row">
    <a class="hdr__brand" href="/">
      <span class="hdr__mark" aria-hidden="true"></span>
      <span>${esc(content.identity.brand)}</span>
    </a>
    <nav class="hdr__nav" aria-label="Main">
      ${nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('\n      ')}
    </nav>
    <a href="#cta" class="btn btn--primary hdr__cta">Open Account →</a>
  </div>
</header>`.trim(),
  css: `
.hdr--v2 { position: sticky; top: 0; z-index: 20; padding-block: 14px; background: color-mix(in srgb, var(--bg) 90%, transparent); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.hdr--v2 .hdr__row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 28px; }
.hdr--v2 .hdr__brand { display: inline-flex; align-items: center; gap: 12px; color: var(--text); text-decoration: none; font-family: var(--font-heading); font-weight: 800; font-size: 1.15rem; letter-spacing: -0.02em; }
.hdr--v2 .hdr__mark { width: 34px; height: 34px; border-radius: 50%; background: conic-gradient(from 180deg at 50% 50%, var(--accent), color-mix(in srgb, var(--accent) 40%, #000), var(--accent)); position: relative; }
.hdr--v2 .hdr__mark::after { content: ""; position: absolute; inset: 6px; background: var(--bg); border-radius: 50%; }
.hdr--v2 .hdr__nav { display: flex; gap: 24px; justify-content: center; }
.hdr--v2 .hdr__nav a { color: color-mix(in srgb, var(--muted) 85%, var(--text)); text-decoration: none; font-size: 0.93rem; font-weight: 500; }
.hdr--v2 .hdr__nav a:hover { color: var(--accent); }
.hdr--v2 .hdr__cta { padding: 11px 20px; font-size: 0.9rem; }
@media (max-width: 900px) { .hdr--v2 .hdr__row { grid-template-columns: auto auto; } .hdr--v2 .hdr__nav { display: none; } }
`,
});

// ============================== HERO (form-first) ==============================

const heroV1: SectionRenderer = ({ content }) => {
  const h = content.home.hero;
  const m = content.home.trust_media;
  return {
    html: `
<section class="hero hero--v1">
  <div class="bg-mesh bg-mesh--1"></div>
  <div class="bg-mesh bg-mesh--2"></div>
  <div class="container hero__grid">
    <div class="hero__content">
      <span class="pill">${esc(h.eyebrow)}</span>
      <h1 class="hero__title">${titleWithAccent(h.title, h.accent_phrase)}</h1>
      <p class="hero__sub">${esc(h.subtitle)}</p>
      <div class="hero__rating">
        <span class="stars"><span class="stars__row">${starsSvg}${starsSvg}${starsSvg}${starsSvg}${starsSvg}</span><span><span class="stars__num">Rated ${esc(h.rating_score)}</span> <span>${esc(h.rating_label)}</span></span></span>
      </div>
      ${h.risk_note ? `<p class="risk-note">*${esc(h.risk_note)}</p>` : ''}
      <div class="hero__trust">
        <div class="eyebrow hero__trust-eyebrow">${esc(m.eyebrow)}</div>
        <div class="hero__trust-row">
          ${m.outlets.slice(0, 5).map((o) => `<span class="outlet">${esc(o)}</span>`).join('\n          ')}
        </div>
      </div>
    </div>
    <aside class="hero__form" aria-label="Register">
      <h2 class="hero__form-title">${esc(h.form_title)}</h2>
      <p class="hero__form-sub">${esc(h.form_subtitle)}</p>
      <form class="hero__fields" onsubmit="return false">
        <label class="field"><span>First name</span><input type="text" /></label>
        <label class="field"><span>Last name</span><input type="text" /></label>
        <label class="field"><span>Email</span><input type="email" /></label>
        <label class="field"><span>Phone</span><input type="tel" /></label>
        <button type="submit" class="btn btn--primary btn--block">${esc(h.form_submit_label)}</button>
        <p class="hero__fineprint">By registering, you agree to our <a href="/terms.html">Terms</a> and <a href="/privacy.html">Privacy Policy</a>.</p>
      </form>
    </aside>
  </div>
</section>`.trim(),
    css: `
.hero--v1 { padding-block: calc(var(--space-section) * 1.1) calc(var(--space-section) * 0.9); overflow: hidden; }
.hero--v1 .hero__grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: calc(var(--grid-gap) * 2.2); align-items: center; position: relative; z-index: 1; }
.hero--v1 .hero__title { font-size: clamp(2.6rem, 5vw + 0.6rem, 4.3rem); line-height: 1.02; margin: 18px 0 18px; letter-spacing: -0.04em; }
.hero--v1 .accent-word { color: var(--accent); font-style: normal; }
.hero--v1 .hero__sub { color: var(--muted); font-size: 1.12rem; max-width: 500px; margin: 0 0 22px; line-height: 1.55; }
.hero--v1 .hero__rating { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.hero--v1 .hero__trust { margin-top: 34px; padding: 18px 20px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-alt); }
.hero--v1 .hero__trust-eyebrow { color: var(--accent); margin-bottom: 12px; }
.hero--v1 .hero__trust-row { display: flex; gap: 28px; flex-wrap: wrap; align-items: center; }
.hero--v1 .outlet { font-family: var(--font-heading); font-weight: 800; letter-spacing: 0.02em; color: color-mix(in srgb, var(--text) 75%, transparent); font-size: 1rem; text-transform: uppercase; opacity: 0.85; }
.hero--v1 .outlet:nth-child(1) { font-family: Georgia, serif; font-weight: 700; letter-spacing: -0.01em; }
.hero--v1 .outlet:nth-child(2) { font-weight: 900; letter-spacing: 0.12em; }
.hero--v1 .outlet:nth-child(3) { font-family: 'DM Sans', sans-serif; font-style: italic; }
.hero--v1 .outlet:nth-child(4) { font-weight: 700; letter-spacing: -0.04em; font-size: 1.1rem; }
.hero--v1 .outlet:nth-child(5) { font-family: 'Space Grotesk', sans-serif; font-weight: 700; }

.hero--v1 .hero__form { background: var(--card-bg); color: var(--card-text); padding: 32px; border-radius: 18px; box-shadow: 0 30px 60px -20px rgba(0,0,0,0.45), 0 0 0 1px var(--card-border); }
.hero--v1 .hero__form-title { color: var(--card-text); font-size: 1.7rem; letter-spacing: -0.02em; margin: 0 0 6px; font-family: var(--font-heading); font-weight: 800; }
.hero--v1 .hero__form-sub { color: var(--card-muted); font-size: 0.95rem; margin: 0 0 20px; }
.hero--v1 .hero__fields { display: grid; gap: 12px; }
.hero--v1 .field { display: grid; gap: 5px; font-size: 0.82rem; color: var(--card-muted); font-weight: 500; }
.hero--v1 .field input { padding: 13px 14px; border: 1px solid var(--card-border); border-radius: 12px; font: inherit; color: var(--card-text); background: var(--card-input-bg); transition: border-color 0.15s ease, box-shadow 0.15s ease; }
.hero--v1 .field input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
.hero--v1 .hero__fineprint { font-size: 0.78rem; color: var(--card-muted); margin: 10px 0 0; text-align: center; line-height: 1.5; }
.hero--v1 .hero__fineprint a { color: var(--card-text); text-decoration: underline; text-decoration-color: var(--card-border); }

@media (max-width: 960px) {
  .hero--v1 .hero__grid { grid-template-columns: 1fr; }
}
`,
  };
};

// Variant 2 — hero with decorative art on right instead of form (Meridian-style)
const heroV2: SectionRenderer = ({ content, hero_image_url }) => {
  const h = content.home.hero;
  return {
    html: `
<section class="hero hero--v2">
  <div class="bg-mesh bg-mesh--1"></div>
  <div class="bg-mesh bg-mesh--2"></div>
  <div class="container hero__grid">
    <div class="hero__content">
      <span class="pill">${esc(h.eyebrow)}</span>
      <h1 class="hero__title">${titleWithAccent(h.title, h.accent_phrase)}</h1>
      <p class="hero__sub">${esc(h.subtitle)}</p>
      <div class="hero__actions">
        <a href="#cta" class="btn btn--primary">${esc(h.cta_label)}</a>
        <a href="/features.html" class="btn btn--ghost">Explore Features</a>
      </div>
      <div class="hero__rating">
        <span class="stars"><span class="stars__row">${starsSvg}${starsSvg}${starsSvg}${starsSvg}${starsSvg}</span><span><span class="stars__num">${esc(h.rating_score)}</span> · ${esc(h.rating_label)}</span></span>
      </div>
    </div>
    <div class="hero__art">
      <div class="hero__ring hero__ring--outer"></div>
      <div class="hero__ring hero__ring--inner"></div>
      ${hero_image_url
        ? `<div class="hero__orb"><img src="${esc(hero_image_url)}" alt="" /></div>`
        : `<div class="hero__orb hero__orb--placeholder"></div>`}
      <div class="hero__dot hero__dot--1"></div>
      <div class="hero__dot hero__dot--2"></div>
      <div class="hero__dot hero__dot--3"></div>
    </div>
  </div>
</section>`.trim(),
    css: `
.hero--v2 { padding-block: calc(var(--space-section) * 1.1) calc(var(--space-section) * 1.0); overflow: hidden; }
.hero--v2 .hero__grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: calc(var(--grid-gap) * 2.2); align-items: center; position: relative; z-index: 1; }
.hero--v2 .hero__title { font-size: clamp(2.6rem, 5.2vw + 0.6rem, 4.4rem); line-height: 1.02; margin: 18px 0; letter-spacing: -0.04em; }
.hero--v2 .accent-word { color: var(--accent); font-style: normal; }
.hero--v2 .hero__sub { color: var(--muted); font-size: 1.12rem; max-width: 540px; margin: 0 0 28px; line-height: 1.55; }
.hero--v2 .hero__actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.hero--v2 .hero__rating { margin-top: 8px; }

.hero--v2 .hero__art { position: relative; aspect-ratio: 1/1; max-width: 500px; margin-left: auto; }
.hero--v2 .hero__ring { position: absolute; inset: 0; border-radius: 50%; border: 1px dashed var(--border); }
.hero--v2 .hero__ring--inner { inset: 15%; border-style: dashed; border-color: color-mix(in srgb, var(--accent) 25%, transparent); }
.hero--v2 .hero__orb { position: absolute; inset: 18%; border-radius: 50%; overflow: hidden; box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 60%, transparent), 0 40px 80px -20px var(--accent-glow-strong), inset 0 0 40px var(--accent-glow); background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 35%, #000)); }
.hero--v2 .hero__orb img { width: 100%; height: 100%; object-fit: cover; opacity: 1; }
.hero--v2 .hero__orb--placeholder { background: radial-gradient(circle at 30% 30%, var(--accent), color-mix(in srgb, var(--accent) 30%, #000)); }
.hero--v2 .hero__dot { position: absolute; width: 14px; height: 14px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 20px 6px var(--accent-glow); }
.hero--v2 .hero__dot--1 { top: 6%; left: 50%; }
.hero--v2 .hero__dot--2 { bottom: 12%; left: 14%; width: 10px; height: 10px; background: color-mix(in srgb, var(--accent) 70%, #fff); }
.hero--v2 .hero__dot--3 { top: 42%; right: 2%; }

@media (max-width: 960px) {
  .hero--v2 .hero__grid { grid-template-columns: 1fr; }
  .hero--v2 .hero__art { max-width: 380px; margin: 0 auto; }
}
`,
  };
};

// ============================== HERO-SHORT (secondary pages) ==============================

const heroShortV1: SectionRenderer = ({ subpage_hero }) => {
  const h = subpage_hero ?? { title: '', subtitle: '' };
  return {
    html: `
<section class="heroS heroS--v1">
  <div class="bg-mesh bg-mesh--1"></div>
  <div class="container heroS__wrap">
    <h1>${esc(h.title)}</h1>
    ${h.subtitle ? `<p>${esc(h.subtitle)}</p>` : ''}
  </div>
</section>`.trim(),
    css: `
.heroS--v1 { padding-block: calc(var(--space-section) * 0.9) calc(var(--space-section) * 0.55); text-align: center; border-bottom: 1px solid var(--border); overflow: hidden; }
.heroS--v1 .heroS__wrap { max-width: 820px; margin: 0 auto; position: relative; z-index: 1; }
.heroS--v1 h1 { font-size: clamp(2.2rem, 3.8vw + 0.6rem, 3.5rem); }
.heroS--v1 p { color: var(--muted); font-size: 1.15rem; margin: 14px 0 0; }
`,
  };
};

// ============================== STATS ==============================

const statsV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="stats stats--v1">
  <div class="container">
    <div class="stats__row">
      ${content.home.stats.items
        .map(
          (s) => `
      <div class="stats__item">
        <div class="stats__num">${esc(s.number)}</div>
        <div class="stats__label">${esc(s.label)}</div>
      </div>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.stats--v1 { padding-block: calc(var(--space-section) * 0.55); }
.stats--v1 .stats__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--grid-gap); padding: 36px 40px; border: 1px solid var(--border); border-radius: 22px; background: var(--surface); box-shadow: inset 0 0 80px -40px var(--accent-glow); }
.stats--v1 .stats__item { text-align: center; border-right: 1px solid var(--border); padding: 0 10px; }
.stats--v1 .stats__item:last-child { border-right: none; }
.stats--v1 .stats__num { font-family: var(--font-heading); font-size: clamp(2.4rem, 3.6vw + 0.4rem, 3.2rem); font-weight: 800; color: var(--accent); line-height: 1; letter-spacing: -0.03em; }
.stats--v1 .stats__label { margin-top: 12px; color: var(--muted); font-size: 0.82rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }
@media (max-width: 720px) { .stats--v1 .stats__item { border-right: none; border-bottom: 1px solid var(--border); padding-bottom: 16px; } .stats--v1 .stats__item:last-child { border-bottom: none; } }
`,
});

const statsV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="stats stats--v2">
  <div class="container">
    <div class="stats__grid">
      ${content.home.stats.items
        .map(
          (s) => `
      <div class="stats__card">
        <div class="stats__num">${esc(s.number)}</div>
        <div class="stats__label">${esc(s.label)}</div>
        ${s.detail ? `<p class="stats__detail">${esc(s.detail)}</p>` : ''}
      </div>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.stats--v2 { padding-block: var(--space-section); }
.stats--v2 .stats__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--grid-gap); }
.stats--v2 .stats__card { padding: 30px 28px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; position: relative; overflow: hidden; }
.stats--v2 .stats__card::before { content: ""; position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle, var(--accent-glow-strong), transparent 70%); filter: blur(20px); }
.stats--v2 .stats__num { font-family: var(--font-heading); font-size: 2.8rem; font-weight: 800; color: var(--accent); line-height: 1; letter-spacing: -0.03em; position: relative; }
.stats--v2 .stats__label { font-weight: 700; margin-top: 10px; font-size: 1rem; position: relative; }
.stats--v2 .stats__detail { color: var(--muted); font-size: 0.92rem; margin: 10px 0 0; position: relative; line-height: 1.5; }
`,
});

// ============================== VALUE-PROP ==============================

const valuePropV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="vp vp--v1">
  <div class="container vp__grid">
    <div class="vp__col-a">
      <span class="eyebrow accent">Why it matters</span>
      <h2>${esc(content.home.value_prop.title)}</h2>
      <p class="vp__lead">${esc(content.home.value_prop.lead)}</p>
    </div>
    <div class="vp__col-b">
      ${content.home.value_prop.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
    </div>
  </div>
</section>`.trim(),
  css: `
.vp--v1 .vp__grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: calc(var(--grid-gap) * 2); align-items: start; }
.vp--v1 .vp__col-a { position: sticky; top: 100px; }
.vp--v1 h2 { margin-top: 12px; }
.vp--v1 .vp__lead { color: var(--accent); font-family: var(--font-heading); font-weight: 600; font-size: 1.15rem; line-height: 1.4; margin-top: 18px; }
.vp--v1 .vp__col-b p { font-size: 1.05rem; line-height: 1.7; }
.vp--v1 .vp__col-b p + p { margin-top: 1.1em; }
.vp--v1 .vp__col-b p:first-child::first-letter { font-family: var(--font-heading); font-size: 3.4em; float: left; line-height: 0.95; margin: 0.02em 0.12em 0 0; color: var(--accent); font-weight: 800; }
@media (max-width: 860px) { .vp--v1 .vp__grid { grid-template-columns: 1fr; } .vp--v1 .vp__col-a { position: static; } }
`,
});

// ============================== SMARTER-TRADING (features grid) ==============================

const smarterTradingV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="sm sm--v1">
  <div class="container">
    <div class="sm__head">
      <span class="eyebrow accent">Platform</span>
      <h2>${esc(content.home.smarter_trading.title)}</h2>
      <p class="muted">${esc(content.home.smarter_trading.subtitle)}</p>
    </div>
    <div class="sm__grid">
      ${content.home.smarter_trading.items
        .map(
          (f, i) => `
      <article class="sm__card">
        <div class="sm__icon">${iconByIndex(i)}</div>
        <h3>${esc(f.title)}</h3>
        <p>${esc(f.text)}</p>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.sm--v1 .sm__head { max-width: 720px; margin-bottom: 56px; }
.sm--v1 .sm__head .eyebrow { margin-bottom: 10px; }
.sm--v1 .sm__head h2 { margin-top: 4px; }
.sm--v1 .sm__head .muted { font-size: 1.1rem; margin-top: 10px; line-height: 1.55; max-width: 580px; }
.sm--v1 .sm__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--grid-gap); }
.sm--v1 .sm__card { padding: 28px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; transition: border-color 0.15s ease, transform 0.15s ease; }
.sm--v1 .sm__card:hover { border-color: color-mix(in srgb, var(--accent) 50%, var(--border)); transform: translateY(-2px); }
.sm--v1 .sm__icon { width: 48px; height: 48px; border-radius: 12px; background: color-mix(in srgb, var(--accent) 14%, var(--surface)); color: var(--accent); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.sm--v1 .sm__icon svg { width: 24px; height: 24px; }
.sm--v1 .sm__card h3 { margin: 0 0 10px; font-size: 1.1rem; }
.sm--v1 .sm__card p { color: var(--muted); margin: 0; font-size: 0.97rem; line-height: 1.6; }
`,
});

const smarterTradingV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="sm sm--v2">
  <div class="container">
    <div class="sm__head sm__head--centered">
      <span class="eyebrow accent">Features</span>
      <h2>${esc(content.home.smarter_trading.title)}</h2>
      <p class="muted">${esc(content.home.smarter_trading.subtitle)}</p>
    </div>
    <div class="sm__grid">
      ${content.home.smarter_trading.items
        .map(
          (f, i) => `
      <article class="sm__card">
        <div class="sm__num">${String(i + 1).padStart(2, '0')}</div>
        <div class="sm__icon">${iconByIndex(i + 3)}</div>
        <h3>${esc(f.title)}</h3>
        <p>${esc(f.text)}</p>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.sm--v2 .sm__head--centered { text-align: center; max-width: 720px; margin: 0 auto 56px; }
.sm--v2 .sm__head .eyebrow { margin-bottom: 10px; }
.sm--v2 .sm__head .muted { font-size: 1.1rem; margin-top: 12px; line-height: 1.55; }
.sm--v2 .sm__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--grid-gap); }
.sm--v2 .sm__card { padding: 30px; background: linear-gradient(180deg, var(--surface), color-mix(in srgb, var(--surface) 70%, var(--bg))); border: 1px solid var(--border); border-radius: 18px; position: relative; }
.sm--v2 .sm__num { position: absolute; top: 22px; right: 24px; font-family: var(--font-heading); font-size: 0.85rem; font-weight: 700; color: color-mix(in srgb, var(--accent) 70%, var(--muted)); letter-spacing: 0.1em; }
.sm--v2 .sm__icon { width: 44px; height: 44px; border-radius: 50%; background: var(--accent); color: var(--accent-contrast); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 22px; box-shadow: 0 8px 20px -6px var(--accent-glow-strong); }
.sm--v2 .sm__icon svg { width: 22px; height: 22px; }
.sm--v2 .sm__card h3 { margin: 0 0 10px; font-size: 1.1rem; }
.sm--v2 .sm__card p { color: var(--muted); margin: 0; font-size: 0.97rem; line-height: 1.6; }
`,
});

// ============================== TRUST-SECURITY ==============================

const trustSecurityV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="ts ts--v1">
  <div class="container">
    <div class="ts__head">
      <span class="eyebrow accent">Security</span>
      <h2>${esc(content.home.trust_security.title)}</h2>
      <p class="muted">${esc(content.home.trust_security.subtitle)}</p>
    </div>
    <div class="ts__grid">
      ${content.home.trust_security.cards
        .map(
          (c, i) => `
      <div class="ts__card">
        <div class="ts__icon">${[iconFor('shield'), iconFor('lock'), iconFor('check'), iconFor('layers')][i % 4]}</div>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.text)}</p>
      </div>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.ts--v1 { background: var(--surface-alt); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.ts--v1 .ts__head { max-width: 720px; margin: 0 auto 48px; text-align: center; }
.ts--v1 .ts__head .eyebrow { margin-bottom: 10px; }
.ts--v1 .ts__head .muted { font-size: 1.1rem; margin-top: 12px; }
.ts--v1 .ts__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--grid-gap); }
.ts--v1 .ts__card { padding: 26px; background: var(--bg); border: 1px solid var(--border); border-radius: 16px; text-align: left; }
.ts--v1 .ts__icon { width: 42px; height: 42px; border-radius: 10px; background: color-mix(in srgb, var(--accent) 15%, var(--surface)); color: var(--accent); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.ts--v1 .ts__icon svg { width: 22px; height: 22px; }
.ts--v1 .ts__card h3 { margin: 0 0 8px; font-size: 1rem; }
.ts--v1 .ts__card p { color: var(--muted); margin: 0; font-size: 0.92rem; line-height: 1.55; }
`,
});

// ============================== HOW-IT-WORKS (horizontal timeline) ==============================

const howItWorksV1: SectionRenderer = ({ content }) => {
  const steps = content.home.how_it_works.steps.slice(0, 4); // cap at 4 for horizontal layout
  return {
    html: `
<section class="hiw hiw--v1">
  <div class="container">
    <div class="hiw__head">
      <span class="eyebrow accent">Process</span>
      <h2>${esc(content.home.how_it_works.title)}</h2>
      <p class="muted">${esc(content.home.how_it_works.subtitle)}</p>
    </div>
    <div class="hiw__track">
      <div class="hiw__line" aria-hidden="true"></div>
      ${steps
        .map(
          (s, i) => `
      <div class="hiw__step">
        <div class="hiw__circle">${i + 1}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.description)}</p>
      </div>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
    css: `
.hiw--v1 .hiw__head { text-align: center; max-width: 720px; margin: 0 auto 64px; }
.hiw--v1 .hiw__head .muted { margin-top: 12px; font-size: 1.1rem; }
.hiw--v1 .hiw__track { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--grid-gap); position: relative; }
.hiw--v1 .hiw__line { position: absolute; top: 28px; left: 8%; right: 8%; height: 2px; background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 20%, transparent)); opacity: 0.4; z-index: 0; }
.hiw--v1 .hiw__step { position: relative; z-index: 1; text-align: center; padding: 0 6px; }
.hiw--v1 .hiw__circle { width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: var(--accent-contrast); font-family: var(--font-heading); font-weight: 800; font-size: 1.35rem; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 12px 30px -10px var(--accent-glow-strong), inset 0 0 0 4px var(--bg); outline: 2px solid var(--accent); }
.hiw--v1 .hiw__step h3 { margin: 0 0 6px; font-size: 1.05rem; }
.hiw--v1 .hiw__step p { color: var(--muted); margin: 0; font-size: 0.95rem; line-height: 1.55; }
@media (max-width: 860px) {
  .hiw--v1 .hiw__track { grid-template-columns: 1fr; gap: 28px; }
  .hiw--v1 .hiw__line { display: none; }
}
`,
  };
};

// ============================== TOOLS ==============================

const toolsV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="tl tl--v1">
  <div class="container">
    <div class="tl__head">
      <span class="eyebrow accent">Toolkit</span>
      <h2>${esc(content.home.tools.title)}</h2>
      <p class="muted">${esc(content.home.tools.subtitle)}</p>
    </div>
    <div class="tl__grid">
      ${content.home.tools.items
        .map(
          (t, i) => `
      <div class="tl__card">
        <div class="tl__icon">${[iconFor('signal'), iconFor('gauge'), iconFor('compass'), iconFor('brain')][i % 4]}</div>
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.text)}</p>
      </div>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.tl--v1 .tl__head { max-width: 720px; margin-bottom: 48px; }
.tl--v1 .tl__head .muted { margin-top: 12px; font-size: 1.05rem; }
.tl--v1 .tl__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--grid-gap); }
.tl--v1 .tl__card { padding: 24px; border: 1px solid var(--border); border-radius: 16px; background: transparent; display: flex; flex-direction: column; gap: 12px; }
.tl--v1 .tl__icon { width: 40px; height: 40px; border-radius: 10px; background: color-mix(in srgb, var(--accent) 14%, var(--surface)); color: var(--accent); display: inline-flex; align-items: center; justify-content: center; }
.tl--v1 .tl__icon svg { width: 22px; height: 22px; }
.tl--v1 .tl__card h3 { margin: 0; font-size: 1.02rem; }
.tl--v1 .tl__card p { color: var(--muted); margin: 0; font-size: 0.93rem; line-height: 1.55; }
`,
});

// ============================== LONGFORM ==============================

const longformV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="lf lf--v1">
  <div class="container lf__wrap">
    <span class="eyebrow accent">Perspective</span>
    <h2>${esc(content.home.longform.title)}</h2>
    <div class="lf__body">
      ${content.home.longform.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
    </div>
  </div>
</section>`.trim(),
  css: `
.lf--v1 .lf__wrap { max-width: 760px; margin: 0 auto; }
.lf--v1 h2 { margin: 10px 0 28px; }
.lf--v1 .lf__body p { font-size: 1.08rem; line-height: 1.75; }
.lf--v1 .lf__body p + p { margin-top: 1.1em; }
`,
});

const longformV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="lf lf--v2">
  <div class="container lf__grid">
    <div class="lf__aside">
      <span class="eyebrow accent">In depth</span>
      <h2>${esc(content.home.longform.title)}</h2>
      ${content.home.longform.lead_quote ? `<blockquote class="lf__quote">${esc(content.home.longform.lead_quote)}</blockquote>` : ''}
    </div>
    <div class="lf__body">
      ${content.home.longform.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
    </div>
  </div>
</section>`.trim(),
  css: `
.lf--v2 .lf__grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: calc(var(--grid-gap) * 2); }
.lf--v2 .lf__aside { position: sticky; top: 100px; align-self: start; }
.lf--v2 .lf__aside h2 { margin: 10px 0 20px; }
.lf--v2 .lf__quote { font-family: var(--font-heading); font-style: italic; font-size: 1.35rem; border-left: 3px solid var(--accent); padding-left: 20px; margin: 0; color: var(--muted); line-height: 1.4; }
.lf--v2 .lf__body p { font-size: 1.05rem; line-height: 1.7; }
.lf--v2 .lf__body p + p { margin-top: 1.1em; }
@media (max-width: 860px) { .lf--v2 .lf__grid { grid-template-columns: 1fr; } .lf--v2 .lf__aside { position: static; } }
`,
});

// ============================== REVIEWS ==============================

function avatarSvg(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return `<span class="av">${esc(initials)}</span>`;
}

const reviewsV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="rev rev--v1">
  <div class="container">
    <div class="rev__head">
      <span class="eyebrow accent">Voices</span>
      <h2>${esc(content.home.reviews.title)}</h2>
    </div>
    <div class="rev__grid">
      ${content.home.reviews.items
        .map(
          (r) => `
      <figure class="rev__card">
        <div class="stars__row rev__stars">${starsSvg}${starsSvg}${starsSvg}${starsSvg}${starsSvg}</div>
        <blockquote>"${esc(r.text)}"</blockquote>
        <figcaption>
          ${avatarSvg(r.name)}
          <span><strong>${esc(r.name)}</strong><br><span class="muted">${esc(r.role)}</span></span>
        </figcaption>
      </figure>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.rev--v1 .rev__head { text-align: center; margin-bottom: 56px; }
.rev--v1 .rev__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--grid-gap); }
.rev--v1 .rev__card { padding: 28px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface); display: flex; flex-direction: column; gap: 16px; }
.rev--v1 .rev__stars { color: #f5a623; font-size: 1rem; }
.rev--v1 .rev__card blockquote { margin: 0; font-size: 1.02rem; line-height: 1.6; }
.rev--v1 .rev__card figcaption { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; line-height: 1.4; }
.rev--v1 .av { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 50%, var(--bg))); color: var(--accent-contrast); font-weight: 700; font-family: var(--font-heading); display: inline-flex; align-items: center; justify-content: center; font-size: 0.9rem; flex: 0 0 auto; }
`,
});

const reviewsV2: SectionRenderer = ({ content }) => {
  const items = content.home.reviews.items;
  const primary = items[0] ?? { name: '', role: '', text: '' };
  const rest = items.slice(1, 5);
  return {
    html: `
<section class="rev rev--v2">
  <div class="container">
    <figure class="rev__hero">
      <div class="stars__row rev__stars">${starsSvg}${starsSvg}${starsSvg}${starsSvg}${starsSvg}</div>
      <blockquote>"${esc(primary.text)}"</blockquote>
      <figcaption>
        ${avatarSvg(primary.name)}
        <span>${esc(primary.name)} · <span class="muted">${esc(primary.role)}</span></span>
      </figcaption>
    </figure>
    ${rest.length > 0 ? `
    <div class="rev__rest">
      ${rest
        .map(
          (r) => `
      <figure class="rev__mini">
        <blockquote>${esc(r.text)}</blockquote>
        <figcaption>${avatarSvg(r.name)}<span>${esc(r.name)} · <span class="muted">${esc(r.role)}</span></span></figcaption>
      </figure>`,
        )
        .join('')}
    </div>` : ''}
  </div>
</section>`.trim(),
    css: `
.rev--v2 .rev__hero { max-width: 820px; margin: 0 auto 56px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 18px; }
.rev--v2 .rev__stars { color: #f5a623; font-size: 1rem; }
.rev--v2 .rev__hero blockquote { font-family: var(--font-heading); font-size: clamp(1.4rem, 2.3vw + 0.5rem, 2.1rem); line-height: 1.3; margin: 0; letter-spacing: -0.02em; }
.rev--v2 .rev__hero figcaption { display: flex; align-items: center; gap: 12px; font-size: 0.95rem; }
.rev--v2 .av { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 50%, var(--bg))); color: var(--accent-contrast); font-weight: 700; font-family: var(--font-heading); display: inline-flex; align-items: center; justify-content: center; font-size: 0.9rem; flex: 0 0 auto; }
.rev--v2 .rev__rest { display: grid; grid-template-columns: 1fr 1fr; gap: var(--grid-gap); }
.rev--v2 .rev__mini { padding: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; margin: 0; display: flex; flex-direction: column; gap: 14px; }
.rev--v2 .rev__mini blockquote { margin: 0; font-size: 1rem; line-height: 1.55; }
.rev--v2 .rev__mini figcaption { display: flex; align-items: center; gap: 12px; font-size: 0.88rem; }
@media (max-width: 720px) { .rev--v2 .rev__rest { grid-template-columns: 1fr; } }
`,
  };
};

// ============================== FAQ ==============================

const faqV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="faq faq--v1">
  <div class="container faq__wrap">
    <div class="faq__head">
      <span class="eyebrow accent">Questions</span>
      <h2>${esc(content.home.faq.title)}</h2>
    </div>
    <div class="faq__list">
      ${content.home.faq.items
        .map(
          (q, i) => `
      <details class="faq__item"${i === 0 ? ' open' : ''}>
        <summary><span>${esc(q.q)}</span><span class="faq__mark" aria-hidden="true">+</span></summary>
        <p>${esc(q.a)}</p>
      </details>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.faq--v1 .faq__wrap { max-width: 800px; margin: 0 auto; }
.faq--v1 .faq__head { margin-bottom: 36px; }
.faq--v1 .faq__item { border: 1px solid var(--border); border-radius: 16px; background: var(--surface); padding: 4px 24px; margin-bottom: 12px; transition: border-color 0.15s ease; }
.faq--v1 .faq__item[open] { border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); }
.faq--v1 .faq__item summary { list-style: none; cursor: pointer; font-weight: 600; font-family: var(--font-heading); font-size: 1.05rem; padding: 18px 0; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.faq--v1 .faq__item summary::-webkit-details-marker { display: none; }
.faq--v1 .faq__mark { width: 28px; height: 28px; border-radius: 50%; background: var(--surface-alt); color: var(--muted); display: inline-flex; align-items: center; justify-content: center; font-size: 1.4rem; line-height: 1; font-weight: 400; transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease; }
.faq--v1 .faq__item[open] .faq__mark { transform: rotate(45deg); background: var(--accent); color: var(--accent-contrast); }
.faq--v1 .faq__item p { color: var(--muted); margin: 0 0 18px; line-height: 1.65; font-size: 0.98rem; }
`,
});

const faqV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="faq faq--v2">
  <div class="container">
    <div class="faq__head">
      <span class="eyebrow accent">FAQ</span>
      <h2>${esc(content.home.faq.title)}</h2>
    </div>
    <div class="faq__grid">
      ${content.home.faq.items
        .map(
          (q) => `
      <div class="faq__qa">
        <div class="faq__q"><span class="faq__mark">Q.</span><h3>${esc(q.q)}</h3></div>
        <p class="faq__a">${esc(q.a)}</p>
      </div>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.faq--v2 .faq__head { margin-bottom: 40px; }
.faq--v2 .faq__grid { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--grid-gap) * 1.6); }
.faq--v2 .faq__q { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
.faq--v2 .faq__mark { font-family: var(--font-heading); font-weight: 800; color: var(--accent); font-size: 1.1rem; line-height: 1.5; }
.faq--v2 .faq__q h3 { margin: 0; font-size: 1.05rem; line-height: 1.45; }
.faq--v2 .faq__a { color: var(--muted); margin: 0; padding-left: 30px; line-height: 1.65; }
@media (max-width: 720px) { .faq--v2 .faq__grid { grid-template-columns: 1fr; } }
`,
});

// ============================== LATEST ARTICLES ==============================

const latestArticlesV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="la la--v1">
  <div class="container">
    <div class="la__head">
      <div>
        <span class="eyebrow accent">Insights</span>
        <h2>${esc(content.blog.index.hero.title)}</h2>
      </div>
      <a href="/blog/" class="btn btn--ghost">All articles →</a>
    </div>
    <div class="la__grid">
      ${content.blog.articles
        .map(
          (a, i) => `
      <article class="la__card">
        <div class="la__thumb la__thumb--${i % 3}" aria-hidden="true"></div>
        <div class="la__body">
          <div class="la__meta"><span>${esc(a.author)}</span> · <span>${a.read_time_min} min read</span></div>
          <h3><a href="/blog/${esc(a.slug)}.html">${esc(a.title)}</a></h3>
          <p class="muted">${esc(a.excerpt)}</p>
        </div>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.la--v1 .la__head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 40px; }
.la--v1 .la__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--grid-gap); }
.la--v1 .la__card { border: 1px solid var(--border); border-radius: 18px; overflow: hidden; background: var(--surface); transition: transform 0.15s ease, border-color 0.15s ease; }
.la--v1 .la__card:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); }
.la--v1 .la__thumb { aspect-ratio: 16/10; background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 60%, var(--bg)), var(--surface)); position: relative; }
.la--v1 .la__thumb::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 70% 30%, var(--accent-glow-strong), transparent 60%); }
.la--v1 .la__thumb--0 { background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 20%, var(--bg))); }
.la--v1 .la__thumb--1 { background: linear-gradient(45deg, color-mix(in srgb, var(--accent) 70%, var(--bg)), var(--surface-alt)); }
.la--v1 .la__thumb--2 { background: linear-gradient(200deg, var(--surface-alt), var(--accent)); }
.la--v1 .la__body { padding: 22px 24px 26px; }
.la--v1 .la__meta { font-size: 0.82rem; color: var(--muted); letter-spacing: 0.02em; margin-bottom: 10px; }
.la--v1 .la__card h3 { margin: 0 0 10px; font-size: 1.08rem; line-height: 1.35; }
.la--v1 .la__card h3 a { color: var(--text); text-decoration: none; }
.la--v1 .la__card h3 a:hover { color: var(--accent); }
.la--v1 .la__card p { margin: 0; font-size: 0.95rem; line-height: 1.55; }
@media (max-width: 900px) { .la--v1 .la__grid { grid-template-columns: 1fr; } .la--v1 .la__head { flex-direction: column; align-items: flex-start; } }
`,
});

// ============================== CTA ==============================

const ctaV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="cta cta--v1" id="cta">
  <div class="container cta__wrap">
    <div class="bg-mesh bg-mesh--1"></div>
    <div class="cta__inner">
      <span class="eyebrow">Ready?</span>
      <h2>${esc(content.home.cta.title)}</h2>
      <p>${esc(content.home.cta.text)}</p>
      <a href="#" class="btn btn--primary">${esc(content.home.cta.button_label)}</a>
    </div>
  </div>
</section>`.trim(),
  css: `
.cta--v1 { padding-block: calc(var(--space-section) * 0.8); }
.cta--v1 .cta__wrap { position: relative; overflow: hidden; }
.cta--v1 .cta__inner { background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 40%, var(--bg))); color: var(--accent-contrast); padding: 64px 48px; border-radius: 24px; text-align: center; position: relative; z-index: 1; }
.cta--v1 .cta__inner .eyebrow { color: var(--accent-contrast); opacity: 0.7; margin-bottom: 8px; }
.cta--v1 .cta__inner h2 { color: var(--accent-contrast); margin: 0 0 14px; font-size: clamp(1.8rem, 3vw + 0.5rem, 2.6rem); }
.cta--v1 .cta__inner p { color: var(--accent-contrast); opacity: 0.9; font-size: 1.1rem; margin: 0 0 26px; max-width: 600px; margin-left: auto; margin-right: auto; }
.cta--v1 .cta__inner .btn--primary { background: var(--accent-contrast); color: var(--accent); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.4); }
`,
});

const ctaV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="cta cta--v2" id="cta">
  <div class="container">
    <div class="cta__box">
      <div class="cta__text">
        <span class="eyebrow accent">Start now</span>
        <h2>${esc(content.home.cta.title)}</h2>
        <p class="muted">${esc(content.home.cta.text)}</p>
      </div>
      <form class="cta__form" onsubmit="return false">
        <input type="email" placeholder="you@example.com" aria-label="Email" />
        <button type="submit" class="btn btn--primary">${esc(content.home.cta.button_label)}</button>
      </form>
    </div>
  </div>
</section>`.trim(),
  css: `
.cta--v2 .cta__box { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: calc(var(--grid-gap) * 2); padding: 48px; background: var(--surface); border: 1px solid var(--border); border-radius: 22px; position: relative; overflow: hidden; }
.cta--v2 .cta__box::before { content: ""; position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, var(--accent-glow-strong), transparent 70%); filter: blur(40px); pointer-events: none; }
.cta--v2 .cta__text { position: relative; }
.cta--v2 h2 { margin: 10px 0 10px; }
.cta--v2 .cta__form { display: flex; gap: 10px; position: relative; }
.cta--v2 .cta__form input { flex: 1; padding: 15px 18px; border: 1px solid var(--border); border-radius: 999px; background: var(--bg); color: var(--text); font: inherit; }
.cta--v2 .cta__form input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
@media (max-width: 780px) { .cta--v2 .cta__box { grid-template-columns: 1fr; padding: 36px; } .cta--v2 .cta__form { flex-direction: column; } }
`,
});

// ============================== FOOTER ==============================

const footerV1: SectionRenderer = ({ content, nav }) => ({
  html: `
<footer class="ftr ftr--v1">
  <div class="container">
    <div class="ftr__main">
      <div>
        <a class="ftr__brand" href="/">
          <span class="ftr__mark" aria-hidden="true"></span>
          <span>${esc(content.identity.brand)}</span>
        </a>
        <p class="muted ftr__tag">${esc(content.identity.tagline)}</p>
      </div>
      <nav class="ftr__nav">
        ${nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('\n        ')}
      </nav>
    </div>
    <hr class="rule" />
    <div class="ftr__bottom">
      <span class="muted">${esc(content.home.footer.copyright)}</span>
      <span class="muted ftr__reg">${esc(content.identity.company_name)} · ${esc(content.identity.company_registration)}</span>
    </div>
  </div>
</footer>`.trim(),
  css: `
.ftr--v1 { border-top: 1px solid var(--border); padding-block: 56px 40px; }
.ftr--v1 .ftr__main { display: grid; grid-template-columns: 1fr auto; gap: 32px; padding-bottom: 28px; align-items: start; }
.ftr--v1 .ftr__brand { display: inline-flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; font-family: var(--font-heading); font-weight: 800; font-size: 1.2rem; }
.ftr--v1 .ftr__mark { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 40%, var(--bg))); }
.ftr--v1 .ftr__tag { margin: 10px 0 0; font-size: 0.9rem; }
.ftr--v1 .ftr__nav { display: flex; gap: 24px; flex-wrap: wrap; }
.ftr--v1 .ftr__nav a { color: var(--muted); text-decoration: none; font-size: 0.92rem; }
.ftr--v1 .ftr__nav a:hover { color: var(--text); }
.ftr--v1 .ftr__bottom { display: flex; justify-content: space-between; gap: 16px; padding-top: 24px; font-size: 0.82rem; flex-wrap: wrap; }
.ftr--v1 .ftr__reg { opacity: 0.7; }
@media (max-width: 720px) { .ftr--v1 .ftr__main { grid-template-columns: 1fr; } }
`,
});

const footerV2: SectionRenderer = ({ content, nav }) => ({
  html: `
<footer class="ftr ftr--v2">
  <div class="container">
    <div class="ftr__grid">
      <div class="ftr__brand-col">
        <a class="ftr__brand" href="/">
          <span class="ftr__mark" aria-hidden="true"></span>
          <span>${esc(content.identity.brand)}</span>
        </a>
        <p class="muted ftr__tag">${esc(content.identity.tagline)}</p>
        <p class="risk-note">${esc(content.identity.company_name)} · ${esc(content.identity.company_address)} · ${esc(content.identity.company_phone)}</p>
      </div>
      <nav class="ftr__nav" aria-label="Footer">
        <div class="ftr__col">
          <h4>Product</h4>
          ${nav.slice(0, 3).map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('\n          ')}
        </div>
        <div class="ftr__col">
          <h4>Company</h4>
          ${nav.slice(3).map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('\n          ')}
        </div>
      </nav>
    </div>
    <hr class="rule" />
    <div class="ftr__bottom">
      <span class="muted">${esc(content.home.footer.copyright)}</span>
      <span class="muted">${esc(content.identity.company_registration)}</span>
    </div>
  </div>
</footer>`.trim(),
  css: `
.ftr--v2 { border-top: 1px solid var(--border); padding-block: 64px 40px; background: var(--surface-alt); }
.ftr--v2 .ftr__grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: calc(var(--grid-gap) * 2); margin-bottom: 32px; align-items: start; }
.ftr--v2 .ftr__brand { display: inline-flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; font-family: var(--font-heading); font-weight: 800; font-size: 1.3rem; }
.ftr--v2 .ftr__mark { width: 30px; height: 30px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, var(--accent), color-mix(in srgb, var(--accent) 30%, #000)); }
.ftr--v2 .ftr__tag { margin: 12px 0; font-size: 0.95rem; }
.ftr--v2 .risk-note { max-width: 400px; }
.ftr--v2 .ftr__nav { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.ftr--v2 .ftr__col { display: flex; flex-direction: column; gap: 10px; }
.ftr--v2 .ftr__col h4 { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin: 0 0 4px; font-weight: 700; }
.ftr--v2 .ftr__col a { color: var(--muted); text-decoration: none; font-size: 0.94rem; }
.ftr--v2 .ftr__col a:hover { color: var(--accent); }
.ftr--v2 .ftr__bottom { display: flex; justify-content: space-between; gap: 16px; padding-top: 28px; font-size: 0.82rem; flex-wrap: wrap; }
@media (max-width: 720px) { .ftr--v2 .ftr__grid { grid-template-columns: 1fr; } }
`,
});

// ============================== SUBPAGE BODIES (unchanged structure, minor polish) ==============================

const pageFeaturesBody: SectionRenderer = ({ content }) => {
  const p = content.pages.features;
  return {
    html: `
<section class="pb">
  <div class="container pb__wrap">
    ${p.sections
      .map(
        (s, i) => `
    <div class="pb__block">
      <span class="eyebrow accent">Chapter ${String(i + 1).padStart(2, '0')}</span>
      <h2>${esc(s.heading)}</h2>
      ${s.paragraphs.map((pg) => `<p>${esc(pg)}</p>`).join('\n      ')}
    </div>`,
      )
      .join('')}
  </div>
</section>`.trim(),
    css: `
.pb .pb__wrap { max-width: 820px; margin: 0 auto; }
.pb .pb__block + .pb__block { margin-top: calc(var(--space-section) * 0.6); padding-top: calc(var(--space-section) * 0.5); border-top: 1px solid var(--border); }
.pb .pb__block .eyebrow { margin-bottom: 12px; }
.pb .pb__block h2 { margin-bottom: 18px; }
.pb .pb__block p { font-size: 1.07rem; line-height: 1.7; }
.pb .pb__block p + p { margin-top: 1em; }
`,
  };
};

const pageHowItWorksBody: SectionRenderer = ({ content }) => {
  const p = content.pages.how_it_works;
  return {
    html: `
<section class="pb">
  <div class="container pb__wrap">
    <div class="pb__intro">
      ${p.intro_paragraphs.map((pg) => `<p>${esc(pg)}</p>`).join('\n      ')}
    </div>
    <ol class="pb__steps">
      ${p.steps
        .map(
          (s, i) => `
      <li class="pb__step">
        <div class="pb__num">${String(i + 1).padStart(2, '0')}</div>
        <div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description)}</p>
        </div>
      </li>`,
        )
        .join('')}
    </ol>
  </div>
</section>`.trim(),
    css: `
.pb .pb__wrap { max-width: 880px; margin: 0 auto; }
.pb .pb__intro p { font-size: 1.08rem; line-height: 1.7; }
.pb .pb__intro p + p { margin-top: 1em; }
.pb .pb__steps { list-style: none; margin: 56px 0 0; padding: 0; display: grid; gap: var(--grid-gap); }
.pb .pb__step { display: grid; grid-template-columns: 80px 1fr; gap: 24px; padding: 24px 28px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; }
.pb .pb__num { font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--accent); letter-spacing: -0.03em; }
.pb .pb__step h3 { margin: 0 0 8px; }
.pb .pb__step p { color: var(--muted); margin: 0; line-height: 1.6; }
`,
  };
};

const pageFaqBody: SectionRenderer = ({ content }) => {
  const p = content.pages.faq;
  return {
    html: `
<section class="pb">
  <div class="container pb__wrap">
    <div class="pb__list">
      ${p.items
        .map(
          (q, i) => `
      <details class="pb__item"${i === 0 ? ' open' : ''}>
        <summary><span>${esc(q.q)}</span><span class="pb__mark">+</span></summary>
        <p>${esc(q.a)}</p>
      </details>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
    css: `
.pb .pb__wrap { max-width: 820px; margin: 0 auto; }
.pb .pb__item { border: 1px solid var(--border); border-radius: 14px; background: var(--surface); padding: 2px 22px; margin-bottom: 10px; }
.pb .pb__item[open] { border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); }
.pb .pb__item summary { list-style: none; cursor: pointer; font-weight: 600; font-family: var(--font-heading); font-size: 1rem; padding: 16px 0; display: flex; justify-content: space-between; gap: 16px; }
.pb .pb__item summary::-webkit-details-marker { display: none; }
.pb .pb__mark { color: var(--accent); font-size: 1.3rem; line-height: 1; transition: transform 0.2s ease; }
.pb .pb__item[open] .pb__mark { transform: rotate(45deg); }
.pb .pb__item p { color: var(--muted); margin: 0 0 16px; line-height: 1.65; }
`,
  };
};

const pageAboutBody: SectionRenderer = ({ content }) => {
  const p = content.pages.about;
  return {
    html: `
<section class="pb">
  <div class="container pb__wrap">
    <div class="pb__story">
      ${p.story_paragraphs.map((pg) => `<p>${esc(pg)}</p>`).join('\n      ')}
    </div>
    <div class="pb__values">
      <span class="eyebrow accent">Principles</span>
      <h2>What we care about</h2>
      <div class="pb__vgrid">
        ${p.values
          .map(
            (v, i) => `
        <div class="pb__vcell">
          <div class="pb__vicon">${iconByIndex(i + 5)}</div>
          <h3>${esc(v.title)}</h3>
          <p>${esc(v.text)}</p>
        </div>`,
          )
          .join('')}
      </div>
    </div>
  </div>
</section>`.trim(),
    css: `
.pb .pb__wrap { max-width: 860px; margin: 0 auto; }
.pb .pb__story p { font-size: 1.08rem; line-height: 1.7; }
.pb .pb__story p + p { margin-top: 1.1em; }
.pb .pb__story p:first-child::first-letter { font-family: var(--font-heading); font-size: 3.4em; float: left; line-height: 0.95; margin: 0.02em 0.12em 0 0; color: var(--accent); font-weight: 800; }
.pb .pb__values { margin-top: calc(var(--space-section) * 0.7); }
.pb .pb__values h2 { margin: 10px 0 28px; }
.pb .pb__vgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--grid-gap); }
.pb .pb__vcell { padding: 24px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); }
.pb .pb__vicon { width: 40px; height: 40px; border-radius: 10px; background: color-mix(in srgb, var(--accent) 15%, var(--surface)); color: var(--accent); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; }
.pb .pb__vicon svg { width: 22px; height: 22px; }
.pb .pb__vcell h3 { margin: 0 0 8px; font-size: 1rem; }
.pb .pb__vcell p { color: var(--muted); margin: 0; font-size: 0.95rem; line-height: 1.55; }
`,
  };
};

const pageContactBody: SectionRenderer = ({ content }) => {
  const p = content.pages.contact;
  return {
    html: `
<section class="pb">
  <div class="container pb__wrap">
    <div class="pb__contact">
      <div class="pb__info">
        <p class="pb__intro">${esc(p.intro)}</p>
        <div class="pb__row"><span class="pb__label">Company</span><span>${esc(p.company.name)}</span></div>
        <div class="pb__row"><span class="pb__label">Address</span><span>${esc(p.company.address)}</span></div>
        <div class="pb__row"><span class="pb__label">Phone</span><span>${esc(p.company.phone)}</span></div>
        <div class="pb__row"><span class="pb__label">Email</span><span>${esc(p.company.email)}</span></div>
        <div class="pb__row"><span class="pb__label">Hours</span><span>${esc(p.hours)}</span></div>
      </div>
      <form class="pb__form" onsubmit="return false">
        <label>Name<input type="text" /></label>
        <label>Email<input type="email" /></label>
        <label>Message<textarea rows="5"></textarea></label>
        <button type="submit" class="btn btn--primary btn--block">Send message</button>
      </form>
    </div>
  </div>
</section>`.trim(),
    css: `
.pb .pb__wrap { max-width: 980px; margin: 0 auto; }
.pb .pb__contact { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--grid-gap) * 2); align-items: start; }
.pb .pb__info { display: grid; gap: 8px; }
.pb .pb__intro { font-size: 1.1rem; color: var(--muted); margin: 0 0 18px; line-height: 1.6; }
.pb .pb__row { display: grid; grid-template-columns: 100px 1fr; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 0.95rem; }
.pb .pb__label { color: var(--muted); text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.1em; font-weight: 700; }
.pb .pb__form { display: grid; gap: 16px; padding: 32px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; }
.pb .pb__form label { display: grid; gap: 6px; font-size: 0.85rem; color: var(--muted); font-weight: 500; }
.pb .pb__form input, .pb .pb__form textarea { padding: 13px 14px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg); color: var(--text); font: inherit; }
.pb .pb__form input:focus, .pb .pb__form textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
@media (max-width: 820px) { .pb .pb__contact { grid-template-columns: 1fr; } }
`,
  };
};

// ============================== BLOG INDEX ==============================

const blogIndexBody: SectionRenderer = ({ content }) => ({
  html: `
<section class="bx">
  <div class="container bx__wrap">
    <div class="bx__grid">
      ${content.blog.articles
        .map(
          (a, i) => `
      <article class="bx__card">
        <div class="bx__thumb bx__thumb--${i % 3}" aria-hidden="true"></div>
        <div class="bx__body">
          <div class="bx__meta">${esc(a.author)} · ${a.read_time_min} min read</div>
          <h2><a href="/blog/${esc(a.slug)}.html">${esc(a.title)}</a></h2>
          <p class="muted">${esc(a.excerpt)}</p>
        </div>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.bx .bx__wrap { max-width: 960px; margin: 0 auto; }
.bx .bx__grid { display: grid; gap: calc(var(--grid-gap) * 1.5); }
.bx .bx__card { display: grid; grid-template-columns: 260px 1fr; gap: 28px; padding: 22px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; }
.bx .bx__thumb { aspect-ratio: 16/10; border-radius: 12px; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 25%, var(--bg))); }
.bx .bx__thumb--1 { background: linear-gradient(45deg, color-mix(in srgb, var(--accent) 70%, var(--bg)), var(--surface-alt)); }
.bx .bx__thumb--2 { background: linear-gradient(200deg, var(--surface-alt), var(--accent)); }
.bx .bx__body { padding: 6px 0; }
.bx .bx__meta { font-size: 0.82rem; color: var(--muted); letter-spacing: 0.02em; margin-bottom: 10px; }
.bx .bx__card h2 { margin: 0 0 10px; font-size: clamp(1.3rem, 2vw, 1.7rem); line-height: 1.25; }
.bx .bx__card h2 a { color: var(--text); text-decoration: none; }
.bx .bx__card h2 a:hover { color: var(--accent); }
.bx .bx__card p { margin: 0; font-size: 1rem; line-height: 1.55; }
@media (max-width: 720px) { .bx .bx__card { grid-template-columns: 1fr; } }
`,
});

// ============================== BLOG ARTICLE ==============================

const blogArticleBody: SectionRenderer = ({ article }) => {
  if (!article) return { html: '', css: '' };
  return {
    html: `
<article class="bp">
  <div class="container bp__wrap">
    <header class="bp__head">
      <a class="bp__back" href="/blog/">← Back to articles</a>
      <h1>${esc(article.title)}</h1>
      <div class="bp__meta">
        <span class="bp__author">${esc(article.author)}</span>
        <span>·</span>
        <span>${article.read_time_min} min read</span>
      </div>
    </header>
    <p class="bp__lead">${esc(article.lead_paragraph)}</p>
    ${article.sections
      .map(
        (s) => `
    <section class="bp__section">
      <h2>${esc(s.heading)}</h2>
      ${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
    </section>`,
      )
      .join('')}
    ${article.key_takeaways && article.key_takeaways.length
      ? `
    <aside class="bp__takeaways">
      <div class="bp__takeaways-head">
        <span class="eyebrow accent">Takeaways</span>
        <h3>Key points</h3>
      </div>
      <ul>
        ${article.key_takeaways.map((t) => `<li>${esc(t)}</li>`).join('\n        ')}
      </ul>
    </aside>`
      : ''}
    ${article.faq && article.faq.length
      ? `
    <section class="bp__faq">
      <span class="eyebrow accent">Q&amp;A</span>
      <h2>Questions readers ask</h2>
      ${article.faq
        .map(
          (q) => `
      <div class="bp__qa">
        <h3>${esc(q.q)}</h3>
        <p>${esc(q.a)}</p>
      </div>`,
        )
        .join('')}
    </section>`
      : ''}
  </div>
</article>`.trim(),
    css: `
.bp .bp__wrap { max-width: 780px; margin: 0 auto; }
.bp .bp__head { margin-bottom: 36px; padding-bottom: 28px; border-bottom: 1px solid var(--border); }
.bp .bp__back { color: var(--muted); text-decoration: none; font-size: 0.9rem; display: inline-block; margin-bottom: 20px; }
.bp .bp__back:hover { color: var(--accent); }
.bp .bp__head h1 { font-size: clamp(2.2rem, 4vw, 3rem); letter-spacing: -0.035em; }
.bp .bp__meta { color: var(--muted); font-size: 0.95rem; display: flex; gap: 8px; align-items: center; margin-top: 14px; }
.bp .bp__author { color: var(--text); font-weight: 600; }
.bp .bp__lead { font-size: 1.3rem; line-height: 1.55; color: var(--text); font-family: var(--font-heading); font-weight: 500; margin-bottom: 40px; letter-spacing: -0.01em; }
.bp .bp__section { margin-bottom: 40px; }
.bp .bp__section h2 { margin-bottom: 16px; }
.bp .bp__section p { font-size: 1.07rem; line-height: 1.75; }
.bp .bp__section p + p { margin-top: 1em; }
.bp .bp__takeaways { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 28px 32px; margin: 48px 0; }
.bp .bp__takeaways-head { margin-bottom: 16px; }
.bp .bp__takeaways-head h3 { margin: 6px 0 0; font-size: 1.1rem; }
.bp .bp__takeaways ul { margin: 0; padding-left: 22px; }
.bp .bp__takeaways li { margin-bottom: 8px; line-height: 1.55; }
.bp .bp__faq { margin-top: 64px; padding-top: 40px; border-top: 1px solid var(--border); }
.bp .bp__faq h2 { margin: 8px 0 24px; }
.bp .bp__qa + .bp__qa { margin-top: 22px; }
.bp .bp__qa h3 { font-size: 1.05rem; margin-bottom: 8px; }
.bp .bp__qa p { color: var(--muted); margin: 0; line-height: 1.65; }
`,
  };
};

// ============================== REGISTRY ==============================

export const registry: Record<string, SectionRenderer> = {
  'header:v1': headerV1,
  'header:v2': headerV2,
  'hero:v1': heroV1,
  'hero:v2': heroV2,
  'hero-short:v1': heroShortV1,
  'stats:v1': statsV1,
  'stats:v2': statsV2,
  'value-prop:v1': valuePropV1,
  'smarter-trading:v1': smarterTradingV1,
  'smarter-trading:v2': smarterTradingV2,
  'trust-security:v1': trustSecurityV1,
  'how-it-works:v1': howItWorksV1,
  'tools:v1': toolsV1,
  'longform:v1': longformV1,
  'longform:v2': longformV2,
  'reviews:v1': reviewsV1,
  'reviews:v2': reviewsV2,
  'faq:v1': faqV1,
  'faq:v2': faqV2,
  'latest-articles:v1': latestArticlesV1,
  'cta:v1': ctaV1,
  'cta:v2': ctaV2,
  'footer:v1': footerV1,
  'footer:v2': footerV2,
  'page-features:body': pageFeaturesBody,
  'page-how-it-works:body': pageHowItWorksBody,
  'page-faq:body': pageFaqBody,
  'page-about:body': pageAboutBody,
  'page-contact:body': pageContactBody,
  'blog-index:body': blogIndexBody,
  'blog-article:body': blogArticleBody,
};
