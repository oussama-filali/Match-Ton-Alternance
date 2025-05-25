import { useEffect, useState } from "react";
import { getOffers } from "../services/api";
import { matchOfferWithProfile } from "../utils/matcher";
import Card from "../components/card";
import Loader from "../components/Loader"; // Assurez-vous que ce composant existe

export default function Matches() {
  const [offers, setOffers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      setProfile(JSON.parse(saved));
    }

    getOffers().then((data) => {
      setOffers(data);
      setIsLoading(false);
    });
  }, []);

  return isLoading ? (
    <Loader />
  ) : (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
        Résultats de Matching
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {offers.map((offer) => {
          const score = profile
            ? matchOfferWithProfile(profile, offer)
            : 0;
          return <Card key={offer.id} offer={offer} score={score} />;
        })}
      </div>
    </div>
  );
}
