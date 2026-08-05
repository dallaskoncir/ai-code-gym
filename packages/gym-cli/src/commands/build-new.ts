import type { Command } from "commander";
import { generateText } from "ai";
import { getProvider } from "../ai/provider.js";
import { readAgentPrompt } from "../lib/agents.js";
import { loadExerciseConfig, resolveTier, resolveTopic } from "../lib/config.js";
import { dateSlug, writeTimestampedAndLatest } from "../lib/artifacts.js";

const BUILD_MODE_DIR = "exercises/build-mode";

export function registerBuildNew(program: Command): void {
  program
    .command("build-new")
    .description("Generate a new feature spec for you to implement (Build Mode)")
    .option("-t, --tier <1-4>", "difficulty tier, overrides exercise-config.json")
    .option("--topic <topic>", "exercise topic, overrides exercise-config.json")
    .action(async (opts: { tier?: string; topic?: string }) => {
      const config = loadExerciseConfig();
      const tier = resolveTier(opts.tier, config);
      const topic = resolveTopic(opts.topic, config);

      const systemPrompt = readAgentPrompt("spec-generator");
      const { name: providerName, model } = getProvider();

      const userPrompt =
        `Generate a tier-${tier} React + TypeScript feature spec for the topic: "${topic}". ` +
        "Keep the scope to a 1-3 hour exercise.";

      console.log(`Generating tier-${tier} ${topic} build spec via ${providerName}...`);
      const { text: spec } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 2048,
      });

      const timestamp = dateSlug();
      await writeTimestampedAndLatest(BUILD_MODE_DIR, `spec-${timestamp}-${topic}.md`, "latest-spec.md", spec);

      console.log(`Spec written to ${BUILD_MODE_DIR}/latest-spec.md`);
      console.log("Implement it, then run: pnpm gym build-score --repo <path-to-your-implementation>");
    });
}
