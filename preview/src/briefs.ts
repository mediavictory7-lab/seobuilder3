export interface Brief {
  id: string;
  brand_override: string;      // user-specified funnel brand, must be used verbatim
  niche: string;
  keyword: string;
  angle: string;               // positioning angle within the niche
  audience: string;
  tone_hint: string;
  hero_image_prompt: string;
  blog_topics: string[];       // 3 specific article topics for this site
}

export const briefs: Brief[] = [
  {
    id: 'site-1',
    brand_override: 'CryptoExplodeAI',
    niche: 'crypto-trading',
    keyword: 'AI-Assisted Crypto Trading Platform',
    angle:
      'AI-first: algorithmic signals, automated strategies, emphasis on data and model behavior rather than promises',
    audience: 'retail traders who have tried other platforms and are wary of marketing claims',
    tone_hint: 'measured, skeptical, technical',
    hero_image_prompt:
      'abstract dark dashboard with glowing candlestick chart, neural-network node graph overlay in cyan, subtle data grid, cinematic, shallow depth of field',
    blog_topics: [
      'How Reinforcement Learning Agents Actually Trade Volatile Markets',
      'Why Most Retail AI Trading Signals Fail Backtests (And What to Look For)',
      'Reading a Monte Carlo Drawdown Curve Before You Trust a Strategy',
    ],
  },
  {
    id: 'site-2',
    brand_override: 'AltrenixOrdre',
    niche: 'crypto-trading',
    keyword: 'Institutional-Grade Crypto Trading Platform',
    angle:
      'European exclusive-feel: serious, compliance-aware, designed for experienced high-net-worth traders',
    audience: 'experienced investors allocating meaningful capital across digital assets',
    tone_hint: 'clinical, formal, authoritative',
    hero_image_prompt:
      'clean minimalist trading terminal on bright background, monochrome data tables, architectural typography, editorial, muted greens',
    blog_topics: [
      'Custody, Segregation, and What Actually Protects Your Digital Assets',
      'Order Book Liquidity: What Institutional Routing Looks Like in Practice',
      'The Regulatory Landscape for European Crypto Investors in 2026',
    ],
  },
  {
    id: 'site-3',
    brand_override: 'Bron Valnex',
    niche: 'crypto-trading',
    keyword: 'Everyday Crypto Trading App',
    angle:
      'Retail-first: approachable, everyday language, emphasis on clarity and small wins',
    audience: 'first-time crypto buyers who have delayed because it feels intimidating',
    tone_hint: 'casual, practical, direct',
    hero_image_prompt:
      'flat-lay of a phone showing a simple portfolio screen next to a cup of coffee, warm morning light, lifestyle editorial, desaturated',
    blog_topics: [
      'Your First $100 in Crypto: What to Actually Buy and Why',
      'Dollar-Cost Averaging Is Boring. It Also Works.',
      'Common Fees You Don\u2019t See Until They Add Up',
    ],
  },
  {
    id: 'site-4',
    brand_override: 'Caixa Invest',
    niche: 'crypto-trading',
    keyword: 'Managed Digital Asset Investment Platform',
    angle:
      'Investment-fund framing: managed baskets, diversification, long-horizon, Iberian market flavor',
    audience:
      'Portuguese- and Spanish-speaking savers considering digital assets as part of a diversified portfolio',
    tone_hint: 'warm, patient, educational',
    hero_image_prompt:
      'sunlit desk with financial planning documents, warm wooden surface, glass of water, soft natural light, editorial',
    blog_topics: [
      'Why a Crypto Allocation Belongs in a Diversified Portfolio (And How Much)',
      'Volatility Is Not Risk. Here\u2019s the Difference That Matters.',
      'Rebalancing a Mixed Portfolio of Stocks, Bonds, and Digital Assets',
    ],
  },
  {
    id: 'site-5',
    brand_override: 'Swap Lidex Sys',
    niche: 'crypto-trading',
    keyword: 'DeFi Swap & Liquidity System',
    angle:
      'Active-trader DEX flavor: swap-forward, slippage control, MEV protection, performance culture',
    audience: 'active on-chain traders comfortable with wallets, gas, and slippage',
    tone_hint: 'energetic, performance-focused, direct',
    hero_image_prompt:
      'dark amber trading terminal with animated swap flow, warm glow, layered data panels, dramatic contrast',
    blog_topics: [
      'Sandwich Attacks: How MEV Eats Your Slippage and How to Cut It',
      'Reading a Liquidity Pool Before You Swap Into It',
      'Gas Timing: When a $3 Transaction Saves You $80',
    ],
  },
];
