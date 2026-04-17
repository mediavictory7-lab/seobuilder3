import type { SiteContent } from './content-schema.js';

export interface RenderCtx {
  content: SiteContent;
  hero_image_url?: string;
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

const headerV1: SectionRenderer = ({ content }) => ({
  html: `
<header class="hdr hdr--v1">
  <div class="container hdr__row">
    <a class="hdr__brand" href="#">${esc(content.brand)}</a>
    <nav class="hdr__nav" aria-label="Main">
      ${content.footer.nav
        .slice(0, 4)
        .map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`)
        .join('\n      ')}
    </nav>
  </div>
</header>`.trim(),
  css: `
.hdr--v1 { padding-block: 20px; border-bottom: 1px solid var(--border); }
.hdr--v1 .hdr__row { display: flex; justify-content: space-between; align-items: center; }
.hdr--v1 .hdr__brand { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; text-decoration: none; color: var(--text); }
.hdr--v1 .hdr__nav { display: flex; gap: 28px; }
.hdr--v1 .hdr__nav a { color: var(--muted); text-decoration: none; font-size: 0.95rem; }
.hdr--v1 .hdr__nav a:hover { color: var(--text); }
@media (max-width: 640px) { .hdr--v1 .hdr__nav { display: none; } }
`,
});

const headerV2: SectionRenderer = ({ content }) => ({
  html: `
<header class="hdr hdr--v2">
  <div class="container">
    <div class="hdr__top">
      <div class="hdr__mark">
        <div class="hdr__brand">${esc(content.brand)}</div>
        <div class="hdr__tag">${esc(content.tagline)}</div>
      </div>
      <nav class="hdr__nav" aria-label="Main">
        ${content.footer.nav
          .slice(0, 5)
          .map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`)
          .join('\n        ')}
      </nav>
    </div>
    <hr class="rule" />
  </div>
</header>`.trim(),
  css: `
.hdr--v2 { padding-block: 28px 0; }
.hdr--v2 .hdr__top { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; padding-bottom: 20px; }
.hdr--v2 .hdr__brand { font-family: var(--font-heading); font-weight: 700; font-size: 1.4rem; color: var(--text); }
.hdr--v2 .hdr__tag { color: var(--muted); font-size: 0.85rem; margin-top: 4px; font-style: italic; }
.hdr--v2 .hdr__nav { display: flex; gap: 24px; flex-wrap: wrap; }
.hdr--v2 .hdr__nav a { color: var(--muted); text-decoration: none; font-size: 0.92rem; }
.hdr--v2 .hdr__nav a:hover { color: var(--accent); }
@media (max-width: 720px) { .hdr--v2 .hdr__top { flex-direction: column; align-items: flex-start; } }
`,
});

// -------------------- HERO --------------------

const heroV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="hero hero--v1">
  <div class="container hero__wrap">
    <span class="eyebrow">${esc(content.hero.eyebrow)}</span>
    <h1>${esc(content.hero.title)}</h1>
    <p class="hero__sub">${esc(content.hero.subtitle)}</p>
    <div class="hero__actions">
      <a href="#cta" class="btn btn--primary">${esc(content.hero.cta_label)}</a>
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
      <span class="eyebrow">${esc(content.hero.eyebrow)}</span>
      <h1>${esc(content.hero.title)}</h1>
      <p class="hero__sub">${esc(content.hero.subtitle)}</p>
      <a href="#cta" class="btn btn--primary">${esc(content.hero.cta_label)}</a>
    </div>
    <div class="hero__media" aria-hidden="true">
      ${
        hero_image_url
          ? `<img src="${esc(hero_image_url)}" alt="" loading="eager" />`
          : `<div class="hero__placeholder"></div>`
      }
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

// -------------------- STATS --------------------

