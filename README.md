# Relay

**AI Chief of Staff for Gmail and Google Calendar**

Relay goes beyond email management — it prioritizes, prepares, summarizes, drafts, schedules, and executes actions on your behalf.

---

## Features

- **Smart Inbox** — AI-ranked email list with P1/P2/P3 priority badges and category tags
- **AI Command Center** — Natural language agent for searching, drafting, scheduling, and more
- **Daily Brief** — Morning executive summary of important emails, meetings, and follow-ups
- **AI Reply Generation** — Context-aware reply drafting in multiple tones (short, professional, friendly)
- **Smart Compose** — AI-powered writing assistant with suggest, fix, improve, tone change, and more
- **Meeting Intelligence** — Auto-generated talking points and context before meetings
- **Follow-up Intelligence** — Tracks sent emails awaiting replies, surfaces reminders
- **Contact Memory** — Relationship tracking with interaction history, response patterns, and VIP flags
- **Semantic Search** — Vector-powered search across emails using pgvector
- **Workflow Automation** — Learns repeated actions and suggests automation rules
- **Calendar Integration** — Full Google Calendar support with event creation and conflict detection
- **Real-time Sync** — Background Gmail and Calendar sync via Inngest

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS 4, ShadCN UI |
| Data Fetching | SWR |
| Database | PostgreSQL via Prisma 7 + pgvector |
| Auth | Better Auth (email/password + Google OAuth) |
| Email/Calendar | Corsair SDK (`@corsair-dev/gmail`, `@corsair-dev/googlecalendar`) |
| AI | Google Gemini via `@ai-sdk/google` + Vercel AI SDK |
| Background Jobs | Inngest |
| Rich Text Editor | TipTap 3 |
| Email Templates | React Email |
| Deployment | Vercel + Supabase |

---

## Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase, Neon, or local)
- Google Cloud project with Gmail and Calendar APIs enabled
- Corsair account for Gmail/Calendar integration
- Resend account for email sending
- Inngest account for background jobs
- Google AI API key (Gemini)

---

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd relay
pnpm install
```

### 2. Environment variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="<random-secret>"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_API_KEY="<your-key>"

# Email (Resend)
RESEND_API_KEY="<your-key>"
EMAIL_FROM="app@yourdomain.com"
EMAIL_DOMAIN="yourdomain.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Corsair (Gmail + Calendar)
CORSAIR_KEK="<your-kek>"

# Google OAuth
GOOGLE_CLIENT_ID="<your-client-id>"
GOOGLE_CLIENT_SECRET="<your-client-secret>"
GOOGLE_PUBSUB_TOPIC_ID="<your-topic-id>"

# Inngest
INNGEST_EVENT_KEY="<your-key>"
INNGEST_DEV=1

# AI API Keys
CLASSIFY_API_KEY="<your-key>"
COMPOSE_API_KEY="<your-key>"
EMBEDDING_API_KEY="<your-key>"
AGENT_CHAT_API_KEY="<your-key>"
REPLY_GENERATE_API_KEY="<your-key>"
SPELL_SUGGEST_API_KEY="<your-key>"
INLINE_API_KEY="<your-key>"
```

### 3. Database setup

```bash
pnpm prisma generate
pnpm prisma db push
```

### 4. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, register, password reset
│   ├── (onboarding)/        # User onboarding flow
│   ├── dashboard/           # Main app (inbox, calendar, AI, contacts, etc.)
│   ├── api/                 # API routes (AI, emails, calendar, contacts, etc.)
│   └── page.tsx             # Landing page
├── components/
│   ├── landing/             # Marketing landing page
│   ├── dashboard/           # Sidebar, top bar, command palette
│   ├── inbox/               # Email list, thread view, compose, AI reply
│   ├── ai/                  # Agent chat, draft cards, tool calls
│   ├── calendar/            # Calendar views, meeting prep
│   ├── contacts/            # Contact sheet, relationship memory
│   └── ui/                  # ShadCN primitives
├── lib/
│   ├── ai/                  # Classification, embeddings, compose, reply gen
│   ├── auth.ts              # Better Auth server config
│   ├── auth-client.ts       # Better Auth client config
│   ├── contact-tracker.ts   # Contact memory system
│   ├── gmail-cache.ts       # LRU cache for Gmail responses
│   └── workflow-scoring.ts  # Workflow automation scoring
└── inngest/
    └── client.ts            # Inngest client

prisma/
└── schema.prisma            # Database schema (22 models)
```

---

## Architecture

```
┌─────────────────────────────────────┐
│           CLIENT LAYER              │
│  Next.js + Tailwind + ShadCN + SWR  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│     INTEGRATION LAYER (Corsair)     │
│       Gmail API · Calendar API      │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│        INTELLIGENCE LAYER           │
│  AI Classification · Reply Gen ·    │
│  Embeddings · Workflow Learning     │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│        PERSISTENCE LAYER            │
│      PostgreSQL + pgvector          │
└─────────────────────────────────────┘
```

---

## Background Jobs

Inngest runs 12 background functions:

| Function | Schedule | Purpose |
|---|---|---|
| `sync-gmail` | Every 5 min | Incremental Gmail sync |
| `classify-batch` | Event | AI email classification pipeline |
| `sync-calendar` | Every 5 min | Calendar event sync |
| `generate-reply` | Event | AI reply generation |
| `check-follow-ups` | Every 4 hours | Detect unreplied sent emails |
| `generate-daily-brief` | 7:30 AM daily | Morning executive summary |
| `detect-sequences` | Every 6 hours | Find repeated action patterns |
| `suggest-workflows` | Every 6 hours | Generate automation suggestions |
| `update-contact-intelligence` | Every 12 hours | Enrich contact memory |
| `run-automations` | Event | Execute automation rules |

---

## Deployment

### Vercel

```bash
pnpm build
```

Or connect your repository to Vercel for automatic deployments.

### Environment Variables (Production)

Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain.

---

## License

Private — All rights reserved.
