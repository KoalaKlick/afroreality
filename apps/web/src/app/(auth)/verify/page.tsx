import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { VerificationContent } from "@/components/auth/verification-content";

export const metadata = {
  title: "Verify Email - fextiva",
  description: "Verify your email address",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const params = await searchParams;
  const email = params.email || "";
  const next = params.next || null;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <VerificationContent email={email} next={next} />
    </Suspense>
  );
}
