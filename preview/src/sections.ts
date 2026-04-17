import type { SiteContent, BlogArticle } from './content-schema.js';

export interface NavLink {
  label: string;
  href: string;
}

export interface RenderCtx {
  content: SiteContent;
  hero_image_url?: string;
  current_slug: string;
  nav: NavLink[];
  // Page-specific data overrides (used for secondary pages and blog articles).
  subpage_hero?: { title: string; subtitle: string };
  article?: BlogArticle;
}

export interface SectionOutput {
  html: string;
  css: string;
}

export type SectionRenderer = (ctx: RenderCtx) => SectionOutput;

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// -------------------- HEADER --------------------

const headerV1: SectionRenderer = ({ content, nav }) => ({
  html: `
<header class="hdr hdr--v1">
  <div class="container hdr__row">
    <a class="hdr__brand" href="/">${esc(content.identity.brand)}</a>
    <nav class="hdr__nav" aria-label="Main">
      ${nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('\n      ')}
    </nav>
  </div>
</header>`.trim(),
  css: `
.hdr--v1 { padding-block: 20px; border-bottom: 1px solid var(--border); }
.hdr--v1 .hdr__row { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.hdr--v1 .hdr__brand { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; text-decoration: none; color: var(--text); }
.hdr--v1 .hdr__nav { display: flex; gap: 24px; flex-wrap: wrap; }
.hdr--v1 .hdr__nav a { color: var(--muted); text-decoration: none; font-size: 0.92rem; }
.hdr--v1 .hdr__nav a:hover { color: var(--text); }
@media (max-width: 720px) { .hdr--v1 .hdr__nav { display: none; } }
`,
});

const headerV2: SectionRenderer = ({ content, nav }) => ({
  html: `
<header class="hdr hdr--v2">
  <div class="container">
    <div class="hdr__top">
      <div class="hdr__mark">
        <a class="hdr__brand" href="/">${esc(content.identity.brand)}</a>
        <div class="hdr__tag">${esc(content.identity.tagline)}</div>
      </div>
      <nav class="hdr__nav" aria-label="Main">
        ${nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('\n        ')}
      </nav>
    </div>
    <hr class="rule" />
  </div>
</header>`.trim(),
  css: `
.hdr--v2 { padding-block: 28px 0; }
.hdr--v2 .hdr__top { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; padding-bottom: 20px; }
.hdr--v2 .hdr__brand { font-family: var(--font-heading); font-weight: 700; font-size: 1.4rem; color: var(--text); text-decoration: none; }
.hdr--v2 .hdr__tag { color: var(--muted); font-size: 0.85rem; margin-top: 4px; font-style: italic; }
.hdr--v2 .hdr__nav { display: flex; gap: 22px; flex-wrap: wrap; }
.hdr--v2 .hdr__nav a { color: var(--muted); text-decoration: none; font-size: 0.9rem; }
.hdr--v2 .hdr__nav a:hover { color: var(--accent); }
@media (max-width: 820px) { .hdr--v2 .hdr__top { flex-direction: column; align-items: flex-start; } }
`,
});

// -------------------- HERO --------------------

const heroV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="hero hero--v1">
  <div class="container hero__wrap">
    <span class="eyebrow">${esc(content.home.hero.eyebrow)}</span>
    <h1>${esc(content.home.hero.title)}</h1>
    <p class="hero__sub">${esc(content.home.hero.subtitle)}</p>
    <div class="hero__actions">
      <a href="#cta" class="btn btn--primary">${esc(content.home.hero.cta_label)}</a>
    </div>
  </div>
</section>`.trim(),
  css: `
.hero--v1 { padding-block: calc(var(--space-section) * 0.9) var(--space-section); text-align: center; }
.hero--v1 .hero__wrap { max-width: 760px; margin: 0 auto; }
.hero--v1 .hero__sub { font-size: 1.15rem; color: var(--muted); margin-top: 12px; margin-bottom: 28px; }
.hero--v1 .hero__actions { display: flex; justify-content: center; gap: 12px; }
`,
});

const heroV2: SectionRenderer = ({ content, hero_image_url }) => ({
  html: `
