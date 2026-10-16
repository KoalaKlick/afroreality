"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, Globe, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { createOrganizationAccount, setActiveOrganization } from '@/lib/server-functions/organization';
import { orgPhoneSchema } from '@/lib/validations/organization';

export function CreateOrgDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Please enter an organization name and slug');
      return;
    }

    if (phone.trim()) {
      const parsed = orgPhoneSchema.safeParse(phone.trim());
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? 'Invalid contact phone number');
        return;
      }
    }

    setLoading(true);
    try {
      const newOrg = await createOrganizationAccount({
        data: {
          name: name.trim(),
          slug: slug.trim(),
          phone: phone.trim() || undefined,
        },
      });

      if (newOrg?.id) {
        await setActiveOrganization(newOrg.id);
      }

      toast.success('Organization created successfully');
      setName('');
      setSlug('');
      setPhone('');
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Error creating organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create New Organization</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="org-name">Organization Name</Label>
            <div className="relative mt-1.5">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="org-name"
                placeholder="e.g. Fextiva Global"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="org-slug">Slug / Portal Handle</Label>
            <div className="relative mt-1.5">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="org-slug"
                placeholder="fextiva-global"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="org-phone">Contact Phone Number</Label>
              <span className="text-xs text-muted-foreground">Recommended</span>
            </div>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="org-phone"
                placeholder="e.g. 024 123 4567 or +233..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Used as your verified contact. Setting up payouts with this number skips PIN and OTP confirmation.
            </p>
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
