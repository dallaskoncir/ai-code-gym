import { readFileSync } from "node:fs";
import path from "node:path";

export type AgentName = "feature-writer" | "review-critic" | "spec-generator" | "build-reviewer";

export function readAgentPrompt(name: AgentName, cwd: string = process.cwd()): string {
  const promptPath = path.join(cwd, "agents", name, "system-prompt.md");
  try {
    return readFileSync(promptPath, "utf-8");
  } catch (error) {
    throw new Error(`ai-code-gym: could not read agent prompt at ${promptPath}`, { cause: error });
  }
}
