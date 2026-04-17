import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ENV_PATH = join(homedir(), '.openclaw', '.env');

function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = val;
  }
  return out;
}

const fileEnv = parseEnvFile(ENV_PATH);
const merged = { ...fileEnv, ...process.env };

function require_(key: string): string {
  const v = merged[key];
  if (!v) throw new Error(`${key} is missing (checked ${ENV_PATH} and process.env)`);
  return v;
}

export const env = {
  OPENAI_API_KEY: require_('OPENAI_API_KEY'),
  REPLICATE_API_TOKEN: merged.REPLICATE_API_TOKEN ?? '',
  SKIP_IMAGES: merged.SKIP_IMAGES === '1' || !merged.REPLICATE_API_TOKEN,
};
