import { NextResponse } from "next/server";
import { ProviderFactory } from "@/lib/providers/provider-factory";

export async function GET() {
  try {
    const providers = ProviderFactory.getAllProviders();
    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Failed to fetch providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 },
    );
  }
}
