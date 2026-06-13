# Helm - Feature Specification

## Vision

Helm is an AI Chief of Staff for Gmail and Google Calendar.

Traditional email clients help users manage messages.

Helm helps users complete work.

By combining Gmail, Google Calendar, AI workflows, relationship memory, and intelligent automation, Helm transforms email and calendar from communication tools into an execution platform.

---

# Core Philosophy

### Never Make Users Wait

Helm is built around progressive loading and background intelligence.

Users should never wait for:

* Inbox loading
* Email ranking
* AI analysis
* Search results
* Calendar updates

Everything happens progressively and intelligently in the background.

---

# MVP Features

## 1. Smart Inbox

A priority-first inbox powered by AI.

Instead of sorting emails by time, Helm sorts emails by importance.

### Features

* P1 (Critical)
* P2 (Important)
* P3 (Low Priority)

### AI Categories

* Action Needed
* Meeting Related
* Follow Up
* FYI
* Newsletter
* Promotion
* Social

### Benefits

Users immediately know what deserves attention.

---

## 2. Progressive Inbox Loading

Helm renders emails instantly.

### Features

* Local cache rendering
* Skeleton loading states
* Progressive email streaming
* Background ranking

### Benefits

No waiting for Gmail synchronization.

---

## 3. AI Command Center

A natural-language control center for Gmail and Calendar.

### Example Commands

```text
Schedule a meeting with Rahul tomorrow at 5 PM

Email Sarah and ask for the latest proposal

Show emails about sponsorship

Find all unread emails from last week
```

### Supported Actions

* Send Email
* Reply Email
* Create Event
* Update Event
* Search Emails
* Search Events
* Open Contacts

---

## 4. AI Email Reply Generator

Generate responses directly inside email threads.

### Modes

* Short Reply
* Professional Reply
* Friendly Reply
* Custom Prompt

### Context Used

* Entire thread history
* Sender information
* Previous interactions

---

## 5. Meeting Intelligence

Prepare for meetings automatically.

### Generated Information

* Meeting Summary
* Recent Email Context
* Previous Discussions
* Open Action Items
* Suggested Talking Points

### Benefits

Users enter meetings fully prepared.

---

## 6. Daily Brief

An AI-generated morning summary.

### Includes

* Important Emails
* Today's Meetings
* Pending Follow Ups
* Overdue Tasks

### Output

A concise executive summary generated every morning.

---

## 7. Relationship Memory

Builds contextual knowledge about contacts.

### Tracks

* Interaction History
* Email Frequency
* Meeting Frequency
* Recent Topics
* Response Patterns

### Benefits

Improves email replies and meeting preparation.

---

## 8. Semantic Search

Search using natural language instead of keywords.

### Examples

```text
Show sponsorship conversations

Find investor discussions

Emails about the hackathon

Last discussion with John regarding funding
```

### Technology

* Vector Search
* Embeddings
* PostgreSQL + pgvector

---

## 9. Realtime Sync

Powered by Corsair Webhooks.

### Events

* New Email
* New Reply
* New Calendar Event
* Event Updates

### Benefits

No manual refresh required.

---

## 10. Gmail Integration

Powered by Corsair.

### Features

* Read Emails
* View Threads
* Send Emails
* Reply Emails
* Search Emails

---

## 11. Google Calendar Integration

Powered by Corsair.

### Features

* View Events
* Create Events
* Update Events
* Manage Invites
* Detect Scheduling Conflicts

---

## 12. MCP Agent Chat

An AI assistant capable of taking actions across Gmail and Calendar.

### Example

```text
Schedule a meeting with friend@company.com next Thursday at 9 AM.

Send them an email saying I look forward to our discussion.
```

### Agent Actions

* Create Calendar Events
* Send Emails
* Search Emails
* Search Calendar
* Draft Responses

---

## 13. Command Palette

Keyboard-first productivity interface.

### Shortcut

```text
Ctrl + K
```

### Actions

* Search Anything
* Open Inbox
* Create Event
* Compose Email
* Ask AI
* Open Contacts

---

# Bonus Features

## Workflow Learning

Observe repetitive actions and suggest automations.

Example:

```text
You have forwarded support emails 5 times.

Create an automation?
```

---

## Follow-Up Intelligence

Automatically identify unanswered conversations.

### Features

* Follow-up Suggestions
* Reminder Creation
* AI Generated Follow-up Emails

---

# User Flow

```text
User Opens Helm
        ↓
Instant Inbox Render
        ↓
Background Gmail Sync
        ↓
AI Ranking Begins
        ↓
Priority Inbox Appears
        ↓
User Executes Actions via AI Command Center
        ↓
Meetings, Emails and Follow-Ups Managed Automatically
```

---

# Hackathon Differentiator

Most Gmail clients help users manage communication.

Helm helps users complete work.

Instead of focusing on email management, Helm acts as an AI Chief of Staff that prioritizes, prepares, summarizes, drafts, schedules, and executes actions on behalf of the user.

This creates a significantly faster workflow than traditional Gmail and Calendar experiences.
