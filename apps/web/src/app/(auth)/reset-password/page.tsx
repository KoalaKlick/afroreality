import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { ResetPasswordContent } from "@/components/auth/reset-password-content";

export const metadata = {
  title: "Reset Password - fextiva",
  description: "Enter your new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string; otp?: string }>;
}) {
  const params = await searchParams;
  const email = params.email || "";
  const token = params.token || params.otp || "";

  return (
    <>
      <p className="hidden md:block text-sm text-right text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold hover:underline text-red-500">
          Sign In
        </Link>
      </p>
      <div className="w-full space-y-6 flex-1 flex flex-col justify-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create New Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a new password for your account below.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          }
        >
          <ResetPasswordContent email={email} token={token} />
        </Suspense>
      </div>
    </>
  );
}
