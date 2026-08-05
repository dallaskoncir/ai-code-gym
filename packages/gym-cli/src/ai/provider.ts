import { anthropic } from "@ai-sdk/anthropic";
import { createOllama } from "ai-sdk-ollama";
import type { LanguageModel } from "ai";

export type ProviderName = "ollama" | "claude";

const DEFAULT_PROVIDER: ProviderName = "claude";
const DEFAULT_OLLAMA_HOST = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.1";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";

export interface ResolvedProvider {
  name: ProviderName;
  model: LanguageModel;
}

function resolveProviderName(): ProviderName {
  const raw = process.env.AI_CODE_GYM_PROVIDER?.trim().toLowerCase();
  if (raw === "ollama" || raw === "claude") return raw;
  if (raw) {
    console.error(
      `ai-code-gym: unknown AI_CODE_GYM_PROVIDER="${raw}" — falling back to "${DEFAULT_PROVIDER}". Expected "ollama" or "claude".`,
    );
  }
  return DEFAULT_PROVIDER;
}

// Mirrors the `OLLAMA_HOST` convention of the official `ollama` CLI, so this
// tool talks to whatever server the user already pointed their local tooling
// at instead of always assuming an instance on 127.0.0.1.
function resolveOllamaBaseUrl(): string {
  const host = process.env.OLLAMA_HOST?.trim();
  if (!host) return DEFAULT_OLLAMA_HOST;
  const withScheme = /^https?:\/\//.test(host) ? host : `http://${host}`;
  return withScheme.replace(/\/+$/, "");
}

/**
 * Resolves which AI provider to use based on `AI_CODE_GYM_PROVIDER`.
 * - "ollama": routes to a local (or remote, via OLLAMA_HOST) Ollama server.
 * - "claude" (default): routes to Anthropic, requires ANTHROPIC_API_KEY.
 */
export function getProvider(): ResolvedProvider {
  const name = resolveProviderName();

  if (name === "ollama") {
    const baseURL = resolveOllamaBaseUrl();
    const ollama = createOllama({ baseURL });
    const modelId = process.env.AI_CODE_GYM_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
    return { name, model: ollama(modelId) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ai-code-gym: ANTHROPIC_API_KEY is not set — required when AI_CODE_GYM_PROVIDER=claude (the default).",
    );
  }
  const modelId = process.env.AI_CODE_GYM_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  return { name, model: anthropic(modelId) };
}
