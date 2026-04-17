# Sebastian Tsang — Conversational Portfolio

A chatbot-first personal site. Instead of a conventional homepage, the entire
site *is* a chatbot: the home is a full-screen chat, and when you trigger a
command the chat smoothly docks to a side rail while a content "page"
unfolds in the main area. Built with Next.js 15, the Vercel AI SDK, and
Ollama (MiniMax M2.7 via `:cloud` models).

## Architecture

- **Two-mode layout.** Home = centered full-screen chat. Page = chat docks
  right, content takes the main area. Smooth Framer Motion `layout`
  transition between the two.
- **Hybrid engine.** Quick commands and exact matches (`/projects`,
  `/resume`) dispatch tools locally — no network call, instant. Free-form
  questions stream through `/api/chat` to Ollama, which can invoke the
  same tools. This means the common recruiter paths work even if Ollama
  isn't running.
- **Stage + chat split.** A Zustand store (`lib/store.ts`) drives which
  page is showing. Tool calls from either path update the store the
  same way.
- **Content lives in `/content`.** Bio in `site.ts`, richer project
  entries in `projects.ts`. Edit these to change what the site knows
  about you.

## Run locally

You need [Ollama](https://ollama.com/) installed and running on the same
machine as \`npm run dev\`. Then:

```bash
# 1. Make sure Ollama is running
ollama serve    # runs on localhost:11434 by default

# 2. Pull the model (one-time; :cloud models stream from Ollama Cloud,
# so you don't pay disk for 200B parameters)
ollama pull minimax-m2.7:cloud

# 3. Start the site
npm install
npm run dev
```

Visit http://localhost:3000. Quick commands, slash-commands, and
project-detail intents all work without Ollama. Only free-form questions
("why'd you leave Interac?") hit the model.

## Switching models

The primary model is set in [app/api/chat/route.ts](app/api/chat/route.ts)
as \`MODEL_ID\`. Alternates worth trying:

- \`minimax-m2.7:cloud\` (current — agentic-tuned, great tool calling)
- \`qwen3.5:cloud\` — fast general-purpose backup
- \`glm-5.1:cloud\` — excellent tool calling
- \`gpt-oss:120b\` — OpenAI's open weights

Pull the new model (\`ollama pull <name>\`), swap the string, restart dev.

## Deploying

⚠️ The LLM integration assumes Ollama is reachable at \`localhost:11434\`.
If you deploy to Vercel:

- The quick commands and intent-matched flows still work perfectly.
- Free-form chat will error because Vercel's serverless functions can't
  reach your desktop.

To fix that in production, run a Cloudflare Tunnel (or similar) from your
desktop and set \`OLLAMA_BASE_URL\` in Vercel env vars to the tunnel URL.

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
