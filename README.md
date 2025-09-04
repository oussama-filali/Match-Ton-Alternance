# 🚀 Match Ton Alternance

## 🖥️ Aperçu

<!-- Animation Snake SVG interactive -->
<p align="center">
  <img src="https://raw.githubusercontent.com/Platane/snk/output/github-contribution-grid-snake.svg" alt="animation snake" width="600" />
</p>

> **Plateforme intelligente pour matcher étudiants et entreprises en alternance.**
---

## ✨ Concept


Match Ton Alternance est une application web qui connecte les étudiants à la recherche d'une alternance avec les entreprises qui recrutent, grâce à un moteur de matching avancé et une expérience utilisateur moderne.

- **Candidats** : Créez votre profil, découvrez des offres adaptées à votre personnalité et vos compétences.
- **Matching IA** : Un algorithme intelligent pour maximiser la pertinence des rencontres.

---

## 🛠️ Technologies utilisées
- **Backend** : PHP Slim, PDO, JWT, Supabase/PostgreSQL
- **Frontend** : React, Vite, Axios, react-hook-form, Tailwind CSS
- **API externes** : France Travail, Supabase

- Inscription et connexion utilisateur (frontend/backend)
- Routing API, gestion CORS
- Correction des imports React et icônes


- Parsing .env (Dotenv)
- Erreurs d’import React
- Affichage des erreurs backend (Slim Application Error)
## 📈 Roadmap & Réalisations à venir
- 🔒 Sécurisation de l’authentification (JWT, refresh token)
- 🤖 Finalisation du matching IA
- 🧪 Ajout de tests unitaires et d’intégration

- **Voir `.gitignore`** :

```ignore
node_modules
dist
dist-ssr
*.local
backend/.env
frontend/.env
*.env.local
*.env.*
**/supabase.key
**/serviceAccountKey.json
backend/vendor/
frontend/node_modules/
*.log
*.cache
*.db
*.tmp
*.swp


## 💡 Pour contribuer

1. Clone le repo
2. Installe les dépendances (`composer install`, `npm install`)
4. Lance le backend et le frontend
5. Propose tes idées ou tes corrections !

## 🌟 Inspiration
> “Trouver son alternance, c’est trouver sa voie. Ici, chaque profil compte, chaque entreprise a sa chance.”

---

## 📬 Contact & Suivi

- [Issues GitHub](https://github.com/oussama-filali/Match-Ton-Alternance/issues)
- [Contact](mailto:contact@match-ton-alternance.fr)
---

**Ce projet est en évolution constante. Rejoins-nous pour construire l’alternance de demain !**
- **pandas & numpy** pour l'analyse de données
- **TF-IDF** pour l'analyse sémantique

#### Base de Données
- **Redis** pour le cache (optionnel)
- **Structure optimisée** pour les requêtes de matching

## 🚀 Installation et Configuration

### Prérequis
- **Node.js** 18+ et npm
- **PHP** 8.1+ avec Composer
- **Python** 3.9+ avec pip
- **Compte Supabase** pour la base de données

### 1. Clone du Projet
```bash
git clone https://github.com/votre-repo/match-ton-alternance.git
cd match-ton-alternance
```

### 2. Configuration de la Base de Données
1. Créez un projet sur [Supabase](https://supabase.com)
2. Copiez les variables d'environnement
3. Exécutez les migrations SQL (voir `/database/migrations/`)

### 3. Backend PHP
```bash
cd backend
composer install
cp .env.example .env
# Configurez vos variables d'environnement
php -S localhost:8000 -t public
```

### 4. Frontend React
```bash
cd frontend
npm install
cp .env.example .env
# Configurez vos variables d'environnement
npm run dev
```

### 5. AI Engine Python
```bash
cd ai-engine
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## 🔧 Configuration

### Variables d'Environnement

