import { useState, useEffect } from "react";

export default function ProfileForm() {
  const [name, setName] = useState("");
  const [technos, setTechnos] = useState("");
  const [keywords, setKeywords] = useState("");

  // Charger les données depuis localStorage
  useEffect(() => {
    const storedProfile = JSON.parse(localStorage.getItem("userProfile"));
    if (storedProfile) {
      setName(storedProfile.name || "");
      setTechnos(storedProfile.technos || "");
      setKeywords(storedProfile.keywords || "");
    }
  }, []);

  // Enregistrer dans localStorage
  const handleSubmit = (e) => {
    e.preventDefault();

    const profile = {
      name,
      technos: technos.split(",").map((t) => t.trim()),
      keywords: keywords.split(",").map((k) => k.trim()),
    };

    localStorage.setItem("userProfile", JSON.stringify(profile));
    alert("Profil sauvegardé ! 🚀");
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Complète ton profil
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-600">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded-md"
            placeholder="Ex : Oussama"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-600">
            Technologies (séparées par virgule)
          </label>
          <input
            type="text"
            value={technos}
            onChange={(e) => setTechnos(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Ex : React, Node, MySQL"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-600">
            Mots-clés (soft skills, domaines, etc.)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Ex : autonomie, alternance, fullstack"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
        >
          Enregistrer le profil
        </button>
      </form>
    </div>
  );
}
