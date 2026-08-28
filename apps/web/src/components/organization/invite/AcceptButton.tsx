"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { acceptOrgInvitation } from '@/lib/server-functions/organization-join';
import { toast } from 'sonner';

export function AcceptButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptOrgInvitation({ data: { token } });
      toast.success('Joined organization successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleAccept} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
      {loading ? 'Joining...' : 'Accept & Join Organization'}
    </Button>
  );
}
