import { redirect } from "next/navigation";
import { signIn } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get("redirectUrl");

  await signIn("guest", {
    redirect: false,
  });

  if (redirectUrl && (redirectUrl.startsWith("/") || redirectUrl.startsWith("http"))) {
    redirect(redirectUrl as any);
  }

  redirect("/");
}
