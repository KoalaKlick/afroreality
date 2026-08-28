"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

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
  const [sponsors, setSponsors] = React.useState<any[]>(initialData?.sponsors || []);
  const [socialLinks, setSocialLinks] = React.useState<any[]>(initialData?.socialLinks || []);
  const [galleryLinks, setGalleryLinks] = React.useState<any[]>(initialData?.galleryLinks || []);

  const addSponsor = () => setSponsors([...sponsors, { name: '', logo: null }]);
  const removeSponsor = (index: number) => setSponsors(sponsors.filter((_, i) => i !== index));
  const updateSponsor = (index: number, field: string, val: string) => {
    const next = [...sponsors];
    next[index] = { ...next[index], [field]: val };
    setSponsors(next);
  };

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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-semibold">Sponsors</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSponsor}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Sponsor
          </Button>
        </div>
        {sponsors.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input placeholder="Sponsor Name" value={s.name || ''} onChange={(e) => updateSponsor(idx, 'name', e.target.value)} />
            <Input placeholder="Logo URL" value={s.logo || ''} onChange={(e) => updateSponsor(idx, 'logo', e.target.value)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeSponsor(idx)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
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
    </div>
  );
}
