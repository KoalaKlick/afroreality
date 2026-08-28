"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { addEventMember } from '@/lib/server-functions/event-member';
import { toast } from 'sonner';

export function AddMemberDialog({
  open,
  onOpenChange,
  eventId,
  onAdd,
  onBulkAdd,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  onAdd?: (data: { name: string; email: string; phone: string }) => Promise<void>;
  onBulkAdd?: (newMembers: any[]) => Promise<void>;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setLoading(true);
    try {
      if (onAdd) {
        await onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      } else if (eventId) {
        await addEventMember({
          data: {
            eventId,
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
          },
        });
      }
      toast.success('Member added successfully');
      setName('');
      setEmail('');
      setPhone('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Event Attendee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="mem-name">Full Name *</Label>
            <Input id="mem-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
          </div>
          <div>
            <Label htmlFor="mem-email">Email Address</Label>
            <Input id="mem-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div>
            <Label htmlFor="mem-phone">Phone Number</Label>
            <Input id="mem-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233..." />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
