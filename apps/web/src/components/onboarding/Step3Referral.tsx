"use client";

import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StepReferralProps {
  readonly defaultReferralCode?: string;
  readonly isCompleting?: boolean;
  readonly onSuccess?: (referralCode?: string) => void;
  readonly onSkip?: () => void;
}

export function Step3Referral({
  defaultReferralCode = "",
  isCompleting,
  onSuccess,
  onSkip,
}: StepReferralProps) {
  const [code, setCode] = useState(defaultReferralCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess?.(code.trim() || undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referral Code</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Were you referred by an event creator or partner? Enter their code below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">Referral Code (Optional)</label>
          <Input
            icon={<Gift className="size-4" />}
            placeholder="e.g. VIP2026"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>

        <div className="space-y-2 pt-2">
          <Button
            type="submit"
            className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
            disabled={isCompleting}
          >
            {isCompleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Completing Setup...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-full text-muted-foreground hover:text-foreground"
            onClick={onSkip}
            disabled={isCompleting}
          >
            Skip & Go to Dashboard
          </Button>
        </div>
      </form>
    </div>
  );
}
