import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ProfileForm() {
  const [name, setName] = useState("");
  const [technos, setTechnos] = useState("");
  const [keywords, setKeywords] = useState("");
  const [cv, setCv] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [goodExp, setGoodExp] = useState("");
  const [badExp, setBadExp] = useState("");
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleCvChange = (e) => setCv(e.target.files[0]);
  const handleMotivationChange = (e) => setMotivation(e.target.files[0]);

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

    // Upload du CV
    let cvUrl = "";
    if (cv) {
      const { data, error } = await supabase.storage
        .from("cvs")
        .upload(`cv-${user.id}.pdf`, cv, { upsert: true });
      if (!error) cvUrl = data.path;
    }

    // Upload de la lettre de motivation
    let motivationUrl = "";
    if (motivation) {
      const { data, error } = await supabase.storage
        .from("motivations")
        .upload(`motivation-${user.id}.pdf`, motivation, { upsert: true });
      if (!error) motivationUrl = data.path;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        display_name: name,
        technos: technos.split(",").map((t) => t.trim()),
        keywords: keywords.split(",").map((k) => k.trim()),
        good_experience: goodExp,
        bad_experience: badExp,
        cv_url: cvUrl,
        motivation_url: motivationUrl,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      alert("Erreur lors de la sauvegarde : " + error.message);
    } else {
      alert("Profil sauvegardé avec succès !");
      navigate("/matches"); // Redirection après sauvegarde
    }
  };

  return (
    <div className="max-w-2xl p-6 mx-auto mt-10 bg-white shadow-md rounded-xl">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded hover:bg-red-600"
        >
          Se déconnecter
        </button>
      </div>
      <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
        Complète ton profil
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        encType="multipart/form-data"
      >
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

        <div>
          <label className="block mb-1 text-gray-600">CV (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleCvChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-600">
            Lettre de motivation (PDF)
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleMotivationChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-600">
            Bonne expérience professionnelle
          </label>
          <textarea
            value={goodExp}
            onChange={(e) => setGoodExp(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Décris une bonne expérience"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-600">
            Mauvaise expérience professionnelle
          </label>
          <textarea
            value={badExp}
            onChange={(e) => setBadExp(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Décris une mauvaise expérience"
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
