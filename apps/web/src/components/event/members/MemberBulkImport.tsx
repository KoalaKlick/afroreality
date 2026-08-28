"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { bulkAddEventMembers } from '@/lib/server-functions/event-member';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

export function MemberBulkImport({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess?: () => void;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const parsed = lines.slice(1).map((line) => {
        const [name, email, phone] = line.split(',').map((s) => s.trim());
        return { name, email, phone };
      }).filter((m) => m.name);
      setMembers(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (members.length === 0) {
      toast.error('No members to import');
      return;
    }
    setLoading(true);
    try {
      await bulkAddEventMembers({
        data: { eventId, members },
      });
      toast.success(`Successfully imported ${members.length} members`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import Attendees</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border-2 border-dashed border-neutral-200 p-6 text-center dark:border-neutral-800">
            <Upload className="mx-auto h-8 w-8 text-neutral-400" />
            <p className="mt-2 text-xs text-neutral-500">Upload a CSV with columns: name, email, phone</p>
            <input type="file" accept=".csv" onChange={handleFileChange} className="mt-4 text-xs" />
          </div>
          {members.length > 0 && (
            <p className="text-xs font-semibold text-emerald-600">{members.length} records ready for import</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={loading || members.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading ? 'Importing...' : `Import (${members.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
