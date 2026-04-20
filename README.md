# Sebastian Tsang — Journal

A portfolio rendered as a spiral-bound journal. The chat is the home
page; when you run a slash command (or ask a question that matches
one), a new page flips in from the right side of the spread. Four
content pages live inside the journal — `/about`, `/experience`,
`/linkedin`, `/contact`. Everything else is the chat.

Built with Next.js 15, the Vercel AI SDK, Framer Motion, and a
pluggable LLM backend (Ollama / Claude / OpenAI).

## Architecture

### Spread layout
- **Home** = the chat fills the viewport (the "cover" open to its first
  page). Spiral binding pinned at `left: 0` across every view.
- **Open** = the chat compresses to a 28%-width "left page" tucked
  against the spine; a content page flips in from the right on a
  `rotateY(95deg) → rotateY(0deg)` pivot around its left seam (~700ms,
  `cubic-bezier(0.16, 1, 0.3, 1)`). The seam itself doubles as a red
  margin rule for the spread.
- **Switch** = going between two open pages (e.g. `/about` → `/experience`)
  horizontally slides the old page out and the new one in (~300ms) —
  different vocabulary from the big open/close flip so it doesn't
  compete.
- **Close** = flip reverses back to edge-on, chat expands.

### Transitions in one place
- Landing → chat: right-bound page flip around the left spine (1.1s,
  back-face with faint ghost rules).
- Chat → split: chat width tween + content pane rotateY flip-in.
- Split → split (page change): horizontal slide + opacity cross-fade.

### Handwriting, not type
Caveat body, JetBrains Mono for small meta labels, Fraunces + Instrument
Serif loaded for future display text. Every chat message reveals
per-character with a staggered opacity fade (`HandwrittenText`
primitive). Sizes lock to a shared 32px ruler grid, and the ruled
lines travel with the scroll content so text never drifts between
rules.

### Hybrid engine
Intent-matched slash commands (`/about`, `/experience`, `/linkedin`,
`/contact`) and "tell me about yourself"-style phrases dispatch a tool
locally via [lib/intents.ts](lib/intents.ts) — no network call. Free-form
questions stream through `/api/chat` to the configured LLM. LLM tool
calls (`showAbout`, `showExperience`, `showContact`, `showLinkedIn`)
route through the same Zustand `dispatchTool` path so either the
regex matcher or the model can open a page.

### Pluggable providers
One env var (`LLM_PROVIDER`) switches between Ollama (local or cloud),
Claude, or OpenAI. Shared voice + corpus + per-model nudges live in
[lib/persona/](lib/persona/); each provider implementation lives in
[lib/llm/](lib/llm/).

### Production hardening
Zod request validation, garbage heuristics, Upstash per-IP rate
limiting (fails open), hashed structured Redis logging via
`waitUntil`, per-provider generation config.

## Run locally

```bash
npm install
cp .env.example .env.local    # edit for your chosen provider
npm run dev
```

Open http://localhost:3000. The landing and chat render with no LLM
configured; intent-matched slash commands still work. Only free-form
questions hit the model.

Deep-link `/about` to skip the landing flip and open the spread
directly with the About page in the content pane. Other content pages
currently live under slash-commands only; add Next routes for them
the same way if you want `/experience`, `/linkedin`, `/contact` URLs.

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

Restart the dev server after changing env vars. No code changes
needed.

### Ollama notes

- **Local daemon:** run `ollama serve`, then `ollama pull <model>`.
  Free, fast, only reachable from the same machine.
- **Ollama Cloud:** set `OLLAMA_API_KEY` — `OLLAMA_BASE_URL` auto-resolves
  to `https://ollama.com`. Works from Vercel deploys.
- **Why hand-rolled instead of `@ai-sdk/openai-compatible`:** we send
  `think: false` to skip chain-of-thought on reasoning models like
  Qwen / GLM / MiniMax, which otherwise burn 500+ tokens before
  replying. None of the v4-compatible providers expose that flag.

## Editing the bot

- **Voice** (rarely changes):
  [lib/persona/voice.ts](lib/persona/voice.ts)
- **Per-model nudges**:
  [lib/persona/overrides/](lib/persona/overrides/)
- **Generation params** (temperature, top_p, max tokens):
  [lib/llm/config.ts](lib/llm/config.ts)
- **Prose corpus** — edit as markdown, ships in the system prompt:
  - [content/corpus/bio.md](content/corpus/bio.md)
  - [content/corpus/experience.md](content/corpus/experience.md)
  - [content/corpus/opinions.md](content/corpus/opinions.md)
  - [content/corpus/faq.md](content/corpus/faq.md)

## Editing the pages

Each content page is a single file under
[components/notebook/split/](components/notebook/split/):

- **About** — [AboutPage.tsx](components/notebook/split/AboutPage.tsx)
  owns the copy (`BODY_PARAGRAPHS`), polaroid data (`POLAROIDS`),
  margin notes, and sticker placements. Images live in
  `public/photos/` and `public/logos/`.
- **Experience** —
  [ExperiencePage.tsx](components/notebook/split/ExperiencePage.tsx).
  Role data (`ROLES`) is hard-coded at the top of the file: company,
  title, dates, logo path, company URL, and a 1–2-line `blurb`.
  Metrics wrapped in `<Metric>` render slightly larger + heavier.
- **LinkedIn** —
  [LinkedInPage.tsx](components/notebook/split/LinkedInPage.tsx).
  `POSTS` array holds URL + hero-image path + caption per card.