<section class="hero hero--v2">
  <div class="container hero__grid">
    <div class="hero__text">
      <span class="eyebrow">${esc(content.home.hero.eyebrow)}</span>
      <h1>${esc(content.home.hero.title)}</h1>
      <p class="hero__sub">${esc(content.home.hero.subtitle)}</p>
      <a href="#cta" class="btn btn--primary">${esc(content.home.hero.cta_label)}</a>
    </div>
    <div class="hero__media" aria-hidden="true">
      ${hero_image_url ? `<img src="${esc(hero_image_url)}" alt="" loading="eager" />` : `<div class="hero__placeholder"></div>`}
    </div>
  </div>
</section>`.trim(),
  css: `
.hero--v2 { padding-block: calc(var(--space-section) * 0.8); }
.hero--v2 .hero__grid { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--grid-gap) * 2); align-items: center; }
.hero--v2 .hero__sub { font-size: 1.1rem; color: var(--muted); margin: 14px 0 24px; }
.hero--v2 .hero__media img, .hero--v2 .hero__placeholder {
  width: 100%; aspect-ratio: 4/3; border-radius: var(--radius); object-fit: cover;
  background: linear-gradient(135deg, var(--surface), var(--border));
}
@media (max-width: 860px) { .hero--v2 .hero__grid { grid-template-columns: 1fr; } }
`,
});

// -------------------- HERO-SHORT (secondary pages) --------------------

const heroShortV1: SectionRenderer = ({ subpage_hero }) => {
  const h = subpage_hero ?? { title: '', subtitle: '' };
  return {
    html: `
<section class="heroS heroS--v1">
  <div class="container heroS__wrap">
    <h1>${esc(h.title)}</h1>
    ${h.subtitle ? `<p>${esc(h.subtitle)}</p>` : ''}
  </div>
</section>`.trim(),
    css: `
.heroS--v1 { padding-block: calc(var(--space-section) * 0.65) calc(var(--space-section) * 0.4); text-align: center; border-bottom: 1px solid var(--border); }
.heroS--v1 .heroS__wrap { max-width: 720px; margin: 0 auto; }
.heroS--v1 p { color: var(--muted); font-size: 1.1rem; margin: 8px 0 0; }
`,
  };
};

// -------------------- STATS --------------------

const statsV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="stats stats--v1">
  <div class="container stats__row">
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
</section>`.trim(),
  css: `
.stats--v1 { padding-block: calc(var(--space-section) * 0.5); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.stats--v1 .stats__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--grid-gap); text-align: center; }
.stats--v1 .stats__num { font-family: var(--font-heading); font-size: clamp(2.2rem, 4vw, 3rem); font-weight: 700; color: var(--accent); line-height: 1; }
.stats--v1 .stats__label { margin-top: 10px; color: var(--muted); font-size: 0.9rem; letter-spacing: 0.04em; text-transform: uppercase; }
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
.stats--v2 .stats__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--grid-gap); }
.stats--v2 .stats__card { padding: calc(var(--space-block) * 1.2); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.stats--v2 .stats__num { font-family: var(--font-heading); font-size: 2.4rem; font-weight: 700; color: var(--accent); line-height: 1; }
.stats--v2 .stats__label { font-weight: 600; margin-top: 8px; }
.stats--v2 .stats__detail { color: var(--muted); font-size: 0.92rem; margin-top: 8px; }
`,
});

// -------------------- VALUE PROPOSITION --------------------

