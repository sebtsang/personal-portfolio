/**
 * Output guard for chat replies.
 *
 * The system prompt asks the model to stay in scope; this is the
 * backstop for when it doesn't. It runs on every provider's response,
 * because they all speak the AI SDK v4 data-stream protocol: one part
 * per line, `<code>:<json>`, where `0` is text, `9`/`a` are tool calls
 * and results, `e`/`d` finish a step/message, `3` is an error.
 *
 * The whole reply is held until the model finishes, then checked. That
 * is the only way to never show a visitor half a Python script. Replies
 * are short (maxTokens 250-400) and the UI animates text in after it
 * arrives, so the cost is the writing indicator staying up a little
 * longer.
 */

/** Strings that only appear in the system prompt. Seeing one = a leak. */
const PROMPT_MARKERS = [
  "THE VOICE (critical",
  "FEW-SHOT EXAMPLES",
  "OUT-OF-SCOPE EXAMPLES",
  "TOOL CALLING — HARD RULES",
  "FINAL CHECK BEFORE EVERY REPLY",
  "<reference_material>",
  "Extra for this runtime",
];

/**
 * Lines that start like code. Anchored to line start and case-sensitive
 * (keywords are lowercase), so a sentence starting "Import tariffs..."
 * or "For anyone in Toronto:" doesn't trip it.
 */
const CODE_LINE =
  /^\s*(def \w+\(|class \w+\s*[(:{]|import [\w{*]|from [\w.]+ import |function\s*\w*\s*\(|(const|let|var) \w+\s*=|#include\b|public (static|class)\b|SELECT\s.+\sFROM\s|<\?php|<script\b|console\.log\(|print\(|\$ \S|(sudo|curl|wget|grep|npm|npx|pip|brew|git|chmod|rm) -?\w)/m;

/** Code the line check can't anchor: SQL in any case, inline code spans, regex escapes. */
const CODE_ANYWHERE = [
  /\bselect\s+(\*|\w+\s*,[\w\s,]*)\s+from\s+\w+|\bselect\s.+\sfrom\s+\w+\s+(where|limit|order by|group by|join)\b/i,
  /^\s*select\s+\w+(\.\w+)?\s+from\s+\w+(\.\w+)?\s*(;|$)/im,
  /`[^`\n]*([(){}[\];=<>|$\\&]|\s-\w)[^`\n]*`/,
  /(\\[wdsbWDSB.]).*\\[wdsbWDSB.]/,
];

/**
 * The persona writes one or two sentences. Past 8 lines it's a poem or a
 * dump. Short lists stay under it, so a detailed in-scope answer isn't
 * swapped for an off-topic refusal.
 */
const MAX_LINES = 8;

export type Violation = "code" | "prompt-leak" | "too-many-lines";

export function detectViolation(text: string): Violation | null {
  if (text.includes("```") || CODE_LINE.test(text)) return "code";
  if (CODE_ANYWHERE.some((re) => re.test(text))) return "code";
  if (PROMPT_MARKERS.some((m) => text.includes(m))) return "prompt-leak";
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  if (lines.length > MAX_LINES) return "too-many-lines";
  return null;
}

export const BLOCKED_REPLIES = [
  "That one's outside my lane. I only do Seb questions.",
  "Not my department. Ask me something about Seb instead.",
  "I'm a one-topic bot, and the topic is Seb. Try me on that.",
];

function pickBlockedReply(): string {
  return BLOCKED_REPLIES[Math.floor(Math.random() * BLOCKED_REPLIES.length)];
}

type Part = { code: string; raw: string; value: unknown };

function parsePart(line: string): Part {
  const i = line.indexOf(":");
  try {
    return { code: line.slice(0, i), raw: line, value: JSON.parse(line.slice(i + 1)) };
  } catch {
    return { code: "", raw: line, value: undefined };
  }
}

/**
 * Wrap a provider's data-stream Response. Non-stream responses (JSON
 * errors, 4xx/5xx) pass through untouched.
 */
export function guardResponse(res: Response): Response {
  if (!res.ok || !res.body) return res;
  if (res.headers.get("X-Vercel-AI-Data-Stream") !== "v1") return res;

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = "";
  const parts: Part[] = [];

  const collect = (line: string) => {
    if (line.trim()) parts.push(parsePart(line));
  };

  const guarded = res.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk) {
        pending += decoder.decode(chunk, { stream: true });
        let nl: number;
        while ((nl = pending.indexOf("\n")) !== -1) {
          collect(pending.slice(0, nl));
          pending = pending.slice(nl + 1);
        }
      },
      flush(controller) {
        pending += decoder.decode();
        collect(pending);

        const text = parts
          .filter((p) => p.code === "0" && typeof p.value === "string")
          .map((p) => p.value as string)
          .join("");
        const violation = text ? detectViolation(text) : null;
        const finalText = violation ? pickBlockedReply() : text;
        if (violation) {
          console.warn(`[guard] blocked reply (${violation}), ${text.length} chars`);
        }

        const out: string[] = [];
        let textEmitted = false;
        for (const p of parts) {
          if (p.code === "0") {
            if (!textEmitted && finalText) {
              out.push(`0:${JSON.stringify(finalText)}`);
              textEmitted = true;
            }
            continue;
          }
          // A blocked reply doesn't get to navigate the page either.
          if (violation && (p.code === "9" || p.code === "a")) continue;
          out.push(p.raw);
        }
        controller.enqueue(encoder.encode(out.map((l) => l + "\n").join("")));
      },
    })
  );

  return new Response(guarded, { status: res.status, headers: res.headers });
}
