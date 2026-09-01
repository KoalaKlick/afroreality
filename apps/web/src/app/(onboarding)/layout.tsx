import Link from "next/link";
import { AfricaMap } from "@/components/shared/africa-map";
import { FextivaLogo } from "@/components/shared/FextivaLogo";

export const metadata = {
  title: "Onboarding - fextiva",
  description: "Set up your fextiva organization and account",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh bg-background lg:bg-transparent flex flex-col lg:flex-row font-poppins overflow-hidden">
      {/* Left hero / brand side with animated Africa Map */}
      <div className="relative w-full lg:w-1/2 h-[35dvh] lg:h-full overflow-hidden shadow bg-secondary-50 flex-shrink-0">
        <AfricaMap
          images={["/landing/g.webp", "/landing/b.webp", "/landing/h.webp"]}
          interval={9000}
          showHoverColor={true}
          showTransitionColor={false}
        />

        {/* Hero copy */}
        <div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 lg:space-y-6 max-w-[15rem] sm:max-w-[18rem] md:max-w-xs pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <Link href="/" className="pointer-events-auto">
              <FextivaLogo className="w-28 sm:w-32 md:w-36 lg:w-40 h-auto p-2 bg-secondary-50/90 backdrop-blur-sm rounded-lg" />
            </Link>
          </div>
          <span className="mt-2 text-sm inline bg-secondary-50/90 dark:bg-zinc-900/90 px-2 py-1 backdrop-blur-sm font-medium text-foreground/80 rounded box-decoration-clone">
            Create your organization and start publishing world-class events.
          </span>
        </div>
      </div>

      {/* Right onboarding content - scrollable side */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col bg-background rounded-t-[2.5rem] lg:rounded-none -mt-10 lg:mt-0 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] lg:shadow-none overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 lg:px-14">
          <div className="w-full max-w-md flex flex-col justify-between">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
