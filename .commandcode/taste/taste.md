# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/


# ai
- Use Google Gemini SDK directly (gemini-2.5-flash), not OpenRouter, for AI email classification. Confidence: 0.85
- Background AI processing must never block the user — all classification runs async via Inngest jobs. Confidence: 0.70

# ai
- Do not use Gmail category labels (CATEGORY_PROMOTIONS, CATEGORY_UPDATES, etc.) as heuristics for email classification — rely on AI instead. Confidence: 0.85

# webhooks
- Do not add webhook handlers — they have been tried and don't work. Confidence: 0.85

# prisma
- When using prisma.$queryRawUnsafe, use actual database table names (check schema) rather than Prisma model names. Confidence: 0.65

# classification
- Classify up to 100 emails per batch run (not 50). Confidence: 0.70

# docs
- Don't web search for SDK/API docs for proprietary libraries (e.g., Corsair) — ask the user or use docs they provide instead. Confidence: 0.65

# dashboard
- When building new dashboard pages, match the existing UI and design system of all other pages for consistency. Confidence: 0.70

# workflow
- Plan UI features completely before implementing them — present the plan for approval first. Confidence: 0.65

# package-manager
- Use pnpm for package management (user will install dependencies themselves). Confidence: 0.85

