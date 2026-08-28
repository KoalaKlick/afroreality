import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { prisma } from "@repo/db";
import { getProfile } from "@/lib/server-functions/profile";
import { getPendingInvitationsForEmail } from "@/lib/server-functions/organization-join";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireSession().catch(() => null);
  if (!session) {
    redirect("/login?redirectTo=/onboarding");
  }

  const [profile, memberCount] = await Promise.all([
    getProfile().catch(() => null),
    prisma.teamMember.count({
      where: { userId: session.userId },
    }).catch(() => 0),
  ]);

  // If user already completed onboarding or belongs to an organization, go to dashboard
  if (profile?.onboardingCompleted || memberCount > 0) {
    redirect("/dashboard");
  }

  const pendingInvitations = await getPendingInvitationsForEmail().catch(() => []);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
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
