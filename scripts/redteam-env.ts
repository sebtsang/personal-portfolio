/**
 * Imported first by scripts/redteam.ts. lib/llm reads LLM_MODEL and
 * LLM_TEMPERATURE when it loads, so CLI flags must land in process.env
 * before any lib import runs.
 */

export function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (flag("model")) process.env.LLM_MODEL = flag("model");
if (flag("temperature")) process.env.LLM_TEMPERATURE = flag("temperature");

// Never touch production Redis: no rate limits, no log entries.
for (const k of [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
]) {
  delete process.env[k];
}
