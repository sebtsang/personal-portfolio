# Sebastian Tsang — Conversational Portfolio

A chatbot-first personal site. Instead of a conventional homepage, the entire
site *is* a chatbot: ask anything and the stage on the right animates in project
cards, timelines, the resume, or contact info. Built with Next.js 15, the Vercel
AI SDK, and Claude Haiku 4.5.

## Architecture

- **Hybrid engine.** Quick commands and exact matches (`/projects`, `/resume`)
  dispatch tools locally — no network call, instant. Free-form questions stream
  through `/api/chat` to Claude Haiku, which can invoke the same tools.
- **Stage + chat split.** A Zustand store (`lib/store.ts`) drives the stage
  view. Tool calls from either path update the store the same way.
- **Content lives in `/content`.** Bio in `site.ts`, richer project entries in
  `projects.ts`. Edit these to change what the site knows about you.

## Run locally

```bash
npm install
cp .env.example .env.local    # then paste your Anthropic key
npm run dev
```

Visit http://localhost:3000. You can use the site without an API key — the
quick command buttons and slash-commands work offline. Free-form questions
need the key.

## Environment

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get one at [console.anthropic.com](https://console.anthropic.com/).

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
