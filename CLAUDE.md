# AI Code Gym

## Purpose

AI Code Gym is a local-first training ground for sharpening two skills that matter in interviews and on the job: **reviewing** other people's code critically, and **implementing** features to spec under scrutiny. It runs entirely on your machine as a TypeScript CLI — there is no CI pipeline, no GitHub App, and no dependency on repository secrets. Everything an exercise needs (prompts, config, generated artifacts, feedback) lives in this working directory.

This repo used to be GitHub Actions-centric: workflows triggered scripts that opened real PRs and posted bot comments. That coupling has been removed. The AI calls, file generation, and scoring all happen locally via `pnpm gym <command>`, the same way a tool like Scrutineer runs against your own machine instead of a hosted pipeline.

## The Two Modes

### Review Mode
1. `pnpm gym review-new` asks the `feature-writer` agent to write a realistic React + TypeScript component containing intentional, tier-appropriate bugs, plus a hidden bug manifest.
2. You open `exercises/review-mode/latest-exercise.tsx`, read it like a real PR, and write your review comments into `exercises/review-mode/my-review.md` (a template is scaffolded for you).
3. `pnpm gym review-score` sends your review notes and the hidden bug manifest to the `review-critic` agent, which grades your coverage, depth, and tone, and writes feedback locally.

### Build Mode
1. `pnpm gym build-new` asks the `spec-generator` agent to write a feature brief (acceptance criteria, edge cases, component sketch) to `exercises/build-mode/latest-spec.md`.
2. You implement the spec in a real project (this repo or, more realistically, a separate scratch React app you already have checked out).
3. `pnpm gym build-score` diffs your implementation against a base git ref and sends the diff plus the original spec to the `build-reviewer` agent for senior-engineer-level feedback.

## Difficulty Tiers

| Tier | Description |
|------|-------------|
| 1 | Single isolated bugs (wrong prop type, missing key) |
| 2 | Logic errors requiring React lifecycle / async understanding |
| 3 | Architectural problems (bad abstractions, wrong data flow) |
| 4 | Compound issues across multiple files, with red herrings |

Default tier and topic come from `exercise-config.json` at the repo root; both can be overridden per-run with CLI flags.

## Repo Structure

```
ai-code-gym/
├── agents/                    # System prompts for each AI agent (untouched by the refactor)
│   ├── feature-writer/        # Writes buggy review-mode components
│   ├── review-critic/         # Grades your review of a review-mode exercise
│   ├── spec-generator/        # Writes build-mode feature specs
│   └── build-reviewer/        # Grades your build-mode implementation
├── exercises/
│   ├── review-mode/           # Generated exercises + your review notes
│   └── build-mode/            # Generated specs
├── feedback/                  # Agent evaluations, timestamped + "latest"
├── exercise-config.json       # Default difficulty tier, topic, and rubric
├── src/
│   ├── cli.ts                 # Commander entry point ("gym")
│   ├── ai/provider.ts         # Provider factory (Claude / Ollama)
│   ├── commands/               # review-new, review-score, build-new, build-score
│   └── lib/                   # config + agent-prompt loading helpers
└── package.json
```

## Local CLI Commands

Run everything through the `gym` script (`pnpm gym <command>`, backed by `tsx src/cli.ts`):

| Command | What it does |
|---|---|
| `pnpm gym review-new [--tier 1-4] [--topic <topic>]` | Generates a new buggy component + hidden bug manifest + a `my-review.md` template |
| `pnpm gym review-score [--review <path>] [--exercise <path>]` | Grades your review notes against the hidden bug manifest |
| `pnpm gym build-new [--tier 1-4] [--topic <topic>]` | Generates a new feature spec |
| `pnpm gym build-score [--repo <path>] [--base <ref>] [--diff <path>] [--spec <path>]` | Diffs your implementation (`git diff <base>` in `--repo`, or a pre-made `--diff` file) against the spec and grades it |

`--tier` and `--topic` fall back to `exercise-config.json` when omitted. `--topic` must be one of `topics_available` in that file.

## AI Provider Configuration

`src/ai/provider.ts` resolves the model via `AI_CODE_GYM_PROVIDER`:

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

## Notes for Future Changes

- `agents/*/system-prompt.md` and `exercise-config.json` are the source of truth for exercise behavior — prefer editing those over hardcoding prompt text in `src/`.
- Every generated artifact is written both as a timestamped file and as a `latest-*` file, so history isn't clobbered but downstream commands (`review-score`, `build-score`) always have an unambiguous default input.
- Nothing in `src/` talks to GitHub. `build-score` uses local `git diff` against whatever `--repo`/`--base` you point it at — it does not assume this repo is the one being implemented in.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (`dallaskoncir/ai-code-gym`), managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root (created lazily by `/domain-modeling`). See `docs/agents/domain.md`.
