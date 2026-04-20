# Sebastian Tsang — Conversational Portfolio

A chatbot-first personal site. The home is a full-screen chat; when you
trigger a command the chat smoothly docks to a side rail while a content
"page" unfolds in the main area. Built with Next.js 15, the Vercel AI
SDK, and a pluggable LLM backend (Ollama / Claude / OpenAI).

## Architecture

- **Two-mode layout.** Home = centered full-screen chat. Page = chat docks
  right, content takes the main area. Framer Motion `layout` animates
  between modes.
- **Hybrid engine.** Quick commands and exact matches (`/projects`,
  `/resume`) dispatch tools locally — no network call. Free-form
  questions stream through `/api/chat` to the configured LLM.
- **Pluggable providers.** One env var (`LLM_PROVIDER`) switches between
  Ollama (local or cloud), Claude, or OpenAI. All live under
  [lib/llm/](lib/llm/).
- **Structured prompt assembly.** Voice rules in [lib/persona/voice.ts](lib/persona/voice.ts),
  per-model nudges in [lib/persona/overrides/](lib/persona/overrides/),
  prose corpus in [content/corpus/](content/corpus/) (bio, experience,
  projects, opinions, faq). [lib/llm/prompt.ts](lib/llm/prompt.ts)
  assembles them per request.
- **Production hardening.** Zod validation + garbage heuristics, Upstash
  rate limiting (fails open), structured Redis logging (waitUntil,
  hashed IPs), per-provider parameter config. See
  [plan file](../../.claude/plans/magical-swimming-tower.md) for details.

## Run locally

```bash
npm install
cp .env.example .env.local    # edit for your chosen provider
npm run dev
```

Visit http://localhost:3000. Quick commands, slash-commands, and
project-detail intents all work without any LLM configured. Only
free-form questions hit the model.

## Switching LLM providers

Edit `.env.local`:

```bash
LLM_PROVIDER=ollama   # or: claude | openai
LLM_MODEL=...         # optional override; each provider has a default
```

Then set the matching credential:

| Provider | Env vars | Default model |
|---|---|---|
| `ollama` (local) | none (daemon must be running) | `qwen3.5:cloud` |
| `ollama` (cloud) | `OLLAMA_API_KEY=...` | `qwen3.5:cloud` |
| `claude` | `ANTHROPIC_API_KEY=sk-ant-...` | `claude-haiku-4-5-20251001` |
| `openai` | `OPENAI_API_KEY=sk-...` | `gpt-4.1-mini` |

Restart the dev server after changing env vars. No code changes needed.

### Ollama notes

- **Local daemon:** run `ollama serve`, then `ollama pull <model>`. Free,
  fast, but only reachable from the same machine.
- **Ollama Cloud:** set `OLLAMA_API_KEY` — `OLLAMA_BASE_URL` auto-resolves
  to `https://ollama.com`. Works from Vercel deploys.
- **Why hand-rolled instead of `@ai-sdk/openai-compatible`:** we send
  `think: false` to skip chain-of-thought on reasoning models like
  Qwen / GLM / MiniMax, which otherwise burn 500+ tokens before
  replying. None of the v4-compatible providers expose that flag.

## Editing the bot

- **Voice** (rarely changes): [lib/persona/voice.ts](lib/persona/voice.ts)
- **Per-model nudges**: [lib/persona/overrides/](lib/persona/overrides/)
- **Generation params** (temperature, top_p, max tokens):
  [lib/llm/config.ts](lib/llm/config.ts)
- **Prose corpus** — edit as markdown, ships in the system prompt:
  - [content/corpus/bio.md](content/corpus/bio.md)
  - [content/corpus/experience.md](content/corpus/experience.md)
  - [content/corpus/projects.md](content/corpus/projects.md)
  - [content/corpus/opinions.md](content/corpus/opinions.md)
  - [content/corpus/faq.md](content/corpus/faq.md)

The assembled prompt is memoized per-provider and logs a warning if it
exceeds ~5000 tokens.

