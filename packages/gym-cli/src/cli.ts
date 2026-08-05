#!/usr/bin/env node
import { Command } from "commander";
import { registerReviewNew } from "./commands/review-new.js";
import { registerReviewScore } from "./commands/review-score.js";
import { registerBuildNew } from "./commands/build-new.js";
import { registerBuildScore } from "./commands/build-score.js";

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
