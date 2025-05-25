export const API_CONFIG = {
  baseUrl: "https://emplois.api.gouv.fr",
  endpoints: {
    searchOffers: "/api/v1/jobs?q=alternance",
  },
  headers: {
    "Content-Type": "application/json",
  },
};