const statsV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="stats stats--v1">
  <div class="container stats__row">
    ${content.stats.items
      .map(
        (s) => `
    <div class="stats__item">
      <div class="stats__num">${esc(s.number)}</div>
      <div class="stats__label">${esc(s.label)}</div>
    </div>`
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
      ${content.stats.items
        .map(
          (s) => `
      <div class="stats__card">
        <div class="stats__num">${esc(s.number)}</div>
        <div class="stats__label">${esc(s.label)}</div>
        ${s.detail ? `<p class="stats__detail">${esc(s.detail)}</p>` : ''}
      </div>`
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

// -------------------- LONGFORM --------------------

const longformV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="lf lf--v1">
  <div class="container lf__wrap">
    <h2>${esc(content.longform.title)}</h2>
    ${content.longform.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n    ')}
  </div>
</section>`.trim(),
  css: `
.lf--v1 .lf__wrap { max-width: 720px; margin: 0 auto; }
.lf--v1 p { font-size: 1.05rem; color: var(--text); }
.lf--v1 p + p { margin-top: 1em; }
`,
});

const longformV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="lf lf--v2">
  <div class="container lf__grid">
    <div class="lf__aside">
      <h2>${esc(content.longform.title)}</h2>
      ${
        content.longform.lead_quote
          ? `<blockquote class="lf__quote">${esc(content.longform.lead_quote)}</blockquote>`
          : ''
      }
    </div>
    <div class="lf__body">
      ${content.longform.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
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

// -------------------- FEATURES --------------------

const featuresV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="feat feat--v1">
  <div class="container">
    <div class="feat__head">
      <h2>${esc(content.features.title)}</h2>
      <p class="muted">${esc(content.features.subtitle)}</p>
    </div>
    <div class="feat__grid">
      ${content.features.items
        .map(
          (f) => `
      <div class="feat__cell">
        <h3>${esc(f.title)}</h3>
        <p class="muted">${esc(f.text)}</p>
      </div>`
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.feat--v1 .feat__head { text-align: center; max-width: 680px; margin: 0 auto 48px; }
.feat--v1 .feat__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: calc(var(--grid-gap) * 1.2); }
.feat--v1 .feat__cell { padding: 8px 0; }
.feat--v1 .feat__cell h3 { margin-top: 0; margin-bottom: 8px; }
`,
});

const featuresV2: SectionRenderer = ({ content }) => ({
  html: `
<section class="feat feat--v2">
  <div class="container">
    <div class="feat__head feat__head--left">
      <h2>${esc(content.features.title)}</h2>
      <p class="muted">${esc(content.features.subtitle)}</p>
    </div>
    <div class="feat__grid">
      ${content.features.items
        .map(
          (f, i) => `
      <article class="feat__card">
        <div class="feat__num">${String(i + 1).padStart(2, '0')}</div>
        <h3>${esc(f.title)}</h3>
        <p>${esc(f.text)}</p>
      </article>`
        )
        .join('')}
    </div>
  </div>
</section>`.trim(),
  css: `
.feat--v2 .feat__head--left { max-width: 640px; margin-bottom: 48px; }
.feat--v2 .feat__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--grid-gap); }
.feat--v2 .feat__card { padding: calc(var(--space-block) * 1.2); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); position: relative; }
.feat--v2 .feat__num { font-family: var(--font-heading); font-size: 0.85rem; color: var(--accent); letter-spacing: 0.1em; margin-bottom: 10px; }
.feat--v2 .feat__card h3 { margin-top: 0; margin-bottom: 10px; }
.feat--v2 .feat__card p { color: var(--muted); margin-bottom: 0; }
`,
});

// -------------------- REVIEWS --------------------

const reviewsV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="rev rev--v1">
  <div class="container">
    <h2>${esc(content.reviews.title)}</h2>
    <div class="rev__grid">
      ${content.reviews.items
        .map(
          (r) => `
      <figure class="rev__card">
        <blockquote>${esc(r.text)}</blockquote>
        <figcaption>
          <strong>${esc(r.name)}</strong><br>
          <span class="muted">${esc(r.role)}</span>
        </figcaption>
      </figure>`
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
  const primary = content.reviews.items[0] ?? { name: '', role: '', text: '' };
  const rest = content.reviews.items.slice(1, 3);
  return {
    html: `
<section class="rev rev--v2">
  <div class="container">
    <figure class="rev__hero">
      <blockquote>"${esc(primary.text)}"</blockquote>
      <figcaption>— ${esc(primary.name)}, <span class="muted">${esc(primary.role)}</span></figcaption>
    </figure>
    ${
      rest.length > 0
        ? `
    <div class="rev__rest">
      ${rest
        .map(
          (r) => `
      <figure class="rev__mini">
        <blockquote>${esc(r.text)}</blockquote>
        <figcaption>${esc(r.name)} <span class="muted">· ${esc(r.role)}</span></figcaption>
      </figure>`
        )
        .join('')}
    </div>`
        : ''
    }
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
    <h2>${esc(content.faq.title)}</h2>
    <div class="faq__list">
      ${content.faq.items
        .map(
          (q, i) => `
      <details class="faq__item"${i === 0 ? ' open' : ''}>
        <summary>${esc(q.q)}</summary>
        <p>${esc(q.a)}</p>
      </details>`
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
      <h2>${esc(content.faq.title)}</h2>
    </div>
    <div class="faq__grid">
      ${content.faq.items
        .map(
          (q) => `
      <div class="faq__qa">
        <h3 class="faq__q">${esc(q.q)}</h3>
        <p class="faq__a">${esc(q.a)}</p>
      </div>`
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

// -------------------- CTA --------------------

const ctaV1: SectionRenderer = ({ content }) => ({
  html: `
<section class="cta cta--v1" id="cta">
  <div class="container cta__wrap">
    <h2>${esc(content.cta.title)}</h2>
    <p>${esc(content.cta.text)}</p>
    <a href="#" class="btn btn--primary">${esc(content.cta.button_label)}</a>
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
        <h2>${esc(content.cta.title)}</h2>
        <p class="muted">${esc(content.cta.text)}</p>
      </div>
      <form class="cta__form" onsubmit="return false">
        <input type="email" placeholder="you@example.com" aria-label="Email" />
        <button type="submit" class="btn btn--primary">${esc(content.cta.button_label)}</button>
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

const footerV1: SectionRenderer = ({ content }) => ({
  html: `
<footer class="ftr ftr--v1">
  <div class="container ftr__row">
    <div>${esc(content.brand)}</div>
    <nav>
      ${content.footer.nav
        .map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`)
        .join('\n      ')}
    </nav>
    <div class="muted">${esc(content.footer.copyright)}</div>
  </div>
</footer>`.trim(),
  css: `
.ftr--v1 { border-top: 1px solid var(--border); padding-block: 32px; font-size: 0.9rem; }
.ftr--v1 .ftr__row { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; }
.ftr--v1 nav { display: flex; gap: 20px; flex-wrap: wrap; }
.ftr--v1 nav a { color: var(--muted); text-decoration: none; }
`,
});

const footerV2: SectionRenderer = ({ content }) => ({
  html: `
<footer class="ftr ftr--v2">
  <div class="container">
    <div class="ftr__grid">
      <div class="ftr__brand">
        <div class="ftr__mark">${esc(content.brand)}</div>
        <div class="muted">${esc(content.tagline)}</div>
      </div>
      <nav class="ftr__nav">
        ${content.footer.nav
          .map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`)
          .join('\n        ')}
      </nav>
    </div>
    <hr class="rule" />
    <div class="ftr__bottom muted">${esc(content.footer.copyright)}</div>
  </div>
</footer>`.trim(),
  css: `
.ftr--v2 { border-top: 1px solid var(--border); padding-block: calc(var(--space-block) * 2) calc(var(--space-block) * 1.2); }
.ftr--v2 .ftr__grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--grid-gap); margin-bottom: 32px; }
.ftr--v2 .ftr__mark { font-family: var(--font-heading); font-size: 1.2rem; font-weight: 700; margin-bottom: 6px; }
.ftr--v2 .ftr__nav { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
.ftr--v2 .ftr__nav a { color: var(--muted); text-decoration: none; font-size: 0.95rem; }
.ftr--v2 .ftr__bottom { padding-top: 20px; font-size: 0.85rem; }
@media (max-width: 640px) { .ftr--v2 .ftr__grid { grid-template-columns: 1fr; } .ftr--v2 .ftr__nav { align-items: flex-start; } }
`,
});

// -------------------- REGISTRY --------------------

export const registry: Record<string, SectionRenderer> = {
  'header:v1': headerV1,
  'header:v2': headerV2,
  'hero:v1': heroV1,
  'hero:v2': heroV2,
  'stats:v1': statsV1,
  'stats:v2': statsV2,
  'longform:v1': longformV1,
  'longform:v2': longformV2,
  'features:v1': featuresV1,
  'features:v2': featuresV2,
  'reviews:v1': reviewsV1,
  'reviews:v2': reviewsV2,
  'faq:v1': faqV1,
  'faq:v2': faqV2,
  'cta:v1': ctaV1,
  'cta:v2': ctaV2,
  'footer:v1': footerV1,
  'footer:v2': footerV2,
};
