export interface SiteContent {
  brand: string;
  tagline: string;
  meta_title: string;
  meta_description: string;
  hero: { eyebrow: string; title: string; subtitle: string; cta_label: string };
  stats: { items: { number: string; label: string; detail?: string }[] };
  longform: { title: string; paragraphs: string[]; lead_quote?: string };
  features: {
    title: string;
    subtitle: string;
    items: { title: string; text: string }[];
  };
  reviews: {
    title: string;
    items: { name: string; role: string; text: string }[];
  };
  faq: { title: string; items: { q: string; a: string }[] };
  cta: { title: string; text: string; button_label: string };
  footer: { nav: { label: string; href: string }[]; copyright: string };
}
