<?php

namespace App\Controllers;

use App\Models\JobOffer;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\PersonalityProfile;
use App\Services\AdvancedMatchingService;
use App\Services\JobAPIService;
use App\Config\Database;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Exception;

class JobController
{
    private $db;
    private $jobAPIService;
    private $matchingService;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->connect();
        $this->jobAPIService = new JobAPIService();
        $this->matchingService = new AdvancedMatchingService();
    }

    /**
     * Obtenir toutes les offres d'emploi avec pagination
     */
    public function getJobs(Request $request, Response $response)
    {
        $params = $request->getQueryParams();
        $page = isset($params['page']) ? (int)$params['page'] : 1;
        $limit = isset($params['limit']) ? (int)$params['limit'] : 20;
        $search = isset($params['search']) ? $params['search'] : '';
        $location = isset($params['location']) ? $params['location'] : '';
        $contract_type = isset($params['contract_type']) ? $params['contract_type'] : '';

        try {
            // Récupérer les offres depuis l'API externe
            $jobs = $this->jobAPIService->searchJobs([
                'keywords' => $search,
                'location' => $location,
                'contract_type' => $contract_type,
                'page' => $page,
                'limit' => $limit
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'jobs' => $jobs['jobs'],
                    'pagination' => [
                        'current_page' => $page,
                        'total_pages' => $jobs['total_pages'],
                        'total_jobs' => $jobs['total_jobs'],
                        'per_page' => $limit
                    ]
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération des offres: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Obtenir une offre d'emploi spécifique
     */
    public function getJob(Request $request, Response $response, $args)
    {
        $job_id = $args['id'];

        try {
            $job = $this->jobAPIService->getJobById($job_id);

            if (!$job) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Offre d\'emploi non trouvée'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $job
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'offre: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Recherche avancée d'offres d'emploi
     */
    public function searchJobs(Request $request, Response $response)
    {
        $data = json_decode($request->getBody(), true);

        $searchParams = [
            'keywords' => $data['keywords'] ?? '',
            'location' => $data['location'] ?? '',
            'contract_type' => $data['contract_type'] ?? '',
            'experience_level' => $data['experience_level'] ?? '',
            'salary_min' => $data['salary_min'] ?? null,
            'salary_max' => $data['salary_max'] ?? null,
            'company_size' => $data['company_size'] ?? '',
            'skills' => $data['skills'] ?? [],
            'page' => $data['page'] ?? 1,
            'limit' => $data['limit'] ?? 20
        ];

        try {
            $jobs = $this->jobAPIService->advancedSearch($searchParams);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $jobs
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Erreur lors de la recherche: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Obtenir les offres personnalisées pour un utilisateur
     */
    public function getPersonalizedMatches(Request $request, Response $response)
    {
        $user_id = $this->getUserIdFromToken($request);

        if (!$user_id) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Token invalide ou manquant'
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        try {
            // Récupérer le profil utilisateur
            $userProfile = new UserProfile($this->db);
            if (!$userProfile->findByUserId($user_id)) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Profil utilisateur non trouvé. Veuillez compléter votre profil.'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Récupérer le profil de personnalité
            $personalityProfile = new PersonalityProfile($this->db);
            $personalityProfile->findByUserId($user_id);

            // Construire les critères de recherche basés sur le profil
            $searchCriteria = [
                'keywords' => $userProfile->desired_position,
                'location' => $userProfile->location,
                'experience_level' => $userProfile->experience_level,
                'skills' => $userProfile->getSkillsArray(),
                'limit' => 50 // Plus de résultats pour le matching
            ];

            // Récupérer les offres
            $jobs = $this->jobAPIService->advancedSearch($searchCriteria);

            // Calculer les scores de compatibilité
            $matchedJobs = [];
            foreach ($jobs['jobs'] as $job) {
                // Check if the method exists before calling it
                if (method_exists($this->matchingService, 'calculateCompatibilityScore')) {
                    $score = $this->matchingService->calculateCompatibilityScore(
                        $userProfile,
                        $personalityProfile,
                        $job
                    );
                } else {
                    // Default compatibility score calculation
                    $score = $this->calculateBasicCompatibilityScore($userProfile, $job);
                }

                if ($score >= 60) { // Seuil de compatibilité
                    $job['compatibility_score'] = $score;
                    if (method_exists($this->matchingService, 'getMatchReasons')) {
                        $job['match_reasons'] = $this->matchingService->getMatchReasons(
                            $userProfile,
                            $personalityProfile,
                            $job
                        );
                    } else {
                        $job['match_reasons'] = ['Correspondance basique avec votre profil'];
                    }
                    $matchedJobs[] = $job;
                }
            }

            // Trier par score de compatibilité
            usort($matchedJobs, function($a, $b) {
                return $b['compatibility_score'] - $a['compatibility_score'];
            });

            // Limiter à 20 meilleurs matches
            $matchedJobs = array_slice($matchedJobs, 0, 20);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'matches' => $matchedJobs,
                    'total_matches' => count($matchedJobs),
                    'profile_completeness' => $this->calculateProfileCompleteness($userProfile, $personalityProfile)
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Erreur lors du matching: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Obtenir les statistiques des offres d'emploi
     */
    public function getJobStats(Request $request, Response $response)
    {
        try {
            $stats = $this->jobAPIService->getJobStatistics();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $stats
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Sauvegarder une offre d'emploi (favoris)
     */
    public function saveJob(Request $request, Response $response)
    {
        $user_id = $this->getUserIdFromToken($request);
        $data = json_decode($request->getBody(), true);

        if (!$user_id) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Token invalide ou manquant'
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        if (empty($data['job_id'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'ID de l\'offre manquant'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            // Logique pour sauvegarder l'offre en favoris
            // (à implémenter selon la structure de base de données)

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Offre sauvegardée avec succès'
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Erreur lors de la sauvegarde: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Extraire l'ID utilisateur du token JWT
     */
    private function getUserIdFromToken(Request $request)
    {
        $headers = $request->getHeaders();
        
        if (!isset($headers['Authorization'])) {
            return null;
        }

        $authHeader = $headers['Authorization'][0];
        $token = str_replace('Bearer ', '', $authHeader);

        try {
            $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
            return $decoded->data->user_id;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Calculer le pourcentage de complétude du profil
     */
    private function calculateProfileCompleteness($userProfile, $personalityProfile)
    {
        $userFields = [
            'first_name', 'last_name', 'location', 'education_level',
            'field_of_study', 'experience_level', 'desired_position', 'skills'
        ];

        $userScore = 0;
        foreach ($userFields as $field) {
            if (!empty($userProfile->$field)) {
                $userScore++;
            }
        }

        $personalityScore = 0;
        if ($personalityProfile && $personalityProfile->id) {
            $personalityFields = [
                'openness', 'conscientiousness', 'extraversion',
                'agreeableness', 'neuroticism'
            ];
            foreach ($personalityFields as $field) {
                if (!empty($personalityProfile->$field)) {
                    $personalityScore++;
                }
            }
        }

        $totalFields = count($userFields) + 5; // 5 traits de personnalité
        $completedFields = $userScore + $personalityScore;

        return round(($completedFields / $totalFields) * 100);
    }

    /**
     * Calcul basique du score de compatibilité
     */
    private function calculateBasicCompatibilityScore($userProfile, $job)
    {
        $score = 0;
        
        // Score basé sur la position désirée
        if (!empty($userProfile->desired_position) && !empty($job['title'])) {
            if (stripos($job['title'], $userProfile->desired_position) !== false) {
                $score += 30;
            }
        }
        
        // Score basé sur la localisation
        if (!empty($userProfile->location) && !empty($job['location'])) {
            if (stripos($job['location'], $userProfile->location) !== false) {
                $score += 20;
            }
        }
        
        // Score basé sur les compétences
        if (!empty($userProfile->skills) && !empty($job['skills'])) {
            $userSkills = $userProfile->getSkillsArray();
            $jobSkills = is_array($job['skills']) ? $job['skills'] : [];
            $matchingSkills = array_intersect(array_map('strtolower', $userSkills), array_map('strtolower', $jobSkills));
            $score += min(count($matchingSkills) * 10, 30);
        }
        
        // Score basé sur le niveau d'expérience
        if (!empty($userProfile->experience_level) && !empty($job['experience_level'])) {
            if ($userProfile->experience_level === $job['experience_level']) {
                $score += 20;
            }
        }
        
        return min($score, 100); // Maximum 100
    }
}
