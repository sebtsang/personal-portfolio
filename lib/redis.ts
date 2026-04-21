/**
 * Single source of truth for Upstash Redis credentials.
 *
 * Supports both naming schemes so the same code works whether the
 * Vercel-Upstash integration was used (`KV_REST_API_*`) or env vars
 * were set manually (`UPSTASH_REDIS_REST_*`).
 */

import { Redis } from "@upstash/redis";

function readCreds(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    "";
  if (!url || !token) return null;
  return { url, token };
}

const creds = readCreds();

export const redis: Redis | null = creds ? new Redis(creds) : null;

export const hasUpstash: boolean = creds !== null;
