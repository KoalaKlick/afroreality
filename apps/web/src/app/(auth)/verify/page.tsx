import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { VerificationContent } from "@/components/auth/verification-content";

export const metadata = {
  title: "Verify Account - fextiva",
  description: "Verify your account",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; phone?: string; next?: string }>;
}) {
  const params = await searchParams;
  const email = params.email || "";
  const phone = params.phone || "";
  const next = params.next || null;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <VerificationContent email={email} phone={phone} next={next} />
    </Suspense>
  );
}
