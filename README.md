# 🏋️ AI Code Gym

A bidirectional AI-powered training ground for sharpening **code review** and **implementation** skills — built for interview prep and real-world engineering confidence.

## How It Works

### 🔍 Review Mode
1. An AI agent writes a realistic frontend feature with intentional, plausible bugs
2. A PR is opened automatically — you review it like a real engineer
3. A second AI agent critiques your review: coverage, depth, and tone

### 🏗️ Build Mode
1. An AI agent generates a feature spec (acceptance criteria, edge cases, component sketch)
2. You implement it and open a PR against a clean base branch
3. The AI reviews your code with senior-engineer-level feedback

## Difficulty Tiers

| Tier | Description |
|------|-------------|
| 1 | Single isolated bugs (wrong prop type, missing key) |
| 2 | Logic errors requiring React lifecycle / async understanding |
| 3 | Architectural problems (bad abstractions, wrong data flow) |
| 4 | Compound issues across multiple files, with red herrings |

## Repo Structure

A Turborepo-powered pnpm monorepo — the gym CLI, plus a dummy fintech app used as a realistic mutation target for exercises. See [CLAUDE.md](CLAUDE.md) for the full breakdown.

```
ai-code-gym/
├── turbo.json
├── pnpm-workspace.yaml
├── packages/
│   ├── gym-cli/           # The `gym` CLI — agents/, exercises/, feedback/, src/
│   └── ui-kit/            # Shared fintech components (CurrencyInput, TransactionRow, LedgerTable)
├── apps/
│   └── banking-dashboard/ # Next.js fintech dashboard consuming ui-kit
└── README.md
```

## Tech Stack

- **Runtime**: Turborepo + pnpm workspaces, CLI built with Commander + tsx, run with `pnpm gym <command>`
- **AI**: Vercel AI SDK — Claude (Anthropic) or a local Ollama model, your choice
- **Frontend exercises**: React + TypeScript, Next.js App Router, Tailwind CSS

## Getting Started

```bash
pnpm install

# Claude (default) — requires an API key
export ANTHROPIC_API_KEY=sk-ant-...

# or run fully locally against Ollama instead
export AI_CODE_GYM_PROVIDER=ollama

pnpm gym review-new      # generate a buggy component to review
pnpm gym review-score    # grade the review you wrote in exercises/review-mode/my-review.md

pnpm gym build-new       # generate a feature spec to implement
pnpm gym build-score     # grade your implementation (git diff against a base ref)
```

See [CLAUDE.md](CLAUDE.md) for the full command reference and provider configuration.

## Goals

- Build confidence in code review as a senior engineering skill
- Practice giving constructive, precise, and thorough PR feedback
- Sharpen frontend implementation instincts under spec-driven constraints
- Create a visible, public track record of engineering growth
