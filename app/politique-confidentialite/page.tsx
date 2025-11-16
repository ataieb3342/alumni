import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import Header from '@/app/components/Header'
import PublicHeader from '@/app/components/PublicHeader'
import Footer from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Politique de confidentialité - Association VH Besançon',
  description: 'Protection des données personnelles et politique de confidentialité',
}

export default async function PolitiqueConfidentialite() {
  const session = await auth()

  return (
    <>
      {session ? <Header /> : <PublicHeader />}
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Politique de confidentialité
        </h1>

        <p className="text-sm text-gray-600 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>

        {/* 1. Responsable du traitement */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            1. Responsable du traitement des données
          </h2>
          <p className="text-gray-700 mb-2">
            <strong>Association VH Besançon Alumni</strong>
          </p>
          <p className="text-gray-700 mb-2">
            Adresse : Lycée Victor Hugo, 1 rue Rembrandt, 25000 Besançon
          </p>
          <p className="text-gray-700">
            Email de contact : <a href="mailto:contact@vh-besancon-alumni.fr" className="text-blue-600 hover:underline">contact@vh-besancon-alumni.fr</a>
          </p>
        </section>

        {/* 2. Données collectées */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            2. Données personnelles collectées
          </h2>
          <p className="text-gray-700 mb-4">
            Dans le cadre de l&apos;utilisation de notre plateforme d&apos;annuaire des anciens élèves, nous collectons les données suivantes :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Informations d&apos;identification :</strong> nom, prénom, email</li>
            <li><strong>Informations de profil :</strong> photo (optionnelle), biographie, statut (étudiant, alumni, personnel)</li>
            <li><strong>Données de connexion :</strong> mot de passe (hashé et sécurisé), date de dernière connexion</li>
            <li><strong>Données techniques :</strong> adresse IP (logs temporaires pour la sécurité)</li>
          </ul>
        </section>

        {/* 3. Finalités */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            3. Finalités du traitement
          </h2>
          <p className="text-gray-700 mb-4">
            Vos données sont collectées et traitées pour les finalités suivantes :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Gestion de l&apos;annuaire des anciens élèves de Victor Hugo Besançon</li>
            <li>Faciliter les échanges et le networking entre membres</li>
            <li>Envoi de newsletters et communications liées à l&apos;association (avec votre consentement)</li>
            <li>Gestion des comptes utilisateurs et authentification sécurisée</li>
            <li>Statistiques anonymisées d&apos;utilisation de la plateforme</li>
          </ul>
        </section>

        {/* 4. Base légale */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            4. Base légale du traitement
          </h2>
          <p className="text-gray-700 mb-4">
            Le traitement de vos données repose sur :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Votre consentement :</strong> inscription volontaire à la plateforme</li>
            <li><strong>L&apos;intérêt légitime :</strong> maintien d&apos;un réseau d&apos;anciens élèves pour une association d&apos;alumni</li>
            <li><strong>L&apos;exécution d&apos;un contrat :</strong> fourniture des services de la plateforme</li>
          </ul>
        </section>

        {/* 5. Destinataires des données */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            5. Destinataires de vos données
          </h2>
          <p className="text-gray-700 mb-4">
            Vos données sont accessibles à :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Les administrateurs de l&apos;association VH Besançon</strong> (pour la gestion de la plateforme)</li>
            <li><strong>Les autres membres inscrits</strong> (uniquement les informations de profil public que vous choisissez de partager)</li>
            <li><strong>Nos prestataires techniques :</strong>
              <ul className="list-circle pl-6 mt-2 space-y-1">
                <li><strong>Sanity.io Inc.</strong> (hébergement de la base de données) - Localisation : Belgique (St. Ghislain)</li>
                <li><strong>Vercel Inc.</strong> (hébergement du site web) - Localisation : États-Unis</li>
                <li><strong>OVH</strong> (nom de domaine) - Localisation : France</li>
              </ul>
            </li>
          </ul>
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">
              <strong>ℹ️ Hébergement des données :</strong> Vos données sont stockées en <strong>Belgique (St. Ghislain)</strong> par Sanity.io via Google Compute Engine.
              Les données de requête sont distribuées via un réseau CDN mondial. Le traitement est conforme au RGPD et encadré par un <strong>Data Processing Agreement (DPA)</strong>.
            </p>
          </div>
        </section>

        {/* 6. Durée de conservation */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            6. Durée de conservation
          </h2>
          <p className="text-gray-700 mb-4">
            Vos données sont conservées :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Données de compte :</strong> pendant toute la durée d&apos;activité de votre compte + 3 ans après la dernière connexion</li>
            <li><strong>Données de connexion (logs) :</strong> 12 mois maximum (pour la sécurité)</li>
            <li><strong>Newsletters :</strong> jusqu&apos;à votre désinscription ou suppression de compte</li>
          </ul>
          <p className="text-gray-700 mt-4">
            Vous pouvez demander la suppression de vos données à tout moment (voir section &quot;Vos droits&quot;).
          </p>
        </section>

        {/* 7. Sécurité */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            7. Sécurité de vos données
          </h2>
          <p className="text-gray-700 mb-4">
            Nous mettons en œuvre les mesures techniques et organisationnelles suivantes :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Chiffrement des mots de passe (algorithme bcrypt)</li>
            <li>Connexion HTTPS obligatoire (certificat SSL)</li>
            <li>Authentification sécurisée par JWT (JSON Web Tokens)</li>
            <li>Limitation des tentatives de connexion (protection contre le brute force)</li>
            <li>Sauvegardes régulières des données</li>
            <li>Accès restreint aux administrateurs</li>
          </ul>
        </section>

        {/* 8. Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            8. Cookies et traceurs
          </h2>
          <p className="text-gray-700 mb-4">
            Notre site utilise uniquement des cookies strictement nécessaires au fonctionnement :
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Cookie de session (NextAuth) :</strong> maintien de votre connexion (durée : session)</li>
            <li><strong>Cookie CSRF :</strong> protection contre les attaques (durée : session)</li>
          </ul>
          <p className="text-gray-700 mt-4">
            Nous n&apos;utilisons <strong>aucun cookie publicitaire ou de tracking tiers</strong> (pas de Google Analytics, Facebook Pixel, etc.).
          </p>
        </section>

        {/* 9. Vos droits */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            9. Vos droits (RGPD)
          </h2>
          <p className="text-gray-700 mb-4">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
          </p>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">✅ Droit d&apos;accès</h3>
              <p className="text-gray-700">Obtenir une copie de toutes vos données personnelles</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">✏️ Droit de rectification</h3>
              <p className="text-gray-700">Modifier vos données inexactes ou incomplètes</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">🗑️ Droit à l&apos;effacement</h3>
              <p className="text-gray-700">Supprimer définitivement votre compte et toutes vos données</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">📦 Droit à la portabilité</h3>
              <p className="text-gray-700">Récupérer vos données dans un format structuré (JSON/CSV)</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">⛔ Droit d&apos;opposition</h3>
              <p className="text-gray-700">Vous opposer au traitement de vos données (notamment newsletters)</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">⏸️ Droit à la limitation</h3>
              <p className="text-gray-700">Limiter temporairement le traitement de vos données</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500">
            <p className="font-semibold text-gray-900 mb-2">📧 Pour exercer vos droits :</p>
            <p className="text-gray-700 mb-2">
              Envoyez un email à : <a href="mailto:contact@vh-besancon-alumni.fr" className="text-blue-600 hover:underline font-semibold">contact@vh-besancon-alumni.fr</a>
            </p>
            <p className="text-sm text-gray-600">
              Nous nous engageons à répondre sous <strong>1 mois maximum</strong> (conformément au RGPD).
            </p>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500">
            <p className="font-semibold text-gray-900 mb-2">⚖️ Droit de réclamation</p>
            <p className="text-gray-700">
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) :
            </p>
            <p className="text-gray-700 mt-2">
              🌐 <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cnil.fr</a>
            </p>
          </div>
        </section>

        {/* 10. Modifications */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            10. Modifications de cette politique
          </h2>
          <p className="text-gray-700">
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment.
            Toute modification sera publiée sur cette page avec mise à jour de la date en haut du document.
            Nous vous encourageons à consulter régulièrement cette page.
          </p>
        </section>

        {/* Contact */}
        <section className="mt-12 p-6 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Des questions sur vos données ?
          </h2>
          <p className="text-gray-700 mb-4">
            Pour toute question concernant la protection de vos données personnelles :
          </p>
          <p className="text-gray-700">
            📧 Email : <a href="mailto:contact@vh-besancon-alumni.fr" className="text-blue-600 hover:underline font-semibold">contact@vh-besancon-alumni.fr</a>
          </p>
        </section>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Cette politique de confidentialité est conforme au Règlement Général sur la Protection des Données (RGPD - UE 2016/679)
          </p>
        </div>
      </div>
      </div>
      <Footer />
    </>
  )
}
