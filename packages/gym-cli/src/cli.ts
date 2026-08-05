#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { Command } from "commander";
import { registerReviewNew } from "./commands/review-new.js";
import { registerReviewScore } from "./commands/review-score.js";
import { registerBuildNew } from "./commands/build-new.js";
import { registerBuildScore } from "./commands/build-score.js";

// Always load packages/gym-cli/.env, regardless of the cwd the CLI was invoked from
// (`pnpm --filter <pkg> run <script>` runs with cwd set to <pkg>'s directory, but a
// bare `tsx src/cli.ts` from the package itself works too — so resolve from this file).
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadDotenv({ path: path.join(packageRoot, ".env"), quiet: true });

const program = new Command();

program
  .name("gym")
  .description("AI Code Gym — a local-first coding-interview training CLI")
  .version("1.0.0");

registerReviewNew(program);
registerReviewScore(program);
registerBuildNew(program);
registerBuildScore(program);

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
