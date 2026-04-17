# Sebastian Tsang — Conversational Portfolio

A chatbot-first personal site. Instead of a conventional homepage, the entire
site *is* a chatbot: the home is a full-screen chat, and when you trigger a
command the chat smoothly docks to a side rail while a content "page"
unfolds in the main area. Built with Next.js 15 and the Vercel AI SDK,
with pluggable LLM providers (Ollama / Claude / OpenAI).

## Architecture

- **Two-mode layout.** Home = centered full-screen chat. Page = chat docks
  right, content takes the main area. Smooth Framer Motion \`layout\`
  transition between the two.
- **Hybrid engine.** Quick commands and exact matches (\`/projects\`,
  \`/resume\`) dispatch tools locally — no network call, instant. Free-form
  questions stream through \`/api/chat\` to whichever LLM provider is
  configured. The common recruiter paths work even without an LLM.
- **Pluggable providers.** One env var (\`LLM_PROVIDER\`) switches between
  Ollama (local or cloud), Claude, or OpenAI. All three live under
  [lib/llm/](lib/llm/) and expose the same interface to the route.
- **Stage + chat split.** A Zustand store (\`lib/store.ts\`) drives which
  page is showing. Tool calls from either path update it the same way.
- **Content lives in \`/content\`.** Bio in \`site.ts\`, richer project
  entries in \`projects.ts\`.

## Run locally

\`\`\`bash
npm install
cp .env.example .env.local   # edit for your chosen provider
npm run dev
\`\`\`

Visit http://localhost:3000. Quick commands + slash-commands + project-
detail intents all work without any LLM configured at all. Only free-form
questions hit the model.

## Switching LLM providers

Edit \`.env.local\`:

\`\`\`bash
LLM_PROVIDER=ollama   # or: claude | openai
LLM_MODEL=...         # optional override; each provider has a default
\`\`\`

Then set the matching credential:

| Provider | Env vars | Default model |
|---|---|---|
| \`ollama\` (local) | none (daemon must be running) | \`qwen3.5:cloud\` |
| \`ollama\` (cloud) | \`OLLAMA_API_KEY=...\` | \`qwen3.5:cloud\` |
| \`claude\` | \`ANTHROPIC_API_KEY=sk-ant-...\` | \`claude-haiku-4-5-20251001\` |
| \`openai\` | \`OPENAI_API_KEY=sk-...\` | \`gpt-4.1-mini\` |

Restart the dev server after changing env vars. No code changes needed.

### Ollama notes

- **Local daemon:** run \`ollama serve\`, then \`ollama pull <model>\`. Free,
  fast, but only reachable from the same machine.
- **Ollama Cloud:** set \`OLLAMA_API_KEY\` — \`OLLAMA_BASE_URL\` auto-resolves
  to \`https://ollama.com\`. Works from anywhere (including Vercel deploys).
- **Why this is hand-rolled instead of using @ai-sdk/openai-compatible:** we
  send \`think: false\` to skip chain-of-thought on reasoning models like
  Qwen / GLM / MiniMax, which otherwise burn 500+ tokens before replying.
  None of the v4-compatible Ollama providers expose that flag.

## Deploying

On Vercel: set the relevant env vars in project settings, push. Free-form
chat works out-of-the-box for Claude, OpenAI, or Ollama Cloud. For the
**local** Ollama daemon you'd need a Cloudflare Tunnel and
\`OLLAMA_BASE_URL=https://<tunnel>.trycloudflare.com\`.

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
