import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SavedProvider } from '@/components/providers/saved-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { Navbar } from '@/components/layout/navbar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { Footer } from '@/components/layout/footer'
import { SITE } from '@/lib/constants'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})
const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  keywords: ['Sri Lanka property', 'land for sale', 'houses Colombo', 'apartments', 'real estate Sri Lanka'],
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: 'en_LK',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: SITE.name, description: SITE.description },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f3ea' },
    { media: '(prefers-color-scheme: dark)', color: '#15130f' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh">
        <ThemeProvider>
          <SavedProvider>
          <ToastProvider>
          <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[200] rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="pb-24 md:pb-0">{children}</main>
          <Footer />
          <MobileBottomNav />
          </ToastProvider>
          </SavedProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
