export type ProviderType =
  | "v0"
  | "ollama"
  | "ollama-cloud"
  | "lmstudio"
  | "llama";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  chatId?: string;
  attachments?: Array<{ url: string }>;
  streaming?: boolean;
  messages?: Message[];
}

export interface ChatResponse {
  id: string;
  demo?: {
    code?: string;
    language?: string;
  };
  messages?: Array<{
    id: string;
    role: string;
    content: string;
    experimental_content?: unknown;
  }>;
}

export interface ProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

export interface AIProvider {
  name: ProviderType;
  createChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>>;
  continueChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>>;
  listModels(config: ProviderConfig): Promise<string[]>;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  description?: string;
}
