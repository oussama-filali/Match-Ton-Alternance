export function matchOfferWithProfile(profile, offer) {
  const keywords = [...(profile.technos || []), ...(profile.keywords || [])];
  const target = [...(offer.stack || []), ...(offer.skills || [])];

  const matchCount = keywords.filter((k) =>
    target.some((t) => t.toLowerCase().includes(k.toLowerCase()))
  ).length;

  const score = Math.round((matchCount / keywords.length) * 100);
  return isNaN(score) ? 0 : score;
}
