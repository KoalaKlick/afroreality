import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { cookies } from "next/headers";
import { getDashboardOverview } from "@/lib/dal/dashboard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { serializeJsonSafe } from "@/lib/utils";
import { ACTIVE_ORG_COOKIE_NAME } from "@/lib/constants/config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard - fextiva",
  description: "Overview of your events, revenue, and activity",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value;
  const activeOrgId = typeof params?.org === "string" ? params.org : cookieOrg;
  const data = await getDashboardOverview(activeOrgId);

  const fallbackStats = {
    total: 0,
    published: 0,
    draft: 0,
    ongoing: 0,
    ended: 0,
    cancelled: 0,
    upcoming: 0,
    byType: {
      voting: 0,
      ticketed: 0,
      hybrid: 0,
      standard: 0,
    },
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalAttendees: 0,
    totalVotes: 0,
  };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardContent
        stats={serializeJsonSafe(data?.stats || fallbackStats)}
        profileStats={serializeJsonSafe(data?.profileStats)}
        ongoingEvents={serializeJsonSafe(data?.ongoingEvents || [])}
        recentOrders={serializeJsonSafe(data?.recentOrders || [])}
        revenueData={serializeJsonSafe(data?.revenueData || [])}
        revenueTrends={serializeJsonSafe(data?.revenueTrends)}
      />
    </Suspense>
  );
}
