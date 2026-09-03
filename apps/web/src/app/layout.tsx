import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: {
    default: 'Fextiva - African Event Hosting, Ticketing & Secure Voting Platform',
    template: '%s | Fextiva',
  },
  description:
    'Pan-African event hosting platform for secure voting, ticketing, and event management across Ghana, Nigeria, Kenya, South Africa, and beyond.',
  keywords: [
    'Event Hosting Platform',
    'African Ticketing',
    'Secure Event Voting',
    'Fextiva',
    'Fextiva Events',
    'Online Event Ticketing Africa',
    'USSD Event Ticketing',
    'Award Voting System Africa',
    'Pageant Voting Platform',
    'Eventbrite Africa Alternative',
    'Tix4u Alternative',
    'Eventpulse Alternative',
  ],
  category: 'Event Hosting, Ticketing & Voting Software',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
