import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://fextiva.com'),
  title: {
    default: "Fextiva | Africa's Most Customizable Event Hosting, Ticketing & Voting Platform",
    template: '%s | Fextiva',
  },
  description:
    'Host, brand, and ticket African events on Fextiva. The best customizable event platform where organizers can use their own brand colors, logos, and tailored themes. Powering concerts, pub nights, and secure awards voting.',
  keywords: [
    'best customizable event hosting platform',
    'custom branded event pages',
    'custom event colors and logos',
    'white-label event ticketing Africa',
    'Fextiva events',
    'Fextiva ticketing',
    'African event platform',
    'custom event voting',
    'eventpulse',
    'eventix',
    'afrotix',
    'tix4u alternative',
    'ticketing pubs Ghana Nigeria',
    'book African events',
  ],
  category: 'Event Hosting, Ticketing & Voting Software',
  openGraph: {
    type: 'website',
    url: 'https://fextiva.com',
    title: 'Fextiva - Highly Customizable African Event Management & Voting Platform',
    description:
      'Make every event look 100% like your brand. Full customization with your brand colors, logo, custom fliers, pub ticketing, and secure online voting across Africa.',
    siteName: 'Fextiva',
    images: [
      {
        url: '/landing/a.webp',
        width: 1200,
        height: 630,
        alt: "Fextiva | Africa's Most Customizable Event Hosting, Ticketing & Voting Platform",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fextiva - Highly Customizable African Event Management & Voting Platform',
    description:
      'Make every event look 100% like your brand. Full customization with your brand colors, logo, custom fliers, pub ticketing, and secure online voting across Africa.',
    images: ['/landing/a.webp'],
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Fextiva',
  url: 'https://fextiva.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  description:
    'The premier customizable Pan-African event hosting platform. Allows organizers to fully brand their event pages with custom brand colors, logos, and themes, alongside nightlife/pub ticketing and secure public voting systems.',
  alternativeOf: [
    { '@type': 'SoftwareApplication', name: 'Eventix' },
    { '@type': 'SoftwareApplication', name: 'Tix4u' },
    { '@type': 'SoftwareApplication', name: 'Afrotix' },
  ],
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Africa',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
