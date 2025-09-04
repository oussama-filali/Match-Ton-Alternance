<?php
// filepath: c:\wamp64\www\Match-Ton-Alternance\backend\src\Controllers\ProfileController.php

namespace App\Controllers;

use App\Models\User;
use App\Models\UserProfile;
use App\Models\PersonalityProfile;
use App\Services\AdvancedMatchingService;
use App\Config\Database;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Exception;

class ProfileController
{
    private $db;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->connect();
    }

    /**
     * Récupérer le profil complet de l'utilisateur
     */
    public function getProfile(Request $request, Response $response)
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
            $hasUserProfile = $userProfile->findByUserId($user_id);

            // Récupérer le profil de personnalité
            $personalityProfile = new PersonalityProfile($this->db);
            $hasPersonalityProfile = $personalityProfile->findByUserId($user_id);

            // Récupérer les informations utilisateur
            $user = new User($this->db);
            $user->findById($user_id);

            $profileData = [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => $user->role
                ],
                'profile' => $hasUserProfile ? [
                    'first_name' => $userProfile->first_name,
                    'last_name' => $userProfile->last_name,
                    'phone' => $userProfile->phone,
                    'location' => $userProfile->location,
                    'education_level' => $userProfile->education_level,
                    'field_of_study' => $userProfile->field_of_study,
                    'experience_level' => $userProfile->experience_level,
                    'desired_position' => $userProfile->desired_position,
                    'skills' => $userProfile->getSkillsArray(),
                    'bio' => $userProfile->bio
                ] : null,
                'personality' => $hasPersonalityProfile ? [
                    'openness' => $personalityProfile->openness,
                    'conscientiousness' => $personalityProfile->conscientiousness,
                    'extraversion' => $personalityProfile->extraversion,
                    'agreeableness' => $personalityProfile->agreeableness,
                    'neuroticism' => $personalityProfile->neuroticism,
                    'career_goals' => $personalityProfile->getCareerGoals()
                ] : null,
                'completion_status' => [
                    'profile_completed' => $hasUserProfile,
                    'personality_completed' => $hasPersonalityProfile,
                    'completion_percentage' => $this->calculateProfileCompleteness($userProfile, $personalityProfile)
                ]
            ];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $profileData
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération du profil: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Mettre à jour le profil utilisateur
     */
    public function updateProfile(Request $request, Response $response)
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

        try {
            $userProfile = new UserProfile($this->db);
            $exists = $userProfile->findByUserId($user_id);

            // Mapper les données
            $userProfile->user_id = $user_id;
            $userProfile->first_name = $data['first_name'] ?? $userProfile->first_name;
            $userProfile->last_name = $data['last_name'] ?? $userProfile->last_name;
            $userProfile->phone = $data['phone'] ?? $userProfile->phone;
            $userProfile->location = $data['location'] ?? $userProfile->location;
            $userProfile->education_level = $data['education_level'] ?? $userProfile->education_level;
            $userProfile->field_of_study = $data['field_of_study'] ?? $userProfile->field_of_study;
            $userProfile->experience_level = $data['experience_level'] ?? $userProfile->experience_level;
            $userProfile->desired_position = $data['desired_position'] ?? $userProfile->desired_position;
            $userProfile->preferred_company_size = $data['preferred_company_size'] ?? $userProfile->preferred_company_size;
            $userProfile->preferred_work_type = $data['preferred_work_type'] ?? $userProfile->preferred_work_type;
            $userProfile->salary_expectation_min = $data['salary_expectation_min'] ?? $userProfile->salary_expectation_min;
            $userProfile->salary_expectation_max = $data['salary_expectation_max'] ?? $userProfile->salary_expectation_max;
            $userProfile->skills = $data['skills'] ?? $userProfile->skills;
            $userProfile->bio = $data['bio'] ?? $userProfile->bio;

            if ($exists) {
                $success = $userProfile->update();
            } else {
                $success = $userProfile->create();
            }

            if ($success) {
                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => 'Profil mis à jour avec succès'
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            } else {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Erreur lors de la mise à jour du profil'
                ]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Questionnaire psychologique - Créer/Mettre à jour le profil de personnalité
     */
    public function updatePersonalityProfile(Request $request, Response $response)
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

        // Validation des données du questionnaire psychologique
        $requiredFields = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || !is_numeric($data[$field]) || $data[$field] < 0 || $data[$field] > 100) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => "Le champ $field est requis et doit être un nombre entre 0 et 100"
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }

        try {
            $personalityProfile = new PersonalityProfile($this->db);
            $exists = $personalityProfile->findByUserId($user_id);

            // Mapper les données
            $personalityProfile->user_id = $user_id;
            $personalityProfile->openness = $data['openness'];
            $personalityProfile->conscientiousness = $data['conscientiousness'];
            $personalityProfile->extraversion = $data['extraversion'];
            $personalityProfile->agreeableness = $data['agreeableness'];
            $personalityProfile->neuroticism = $data['neuroticism'];
            $personalityProfile->leadership_style = $data['leadership_style'] ?? null;
            $personalityProfile->work_environment = $data['work_environment'] ?? null;
            $personalityProfile->communication_style = $data['communication_style'] ?? null;
            $personalityProfile->stress_management = $data['stress_management'] ?? null;
            $personalityProfile->motivation_factors = $data['motivation_factors'] ?? [];
            $personalityProfile->career_goals = $data['career_goals'] ?? [];
            $personalityProfile->questionnaire_completed = true;

            if ($exists) {
                $success = $personalityProfile->update();
            } else {
                $success = $personalityProfile->create();
            }

            if ($success) {
                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => 'Profil de personnalité mis à jour avec succès'
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            } else {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Erreur lors de la mise à jour du profil de personnalité'
                ]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Obtenir les recommandations personnalisées basées sur le profil complet
     */
    public function getRecommendations(Request $request, Response $response)
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
            // Récupérer les profils
            $userProfile = new UserProfile($this->db);
            $userProfile->findByUserId($user_id);

            $personalityProfile = new PersonalityProfile($this->db);
            $personalityProfile->findByUserId($user_id);

            // Générer les recommandations
            $recommendations = [
                'career_suggestions' => $this->generateCareerSuggestions($userProfile, $personalityProfile),
                'skill_improvements' => $this->generateSkillImprovements($userProfile),
                'psychological_insights' => $this->generatePsychologicalInsights($personalityProfile),
                'profile_optimization' => $this->generateProfileOptimizationTips($userProfile, $personalityProfile)
            ];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $recommendations
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Calculer le pourcentage de complétude du profil
     */
    private function calculateProfileCompleteness($userProfile, $personalityProfile)
    {
        $totalFields = 0;
        $completedFields = 0;

        // Vérifier les champs du profil utilisateur
        if ($userProfile && $userProfile->id) {
            $fields = ['first_name', 'last_name', 'phone', 'location', 'education_level', 'field_of_study', 'experience_level', 'desired_position'];
            foreach ($fields as $field) {
                $totalFields++;
                if (!empty($userProfile->$field)) {
                    $completedFields++;
                }
            }
        }

        // Vérifier les champs du profil de personnalité
        if ($personalityProfile && $personalityProfile->id) {
            $totalFields += 5; // 5 traits Big Five
            $traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
            foreach ($traits as $trait) {
                if (!is_null($personalityProfile->$trait)) {
                    $completedFields++;
                }
            }
        }

        return $totalFields > 0 ? round(($completedFields / $totalFields) * 100) : 0;
    }

    /**
     * Générer des suggestions de carrière
     */
    private function generateCareerSuggestions($userProfile, $personalityProfile)
    {
        $suggestions = [];

        if ($userProfile && $userProfile->id) {
            $skills = $userProfile->getSkillsArray();
            
            if (in_array('react', array_map('strtolower', $skills)) || in_array('javascript', array_map('strtolower', $skills))) {
                $suggestions[] = [
                    'title' => 'Développeur Frontend React',
                    'match_percentage' => 92,
                    'description' => 'Vos compétences en React sont très recherchées'
                ];
            }

            if (in_array('python', array_map('strtolower', $skills))) {
                $suggestions[] = [
                    'title' => 'Data Scientist',
                    'match_percentage' => 88,
                    'description' => 'Python est essentiel dans l\'analyse de données'
                ];
            }
        }

        return $suggestions;
    }

    /**
     * Générer des améliorations de compétences
     */
    private function generateSkillImprovements($userProfile)
    {
        $improvements = [];

        if ($userProfile && $userProfile->id) {
            $currentSkills = array_map('strtolower', $userProfile->getSkillsArray());
            $trendingSkills = ['react', 'python', 'typescript', 'docker', 'aws'];
            
            foreach ($trendingSkills as $skill) {
                if (!in_array($skill, $currentSkills)) {
                    $improvements[] = [
                        'skill' => ucfirst($skill),
                        'priority' => 'high',
                        'description' => "Compétence très demandée sur le marché"
                    ];
                }
            }
        }

        return array_slice($improvements, 0, 3);
    }

    /**
     * Générer des insights psychologiques
     */
    private function generatePsychologicalInsights($personalityProfile)
    {
        if (!$personalityProfile || !$personalityProfile->id) {
            return ['message' => 'Complétez votre profil de personnalité pour obtenir des insights'];
        }

        $insights = [];
        
        if ($personalityProfile->extraversion > 70) {
            $insights[] = [
                'type' => 'strength',
                'title' => 'Leadership naturel',
                'description' => 'Votre extraversion élevée vous prédispose aux rôles de management'
            ];
        }

        if ($personalityProfile->conscientiousness > 80) {
            $insights[] = [
                'type' => 'strength',
                'title' => 'Excellente organisation',
                'description' => 'Votre sens de l\'organisation est un atout majeur'
            ];
        }

        return $insights;
    }

    /**
     * Générer des conseils d'optimisation
     */
    private function generateProfileOptimizationTips($userProfile, $personalityProfile)
    {
        $tips = [];

        if (!$userProfile || !$userProfile->first_name) {
            $tips[] = [
                'priority' => 'high',
                'action' => 'Complétez vos informations personnelles'
            ];
        }

        if (!$personalityProfile || !$personalityProfile->questionnaire_completed) {
            $tips[] = [
                'priority' => 'medium',
                'action' => 'Passez le test de personnalité'
            ];
        }

        return $tips;
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
            $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'] ?? 'your-secret-key', 'HS256'));
            return $decoded->data->user_id;
        } catch (Exception $e) {
            return null;
        }
    }
}