const valuePropV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="vp vp--v1">
  <div class="container vp__wrap">
    <h2>${esc(content.home.value_prop.title)}</h2>
    <p class="vp__lead">${esc(content.home.value_prop.lead)}</p>
    <div class="vp__body">
      ${content.home.value_prop.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
    </div>
  </div>
</section>`.trim(),
  css: `
.vp--v1 .vp__wrap { max-width: 760px; margin: 0 auto; }
.vp--v1 .vp__lead { font-family: var(--font-heading); font-size: 1.3rem; color: var(--muted); margin-bottom: 28px; }
.vp--v1 .vp__body p { font-size: 1.05rem; }
.vp--v1 .vp__body p + p { margin-top: 1em; }
`,
});

// -------------------- SMARTER TRADING (features 6-item grid) --------------------

const smarterTradingV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="sm sm--v1">
  <div class="container">
    <div class="sm__head">
      <h2>${esc(content.home.smarter_trading.title)}</h2>
      <p class="muted">${esc(content.home.smarter_trading.subtitle)}</p>
    </div>
    <div class="sm__grid">
      ${content.home.smarter_trading.items
        .map(
          (f) => `
      <div class="sm__cell">
        <h3>${esc(f.title)}</h3>
        <p class="muted">${esc(f.text)}</p>
      </div>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.sm--v1 .sm__head { max-width: 680px; margin-bottom: 48px; }
.sm--v1 .sm__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: calc(var(--grid-gap) * 1.2); }
.sm--v1 .sm__cell { padding: 8px 0; }
.sm--v1 .sm__cell h3 { margin-top: 0; margin-bottom: 8px; }
`,
});

const smarterTradingV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="sm sm--v2">
  <div class="container">
    <div class="sm__head sm__head--centered">
      <h2>${esc(content.home.smarter_trading.title)}</h2>
      <p class="muted">${esc(content.home.smarter_trading.subtitle)}</p>
    </div>
    <div class="sm__grid">
      ${content.home.smarter_trading.items
        .map(
          (f, i) => `
      <article class="sm__card">
        <div class="sm__num">${String(i + 1).padStart(2, '0')}</div>
        <h3>${esc(f.title)}</h3>
        <p>${esc(f.text)}</p>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.sm--v2 .sm__head--centered { text-align: center; max-width: 680px; margin: 0 auto 48px; }
.sm--v2 .sm__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--grid-gap); }
.sm--v2 .sm__card { padding: calc(var(--space-block) * 1.2); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.sm--v2 .sm__num { font-family: var(--font-heading); font-size: 0.85rem; color: var(--accent); letter-spacing: 0.1em; margin-bottom: 10px; }
.sm--v2 .sm__card h3 { margin-top: 0; margin-bottom: 10px; }
.sm--v2 .sm__card p { color: var(--muted); margin: 0; }
`,
});

// -------------------- TRUST & SECURITY --------------------

const trustSecurityV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="ts ts--v1">
  <div class="container">
    <div class="ts__head">
      <h2>${esc(content.home.trust_security.title)}</h2>
      <p class="muted">${esc(content.home.trust_security.subtitle)}</p>
    </div>
    <div class="ts__grid">
      ${content.home.trust_security.cards
        .map(
          (c) => `
      <div class="ts__card">
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.text)}</p>
      </div>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.ts--v1 { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.ts--v1 .ts__head { max-width: 680px; margin: 0 auto 40px; text-align: center; }
.ts--v1 .ts__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--grid-gap); }
.ts--v1 .ts__card { padding: var(--space-block); border-left: 2px solid var(--accent); }
.ts--v1 .ts__card h3 { margin-top: 0; margin-bottom: 8px; font-size: 1.05rem; }
.ts--v1 .ts__card p { color: var(--muted); margin: 0; font-size: 0.95rem; }
`,
});

// -------------------- HOW IT WORKS --------------------

const howItWorksV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="hiw hiw--v1">
  <div class="container">
    <div class="hiw__head">
      <h2>${esc(content.home.how_it_works.title)}</h2>
      <p class="muted">${esc(content.home.how_it_works.subtitle)}</p>
    </div>
    <ol class="hiw__steps">
      ${content.home.how_it_works.steps
        .map(
          (s, i) => `
      <li class="hiw__step">
        <div class="hiw__num">${String(i + 1).padStart(2, '0')}</div>
        <div class="hiw__body">
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
.hiw--v1 .hiw__head { max-width: 680px; margin-bottom: 48px; }
.hiw--v1 .hiw__steps { list-style: none; margin: 0; padding: 0; display: grid; gap: calc(var(--grid-gap) * 1.1); }
.hiw--v1 .hiw__step { display: grid; grid-template-columns: 72px 1fr; gap: 20px; padding: var(--space-block); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.hiw--v1 .hiw__num { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 700; color: var(--accent); }
.hiw--v1 .hiw__body h3 { margin-top: 0; margin-bottom: 8px; }
.hiw--v1 .hiw__body p { color: var(--muted); margin: 0; }
`,
});

// -------------------- TOOLS --------------------

const toolsV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="tl tl--v1">
  <div class="container">
    <div class="tl__head">
      <h2>${esc(content.home.tools.title)}</h2>
      <p class="muted">${esc(content.home.tools.subtitle)}</p>
    </div>
    <div class="tl__grid">
      ${content.home.tools.items
        .map(
          (t) => `
      <div class="tl__card">
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.text)}</p>
      </div>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.tl--v1 .tl__head { text-align: center; max-width: 680px; margin: 0 auto 40px; }
