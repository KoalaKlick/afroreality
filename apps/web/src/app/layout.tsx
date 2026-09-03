import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fextiva.com'),
  title: {
    default: "Fextiva | Africa's Most Customizable Event Platform - Ticketing, General Events & Voting",
    template: '%s | Fextiva',
  },
  description:
    'Host, brand, and promote African events on Fextiva. The most customizable and trusted platform for free general events for brand advertisement, nightlife & pub ticketing, and secure awards voting.',
  keywords: [
    'best customizable event hosting platform',
    'general event hosting Africa',
    'free event advertisement platform',
    'custom branded event pages',
    'custom event colors and logos',
    'white-label event ticketing Africa',
    'trusted African event platform',
    'Fextiva events',
    'Fextiva ticketing',
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
    url: 'https://www.fextiva.com',
    title: 'Fextiva - Highly Customizable African Event Platform | General Events, Ticketing & Voting',
    description:
      'Host free general events for brand advertisement, club ticketing, or secure voting. Fully customize with your brand colors and logo on a platform your attendees can trust.',
    siteName: 'Fextiva',
    images: [
      {
        url: '/landing/a.webp',
        width: 1200,
        height: 630,
        alt: "Fextiva | Africa's Most Customizable Event Platform",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fextiva - Highly Customizable African Event Platform | General Events, Ticketing & Voting',
    description:
      'Host free general events for brand advertisement, club ticketing, or secure voting. Fully customize with your brand colors and logo on a platform your attendees can trust.',
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
  url: 'https://www.fextiva.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  description:
    'The premier customizable and trusted Pan-African event hosting platform. Allows organizers to host free general events for brand advertisement, full bespoke branding with custom colors and logos, nightlife/pub ticketing, and secure public voting systems.',
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
