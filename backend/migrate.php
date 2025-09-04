<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Config\Database;
use Dotenv\Dotenv;

// Charger les variables d'environnement
$dotenv = \Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

class DatabaseMigration
{
    private $pdo;

    public function __construct()
    {
        try {
            // Connexion à MySQL sans spécifier la base de données
            $host = $_ENV['DB_HOST'] ?? 'localhost';
            $port = $_ENV['DB_PORT'] ?? '3306';
            $username = $_ENV['DB_USERNAME'] ?? 'root';
            $password = $_ENV['DB_PASSWORD'] ?? '';
            $dbname = $_ENV['DB_DATABASE'] ?? 'match_ton_alternance';

            $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
            $this->pdo = new PDO($dsn, $username, $password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Créer la base de données si elle n'existe pas
            $this->pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // Se connecter à la base de données
            $this->pdo->exec("USE `{$dbname}`");
            
            echo "✅ Connexion à la base de données réussie\n";
        } catch (PDOException $e) {
            die("❌ Erreur de connexion: " . $e->getMessage() . "\n");
        }
    }

    public function migrate()
    {
        echo "🚀 Démarrage des migrations...\n\n";

        // 1. Table users
        $this->createUsersTable();
        
        // 2. Table user_profiles
        $this->createUserProfilesTable();
        
        // 3. Table personality_profiles
        $this->createPersonalityProfilesTable();
        
        // 4. Table job_offers
        $this->createJobOffersTable();
        
        // 5. Table saved_jobs (favoris)
        $this->createSavedJobsTable();
        
        // 6. Table applications (candidatures)
        $this->createApplicationsTable();

        echo "\n🎉 Toutes les migrations ont été exécutées avec succès !\n";
    }

    private function createUsersTable()
    {
        $sql = "
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                email_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_role (role)
            ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        ";

        $this->pdo->exec($sql);
        echo "✅ Table 'users' créée\n";
    }

    private function createUserProfilesTable()
    {
        $sql = "
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(20),
                location VARCHAR(255),
                education_level ENUM('bac', 'bac+2', 'bac+3', 'bac+5', 'master', 'doctorat'),
                field_of_study VARCHAR(255),
                experience_level ENUM('debutant', 'junior', 'confirme', 'senior', 'expert'),
                desired_position VARCHAR(255),
                preferred_company_size ENUM('startup', 'pme', 'eti', 'grand_groupe'),
                preferred_work_type ENUM('presentiel', 'remote', 'hybride'),
                salary_expectation_min INT,
                salary_expectation_max INT,
                skills JSON,
                bio TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_location (location),
                INDEX idx_experience (experience_level)
            ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        ";

        $this->pdo->exec($sql);
        echo "✅ Table 'user_profiles' créée\n";
    }

    private function createPersonalityProfilesTable()
    {
        $sql = "
            CREATE TABLE IF NOT EXISTS personality_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                openness TINYINT UNSIGNED DEFAULT 0 COMMENT 'Ouverture d\'esprit (0-100)',
                conscientiousness TINYINT UNSIGNED DEFAULT 0 COMMENT 'Conscienciosité (0-100)',
                extraversion TINYINT UNSIGNED DEFAULT 0 COMMENT 'Extraversion (0-100)',
                agreeableness TINYINT UNSIGNED DEFAULT 0 COMMENT 'Agréabilité (0-100)',
                neuroticism TINYINT UNSIGNED DEFAULT 0 COMMENT 'Neuroticisme (0-100)',
                leadership_style ENUM('directive', 'participatif', 'delegatif', 'transformationnel'),
                work_environment ENUM('calme', 'dynamique', 'collaboratif', 'autonome'),
                communication_style ENUM('direct', 'diplomatique', 'analytique', 'expressif'),
                stress_management ENUM('excellent', 'bon', 'moyen', 'difficile'),
                motivation_factors JSON COMMENT 'Facteurs de motivation',
                career_goals JSON COMMENT 'Objectifs de carrière',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        ";

        $this->pdo->exec($sql);
        echo "✅ Table 'personality_profiles' créée\n";
    }

    private function createJobOffersTable()
    {
        $sql = "
            CREATE TABLE IF NOT EXISTS job_offers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                external_id VARCHAR(255) UNIQUE COMMENT 'ID de l\'offre sur l\'API externe',
                source ENUM('pole_emploi', 'indeed', 'adzuna', 'local') DEFAULT 'local',
                title VARCHAR(255) NOT NULL,
                company VARCHAR(255),
                location VARCHAR(255),
                contract_type ENUM('cdi', 'cdd', 'stage', 'alternance', 'freelance'),
                experience_level ENUM('debutant', 'junior', 'confirme', 'senior', 'expert'),
                salary_min INT,
                salary_max INT,
                description TEXT,
                requirements TEXT,
                skills JSON,
                company_size ENUM('startup', 'pme', 'eti', 'grand_groupe'),
                work_type ENUM('presentiel', 'remote', 'hybride'),
                url VARCHAR(500),
                is_active BOOLEAN DEFAULT TRUE,
                posted_at TIMESTAMP,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_external_id (external_id),
                INDEX idx_source (source),
                INDEX idx_location (location),
                INDEX idx_contract_type (contract_type),
                INDEX idx_experience_level (experience_level),
                INDEX idx_is_active (is_active),
                INDEX idx_posted_at (posted_at)
            ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        ";

        $this->pdo->exec($sql);
        echo "✅ Table 'job_offers' créée\n";
    }

    private function createSavedJobsTable()
    {
        $sql = "
            CREATE TABLE IF NOT EXISTS saved_jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                job_offer_id INT NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_job (user_id, job_offer_id),
                INDEX idx_user_id (user_id),
                INDEX idx_job_offer_id (job_offer_id)
            ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        ";

        $this->pdo->exec($sql);
        echo "✅ Table 'saved_jobs' créée\n";
    }

    private function createApplicationsTable()
    {
        $sql = "
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                job_offer_id INT NOT NULL,
                status ENUM('draft', 'sent', 'viewed', 'interview', 'accepted', 'rejected') DEFAULT 'draft',
                cover_letter TEXT,
                notes TEXT,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_application (user_id, job_offer_id),
                INDEX idx_user_id (user_id),
                INDEX idx_job_offer_id (job_offer_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        ";

        $this->pdo->exec($sql);
        echo "✅ Table 'applications' créée\n";
    }

    public function seedData()
    {
        echo "\n🌱 Insertion de données de test...\n";

        // Créer un utilisateur admin de test
        $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
        
        $sql = "
            INSERT IGNORE INTO users (email, password, name, role, email_verified) 
            VALUES ('admin@match-ton-alternance.com', ?, 'Administrateur', 'admin', TRUE)
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$hashedPassword]);

        // Créer un utilisateur de test
        $hashedPassword = password_hash('test123', PASSWORD_DEFAULT);
        
        $sql = "
            INSERT IGNORE INTO users (email, password, name, role, email_verified) 
            VALUES ('test@example.com', ?, 'Utilisateur Test', 'user', TRUE)
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$hashedPassword]);

        echo "✅ Utilisateurs de test créés\n";
        echo "   📧 Admin: admin@match-ton-alternance.com / admin123\n";
        echo "   📧 Test: test@example.com / test123\n";
    }
}

// Exécution des migrations
try {
    $migration = new DatabaseMigration();
    $migration->migrate();
    $migration->seedData();
    
    echo "\n🎯 Base de données prête pour Match Ton Alternance !\n";
    echo "🔗 Vous pouvez maintenant tester l'API\n\n";
    
} catch (Exception $e) {
    echo "❌ Erreur lors de la migration: " . $e->getMessage() . "\n";
    exit(1);
}
