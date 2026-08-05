import type { Command } from "commander";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { generateText } from "ai";
import { getProvider } from "../ai/provider.js";
import { readAgentPrompt } from "../lib/agents.js";
import { timestampSlug, writeTimestampedAndLatest } from "../lib/artifacts.js";

/** The directory the top-level `pnpm gym` was invoked from. `pnpm --filter <pkg> run <script>`
 * runs with cwd set to <pkg>'s directory, so process.cwd() alone can't recover it. */
const invocationCwd = process.env.INIT_CWD ?? process.cwd();

const BUILD_MODE_DIR = "exercises/build-mode";
const FEEDBACK_DIR = "feedback";

function getGitDiff(repo: string, base: string): string {
  const result = spawnSync("git", ["diff", base], { cwd: repo, encoding: "utf-8" });
  if (result.error) {
    throw new Error(`ai-code-gym: failed to run git in ${repo}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`ai-code-gym: "git diff ${base}" failed in ${repo}:\n${result.stderr}`);
  }
  return result.stdout;
}

export function registerBuildScore(program: Command): void {
  program
    .command("build-score")
    .description("Score your implementation of the latest Build Mode spec")
    .option("--repo <path>", "path to the repo containing your implementation", invocationCwd)
    .option("--base <ref>", "git ref to diff your implementation against", "main")
    .option("--diff <path>", "path to a pre-generated diff file (skips git)")
    .option("--spec <path>", "path to the feature spec", path.join(BUILD_MODE_DIR, "latest-spec.md"))
    .action(async (opts: { repo: string; base: string; diff?: string; spec: string }) => {
      const systemPrompt = readAgentPrompt("build-reviewer");
      const { name: providerName, model } = getProvider();

      const spec = await readFile(opts.spec, "utf-8").catch(() => {
        throw new Error(`ai-code-gym: no spec found at ${opts.spec} — run "pnpm gym build-new" first.`);
      });

      const diff = opts.diff ? await readFile(opts.diff, "utf-8") : getGitDiff(path.resolve(opts.repo), opts.base);

      if (!diff.trim()) {
        throw new Error(
          `ai-code-gym: empty diff — "git diff ${opts.base}" in ${opts.repo} returned nothing. ` +
            "Commit your changes, or pass --diff with a pre-generated diff file.",
        );
      }

      const userPrompt = `
Here is the context for the build exercise review:

## Feature Spec
${spec}

## Developer's Implementation Diff
\`\`\`diff
${diff}
\`\`\`

Please review the implementation against the spec and return structured markdown feedback.
`.trim();

      console.log(`Scoring your implementation via ${providerName}...`);
      const { text: evaluation } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 2048,
      });

      const timestamp = timestampSlug();
      await writeTimestampedAndLatest(
        FEEDBACK_DIR,
        `build-evaluation-${timestamp}.md`,
        "latest-build-evaluation.md",
        evaluation,
      );

      console.log(`Feedback written to ${FEEDBACK_DIR}/latest-build-evaluation.md`);
    });
}