- **Contact** —
  [ContactPage.tsx](components/notebook/split/ContactPage.tsx).
  `FIELDS` array defines the rows (email / LinkedIn / GitHub /
  Twitter/X). Email row copies to clipboard on plain click; shift/
  cmd-click follows the mailto: link.

### Swapping media
- Company logos → `public/logos/{name}.jpeg` (or .png/.svg); referenced
  by `logoSrc` in `ExperiencePage`.
- Portrait / polaroid photos → `public/photos/seb-{1,2,3}.jpg`;
  referenced by `src` in `AboutPage.POLAROIDS`.
- LinkedIn post previews → `public/linkedin/post{1..5}.png`.

## Deploying to Vercel

### 1. Project setup

```bash
gh repo create   # if not already
```

Import the repo into Vercel. Next.js auto-detects.

### 2. Env vars (Vercel → Settings → Environment Variables)

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

### 3. Upstash Redis (rate limiting + logging)

Vercel dashboard → Integrations →
[Upstash](https://vercel.com/integrations/upstash) → Install. Create a
Redis database (global, free tier). Link it to your portfolio project —
this auto-populates `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`.

Without Upstash, rate limiting and logging both fail-silent: requests
pass through, no logs stored, no breakage. You can deploy without it
and add it later.

### 4. Function config (already set in code)

- Runtime: `nodejs` (required — hand-rolled Ollama stream needs Node).
- `maxDuration`: 60s. Vercel Hobby caps at 300s, Pro at 800s.
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
  layout.tsx               → minimal root wrapper
  page.tsx                 → renders <NotebookShell />
  about/page.tsx           → renders shell with initialView={about}
  api/chat/route.ts        → validates, rate-limits, logs, delegates
  globals.css              → Tailwind v4 @theme tokens + keyframes
components/notebook/
  NotebookShell.tsx        → phase state (landing | chat | split),
                             useChat wiring, advance triggers,
                             PageFlipTransition
  PageFlipTransition.tsx   → 3D rotateY landing → chat flip
  chrome/
    Paper.tsx              → cream bg + ruled lines + margin rule
    SpiralBinding.tsx      → 22 coils pinned to viewport left
    SpreadMarginRule.tsx   → red vertical rule at chat/content seam
    PageChrome.tsx         → top-left handwritten date
    PageCorner.tsx         → dog-eared bottom-right with page number
    PageBackButton.tsx     → "← home [esc]" shared back button
  landing/
    LandingPage.tsx        → drawn name + role cycler + scraps +
                             ambient lines + scroll cue + corner peel
    AmbientLines.tsx       → SVG lines with pulse animation
    CornerPeel.tsx         → bottom-right triangular page peel
    Scraps.tsx             → taped card, yellow sticky, interactive
                             todo list, margin annotations
    ScrollCue.tsx          → chevron cue
  chat/
    ChatPage.tsx           → scrollable message list + pinned input
    NotebookMessage.tsx    → single message; inline label (home) or
                             stacked label (compact)
    NotebookInput.tsx      → handwritten "you —" input with fade mask
    SlashCommandRow.tsx    → /about /experience /linkedin /contact
    WritingIndicator.tsx   → "writing…" with cycling dots
  split/
    SplitView.tsx          → two-pane layout, rotateY open/close,
                             horizontal slide for page switches
    AboutPage.tsx          → drawn greeting, body paragraphs,
                             draggable polaroids + stickers
    ExperiencePage.tsx     → vertical spine timeline, 9 roles, logo
                             stickers, metric highlights
    LinkedInPage.tsx       → stacked polaroid-card carousel (5 posts)
    ContactPage.tsx        → handwritten note + taped index card
    ContentPagePlaceholder.tsx → fallback for un-built page kinds
  primitives/
    DrawnText.tsx          → clip-path stroke→fill reveal (landing
                             name + "hi — I'm Seb")
    HandwrittenText.tsx    → per-character opacity fade (messages +
                             about paragraphs)
    RoleCycler.tsx         → draws / erases cycling role words
    FitToWidth.tsx         → ResizeObserver-based auto-scale
    Sticker.tsx            → round sticker base with drag + peel
lib/
  llm/
    index.ts               → streamChat() + provider dispatch
    prompt.ts              → buildSystemPrompt() assembly
    config.ts              → MODEL_CONFIG (temp / top_p / maxTokens)
    ollama.ts, claude.ts, openai.ts → provider implementations
  persona/
    voice.ts               → stable voice + few-shot
    overrides/             → per-model nudges
  tools.ts                 → shared Zod tool schemas (4 tools)
  intents.ts               → regex → tool matcher
  store.ts                 → Zustand view store
  validation.ts            → Zod request schema + budget check
  sanitize.ts              → garbage heuristics
  ratelimit.ts             → Upstash ratelimit wrapper
  logger.ts                → structured log writer
content/
  site.ts, linkedin.ts     → structured data
  corpus/*.md              → prose corpus (LLM-facing)
public/
  photos/seb-{1,2,3}.jpg   → portrait polaroids
  logos/{ey,polarity,bmo,stan,interac,toastmasters,spirit-of-math}.*
                           → company logo stickers
  linkedin/post{1..5}.png  → post hero images for LinkedIn carousel
scripts/
  logs-recent.ts           → CLI for reading chat logs
  smoke-test.ts            → post-deploy smoke test
```
