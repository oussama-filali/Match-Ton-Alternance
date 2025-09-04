<?php

require_once __DIR__ . '/vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use App\Config\Database;

echo "🔍 Test de connexion à la base de données Supabase...\n\n";

try {
    $database = new Database();
    
    // Tester la connexion
    echo "📡 Test de connexion...\n";
    $result = $database->testConnection();
    
    if ($result['success']) {
        echo "✅ Connexion réussie !\n";
        echo "   Driver: {$result['driver']}\n";
        echo "   Host: {$result['host']}\n";
        echo "   Database: {$result['database']}\n";
        echo "   Version: {$result['version']}\n\n";
        
        // Vérifier les tables existantes
        echo "📋 Vérification des tables...\n";
        $conn = $database->connect();
        
        // Lister toutes les tables
        $stmt = $conn->query("
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        ");
        
        $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Tables attendues pour notre application
        $expectedTables = [
            'users',
            'user_profiles', 
            'personality_profiles',
            'job_offers',
            'user_matches',
            'swipe_history'
        ];
        
        echo "Tables existantes:\n";
        foreach ($existingTables as $table) {
            $status = in_array($table, $expectedTables) ? '✅' : '❓';
            echo "   $status $table\n";
        }
        
        echo "\nTables manquantes:\n";
        $missingTables = array_diff($expectedTables, $existingTables);
        foreach ($missingTables as $table) {
            echo "   ❌ $table\n";
        }
        
        if (empty($missingTables)) {
            echo "✅ Toutes les tables requises sont présentes !\n\n";
        } else {
            echo "\n⚠️  Certaines tables sont manquantes. Vous devez exécuter les migrations.\n\n";
        }
        
        // Test d'insertion simple
        echo "🧪 Test d'écriture...\n";
        try {
            $testQuery = "SELECT NOW() as current_time";
            $stmt = $conn->query($testQuery);
            $result = $stmt->fetch();
            echo "✅ Test d'écriture réussi - Heure serveur: {$result['current_time']}\n\n";
        } catch (Exception $e) {
            echo "❌ Erreur lors du test d'écriture: " . $e->getMessage() . "\n\n";
        }
        
        // Vérifier la structure d'une table importante
        if (in_array('users', $existingTables)) {
            echo "🔍 Structure de la table 'users':\n";
            $stmt = $conn->query("
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND table_schema = 'public'
                ORDER BY ordinal_position
            ");
            
            $columns = $stmt->fetchAll();
            foreach ($columns as $column) {
                $nullable = $column['is_nullable'] === 'YES' ? 'NULL' : 'NOT NULL';
                $default = $column['column_default'] ? " DEFAULT {$column['column_default']}" : '';
                echo "   📋 {$column['column_name']} ({$column['data_type']}) $nullable$default\n";
            }
        }
        
    } else {
        echo "❌ Échec de la connexion !\n";
        echo "   Driver: {$result['driver']}\n";
        echo "   Host: {$result['host']}\n";
        echo "   Database: {$result['database']}\n";
        echo "   Erreur: {$result['error']}\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur critique: " . $e->getMessage() . "\n";
    echo "\n💡 Vérifiez:\n";
    echo "   - Les informations de connexion dans le fichier .env\n";
    echo "   - Que Supabase est accessible\n";
    echo "   - Que le mot de passe est correct\n";
}

echo "\n🏁 Test terminé.\n";
