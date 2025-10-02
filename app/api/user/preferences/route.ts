import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserPreference, upsertUserPreference } from "@/lib/db/queries";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preference = await getUserPreference({
      userId: session.user.id,
    });

    // Return default if no preference exists
    if (!preference) {
      return NextResponse.json({
        provider: "v0",
        modelName: null,
        providerConfig: null,
      });
    }

    return NextResponse.json({
      provider: preference.provider,
      modelName: preference.model_name,
      providerConfig: preference.provider_config
        ? JSON.parse(preference.provider_config)
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, modelName, providerConfig } = await request.json();

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 },
      );
    }

    const [updated] = await upsertUserPreference({
      userId: session.user.id,
      provider,
      modelName,
      providerConfig: providerConfig
        ? JSON.stringify(providerConfig)
        : undefined,
    });

    return NextResponse.json({
      provider: updated.provider,
      modelName: updated.model_name,
      providerConfig: updated.provider_config
        ? JSON.parse(updated.provider_config)
        : null,
    });
  } catch (error) {
    console.error("Failed to update user preferences:", error);
    return NextResponse.json(
      {
        error: "Failed to update preferences",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
