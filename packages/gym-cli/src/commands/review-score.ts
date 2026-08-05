import type { Command } from "commander";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { generateText } from "ai";
import { getProvider } from "../ai/provider.js";
import { readAgentPrompt } from "../lib/agents.js";
import { timestampSlug, writeTimestampedAndLatest } from "../lib/artifacts.js";
import { fetchPRComments, postPRComment, requireGithubEnv } from "../core/github.js";

const REVIEW_MODE_DIR = "exercises/review-mode";
const FEEDBACK_DIR = "feedback";

interface BugManifest {
  raw?: string;
}

export function registerReviewScore(program: Command): void {
  program
    .command("review-score")
    .description("Score your review of a Review Mode exercise, read from its GitHub PR")
    .requiredOption("--pr <number>", "the GitHub PR number the bot opened for this exercise")
    .option(
      "--exercise <path>",
      "path to the exercise file being reviewed",
      path.join(REVIEW_MODE_DIR, "latest-exercise.tsx"),
    )
    .action(async (opts: { pr: string; exercise: string }) => {
      const prNumber = Number.parseInt(opts.pr, 10);
      if (Number.isNaN(prNumber) || prNumber <= 0) {
        throw new Error(`ai-code-gym: --pr must be a positive integer, got "${opts.pr}"`);
      }
      requireGithubEnv();

      const systemPrompt = readAgentPrompt("review-critic");
      const { name: providerName, model } = getProvider();

      const code = await readFile(opts.exercise, "utf-8").catch(() => {
        throw new Error(`ai-code-gym: no exercise found at ${opts.exercise} — run "pnpm gym review-new" first.`);
      });

      console.log(`Fetching your review comments from PR #${prNumber}...`);
      const comments = await fetchPRComments(prNumber);
      if (comments.length === 0) {
        throw new Error(
          `ai-code-gym: PR #${prNumber} has no comments yet — leave your review on GitHub before scoring.`,
        );
      }
      const reviewNotes = comments.join("\n\n---\n\n");

      const manifestRaw = await readFile(path.join(REVIEW_MODE_DIR, "latest-bug-manifest.json"), "utf-8").catch(
        () => "{}",
      );

      let bugManifest: BugManifest = {};
      try {
        bugManifest = JSON.parse(manifestRaw) as BugManifest;
      } catch {
        // Missing or malformed manifest just means no hidden bug list to grade against.
      }

      const userPrompt = `
Here is the context for the review exercise evaluation:

## Exercise Code
\`\`\`tsx
${code}
\`\`\`

## Bug Manifest (hidden from original reviewer)
${bugManifest.raw ?? "Not available"}

## Developer's Review Comments
${reviewNotes}

Please evaluate the review using the rubric and return structured markdown feedback.
`.trim();

      console.log(`Scoring your review via ${providerName}...`);
      const { text: evaluation } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 2048,
      });

      const timestamp = timestampSlug();
      await writeTimestampedAndLatest(
        FEEDBACK_DIR,
        `review-evaluation-${timestamp}.md`,
        "latest-review-evaluation.md",
        evaluation,
      );

      console.log(`Posting your grade to PR #${prNumber}...`);
      await postPRComment(prNumber, evaluation);

      console.log(`Feedback written to ${FEEDBACK_DIR}/latest-review-evaluation.md and posted to PR #${prNumber}`);
    });
}
