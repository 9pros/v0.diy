import type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  Message,
  ProviderConfig,
} from "./types";

interface OllamaMessage {
  role: string;
  content: string;
}

interface OllamaResponse {
  model: string;
  message: OllamaMessage;
  done: boolean;
}

/**
 * Create delta for v0-sdk streaming
 * For simplicity and reliability, we return the full content each time
 * v0-sdk's StreamingMessage component handles incremental updates efficiently
 */
function createDelta(
  oldContent: Array<Array<unknown>>,
  newContent: Array<Array<unknown>>,
): unknown {
  // Simply return the full new content
  // v0-sdk's StreamingMessage can handle receiving the full content on each update
  return newContent;
}

export class OllamaProvider implements AIProvider {
  name = "ollama" as const;

  async createChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>> {
    const baseUrl = config.baseUrl || "http://localhost:11434";
    const model = config.modelName || "llama3.2";

    const messages: OllamaMessage[] = [
      {
        role: "user",
        content: request.message,
      },
    ];

    // If streaming is requested, return a stream that mimics v0's format
    if (request.streaming) {
      return this.streamChat(baseUrl, model, messages, config);
    }

    return this.syncChat(baseUrl, model, messages, config);
  }

  async continueChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>> {
    const baseUrl = config.baseUrl || "http://localhost:11434";
    const model = config.modelName || "llama3.2";

    const messages: OllamaMessage[] = [
      ...(request.messages || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: request.message,
      },
    ];

    // If streaming is requested, return a stream that mimics v0's format
    if (request.streaming) {
      return this.streamChat(baseUrl, model, messages, config);
    }

    return this.syncChat(baseUrl, model, messages, config);
  }

  async listModels(config: ProviderConfig): Promise<string[]> {
    const baseUrl = config.baseUrl || "http://localhost:11434";

    try {
      const headers: Record<string, string> = {};

      // Add Bearer token if API key is provided (for Ollama Cloud)
      if (config.apiKey) {
        headers.Authorization = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(`${baseUrl}/api/tags`, {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch models: ${response.status} ${errorText}`,
        );
      }

      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch (error) {
      console.error("Failed to fetch Ollama models:", error);
      return ["llama3.2", "llama3.1", "mistral", "codellama"];
    }
  }

  private async syncChat(
    baseUrl: string,
    model: string,
    messages: OllamaMessage[],
    config: ProviderConfig,
  ): Promise<ChatResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Bearer token if API key is provided (for Ollama Cloud)
    if (config.apiKey) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data: OllamaResponse = await response.json();
    const chatId = `ollama-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Format the response to match v0's ChatResponse structure exactly
    const assistantContent = this.formatContentAsMessageBinaryFormat(
      data.message.content,
    );

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
          content: data.message.content,
          experimental_content: assistantContent,
        },
      ],
    };
  }

  private streamChat(
    baseUrl: string,
    model: string,
    messages: OllamaMessage[],
    config: ProviderConfig,
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const chatId = `ollama-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    // Bind the formatter function to use inside the stream
    const formatContent = this.formatContentAsMessageBinaryFormat.bind(this);

    return new ReadableStream({
      async start(controller) {
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          // Add Bearer token if API key is provided (for Ollama Cloud)
          if (config.apiKey) {
            headers.Authorization = `Bearer ${config.apiKey}`;
          }

          // First, send the chat metadata in v0 format
          // This triggers onChatData callback which sets the chat ID
          const chatMetadata = {
            object: "chat",
            id: chatId,
            createdAt: new Date().toISOString(),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chatMetadata)}\n\n`),
          );

          // Make the request to Ollama API
          const response = await fetch(`${baseUrl}/api/chat`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model,
              messages,
              stream: true,
              options: {
                temperature: config.temperature,
                num_predict: config.maxTokens,
              },
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Ollama API error: ${response.status} ${response.statusText} - ${errorText}`,
            );
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body");
          }

          const decoder = new TextDecoder();
          let buffer = "";
          let fullContent = "";
          let currentFormattedContent: Array<Array<unknown>> = [];

          // Read the stream from Ollama
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const parsed: OllamaResponse = JSON.parse(line);
                  if (parsed.message?.content) {
                    fullContent += parsed.message.content;

                    // Format the accumulated content as MessageBinaryFormat
                    const newFormattedContent = formatContent(fullContent);

                    // Create a JSON patch delta that v0-sdk expects
                    const delta = createDelta(
                      currentFormattedContent,
                      newFormattedContent,
                    );

                    currentFormattedContent = newFormattedContent;

                    // Send delta in v0's streaming format
                    const chunk = {
                      delta: delta,
                    };
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
                    );
                  }
                } catch (e) {
                  console.error("Failed to parse Ollama response:", e);
                }
              }
            }
          }

          // Send completion signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });
  }

  /**
   * Format plain text content as MessageBinaryFormat that v0-sdk can render
   * MessageBinaryFormat is an array of rows, where each row is [rowType, ...data]
   * For text content, we use type 0 for paragraphs
   */
  private formatContentAsMessageBinaryFormat(
    content: string,
  ): Array<Array<unknown>> {
    // Split content into paragraphs
    const paragraphs = content.split("\n\n").filter((p) => p.trim());

    // If no paragraphs, create a single paragraph with the content
    if (paragraphs.length === 0 && content.trim()) {
      return [[0, content.trim()]];
    }

    // Format each paragraph as a MessageBinaryFormat row
    // Row format: [type, ...content]
    // Type 0 = paragraph with text
    return paragraphs.map((paragraph) => {
      // Each paragraph is a row with type 0 (paragraph) and text content
      return [0, paragraph.trim()];
    });
  }
}

// Ollama Cloud provider (same interface, different default baseUrl)
export class OllamaCloudProvider extends OllamaProvider {
  name = "ollama-cloud" as const;

  async createChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>> {
    // Use Ollama Cloud base URL
    const cloudConfig = {
      ...config,
      baseUrl: config.baseUrl || "https://ollama.com",
    };

    // Validate API key for Ollama Cloud
    if (!cloudConfig.apiKey) {
      throw new Error(
        "Ollama Cloud requires an API key. Please configure your API key in settings.",
      );
    }

    return super.createChat(request, cloudConfig);
  }

  async continueChat(
    request: ChatRequest,
    config: ProviderConfig,
  ): Promise<ChatResponse | ReadableStream<Uint8Array>> {
    const cloudConfig = {
      ...config,
      baseUrl: config.baseUrl || "https://ollama.com",
    };

    // Validate API key for Ollama Cloud
    if (!cloudConfig.apiKey) {
      throw new Error(
        "Ollama Cloud requires an API key. Please configure your API key in settings.",
      );
    }

    return super.continueChat(request, cloudConfig);
  }

  async listModels(config: ProviderConfig): Promise<string[]> {
    const cloudConfig = {
      ...config,
      baseUrl: config.baseUrl || "https://ollama.com",
    };
    return super.listModels(cloudConfig);
  }
}
