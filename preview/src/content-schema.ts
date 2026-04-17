// Scaled up to match seobuilder2 volume:
// - Homepage with 12-14 sections (long content blocks)
// - 5 secondary pages (features, how-it-works, faq, about, contact)
// - Blog with index + 3 articles (~800-1200 words each)

export interface SiteIdentity {
  brand: string;
  tagline: string;
  meta_title: string;
  meta_description: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_registration: string;
}

export interface HomeContent {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta_label: string;
  };
  value_prop: {
    title: string;
    lead: string;
    paragraphs: string[]; // 4-5 paragraphs
  };
  stats: {
    items: { number: string; label: string; detail?: string }[]; // 3-4 items
  };
  smarter_trading: {
    title: string;
    subtitle: string;
    items: { title: string; text: string }[]; // 6 items
  };
  trust_security: {
    title: string;
    subtitle: string;
    cards: { title: string; text: string }[]; // 4 cards
  };
  how_it_works: {
    title: string;
    subtitle: string;
    steps: { title: string; description: string }[]; // 4-5 steps
  };
  tools: {
    title: string;
    subtitle: string;
    items: { title: string; text: string }[]; // 4 tools
  };
  longform: {
    title: string;
    paragraphs: string[]; // 3-4 paragraphs
    lead_quote?: string;
  };
  reviews: {
    title: string;
    items: { name: string; role: string; text: string }[]; // 6 reviews
  };
  faq: {
    title: string;
    items: { q: string; a: string }[]; // 8 Q&A
  };
  cta: {
    title: string;
    text: string;
    button_label: string;
  };
  footer: {
    nav: { label: string; href: string }[]; // 6 links
    copyright: string;
  };
}

export interface SecondaryPages {
  features: {
    hero: { title: string; subtitle: string };
    sections: { heading: string; paragraphs: string[] }[]; // 4-5 sections
    cta: { title: string; text: string; button_label: string };
  };
  how_it_works: {
    hero: { title: string; subtitle: string };
    intro_paragraphs: string[]; // 2-3 paragraphs
    steps: { title: string; description: string }[]; // 5-6 steps
    cta: { title: string; text: string; button_label: string };
  };
  faq: {
    hero: { title: string; subtitle: string };
    items: { q: string; a: string }[]; // 12-14 Q&A
  };
  about: {
    hero: { title: string; subtitle: string };
    story_paragraphs: string[]; // 4-5 paragraphs
    values: { title: string; text: string }[]; // 3 values
  };
  contact: {
    hero: { title: string; subtitle: string };
    intro: string;
    company: { name: string; address: string; phone: string; email: string };
    hours: string;
  };
}

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  read_time_min: number;
  lead_paragraph: string;
  sections: {
    heading: string;
    paragraphs: string[]; // 2-4 paragraphs per section
  }[]; // 4-5 sections per article
  key_takeaways: string[]; // 3-4 bullets
  faq: { q: string; a: string }[]; // 3 Q&A at the end
}

export interface BlogContent {
  index: {
    hero: { title: string; subtitle: string };
  };
  articles: BlogArticle[]; // exactly 3
}

export interface SiteContent {
  identity: SiteIdentity;
  home: HomeContent;
  pages: SecondaryPages;
  blog: BlogContent;
}
