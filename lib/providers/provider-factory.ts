import { LlamaProvider } from "./llama-provider";
import { LMStudioProvider } from "./lmstudio-provider";
import { OllamaCloudProvider, OllamaProvider } from "./ollama-provider";
import type { AIProvider, ModelInfo, ProviderType } from "./types";
import { V0Provider } from "./v0-provider";

export class ProviderFactory {
  private static providers: Map<ProviderType, AIProvider> = new Map([
    ["v0", new V0Provider()],
    ["ollama", new OllamaProvider()],
    ["ollama-cloud", new OllamaCloudProvider()],
    ["lmstudio", new LMStudioProvider()],
    ["llama", new LlamaProvider()],
  ]);

  static getProvider(type: ProviderType): AIProvider {
    const provider = ProviderFactory.providers.get(type);
    if (!provider) {
      throw new Error(`Provider ${type} not found`);
    }
    return provider;
  }

  static getAllProviders(): Array<{
    id: ProviderType;
    name: string;
    description: string;
    requiresApiKey: boolean;
    defaultBaseUrl?: string;
  }> {
    return [
      {
        id: "v0",
        name: "v0.dev",
        description: "Vercel v0 - AI-powered React component generator",
        requiresApiKey: true,
      },
      {
        id: "ollama",
        name: "Ollama (Local)",
        description: "Run Llama models locally on your machine",
        requiresApiKey: false,
        defaultBaseUrl: "http://localhost:11434",
      },
      {
        id: "ollama-cloud",
        name: "Ollama Cloud",
        description: "Ollama hosted in the cloud",
        requiresApiKey: true,
        defaultBaseUrl: "https://ollama.com",
      },
      {
        id: "lmstudio",
        name: "LM Studio",
        description: "Local LLM inference with LM Studio",
        requiresApiKey: false,
        defaultBaseUrl: "http://localhost:1234",
      },
      {
        id: "llama",
        name: "Meta Llama API",
        description: "Official Meta Llama API",
        requiresApiKey: true,
        defaultBaseUrl: "https://api.llama-api.com",
      },
    ];
  }

  static async getAvailableModels(
    providerType: ProviderType,
    config: {
      baseUrl?: string;
      apiKey?: string;
    },
  ): Promise<ModelInfo[]> {
    const provider = ProviderFactory.getProvider(providerType);
    const modelNames = await provider.listModels(config);

    return modelNames.map((name) => ({
      id: name,
      name,
      provider: providerType,
    }));
  }
}
