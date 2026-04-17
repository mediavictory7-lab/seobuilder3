// Каждый layout — упорядоченный список секций. Разный состав, разный порядок, разные версии.
// Это то, что делает 5 сайтов структурно различными.

export interface Layout {
  id: string;
  sections: string[]; // keys of registry, e.g. 'hero:v1'
}

export const layouts: Record<string, Layout> = {
  'layout-1': {
    id: 'layout-1',
    // crypto / skeptic / midnight-cyan — heavy, data-forward
    sections: [
      'header:v1',
      'hero:v1',
      'stats:v1',
      'longform:v1',
      'features:v2',
      'faq:v1',
      'cta:v1',
      'footer:v1',
    ],
  },
  'layout-2': {
    id: 'layout-2',
    // gardening / teacher / sunlit-editorial — editorial, wide margins, reviewy
    sections: [
      'header:v2',
      'hero:v2',
      'longform:v2',
      'features:v1',
      'reviews:v2',
      'faq:v2',
      'footer:v2',
    ],
  },
  'layout-3': {
    id: 'layout-3',
    // budgeting / friend / coral-compact — casual, quick, punchy
    sections: [
      'header:v1',
      'hero:v1',
      'features:v1',
      'stats:v2',
      'cta:v2',
      'reviews:v1',
      'footer:v2',
    ],
  },
  'layout-4': {
    id: 'layout-4',
    // dog nutrition / expert / clinic-mono — clinical, structured
    sections: [
      'header:v2',
      'hero:v2',
      'longform:v1',
      'features:v2',
      'faq:v2',
      'cta:v1',
      'footer:v1',
    ],
  },
  'layout-5': {
    id: 'layout-5',
    // piano / performer / stage-amber — rhythmic, varied, theatrical
    sections: [
      'header:v1',
      'hero:v2',
      'stats:v1',
      'reviews:v2',
      'features:v1',
      'cta:v2',
      'faq:v1',
      'footer:v2',
    ],
  },
};
