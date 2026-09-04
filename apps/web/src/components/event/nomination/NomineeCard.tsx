"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Globe,
  Mail,
  Hash,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";
import type { VotingOption } from "@/lib/types/voting";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import AddFilesIcon from "@/assets/add-files.svg";

interface NomineeCardProps {
  readonly option: VotingOption;
  readonly displayImage: string | null;
  readonly canEdit: boolean;
  readonly isPending?: boolean;
  readonly requiresDeletionCode?: boolean;
  readonly onEdit: () => void;
  readonly onDelete: (code?: string) => void;
  readonly onApprove?: () => void;
  readonly onReject?: () => void;
}

export function NomineeCard({
  option,
  displayImage,
  canEdit,
  isPending = false,
  requiresDeletionCode = false,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: NomineeCardProps) {
  const [delCode, setDelCode] = useState("");
  const displayImageUrl = displayImage ? (getEventImageUrl(displayImage) || null) : null;

  const votesCount = Number(option.votesCount || 0);
  const hasVotes = votesCount > 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between h-full gap-2.5 rounded-2xl bg-card p-2.5 transition-all duration-300 hover:shadow-md",
        option.status === "pending" && "ring-2 ring-yellow-500/50",
        option.status === "rejected" && "opacity-60",
      )}
    >
      {/* Portrait Poster Container */}
      <div className="relative aspect-4/5 w-full rounded-xl overflow-hidden bg-muted flex items-center justify-center shadow-none shrink-0">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={option.optionText}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="size-full flex flex-col items-center justify-center bg-muted/60 text-muted-foreground gap-1.5 p-3 text-center">
            <AddFilesIcon className="size-8 text-primary/60" />
            <span className="text-[10px] font-medium text-muted-foreground">No Photo</span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-200" />

        {/* Top-Left: Status Badge or Code Badge */}
        {option.status && option.status !== "approved" ? (
          <div className="absolute top-2 left-2 z-10">
            <StatusBadge variant={(option.status || "active") as any} size="sm" />
          </div>
        ) : option.nomineeCode ? (
          <div className="absolute top-2 left-2 bg-background/95 backdrop-blur-md rounded-md py-0.5 px-2 flex items-center gap-1 border border-border/70 shadow-none z-10">
            <span className="text-[10px] font-mono font-bold text-primary">
              #{option.nomineeCode}
            </span>
          </div>
        ) : null}

        {/* Top-Right: Public nomination indicator */}
        {option.isPublicNomination && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="outline" className="bg-background/90 backdrop-blur-md text-[10px] font-bold px-1.5 py-0.5 border-border/70 flex items-center gap-1">
              <Globe className="size-2.5 text-primary" />
              Public
            </Badge>
          </div>
        )}

        {/* Hover Actions */}
        {canEdit && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
            {option.status === "pending" ? (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-8 bg-green-500 hover:bg-green-600 text-white"
                  onClick={onApprove}
                  disabled={isPending}
                  title="Approve"
                >
                  <CheckCircle2 className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="size-8"
                  onClick={onReject}
                  disabled={isPending}
                  title="Reject"
                >
                  <XCircle className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-8 bg-background/90 hover:bg-background text-foreground"
                  onClick={onEdit}
                  title="Edit Nominee"
                >
                  <Pencil className="size-3.5" />
                </Button>
                {hasVotes ? (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-8 bg-background/80 text-muted-foreground opacity-50 cursor-not-allowed hover:bg-background/80 hover:text-muted-foreground"
                    disabled
                    title={`Cannot delete nominee with ${votesCount.toLocaleString()} recorded vote${votesCount > 1 ? "s" : ""}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : requiresDeletionCode ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" className="size-8" title="Delete Nominee">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Nominee?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove {option.optionText} from this category.
                          <div className="mt-4 space-y-2">
                            <Label htmlFor="del-code">Enter 6-digit Deletion Code</Label>
                            <Input
                              id="del-code"
                              placeholder="000000"
                              value={delCode}
                              onChange={(e) => setDelCode(e.target.value)}
                              maxLength={6}
                              className="text-center font-mono text-xl tracking-widest"
                            />
                            <p className="text-xs text-muted-foreground">
                              This nominee paid a fee. The code was sent to their email.
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDelCode("")}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={delCode.length !== 6}
                          onClick={() => {
                            onDelete(delCode);
                            setDelCode("");
                          }}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="size-8"
                    onClick={() => onDelete()}
                    title="Delete Nominee"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-1 px-1">
        <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {option.optionText}
        </p>
        <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
          <span className="font-bold text-primary text-xs">
            {Number(option.votesCount || 0).toLocaleString()} votes
          </span>
          {option.nomineeCode && (
            <span className="font-mono text-[10px] text-muted-foreground">
              #{option.nomineeCode}
            </span>
          )}
        </div>
        {option.email && (
          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
            <Mail className="size-3 shrink-0" />
            <span className="truncate">{option.email}</span>
          </p>
        )}
        {option.isPublicNomination && option.nominatedByName && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            By: {option.nominatedByName}
          </p>
        )}
      </div>
    </div>
  );
}
