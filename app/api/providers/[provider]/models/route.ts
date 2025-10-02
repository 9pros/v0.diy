import { type NextRequest, NextResponse } from "next/server";
import { ProviderFactory } from "@/lib/providers/provider-factory";
import type { ProviderType } from "@/lib/providers/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get("baseUrl") || undefined;
    const apiKey = searchParams.get("apiKey") || undefined;

    const models = await ProviderFactory.getAvailableModels(
      provider as ProviderType,
      {
        baseUrl,
        apiKey,
      },
    );

    return NextResponse.json({ models });
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch models",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
