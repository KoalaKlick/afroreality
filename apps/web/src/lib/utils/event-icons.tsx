import React from 'react';
import { Globe, Share2, Video, MessageCircle } from 'lucide-react';

export function getSocialIcon(platform: string) {
  switch (platform?.toLowerCase()) {
    case 'website':
      return <Globe className="h-4 w-4" />;
    case 'zoom':
    case 'meet':
    case 'virtual':
      return <Video className="h-4 w-4" />;
    case 'whatsapp':
      return <MessageCircle className="h-4 w-4" />;
    default:
      return <Share2 className="h-4 w-4" />;
  }
}

export function getSocialPlatform(url: string): { name: string; icon: string } {
  if (url?.includes('instagram.com')) return { name: 'Instagram', icon: 'instagram' };
  if (url?.includes('twitter.com') || url?.includes('x.com')) return { name: 'Twitter', icon: 'twitter' };
  if (url?.includes('facebook.com')) return { name: 'Facebook', icon: 'facebook' };
  if (url?.includes('youtube.com')) return { name: 'YouTube', icon: 'youtube' };
  return { name: 'Website', icon: 'globe' };
}

export function getGalleryProvider(url: string): { name: string; icon: string } {
  if (url?.includes('drive.google.com')) return { name: 'Google Drive', icon: 'drive' };
  if (url?.includes('dropbox.com')) return { name: 'Dropbox', icon: 'dropbox' };
  if (url?.includes('icloud.com')) return { name: 'iCloud', icon: 'cloud' };
  return { name: 'Gallery Link', icon: 'image' };
}
