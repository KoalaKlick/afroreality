"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { SponsorDialog } from '@/components/event/tabs/SponsorDialog';
import { getSponsorImageUrl } from '@/lib/image-url-utils';
import type { EventSponsor } from '@/components/event/tabs/types';

export function EventStep4Extras({
  initialData,
  onSuccess,
  onBack,
  isSubmitting,
}: {
  initialData?: any;
  onSuccess?: (data: any) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
}) {
  const [sponsors, setSponsors] = React.useState<EventSponsor[]>(
    (initialData?.sponsors ?? []).map((s: any) => ({ name: s.name ?? '', logo: s.logo ?? null })),
  );
  const [socialLinks, setSocialLinks] = React.useState<any[]>(initialData?.socialLinks || []);
  const [galleryLinks, setGalleryLinks] = React.useState<any[]>(initialData?.galleryLinks || []);

  const [sponsorModalOpen, setSponsorModalOpen] = React.useState(false);
  const [selectedSponsorIndex, setSelectedSponsorIndex] = React.useState<number | null>(null);

  const addSocial = () => setSocialLinks([...socialLinks, { url: '' }]);
  const removeSocial = (index: number) => setSocialLinks(socialLinks.filter((_, i) => i !== index));
  const updateSocial = (index: number, val: string) => {
    const next = [...socialLinks];
    next[index] = { url: val };
    setSocialLinks(next);
  };

  const addGallery = () => setGalleryLinks([...galleryLinks, { name: '', url: '' }]);
  const removeGallery = (index: number) => setGalleryLinks(galleryLinks.filter((_, i) => i !== index));
  const updateGallery = (index: number, field: string, val: string) => {
    const next = [...galleryLinks];
    next[index] = { ...next[index], [field]: val };
    setGalleryLinks(next);
  };

  const handleNext = () => {
    onSuccess?.({ sponsors, socialLinks, galleryLinks });
  };

  const handleSaveSponsor = (sponsorData: EventSponsor) => {
    if (selectedSponsorIndex !== null) {
      setSponsors((prev) =>
        prev.map((s, i) => (i === selectedSponsorIndex ? sponsorData : s)),
      );
    } else {
      setSponsors((prev) => [...prev, sponsorData]);
    }
    setSponsorModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-semibold">Sponsors</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedSponsorIndex(null);
              setSponsorModalOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Sponsor
          </Button>
        </div>
        <div className="flex gap-4 flex-wrap">
          {sponsors.map((s, idx) => (
            <div
              key={idx}
              className="group relative p-4 rounded-xl border bg-card hover:border-primary/50 transition-all flex flex-col items-center gap-2 text-center w-32"
            >
              <div className="size-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                {s.logo ? (
                  <img
                    src={getSponsorImageUrl(s.logo) ?? ""}
                    alt={s.name}
                    className="size-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground opacity-30" />
                )}
              </div>
              <h4 className="text-xs font-bold truncate w-full">{s.name}</h4>
              <div className="flex gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-6 bg-background/80"
                  onClick={() => {
                    setSelectedSponsorIndex(idx);
                    setSponsorModalOpen(true);
                  }}
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-6 bg-background/80 text-destructive hover:text-destructive"
                  onClick={() =>
                    setSponsors((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
          {sponsors.length === 0 && (
            <div className="w-full py-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/10">
              <ImageIcon className="size-8 opacity-20" />
              <p className="text-sm">No sponsors added yet</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-semibold">Social Links</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSocial}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Link
          </Button>
        </div>
        {socialLinks.map((sl, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input placeholder="https://instagram.com/..." value={sl.url || ''} onChange={(e) => updateSocial(idx, e.target.value)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeSocial(idx)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-semibold">Gallery Links</Label>
          <Button type="button" variant="outline" size="sm" onClick={addGallery}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Gallery
          </Button>
        </div>
        {galleryLinks.map((g, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input placeholder="Title" value={g.name || ''} onChange={(e) => updateGallery(idx, 'name', e.target.value)} />
            <Input placeholder="URL" value={g.url || ''} onChange={(e) => updateGallery(idx, 'url', e.target.value)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeGallery(idx)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="button" onClick={handleNext} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </Button>
      </div>

      <SponsorDialog
        open={sponsorModalOpen}
        onOpenChange={setSponsorModalOpen}
        sponsor={selectedSponsorIndex !== null ? sponsors[selectedSponsorIndex] ?? null : null}
        onSave={handleSaveSponsor}
        isPending={false}
      />
    </div>
  );
}
