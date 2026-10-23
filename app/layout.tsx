import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-sans',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://boostov.ma';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'boostov.ma - NFC review cards for local businesses',
    template: '%s · boostov.ma',
  },
  description: 'Tap the NFC card, leave a Google review, and get a reward for your next visit.',
  applicationName: 'boostov.ma',
  openGraph: {
    type: 'website',
    siteName: 'boostov.ma',
    title: 'boostov.ma - NFC review cards for local businesses',
    description: 'Tap the NFC card, leave a Google review, and get a reward for your next visit.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'boostov.ma logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'boostov.ma',
    description: 'Tap the NFC card, leave a Google review, and get a reward for your next visit.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#0B1120',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="min-h-dvh bg-[#F8FAFC] text-[#0F172A] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
