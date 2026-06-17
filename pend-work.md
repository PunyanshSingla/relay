# Pending Work — Prioritized

Based on `features.md` (spec) and `pending-work.md` (known issues), cross-referenced with current codebase state.

---

## P0 — Critical (Ship Blockers)

- [ ] **Email sync background jobs unreliable** — Inngest sync-gmail and sync-calendar jobs fail silently. Need to add proper error recovery, retry logic, and monitoring. Jobs should check if new emails exist by comparing fetched IDs against current DB, fetch only new ones, then classify.
- [ ] **Fix bugs across the app** — Run full manual testing pass. Log and fix every broken flow: compose, reply, follow-ups, calendar, contacts, search.

---

## P1 — High Priority (Core Experience)

- [ ] **Email streaming to UI not implemented** — Emails render from cache but there's no live streaming/SSE for new emails arriving. Background sync writes to DB but the inbox doesn't update in real-time. Need to push new email events to the client.
- [ ] **Cache layer broken** — `src/lib/gmail-cache.ts` exists but isn't reliably used. Inbox loads inconsistently. Need to ensure cache is always populated on load and invalidated correctly after sync.
- [ ] **Manual refresh doesn't check for new emails** — Pull-to-refresh / refresh button should trigger a sync check, compare email IDs, fetch and classify any new ones, then update the list.
- [ ] **Calendar integration incomplete** — Create/update event flows have gaps. Event editing, conflict detection, and attendee management need work. Sync-calendar was crashing when Google Calendar wasn't connected (fixed, but full flow needs testing).
- [ ] **Improve AI Command Center** — Better system prompts (smarter context extraction), Review vs Auto-Send mode toggle, streaming email body into TipTap editor, expandable tool call results, message regenerate/edit. (Partially done this session — verify end-to-end.)

---

## P2 — Medium Priority (Quality & Polish)

- [ ] **Migrate from SWR to TanStack Query** — Current hooks (`use-emails.ts`, `use-chat.ts`) use SWR. Migrate to `@tanstack/react-query` for better caching, invalidation, and optimistic updates. Use everywhere consistently.
- [ ] **Daily Brief UI** — Backend exists (`brief-generator.ts`, Inngest job, API endpoint). Need a dashboard page to display the morning brief with emails, meetings, follow-ups, and overdue tasks.
- [ ] **Code quality pass** — Extract shared logic, remove duplication, ensure consistent error handling, add proper TypeScript types where `any` is used.
- [ ] **Relationship memory improvements** — Contact model exists with tracking fields. Need to surface relationship insights in the UI (contact detail page showing interaction history, topics, response patterns).
- [ ] **Progressive inbox loading polish** — Skeleton states exist but the progressive load flow needs testing and refinement. Ensure P1/P2/P3 classification happens in background without blocking render.

---

## P3 — Low Priority (Nice to Have)

- [ ] **Workflow learning refinements** — Pattern detection exists (`detect-workflow-patterns.ts`). Needs UI for users to see and accept/decline suggested automations.
- [ ] **Follow-up intelligence polish** — Detection works. Need better UX for dismissing, acting on, and snoozing follow-ups.
- [ ] **Command palette expansion** — Works for navigation. Add more actions: quick compose templates, label management, batch operations.
- [ ] **Deployment** — Set up Vercel deployment with proper env vars, database migrations, and cron jobs.
- [ ] **Testing** — Add unit tests for AI prompts, classifier, and tools. Add integration tests for API routes. Add E2E tests for critical flows.

---

## Already Complete (This Session)

- [x] AI Command Center — smarter prompts, Review/Auto-Send mode, streaming body into TipTap, expandable tool results, message regenerate/edit, DraftCard fixes
- [x] Signout — fix corsair account deletion order (children before parents)
- [x] Calendar sync — guard against auth-missing when Google Calendar not connected
