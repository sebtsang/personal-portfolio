# Architecture notes

The detail behind the [README](../README.md). Each section explains one
decision and the bug or constraint that led to it. Read the README
first.

- [The journal](#the-journal)
- [Mobile](#mobile)
- [Type and handwriting](#type-and-handwriting)
- [The chatbot](#the-chatbot)
- [When the chat fails](#when-the-chat-fails)
- [Adding a page](#adding-a-page)
- [Hosting on Vercel](#hosting-on-vercel)

## The journal

### Page stack

The journal has five pages in a fixed order: `home`, `about`,
`experience`, `linkedin`, `contact`. The order lives in one constant,
[pageOrder.ts](../components/notebook/pageOrder.ts).

Each page fills the viewport. The pages are stacked on top of each
other, with `home` nearest the cover and `contact` deepest. You only see
the top page. Navigating flips the current page out of the way to show
the next one.

Pages stay mounted after the first visit. A page keeps its DOM, its
image cache, and its state (drag positions, scroll, peeled stickers), so
flipping back shows it as you left it. The state model is described in
the header comment of
[NotebookShell.tsx](../components/notebook/NotebookShell.tsx).

**Watch out:** a mounted page that you cannot see still runs its
effects. Anything that adds a `window` listener must check that its page
is the active one. `LinkedInPage` once had an arrow-key listener without
that check. After one visit to `/linkedin`, the arrow keys were
swallowed on every other page and the carousel advanced out of sight. It
now takes an `active` prop from `ContentPage`.

### Page flips

| Flip | When | Duration | Motion |
| --- | --- | --- | --- |
| Opening | Any navigation except going home | 1.5s | The current page rotates from 0° to -180° around its left edge and reveals the destination under it. |
| Closing | Going back to `home` | 1.5s | Home rotates from -180° to 0° and covers the current page. |
| Cover | Landing page to chat home, and back | 1.2s open, 1.7s close | Owned by [PageFlipTransition.tsx](../components/notebook/PageFlipTransition.tsx). Closing also resets the chat. |

The opening flip looks the same whatever the page order. Pages are
peers, not a sequence.

### Finishing a flip, and the hidden-tab trap

A flip starts its CSS transition inside two nested
`requestAnimationFrame` calls. The first paints the start rotation. The
second sets the end rotation, so the transition actually runs.
`transitionend` then commits the new page. A `setTimeout` fallback
commits it if that event never reaches React.

The trap: browsers pause `requestAnimationFrame` in a hidden tab but
keep `setTimeout` running. If you hid the tab in the middle of a flip,
the fallback fired while the rotations were still at their start values.
The app committed the new page and URL, but the old page stayed on
screen. Going home could not be fixed without a reload, because Escape
does nothing once the app thinks it is already home.

The fix: `commitFlipEnd` sets the end rotations itself. On the normal
path the transition has already set those values, so nothing re-renders.
It only does work when the animation never ran.

### Reveal timing

Text and stickers animate in after a flip lands, not during it. A
session counter and
[PageAnimateContext.tsx](../components/notebook/primitives/PageAnimateContext.tsx)
hold the reveal components (`HandwrittenText`, `DrawnText`, `Sticker`,
polaroids, margin notes) at their first frame until the destination
page is in place.

The counter is bumped before the flip, not at the end. Otherwise
elements from the last visit would show at full opacity during the
flip. Every revisit replays the animation.

### Chat sidebar

On desktop, every content page shows the chat in a column on the left
that takes 28% of the viewport
([ChatSidebar.tsx](../components/notebook/content/ChatSidebar.tsx)). A
red margin rule marks the edge. The home page is the same chat at full
width. Both use the same `<ChatPage>` component, and the `compact` prop
picks the look. There is no animation between the two widths.

### URLs

Each content page has its own route: `/about`, `/experience`,
`/linkedin` and `/contact`. Each one mounts
`<NotebookShell initialView={...}>`, so every page can be linked,
shared and indexed.

- `/` is the landing page. The first click or key press opens the
  journal.
- `/home` skips the cover and lands on the chat.

The shell calls `pushState` on every navigation and listens for
`popstate`, so the browser's back and forward buttons replay the flips.

## Mobile

There is one breakpoint, `max-width: 768px`, read by
[useIsMobile.ts](../lib/hooks/useIsMobile.ts). The hook starts as
`false` on the server so the first client render matches.

Below the breakpoint:

- The chat sidebar becomes a bottom sheet
  ([MobileChatDrawer.tsx](../components/notebook/content/MobileChatDrawer.tsx)).
  A floating button at the bottom left opens a sheet 85% of the screen
  high. Tap the backdrop or swipe down to close it. It also closes
  when the page changes, so it never covers the new page.
- Content pages use a single column. On About, the polaroids and
  stickers move into a strip below the text. Margin notes are hidden.
- LinkedIn cards shrink to 240×300 and flip with a swipe.
- The spiral binding narrows from 48px to 36px.
- The flip perspective tightens from 2400px to 1400px, so the rotation
  still looks 3D on a tall, narrow screen.

### Dragging polaroids without blocking scroll

On mobile the polaroid strip covers about 57% of the screen width and
runs about 1000px down the page. The desktop setting,
`touch-action: none`, turned most of `/about` into a dead zone where a
swipe dragged a photo and the page did not scroll.

Mobile polaroids now do two things:

1. They use `touch-action: pan-y`, so vertical swipes scroll the page.
2. They only start a drag once the gesture has moved mostly sideways
   past `DRAG_INTENT_PX`.

The first step is not enough alone. The first few moves of a vertical
swipe would still move the photo before the browser took over the
gesture.

The trade-off: a diagonal drag moves the photo and scrolls the page at
the same time. That comes with `pan-y`.

## Type and handwriting

- **Caveat** for body text.
- **JetBrains Mono** for small labels.
- **Fraunces** and **Instrument Serif** for display text.

Chat messages appear one character at a time (`HandwrittenText`).

Every size is fluid. The line height (`--line`) and the type scale
(`--fs-kbd` to `--fs-display`) are `clamp()` values in
[globals.css](../app/globals.css). They scale between 1280px and 2560px
wide, and a 1440p screen shows the original design. Below 768px they
are replaced with fixed values, because the fluid formulas would
bottom out at their minimums.

The ruled lines scroll with the content, so text always sits on a line.

## The chatbot

### Two ways to open a page

1. **In the browser.** [lib/intents.ts](../lib/intents.ts) matches slash
   commands (`/about`), single words (`experience`) and navigation
   phrases ("show me the contact page"). It opens the page with a canned
   line and makes no network call.
2. **By the model.** Free-form messages go to `/api/chat`. The model can
   call a tool (`showAbout`, `showExperience`, `showContact`,
   `showLinkedIn`).

Both paths end in the same `dispatchTool` function in
[lib/store.ts](../lib/store.ts).

The matcher is deliberately loose. A false match only opens a harmless
page. A missed match is worse, because the model sometimes calls a tool
without writing any text.

### The request pipeline

[app/api/chat/route.ts](../app/api/chat/route.ts) runs these steps:

1. Rate-limit by IP address: 8 requests per 10 seconds and 40 per hour.
2. Validate the body and reject garbage input.
3. Check the token budget.
4. Keep only the latest user message. The bot answers each message
   without any earlier ones, so a visitor cannot forge a conversation
   history.
5. Build the system prompt, call the provider, and pass the reply
   through the output guard.

### Scope

The bot answers questions about one subject: Seb. The rules are at the
top of [lib/persona/voice.ts](../lib/persona/voice.ts). In short:

- **In scope:** his background, work, opinions and quirks, how to
  contact him, this site, and short creative pieces about him (a rap, a
  haiku, a roast).
- **Out of scope:** code of any kind, general knowledge, homework,
  writing for the visitor, role-play as another assistant, and anything
  about the instructions themselves.
- **In scope but unknown:** if the corpus does not have the answer, the
  bot says it does not know. It never invents one.

For an out-of-scope request the bot replies with a "curveball": one
line that skips the task, then a fact about Seb.

### One random fact per reply

The bot has no memory between messages, so without help every visitor
would get the same most likely joke.
[lib/persona/facts.ts](../lib/persona/facts.ts) holds a list of one-line
facts. Each request gets one at random, and the bot builds its joke or
curveball around it.

Every fact quotes its source text from the corpus. `npm run
corpus:check` fails if that text is no longer there, so a fact cannot
outlive the corpus line it came from.

### The output guard

The prompt asks the model to stay in scope.
[lib/llm/guard.ts](../lib/llm/guard.ts) is the backstop for when it does
not. It runs on every provider's reply and does three things:

1. **Holds the whole reply** until the model finishes. This is the only
   way to never show a visitor half a Python script. Replies are short,
   so the cost is a slightly longer "writing…" indicator.
2. **Blocks code and prompt leaks.** If the reply contains code or text
   that only appears in the system prompt, the guard swaps it for a
   canned refusal and drops any tool calls, so a blocked reply cannot
   open a page either.
3. **Removes em dashes.** Seb's style rule is that visitors never see
   one.

### Red-team script

`npm run redteam` tests the scope rules end to end. It calls the real
`/api/chat` handler in-process, so no dev server is needed, and a
second model grades each reply.

```bash
npm run redteam                                  # every case, 3 runs each
npm run redteam -- --only injection --runs 1     # one category, once
npm run redteam -- --model glm-5.3-flash --temperature 0.5
```

- Cases are in [scripts/redteam-cases.ts](../scripts/redteam-cases.ts).
  "Attack" cases must be refused. "Legit" cases must be answered, which
  catches a bot that has become too strict.
- It makes real, paid model calls and needs `OLLAMA_API_KEY`.
  `--max-calls` stops it at 200 calls by default.
- It never touches production Redis.
- All flags are listed at the top of
  [scripts/redteam.ts](../scripts/redteam.ts).

### Prompt size

The system prompt is roughly 11k tokens. That is an estimate from its
length, at about 4 characters per token. It is made of the voice rules,
a short per-provider note, and the eight corpus files.

Two limits apply:

| Constant | File | Value | Effect |
| --- | --- | --- | --- |
| `CORPUS_WARN_TOKENS` | [lib/llm/prompt.ts](../lib/llm/prompt.ts) | 20k | Logs a warning if the prompt grows past it. |
| `MAX_TOTAL_TOKENS` | [lib/validation.ts](../lib/validation.ts) | 30k | Hard cap on the prompt plus the incoming messages. Past it, `/api/chat` returns 413. |

Both limits used to be much tighter (9k and 12k). The idea was that the
model's context window was the constraint. It is not: the smallest
default model has a 128k window.

**If the warning fires, remove duplicate content before considering
retrieval.** Most of the corpus is rules that must be present on every
request (never mention GPA, never share a phone number). A similarity
search would drop exactly those.

### Providers

[lib/llm/index.ts](../lib/llm/index.ts) supports four providers. Set
`LLM_PROVIDER` to switch.

| Provider | Default model |
| --- | --- |
| `ollama` | `gpt-oss:120b-cloud` |
| `github` | `openai/gpt-4.1-mini` |
| `claude` | `claude-haiku-5-5` |
| `openai` | `gpt-4.1-mini` |

- `LLM_MODEL` overrides the model.
- `LLM_FALLBACK_PROVIDER` retries on a second provider after a 5xx, a
  429, or an error before the reply starts. This is useful when the
  main provider is a free tier.
- Temperature, top_p and max tokens for each provider are in
  [lib/llm/config.ts](../lib/llm/config.ts). `LLM_TEMPERATURE` overrides
  the temperature. Claude is the exception: it gets a token cap and an
  effort level, and ignores `LLM_TEMPERATURE`.

### Why the Claude client uses the Anthropic SDK

Claude Haiku 5.5 returns a 400 for any temperature or top_p other than
the defaults. The AI SDK v4 adapter always sends a temperature (0 when
unset) and cannot set `effort`, so
[lib/llm/claude.ts](../lib/llm/claude.ts) uses `@anthropic-ai/sdk` and
writes the reply in the AI SDK data-stream format itself.

- **Thinking.** Haiku 5.5 always thinks a little first, and thinking
  counts toward `max_tokens`. The cap is 1024 so a short reply still
  fits, and effort is `low` to keep thinking short. A reply with no text
  (all budget spent on thinking, or a refusal) gets a fallback line.
- **One call, no streaming.** The guard holds the whole reply anyway, so
  streaming would not show text sooner. A single call also means every
  failure is known before the response starts, so
  `LLM_FALLBACK_PROVIDER` still works.
- **Prompt caching.** The voice, override and corpus go in a cached
  system block. The random fact and the scope reminder go in a second,
  uncached block after it, so the cached part never changes. Cached
  reads cost a tenth of the normal input price. The `[claude]` log line
  shows `cached=` tokens per reply.

### Why the Ollama client is hand-written

Ollama has a `think` setting that controls how much a reasoning model
thinks before it answers. The ready-made AI SDK v4 providers do not
expose it, so [lib/llm/ollama.ts](../lib/llm/ollama.ts) calls the Ollama
API directly.

- Qwen, GLM and MiniMax accept `think: false`. Without it they spend
  500 or more tokens thinking before they reply.
- gpt-oss ignores `false`. At its default level it used about 170 of
  the 250-token budget on thinking and cut replies off in the middle of
  a sentence. It does accept levels, so the code sends `think: "low"`
  for any gpt-oss model. That brought a full reply down to about 75
  tokens.

### Tool definitions live in three places

- Zod schemas in [lib/tools.ts](../lib/tools.ts)
- JSON Schema in [lib/llm/ollama.ts](../lib/llm/ollama.ts) (the Claude
  client builds its tool list from the Zod schemas)
- The matcher in [lib/intents.ts](../lib/intents.ts)

[lib/tools/index.ts](../lib/tools/index.ts) is a scaffold for merging
them into one registry. That work is on hold until the set of tools
stops changing.

### Empty-bubble safety net

Models sometimes call a tool without writing any text. That would open
a page next to an empty chat bubble. Three layers prevent it:

1. **The intent matcher** catches common phrasings in the browser and
   replies with a canned line before the model is involved.
2. **A rule in `voice.ts`** tells the model never to call a tool with
   empty text.
3. **A render-time fallback** in
   [NotebookShell.tsx](../components/notebook/NotebookShell.tsx). If an
   assistant message has a tool call and no text, it shows a default
   line for that tool (`TOOL_FALLBACK_REPLY`). This happens at render
   time because, while a reply is arriving, the message often does not
   exist yet when the tool call fires.

## When the chat fails

A failed request must always produce a visible reply. A silent bot
looks the same as a broken site. That is how an expired Ollama key
once showed up: you typed, the indicator stopped, and nothing appeared.

**In the browser.** `errorReply()` in
[NotebookShell.tsx](../components/notebook/NotebookShell.tsx) always
returns a line to show. The one exception is an aborted request (you
navigated away, or a newer message replaced it), where a bubble would
be noise. It does not need a readable response body. A rewritten body,
an HTML error page, or no response at all still gets the generic line.

**On the server.** Provider failures return **503, never 502**.
Cloudflare replaces the body of a 502 with its own error page, which
swallowed the "check OLLAMA_API_KEY" hint in production. It leaves 503
bodies alone. 503 is also the accurate code: the provider is
unavailable.

**Error codes.** `jsonError()` sends a stable machine code
(`upstream-unavailable`, `upstream-unreachable`, `rate-limited`)
separate from the human-readable detail. Code should branch on the
machine code, because matching on wording breaks when the wording
changes.

**What this does not do.** The chat bubble will not say whether the
cause was a 401 or a quota limit. Look for the `[claude] <status>:` or
`[ollama] <status>:` line in the server logs.

## Adding a page

1. Add the page to `PAGE_ORDER` in
   [pageOrder.ts](../components/notebook/pageOrder.ts). Earlier means
   closer to the cover.
2. Add a file under
   [components/notebook/split/](../components/notebook/split/) and wire
   it into the `ContentBody` switch in
   [ContentPage.tsx](../components/notebook/content/ContentPage.tsx).
3. Add a tool in [lib/tools.ts](../lib/tools.ts), a pattern in
   [lib/intents.ts](../lib/intents.ts), and a schema in
   [lib/llm/ollama.ts](../lib/llm/ollama.ts).
4. Add a `StageView` kind in [lib/store.ts](../lib/store.ts) and a
   fallback line in `TOOL_FALLBACK_REPLY` in `NotebookShell.tsx`.
5. Optional: add `app/<page>/page.tsx` so the page has its own URL.

## Hosting on Vercel

Most settings are in code, so the dashboard rarely needs changes.

- **Function limits and security headers** are in
  [vercel.json](../vercel.json). `/api/chat` gets 60 seconds and 1024 MB.
  Responses from `/api/chat` are never cached. There is no Content
  Security Policy, because Framer Motion's inline styles would need
  `style-src 'unsafe-inline'`.
- **Metadata and the social card** are in
  [app/layout.tsx](../app/layout.tsx) and
  [app/opengraph-image.tsx](../app/opengraph-image.tsx). The site URL
  comes from `VERCEL_PROJECT_PRODUCTION_URL`, or from
  `NEXT_PUBLIC_SITE_URL` if you set it.
- **Upstash Redis** comes from the Vercel integration, which sets the
  `KV_REST_API_*` variables. [lib/redis.ts](../lib/redis.ts) also
  accepts `UPSTASH_REDIS_REST_*`. Without Redis, rate limiting and
  logging are skipped and the chat still works.
- **`LOG_SALT`** is generated once with `openssl rand -hex 16`. Do not
  rotate it, because that breaks the link between old and new hashed
  IP addresses in the logs.
- **Deployment Protection** is set to Standard, so preview deployments
  cannot be indexed.

### Logs

Logs are stored in Upstash Redis:

- `chat:logs` is kept for 7 days. IP addresses are hashed with
  `LOG_SALT`, and message text is not stored.
- `chat:feedback` is kept for 30 days. It only holds messages that a
  visitor ended with `#feedback`.
