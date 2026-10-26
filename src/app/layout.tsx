import type { Metadata, Viewport } from 'next';
import './globals.css';
import { fontVariables } from '@/styles/fonts';
import { ThemeProvider, themeNoFlashScript } from '@/components/providers/ThemeProvider';
import { SiteChrome } from '@/components/chrome/SiteChrome';
import { SITE } from '@/lib/site';

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
    // --bg per mode (src/styles/tokens.css); metadata cannot read CSS variables.
    { media: '(prefers-color-scheme: dark)', color: '#0A0C0D' },
    { media: '(prefers-color-scheme: light)', color: '#EFEBE4' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body>
        <ThemeProvider>
          <SiteChrome>{children}</SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
