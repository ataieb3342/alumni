import type { Metadata, Viewport } from 'next'
import { Atkinson_Hyperlegible_Next, Caveat, Fraunces } from 'next/font/google'
import { cookies } from 'next/headers'
import { Toaster } from 'sonner'
import './globals.css'
import { auth } from '@/lib/auth'
import SessionProvider from './components/SessionProvider'
import PageVisitTracker from './components/PageVisitTracker'
import WebVitalsTracker from './components/WebVitalsTracker'
import Header from './components/site/Header'
import Footer from './components/site/Footer'
import { THEME_SCRIPT } from './components/site/ThemeToggle'
import { ConfirmProvider } from './components/ui/Dialog'
import { EditorShell } from './components/edit/EditorShell'
import { EDIT_MODE_COOKIE } from '@/lib/auth/session'

const text = Atkinson_Hyperlegible_Next({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-text',
  display: 'swap',
  // Pas de métriques de repli connues pour cette police : repli système simple
  adjustFontFallback: false,
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
})

const serif = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-serif',
  axes: ['opsz', 'SOFT', 'WONK'],
  display: 'swap',
})

const script = Caveat({
  subsets: ['latin'],
  variable: '--font-script',
  weight: ['600'],
  display: 'swap',
  preload: false,
})

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vh-besancon-alumni.fr'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'VH Besançon Alumni — le réseau des anciens du lycée Victor Hugo',
    template: '%s · VH Besançon Alumni',
  },
  description: "Réseau des anciens élèves et personnels du lycée Victor Hugo de Besançon : annuaire des parcours, annonces, témoignages.",
  icons: { icon: '/icon.png', apple: '/icon.png' },
  openGraph: { type: 'website', locale: 'fr_FR', siteName: 'VH Besançon Alumni', images: ['/images/lycee-victor-hugo.jpg'] },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f5ef' },
    { media: '(prefers-color-scheme: dark)', color: '#12141f' },
  ],
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()
  const isAdmin = session?.user?.role === 'admin' && session.user.accountStatus === 'active'
  const editMode = isAdmin && (await cookies()).get(EDIT_MODE_COOKIE)?.value === '1'

  const page = (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-[var(--radius-sm)] focus:bg-blue focus:px-4 focus:py-2 focus:font-semibold focus:text-on-blue"
      >
        Aller au contenu
      </a>
      <Header />
      <main id="contenu" tabIndex={-1} className="min-h-[60vh] outline-none">
        {children}
      </main>
      <Footer />
    </>
  )

  return (
    <html lang="fr" suppressHydrationWarning className={`${text.variable} ${serif.variable} ${script.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={isAdmin ? 'pb-20' : undefined}>
        <SessionProvider>
          <ConfirmProvider>
            <WebVitalsTracker />
            <PageVisitTracker />
            {isAdmin ? <EditorShell initialEditMode={editMode}>{page}</EditorShell> : page}
            <Toaster
              position="top-center"
              closeButton
              toastOptions={{
                classNames: {
                  toast: '!rounded-[var(--radius-md)] !border !border-line !bg-paper-raised !text-ink !shadow-[var(--shadow-lg)] !font-sans',
                  description: '!text-ink-soft',
                  success: '[&_[data-icon]]:!text-success',
                  error: '[&_[data-icon]]:!text-red',
                },
              }}
            />
          </ConfirmProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
