-- Migration pour Supabase (PostgreSQL)
-- Création des tables pour l'algorithme de matching intelligent

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'candidate',
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    location VARCHAR(255),
    education_level VARCHAR(100),
    field_of_study VARCHAR(255),
    experience_level VARCHAR(50),
    desired_position VARCHAR(255),
    preferred_company_size VARCHAR(50),
    preferred_work_type VARCHAR(50),
    salary_expectation_min INTEGER,
    salary_expectation_max INTEGER,
    skills JSONB DEFAULT '[]',
    bio TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des profils de personnalité (Big Five + facteurs professionnels)
CREATE TABLE IF NOT EXISTS personality_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    -- Big Five traits (0-100)
    openness INTEGER CHECK (openness >= 0 AND openness <= 100),
    conscientiousness INTEGER CHECK (conscientiousness >= 0 AND conscientiousness <= 100),
    extraversion INTEGER CHECK (extraversion >= 0 AND extraversion <= 100),
    agreeableness INTEGER CHECK (agreeableness >= 0 AND agreeableness <= 100),
    neuroticism INTEGER CHECK (neuroticism >= 0 AND neuroticism <= 100),
    -- Facteurs professionnels
    leadership_style VARCHAR(50),
    work_environment VARCHAR(50),
    communication_style VARCHAR(50),
    stress_management VARCHAR(50),
    motivation_factors JSONB DEFAULT '[]',
    career_goals JSONB DEFAULT '[]',
    questionnaire_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des correspondances/matches
CREATE TABLE IF NOT EXISTS user_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_offer_id BIGINT REFERENCES job_offers(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2) NOT NULL,
    personality_score DECIMAL(5,2),
    skills_score DECIMAL(5,2),
    location_score DECIMAL(5,2),
    experience_score DECIMAL(5,2),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, job_offer_id)
);

-- Table de l'historique des swipes
CREATE TABLE IF NOT EXISTS swipe_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_offer_id BIGINT REFERENCES job_offers(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('like', 'dislike', 'super_like', 'skip')),
    match_score DECIMAL(5,2),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, job_offer_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_profiles_user_id ON personality_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_user_id ON user_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_score ON user_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_swipe_history_user_id ON swipe_history(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_history_action ON swipe_history(action);

-- Mise à jour automatique du timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour la mise à jour automatique
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personality_profiles_updated_at BEFORE UPDATE ON personality_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion de données de test (optionnel)
INSERT INTO users (email, password_hash, role) 
VALUES ('test@example.com', '$2y$10$example', 'candidate') 
ON CONFLICT (email) DO NOTHING;
