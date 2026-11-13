# sebastiantsang.com

My personal site, built as a spiral-bound journal with a chatbot on the
first page.

Live at [sebastiantsang.com](https://sebastiantsang.com).

## What it is

- The home page is a chat. The bot answers questions about me, in my
  voice.
- The other pages (`/about`, `/experience`, `/linkedin`, `/contact`)
  are pages of the journal. The site flips to them like paper.
- Typing `/about`, or asking "show me his experience", flips to that
  page.
- The bot only talks about me. Ask it to write code or do your homework
  and it changes the subject.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then add one provider key
npm run dev
```

Open http://localhost:3000.

The pages work without any key. The chat needs one model provider. The
default is GitHub Models, which is free: set `GITHUB_TOKEN` in
`.env.local`.

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind v4 and Framer Motion
- Zustand for page state
- Vercel AI SDK v4 for the chat
- Upstash Redis for rate limits and logs
- Hosted on Vercel

## How the chat works

1. **Shortcuts stay in the browser.** Slash commands and obvious
   requests ("show me the contact page") are matched in
   [lib/intents.ts](lib/intents.ts). They open the page with no network
   call.
2. **Everything else goes to the model.** `/api/chat` rate-limits and
   validates the request, then keeps only the latest message. The bot
   has no memory of earlier messages.
3. **The prompt is built from files.** It combines the voice rules, the
   facts about me in [content/corpus/](content/corpus/), and one random
   fact so jokes vary between visitors.
4. **A guard checks the reply.** [lib/llm/guard.ts](lib/llm/guard.ts)
   holds the full reply until the model finishes. If it contains code
   or leaked instructions, the visitor gets a canned refusal.

Production runs on Claude Haiku 5.5 (`LLM_PROVIDER=claude`). GitHub
Models, Ollama and OpenAI also work.

## Where to change things

| To change | Edit |
| --- | --- |
| What the bot knows about me | [content/corpus/](content/corpus/) (eight markdown files) |
| The bot's voice and what it refuses | [lib/persona/voice.ts](lib/persona/voice.ts) |
| The random facts used for jokes | [lib/persona/facts.ts](lib/persona/facts.ts) |
| Job titles, dates and order | [lib/experience.ts](lib/experience.ts) |
| Experience page blurbs and logos | [ExperiencePage.tsx](components/notebook/split/ExperiencePage.tsx) |
| About page text, photos and stickers | [AboutPage.tsx](components/notebook/split/AboutPage.tsx) |
| LinkedIn posts | [LinkedInPage.tsx](components/notebook/split/LinkedInPage.tsx) |
| Contact details | [ContactPage.tsx](components/notebook/split/ContactPage.tsx) |
| Model, temperature and reply length | [lib/llm/config.ts](lib/llm/config.ts) |
| Phrases that open a page without the model | [lib/intents.ts](lib/intents.ts) |

Images live in `public/`:

- `public/photos/` for the About page polaroids
- `public/logos/` for company logos
- `public/linkedin/` for post previews

After changing a job, a date, or the corpus, run `npm run
corpus:check`. Dates and titles are written in two places:
`lib/experience.ts` and the corpus prose. The check fails if they
disagree.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the site at localhost:3000. |
| `npm run build` | Build for production. |
| `npm run lint` | Lint the code. |
| `npm run corpus:check` | Check that the corpus matches `lib/experience.ts` and `lib/persona/facts.ts`. |
| `npm run redteam` | Try to push the bot off topic and grade the replies. Makes real, paid model calls. |
| `npm run smoke <url>` | Test a deployed site: bad input, a normal reply, and the rate limit. |
| `npm run logs:recent` | Show the last 50 chat logs. Add a number for more. |
| `npm run logs:errors` | Show only the failed requests. |

## Environment variables

[.env.example](.env.example) explains each one. Never commit
`.env.local`.

| Variable | Purpose |
| --- | --- |
| `LLM_PROVIDER` | `github` (default), `ollama`, `claude` or `openai`. |
| `LLM_MODEL` | Optional. Overrides the provider's default model. |
| `LLM_FALLBACK_PROVIDER` | Optional. A second provider to try when the first one fails. |
| `LLM_TEMPERATURE` | Optional. Overrides the temperature. |
| `GITHUB_TOKEN`, `OLLAMA_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | The key for the provider you picked. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limits and logs. Leave blank locally. |
| `LOG_SALT` | Hashes IP addresses before they are logged. |

## Project layout

```
app/                  Routes, the /api/chat endpoint, global styles
components/notebook/  The journal: pages, flips, chat, landing page
content/corpus/       What the bot knows about me
lib/llm/              Model providers, prompt builder, output guard
lib/persona/          Voice rules, random facts, per-provider notes
lib/                  Intent matcher, page state, validation, rate limit, logs
scripts/              corpus check, red-team, smoke test, log reader
public/               Photos, logos, LinkedIn previews
docs/                 Architecture notes
```

Most files start with a comment that explains what they do and why.

## Going deeper

[docs/architecture.md](docs/architecture.md) explains the decisions
behind the code:

- [The journal](docs/architecture.md#the-journal): the page stack, the
  flips, and a bug with hidden tabs
- [Mobile](docs/architecture.md#mobile): the layout and touch handling
- [The chatbot](docs/architecture.md#the-chatbot): scope rules, the
  guard, prompt size, providers
- [When the chat fails](docs/architecture.md#when-the-chat-fails): why
  errors always show a reply
- [Adding a page](docs/architecture.md#adding-a-page)
- [Hosting on Vercel](docs/architecture.md#hosting-on-vercel)
