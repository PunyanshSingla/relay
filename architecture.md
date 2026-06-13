# Relay — Architecture Document

> **Version:** MVP (Hackathon)
> **Last updated:** June 2026

---

## 1. Vision & Guiding Principle

Relay is an AI Chief of Staff. It does not help users manage email — it helps users complete work.

Every architectural decision flows from one principle: **never make the user wait, and never make them think.**

---

## 2. System Layers Overview

```
┌─────────────────────────────────────────────┐
│               CLIENT LAYER                  │
│  Command Center · Inbox · Calendar · Brief  │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│          INTEGRATION LAYER (Corsair)        │
│      Gmail API · Calendar API · Webhooks    │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│            INTELLIGENCE LAYER               │
│  Ranker · Reply Gen · Follow-Up · Memory    │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│             PERSISTENCE LAYER               │
│   PostgreSQL · pgvector · Local Cache       │
└─────────────────────────────────────────────┘
```

---

## 3. Layer-by-Layer Architecture

### 3.1 Client Layer

The frontend is a web app (React or Next.js) with a companion mobile app.

#### Rendering strategy
- **On open (0ms):** Render from local SQLite/IndexedDB cache immediately. User sees real inbox.
- **Background fetch (0–45s):** Stream emails in parallel batches of 10 via Corsair. Each batch renders as it arrives — shimmer skeleton rows fill remaining slots.
- **AI ranking (parallel):** As each batch lands, it enters the AI pipeline. Ranked results animate into position softly. No hard re-sorts; emails drift upward.

#### Key screens
| Screen | Purpose |
|---|---|
| Smart Inbox | Ranked email list, P1/P2/P3 badges, category tags |
| Thread View | Full conversation, AI reply panel inline |
| AI Command Center | Natural language input, Improve/Clarify modes |
| Daily Brief | Morning summary card: emails + meetings + follow-ups |
| Calendar | Day/week view, meeting prep panel |
| Contact Sheet | Relationship memory, interaction history |
| Cmd Palette (Ctrl+K) | Universal action shortcut |

---

### 3.2 Integration Layer — Corsair

Corsair is the abstraction over Gmail and Google Calendar APIs.

#### Gmail capabilities
- Read inbox (paginated, parallel batches)
- Open email / thread view
- Send, reply, forward
- Full-text search
- OAuth token management

#### Calendar capabilities
- Fetch events (daily / weekly)
- Create, update, delete events
- Send invites
- Detect conflicts

#### Realtime sync (Corsair webhooks)
Corsair fires events to a backend listener on:
- `new_email` → triggers inbox update + AI pipeline on that email
- `new_reply` → updates thread view, re-evaluates follow-up status
- `new_event` / `updated_event` → refreshes calendar, rebuilds meeting prep

Webhook events go into a **job queue** (e.g. BullMQ / Inngest). Each job is idempotent — safe to replay.

---

### 3.3 Intelligence Layer

This is the core of Relay. Every AI feature runs here.

#### 3.3.1 Email fetch & progressive streaming

```
Corsair API
    │
    ├── Batch 1 (emails 1–10)   → UI render → AI pipeline
    ├── Batch 2 (emails 11–20)  → UI render → AI pipeline
    ├── ...
    └── Batch N (emails 91–100) → UI render → AI pipeline
```

Batches fire in parallel (up to 3 concurrent). Each batch:
1. Writes raw emails to local cache
2. Triggers AI pipeline (non-blocking)
3. Inserts shimmer → real rows into inbox

**Perceived load time: under 3 seconds for first visible emails.**

---

#### 3.3.2 AI ranking pipeline (per batch)

```
Raw emails (batch)
       │
       ▼
┌─────────────────┐
│ Heuristic filter│  ~0ms, local
│                 │  — VIP sender list
│                 │  — no-reply detection
│                 │  — newsletter headers
│                 │  — promotional patterns
└────────┬────────┘
         │
         ├──── LOW PRIORITY ──→ Low-priority pool (no LLM call)
         │
         ▼
┌─────────────────┐
│  Context inject │  Pull from contact memory:
│                 │  relationship strength, last topic,
│                 │  response pattern, meeting freq
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   LLM ranker (claude-sonnet-4-6)    │
│                                     │
│   Input: email metadata + body      │
│          + contact context          │
│                                     │
│   Output (JSON):                    │
│   {                                 │
│     priority: "P1" | "P2" | "P3",  │
│     category: "important" |         │
│               "needs_reply" |       │
│               "newsletter" |        │
│               "promotion" |         │
│               "social" |            │
│               "meeting_related",    │
│     reason: string,                 │
│     suggested_action: string        │
│   }                                 │
└────────┬────────────────────────────┘
         │
         ▼
  Score store → local DB
  UI animates emails into ranked order
```

