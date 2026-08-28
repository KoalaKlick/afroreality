"use client";

import { useState, useTransition } from "react";
import { OnboardingProgress } from "./OnboardingProgress";
import { Step4OrgInfo } from "./Step4OrgInfo";
import { Step5OrgBranding } from "./Step5OrgBranding";
import { Step3Referral } from "./Step3Referral";
import { completeOnboardingFlow, setOnboardingStep } from "@/lib/server-functions/profile";
import { createOrganizationAccount } from "@/lib/server-functions/organization";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import {
  PendingInvitationsStep,
  type PendingInvitationItem,
} from "./PendingInvitationsStep";

interface OnboardingClientProps {
  readonly initialStep?: number;
  readonly initialProfile?: {
    email?: string | null;
    username?: string | null;
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
  readonly pendingInvitations?: PendingInvitationItem[];
}

export function OnboardingClient({
  initialStep = 0,
  initialProfile,
  pendingInvitations = [],
}: OnboardingClientProps) {
  const hasInvites = pendingInvitations.length > 0;
  const [showInvites, setShowInvites] = useState(hasInvites);
  const clampedStep = Math.min(Math.max(initialStep, 0), 2);
  const [currentStep, setCurrentStep] = useState(clampedStep);
  const [isCompleting, startTransition] = useTransition();

  const defaultUsername =
    initialProfile?.username ||
    (initialProfile?.email
      ? (initialProfile.email as string).split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user"
      : "user");

  // Organization data state
  const [orgData, setOrgData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  // Step 1: Org Info
  const handleStep1OrgSuccess = (data: { name: string; slug: string }) => {
    setOrgData((prev) => ({ ...prev, ...data }));
    setCurrentStep(1);
    void setOnboardingStep({ data: { step: 1 } });
  };

  // Step 2: Org Branding
  const handleStep2BrandingSuccess = (brandingData?: { description?: string }) => {
    if (brandingData?.description) {
      setOrgData((prev) => ({ ...prev, description: brandingData.description || "" }));
    }
    setCurrentStep(2);
    void setOnboardingStep({ data: { step: 2 } });
  };

  // Step 3: Referral & Finalize
  const handleFinalize = (referralCode?: string) => {
    startTransition(async () => {
      try {
        if (orgData.name && orgData.slug) {
          await createOrganizationAccount({
            data: {
              name: orgData.name,
              slug: orgData.slug,
              description: orgData.description || undefined,
            },
          });
        }

        await completeOnboardingFlow({
          data: {
            username: defaultUsername,
            fullName: initialProfile?.fullName || defaultUsername,
            referralCode: referralCode || undefined,
          },
        });

        toast.success("Welcome aboard! Your organization is ready.");
        window.location.href = "/dashboard";
      } catch (err: unknown) {
        toast.error(getErrorMessage(err));
      }
    });
  };

  return (
    <div className="w-full flex flex-col justify-between">
      {!showInvites && (
        <OnboardingProgress currentStep={currentStep} />
      )}

      {showInvites ? (
        <PendingInvitationsStep
          invitations={pendingInvitations}
          username={defaultUsername}
          fullName={initialProfile?.fullName || defaultUsername}
          onSkipToCreateOrg={() => setShowInvites(false)}
        />
      ) : (
        <>
          {/* Step 1: Organization Details */}
          {currentStep === 0 && (
            <Step4OrgInfo
              defaultValues={{
                name: orgData.name,
                slug: orgData.slug,
              }}
              onSuccess={handleStep1OrgSuccess}
            />
          )}

          {/* Step 2: Organization Bio */}
          {currentStep === 1 && (
            <Step5OrgBranding
              orgName={orgData.name || "Your Organization"}
              defaultValues={{
                description: orgData.description,
              }}
              onSubmit={handleStep2BrandingSuccess}
              onSkip={() => handleStep2BrandingSuccess(undefined)}
            />
          )}

          {/* Step 3: Referral & Complete */}
          {currentStep === 2 && (
            <Step3Referral
              isCompleting={isCompleting}
              onSuccess={handleFinalize}
              onSkip={() => handleFinalize(undefined)}
            />
          )}
        </>
      )}
    </div>
  );
}
