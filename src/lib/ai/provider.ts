import { createMockAIProvider } from "@/lib/ai/mock-provider";
import type { AIProvider, AIProviderConfig } from "@/lib/ai/types";

export function getAIProvider(config = readAIProviderConfig()): AIProvider {
  if (shouldUseMockProvider(config)) {
    return createMockAIProvider();
  }

  return createConfiguredProvider(config);
}

export function readAIProviderConfig(): AIProviderConfig {
  return {
    apiKey: process.env.AI_API_KEY,
    provider: process.env.AI_PROVIDER?.trim().toLowerCase() || "mock",
  };
}

function shouldUseMockProvider(config: AIProviderConfig) {
  return config.provider === "mock" || !config.apiKey;
}

function createConfiguredProvider(config: AIProviderConfig): AIProvider {
  return {
    async classifyProjectIdea() {
      throw new Error(
        `AI provider "${config.provider}" is not implemented yet. Set AI_PROVIDER=mock or omit AI_API_KEY for local mock mode.`,
      );
    },
    mode: "configured",
    name: config.provider,
  };
}