.tl--v1 .tl__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--grid-gap); }
.tl--v1 .tl__card { padding: var(--space-block); border: 1px solid var(--border); border-radius: var(--radius); background: transparent; }
.tl--v1 .tl__card h3 { margin-top: 0; margin-bottom: 8px; font-size: 1rem; }
.tl--v1 .tl__card p { color: var(--muted); margin: 0; font-size: 0.93rem; }
`,
});

// -------------------- LONGFORM --------------------

const longformV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="lf lf--v1">
  <div class="container lf__wrap">
    <h2>${esc(content.home.longform.title)}</h2>
    ${content.home.longform.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n    ')}
  </div>
</section>`.trim(),
  css: `
.lf--v1 .lf__wrap { max-width: 720px; margin: 0 auto; }
.lf--v1 p { font-size: 1.05rem; }
.lf--v1 p + p { margin-top: 1em; }
`,
});

const longformV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="lf lf--v2">
  <div class="container lf__grid">
    <div class="lf__aside">
      <h2>${esc(content.home.longform.title)}</h2>
      ${content.home.longform.lead_quote ? `<blockquote class="lf__quote">${esc(content.home.longform.lead_quote)}</blockquote>` : ''}
    </div>
    <div class="lf__body">
      ${content.home.longform.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
    </div>
  </div>
</section>`.trim(),
  css: `
.lf--v2 .lf__grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: calc(var(--grid-gap) * 2); }
.lf--v2 .lf__aside h2 { position: sticky; top: 24px; }
.lf--v2 .lf__quote { font-family: var(--font-heading); font-style: italic; font-size: 1.3rem; border-left: 3px solid var(--accent); padding-left: 18px; margin: 18px 0 0; color: var(--muted); }
.lf--v2 .lf__body p { font-size: 1.05rem; }
.lf--v2 .lf__body p + p { margin-top: 1.1em; }
@media (max-width: 860px) { .lf--v2 .lf__grid { grid-template-columns: 1fr; } }
`,
});

// -------------------- REVIEWS --------------------

const reviewsV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="rev rev--v1">
  <div class="container">
    <h2>${esc(content.home.reviews.title)}</h2>
    <div class="rev__grid">
      ${content.home.reviews.items
        .map(
          (r) => `
      <figure class="rev__card">
        <blockquote>${esc(r.text)}</blockquote>
        <figcaption>
          <strong>${esc(r.name)}</strong><br>
          <span class="muted">${esc(r.role)}</span>
        </figcaption>
      </figure>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.rev--v1 h2 { text-align: center; margin-bottom: 48px; }
