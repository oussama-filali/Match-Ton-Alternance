<?php

require_once __DIR__ . '/vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🚀 Création des tables MySQL\n\n";

try {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '3306';
    $username = $_ENV['DB_USERNAME'] ?? 'root';
    $password = $_ENV['DB_PASSWORD'] ?? '';
    $database = $_ENV['DB_DATABASE'] ?? 'match_ton_alternance';
    
    echo "📡 Connexion à MySQL...\n";
    echo "   Host: $host:$port\n";
    echo "   Database: $database\n";
    echo "   User: $username\n\n";
    
    $dsn = "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Connexion réussie !\n\n";
    
    // Définir les requêtes de création des tables
    $tables = [
        'users' => "
            CREATE TABLE IF NOT EXISTS users (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                email VARCHAR(191) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'candidate',
                is_verified BOOLEAN DEFAULT FALSE,
                email_verified_at TIMESTAMP NULL,
                google_id VARCHAR(191) NULL,
                github_id VARCHAR(191) NULL,
                linkedin_id VARCHAR(191) NULL,
                avatar_url VARCHAR(500) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )",
        
        'user_profiles' => "
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
            )",
        
        'personality_profiles' => "
            CREATE TABLE IF NOT EXISTS personality_profiles (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                user_id CHAR(36) NOT NULL,
                openness INTEGER CHECK (openness >= 0 AND openness <= 100),
                conscientiousness INTEGER CHECK (conscientiousness >= 0 AND conscientiousness <= 100),
                extraversion INTEGER CHECK (extraversion >= 0 AND extraversion <= 100),
                agreeableness INTEGER CHECK (agreeableness >= 0 AND agreeableness <= 100),
                neuroticism INTEGER CHECK (neuroticism >= 0 AND neuroticism <= 100),
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
            )",
        
        'job_offers' => "
            CREATE TABLE IF NOT EXISTS job_offers (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                external_id VARCHAR(191) UNIQUE NOT NULL,
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
            )",
        
        'user_matches' => "
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
            )",
        
        'swipe_history' => "
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
            )"
    ];
    
    // Créer les tables
    echo "🔧 Création des tables...\n\n";
    foreach ($tables as $tableName => $sql) {
        try {
            $pdo->exec($sql);
            echo "✅ Table '$tableName' créée\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "ℹ️  Table '$tableName' existe déjà\n";
            } else {
                echo "❌ Erreur création table '$tableName': " . $e->getMessage() . "\n";
            }
        }
    }
    
    // Créer les index (MySQL ne supporte pas IF NOT EXISTS pour les index)
    echo "\n🔧 Création des index...\n";
    $indexes = [
        "CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id)",
        "CREATE INDEX idx_personality_profiles_user_id ON personality_profiles(user_id)",
        "CREATE INDEX idx_user_matches_user_id ON user_matches(user_id)",
        "CREATE INDEX idx_user_matches_score ON user_matches(match_score DESC)",
        "CREATE INDEX idx_swipe_history_user_id ON swipe_history(user_id)",
        "CREATE INDEX idx_swipe_history_action ON swipe_history(action)",
        "CREATE INDEX idx_job_offers_active ON job_offers(is_active)",
        "CREATE INDEX idx_job_offers_location ON job_offers(location)"
    ];
    
    foreach ($indexes as $index => $sql) {
        try {
            $pdo->exec($sql);
            echo "✅ Index " . ($index + 1) . " créé\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "ℹ️  Index " . ($index + 1) . " existe déjà\n";
            } else {
                echo "❌ Erreur création index " . ($index + 1) . ": " . $e->getMessage() . "\n";
            }
        }
    }
    
    // Insérer un utilisateur de test
    echo "\n🧪 Insertion d'un utilisateur de test...\n";
    try {
        $testUserSql = "INSERT IGNORE INTO users (id, email, password_hash, role) 
                       VALUES (UUID(), 'test@example.com', ?, 'candidate')";
        $stmt = $pdo->prepare($testUserSql);
        $stmt->execute([password_hash('password123', PASSWORD_DEFAULT)]);
        echo "✅ Utilisateur de test créé (email: test@example.com, password: password123)\n";
    } catch (PDOException $e) {
        echo "ℹ️  Utilisateur de test existe déjà ou erreur: " . $e->getMessage() . "\n";
    }
    
    // Vérifier les tables créées
    echo "\n🔍 Vérification des tables...\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $expectedTables = ['users', 'user_profiles', 'personality_profiles', 'job_offers', 'user_matches', 'swipe_history'];
    
    echo "Tables créées:\n";
    foreach ($tables as $table) {
        $status = in_array($table, $expectedTables) ? '✅' : '❓';
        echo "   $status $table\n";
    }
    
    $missingTables = array_diff($expectedTables, $tables);
    if (!empty($missingTables)) {
        echo "\nTables manquantes:\n";
        foreach ($missingTables as $table) {
            echo "   ❌ $table\n";
        }
    } else {
        echo "\n🎉 Toutes les tables requises ont été créées avec succès !\n";
    }
    
    // Test de comptage
    echo "\n📊 Statistiques:\n";
    foreach ($expectedTables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $result = $stmt->fetch();
            echo "   📋 $table: {$result['count']} enregistrements\n";
        } catch (PDOException $e) {
            echo "   ❌ $table: erreur de lecture\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Erreur critique: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n🏁 Migration terminée avec succès !\n";