import { API_CONFIG } from "../config";

export async function getOffers() {
  try {
    const res = await fetch(
      API_CONFIG.baseUrl + API_CONFIG.endpoints.searchOffers,
      {
        headers: API_CONFIG.headers,
      }
    );

    if (!res.ok) throw new Error("Erreur API");

    const data = await res.json();

    return data.results.map((offer, idx) => ({
      id: offer.id || idx,
      title: offer.title,
      description: offer.description || offer.context || "Pas de description.",
      stack: offer.skills || ["HTML", "CSS", "JS"],
      skills: offer.tags || [],
    }));
  } catch (e) {
    console.error("Erreur API :", e);
    return [];
  }
}