## Deploying to Vercel

### 1. Project setup

```bash
gh repo create   # if not already
```

Import the repo into Vercel. Next.js auto-detects.

### 2. Env vars (Vercel dashboard → Settings → Environment Variables)

Mandatory:
- `LLM_PROVIDER` — `ollama` | `claude` | `openai`
- One of `OLLAMA_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`

Strongly recommended (rate limiting + logging):
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `LOG_SALT` — generate with `openssl rand -hex 16`

Optional:
- `LLM_MODEL` — override default for chosen provider
- `OLLAMA_BASE_URL` — only if you're not using Ollama Cloud

### 3. Upstash Redis (for §2 rate limiting + §4 logging)

Vercel dashboard → Integrations → [Upstash](https://vercel.com/integrations/upstash)
→ Install. Create a Redis database (global, free tier). Link it to your
portfolio project — this auto-populates `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`.

Without Upstash, rate limiting and logging both fail-silent: requests
pass through, no logs stored, no breakage. You can deploy without it
and add it later.

### 4. Function config (already set in code)

- Runtime: `nodejs` (required — hand-rolled Ollama stream needs Node).
- `maxDuration`: 60s. Vercel Hobby caps at 300s, Pro at 800s — plenty
  of headroom per [vercel.com/docs/functions/limitations](https://vercel.com/docs/functions/limitations).
- Request body cap: 4.5 MB (platform limit); our validation rejects
  well before this.

### 5. Post-deploy smoke test

```bash
npm run smoke https://your-deployment.vercel.app
```

Runs validation-error paths, a streaming success, and a rate-limit
burst. Exits 0 on all-pass.

## Monitoring

```bash
npm run logs:recent        # last 50 chat logs (anonymized)
npm run logs:recent 200    # last 200
npm run logs:errors        # only non-"ok" statuses
```

Logs are stored in Upstash Redis under `chat:logs` (7-day TTL) and
`chat:feedback` (30-day TTL, opt-in only — when users end a message
with `#feedback`). IPs are hashed with `LOG_SALT`; raw messages are
never logged outside the feedback bucket.

## Project layout

```
app/
  page.tsx                 → renders <ChatShell />
  api/chat/route.ts        → validates, rate-limits, logs, delegates
  globals.css              → Tailwind v4 theme + design tokens
components/
  chat/                    → chat UI (ChatShell, MessageList, ChatInput,
                             QuickCommands, CommandPalette, ThemeToggle,
                             HomeHero, ChatPanel)
  stage/                   → stage views (ProjectGrid, ProjectDetail,
                             ExperienceTimeline, ResumeView, ContactCard,
                             LinkedInDeck, StageFrame, StageCanvas)
  ui/                      → design primitives (CustomCursor, LetterReveal,
                             NumberedHeading, Overline, ArrowList, InView,
                             SmoothScroll, StickerCollection)
lib/
  llm/
    index.ts               → streamChat() + provider dispatch
    prompt.ts              → buildSystemPrompt(provider) assembly
    config.ts              → MODEL_CONFIG (temp/top_p/maxTokens)
    ollama.ts, claude.ts, openai.ts → provider implementations
  persona/
    voice.ts               → stable voice + few-shot
    overrides/             → per-model nudges
  tools.ts                 → shared Zod tool schemas (legacy; see §7 plan)
  intents.ts               → frontend regex → tool matcher
  store.ts                 → Zustand stage store
  validation.ts            → Zod request schema + budget check
  sanitize.ts              → garbage heuristics
  ratelimit.ts             → Upstash ratelimit wrapper
  logger.ts                → structured log writer
  stickers.ts, stickerStore.ts → sticker easter egg
content/
  site.ts, projects.ts, linkedin.ts  → structured data (UI-facing)
  corpus/*.md                        → prose corpus (LLM-facing)
scripts/
  logs-recent.ts           → CLI for reading chat logs
  smoke-test.ts            → post-deploy smoke test
```
