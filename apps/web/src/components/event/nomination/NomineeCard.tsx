"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
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

interface NomineeCardProps {
  readonly option: VotingOption;
  readonly displayImage: string | null;
  readonly canEdit: boolean;
  readonly isPending: boolean;
  readonly requiresDeletionCode: boolean;
  readonly onEdit: () => void;
  readonly onDelete: (code?: string) => void;
  readonly onApprove: () => void;
  readonly onReject: () => void;
}

export function NomineeCard({
  option,
  displayImage,
  canEdit,
  isPending,
  requiresDeletionCode,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: NomineeCardProps) {
  const [delCode, setDelCode] = useState("");
  const displayImageUrl = displayImage ? (getEventImageUrl(displayImage) || null) : null;

  return (
    <Card
      className={cn(
        "overflow-hidden group p-0",
        option.status === "pending" && "ring-2 ring-yellow-500/50",
        option.status === "rejected" && "opacity-50",
      )}
    >
      <div className="aspect-square relative bg-muted">
        {displayImageUrl ? (
          <img src={displayImageUrl} alt={option.optionText} className="size-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="size-8 text-muted-foreground" />
          </div>
        )}

        {/* Status Badge */}
        {option.status !== "approved" && (
          <div className="absolute top-2 left-2">
            <StatusBadge variant={(option.status || "active") as any} size="sm" />
          </div>
        )}

        {/* Public nomination indicator */}
        {option.isPublicNomination && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-background/80 text-xs">
              <Globe className="size-3" />
            </Badge>
          </div>
        )}

        {/* Hover Actions */}
        {canEdit && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {option.status === "pending" ? (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={onApprove}
                  disabled={isPending}
                >
                  <CheckCircle2 className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={onReject}
                  disabled={isPending}
                >
                  <XCircle className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="icon" variant="secondary" onClick={onEdit}>
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Nominee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove {option.optionText} from this category.
                        {requiresDeletionCode && (
                          <div className="mt-4 space-y-2">
                            <Label htmlFor="del-code">
                              Enter 6-digit Deletion Code
                            </Label>
                            <Input
                              id="del-code"
                              placeholder="000000"
                              value={delCode}
                              onChange={(e) => setDelCode(e.target.value)}
                              maxLength={6}
                              className="text-center font-mono text-xl tracking-widest"
                            />
                            <p className="text-xs text-muted-foreground">
                              This nominee paid a fee. The code was sent to
                              their email.
                            </p>
                          </div>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDelCode("")}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={requiresDeletionCode && delCode.length !== 6}
                        onClick={() => {
                          onDelete(requiresDeletionCode ? delCode : undefined);
                          setDelCode("");
                        }}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-3">
        <p className="font-medium text-sm truncate">{option.optionText}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {option.nomineeCode && (
            <span className="flex items-center gap-1">
              <Hash className="size-3" />
              {option.nomineeCode}
            </span>
          )}
          <span>{Number(option.votesCount)} votes</span>
        </div>
        {option.email && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
            <Mail className="size-3" />
            {option.email}
          </p>
        )}
        {option.isPublicNomination && option.nominatedByName && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            Nominated by: {option.nominatedByName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