.rev--v1 .rev__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--grid-gap); }
.rev--v1 .rev__card { padding: calc(var(--space-block) * 1.2); border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.rev--v1 .rev__card blockquote { margin: 0 0 16px; font-size: 1rem; line-height: 1.55; }
.rev--v1 .rev__card figcaption { font-size: 0.9rem; line-height: 1.4; }
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
      <blockquote>"${esc(primary.text)}"</blockquote>
      <figcaption>— ${esc(primary.name)}, <span class="muted">${esc(primary.role)}</span></figcaption>
    </figure>
    ${rest.length > 0 ? `
    <div class="rev__rest">
      ${rest
        .map(
          (r) => `
      <figure class="rev__mini">
        <blockquote>${esc(r.text)}</blockquote>
        <figcaption>${esc(r.name)} <span class="muted">· ${esc(r.role)}</span></figcaption>
      </figure>`,
        )
        .join('')}
    </div>` : ''}
  </div>
</section>`.trim(),
    css: `
.rev--v2 .rev__hero { max-width: 820px; margin: 0 auto 48px; text-align: center; }
.rev--v2 .rev__hero blockquote { font-family: var(--font-heading); font-size: clamp(1.4rem, 2.5vw, 1.9rem); line-height: 1.35; margin: 0 0 18px; }
.rev--v2 .rev__rest { display: grid; grid-template-columns: 1fr 1fr; gap: var(--grid-gap); }
.rev--v2 .rev__mini { padding: var(--space-block); border-left: 2px solid var(--accent); margin: 0; }
.rev--v2 .rev__mini blockquote { margin: 0 0 10px; }
.rev--v2 .rev__mini figcaption { font-size: 0.88rem; }
@media (max-width: 720px) { .rev--v2 .rev__rest { grid-template-columns: 1fr; } }
`,
  };
};

// -------------------- FAQ --------------------

const faqV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="faq faq--v1">
  <div class="container faq__wrap">
    <h2>${esc(content.home.faq.title)}</h2>
    <div class="faq__list">
      ${content.home.faq.items
        .map(
          (q, i) => `
      <details class="faq__item"${i === 0 ? ' open' : ''}>
        <summary>${esc(q.q)}</summary>
        <p>${esc(q.a)}</p>
      </details>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.faq--v1 .faq__wrap { max-width: 760px; margin: 0 auto; }
.faq--v1 h2 { margin-bottom: 36px; }
.faq--v1 .faq__item { border-bottom: 1px solid var(--border); padding: 16px 0; }
.faq--v1 .faq__item summary { list-style: none; cursor: pointer; font-weight: 600; font-family: var(--font-heading); font-size: 1.05rem; }
.faq--v1 .faq__item summary::-webkit-details-marker { display: none; }
.faq--v1 .faq__item[open] summary { color: var(--accent); }
.faq--v1 .faq__item p { color: var(--muted); margin: 12px 0 0; }
`,
});

const faqV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="faq faq--v2">
  <div class="container">
    <div class="faq__head">
      <h2>${esc(content.home.faq.title)}</h2>
    </div>
    <div class="faq__grid">
      ${content.home.faq.items
        .map(
          (q) => `
      <div class="faq__qa">
        <h3 class="faq__q">${esc(q.q)}</h3>
        <p class="faq__a">${esc(q.a)}</p>
      </div>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.faq--v2 .faq__head { margin-bottom: 36px; }
.faq--v2 .faq__grid { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--grid-gap) * 1.5); }
.faq--v2 .faq__q { font-size: 1.05rem; margin-bottom: 8px; }
.faq--v2 .faq__a { color: var(--muted); margin: 0; }
@media (max-width: 720px) { .faq--v2 .faq__grid { grid-template-columns: 1fr; } }
`,
});

// -------------------- LATEST ARTICLES (home blog cards) --------------------

const latestArticlesV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="la la--v1">
  <div class="container">
    <div class="la__head">
      <h2>${esc(content.blog.index.hero.title)}</h2>
      <p class="muted">${esc(content.blog.index.hero.subtitle)}</p>
    </div>
    <div class="la__grid">
      ${content.blog.articles
        .map(
          (a) => `
      <article class="la__card">
        <h3><a href="/blog/${esc(a.slug)}.html">${esc(a.title)}</a></h3>
        <p class="muted">${esc(a.excerpt)}</p>
        <div class="la__meta"><span>${esc(a.author)}</span> · <span>${a.read_time_min} min read</span></div>
      </article>`,
        )
        .join('')}
    </div>
    <div class="la__more"><a href="/blog/" class="btn btn--ghost">View all articles</a></div>
  </div>
</section>`.trim(),
  css: `
.la--v1 .la__head { margin-bottom: 40px; }
.la--v1 .la__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--grid-gap); }
.la--v1 .la__card { padding: calc(var(--space-block) * 1.2); border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.la--v1 .la__card h3 { margin-top: 0; margin-bottom: 10px; }
.la--v1 .la__card h3 a { color: var(--text); text-decoration: none; }
.la--v1 .la__card h3 a:hover { color: var(--accent); }
.la--v1 .la__card p { margin: 0 0 14px; font-size: 0.96rem; }
.la--v1 .la__meta { font-size: 0.85rem; color: var(--muted); }
.la--v1 .la__more { text-align: center; margin-top: 32px; }
`,
});

