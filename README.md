# Sebastian Tsang — Conversational Portfolio

A chatbot-first personal site. Instead of a conventional homepage, the entire
site *is* a chatbot: the home is a full-screen chat, and when you trigger a
command the chat smoothly docks to a side rail while a content "page"
unfolds in the main area. Built with Next.js 15, the Vercel AI SDK, and
Ollama Cloud (MiniMax M2.7).

## Architecture

- **Two-mode layout.** Home = centered full-screen chat. Page = chat docks
  right, content takes the main area. Smooth Framer Motion `layout`
  transition between the two.
- **Hybrid engine.** Quick commands and exact matches (`/projects`,
  `/resume`) dispatch tools locally — no network call, instant. Free-form
  questions stream through `/api/chat` to the LLM, which can invoke the
  same tools. This means the common recruiter paths work even if the LLM
  is down.
- **Stage + chat split.** A Zustand store (`lib/store.ts`) drives which
  page is showing. Tool calls from either path update the store the
  same way.
- **Content lives in `/content`.** Bio in `site.ts`, richer project
  entries in `projects.ts`. Edit these to change what the site knows
  about you.

## Run locally

```bash
npm install
cp .env.example .env.local    # then paste your Ollama Cloud key
npm run dev
```

Visit http://localhost:3000. You can use the site without an API key —
the quick command buttons, slash-commands, and project-detail intents
all work offline. Only free-form questions ("why'd you leave Interac?")
need the LLM.

## Environment

```
OLLAMA_API_KEY=...
```

Get one at [ollama.com/settings/keys](https://ollama.com/settings/keys).
Requires an Ollama Cloud (paid) subscription to access cloud models.

## Switching models

The model is configured in [app/api/chat/route.ts](app/api/chat/route.ts)
as `MODEL_ID`. Any Ollama Cloud model identifier works, e.g.:

- `minimax-m2.7:cloud` (current — agentic-tuned, best tool calling)
- `glm-4.6:cloud`
- `kimi-k2:cloud`
- `gpt-oss:120b-cloud`

Swap the string, redeploy. No other code changes needed.

## Build / deploy

```bash
npm run build
npm run start
```

On Vercel: import the repo, set `ANTHROPIC_API_KEY` in project env vars.
Nothing else to configure — `/api/chat` runs on the Edge runtime by default.

## Project layout

```
app/
  page.tsx                 → renders <ChatShell />
  api/chat/route.ts        → streamText + Anthropic + tools
  globals.css              → Tailwind v4 theme tokens
components/
  chat/                    → ChatShell, MessageList, ChatInput,
                             QuickCommands, CommandPalette, ThemeToggle
  stage/                   → StageCanvas + 5 views (Empty, ProjectGrid,
                             ProjectDetail, ExperienceTimeline, ResumeView,
                             ContactCard)
lib/
  intents.ts               → client-side keyword → tool matcher
  tools.ts                 → Zod schemas shared between server + client
  persona.ts               → system prompt (bio + voice + hard rules)
  store.ts                 → Zustand stage store
content/
  site.ts                  → profile + experience + current focus
  projects.ts              → richer per-project entries for the stage
public/
  images/, logos/, favicon.svg
```
