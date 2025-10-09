export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-bold text-lg mb-4">VH Besançon Alumni</h4>
            <p className="text-gray-400">
              Association des anciens élèves du Lycée Victor Hugo
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="" className="hover:text-white">Accueil</a></li>
              <li><a href="/annuaire" className="hover:text-white">Annuaire</a></li>
              <li><a href="/contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">Contact</h4>
            <p className="text-gray-400">
              Email: contact@vhalumni.fr<br/>
              Lycée Victor Hugo<br/>
              Besançon, France
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; 2024 VH Besançon Alumni. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}