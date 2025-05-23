import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow p-4 flex justify-between mb-6">
      <h1 className="text-lg font-bold text-blue-700">MatchTonAlternance</h1>
      <div className="flex gap-4 text-sm">
        <Link to="/" className="text-gray-700 hover:text-blue-600">Accueil</Link>
        <Link to="/profile" className="text-gray-700 hover:text-blue-600">Profil</Link>
        <Link to="/matches" className="text-gray-700 hover:text-blue-600">Offres</Link>
      </div>
    </nav>
  );
}
