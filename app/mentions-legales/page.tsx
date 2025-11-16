import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import Header from '@/app/components/Header'
import PublicHeader from '@/app/components/PublicHeader'
import Footer from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Mentions légales - Association VH Besançon',
  description: 'Mentions légales et informations légales du site',
}

export default async function MentionsLegales() {
  const session = await auth()

  return (
    <>
      {session ? <Header /> : <PublicHeader />}
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mentions légales
        </h1>

        {/* 1. Éditeur du site */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            1. Éditeur du site
          </h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>Nom :</strong> Association VH Besançon Alumni</p>
            <p><strong>Forme juridique :</strong> Association loi 1901</p>
            <p><strong>Siège social :</strong> Lycée Victor Hugo, 1 rue Rembrandt, 25000 Besançon</p>
            <p><strong>Email :</strong> <a href="mailto:contact@vh-besancon-alumni.fr" className="text-blue-600 hover:underline">contact@vh-besancon-alumni.fr</a></p>
          </div>
        </section>

        {/* 2. Directeur de publication */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            2. Directeur de publication
          </h2>
          <p className="text-gray-700">
            <strong>Qualité :</strong> Présidente de l&apos;association VH Besançon Alumni
          </p>
          <p className="text-gray-700 text-sm mt-2">
            Pour connaître l&apos;identité du directeur de publication, merci de nous contacter à <a href="mailto:contact@vh-besancon-alumni.fr" className="text-blue-600 hover:underline">contact@vh-besancon-alumni.fr</a>
          </p>
        </section>

        {/* 3. Hébergement */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            3. Hébergement
          </h2>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Hébergement du site web
            </h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Raison sociale :</strong> Vercel Inc.</p>
              <p><strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
              <p><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">vercel.com</a></p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Hébergement des données (CMS)
            </h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Raison sociale :</strong> Sanity.io Inc.</p>
              <p><strong>Adresse :</strong> 1778 Haight St, San Francisco, CA 94117, États-Unis</p>
              <p><strong>Site web :</strong> <a href="https://www.sanity.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sanity.io</a></p>
              <p className="text-sm mt-2">
                <em>Les données sont hébergées conformément aux Clauses Contractuelles Types (SCC) de l&apos;UE</em>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Nom de domaine
            </h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Registrar :</strong> OVH</p>
              <p><strong>Adresse :</strong> 2 rue Kellermann, 59100 Roubaix, France</p>
              <p><strong>Site web :</strong> <a href="https://www.ovh.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ovh.com</a></p>
            </div>
          </div>
        </section>

        {/* 4. Propriété intellectuelle */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            4. Propriété intellectuelle
          </h2>
          <p className="text-gray-700 mb-4">
            L&apos;ensemble du contenu de ce site (textes, images, vidéos, logos, etc.) est la propriété exclusive de l&apos;Association VH Besançon Alumni,
            sauf mention contraire.
          </p>
          <p className="text-gray-700 mb-4">
            Toute reproduction, distribution, modification ou exploitation du contenu sans autorisation préalable écrite est interdite
            et constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </p>
          <p className="text-gray-700">
            Les photos de profil et contenus publiés par les membres restent leur propriété exclusive.
          </p>
        </section>

        {/* 5. Responsabilité */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            5. Limitation de responsabilité
          </h2>
          <p className="text-gray-700 mb-4">
            L&apos;association VH Besançon Alumni s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site,
            mais ne peut en garantir l&apos;exhaustivité, la précision ou l&apos;actualité.
          </p>
          <p className="text-gray-700 mb-4">
            L&apos;association ne saurait être tenue responsable :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Des erreurs ou omissions dans le contenu du site</li>
            <li>Des dommages directs ou indirects résultant de l&apos;accès ou de l&apos;utilisation du site</li>
            <li>De l&apos;interruption temporaire ou définitive du service</li>
            <li>Des contenus publiés par les membres (sous réserve de signalement et modération)</li>
          </ul>
        </section>

        {/* 6. Données personnelles */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            6. Protection des données personnelles
          </h2>
          <p className="text-gray-700 mb-4">
            Conformément au Règlement Général sur la Protection des Données (RGPD - UE 2016/679) et à la loi Informatique et Libertés,
            vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de vos données personnelles.
          </p>
          <p className="text-gray-700">
            Pour plus d&apos;informations, consultez notre{' '}
            <a href="/politique-confidentialite" className="text-blue-600 hover:underline font-semibold">
              Politique de confidentialité
            </a>
          </p>
        </section>

        {/* 7. Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            7. Cookies
          </h2>
          <p className="text-gray-700 mb-4">
            Ce site utilise uniquement des cookies strictement nécessaires au fonctionnement de la plateforme (cookies de session).
          </p>
          <p className="text-gray-700">
            Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
          </p>
        </section>

        {/* 8. Droit applicable */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            8. Droit applicable et juridiction
          </h2>
          <p className="text-gray-700 mb-4">
            Les présentes mentions légales sont régies par le droit français.
          </p>
          <p className="text-gray-700">
            En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
          </p>
        </section>

        {/* 9. Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            9. Contact
          </h2>
          <p className="text-gray-700 mb-4">
            Pour toute question concernant ces mentions légales ou le site :
          </p>
          <p className="text-gray-700">
            📧 Email : <a href="mailto:contact@vh-besancon-alumni.fr" className="text-blue-600 hover:underline font-semibold">contact@vh-besancon-alumni.fr</a>
          </p>
        </section>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
      </div>
      <Footer />
    </>
  )
}
