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

```
ai-code-gym/
├── .github/
│   └── workflows/         # CI to trigger agents and validate PRs
├── exercises/
│   ├── review-mode/       # AI-generated PRs awaiting your review
│   └── build-mode/        # Specs awaiting your implementation
├── agents/
│   ├── feature-writer/    # Prompts: writes buggy code
│   ├── review-critic/     # Prompts: evaluates your review
│   └── spec-generator/    # Prompts: writes feature briefs
├── feedback/              # Stored agent critiques of your work
├── exercise-config.json   # Difficulty and topic configuration
└── README.md
```

## Tech Stack

- **Orchestration**: GitHub Actions
- **AI**: Claude Sonnet (via Anthropic API) for feature writer, review critic, build reviewer
- **Local Option**: Ollama (Qwen) for spec generation
- **Frontend exercises**: React + TypeScript

## Getting Started

1. Add your `ANTHROPIC_API_KEY` to GitHub repository secrets
2. Edit `exercise-config.json` to set your desired difficulty tier and topic
3. Trigger the `generate-review-exercise` workflow manually to get your first PR
4. Review it, then trigger `evaluate-my-review` for feedback

## Goals

- Build confidence in code review as a senior engineering skill
- Practice giving constructive, precise, and thorough PR feedback
- Sharpen frontend implementation instincts under spec-driven constraints
- Create a visible, public track record of engineering growth
