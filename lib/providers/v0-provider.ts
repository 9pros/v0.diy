import { type ChatDetail, createClient } from "v0-sdk";
import type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  ProviderConfig,
} from "./types";

export class V0Provider implements AIProvider {
  name = "v0" as const;

  async createChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>> {
    // Always create client with config (v0-sdk will use env vars as fallback)
    const clientConfig: { baseUrl?: string; apiKey?: string } = {};

    if (config.baseUrl) {
      clientConfig.baseUrl = config.baseUrl as string;
    }
    if (config.apiKey) {
      clientConfig.apiKey = config.apiKey as string;
    }

    const client = createClient(clientConfig);

    const result = await client.chats.create({
      message: request.message,
      responseMode: request.streaming ? "experimental_stream" : "sync",
      ...(request.attachments &&
        request.attachments.length > 0 && { attachments: request.attachments }),
    });

    if (result instanceof ReadableStream) {
      return result;
    }

    return this.mapV0Response(result as ChatDetail);
  }

  async continueChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>> {
    if (!request.chatId) {
      throw new Error("Chat ID is required for continuing chat");
    }

    // Always create client with config (v0-sdk will use env vars as fallback)
    const clientConfig: { baseUrl?: string; apiKey?: string } = {};

    if (config.baseUrl) {
      clientConfig.baseUrl = config.baseUrl as string;
    }
    if (config.apiKey) {
      clientConfig.apiKey = config.apiKey as string;
    }

    const client = createClient(clientConfig);

    const result = await client.chats.sendMessage({
      chatId: request.chatId,
      message: request.message,
      responseMode: request.streaming ? "experimental_stream" : undefined,
      ...(request.attachments &&
        request.attachments.length > 0 && { attachments: request.attachments }),
    });

    if (result instanceof ReadableStream) {
      return result;
    }

    return this.mapV0Response(result as ChatDetail);
  }

  async listModels(config: ProviderConfig): Promise<string[]> {
    // v0 doesn't expose model selection, return default
    return ["v0-default"];
  }

  private mapV0Response(chatDetail: ChatDetail): ChatResponse {
    return {
      id: chatDetail.id,
      demo: chatDetail.demo,
      messages: chatDetail.messages?.map((msg) => ({
        ...msg,
        experimental_content: (
          msg as typeof msg & { experimental_content?: unknown }
        ).experimental_content,
      })),
    };
  }
}
