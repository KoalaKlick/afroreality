"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Please enter an organization name and slug');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/organization/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) throw new Error('Failed to create organization');
      toast.success('Organization created successfully');
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
            <Input
              id="org-name"
              placeholder="e.g. fextiva Global"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
              }}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              placeholder="fextiva-global"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4" disabled={loading}>
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
