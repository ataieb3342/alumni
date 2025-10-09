import Header from './components/Header'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Texte à gauche */}
            <div className="space-y-6">
              <p className="text-gray-600 text-lg">
                Bienvenue sur le site de l&apos;association
              </p>
              
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                VH Besançon Alumni
              </h2>
              
              <p className="text-gray-700 text-lg leading-relaxed">
                VH Besançon Alumni a pour vocation de réunir les anciens élèves du lycée 
                et de faciliter l&apos;orientation des lycéens de tout niveau (lycée, CPGE, BTS) 
                en leur permettant d&apos;accéder en toute simplicité à un large panel d&apos;étudiants.es 
                et travailleurs.euses divers et varié ayant étudié au lycée Victor Hugo.
              </p>
              
              <button className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-8 py-4 rounded transition-colors mt-4">
                A PROPOS DE NOUS
              </button>
            </div>
            
            {/* Image à droite */}
            <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/images/lycee-victor-hugo.jpg"
                alt="Lycée Victor Hugo"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* Section supplémentaire - Optionnel */}
        <section className="bg-white py-16 mt-12">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Notre Mission
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="text-5xl mb-4">🎓</div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Réunir les Alumni</h4>
                <p className="text-gray-600">
                  Créer un réseau solide entre anciens élèves du lycée Victor Hugo
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="text-5xl mb-4">🧭</div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Orienter</h4>
                <p className="text-gray-600">
                  Faciliter l&apos;orientation des lycéens grâce aux expériences partagées
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="text-5xl mb-4">🤝</div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Connecter</h4>
                <p className="text-gray-600">
                  Mettre en relation étudiants et professionnels issus du lycée
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}