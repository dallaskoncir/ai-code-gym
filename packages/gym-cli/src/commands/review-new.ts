import type { Command } from "commander";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { generateText } from "ai";
import { getProvider } from "../ai/provider.js";
import { readAgentPrompt } from "../lib/agents.js";
import { loadExerciseConfig, resolveTier, resolveTopic } from "../lib/config.js";
import { dateSlug, ensureDir, writeTimestampedAndLatest } from "../lib/artifacts.js";

const REVIEW_MODE_DIR = "exercises/review-mode";

export function registerReviewNew(program: Command): void {
  program
    .command("review-new")
    .description("Generate a new buggy component for you to review (Review Mode)")
    .option("-t, --tier <1-4>", "difficulty tier, overrides exercise-config.json")
    .option("--topic <topic>", "exercise topic, overrides exercise-config.json")
    .action(async (opts: { tier?: string; topic?: string }) => {
      const config = loadExerciseConfig();
      const tier = resolveTier(opts.tier, config);
      const topic = resolveTopic(opts.topic, config);

      const systemPrompt = readAgentPrompt("feature-writer");
      const { name: providerName, model } = getProvider();

      const userPrompt = `
Write a React + TypeScript component for a "${topic}" exercise at difficulty tier ${tier}.
The component should be realistic, roughly 60-120 lines, and contain the appropriate number and type of intentional bugs for tier ${tier}.
Include the hidden <!-- BUGS --> manifest at the end of your response.
`.trim();

      console.log(`Generating tier-${tier} ${topic} review exercise via ${providerName}...`);
      const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 4096,
      });

      const parts = text.split("<!-- BUGS -->");
      const codePart = parts[0] ?? text;
      const bugPart = parts[1];
      const codeMatch = codePart.match(/```(?:tsx?)?\n([\s\S]*?)```/);
      const code = codeMatch?.[1] ?? codePart.trim();

      await ensureDir(REVIEW_MODE_DIR);
      const timestamp = dateSlug();

      await Promise.all([
        writeTimestampedAndLatest(REVIEW_MODE_DIR, `exercise-${timestamp}-${topic}.tsx`, "latest-exercise.tsx", code),
        writeFile(
          path.join(REVIEW_MODE_DIR, "latest-bug-manifest.json"),
          JSON.stringify({ raw: bugPart?.trim() ?? "" }, null, 2),
        ),
        writeFile(
          path.join(REVIEW_MODE_DIR, "my-review.md"),
          `# My Review — Tier ${tier}: ${topic}\n\n` +
            `Review \`${REVIEW_MODE_DIR}/latest-exercise.tsx\` and write your comments below.\n` +
            "Reference line numbers where you can (e.g. `L23`).\n\n" +
            "When you're done, run:\n\n```\npnpm gym review-score\n```\n\n" +
            "---\n\n- \n",
        ),
      ]);

      console.log(`Exercise written to ${REVIEW_MODE_DIR}/latest-exercise.tsx`);
      console.log(`Write your review in ${REVIEW_MODE_DIR}/my-review.md, then run: pnpm gym review-score`);
    });
}
