/**
 * Garbage heuristics. Rejects obvious abuse without fighting subtle
 * prompt-injection (that's a different problem; see voice.ts for the
 * anti-jailbreak directive).
 *
 * Heuristics — cheap, permissive, biased toward false-negatives:
 * 1. >40% non-printable characters → binary blob
 * 2. Top-3 char frequency > 80% of message → repeated-char DoS
 *    ("AAAA..." × 2000)
 * 3. Looks like pure base64 / hex and longer than 200 chars → payload
 *
 * If a legitimate question trips these, refine — better to let 100
 * weird prompts through than reject 1 real one.
 */

const NON_PRINTABLE_THRESHOLD = 0.4;
const REPEAT_THRESHOLD = 0.8;
const BASE64_LIKE_MIN_LEN = 200;

export function isLikelyGarbage(text: string): boolean {
  if (text.length < 20) return false; // too short to judge

  // 1. Non-printable ratio — tabs and newlines are OK, control chars aren't.
  let nonPrintable = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    // printable ASCII + common unicode (letters, etc.) OK
    // reject: C0 controls (0-31) except \t\n\r, and DEL (127)
    if ((c < 32 && c !== 9 && c !== 10 && c !== 13) || c === 127) {
      nonPrintable++;
    }
  }
  if (nonPrintable / text.length > NON_PRINTABLE_THRESHOLD) return true;

  // 2. Repeated-character DoS — count top 3 character frequencies.
  const freq = new Map<string, number>();
  for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  const top3 = [...freq.values()].sort((a, b) => b - a).slice(0, 3);
  const top3Sum = top3.reduce((s, n) => s + n, 0);
  if (top3Sum / text.length > REPEAT_THRESHOLD) return true;

  // 3. Long base64/hex blobs. A human-written message contains spaces
  // and varied punctuation; a base64 dump is one big token of [A-Za-z0-9+/=]
  // or [0-9a-fA-F].
  const trimmed = text.trim();
  if (trimmed.length > BASE64_LIKE_MIN_LEN) {
    const base64Like = /^[A-Za-z0-9+/=\s]+$/.test(trimmed);
    const hexLike = /^[0-9a-fA-F\s]+$/.test(trimmed);
    const spaceRatio = (trimmed.match(/\s/g)?.length ?? 0) / trimmed.length;
    if ((base64Like || hexLike) && spaceRatio < 0.05) return true;
  }

  return false;
}