#### Backend (.env)
```env
# Base de données Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key

# AI Engine
AI_ENGINE_URL=http://localhost:5000
AI_ENGINE_TIMEOUT=30

# APIs externes
POLE_EMPLOI_API_KEY=your_api_key
INDEED_API_KEY=your_api_key

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### AI Engine (.env)
```env
PORT=5000
DEBUG=False
FLASK_ENV=production
```

## 📊 Structure de la Base de Données

### Tables Principales
- **users** : Profils utilisateurs
- **user_profiles** : Données détaillées des profils
- **personality_profiles** : Profils psychologiques
- **job_offers** : Offres d'emploi
- **matches** : Résultats de matching
- **applications** : Candidatures
- **swipes** : Historique des swipes
- **favorites** : Offres favorites

### Relations
```sql
users (1) ──── (1) user_profiles
users (1) ──── (1) personality_profiles  
users (1) ──── (n) applications
users (1) ──── (n) swipes
users (1) ──── (n) favorites
job_offers (1) ──── (n) applications
job_offers (1) ──── (n) matches
```

## 🤖 Algorithme de Matching

### Critères de Matching (Pondération)
1. **Compétences Techniques** (35%) - Correspondance des skills
2. **Profil Psychologique** (25%) - Compatibilité comportementale  
3. **Localisation** (15%) - Proximité géographique
4. **Expérience** (10%) - Niveau d'expérience requis
5. **Formation** (8%) - Niveau d'études
6. **Préférences** (7%) - Secteur, type de contrat, salaire

### Analyse Comportementale
- **Style de Travail** : Équipe vs Autonome
- **Gestion du Stress** : Planification, Communication, etc.
- **Motivations** : Apprentissage, Impact, Évolution
- **Communication** : Direct, Diplomatique, Analytique
- **Résolution de Problèmes** : Recherche, Brainstorming, Systématique

### Machine Learning
- **TF-IDF** pour l'analyse sémantique des descriptions
- **Cosine Similarity** pour la correspondance des compétences
- **Classification** des profils comportementaux
- **Apprentissage Continu** basé sur les feedbacks

## 📱 Interface Utilisateur

### Design System
- **Design Moderne** avec Tailwind CSS
- **Animations Fluides** avec Framer Motion
- **Responsive** pour mobile et desktop
- **Accessibilité** WCAG 2.1 AA
- **Dark Mode** (optionnel)

### Pages Principales
- **Accueil** : Landing page avec présentation
- **Inscription** : Formulaire multi-étapes avec questionnaire psychologique
- **Dashboard** : Vue d'ensemble personnalisée
- **Profil** : Gestion complète du profil utilisateur
- **Jobs** : Recherche et filtrage des offres
- **Matches** : Interface de swipe type Tinder
- **Candidatures** : Suivi des candidatures

## 🔌 API et Intégrations

### API REST Backend
```
GET    /api/auth/me
POST   /api/auth/login
POST   /api/auth/register
GET    /api/jobs
POST   /api/jobs/search
GET    /api/matches
POST   /api/swipe
GET    /api/profile
PUT    /api/profile
POST   /api/applications
```

### API AI Engine
```
POST   /match/calculate
POST   /match/batch
POST   /analyze/skills
POST   /recommendations/profile
GET    /health
```

### Intégrations Externes
- **Pôle Emploi API** : Récupération d'offres
- **Indeed API** : Offres d'emploi
- **LinkedIn API** : Import de profils (optionnel)
- **Google Maps API** : Géolocalisation

## 🧪 Tests

### Frontend
```bash
cd frontend
npm run test
npm run test:coverage
```

### Backend
```bash
cd backend
composer test
composer test:coverage
```

### AI Engine
```bash
cd ai-engine
pytest
pytest --cov=app
```

## 🚀 Déploiement

### Production
1. **Frontend** : Vercel, Netlify, ou serveur statique
2. **Backend** : VPS avec Apache/Nginx + PHP-FPM
3. **AI Engine** : Docker container sur cloud (AWS, GCP, Azure)
4. **Base de Données** : Supabase (géré) ou PostgreSQL self-hosted

### Docker (Optionnel)
```bash
docker-compose up -d
```

## 📈 Monitoring et Analytics

### Métriques Clés
- **Taux de Matching** : Pourcentage de matches réussis
- **Engagement** : Temps passé, pages vues
- **Conversion** : Candidatures envoyées vs matches
- **Satisfaction** : Feedback utilisateurs

### Outils
- **Logs** : Monolog (PHP) + Python logging
- **Analytics** : Google Analytics ou Plausible
- **Monitoring** : Sentry pour les erreurs
- **Performance** : New Relic ou DataDog

## 🤝 Contribution

### Guidelines
1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

### Standards de Code
- **PHP** : PSR-12
- **JavaScript** : ESLint + Prettier
- **Python** : PEP 8
- **Git** : Conventional Commits


## 👥 Équipe

- **Développement Full-Stack** : Architecture et implémentation
- **Data Science** : Algorithmes d'IA et machine learning
- **UX/UI Design** : Interface utilisateur et expérience
- **DevOps** : Infrastructure et déploiement

## 📞 Support

- **Documentation** : [Wiki du projet](https://github.com/votre-repo/match-ton-alternance/wiki)
- **Issues** : [GitHub Issues](https://github.com/oussama-filali/Match-Ton-Alternance.git)
- **Email** : oussama.halimafilali.pro@gmail.com

---

**Match Ton Alternance** - Révolutionnons la recherche d'alternance avec l'IA ! 🚀