// -------------------- CTA --------------------

const ctaV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="cta cta--v1" id="cta">
  <div class="container cta__wrap">
    <h2>${esc(content.home.cta.title)}</h2>
    <p>${esc(content.home.cta.text)}</p>
    <a href="#" class="btn btn--primary">${esc(content.home.cta.button_label)}</a>
  </div>
</section>`.trim(),
  css: `
.cta--v1 { background: var(--accent); color: var(--accent-contrast); padding-block: calc(var(--space-section) * 0.8); text-align: center; }
.cta--v1 .cta__wrap { max-width: 640px; margin: 0 auto; }
.cta--v1 h2 { color: var(--accent-contrast); }
.cta--v1 p { color: var(--accent-contrast); opacity: 0.85; font-size: 1.1rem; margin-bottom: 28px; }
.cta--v1 .btn--primary { background: var(--accent-contrast); color: var(--accent); }
`,
});

const ctaV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="cta cta--v2" id="cta">
  <div class="container">
    <div class="cta__box">
      <div class="cta__text">
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
.cta--v2 .cta__box { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: calc(var(--grid-gap) * 2); padding: calc(var(--space-block) * 2); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.cta--v2 h2 { margin-bottom: 8px; }
.cta--v2 .cta__form { display: flex; gap: 10px; }
.cta--v2 .cta__form input { flex: 1; padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text); font: inherit; }
.cta--v2 .cta__form input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
@media (max-width: 720px) { .cta--v2 .cta__box { grid-template-columns: 1fr; } .cta--v2 .cta__form { flex-direction: column; } }
`,
});

// -------------------- FOOTER --------------------

const footerV1: SectionRenderer = ({ content, nav }) => ({
  html: `
<footer class="ftr ftr--v1">
  <div class="container ftr__row">
    <div>${esc(content.identity.brand)}</div>
    <nav>
      ${nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('\n      ')}
    </nav>
    <div class="muted">${esc(content.home.footer.copyright)}</div>
  </div>
</footer>`.trim(),
  css: `
.ftr--v1 { border-top: 1px solid var(--border); padding-block: 32px; font-size: 0.9rem; }
.ftr--v1 .ftr__row { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; }
.ftr--v1 nav { display: flex; gap: 20px; flex-wrap: wrap; }
.ftr--v1 nav a { color: var(--muted); text-decoration: none; }
.ftr--v1 nav a:hover { color: var(--text); }
`,
});

const footerV2: SectionRenderer = ({ content, nav }) => ({
  html: `
<footer class="ftr ftr--v2">
  <div class="container">
    <div class="ftr__grid">
      <div class="ftr__brand">
        <div class="ftr__mark">${esc(content.identity.brand)}</div>
        <div class="muted">${esc(content.identity.tagline)}</div>
        <div class="ftr__contact muted">
          ${esc(content.identity.company_address)}<br>
          ${esc(content.identity.company_email)} · ${esc(content.identity.company_phone)}
        </div>
      </div>
      <nav class="ftr__nav">
        ${nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('\n        ')}
      </nav>
    </div>
    <hr class="rule" />
    <div class="ftr__bottom muted">${esc(content.home.footer.copyright)}</div>
  </div>
</footer>`.trim(),
  css: `
.ftr--v2 { border-top: 1px solid var(--border); padding-block: calc(var(--space-block) * 2) calc(var(--space-block) * 1.2); }
.ftr--v2 .ftr__grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: calc(var(--grid-gap) * 2); margin-bottom: 32px; }
.ftr--v2 .ftr__mark { font-family: var(--font-heading); font-size: 1.2rem; font-weight: 700; margin-bottom: 6px; }
.ftr--v2 .ftr__contact { font-size: 0.85rem; margin-top: 10px; line-height: 1.6; }
.ftr--v2 .ftr__nav { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
.ftr--v2 .ftr__nav a { color: var(--muted); text-decoration: none; font-size: 0.95rem; }
.ftr--v2 .ftr__nav a:hover { color: var(--accent); }
.ftr--v2 .ftr__bottom { padding-top: 20px; font-size: 0.85rem; }
@media (max-width: 640px) { .ftr--v2 .ftr__grid { grid-template-columns: 1fr; } .ftr--v2 .ftr__nav { align-items: flex-start; } }
`,
});

