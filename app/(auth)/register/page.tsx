import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { auth } from "../auth";

export default async function RegisterPage() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-border border-b bg-background px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="font-semibold text-foreground text-xl">
            Create Account
          </h3>
          <p className="text-muted-foreground text-sm">
            Create your account to get started
          </p>
        </div>
        <div className="flex flex-col space-y-4 bg-muted/50 px-4 py-8 sm:px-16">
          <AuthForm type="signup" />
        </div>
      </div>
    </div>
  );
}
