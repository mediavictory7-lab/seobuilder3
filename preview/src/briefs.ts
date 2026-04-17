export interface Brief {
  id: string;
  niche: string;
  keyword: string;
  audience: string;
  tone_hint: string;
  hero_image_prompt: string;
}

export const briefs: Brief[] = [
  {
    id: 'site-1',
    niche: 'crypto-trading',
    keyword: 'AI Crypto Trading Platform',
    audience: 'independent retail traders tired of scam platforms',
    tone_hint: 'measured, skeptical, evidence-led',
    hero_image_prompt:
      'abstract dark dashboard with glowing candlestick chart and subtle blue data grid, cinematic, minimalist, shallow depth of field',
  },
  {
    id: 'site-2',
    niche: 'home-gardening',
    keyword: 'Container Vegetable Gardening Kit',
    audience: 'first-time apartment gardeners with balconies',
    tone_hint: 'warm, patient, teacherly',
    hero_image_prompt:
      'sunny balcony with wooden planters of herbs and cherry tomatoes, soft morning light, natural tones, lifestyle photography',
  },
  {
    id: 'site-3',
    niche: 'personal-budgeting',
    keyword: 'Zero-Based Budgeting App',
    audience: 'millennials with irregular freelance income',
    tone_hint: 'casual, direct, practical-friend',
    hero_image_prompt:
      'flat-lay of a notebook with hand-written budget, latte, and phone showing colorful chart, warm editorial, desaturated',
  },
  {
    id: 'site-4',
    niche: 'dog-nutrition',
    keyword: 'Senior Dog Joint Supplements',
    audience: 'owners of aging large-breed dogs',
    tone_hint: 'authoritative, clinical, caring',
    hero_image_prompt:
      'studio portrait of a grey-muzzled golden retriever on neutral beige background, soft light, veterinary editorial',
  },
  {
    id: 'site-5',
    niche: 'online-piano-lessons',
    keyword: 'Adult Beginner Online Piano Lessons',
    audience: 'adults rediscovering piano after 20+ years away',
    tone_hint: 'energetic, encouraging, performer-teacher',
    hero_image_prompt:
      'close-up of hands on piano keys with warm lamp light, blurred sheet music, intimate, dramatic contrast',
  },
];
