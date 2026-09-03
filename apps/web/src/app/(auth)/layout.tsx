
import Link from "next/link";
import { getAuthState, mustVerifyEmail } from "@/lib/auth-guards";
import { redirect } from "next/navigation";
import AfricaMap, { FextivaLogo } from "@/components/shared/africa-map";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fully authenticated (onboarded or grandfathered legacy) users are sent to
  // their natural home so they never see auth screens again.
  // New accounts that still need to verify their email are intentionally NOT
  // redirected here — /verify lives inside this group and the proxy already
  // funnels them there from login/register/onboarding.
  const state = await getAuthState();
  if (state && !mustVerifyEmail(state)) {
    redirect(state.onboardingCompleted ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="h-dvh bg-background lg:bg-transparent flex flex-col lg:flex-row font-poppins overflow-hidden">
      {/* Left hero / brand side with animated Africa Map */}
      <div className="relative w-full lg:w-1/2 h-[35dvh] lg:h-full overflow-hidden bg-secondary-50 dark:bg-zinc-950 flex-shrink-0 [--left-bg:var(--color-secondary-50)] dark:[--left-bg:#09090b]">
        <AfricaMap
          images={["/landing/g.webp", "/landing/b.webp", "/landing/h.webp"]}
          interval={9000}
          showHoverColor={true}
          showTransitionColor={false}
        />

        {/* Hero copy */}
        <div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 lg:space-y-6 max-w-[10rem] sm:max-w-[12rem] md:max-w-[10rem] pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <Link href="/" className="pointer-events-auto">
              <FextivaLogo
                withStroke={true}
                strokeWidth={16}
                strokeColor="var(--left-bg, #f8f5f1)"
                className="w-28 sm:w-32 md:w-36 lg:w-40 h-auto shadow-none"
              />
            </Link>
          </div>
          <span className="mt-2 text-sm inline bg-secondary-50/90 dark:bg-zinc-900/90 px-2 py-1 backdrop-blur-sm font-medium text-foreground/80 rounded box-decoration-clone">
            Discover and book the hottest events across the continent.
          </span>
        </div>
      </div>

      {/* Right auth content - this is the scrollable side */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col bg-background rounded-t-[2.5rem] lg:rounded-none -mt-10 lg:mt-0 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 lg:px-16">
          <div className="w-full max-w-md flex flex-col justify-between">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
