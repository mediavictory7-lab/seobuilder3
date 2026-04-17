// Layouts for each site (home + secondary pages + blog).
// Every site uses the same per-page-type template set but with its own mix of section VERSIONS and ORDER.

export interface Layout {
  home: string[];
  page_features: string[];
  page_how_it_works: string[];
  page_faq: string[];
  page_about: string[];
  page_contact: string[];
  blog_index: string[];
  blog_article: string[];
}

function secondaryShell(headerKey: string, footerKey: string, bodyKey: string): string[] {
  return [headerKey, 'hero-short:v1', bodyKey, 'cta:v1', footerKey];
}

// Site 1 — CryptoExplodeAI · skeptic · midnight-cyan. Heavy, data-forward, 13 home sections.
const layout1: Layout = {
  home: [
    'header:v1',
    'hero:v1',
    'value-prop:v1',
    'stats:v1',
    'smarter-trading:v2',
    'trust-security:v1',
    'how-it-works:v1',
    'tools:v1',
    'longform:v1',
    'reviews:v1',
    'latest-articles:v1',
    'faq:v1',
    'cta:v1',
    'footer:v1',
  ],
  page_features: secondaryShell('header:v1', 'footer:v1', 'page-features:body'),
  page_how_it_works: secondaryShell('header:v1', 'footer:v1', 'page-how-it-works:body'),
  page_faq: secondaryShell('header:v1', 'footer:v1', 'page-faq:body'),
  page_about: secondaryShell('header:v1', 'footer:v1', 'page-about:body'),
  page_contact: secondaryShell('header:v1', 'footer:v1', 'page-contact:body'),
  blog_index: ['header:v1', 'hero-short:v1', 'blog-index:body', 'cta:v1', 'footer:v1'],
  blog_article: ['header:v1', 'blog-article:body', 'cta:v1', 'footer:v1'],
};

// Site 2 — AltrenixOrdre · expert · clinic-mono. Clinical, structured, 12 sections.
const layout2: Layout = {
  home: [
    'header:v2',
    'hero:v2',
    'value-prop:v1',
    'smarter-trading:v1',
    'trust-security:v1',
    'stats:v2',
    'how-it-works:v1',
    'longform:v2',
    'reviews:v2',
    'faq:v2',
    'latest-articles:v1',
    'cta:v1',
    'footer:v2',
  ],
  page_features: secondaryShell('header:v2', 'footer:v2', 'page-features:body'),
  page_how_it_works: secondaryShell('header:v2', 'footer:v2', 'page-how-it-works:body'),
  page_faq: secondaryShell('header:v2', 'footer:v2', 'page-faq:body'),
  page_about: secondaryShell('header:v2', 'footer:v2', 'page-about:body'),
  page_contact: secondaryShell('header:v2', 'footer:v2', 'page-contact:body'),
  blog_index: ['header:v2', 'hero-short:v1', 'blog-index:body', 'cta:v1', 'footer:v2'],
  blog_article: ['header:v2', 'blog-article:body', 'cta:v1', 'footer:v2'],
};

// Site 3 — Bron Valnex · friend · coral-compact. Casual, punchy, 12 sections.
const layout3: Layout = {
  home: [
    'header:v1',
    'hero:v1',
    'stats:v1',
    'smarter-trading:v1',
    'how-it-works:v1',
    'tools:v1',
    'value-prop:v1',
    'reviews:v1',
    'latest-articles:v1',
    'faq:v1',
    'trust-security:v1',
    'cta:v2',
    'footer:v2',
  ],
  page_features: secondaryShell('header:v1', 'footer:v2', 'page-features:body'),
  page_how_it_works: secondaryShell('header:v1', 'footer:v2', 'page-how-it-works:body'),
  page_faq: secondaryShell('header:v1', 'footer:v2', 'page-faq:body'),
  page_about: secondaryShell('header:v1', 'footer:v2', 'page-about:body'),
  page_contact: secondaryShell('header:v1', 'footer:v2', 'page-contact:body'),
  blog_index: ['header:v1', 'hero-short:v1', 'blog-index:body', 'cta:v2', 'footer:v2'],
  blog_article: ['header:v1', 'blog-article:body', 'cta:v2', 'footer:v2'],
};

// Site 4 — Caixa Invest · teacher · sunlit-editorial. Editorial, wide margins, 12 sections.
const layout4: Layout = {
  home: [
    'header:v2',
    'hero:v2',
    'longform:v2',
    'value-prop:v1',
    'smarter-trading:v2',
    'how-it-works:v1',
    'trust-security:v1',
    'stats:v2',
    'reviews:v2',
    'latest-articles:v1',
    'faq:v2',
    'footer:v2',
  ],
  page_features: secondaryShell('header:v2', 'footer:v2', 'page-features:body'),
  page_how_it_works: secondaryShell('header:v2', 'footer:v2', 'page-how-it-works:body'),
  page_faq: secondaryShell('header:v2', 'footer:v2', 'page-faq:body'),
  page_about: secondaryShell('header:v2', 'footer:v2', 'page-about:body'),
  page_contact: secondaryShell('header:v2', 'footer:v2', 'page-contact:body'),
  blog_index: ['header:v2', 'hero-short:v1', 'blog-index:body', 'cta:v1', 'footer:v2'],
  blog_article: ['header:v2', 'blog-article:body', 'cta:v1', 'footer:v2'],
};

// Site 5 — Swap Lidex Sys · performer · stage-amber. Rhythmic, theatrical, 13 sections.
const layout5: Layout = {
  home: [
    'header:v1',
    'hero:v2',
    'stats:v1',
    'smarter-trading:v2',
    'tools:v1',
    'reviews:v2',
    'value-prop:v1',
    'how-it-works:v1',
    'trust-security:v1',
    'longform:v1',
    'latest-articles:v1',
    'faq:v1',
    'cta:v2',
    'footer:v2',
  ],
  page_features: secondaryShell('header:v1', 'footer:v2', 'page-features:body'),
  page_how_it_works: secondaryShell('header:v1', 'footer:v2', 'page-how-it-works:body'),
  page_faq: secondaryShell('header:v1', 'footer:v2', 'page-faq:body'),
  page_about: secondaryShell('header:v1', 'footer:v2', 'page-about:body'),
  page_contact: secondaryShell('header:v1', 'footer:v2', 'page-contact:body'),
  blog_index: ['header:v1', 'hero-short:v1', 'blog-index:body', 'cta:v2', 'footer:v2'],
  blog_article: ['header:v1', 'blog-article:body', 'cta:v2', 'footer:v2'],
};

export const layouts: Record<string, Layout> = {
  'layout-1': layout1,
  'layout-2': layout2,
  'layout-3': layout3,
  'layout-4': layout4,
  'layout-5': layout5,
};
