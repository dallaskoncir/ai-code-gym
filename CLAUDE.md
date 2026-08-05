# AI Code Gym

## Purpose

AI Code Gym is a local-first training ground for sharpening two skills that matter in interviews and on the job: **reviewing** other people's code critically, and **implementing** features to spec under scrutiny. Everything runs from your machine — there is no CI pipeline and no dependency on repository secrets — but Review Mode is deliberately true-to-life: a dedicated bot GitHub account opens real PRs and posts real review comments on this repo, via `packages/gym-cli/src/core/github.ts`, so reviewing an exercise feels like reviewing a teammate's PR rather than reading a local file. See [GitHub Bot Workflow](#github-bot-workflow) below.

This repo is a **Turborepo-powered pnpm monorepo** with two kinds of workspace member:

- The **AI Gym CLI** (`packages/gym-cli`) — the `pnpm gym <command>` tool that drives Review Mode and Build Mode.
- A **dummy fintech practice app** (`apps/banking-dashboard` + `packages/ui-kit`) — a Mercury/Affirm-style banking dashboard that exists to give the `feature-writer` agent a realistic, complex React/Next.js codebase to mutate and write buggy "PRs" against, instead of generating a bug-riddled component from scratch every time.

## The Two Modes

### Review Mode
1. `pnpm gym review-new` asks the `feature-writer` agent to write a realistic React + TypeScript component (or mutate one from the fintech app — see below) containing intentional, tier-appropriate bugs, plus a hidden bug manifest. The CLI then commits the exercise file (never the bug manifest — that's the answer key) to a new branch as the `AI Feature Writer` bot, pushes it to `origin`, and opens a PR via the bot's GitHub account.
2. You review the PR on GitHub like a real teammate's code, leaving your comments directly on it.
3. `pnpm gym review-score --pr <number>` fetches your PR comments and the hidden bug manifest, sends both to the `review-critic` agent, which grades your coverage, depth, and tone, writes feedback locally, and has the bot post the grade back as a comment on the PR.

### Build Mode
1. `pnpm gym build-new` asks the `spec-generator` agent to write a feature brief (acceptance criteria, edge cases, component sketch) to `exercises/build-mode/latest-spec.md`.
2. You implement the spec — most realistically inside `apps/banking-dashboard` or `packages/ui-kit`, since that's a real project with real conventions to follow, though any checked-out project works.
3. `pnpm gym build-score` diffs your implementation against a base git ref and sends the diff plus the original spec to the `build-reviewer` agent for senior-engineer-level feedback.

## Difficulty Tiers

| Tier | Description |
|------|-------------|
| 1 | Single isolated bugs (wrong prop type, missing key) |
| 2 | Logic errors requiring React lifecycle / async understanding |
| 3 | Architectural problems (bad abstractions, wrong data flow) |
| 4 | Compound issues across multiple files, with red herrings |

Default tier and topic come from `packages/gym-cli/exercise-config.json`, both overridable per-run with CLI flags.

## Repo Structure

```
ai-code-gym/
├── turbo.json                  # Turborepo pipeline: build (depends on ^build), dev, typecheck, lint
├── pnpm-workspace.yaml         # packages/* + apps/*
├── tsconfig.base.json          # Shared compiler options extended by every workspace member
├── package.json                # Root scripts: dev, build, typecheck, lint, gym
├── packages/
│   ├── gym-cli/                 # @fintech-gym/cli — the "gym" CLI (unchanged behavior, new home)
│   │   ├── agents/               # System prompts for each AI agent
│   │   │   ├── feature-writer/
│   │   │   ├── review-critic/
│   │   │   ├── spec-generator/
│   │   │   └── build-reviewer/
│   │   ├── exercises/            # Generated exercises + your review notes
│   │   ├── feedback/             # Agent evaluations, timestamped + "latest"
│   │   ├── exercise-config.json  # Default difficulty tier, topic, and rubric
│   │   └── src/
│   │       ├── cli.ts             # Commander entry point ("gym"), loads packages/gym-cli/.env
│   │       ├── ai/provider.ts     # Provider factory (Claude / Ollama)
│   │       ├── core/github.ts     # Octokit wrapper: createPR, fetchPRComments, postPRComment
│   │       ├── commands/          # review-new, review-score, build-new, build-score
│   │       └── lib/               # config + agent-prompt loading helpers
│   └── ui-kit/                  # @fintech-gym/ui-kit — shared fintech component library
│       └── src/components/
│           ├── CurrencyInput.tsx   # Controlled money input
│           ├── TransactionRow.tsx  # Merchant / date / amount / status row
│           └── LedgerTable.tsx     # Table of TransactionRows + running balance
├── apps/
│   └── banking-dashboard/       # @fintech-gym/banking-dashboard — Next.js App Router dashboard
│       ├── app/                  # "/" Recent Transactions, "/send" Send Funds
│       ├── components/           # Shell, Header, AccountMenu, NavBalanceBadge, SendFundsForm
│       └── lib/                  # Mock in-memory "backend" (api.ts) + shared types
└── docs/
    └── agents/                  # issue-tracker.md, domain.md
```

## Local CLI Commands

From the repo root, `pnpm gym <command>` (aliased in the root `package.json` to `pnpm --filter @fintech-gym/cli run gym`) runs everything through `tsx packages/gym-cli/src/cli.ts`:

| Command | What it does |
|---|---|
| `pnpm gym review-new [--tier 1-4] [--topic <topic>]` | Generates a new buggy component + hidden bug manifest, commits the component to a new branch as the bot, and opens a GitHub PR for you to review |
| `pnpm gym review-score --pr <number> [--exercise <path>]` | Fetches your review comments from the given PR, grades them against the hidden bug manifest, and posts the grade back as a PR comment |
| `pnpm gym build-new [--tier 1-4] [--topic <topic>]` | Generates a new feature spec |
| `pnpm gym build-score [--repo <path>] [--base <ref>] [--diff <path>] [--spec <path>]` | Diffs your implementation (`git diff <base>` in `--repo`, or a pre-made `--diff` file) against the spec and grades it |

`--tier` and `--topic` fall back to `packages/gym-cli/exercise-config.json` when omitted. `--topic` must be one of `topics_available` in that file.

Other root scripts, backed by Turbo:

| Command | What it does |
|---|---|
| `pnpm build` | `turbo run build` — builds `ui-kit` before `banking-dashboard` (dependency-ordered via `^build`), builds `gym-cli` in parallel |
| `pnpm dev` | `turbo run dev` — runs `next dev` for the dashboard (uncached, persistent) |
| `pnpm typecheck` | `turbo run typecheck` across every workspace member |

## The Fintech Practice App

`apps/banking-dashboard` and `packages/ui-kit` are a deliberately realistic, deliberately imperfect Mercury/Affirm-style app: a "Recent Transactions" overview, a "Send Funds" form, and the shared components that back them (`CurrencyInput`, `TransactionRow`, `LedgerTable`). They exist as a mutation surface — a codebase with real architecture, real package boundaries, and real async/state seams for review-mode exercises to introduce bugs into, instead of every exercise being a bug-riddled component generated in isolation.

The kinds of financial-grade UI bugs this app is built to host (and already contains examples of, as a reference for what "subtle" should look like):

- **Currency precision** — doing money math in floating-point dollars instead of integer cents, so rounding silently drifts by a cent on certain amounts.
- **Accessibility on sensitive actions** — icon-only buttons on money-moving controls with no `aria-label`, status conveyed by color alone with no text alternative.
- **Unnecessary re-renders** — `memo()`-wrapped rows fed a new inline callback identity on every parent render, so the memoization never actually skips anything.
- **Optimistic UI without rollback** — a UI that optimistically renders a "pending" state before an API call resolves, but doesn't revert or surface failure when the server rejects the request, leaving the user believing an action succeeded when it didn't.
- **Prop-drilling sensitive state** — a balance or similar sensitive value threaded through several layers of components that don't use it themselves, in place of a Context.
- **Race conditions in submit handlers** — an async handler guarded by a `useState` boolean instead of a ref, where two rapid submissions can both read the guard as "not in flight" before the first one's state update lands.

When you're doing Build Mode against this app, treat it like a real codebase: match its conventions (Tailwind utility classes, the `Transaction` type from `@fintech-gym/ui-kit`, the mock `lib/api.ts` backend) rather than introducing new patterns.

## AI Provider Configuration

`packages/gym-cli/src/ai/provider.ts` resolves the model via `AI_CODE_GYM_PROVIDER`:

- `AI_CODE_GYM_PROVIDER=claude` (default) — uses Anthropic. Requires `ANTHROPIC_API_KEY`.
- `AI_CODE_GYM_PROVIDER=ollama` — uses a local Ollama server. Reads `OLLAMA_HOST` (defaults to `http://127.0.0.1:11434`); a bare `host:port` value is normalized to `http://host:port`.
- `AI_CODE_GYM_MODEL` overrides the default model ID for whichever provider is active (`claude-sonnet-5` for Claude, `llama3.1` for Ollama).

There is no official `@ai-sdk/ollama` package on npm; this project uses the community `ai-sdk-ollama` provider (compatible with `ai` v7 / `@ai-sdk/provider` v4), the same one already used in the Scrutineer/vsc-style local tooling this project follows.

Example:

```bash
# Claude (default)
export ANTHROPIC_API_KEY=sk-ant-...
pnpm gym review-new

# Local Ollama
export AI_CODE_GYM_PROVIDER=ollama
export OLLAMA_HOST=127.0.0.1:11434
pnpm gym build-new --tier 3 --topic accessibility
```

## GitHub Bot Workflow

Review Mode acts through a dedicated bot GitHub account rather than staying purely local, so a review exercise looks and feels like reviewing a real teammate's PR. `packages/gym-cli/src/core/github.ts` wraps `@octokit/rest` and exports `createPR(branch, title, body)`, `fetchPRComments(prNumber)`, and `postPRComment(prNumber, body)`.

**Env vars** (`packages/gym-cli/.env`, loaded automatically by `src/cli.ts` via `dotenv` — see `.env.example` for a template; never commit `.env`):

| Variable | Purpose |
|---|---|
| `GYM_BOT_GH_TOKEN` | Personal access token for the bot account, scoped to `repo` on `GITHUB_REPO` |
| `GITHUB_OWNER` | Repo owner (your GitHub username) |
| `GITHUB_REPO` | Repo name (`ai-code-gym`) |

**What actually happens on disk and on GitHub:**

- `review-new` writes the exercise + bug manifest locally (as before), then runs `git checkout -b`, commits **only the exercise file** (never the bug manifest, which is the answer key and must not leak into a PR you're about to review) as `AI Feature Writer <gym-bot@ai-code-gym.local>`, `git push`es the branch to `origin`, switches back to your original branch, and calls `github.createPR(...)` to open the PR against `main`.
- `review-score --pr <number>` calls `github.fetchPRComments(prNumber)` to pull your review comments straight from the PR (there is no more local `my-review.md` grading path), grades them against the hidden bug manifest, and calls `github.postPRComment(...)` to post the grade back onto the PR, in addition to writing `feedback/latest-review-evaluation.md` locally.
- Build Mode is unaffected — `build-score` still just runs local `git diff` against whatever `--repo`/`--base` you point it at and does not touch GitHub.

## Notes for Future Changes

- `packages/gym-cli/agents/*/system-prompt.md` and `packages/gym-cli/exercise-config.json` are the source of truth for exercise behavior — prefer editing those over hardcoding prompt text in `packages/gym-cli/src/`.
- Every generated artifact is written both as a timestamped file and as a `latest-*` file, so history isn't clobbered but downstream commands (`review-score`, `build-score`) always have an unambiguous default input.
- `review-new` currently generates a standalone exercise file rather than literally checking out and mutating `apps/banking-dashboard` or `packages/ui-kit` in place — pointing the `feature-writer` agent at those paths as a live mutation target (e.g. writing a diff instead of a fresh file) is the natural next step if you want review-mode exercises to exercise real cross-package review.
- Turbo's `build` task depends on `^build`, so `packages/ui-kit` (and its compiled `dist/`, including `styles.css`) always builds before `apps/banking-dashboard` consumes it.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (`dallaskoncir/ai-code-gym`), managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root (created lazily by `/domain-modeling`). See `docs/agents/domain.md`.
