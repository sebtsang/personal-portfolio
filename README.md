# Sebastian Tsang — Journal

My personal site, rendered as a spiral-bound journal. The chat is the
home page; every section (`/about`, `/experience`, `/linkedin`,
`/contact`) is a page in the journal that you flip to. Slash commands
inside the chat — or matching free-form questions — flip the journal
to the relevant page. Everything else streams from the LLM.

Live at [seb.tsang.io](https://seb.tsang.io) (or wherever the latest
deploy is).

Stack: Next.js 15 (App Router) · React 19 · TypeScript 5 · Tailwind v4 ·
Framer Motion 11 · Zustand 5 · Vercel AI SDK v4 · Zod 3 · Upstash
Redis (rate limit + logs) · hosted on Vercel. Full deps in
[package.json](package.json).

## Architecture

### Page stack (the journal metaphor)
The notebook contains five pages in a fixed canonical order — `home`,
`about`, `experience`, `linkedin`, `contact`. Each one is a full
viewport. They sit on top of each other in z-order, with `home`
nearest the cover and `contact` deepest. The user only ever sees the
topmost visible page; navigating means flipping the current page out
of the way to reveal the next one. Page order lives in a single
constant ([components/notebook/pageOrder.ts](components/notebook/pageOrder.ts)).

Pages stay mounted once visited. Every page touched in the session
keeps its DOM, image cache, and revealed animations — flipping back
snaps you to where you left it (drag positions, scroll, peeled
stickers). The full state model lives in
[components/notebook/NotebookShell.tsx](components/notebook/NotebookShell.tsx)
— see the long header comment.

### Page-flip vocabulary
- **Opening flip** (1.5s, `cubic-bezier(0.76, 0, 0.24, 1)`) — every
  nav *except* returning home. Current page rotates `0° → -180°`
  around its left seam, peeling away to reveal the destination
  underneath. Same vocabulary regardless of canonical index — pages
  are peers, not a sequence.
- **Closing flip** (1.5s, `cubic-bezier(0.32, 0.72, 0.18, 1)`) — only
  for returning to `home`. Home flips in from `-180° → 0°`, covering
  the current content page.
- **Cover flip** (1.2s open, 1.7s close) — landing ↔ chat home,
  owned by [PageFlipTransition.tsx](components/notebook/PageFlipTransition.tsx).
  Closing also resets the chat session so the next open is fresh.

### Per-page reveal timing
A bumped session counter + `PageAnimateContext`
([components/notebook/primitives/PageAnimateContext.tsx](components/notebook/primitives/PageAnimateContext.tsx))
gates reveal primitives (`HandwrittenText`, `DrawnText`, `Sticker`,
polaroids, margin notes) so they hold at their opening frame during a
flip and cascade in only after the destination lands. Bumping the key
*before* the flip (rather than at flip-end) prevents stale full-opacity
elements from leaking through. Every revisit replays the cascade.

### Chat sidebar on content pages (desktop)
Every content page renders a 28%-viewport chat column on the left
([components/notebook/content/ChatSidebar.tsx](components/notebook/content/ChatSidebar.tsx))
with a red margin rule at the seam. Home is the same chat, full
viewport. Same `<ChatPage>` component in both — `compact` toggles the
visual mode. No animated morph between widths.

### Mobile (≤768px)
Single breakpoint at `max-width: 768px`, detected via
[lib/hooks/useIsMobile.ts](lib/hooks/useIsMobile.ts) (a thin
`matchMedia` wrapper that initializes to `false` server-side to keep
SSR + hydration consistent). Below the breakpoint:
- The 28% chat sidebar is replaced by a **bottom-sheet drawer**
  ([components/notebook/content/MobileChatDrawer.tsx](components/notebook/content/MobileChatDrawer.tsx))
  — floating chat button at bottom-left (clears the spiral-binding
  rail), tap to slide up an 85vh sheet that contains the same
  `<ChatPage compact>`. Backdrop tap or swipe-down dismisses.
  Auto-closes when navigation triggers a view change so the freshly-
  flipped page isn't covered.
- Each content page switches to a single-column layout. About's
  polaroids + stickers move into a stacked strip below the body text
  (still draggable via the same Pointer Events code). Margin notes
  are hidden — the wide left gutter doesn't exist on mobile.
- LinkedIn cards shrink to 240×300 with touch swipe to flip between
  posts; arrow buttons are tightened.
