import type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  ProviderConfig,
} from "./types";

interface LMStudioMessage {
  role: string;
  content: string;
}

interface LMStudioResponse {
  id: string;
  choices: Array<{
    message: LMStudioMessage;
    finish_reason: string;
  }>;
}

export class LMStudioProvider implements AIProvider {
  name = "lmstudio" as const;

  async createChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>> {
    const baseUrl = config.baseUrl || "http://localhost:1234";
    const model = config.modelName || "local-model";

    const messages: LMStudioMessage[] = [
      {
        role: "user",
        content: request.message,
      },
    ];

    if (request.streaming) {
      return this.streamChat(baseUrl, model, messages, config);
    }

    return this.syncChat(baseUrl, model, messages, config);
  }

  async continueChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>> {
    const baseUrl = config.baseUrl || "http://localhost:1234";
    const model = config.modelName || "local-model";

    const messages: LMStudioMessage[] = [
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
      return this.streamChat(baseUrl, model, messages, config);
    }

    return this.syncChat(baseUrl, model, messages, config);
  }

  async listModels(config: ProviderConfig): Promise<string[]> {
    const baseUrl = config.baseUrl || "http://localhost:1234";

    try {
      const response = await fetch(`${baseUrl}/v1/models`);
      const data = await response.json();
      return data.data?.map((m: { id: string }) => m.id) || [];
    } catch (error) {
      console.error("Failed to fetch LM Studio models:", error);
      return ["local-model"];
    }
  }

  private async syncChat(
    baseUrl: string,
    model: string,
    messages: LMStudioMessage[],
    config: ProviderConfig,
  ): Promise<ChatResponse> {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      throw new Error(`LM Studio API error: ${response.statusText}`);
    }

    const data: LMStudioResponse = await response.json();
    const chatId = `lmstudio-${Date.now()}-${Math.random().toString(36).substring(7)}`;

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
    messages: LMStudioMessage[],
    config: ProviderConfig,
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
            throw new Error(`LM Studio API error: ${response.statusText}`);
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
                  console.error("Failed to parse LM Studio response:", e);
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
