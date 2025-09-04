<?php

require_once __DIR__ . '/vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use App\Config\Database;
use App\Config\SupabaseClient;

echo "🔍 VÉRIFICATION COMPLÈTE DU SYSTÈME\n";
echo "==================================\n\n";

// 1. Test de configuration
echo "📋 1. Configuration des variables d'environnement...\n";
$requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];
$configOk = true;

foreach ($requiredVars as $var) {
    if (empty($_ENV[$var])) {
        echo "   ❌ $var manquante\n";
        $configOk = false;
    } else {
        echo "   ✅ $var configurée\n";
    }
}

if (!$configOk) {
    echo "\n❌ Configuration incomplète. Arrêt du test.\n";
    exit(1);
}

// 2. Test de la connexion Supabase
echo "\n📡 2. Test de connexion Supabase...\n";
try {
    $supabase = new SupabaseClient();
    if ($supabase->testConnection()) {
        echo "   ✅ Connexion Supabase réussie\n";
    } else {
        echo "   ❌ Échec de la connexion Supabase\n";
    }
} catch (Exception $e) {
    echo "   ❌ Erreur: " . $e->getMessage() . "\n";
}

// 3. Vérification des tables
echo "\n📊 3. Vérification des tables...\n";
$tables = [
    'users' => 'Table des utilisateurs',
    'user_profiles' => 'Profils utilisateurs', 
    'personality_profiles' => 'Profils de personnalité',
    'job_offers' => 'Offres d\'emploi',
    'user_matches' => 'Correspondances',
    'swipe_history' => 'Historique des swipes'
];

$tablesOk = 0;
foreach ($tables as $table => $description) {
    try {
        $result = $supabase->select($table, 'count(*)', [], 1);
        if ($result['success']) {
            echo "   ✅ $table - $description\n";
            $tablesOk++;
        } else {
            echo "   ❌ $table - Manquante ou inaccessible\n";
        }
    } catch (Exception $e) {
        echo "   ❌ $table - Erreur: " . $e->getMessage() . "\n";
    }
}

// 4. Test de l'algorithme de matching
echo "\n🧠 4. Test des composants de l'algorithme...\n";

// Vérifier les modèles
$models = [
    'App\Models\User' => 'Modèle utilisateur',
    'App\Models\UserProfile' => 'Modèle profil utilisateur', 
    'App\Models\PersonalityProfile' => 'Modèle profil personnalité',
    'App\Services\AdvancedMatchingService' => 'Service de matching avancé'
];

foreach ($models as $class => $description) {
    if (class_exists($class)) {
        echo "   ✅ $class - $description\n";
    } else {
        echo "   ❌ $class - Classe manquante\n";
    }
}

// 5. Test des contrôleurs
echo "\n🎮 5. Test des contrôleurs...\n";
$controllers = [
    'App\Controllers\AuthController' => 'Contrôleur d\'authentification',
    'App\Controllers\ProfileController' => 'Contrôleur de profil (algorithme intelligent)',
    'App\Controllers\JobController' => 'Contrôleur d\'emplois'
];

foreach ($controllers as $class => $description) {
    if (class_exists($class)) {
        echo "   ✅ $class - $description\n";
    } else {
        echo "   ❌ $class - Classe manquante\n";
    }
}

// 6. Résumé et recommandations
echo "\n📈 6. RÉSUMÉ FINAL\n";
echo "================\n";

$totalTables = count($tables);
$score = ($tablesOk / $totalTables) * 100;

echo "Score de complétude des tables: " . round($score) . "%\n";

if ($score >= 80) {
    echo "🎉 SYSTÈME PRÊT ! L'algorithme de matching intelligent peut fonctionner.\n\n";
    
    echo "✅ Fonctionnalités disponibles:\n";
    echo "   - Authentification JWT\n";
    echo "   - Profils utilisateurs complets\n";
    echo "   - Questionnaire de personnalité (Big Five)\n";
    echo "   - Algorithme de matching sophistiqué\n";
    echo "   - Correspondances en temps réel\n";
    echo "   - Historique des swipes\n\n";
    
    echo "🚀 Prochaines étapes:\n";
    echo "   1. Démarrer le serveur backend: php -S localhost:8000 -t public\n";
    echo "   2. Démarrer le frontend React: npm run dev\n";
    echo "   3. Tester l'algorithme avec des données réelles\n";
    
} elseif ($score >= 50) {
    echo "⚠️  SYSTÈME PARTIELLEMENT PRÊT\n\n";
    echo "🔧 Actions requises:\n";
    echo "   1. Créer les tables manquantes dans Supabase\n";
    echo "   2. Exécuter le script SQL: migrations/supabase-schema.sql\n";
    echo "   3. Vérifier les permissions RLS dans Supabase\n";
    
} else {
    echo "❌ SYSTÈME NON PRÊT\n\n";
    echo "🛠️  Actions critiques:\n";
    echo "   1. Configurer correctement Supabase\n";
    echo "   2. Créer toutes les tables requises\n";
    echo "   3. Vérifier les clés API\n";
}

echo "\n💡 Pour créer les tables manuellement:\n";
echo "   1. Ouvrir Supabase Dashboard\n"; 
echo "   2. Aller dans SQL Editor\n";
echo "   3. Copier le contenu de migrations/supabase-schema.sql\n";
echo "   4. Exécuter le script SQL\n";

echo "\n🏁 Vérification terminée.\n";