// -------------------- SUBPAGE BODIES --------------------

const pageFeaturesBody: SectionRenderer = ({ content }) => {
  const p = content.pages.features;
  return {
    html: `
<section class="pb">
  <div class="container pb__wrap">
    ${p.sections
      .map(
        (s) => `
    <div class="pb__block">
      <h2>${esc(s.heading)}</h2>
      ${s.paragraphs.map((pg) => `<p>${esc(pg)}</p>`).join('\n      ')}
    </div>`,
      )
      .join('')}
  </div>
</section>`.trim(),
    css: `
.pb .pb__wrap { max-width: 760px; margin: 0 auto; }
.pb .pb__block + .pb__block { margin-top: calc(var(--space-section) * 0.6); }
.pb .pb__block h2 { margin-bottom: 16px; }
.pb .pb__block p { font-size: 1.05rem; }
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
.pb .pb__wrap { max-width: 820px; margin: 0 auto; }
.pb .pb__intro p { font-size: 1.05rem; }
.pb .pb__intro p + p { margin-top: 1em; }
.pb .pb__steps { list-style: none; margin: 48px 0 0; padding: 0; display: grid; gap: var(--grid-gap); }
.pb .pb__step { display: grid; grid-template-columns: 72px 1fr; gap: 20px; padding: var(--space-block); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.pb .pb__num { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 700; color: var(--accent); }
.pb .pb__step h3 { margin-top: 0; margin-bottom: 6px; }
.pb .pb__step p { color: var(--muted); margin: 0; }
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
        <summary>${esc(q.q)}</summary>
        <p>${esc(q.a)}</p>
      </details>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
    css: `
.pb .pb__wrap { max-width: 820px; margin: 0 auto; }
.pb .pb__item { border-bottom: 1px solid var(--border); padding: 18px 0; }
.pb .pb__item summary { list-style: none; cursor: pointer; font-weight: 600; font-family: var(--font-heading); font-size: 1.05rem; }
.pb .pb__item summary::-webkit-details-marker { display: none; }
.pb .pb__item[open] summary { color: var(--accent); }
.pb .pb__item p { color: var(--muted); margin: 12px 0 0; }
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
      <h2>What we care about</h2>
      <div class="pb__vgrid">
        ${p.values
          .map(
            (v) => `
        <div class="pb__vcell">
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
.pb .pb__wrap { max-width: 820px; margin: 0 auto; }
.pb .pb__story p { font-size: 1.05rem; }
.pb .pb__story p + p { margin-top: 1em; }
.pb .pb__values { margin-top: calc(var(--space-section) * 0.7); }
.pb .pb__values h2 { margin-bottom: 24px; }
.pb .pb__vgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--grid-gap); }
.pb .pb__vcell h3 { margin-top: 0; margin-bottom: 8px; font-size: 1rem; }
.pb .pb__vcell p { color: var(--muted); margin: 0; font-size: 0.95rem; }
`,
  };
};

const pageContactBody: SectionRenderer = ({ content }) => {
  const p = content.pages.contact;
  return {
    html: `
<section class="pb">
  <div class="container pb__wrap">
    <p class="pb__intro">${esc(p.intro)}</p>
    <div class="pb__info">
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
      <button type="submit" class="btn btn--primary">Send message</button>
    </form>
  </div>
</section>`.trim(),
    css: `
.pb .pb__wrap { max-width: 720px; margin: 0 auto; }
.pb .pb__intro { font-size: 1.1rem; color: var(--muted); margin-bottom: 36px; }
.pb .pb__info { margin-bottom: 48px; display: grid; gap: 10px; }
.pb .pb__row { display: grid; grid-template-columns: 120px 1fr; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 0.95rem; }
.pb .pb__label { color: var(--muted); text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.06em; font-weight: 600; }
.pb .pb__form { display: grid; gap: 18px; }
.pb .pb__form label { display: grid; gap: 6px; font-size: 0.9rem; color: var(--muted); }
.pb .pb__form input, .pb .pb__form textarea { padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text); font: inherit; }
.pb .pb__form button { justify-self: start; margin-top: 6px; }
`,
  };
};

// -------------------- BLOG INDEX --------------------

const blogIndexBody: SectionRenderer = ({ content }) => ({
  html: `
<section class="bx">
  <div class="container bx__wrap">
    <div class="bx__grid">
      ${content.blog.articles
        .map(
          (a) => `
      <article class="bx__card">
        <h2><a href="/blog/${esc(a.slug)}.html">${esc(a.title)}</a></h2>
        <p class="muted">${esc(a.excerpt)}</p>
        <div class="bx__meta">${esc(a.author)} · ${a.read_time_min} min read</div>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.bx .bx__wrap { max-width: 880px; margin: 0 auto; }
.bx .bx__grid { display: grid; gap: calc(var(--grid-gap) * 1.5); }
.bx .bx__card { padding: var(--space-block) 0; border-bottom: 1px solid var(--border); }
.bx .bx__card:last-child { border-bottom: none; }
.bx .bx__card h2 { margin-top: 0; margin-bottom: 10px; font-size: clamp(1.4rem, 2.2vw, 1.9rem); }
.bx .bx__card h2 a { color: var(--text); text-decoration: none; }
.bx .bx__card h2 a:hover { color: var(--accent); }
.bx .bx__card p { margin: 0 0 10px; font-size: 1.02rem; }
.bx .bx__meta { font-size: 0.88rem; color: var(--muted); }
`,
});

// -------------------- BLOG ARTICLE --------------------

const blogArticleBody: SectionRenderer = ({ article }) => {
  if (!article) return { html: '', css: '' };
  return {
    html: `
<article class="bp">
  <div class="container bp__wrap">
    <header class="bp__head">
      <h1>${esc(article.title)}</h1>
      <div class="bp__meta">${esc(article.author)} · ${article.read_time_min} min read</div>
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
      <h3>Key takeaways</h3>
      <ul>
        ${article.key_takeaways.map((t) => `<li>${esc(t)}</li>`).join('\n        ')}
      </ul>
    </aside>`
      : ''}
    ${article.faq && article.faq.length
      ? `
    <section class="bp__faq">
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
.bp .bp__wrap { max-width: 760px; margin: 0 auto; }
.bp .bp__head { margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 24px; }
.bp .bp__head h1 { font-size: clamp(2rem, 4vw, 2.8rem); }
.bp .bp__meta { color: var(--muted); font-size: 0.9rem; margin-top: 12px; }
.bp .bp__lead { font-size: 1.2rem; line-height: 1.55; color: var(--text); margin-bottom: 36px; }
.bp .bp__section { margin-bottom: 36px; }
.bp .bp__section h2 { margin-bottom: 16px; }
.bp .bp__section p { font-size: 1.05rem; }
.bp .bp__section p + p { margin-top: 1em; }
.bp .bp__takeaways { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: calc(var(--space-block) * 1.2); margin: 40px 0; }
.bp .bp__takeaways h3 { margin-top: 0; margin-bottom: 16px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); }
.bp .bp__takeaways ul { margin: 0; padding-left: 20px; }
.bp .bp__takeaways li + li { margin-top: 8px; }
.bp .bp__faq { margin-top: 56px; border-top: 1px solid var(--border); padding-top: 40px; }
.bp .bp__qa + .bp__qa { margin-top: 24px; }
.bp .bp__qa h3 { font-size: 1.05rem; margin-bottom: 8px; }
.bp .bp__qa p { color: var(--muted); margin: 0; }
`,
  };
};

// -------------------- REGISTRY --------------------

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
