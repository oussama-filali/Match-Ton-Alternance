<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Slim\Middleware\ErrorMiddleware;
use App\Middleware\CorsMiddleware;
use App\Controllers\AuthController;
use App\Controllers\JobController;
use App\Controllers\ProfileController;
use App\Config\Database;
use Dotenv\Dotenv;

// Charger les variables d'environnement
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
}

// Créer l'application Slim
$app = AppFactory::create();

// Middleware d'erreur
$errorMiddleware = $app->addErrorMiddleware(true, true, true);

// Middleware CORS
$app->add(new CorsMiddleware());

// Handle all OPTIONS requests for CORS preflight
$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});

// Middleware de routage
$app->addRoutingMiddleware();

// Test de base de données
$app->get('/api/test-db', function ($request, $response, $args) {
    try {
        $database = new Database();
        $db = $database->connect();
        
        $response->getBody()->write(json_encode([
            'success' => true,
            'message' => 'Connexion base de données réussie',
            'timestamp' => date('Y-m-d H:i:s')
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    } catch (Exception $e) {
        $response->getBody()->write(json_encode([
            'success' => false,
            'message' => 'Erreur base de données: ' . $e->getMessage()
        ]));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

// Health check
$app->get('/api/health', function ($request, $response, $args) {
    $response->getBody()->write(json_encode([
        'status' => 'success',
        'message' => 'Match Ton Alternance API is running',
        'timestamp' => date('Y-m-d H:i:s'),
        'version' => '1.0.0'
    ]));
    return $response->withHeader('Content-Type', 'application/json');
});

// Routes d'authentification
$app->group('/api/auth', function ($group) {
    $group->post('/register', [AuthController::class, 'register']);
    $group->post('/login', [AuthController::class, 'login']);
    $group->post('/logout', [AuthController::class, 'logout']);
    $group->get('/me', [AuthController::class, 'getProfile']);
    $group->post('/verify-token', [AuthController::class, 'verifyToken']);
    $group->post('/forgot-password', [AuthController::class, 'forgotPassword']);
});

// Routes des offres d'emploi
$app->group('/api/jobs', function ($group) {
    $group->get('', [JobController::class, 'getJobs']);
    $group->get('/{id}', [JobController::class, 'getJob']);
    $group->post('/search', [JobController::class, 'searchJobs']);
    $group->get('/stats/overview', [JobController::class, 'getJobStats']);
    $group->post('/save', [JobController::class, 'saveJob']);
});

// Routes des matches personnalisés (nécessite authentification)
$app->group('/api/matches', function ($group) {
    $group->post('', [JobController::class, 'getPersonalizedMatches']);
});

// Routes de profil (nécessite authentification)
$app->group('/api/profile', function ($group) {
    $group->get('', [ProfileController::class, 'getProfile']);
    $group->put('', [ProfileController::class, 'updateProfile']);
    $group->post('/personality', [ProfileController::class, 'updatePersonalityProfile']);
    $group->get('/recommendations', [ProfileController::class, 'getRecommendations']);
});

// Route pour la compatibilité avec l'ancien système
$app->post('/api/match', function ($request, $response, $args) {
    $body = json_decode($request->getBody(), true);
    
    // Rediriger vers le nouveau contrôleur
    $jobController = new JobController();
    return $jobController->getPersonalizedMatches($request, $response);
});

// Gestion des erreurs 404
$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
    $response->getBody()->write(json_encode([
        'success' => false,
        'message' => 'Route non trouvée',
        'available_routes' => [
            'GET /api/health',
            'GET /api/test-db',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/jobs',
            'POST /api/jobs/search',
            'POST /api/matches'
        ]
    ]));
    return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
});

// Démarrer l'application
$app->run();
