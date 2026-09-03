import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Create Account - fextiva",
  description: "Create your fextiva account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next || null;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterForm next={next} />
    </Suspense>
  );
}