**Cost control:** The heuristic filter typically removes 40–60% of emails from the LLM call. Batch LLM calls (up to 10 emails per request) further reduce API calls.

---

#### 3.3.3 AI command center

Three execution modes:

| Mode | Behaviour |
|---|---|
| **Normal** | Parse intent → execute immediately |
| **Improve** | LLM rewrites the prompt with context, shows diff, user confirms |
| **Clarify** | LLM asks follow-up questions before executing |

Intent parsing maps to one of:
- `schedule_meeting` → Calendar API
- `send_email` / `reply_email` → Gmail API
- `search_emails` → Semantic search
- `generate_followup` → Follow-up engine
- `open_contact` → Contact memory

---

#### 3.3.4 AI email reply generator

Triggered from inside any email thread. Generates:

| Mode | Behaviour |
|---|---|
| Short reply | 1–2 sentence acknowledgement |
| Professional reply | Formal, structured |
| Friendly reply | Warm, conversational |
| Generate reply | Best guess given thread context |

Context injected: full thread, contact memory for the sender, any open follow-ups or tasks related to this thread.

---

#### 3.3.5 Follow-up intelligence

A background job runs every 4 hours:

```
For each sent email with no reply:
  If (days_since_sent >= 3) AND (no reply in thread):
    → Create follow-up suggestion
    → Surface in Smart Inbox as "Awaiting response"
    → Add to Daily Brief if P1 contact
```

Actions available:
- Generate follow-up email (pre-drafted)
- Schedule reminder (Calendar event)
- Dismiss

---

#### 3.3.6 Daily brief generator

Runs every morning at a configurable time (default: 7:30 AM local).

```
Inputs:
  - P1 emails from last 24h (unread)
  - Today's calendar events
  - All pending follow-ups
  - Overdue items (follow-ups > 5 days)

LLM prompt:
  Summarise in 3–5 bullet points.
  Identify the single most important action.
  Suggest a reply or action for each item.

Output:
  Daily Brief card rendered at top of inbox
```

---

#### 3.3.7 Meeting intelligence

Triggered when a calendar event is opened (or 30 min before, via notification):

```
For meeting [event]:
  Pull: emails exchanged with all attendees (last 30 days)
  Pull: contact memory for each attendee
  Pull: open tasks / follow-ups related to attendees

LLM generates:
  - Previous discussion summary
  - Open items from last meeting
  - Recent email context
  - 3–5 suggested talking points
```

---

#### 3.3.8 Contact memory

Built passively from email and calendar activity.

Schema per contact:
```json
{
  "email": "sarah@company.com",
  "name": "Sarah Chen",
  "email_count": 24,
  "meeting_count": 5,
  "last_interaction": "2026-06-10",
  "last_topic": "Budget Planning",
  "response_pattern": "replies within 4h on weekdays",
  "preferred_meeting_times": ["10–11 AM", "3–4 PM"],
  "relationship_strength": 0.82,
  "vip": true
}
```

Used by: inbox ranker, reply generator, meeting prep, daily brief, semantic search.

---

#### 3.3.9 Semantic & vector search

Powered by **pgvector** on PostgreSQL.

```
On email ingest:
  → Generate embedding (text-embedding-3-small or similar)
  → Store in pgvector table with email_id

On search query:
  → Embed the query
  → ANN search over email vectors
  → Also search meeting transcripts, contact notes
  → Return top-K results, reranked by recency + contact relevance
```

Example queries this enables:
- "Show sponsorship conversations"
- "Find emails about the hackathon"
- "What did we discuss with investors last month"

---

#### 3.3.10 Workflow learning engine

Monitors repeated manual actions:

```
Track: (action_type, target, user_id)
If same action repeated >= 5 times:
  → Surface automation suggestion
  → "You've forwarded support emails to support@company.com 5 times. Create automation?"
  → Accept → saves rule to automation engine
  → Reject → suppresses for 30 days
```

Automation types:
- Auto-forward by sender/subject pattern
- Auto-label by content
- Auto-create follow-up on send

---

### 3.4 Persistence Layer

