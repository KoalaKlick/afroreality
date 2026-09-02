import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In - fextiva",
  description: "Sign in to your fextiva account",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const verified = params.verified === "true" || params.verified === "1";
  const next = params.next || null;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      }
    >
      <LoginForm verified={verified} next={next} />
    </Suspense>
  );
}
