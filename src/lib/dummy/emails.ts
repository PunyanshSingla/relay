import type { Email } from "@/types/email";

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

export const dummyEmails: Email[] = [
  {
    id: "1",
    from: { name: "Alex Johnson", email: "alex@relay.ai" },
    to: [{ name: "You", email: "user@relay.ai" }],
    subject: "Q2 Planning - Action Required",
    preview: "Hey, we need to finalize the Q2 roadmap by Friday. Can you review the attached priorities and provide your input on the engineering bandwidth?",
    body: `Hey team,

We need to finalize the Q2 roadmap by Friday. The board meeting is on Monday and I want to present a clear plan.

Here's what I need from you:
1. Review the attached priorities document
2. Provide your input on engineering bandwidth
3. Flag any blockers that might affect delivery

The key initiatives for Q2 are:
- Email intelligence pipeline (P1)
- Calendar integration improvements (P2)
- Mobile app launch (P1)
- Performance optimization (P3)

Please review and reply by EOD Thursday.

Thanks,
Alex`,
    timestamp: minutesAgo(2),
    read: false,
    starred: true,
    priority: "P1",
    category: "action_needed",
    labels: ["roadmap", "q2"],
    hasAttachment: true,
    attachments: [],
    threadId: "t1",
    replies: [
      {
        id: "r1",
        from: { name: "You", email: "user@relay.ai" },
        body: "Thanks Alex, I'll review this today and get back to you by tomorrow morning.",
        timestamp: minutesAgo(1),
      },
    ],
    isClassified: true,
  },
  {
    id: "2",
    from: { name: "Sarah Chen", email: "sarah@partnership.dev" },
    to: [{ name: "You", email: "user@relay.ai" }],
    subject: "Awaiting response: Sponsorship proposal",
    preview: "Hi, I sent over the sponsorship proposal last week. Have you had a chance to review it? We're looking to finalize by end of month.",
    body: `Hi there,

I sent over the sponsorship proposal last week. Have you had a chance to review it?

We're looking to finalize partnerships by end of month. The proposal includes:
- Title sponsorship for the hackathon ($10K)
- Logo placement on all materials
- Booth space at the event
- Social media mentions

Let me know if you have any questions or need adjustments.

Best,
Sarah`,
    timestamp: minutesAgo(15),
    read: false,
    starred: false,
    priority: "P1",
    category: "follow_up",
    labels: ["sponsorship"],
    hasAttachment: false,
    attachments: [],
    threadId: "t2",
    replies: [],
    isClassified: true,
  },
  {
    id: "3",
    from: { name: "Mike Peters", email: "mike@relay.ai" },
    to: [{ name: "You", email: "user@relay.ai" }],
    cc: [{ name: "Design Team", email: "design@relay.ai" }],
    subject: "Design Review Tomorrow",
    preview: "Just a reminder that we have the design review tomorrow at 2 PM. Please come prepared with your feedback on the new dashboard mockups.",
    body: `Hi team,

Just a reminder that we have the design review tomorrow at 2 PM in the main conference room.

Please come prepared with your feedback on:
1. New dashboard mockups (Figma link attached)
2. Mobile responsive designs
3. Dark mode color palette

If you can't make it, please submit your feedback via the Figma comments by EOD tomorrow.

Thanks,
Mike`,
    timestamp: minutesAgo(45),
    read: false,
    starred: false,
    priority: "P2",
    category: "meeting",
    labels: ["design"],
    hasAttachment: true,
    attachments: [],
    threadId: "t3",
    replies: [],
    isClassified: true,
  },
  {
    id: "4",
    from: { name: "Dev Team", email: "dev@relay.ai" },
    to: [{ name: "You", email: "user@relay.ai" }],
    subject: "Re: API Integration Status",
    preview: "The Corsair API integration is 80% complete. We've finished the Gmail endpoints and are now working on Calendar. Expected completion by Thursday.",
    body: `Hi,

Quick update on the API integration status:

COMPLETED:
✅ Gmail read endpoints
✅ Gmail send/reply endpoints
✅ OAuth token refresh
✅ Webhook setup for new emails

IN PROGRESS:
🔄 Calendar read endpoints (80%)
🔄 Event creation API
🔄 Webhook for calendar events

EXPECTED COMPLETION: Thursday EOD

Let me know if you need any changes to the API structure.

- Dev Team`,
    timestamp: minutesAgo(120),
    read: true,
    starred: false,
    priority: "P2",
    category: "action_needed",
    labels: ["api", "corsair"],
    hasAttachment: false,
    attachments: [],
    threadId: "t4",
    replies: [
      {
        id: "r4",
        from: { name: "You", email: "user@relay.ai" },
        body: "Great progress! Can you also add support for batch email fetching? We need to load emails in parallel batches of 10.",
        timestamp: minutesAgo(110),
      },
    ],
    isClassified: true,
  },
  {
    id: "5",
    from: { name: "Ops Bot", email: "ops@relay.ai" },
    to: [{ name: "You", email: "user@relay.ai" }],
    subject: "Urgent: Production Issue Detected",
    preview: "Alert: High error rate detected on /api/auth endpoint. Error rate jumped from 0.1% to 2.3% in the last 15 minutes. Investigation needed.",
    body: `🚨 PRODUCTION ALERT

Service: relay-api
Endpoint: /api/auth
Error Rate: 2.3% (threshold: 1%)
Time: ${new Date().toISOString()}
Duration: 15 minutes

Symptoms:
- High error rate on /api/auth
- Response time increased to 2.5s (normal: 200ms)
- Possible database connection pool exhaustion

Action Required:
1. Check database connection pool
2. Review recent deployments
3. Scale if needed

Dashboard: https://monitoring.relay.ai/services/relay-api`,
    timestamp: minutesAgo(180),
    read: false,
    starred: true,
    priority: "P1",
    category: "action_needed",
    labels: ["urgent", "production"],
    hasAttachment: false,
    attachments: [],
    threadId: "t5",
    replies: [],
    isClassified: true,
  },
  {
    id: "6",
    from: { name: "Finance", email: "finance@relay.ai" },
    to: [{ name: "You", email: "user@relay.ai" }],
    subject: "Invoice #1234 pending approval",
    preview: "Hi, invoice #1234 for the Vercel Pro plan ($200/month) is pending your approval. Please review and approve by end of week.",
    body: `Hi,

Invoice #1234 is pending your approval:

Invoice: #1234
Vendor: Vercel Inc.
Amount: $200.00
Period: Monthly (Pro Plan)
Due Date: End of week

Please review and approve in the billing portal.

Thanks,
Finance Team`,
    timestamp: hoursAgo(4),
    read: true,
    starred: false,
    priority: "P2",
    category: "follow_up",
    labels: ["finance", "invoice"],
    hasAttachment: true,
    attachments: [],
    threadId: "t6",
    replies: [],
    isClassified: true,
  },
  {
    id: "7",
    from: { name: "GitHub", email: "noreply@github.com" },
    to: [{ name: "You", email: "user@relay.ai" }],
    subject: "Weekly Engineering Digest",
    preview: "This week: 23 commits, 5 PRs merged, 2 issues closed. Top contributors: @alex, @sarah, @mike. Repository health: Excellent.",
    body: `📊 Weekly Engineering Digest

Repository: relay/relay
Period: ${new Date().toLocaleDateString()}

STATS:
- Commits: 23
- PRs Merged: 5
- Issues Closed: 2
- New Contributors: 1

TOP CONTRIBUTORS:
1. @alex - 8 commits
2. @sarah - 6 commits
3. @mike - 5 commits

REPOSITORY HEALTH:
- Build Status: ✅ Passing
- Test Coverage: 87%
- Open Issues: 12
- PR Review Time: 1.2 days avg

Keep up the great work! 🎉`,
    timestamp: hoursAgo(5),
    read: true,
    starred: false,
    priority: "P3",
    category: "fyi",
    labels: ["github", "weekly"],
    hasAttachment: false,
    attachments: [],
    threadId: "t7",
    replies: [],
    isClassified: true,
  },
  {
    id: "8",
    from: { name: "Product Hunt", email: "hello@producthunt.com" },
    to: [{ name: "You", email: "user@relay.ai" }],
    subject: "Product Hunt Launch Checklist",
    preview: "Your launch is in 3 days! Here's your checklist: Prepare your tagline, create a demo video, set up your maker comment, and draft your first comment.",
    body: `🚀 Launch Checklist

Your product launch is in 3 days!

TODO:
□ Prepare your tagline (30 words max)
□ Create a 60-second demo video
□ Set up your maker profile
□ Draft your first comment
□ Prepare social media posts
□ Line up 5 supporters for day-one upvotes

TIMELINE:
- Today: Finalize all assets
- Tomorrow: Test everything
- Day after: LAUNCH DAY!

Tips:
- Launch at 12:01 AM PST
- Post on Twitter/X immediately
- Engage with every comment
- Share in relevant communities

Good luck! 🍀`,
    timestamp: hoursAgo(6),
    read: true,
    starred: false,
    priority: "P3",
    category: "newsletter",
    labels: ["product-hunt"],
    hasAttachment: false,
    attachments: [],
    threadId: "t8",
    replies: [],
    isClassified: true,
  },
  {
    id: "9",
    from: { name: "Manager", email: "manager@relay.ai" },
    to: [{ name: "You", email: "user@relay.ai" }],
    subject: "1:1 Rescheduled to Friday",
    preview: "Hi, I need to reschedule our 1:1 from Wednesday to Friday at 3 PM. I have a conflict with the board meeting. Let me know if that works.",
    body: `Hi,

I need to reschedule our 1:1 from Wednesday to Friday at 3 PM.

Reason: Board meeting conflict

Agenda for Friday:
- Sprint review
- Career development discussion
- Q2 goal setting
- Any blockers you're facing

Let me know if the new time works for you.

Thanks`,
    timestamp: hoursAgo(8),
    read: true,
    starred: false,
    priority: "P2",
    category: "meeting",
    labels: ["1:1"],
    hasAttachment: false,
    attachments: [],
    threadId: "t9",
    replies: [
      {
        id: "r9",
        from: { name: "You", email: "user@relay.ai" },
        body: "Friday at 3 PM works for me. See you then!",
        timestamp: hoursAgo(7),
      },
    ],
    isClassified: true,
  },
  {
    id: "10",
    from: { name: "LinkedIn", email: "notifications@linkedin.com" },
    to: [{ name: "You", email: "user@relay.ai" }],
    subject: "You were mentioned in a post",
    preview: "Alex Johnson mentioned you in a post: 'Excited to announce our new AI-powered inbox management tool built with @you and the team!'",
    body: `You were mentioned in a post

Alex Johnson wrote:

"Excited to announce our new AI-powered inbox management tool built with @you and the team! 🚀

After months of development, we're finally ready to show the world what we've been building. The future of email is here.

#AI #Email #Startup #Hackathon"

12 likes · 3 comments · 2 shares

View post on LinkedIn →`,
    timestamp: daysAgo(1),
    read: true,
    starred: false,
    priority: "P3",
    category: "social",
    labels: ["linkedin"],
    hasAttachment: false,
    attachments: [],
    threadId: "t10",
    replies: [],
    isClassified: true,
  },
];
