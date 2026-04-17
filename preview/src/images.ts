import { writeFileSync } from 'node:fs';
import { env } from './env.js';

const MODEL = 'black-forest-labs/flux-schnell';
const BASE = 'https://api.replicate.com';

interface Prediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[] | string;
  error?: string;
}

async function req(path: string, init?: RequestInit): Promise<any> {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`Replicate ${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function generateHeroImage(prompt: string, outPath: string): Promise<void> {
  if (env.SKIP_IMAGES) throw new Error('SKIP_IMAGES set');

  const pred: Prediction = await req(`/v1/models/${MODEL}/predictions`, {
    method: 'POST',
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: '4:3',
        num_outputs: 1,
        output_format: 'webp',
        output_quality: 85,
      },
    }),
  });

  let current: Prediction = pred;
  for (let i = 0; i < 60; i++) {
    if (current.status === 'succeeded' || current.status === 'failed' || current.status === 'canceled') break;
    await new Promise((r) => setTimeout(r, 1500));
    current = await req(`/v1/predictions/${current.id}`);
  }

  if (current.status !== 'succeeded') {
    throw new Error(`Image generation failed: ${current.error ?? current.status}`);
  }

  const url = Array.isArray(current.output) ? current.output[0] : current.output;
  if (!url) throw new Error('Image generation returned no URL');

  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  writeFileSync(outPath, buf);
}
