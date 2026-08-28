"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface StepOrgBrandingProps {
  readonly orgName?: string;
  readonly defaultValues?: {
    logoUrl?: string;
    description?: string;
  };
  readonly isCompleting?: boolean;
  readonly onSubmit?: (data: { logoUrl?: string; description?: string }) => void;
  readonly onSkip?: () => void;
}

export function Step5OrgBranding({
  orgName = "Your Organization",
  defaultValues,
  isCompleting,
  onSubmit,
  onSkip,
}: StepOrgBrandingProps) {
  const [description, setDescription] = useState(defaultValues?.description ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization Bio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a brief description for <span className="font-semibold text-foreground">{orgName}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">About Organization</label>
          <Textarea
            placeholder="Tell your attendees what your organization or brand is all about..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="resize-none"
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
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-full text-muted-foreground hover:text-foreground"
            onClick={onSkip}
            disabled={isCompleting}
          >
            Skip for now
          </Button>
        </div>
      </form>
    </div>
  );
}
