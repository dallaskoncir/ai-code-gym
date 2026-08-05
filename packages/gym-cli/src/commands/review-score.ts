import type { Command } from "commander";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { generateText } from "ai";
import { getProvider } from "../ai/provider.js";
import { readAgentPrompt } from "../lib/agents.js";
import { timestampSlug, writeTimestampedAndLatest } from "../lib/artifacts.js";

const REVIEW_MODE_DIR = "exercises/review-mode";
const FEEDBACK_DIR = "feedback";

interface BugManifest {
  raw?: string;
}

export function registerReviewScore(program: Command): void {
  program
    .command("review-score")
    .description("Score your review of the latest Review Mode exercise")
    .option("--review <path>", "path to your review notes", path.join(REVIEW_MODE_DIR, "my-review.md"))
    .option(
      "--exercise <path>",
      "path to the exercise file being reviewed",
      path.join(REVIEW_MODE_DIR, "latest-exercise.tsx"),
    )
    .action(async (opts: { review: string; exercise: string }) => {
      const systemPrompt = readAgentPrompt("review-critic");
      const { name: providerName, model } = getProvider();

      const code = await readFile(opts.exercise, "utf-8").catch(() => {
        throw new Error(`ai-code-gym: no exercise found at ${opts.exercise} — run "pnpm gym review-new" first.`);
      });
      const reviewNotes = await readFile(opts.review, "utf-8").catch(() => {
        throw new Error(`ai-code-gym: no review notes found at ${opts.review} — write your review there first.`);
      });
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

      console.log(`Feedback written to ${FEEDBACK_DIR}/latest-review-evaluation.md`);
    });
}
