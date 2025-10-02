import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createAnonymousChatLog,
  createChatOwnership,
  getChatCountByIP,
  getChatCountByUserId,
  getUserPreference,
} from "@/lib/db/queries";
import {
  anonymousEntitlements,
  entitlementsByUserType,
} from "@/lib/entitlements";
import { ChatSDKError } from "@/lib/errors";
import { ProviderFactory } from "@/lib/providers/provider-factory";
import type { ProviderType } from "@/lib/providers/types";

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Fallback to connection remote address or unknown
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const { message, chatId, streaming, attachments } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Get user's provider preference
    let providerType: ProviderType = "v0";
    let modelName: string | undefined;
    let providerConfig: Record<string, unknown> = {};

    // Start with environment-based defaults for all providers
    const envDefaults: Record<string, unknown> = {};

    // V0 provider defaults from environment
    if (process.env.V0_API_KEY) {
      envDefaults.v0ApiKey = process.env.V0_API_KEY;
    }
    if (process.env.V0_API_URL) {
      envDefaults.v0BaseUrl = process.env.V0_API_URL;
    }

    if (session?.user?.id) {
      const preference = await getUserPreference({ userId: session.user.id });
      if (preference) {
        providerType = preference.provider as ProviderType;
        modelName = preference.model_name || undefined;
        if (preference.provider_config) {
          try {
            providerConfig = JSON.parse(preference.provider_config);
          } catch (e) {
            console.error("Failed to parse provider config:", e);
          }
        }
      }
    }

    // Merge environment defaults with user config based on provider type
    if (providerType === "v0") {
      // For V0, always use environment API key if available (don't let user override)
      if (envDefaults.v0ApiKey) {
        providerConfig.apiKey = envDefaults.v0ApiKey;
      }
      // Use environment base URL as default, but allow user override
      if (envDefaults.v0BaseUrl && !providerConfig.baseUrl) {
        providerConfig.baseUrl = envDefaults.v0BaseUrl;
      }
    }

    // Add model name to config
    if (modelName) {
      providerConfig.modelName = modelName;
    }

    // Rate limiting
    if (session?.user?.id) {
      const chatCount = await getChatCountByUserId({
        userId: session.user.id,
        differenceInHours: 24,
      });

      const userType = session.user.type;
      if (chatCount >= entitlementsByUserType[userType].maxMessagesPerDay) {
        return new ChatSDKError("rate_limit:chat").toResponse();
      }

      console.log("API request:", {
        message,
        chatId,
        streaming,
        userId: session.user.id,
        provider: providerType,
        model: modelName,
        hasApiKey: !!providerConfig.apiKey,
      });
    } else {
      const clientIP = getClientIP(request);
      const chatCount = await getChatCountByIP({
        ipAddress: clientIP,
        differenceInHours: 24,
      });

      if (chatCount >= anonymousEntitlements.maxMessagesPerDay) {
        return new ChatSDKError("rate_limit:chat").toResponse();
      }

      console.log("API request (anonymous):", {
        message,
        chatId,
        streaming,
        ip: clientIP,
        provider: providerType,
        hasApiKey: !!providerConfig.apiKey,
      });
    }

    // Get the provider
    const provider = ProviderFactory.getProvider(providerType);

    let result: unknown;

    if (chatId) {
      // Continue existing chat
      result = await provider.continueChat(
        {
          message,
          chatId,
          attachments,
          streaming,
        },
        providerConfig,
      );
    } else {
      // Create new chat
      result = await provider.createChat(
        {
          message,
          attachments,
          streaming,
        },
        providerConfig,
      );
    }

    // Handle streaming response
    if (result instanceof ReadableStream) {
      return new Response(result, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Handle sync response
    const chatResponse = result as {
      id: string;
      demo?: { code?: string; language?: string };
      messages?: Array<{
        id: string;
        role: string;
        content: string;
        experimental_content?: unknown;
      }>;
    };

    // Create ownership mapping or anonymous log for new chat
    if (!chatId && chatResponse.id) {
      try {
        if (session?.user?.id) {
          await createChatOwnership({
            v0ChatId: chatResponse.id,
            userId: session.user.id,
          });
          console.log("Chat ownership created:", chatResponse.id);
        } else {
          const clientIP = getClientIP(request);
          await createAnonymousChatLog({
            ipAddress: clientIP,
            v0ChatId: chatResponse.id,
          });
          console.log(
            "Anonymous chat logged:",
            chatResponse.id,
            "IP:",
            clientIP,
          );
        }
      } catch (error) {
        console.error("Failed to create chat ownership/log:", error);
      }
    }

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error("API Error:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
