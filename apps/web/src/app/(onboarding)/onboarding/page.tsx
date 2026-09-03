import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { prisma } from "@repo/db";
import { getProfile } from "@/lib/server-functions/profile";
import { getPendingInvitationsForEmail } from "@/lib/server-functions/organization-join";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";
import { requireOnboardingAccess } from "@/lib/auth-guards";
import { redirect } from "next/navigation";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  // Authoritative, DB-backed guard: signed in, email verified (if new),
  // and not already onboarded.
  const state = await requireOnboardingAccess();

  const [profile, memberCount] = await Promise.all([
    getProfile().catch(() => null),
    prisma.teamMember.count({
      where: { userId: state.userId },
    }).catch(() => 0),
  ]);

  // If user already belongs to an organization, go to dashboard
  if (memberCount > 0) {
    redirect("/dashboard");
  }

  const pendingInvitations = await getPendingInvitationsForEmail().catch(() => []);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OnboardingClient
        initialStep={profile?.onboardingStep || 0}
        initialProfile={serializeJsonSafe(profile)}
        pendingInvitations={serializeJsonSafe(pendingInvitations)}
      />
    </Suspense>
  );
}
