"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { AcceptButton } from './AcceptButton';
import { InviteLoginForm } from './InviteLoginForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export function InviteAcceptClient({ invitation }: { invitation: any }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Organization Invitation</CardTitle>
          <CardDescription>
            You have been invited to join <span className="font-semibold text-neutral-900 dark:text-white">{invitation.organizationName}</span> as a <span className="font-semibold capitalize">{invitation.role}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-neutral-500">Logged in as <span className="font-semibold">{user.email}</span></p>
              <AcceptButton token={invitation.token} />
            </div>
          ) : (
            <InviteLoginForm token={invitation.token} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
