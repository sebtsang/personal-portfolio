#!/usr/bin/env -S node --import tsx
/**
 * Dump the most recent chat logs from Upstash Redis.
 *
 * Usage (add to package.json scripts or run directly):
 *   npm run logs:recent        # last 50 entries, pretty-printed
 *   npm run logs:recent 100    # last 100
 *   npm run logs:errors        # only non-"ok" status
 *
 * Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in .env.local
 * (Vercel deployment auto-populates; local needs a manual copy from the
 * Vercel dashboard or Upstash console).
 */

import { redis } from "../lib/redis";
import type { ChatLog } from "../lib/logger";

const ERRORS_ONLY = process.argv.includes("--errors");
const countArg = process.argv.find((a) => /^\d+$/.test(a));
const COUNT = countArg ? Number(countArg) : 50;

async function main() {
  if (!redis) {
    console.error(
      "Upstash credentials missing. Set UPSTASH_REDIS_REST_URL + _TOKEN " +
        "(or KV_REST_API_URL + _TOKEN from the Vercel-Upstash integration) " +
        "in .env.local.",
    );
    process.exit(1);
  }
  // LRANGE 0 N-1 returns most recent first (we LPUSH).
  const raw = (await redis.lrange("chat:logs", 0, COUNT - 1)) as string[];
  const entries: ChatLog[] = raw
    .map((s) => {
      try {
        return JSON.parse(s) as ChatLog;
      } catch {
        return null;
      }
    })
    .filter((x): x is ChatLog => x !== null);

  const filtered = ERRORS_ONLY
    ? entries.filter((e) => e.status !== "ok" && e.status !== "empty-retry-ok")
    : entries;

  if (filtered.length === 0) {
    console.log(ERRORS_ONLY ? "No errors." : "No logs.");
    return;
  }

  for (const e of filtered) {
    const date = new Date(e.ts).toISOString().replace("T", " ").slice(0, 19);
    const parts = [
      date,
      e.ip_hash,
      e.provider,
      e.model ? `(${e.model})` : "",
      `${e.latency_ms}ms`,
      `tok:${e.prompt_tokens ?? "-"}/${e.completion_tokens ?? "-"}`,
      e.tool_calls.length ? `tools:[${e.tool_calls.join(",")}]` : "",
      e.status,
      e.feedback_flag ? "#feedback" : "",
    ].filter(Boolean);
    console.log(parts.join("  "));
  }
  console.log(`\n${filtered.length} entries`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
