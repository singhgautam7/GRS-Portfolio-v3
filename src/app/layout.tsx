import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider, themeNoFlashScript } from '@/components/providers/ThemeProvider';
import { SiteChrome } from '@/components/chrome/SiteChrome';
import { SITE } from '@/lib/site';

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}, Software Engineer`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: `${SITE.shortName} Portfolio`,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  keywords: [
    'Gautam Singh',
    'software engineer',
    'backend',
    'cloud infrastructure',
    'Go',
    'Kubernetes',
    'Terraform',
    'AI systems',
  ],
  openGraph: {
    type: 'website',
    siteName: `${SITE.name} Portfolio`,
    title: `${SITE.name}, Software Engineer`,
    description: SITE.description,
    url: SITE.url,
    images: [{ url: '/og/og-default.png', width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name}, Software Engineer`,
    description: SITE.description,
    images: ['/og/og-default.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0e14' },
    { media: '(prefers-color-scheme: light)', color: '#f3f6fb' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className={`${sans.variable} ${mono.variable}`}>
        <ThemeProvider>
          <SiteChrome>{children}</SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
