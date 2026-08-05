import { readFileSync } from "node:fs";
import path from "node:path";

export interface ExerciseConfig {
  difficulty_tier: number;
  mode: "review" | "build";
  topic: string;
  topics_available: string[];
  tier_descriptions: Record<string, string>;
  review_criteria: Record<string, string>;
}

const CONFIG_FILE_NAME = "exercise-config.json";

export function loadExerciseConfig(cwd: string = process.cwd()): ExerciseConfig {
  const configPath = path.join(cwd, CONFIG_FILE_NAME);
  let raw: string;
  try {
    raw = readFileSync(configPath, "utf-8");
  } catch (error) {
    throw new Error(`ai-code-gym: could not read ${CONFIG_FILE_NAME} at ${configPath}`, { cause: error });
  }

  try {
    return JSON.parse(raw) as ExerciseConfig;
  } catch (error) {
    throw new Error(`ai-code-gym: ${CONFIG_FILE_NAME} is not valid JSON`, { cause: error });
  }
}

/** CLI flag beats the config file, which beats the hardcoded fallback. */
export function resolveTier(explicitTier: string | undefined, config: ExerciseConfig): number {
  if (explicitTier?.trim()) {
    const parsed = Number.parseInt(explicitTier, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 4) {
      throw new Error(`ai-code-gym: --tier must be an integer 1-4, got "${explicitTier}"`);
    }
    return parsed;
  }
  return config.difficulty_tier;
}

export function resolveTopic(explicitTopic: string | undefined, config: ExerciseConfig): string {
  const topic = explicitTopic?.trim() || config.topic;
  if (!config.topics_available.includes(topic)) {
    throw new Error(
      `ai-code-gym: unknown topic "${topic}" — choose one of ${config.topics_available.join(", ")}`,
    );
  }
  return topic;
}