- Spiral binding narrows from 48px → 36px to give content more room.
- Page-flip perspective tightens from `2400px` → `1400px` so the
  rotateY reads as 3D on a portrait viewport instead of a flat
  squeeze.
- A render-time fallback in `NotebookShell` commits the flip-end
  state via setTimeout if `transitionend` doesn't reach React (can
  happen when framer-motion's `AnimatePresence` for the drawer is
  mid-exit during a flip).

### Handwriting, not type
Caveat body, JetBrains Mono for small meta labels, Fraunces +
Instrument Serif for display. Every chat message reveals per-character
with a staggered opacity fade (`HandwrittenText`). Every size is
fluid — the baseline grid (`--line`) and the full type scale
(`--fs-kbd` through `--fs-display`) are `clamp()` tokens in
[app/globals.css](app/globals.css) interpolating between 1280–2560px,
anchored so 1440p preserves the original look. Below 768px the
clamp() tokens are overridden with fixed mobile-tuned values so the
`vw`-based formulas don't bottom out below their floors. Ruled lines
travel with the scroll content so text never drifts between rules.

### Hybrid engine
Intent-matched slash commands (`/about`, `/experience`, `/linkedin`,
`/contact`) and "tell me about yourself"-style phrases dispatch a tool
locally via [lib/intents.ts](lib/intents.ts) — no network call. The
matcher has two modes: an **exact/short pattern** list (slash commands
and bare nouns like `experience`) and a **nav-phrase regex + per-tool
topic keyword combo** ("can I see his work history" / "show me the
contact page"). False positives just open a safe view; false
negatives are worse because the LLM occasionally emits a tool call
without text, leaving an empty SEBBOT bubble.

Free-form questions stream through `/api/chat` to the LLM. LLM tool
calls (`showAbout`, `showExperience`, `showContact`, `showLinkedIn`)
route through the same Zustand `dispatchTool` path so either the
regex matcher or the model can open a page.

### URL ↔ page sync
Each content page has its own Next route
([app/about/page.tsx](app/about/page.tsx),
[app/experience/page.tsx](app/experience/page.tsx),
[app/linkedin/page.tsx](app/linkedin/page.tsx),
[app/contact/page.tsx](app/contact/page.tsx)) mounting
`<NotebookShell initialView={...}>` — deep-linkable, shareable,
indexable. `/home` skips the cover flip and lands directly on the
chat. `/` is the landing page; first user gesture flips into the
journal. The shell `pushState`s on every navigation and listens to
`popstate` so back/forward replays flips.

## LLM setup

Currently running on **Ollama Cloud, `gpt-oss:120b-cloud`**. The
provider abstraction in [lib/llm/index.ts](lib/llm/index.ts) also
supports GitHub Models, Claude, and OpenAI — flip `LLM_PROVIDER` in
`.env.local` (or Vercel env) to swap. Each provider has a default
model and a tuned generation config ([lib/llm/config.ts](lib/llm/config.ts)).

`LLM_FALLBACK_PROVIDER` triggers an automatic retry with a backup
provider on 5xx / 429 / pre-stream errors. Useful when running on a
free tier as the primary.

**Why hand-rolled Ollama instead of `@ai-sdk/openai-compatible`:** I
send `think: false` to skip chain-of-thought on reasoning models like
Qwen / GLM / MiniMax, which otherwise burn 500+ tokens before
replying. None of the v4-compatible providers expose that flag.
`gpt-oss:120b-cloud` isn't a reasoning model so it doesn't actually
need this anymore — the flag's a no-op there — but the path stays
hand-rolled so swapping back is one env var.

All env vars I read from are documented in [.env.example](.env.example).

## Editing the bot

- **Voice** (rarely changes):
  [lib/persona/voice.ts](lib/persona/voice.ts)
- **Per-provider nudges**:
  [lib/persona/overrides/](lib/persona/overrides/) — `ollama.ts` is
  the one in use; `github.ts` / `claude.ts` / `openai.ts` are
  pre-tuned for if I swap.
- **Generation params** (temperature, top_p, max tokens):
  [lib/llm/config.ts](lib/llm/config.ts)
- **Prose corpus** — markdown, ships in the system prompt
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
    products I rate
  - [content/corpus/quirks.md](content/corpus/quirks.md) — basketball,
    loves, preferences, the gated driving fear
  - [content/corpus/looking-for.md](content/corpus/looking-for.md) —
    contact policy, open-buckets, LinkedIn preferred
  - [content/corpus/faq.md](content/corpus/faq.md) — canned replies
    for classic questions

Current corpus lands at ~8.4k tokens of system prompt. Warning
threshold in `prompt.ts` is 9k. If it grows past 12k, time to think
about retrieval.

### Tool definitions
Tools live in three places today (Zod schemas in
[lib/tools.ts](lib/tools.ts), Ollama JSON Schema inline in
[lib/llm/ollama.ts](lib/llm/ollama.ts), regex matcher in
[lib/intents.ts](lib/intents.ts)). [lib/tools/index.ts](lib/tools/index.ts)
is a scaffold for collapsing all three into a single registry — see
its top-level comment for the planned shape. Deferred until the tool
surface stops churning.

### Blank-bubble safety net
Tool-calling LLMs occasionally emit a tool call with no preceding
text, which renders as a silent page open with an empty SEBBOT
bubble. Three layers of defense:

1. **Intent matcher** ([lib/intents.ts](lib/intents.ts)) — catches
   common phrasings client-side and dispatches with a canned
   one-liner before the LLM is involved.
2. **voice.ts hard rule** — explicit "never emit a tool call with
   empty content; never write \[showTool\] bracket notation as
   literal text" with correct/wrong contrast examples.
3. **Render-time fallback** ([components/notebook/NotebookShell.tsx](components/notebook/NotebookShell.tsx)) —
   the `messages` useMemo computes display text deterministically:
   if an assistant message has a tool invocation but no text, it
   substitutes a per-tool default (`TOOL_FALLBACK_REPLY`).
   Render-time rather than the `onToolCall` callback because in
   streaming `useChat` the assistant message often hasn't been
   appended yet when the tool call fires.

## Editing the pages

Each content page is a single file under
[components/notebook/split/](components/notebook/split/) (named for
the historical split-view layout):

- **About** — [AboutPage.tsx](components/notebook/split/AboutPage.tsx).
  Owns the copy (`BODY_PARAGRAPHS`), polaroid photos (`PHOTOS`) and
  their on-page slots (`POLAROID_SLOTS`), sticker data (`STICKERS`)
  and their slots (`STICKER_SLOTS`), plus margin notes. Polaroid and
  sticker assignments shuffle on every mount (Fisher-Yates,
  `shuffleIndexes()`); once placed, users can drag individual pieces
  around (`PolaroidFrame` / `Sticker` own their drag state).
- **Experience** —
  [ExperiencePage.tsx](components/notebook/split/ExperiencePage.tsx).
  `ROLES` array at the top: company, title, dates, logo path, URL,
  1–2-line `blurb`. Metrics wrapped in `<Metric>` render larger +
  heavier.
- **LinkedIn** —
  [LinkedInPage.tsx](components/notebook/split/LinkedInPage.tsx).
  `POSTS` array holds URL + hero-image path + caption per card.
- **Contact** —
  [ContactPage.tsx](components/notebook/split/ContactPage.tsx).
  `FIELDS` array defines the rows. Email row copies to clipboard on
  plain click; shift/cmd-click follows the mailto: link.

### Adding a page
1. Add the kind to `PAGE_ORDER` in
   [pageOrder.ts](components/notebook/pageOrder.ts) (z-stack position
   matters — earlier = closer to the cover).
2. Drop a new file under
   [components/notebook/split/](components/notebook/split/) and wire
   it into the `ContentBody` switch in
   [content/ContentPage.tsx](components/notebook/content/ContentPage.tsx).
3. Add a tool entry to [lib/tools.ts](lib/tools.ts), an intent
   pattern in [lib/intents.ts](lib/intents.ts), and the Ollama
   schema in [lib/llm/ollama.ts](lib/llm/ollama.ts).
4. Add a `StageView` kind in [lib/store.ts](lib/store.ts) and a
   fallback reply in `NotebookShell.TOOL_FALLBACK_REPLY`.
5. Optional: add an `app/<kind>/page.tsx` route mounting the shell
   with `initialView={{ kind: "<kind>" }}` for direct deep-linking.

### Swapping media
- Company logos → `public/logos/{name}.jpeg` (or .png/.svg);
  referenced by `logoSrc` in `ExperiencePage`.
- Portrait / polaroid photos → `public/photos/seb-{1,2,3}.jpg`;
  referenced by `src` in `AboutPage.PHOTOS`.
- LinkedIn post previews → `public/linkedin/post{1..5}.png`.

## Hosting notes (Vercel)

Most config is pinned in code so the dashboard rarely needs touching:

- **Function limits + security headers** —
  [vercel.json](vercel.json). `/api/chat` runs with `maxDuration: 60s`,
  `memory: 1024`. HSTS, X-Frame-Options DENY, Referrer-Policy,
  Permissions-Policy (camera/mic/geo/topics off), no-store on
  `/api/chat`. CSP intentionally not set — Framer Motion's inline
  styles would need permissive `style-src 'unsafe-inline'`.
- **Metadata + OG** — [app/layout.tsx](app/layout.tsx).
  `metadataBase` resolves from `VERCEL_PROJECT_PRODUCTION_URL` (auto)
  or `NEXT_PUBLIC_SITE_URL` (custom domain override). OG image is
  edge-rendered at [app/opengraph-image.tsx](app/opengraph-image.tsx).
- **Upstash Redis** — installed via the Vercel-Upstash integration,
  injects `KV_REST_API_*` vars. [lib/redis.ts](lib/redis.ts) reads
  either those or `UPSTASH_REDIS_REST_*` (manual). Without Upstash,
  rate limiting and logging silently fail-open.
- **`LOG_SALT`** — generated once with `openssl rand -hex 16`, never
  rotated (rotating breaks IP-hash continuity in chat logs). Marked
  Sensitive in Production + Preview.
- **Deployment Protection** is on Standard for previews so WIP
  branches can't be indexed.

### Smoke test
```bash
npm run smoke https://seb.tsang.io
```
Runs validation-error paths, a streaming success, and a rate-limit
burst. Exits 0 on all-pass.

### Monitoring
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
vercel.json                → function limits, security headers,
                             no-store on /api/chat
next.config.ts             → Next framework config
app/
  layout.tsx               → root wrapper + metadata + Analytics/SpeedInsights
  page.tsx                 → /  → <NotebookShell /> (landing first)
  home/page.tsx            → /home → <NotebookShell skipLanding />
  about/page.tsx           → /about → shell with initialView={about}
  experience/page.tsx      → /experience → shell with initialView={experience}
  linkedin/page.tsx        → /linkedin → shell with initialView={linkedin}
  contact/page.tsx         → /contact → shell with initialView={contact}
  api/chat/route.ts        → validates, rate-limits, logs, delegates
  globals.css              → Tailwind v4 @theme tokens + keyframes
  opengraph-image.tsx      → 1200×630 edge-rendered social card
  not-found.tsx            → "page torn out" 404
  manifest.ts              → PWA manifest (/manifest.webmanifest)
components/notebook/
  NotebookShell.tsx        → page-stack state machine, useChat wiring,
                             flip orchestration, URL ↔ view sync
  PageFlipTransition.tsx   → 3D rotateY landing ↔ chat cover flip
  pageOrder.ts             → canonical PAGE_ORDER (z-stack order)
  chrome/
    Paper.tsx              → cream bg + ruled lines + margin rule
    SpiralBinding.tsx      → 22 coils pinned to viewport left
    SpreadMarginRule.tsx   → red vertical rule at chat/content seam
    PageChrome.tsx         → top-left handwritten date
    PageCorner.tsx         → dog-eared bottom-right with page number
    PageBackButton.tsx     → "← home [esc]" shared back button
    CoverBackButton.tsx    → home-page back-to-cover (closing flip)
  landing/
    LandingPage.tsx        → drawn name + role cycler + scraps +
                             ambient lines + scroll cue + corner peel
    AmbientLines.tsx       → SVG lines with pulse animation
    CornerPeel.tsx         → bottom-right triangular page peel
    Scraps.tsx             → taped card, yellow sticky, interactive
                             todo list, margin annotations
    ScrollCue.tsx          → chevron cue
  chat/
    ChatPage.tsx           → scrollable message list + pinned input;
                             `compact` selects home vs sidebar mode
    NotebookMessage.tsx    → single message; inline label (home) or
                             stacked label (compact)
    NotebookInput.tsx      → handwritten "you —" input with fade mask
    SlashCommandRow.tsx    → /about /experience /linkedin /contact
    PromptSuggestions.tsx  → seed prompts shown above input on a
                             fresh chat
    WritingIndicator.tsx   → "writing…" with cycling dots
    seenMessages.ts        → session set of already-animated message
                             IDs so a remount doesn't re-pen-write
  home/
    HomePage.tsx           → full-viewport chat + cover-back button
                             + "journal · home" label + corner doodle
  content/
    ContentPage.tsx        → branches on useIsMobile: desktop renders
                             ChatSidebar + body; mobile renders body
                             full-width + MobileChatDrawer
    ChatSidebar.tsx        → 28%-viewport ChatPage wrapper
                             (SIDEBAR_PCT exported) — desktop only
    MobileChatDrawer.tsx   → bottom-left floating chat button + 85vh
                             bottom-sheet (framer-motion AnimatePresence
                             + drag-to-dismiss). Mobile only.
  split/                   → page bodies:
    AboutPage.tsx          → drawn greeting, body paragraphs,
                             draggable polaroids + stickers
    ExperiencePage.tsx     → vertical spine timeline, 9 roles, logo
                             stickers, metric highlights
    LinkedInPage.tsx       → stacked polaroid-card carousel (5 posts)
    ContactPage.tsx        → handwritten note + taped index card
    ContentPagePlaceholder.tsx → fallback for un-built page kinds
  primitives/
    DrawnText.tsx          → clip-path stroke→fill reveal
    HandwrittenText.tsx    → per-character opacity fade
    RoleCycler.tsx         → draws / erases cycling role words
    FitToWidth.tsx         → ResizeObserver-based auto-scale
    Sticker.tsx            → round sticker base with drag + peel
    PageAnimateContext.tsx → per-page { animate, sessionKey } passed
                             down so reveal primitives gate + remount
                             on every revisit
components/ui/             → small reusable display primitives
  ArrowList.tsx, CustomCursor.tsx, InView.tsx, LetterReveal.tsx,
  NumberedHeading.tsx, Overline.tsx, SmoothScroll.tsx
lib/
  llm/
    index.ts               → streamChat() + provider dispatch + fallback
    prompt.ts              → buildSystemPrompt() assembly
    config.ts              → MODEL_CONFIG (temp / top_p / maxTokens)
    github.ts, ollama.ts, claude.ts, openai.ts → provider implementations
  persona/
    voice.ts               → stable voice + few-shot
    overrides/             → per-provider nudges (github, ollama,
                             claude, openai)
  tools.ts                 → shared Zod tool schemas (4 tools)
  tools/index.ts           → SCAFFOLD for the planned single-source
                             tool registry (deferred — see comment)
  intents.ts               → function-based matcher: exact patterns +
                             nav-phrase + per-tool topic keyword combo
  hooks/
    useIsMobile.ts         → matchMedia(max-width: 768px) wrapper;
                             SSR-safe, swaps the entire chat layout
                             between desktop sidebar and mobile drawer
  store.ts                 → Zustand view store + dispatchTool
  validation.ts            → Zod request schema + budget check
                             (discriminated union allows empty
                             assistant content — see safety net)
  sanitize.ts              → garbage heuristics (non-printable /
                             repeat / base64 detection)
  ratelimit.ts             → Upstash ratelimit wrapper
                             (8/10s burst + 40/hour sliding windows)
  logger.ts                → structured log writer (fire-and-forget
                             via @vercel/functions waitUntil)
  redis.ts                 → shared Upstash client; reads either
                             UPSTASH_REDIS_REST_* or KV_REST_API_*
  utils.ts                 → cn() — clsx + tailwind-merge
content/
  site.ts                  → profile, socialLinks, experience array,
                             currentFocus (UI-facing)
  linkedin.ts              → LinkedIn post metadata (5 posts)
  corpus/                  → prose corpus (LLM-facing, 8 files):
                             bio.md, experience.md, projects.md,
                             opinions.md, taste.md, quirks.md,
                             looking-for.md, faq.md
public/
  favicon.svg
  photos/seb-{1,2,3}.jpg   → portrait polaroids
  logos/{ey,polarity,bmo,stan,interac,toastmasters,spirit-of-math}.*
                           → company logo stickers
  linkedin/post{1..5}.png  → post hero images for LinkedIn carousel
scripts/
  logs-recent.ts           → CLI for reading chat logs
  smoke-test.ts            → post-deploy smoke test
```
