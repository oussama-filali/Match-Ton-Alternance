<?php

require_once __DIR__ . '/vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🚀 Migration des tables Supabase...\n\n";

$supabaseUrl = $_ENV['SUPABASE_URL'];
$supabaseServiceKey = $_ENV['SUPABASE_SERVICE_KEY']; // Utiliser la clé service pour les opérations admin

if (empty($supabaseUrl) || empty($supabaseServiceKey)) {
    echo "❌ Variables d'environnement Supabase manquantes\n";
    exit(1);
}

// Lire le fichier SQL de migration
$sqlFile = __DIR__ . '/migrations/supabase-schema.sql';
if (!file_exists($sqlFile)) {
    echo "❌ Fichier de migration non trouvé: $sqlFile\n";
    exit(1);
}

$sqlContent = file_get_contents($sqlFile);

// Diviser le SQL en requêtes individuelles
$queries = array_filter(
    array_map('trim', explode(';', $sqlContent)),
    function($query) {
        return !empty($query) && !str_starts_with($query, '--');
    }
);

echo "📋 " . count($queries) . " requêtes SQL à exécuter...\n\n";

$successCount = 0;
$errorCount = 0;

foreach ($queries as $index => $query) {
    if (empty(trim($query))) continue;
    
    echo "🔄 Exécution requête " . ($index + 1) . "...\n";
    
    // Préparer la requête pour l'API RPC de Supabase
    $payload = json_encode([
        'query' => $query
    ]);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/rpc/sql');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseServiceKey,
        'Authorization: Bearer ' . $supabaseServiceKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 || $httpCode === 201) {
        echo "   ✅ Réussie\n";
        $successCount++;
    } else {
        echo "   ❌ Erreur (Code: $httpCode)\n";
        echo "   Réponse: $response\n";
        $errorCount++;
    }
    
    echo "\n";
}

echo "📊 Résumé de la migration:\n";
echo "   ✅ Réussies: $successCount\n";
echo "   ❌ Erreurs: $errorCount\n";

if ($errorCount === 0) {
    echo "\n🎉 Migration terminée avec succès !\n";
    
    // Vérifier les tables créées
    echo "\n🔍 Vérification des tables...\n";
    
    $tables = ['users', 'user_profiles', 'personality_profiles', 'user_matches', 'swipe_history'];
    
    foreach ($tables as $table) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $supabaseUrl . "/rest/v1/$table?select=*&limit=0");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $_ENV['SUPABASE_ANON_KEY'],
            'Authorization: Bearer ' . $_ENV['SUPABASE_ANON_KEY'],
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            echo "   ✅ $table - Table créée et accessible\n";
        } else {
            echo "   ❌ $table - Problème d'accès (Code: $httpCode)\n";
        }
    }
    
} else {
    echo "\n⚠️  Migration terminée avec des erreurs. Vérifiez les logs ci-dessus.\n";
}

echo "\n🏁 Processus terminé.\n";
