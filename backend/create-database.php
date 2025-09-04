<?php

require_once __DIR__ . '/vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🚀 Création de la base de données MySQL\n\n";

try {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '3306';
    $username = $_ENV['DB_USERNAME'] ?? 'root';
    $password = $_ENV['DB_PASSWORD'] ?? '';
    
    echo "📡 Connexion à MySQL...\n";
    echo "   Host: $host:$port\n";
    echo "   User: $username\n\n";
    
    // Connexion sans base de données spécifique
    $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Connexion réussie !\n\n";
    
    // Créer la base de données
    echo "🔧 Création de la base de données 'match_ton_alternance'...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS match_ton_alternance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Base de données créée avec succès !\n\n";
    
    // Sélectionner la base de données
    $pdo->exec("USE match_ton_alternance");
    echo "✅ Base de données sélectionnée\n\n";
    
    // Vérifier que la base de données existe
    $stmt = $pdo->query("SELECT DATABASE() as current_db");
    $result = $stmt->fetch();
    echo "📋 Base de données actuelle: " . $result['current_db'] . "\n\n";
    
    echo "🎉 Base de données prête pour les migrations !\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "\n💡 Vérifiez:\n";
    echo "   - Que WAMP est démarré\n";
    echo "   - Que MySQL est accessible\n";
    echo "   - Les informations de connexion dans le fichier .env\n";
    exit(1);
}

echo "\n🏁 Terminé.\n";