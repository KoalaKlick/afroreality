import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://fextiva.com'),
  title: {
    default: "Fextiva | Africa's Ultimate Event Ticketing, Pubs & Voting Platform",
    template: '%s | Fextiva',
  },
  description:
    'Discover, ticket, and host African events on Fextiva. The leading platform for concerts, pub nights, secure awards voting, and ticketing. Better than Tix4u, Eventix, and Afrotix.',
  keywords: [
    'Fextiva events',
    'Fextiva ticketing',
    'African event platform',
    'eventpulse',
    'eventix',
    'afrotix',
    'voting platform Africa',
    'ticketing pubs Ghana Nigeria',
    'book African events',
  ],
  category: 'Event Hosting, Ticketing & Voting Software',
  openGraph: {
    type: 'website',
    url: 'https://fextiva.com',
    title: 'Fextiva - African Event Management & Voting Platform',
    description:
      'Host general events, manage pub ticketing, or run secure online voting across Africa.',
    siteName: 'Fextiva',
    images: [
      {
        url: '/landing/a.webp',
        width: 1200,
        height: 630,
        alt: "Fextiva | Africa's Ultimate Event Ticketing, Pubs & Voting Platform",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fextiva - African Event Management & Voting Platform',
    description:
      'Host general events, manage pub ticketing, or run secure online voting across Africa.',
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
    'A comprehensive Pan-African event hosting platform specializing in general events, nightlife/pub ticketing, and secure public voting systems.',
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