#### PostgreSQL (primary store)
| Table | Contents |
|---|---|
| `users` | Auth, preferences, OAuth tokens |
| `emails` | Email metadata, body, thread_id, category, priority |
| `email_embeddings` | pgvector column, linked to emails |
| `contacts` | Relationship memory, VIP flag, stats |
| `calendar_events` | Event metadata, attendees, meeting prep cache |
| `follow_ups` | Tracked threads, status, due date |
| `automations` | Learned + accepted workflow rules |
| `workflow_score` | Metrics: emails automated, time saved |

#### pgvector
- Extension on the same PostgreSQL instance
- Tables: `email_embeddings`, `meeting_embeddings`, `contact_embeddings`
- Index type: IVFFlat or HNSW depending on corpus size

#### Local cache (client)
- **SQLite** (desktop/mobile) or **IndexedDB** (web)
- Stores: last 500 emails, contact memory, ranking scores
- Purpose: instant inbox on open, offline read access
- Sync strategy: optimistic write, background reconcile

#### Session / auth store
- **Redis** or **Supabase Auth** for session tokens
- OAuth tokens encrypted at rest, refreshed via Corsair

---

## 4. Key Architectural Decisions

### Why progressive streaming instead of full fetch?
Gmail's batch API takes 34–45s for 100 emails. Streaming in batches of 10 gives users visible, interactive emails in under 3 seconds. The 45s still happens — users just never feel it.

### Why heuristic filter before LLM?
LLM calls are expensive and add latency. Filtering ~50% of emails with deterministic rules (no-reply headers, known newsletter domains, Gmail category labels) means the LLM only processes emails that have a chance of being important. This roughly halves cost and latency.

### Why run AI per batch, not after full fetch?
Users can start reading batch 1 while batches 2–10 are loading. If AI ranking waits for the full 100-email fetch, users are blocked for 45s. Running per batch means the inbox is usefully ranked within 5–10 seconds of open.

### Why local cache + optimistic render?
Perceived performance is what matters, not actual performance. A cached render that updates in the background feels faster than a blank screen that eventually loads perfectly.

### Why pgvector over a separate vector DB (Pinecone, Weaviate)?
For an MVP, keeping vectors in PostgreSQL reduces infrastructure complexity. pgvector performs well up to ~1M vectors. If Relay scales to millions of emails per user, a dedicated vector DB becomes the right call.

---

## 5. Data Flow Summary

```
User opens Relay
    │
    ├── [0ms]     Render local cache → user sees inbox immediately
    │
    ├── [0–5s]    Corsair batch 1 arrives → render + AI pipeline starts
    │
    ├── [5–15s]   Batches 2–4 arrive → inbox fills in, emails rank upward
    │
    ├── [15–45s]  Remaining batches complete in background
    │
    └── [Any time] Webhooks fire for new email/event → single-item pipeline
```

---

## 6. MVP Tech Stack Recommendation

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + Tailwind |
| Backend | Node.js + Express or Hono |
| AI | Anthropic API (claude-sonnet-4-6) |
| Email/Calendar | Corsair (Gmail + GCal abstraction) |
| Database | PostgreSQL + pgvector (Supabase or Railway) |
| Job queue | Inngest or BullMQ |
| Local cache | IndexedDB (web), SQLite (native) |
| Auth | Supabase Auth or NextAuth |
| Realtime | Corsair webhooks → backend → SSE to client |

---

## 7. Feature → Architecture Mapping

| Feature | Depends on |
|---|---|
| Smart inbox | Progressive fetch + LLM ranker + heuristic filter |
| AI command center | Intent parser + Gmail/Calendar APIs |
| Daily brief | LLM summariser + score store + calendar events |
| AI email reply | Reply generator + contact memory + thread context |
| Follow-up intelligence | Background job + sent email tracker |
| Meeting intelligence | Calendar events + LLM + contact memory |
| Contact memory | Passive tracker on all email/calendar activity |
| Semantic search | pgvector + embedding pipeline |
| Workflow learning | Action tracker + pattern detector + automation engine |
| Realtime sync | Corsair webhooks + job queue |

---

## 8. Phase 2 / Advanced Features (Post-MVP)

- **AI Chief of Staff mode:** Goal-driven multi-step workflows ("Get sponsorship from Company X")
- **Relationship memory:** Cross-contact pattern detection, preferred communication times
- **Workflow score dashboard:** Quantify time saved per week
- **Voice command center:** Speak to Relay, get back structured actions
- **Mobile push:** Notify on P1 email arrival, upcoming meeting brief
