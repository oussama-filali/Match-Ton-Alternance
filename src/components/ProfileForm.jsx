import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function ProfileForm() {
  const [name, setName] = useState("");
  const [technos, setTechnos] = useState("");
  const [keywords, setKeywords] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Utilisateur non connecté !");
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        display_name: name,
        technos: technos.split(",").map((t) => t.trim()),
        keywords: keywords.split(",").map((k) => k.trim()),
      },
      { onConflict: "user_id" } // très important !!
    );

    if (error) {
      alert("Erreur lors de la sauvegarde : " + error.message);
    } else {
      alert("Profil sauvegardé avec succès !");
    }
  };

  return (
    <div className="max-w-2xl p-6 mx-auto mt-10 bg-white shadow-md rounded-xl">
      <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
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
          className="w-full px-4 py-2 font-semibold text-white transition bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Enregistrer le profil
        </button>
      </form>
    </div>
  );
}
