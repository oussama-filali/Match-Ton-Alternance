// Serveur proxy pour France Travail : gère l'authentification et le relais des offres

import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import process from "process";

// On charge les variables d'environnement depuis le .env à la racine du projet
dotenv.config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

// Route de health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server France Travail proxy opérationnel",
    timestamp: new Date().toISOString(),
    port: 3001
  });
});

// Route pour obtenir le token France Travail (utile pour debug ou extension future)
app.post("/api/ft-token", async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.FT_CLIENT_ID);
    params.append("client_secret", process.env.FT_CLIENT_SECRET);
    params.append("scope", "api_offresdemploiv2 o2dsoffre");

    const ftRes = await fetch(
      "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );
    const data = await ftRes.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération du token" });
  }
});

// Route pour relayer la récupération des offres d'emploi France Travail
app.get("/api/offres", async (req, res) => {
  try {
    // Récupère le token
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.FT_CLIENT_ID);
    params.append("client_secret", process.env.FT_CLIENT_SECRET);
    params.append("scope", "api_offresdemploiv2 o2dsoffre");

    const tokenRes = await fetch(
      "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    // Appel à l'API France Travail (ajoute ici des paramètres de recherche si besoin)
    const offresRes = await fetch(
      "https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const offresData = await offresRes.json();
    res.json(offresData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des offres" });
  }
});

app.listen(3001, () => console.log("✅ Backend opérationnel sur http://localhost:3001"));