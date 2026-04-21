# Sebastian Tsang — Journal

A portfolio rendered as a spiral-bound journal. The chat is the home
page; when you run a slash command (or ask a question that matches
one), a new page flips in from the right side of the spread. Four
content pages live inside the journal — `/about`, `/experience`,
`/linkedin`, `/contact`. Everything else is the chat.

Built with Next.js 15, the Vercel AI SDK, Framer Motion, and a
pluggable LLM backend (Ollama / Claude / OpenAI).

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Streaming, edge+node runtimes, API routes, OG image generation |
| **Runtime** | React 19 + TypeScript 5 | Strict types across corpus, tools, routes |
| **Styling** | Tailwind CSS v4 (`@theme`) + PostCSS | v4's CSS-first tokens; no config.js |
| **Fonts** | Caveat (body), JetBrains Mono (meta), Fraunces + Instrument Serif (display) | Handwritten-journal aesthetic without Google Fonts requests |
| **Animation** | Framer Motion 11 | Layout animations, `AnimatePresence` page flips, 3D `rotateY` transitions |
| **State** | Zustand 5 | Stage view store (which page is open) + tool dispatch |
| **LLM SDK** | Vercel AI SDK v4 (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`, `@ai-sdk/openai`) | `useChat` hook, `streamText`, tool-calling wire protocol |
| **Validation** | Zod 3 | Request schema, tool arg validation, provider-agnostic |
| **Rate limiting** | `@upstash/ratelimit` + `@upstash/redis` | Per-IP sliding windows (8/10s burst + 40/hour), fails open |
| **Logging** | Structured JSON to Upstash Redis via `waitUntil` | Hashed IPs, 7-day TTL, opt-in feedback tag |
| **Analytics** | `@vercel/analytics` + `@vercel/speed-insights` | Pageviews + Web Vitals, inert unless enabled in dashboard |
| **UI primitives** | `cmdk`, `lucide-react`, `lenis` (smooth scroll) | Command palette, icons, scroll feel |
| **Dev tooling** | `tsx` (smoke + logs scripts), Next's `eslint-config-next` | Zero extra build steps |
| **Hosting** | Vercel | Auto-deploys on push, function config pinned in `vercel.json` |

Full dep list in [package.json](package.json).

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

| Provider | Env vars | Default model | Cost |
|---|---|---|---|
| `github` | `GITHUB_TOKEN=github_pat_...` | `openai/gpt-4.1-mini` | **free** (rate-limited tier) |
| `ollama` (cloud) | `OLLAMA_API_KEY=...` | `gpt-oss:120b-cloud` | pay-per-token |
| `ollama` (local) | none (daemon must be running) | `gpt-oss:120b-cloud` | free local GPU |
| `claude` | `ANTHROPIC_API_KEY=sk-ant-...` | `claude-haiku-4-5-20251001` | pay-per-token |
| `openai` | `OPENAI_API_KEY=sk-...` | `gpt-4.1-mini` | pay-per-token |

**Why GitHub is the default:** free-tier OpenAI-compatible inference,
no subscription needed, works with any GitHub account. Get a PAT at
[github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens)
with "Models: read" permission. Model catalog at
[github.com/marketplace/models](https://github.com/marketplace/models) —
prefix names with `openai/`, `meta/`, `deepseek/` etc.

**Failover pattern:** set `LLM_FALLBACK_PROVIDER` to a second provider
and `streamChat` auto-retries on 5xx / 429 / pre-stream errors. Good
pairing for reliability:

```bash
LLM_PROVIDER=github           # free primary
LLM_FALLBACK_PROVIDER=ollama  # paid backup if GitHub rate-limits or fails
OLLAMA_API_KEY=...
GITHUB_TOKEN=...
```

**Model-choice notes:** Earlier defaults used `qwen3.5:cloud` but
reasoning models (Qwen / GLM / MiniMax) occasionally burn their entire
output-token budget on internal chain-of-thought despite `think: false`
and return empty content. `gpt-oss:120b-cloud` (Ollama) and
`openai/gpt-4.1-mini` (GitHub Models) are non-reasoning models of
similar quality that don't hit this failure mode. If you swap in a
reasoning model, drop `maxTokens` in [lib/llm/config.ts](lib/llm/config.ts)
to cap the dead time.

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
- **Prose corpus** — edit as markdown, ships in the system prompt
  (loaded by [lib/llm/prompt.ts](lib/llm/prompt.ts)):
  - [content/corpus/bio.md](content/corpus/bio.md) — identity, career,
    voice calibration, hard privacy rules
  - [content/corpus/experience.md](content/corpus/experience.md) —
    per-role bot-facing notes + stack
  - [content/corpus/projects.md](content/corpus/projects.md) —
    deflection ruleset (projects not surfaced)
  - [content/corpus/opinions.md](content/corpus/opinions.md) — real
    takes + gated AI-and-economy take
  - [content/corpus/taste.md](content/corpus/taste.md) — people, tools,
    products Seb actually rates
  - [content/corpus/quirks.md](content/corpus/quirks.md) — basketball,
    loves, preferences, the gated driving fear
  - [content/corpus/looking-for.md](content/corpus/looking-for.md) —
    contact policy, open-buckets, LinkedIn preferred
  - [content/corpus/faq.md](content/corpus/faq.md) — canned replies
    for classic questions

Current corpus lands at ~8.4k tokens of system prompt. Warning threshold
in `prompt.ts` is 9k. If you grow past 12k start thinking about retrieval.

### Blank-bubble safety net

Tool-calling LLMs occasionally emit a tool call with no preceding text,
which renders as a silent page open with an empty SEBBOT bubble. Three
layers of defense:

1. **Intent matcher** ([lib/intents.ts](lib/intents.ts)) — catches common
   phrasings client-side and dispatches with a canned one-liner before
   the LLM is involved. Uses a function-based matcher: exact/short
   patterns, plus a nav-phrase regex + per-tool topic keyword combo.
2. **voice.ts hard rule** — explicit "never emit a tool call with empty
   content; never write \[showTool\] bracket notation as literal text"
   with correct/wrong contrast examples.
3. **Client-side fallback** ([components/notebook/NotebookShell.tsx](components/notebook/NotebookShell.tsx)) —
   `onToolCall` checks the current assistant message and injects a
   per-tool default one-liner (`TOOL_FALLBACK_REPLY`) if content is
   empty. Final safety net even if the first two fail.

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

The repo is wired for Vercel out of the box. Most config lives in
code ([vercel.json](vercel.json), [next.config.ts](next.config.ts),
[app/layout.tsx](app/layout.tsx), [app/manifest.ts](app/manifest.ts))
so a fresh provision is mostly env vars + a few dashboard toggles.

### 1. Import the repo

Push to GitHub, then import into Vercel. Next.js auto-detects — no
build/install overrides needed. Run `vercel link` locally so the CLI
knows the project for `vercel env pull`, `vercel logs`, etc.

### 2. Env vars

| Var | Required? | Where to set | Sensitive? |
|-----|-----------|--------------|-----------|
| `LLM_PROVIDER` | yes | All environments | no (just config) |
| `OLLAMA_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | one of, matching provider | Production + Preview | yes |
| `LOG_SALT` | recommended | Production + Preview (Dev disallows Sensitive flag) | yes |
| `LLM_MODEL` | optional | per env | no |
| `OLLAMA_BASE_URL` | optional (only if not using Ollama Cloud) | per env | no |
| Upstash creds | recommended (see §3) | All environments | no — leave readable so `vercel env pull` works locally |

Generate `LOG_SALT` once with `openssl rand -hex 16` and never rotate
it (rotating breaks IP-hash continuity in chat logs).

### 3. Upstash Redis (rate limiting + logging)

Vercel dashboard → Integrations →
[Upstash](https://vercel.com/integrations/upstash) → Install on the
project. When it asks for a Custom Prefix, **leave it empty** and
check all three environments. The integration provisions a Redis DB
(free tier is fine for a portfolio) and injects:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`, `REDIS_URL`

[lib/redis.ts](lib/redis.ts) reads either the `KV_REST_API_*` (Vercel
integration) or `UPSTASH_REDIS_REST_*` (manual) names — works with
either. Without Upstash, rate limiting and logging silently fail-open:
requests pass through, no logs, no breakage.

### 4. Code-managed config (no dashboard action)

These are pinned in the repo; don't touch them in the dashboard or
they'll drift:

- **Function runtime + limits** ([vercel.json](vercel.json)) —
  `/api/chat` runs on `nodejs` with `maxDuration: 60s`, `memory: 1024`.
- **Security headers** ([vercel.json](vercel.json)) — HSTS,
  X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy,
  Permissions-Policy (camera/mic/geo/topics off), no-store on
  `/api/chat`. CSP is intentionally **not** set — Framer Motion's
  inline styles would need a permissive `style-src 'unsafe-inline'`
  that defeats the point. Add as `Content-Security-Policy-Report-Only`
  first if you want to revisit.
- **OG card / metadata / robots** ([app/layout.tsx](app/layout.tsx)).
  `metadataBase` resolves from `VERCEL_PROJECT_PRODUCTION_URL` (auto)
  or `NEXT_PUBLIC_SITE_URL` (override for a custom domain).
- **OG image** ([app/opengraph-image.tsx](app/opengraph-image.tsx)) —
  edge-rendered 1200×630 journal page.
- **PWA manifest** ([app/manifest.ts](app/manifest.ts)) — served at
  `/manifest.webmanifest`.
- **404 page** ([app/not-found.tsx](app/not-found.tsx)) — "page torn
  out" styled to the journal.
- **Web Analytics + Speed Insights** components are mounted in
  [app/layout.tsx](app/layout.tsx). Inert until you toggle the
  Analytics + Speed Insights tabs ON in the dashboard (see §5).

### 5. Dashboard-only checklist (one-time per project)

Things that can't be expressed in code:

- [ ] **Deployment Protection** → Settings → Deployment Protection →
      Vercel Authentication: **Standard Protection**. Auth-gates all
      preview/branch URLs (so Google can't index your WIP); leaves
      production public.
- [ ] **Mark secrets Sensitive** → Settings → Environment Variables.
      Edit `OLLAMA_API_KEY` and `LOG_SALT` → Sensitive ON. Note:
      "Sensitive" is only allowed on Production + Preview, not
      Development — uncheck Development on those rows before saving.
- [ ] **Enable Web Analytics** → Analytics tab → Enable (Hobby tier).
- [ ] **Enable Speed Insights** → Speed Insights tab → Enable.
- [ ] **Failed-deploy notifications** → Settings → Notifications →
      enable "Failed Deployments".
- [ ] **Custom domain** (if you own one) → Settings → Domains. Auto
      issues HTTPS. After it's live, set `NEXT_PUBLIC_SITE_URL` to the
      custom origin so OG/canonical URLs use it.

### 6. Post-deploy smoke test

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
vercel.json                → function runtime, security headers,
                             no-store on /api/chat, OG caching
next.config.ts             → Next framework config
app/
  layout.tsx               → root wrapper + metadata + Analytics/SpeedInsights
  page.tsx                 → renders <NotebookShell />
  about/page.tsx           → renders shell with initialView={about}
  api/chat/route.ts        → validates, rate-limits, logs, delegates
  globals.css              → Tailwind v4 @theme tokens + keyframes
  opengraph-image.tsx      → 1200×630 edge-rendered social card
  not-found.tsx            → "page torn out" 404
  manifest.ts              → PWA manifest (/manifest.webmanifest)
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
  intents.ts               → function-based matcher: exact patterns +
                             nav-phrase + per-tool topic keyword combo
  store.ts                 → Zustand view store + dispatchTool
  validation.ts            → Zod request schema + budget check
                             (discriminated union allows empty assistant
                             content — see blank-bubble safety net)
  sanitize.ts              → garbage heuristics (non-printable / repeat /
                             base64 detection)
  ratelimit.ts             → Upstash ratelimit wrapper
                             (8/10s burst + 40/hour sliding windows)
  logger.ts                → structured log writer (fire-and-forget
                             via @vercel/functions waitUntil)
  redis.ts                 → shared Upstash client; reads either
                             UPSTASH_REDIS_REST_* or KV_REST_API_*
content/
  site.ts                  → profile, socialLinks, experience array,
                             currentFocus (UI-facing)
  linkedin.ts              → LinkedIn post metadata (5 posts)
  corpus/                  → prose corpus (LLM-facing, 8 files):
                             bio.md, experience.md, projects.md,
                             opinions.md, taste.md, quirks.md,
                             looking-for.md, faq.md
public/
  photos/seb-{1,2,3}.jpg   → portrait polaroids
  logos/{ey,polarity,bmo,stan,interac,toastmasters,spirit-of-math}.*
                           → company logo stickers
  linkedin/post{1..5}.png  → post hero images for LinkedIn carousel
scripts/
  logs-recent.ts           → CLI for reading chat logs
  smoke-test.ts            → post-deploy smoke test
```
