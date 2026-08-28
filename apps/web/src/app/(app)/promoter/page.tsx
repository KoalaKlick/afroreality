export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Copy, DollarSign, Users } from "lucide-react";
import { getProfile } from "@/lib/server-functions/profile";

export default async function PromoterPage() {
  let profile = null;
  try {
    profile = await getProfile();
  } catch {}

  const referralCode = profile?.username || "organizer";

  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Promoter Dashboard" }]} />
      <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle>AfroReality Promoter Network</CardTitle>
            <CardDescription>
              Earn commissions by referring event creators and organizers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Your Referral Code</p>
                <p className="text-2xl font-bold font-mono text-primary">{referralCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
