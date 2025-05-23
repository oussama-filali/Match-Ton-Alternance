import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white p-6 text-center">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">
        Bienvenue sur <span className="text-black">MatchTonAlternance</span>
      </h1>
      <p className="text-gray-600 max-w-xl mb-8">
        Une application intelligente qui détecte automatiquement les offres d’alternance
        qui correspondent à ton profil, tes mots-clés et tes technologies favorites.
      </p>
      <div className="flex gap-4">
        <Link
          to="/profile"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
        >
          Compléter mon profil
        </Link>
        <Link
          to="/matches"
          className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-100 transition text-sm"
        >
          Voir les offres
        </Link>
      </div>
    </div>
  );
}
