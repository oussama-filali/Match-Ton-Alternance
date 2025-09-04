-- Migration pour MySQL (WAMP)
-- Création des tables pour l'algorithme de matching intelligent

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS match_ton_alternance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'candidate',
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    google_id VARCHAR(255) NULL,
    github_id VARCHAR(255) NULL,
    linkedin_id VARCHAR(255) NULL,
    avatar_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS user_profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
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
    skills JSON,
    bio TEXT,
    cv_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des profils de personnalité (Big Five + facteurs professionnels)
CREATE TABLE IF NOT EXISTS personality_profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    -- Big Five traits (0-100)
    openness INTEGER CHECK (openness >= 0 AND openness <= 100),
    conscientiousness INTEGER CHECK (conscientiousness >= 0 AND conscientiousness <= 100),
    extraversion INTEGER CHECK (extraversion >= 0 AND extraversion <= 100),
    agreeableness INTEGER CHECK (agreeableness >= 0 AND agreeableness <= 100),
    neuroticism INTEGER CHECK (neuroticism >= 0 AND neuroticism <= 100),
    -- Facteurs professionnels
    work_style VARCHAR(50),
    learning_style VARCHAR(50),
    stress_management VARCHAR(50),
    motivation JSON,
    communication_style VARCHAR(50),
    problem_solving VARCHAR(50),
    questionnaire_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des offres d'emploi (France Travail API)
CREATE TABLE IF NOT EXISTS job_offers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    external_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    contract_type VARCHAR(100),
    salary_min INTEGER,
    salary_max INTEGER,
    required_skills JSON,
    experience_required VARCHAR(100),
    education_required VARCHAR(100),
    remote_work BOOLEAN DEFAULT FALSE,
    publication_date DATE,
    application_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des correspondances/matches
CREATE TABLE IF NOT EXISTS user_matches (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    job_offer_id BIGINT NOT NULL,
    match_score DECIMAL(5,2) NOT NULL,
    personality_score DECIMAL(5,2),
    skills_score DECIMAL(5,2),
    location_score DECIMAL(5,2),
    experience_score DECIMAL(5,2),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_job (user_id, job_offer_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE
);

-- Table de l'historique des swipes
CREATE TABLE IF NOT EXISTS swipe_history (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    job_offer_id BIGINT NOT NULL,
    action ENUM('like', 'dislike', 'super_like', 'skip') NOT NULL,
    match_score DECIMAL(5,2),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_job_swipe (user_id, job_offer_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE
);

-- Index pour optimiser les performances
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_personality_profiles_user_id ON personality_profiles(user_id);
CREATE INDEX idx_user_matches_user_id ON user_matches(user_id);
CREATE INDEX idx_user_matches_score ON user_matches(match_score DESC);
CREATE INDEX idx_swipe_history_user_id ON swipe_history(user_id);
CREATE INDEX idx_swipe_history_action ON swipe_history(action);
CREATE INDEX idx_job_offers_active ON job_offers(is_active);
CREATE INDEX idx_job_offers_location ON job_offers(location);

-- Insertion de données de test (optionnel)
INSERT IGNORE INTO users (id, email, password_hash, role) 
VALUES (UUID(), 'test@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'candidate');