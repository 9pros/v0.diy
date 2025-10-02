import type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  ProviderConfig,
} from "./types";

interface LlamaMessage {
  role: string;
  content: string;
}

interface LlamaResponse {
  id: string;
  choices: Array<{
    message: LlamaMessage;
    finish_reason: string;
  }>;
}

export class LlamaProvider implements AIProvider {
  name = "llama" as const;

  async createChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>> {
    const baseUrl =
      config.baseUrl || "https://api.llama-api.com/v1/chat/completions";
    const model = config.modelName || "llama3.2-1b";
    const apiKey = config.apiKey;

    if (!apiKey) {
      throw new Error(
        "Llama API key is required. Please configure your API key in settings.",
      );
    }

    const messages: LlamaMessage[] = [
      {
        role: "user",
        content: request.message,
      },
    ];

    if (request.streaming) {
      return this.streamChat(
        baseUrl,
        model,
        apiKey as string,
        messages,
        config,
      );
    }

    return this.syncChat(baseUrl, model, apiKey as string, messages, config);
  }

  async continueChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>> {
    const baseUrl =
      config.baseUrl || "https://api.llama-api.com/v1/chat/completions";
    const model = config.modelName || "llama3.2-1b";
    const apiKey = config.apiKey;

    if (!apiKey) {
      throw new Error(
        "Llama API key is required. Please configure your API key in settings.",
      );
    }

    const messages: LlamaMessage[] = [
      ...(request.messages || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: request.message,
      },
    ];

    if (request.streaming) {
      return this.streamChat(
        baseUrl,
        model,
        apiKey as string,
        messages,
        config,
      );
    }

    return this.syncChat(baseUrl, model, apiKey as string, messages, config);
  }

  async listModels(config: ProviderConfig): Promise<string[]> {
    // Meta Llama models available via API
    return [
      "llama3.2-1b",
      "llama3.2-3b",
      "llama3.1-8b",
      "llama3.1-70b",
      "llama3.1-405b",
    ];
  }

  private async syncChat(
    baseUrl: string,
    model: string,
    apiKey: string,
    messages: LlamaMessage[],
    config: ProviderConfig,
  ): Promise<ChatResponse> {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Llama API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data: LlamaResponse = await response.json();
    const chatId = `llama-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return {
      id: chatId,
      messages: [
        ...messages.map((msg, idx) => ({
          id: `msg-${idx}`,
          role: msg.role,
          content: msg.content,
        })),
        {
          id: `msg-${messages.length}`,
          role: "assistant",
          content: data.choices[0].message.content,
        },
      ],
    };
  }

  private streamChat(
    baseUrl: string,
    model: string,
    apiKey: string,
    messages: LlamaMessage[],
    config: ProviderConfig,
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(baseUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: config.temperature || 0.7,
              max_tokens: config.maxTokens || 2000,
              stream: true,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Llama API error: ${response.status} ${response.statusText} - ${errorText}`,
            );
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body");
          }

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim().startsWith("data: ")) {
                const data = line.trim().substring(6);
                if (data === "[DONE]") {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    const event = `data: ${JSON.stringify({ type: "text", content })}\n\n`;
                    controller.enqueue(encoder.encode(event));
                  }
                } catch (e) {
                  console.error("Failed to parse Llama response:", e);
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}
