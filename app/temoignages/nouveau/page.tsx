import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import HeroSection from '@/app/components/HeroSection'
import TestimonialForm from '@/app/components/TestimonialForm'

export const metadata = {
  title: 'Nouveau témoignage - Association VH Besançon',
  description: 'Partagez votre expérience avec la communauté',
}

export default async function NewTestimonialPage() {
  const session = await auth()

  if (!session) {
    redirect('/connexion?callbackUrl=/temoignages/nouveau')
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <HeroSection
          title="Créer un témoignage"
          subtitle="Partagez votre expérience et inspirez la communauté"
        />

        <section className="max-w-7xl mx-auto px-6 py-16 -mt-10">
          <TestimonialForm />
        </section>
      </main>

      <Footer />
    </>
  )
}
