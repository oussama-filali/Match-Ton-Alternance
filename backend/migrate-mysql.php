<?php

require_once __DIR__ . '/vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🚀 Migration MySQL pour Match Ton Alternance\n\n";

try {
    // Connexion à MySQL sans spécifier de base de données
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '3306';
    $username = $_ENV['DB_USERNAME'] ?? 'root';
    $password = $_ENV['DB_PASSWORD'] ?? '';
    
    echo "📡 Connexion à MySQL...\n";
    echo "   Host: $host:$port\n";
    echo "   User: $username\n\n";
    
    $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Connexion réussie !\n\n";
    
    // Lire le fichier de migration
    $migrationFile = __DIR__ . '/migrations/mysql-schema.sql';
    if (!file_exists($migrationFile)) {
        throw new Exception("Fichier de migration non trouvé : $migrationFile");
    }
    
    echo "📋 Lecture du fichier de migration...\n";
    $sql = file_get_contents($migrationFile);
    
    // Diviser les requêtes SQL
    $queries = array_filter(array_map('trim', explode(';', $sql)));
    
    echo "🔧 Exécution de " . count($queries) . " requêtes...\n\n";
    
    $successCount = 0;
    $errorCount = 0;
    $databaseCreated = false;
    
    foreach ($queries as $index => $query) {
        if (empty($query) || strpos($query, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($query);
            $successCount++;
            
            // Afficher les requêtes importantes
            if (stripos($query, 'CREATE DATABASE') !== false) {
                echo "✅ Base de données créée\n";
                $databaseCreated = true;
                // Sélectionner la base de données après sa création
                $pdo->exec("USE match_ton_alternance");
                echo "✅ Base de données sélectionnée\n";
            } elseif (stripos($query, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $query, $matches);
                $tableName = $matches[1] ?? 'table';
                echo "✅ Table '$tableName' créée\n";
            }
            
        } catch (PDOException $e) {
            $errorCount++;
            echo "⚠️  Erreur requête " . ($index + 1) . ": " . $e->getMessage() . "\n";
            
            // Continuer même en cas d'erreur (table déjà existante, etc.)
            if (strpos($e->getMessage(), 'already exists') === false && 
                strpos($e->getMessage(), 'Duplicate key name') === false) {
                echo "   Query: " . substr($query, 0, 100) . "...\n";
            }
        }
    }
    
    // Si la base de données n'a pas été créée dans la boucle, essayons de la sélectionner
    if (!$databaseCreated) {
        try {
            $pdo->exec("USE match_ton_alternance");
            echo "✅ Base de données existante sélectionnée\n";
        } catch (PDOException $e) {
            echo "⚠️  Impossible de sélectionner la base de données\n";
        }
    }
    
    echo "\n📊 Résumé de la migration:\n";
    echo "   ✅ Succès: $successCount\n";
    echo "   ⚠️  Erreurs: $errorCount\n\n";
    
    // Vérifier les tables créées
    echo "🔍 Vérification des tables...\n";
    $pdo->exec("USE match_ton_alternance");
    
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $expectedTables = [
        'users',
        'user_profiles', 
        'personality_profiles',
        'job_offers',
        'user_matches',
        'swipe_history'
    ];
    
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
    
    // Test d'insertion
    echo "\n🧪 Test d'insertion...\n";
    try {
        $testQuery = "SELECT COUNT(*) as count FROM users";
        $stmt = $pdo->query($testQuery);
        $result = $stmt->fetch();
        echo "✅ Test réussi - Nombre d'utilisateurs: {$result['count']}\n";
    } catch (Exception $e) {
        echo "❌ Erreur lors du test: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur critique: " . $e->getMessage() . "\n";
    echo "\n💡 Vérifiez:\n";
    echo "   - Que WAMP est démarré\n";
    echo "   - Que MySQL est accessible\n";
    echo "   - Les informations de connexion dans le fichier .env\n";
    exit(1);
}

echo "\n🏁 Migration terminée.\n";