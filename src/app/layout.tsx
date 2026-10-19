import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartProvider } from '@/components/cart/CartProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { getContactSettings } from '@/lib/site-settings';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Server Factory — Enterprise Servers, Workstations & Components',
    template: '%s | Server Factory',
  },
  description:
    'Server Factory (Bytechip Technologies): Buy Dell, HP, Lenovo & NVIDIA enterprise servers, GPU workstations, storage and components online. Fast delivery from Bangalore across India.',
  keywords: [
    'Server Factory', 'Bytechip Technologies', 'servers Bangalore', 'buy servers India',
    'dedicated servers', 'GPU servers', 'rack servers Bangalore', 'JP Nagar server store',
    'Dell PowerEdge', 'HP ProLiant', 'Lenovo ThinkSystem', 'workstations', 'refurbished servers',
    'server components', 'Xeon processors', 'enterprise storage', 'server India',
  ],
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Server Factory',
    title: 'Server Factory — Enterprise Servers & Workstations',
    description: 'Configure and buy enterprise servers, GPU workstations and components online from Bangalore.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Server Factory — Enterprise Servers & Workstations',
    description: 'Configure and buy enterprise servers, GPU workstations and components online from Bangalore.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#061527' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const contact = await getContactSettings();

  return (
    <html lang="en">
      <head>
        {/* Runtime font loading — avoids build-time Google Fonts fetch errors */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('serverfactory.theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Bytechip Technologies (The Server Factory)',
              url: siteUrl,
              logo: `${siteUrl}/logo.svg`,
              sameAs: [],
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'No. 8, 24th Main Road, JP Nagar 7th Phase',
                addressLocality: 'Bangalore',
                postalCode: '560078',
                addressRegion: 'Karnataka',
                addressCountry: 'IN',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Sales & Support',
                email: contact.email,
                telephone: contact.phone,
                areaServed: 'IN',
              },
            }),
          }}
        />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <CartProvider>
            <Navbar />
            <main className="min-h-[70vh]">{children}</main>
            <Footer contact={contact} />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
