<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Log\LoggerInterface;

/**
 * Service de communication avec l'algorithme d'IA Python
 * Fait le pont entre le backend PHP et l'engine d'IA
 */
class AIMatchingService
{
    private Client $httpClient;
    private LoggerInterface $logger;
    private string $aiEngineUrl;
    private int $timeout;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
        $this->aiEngineUrl = $_ENV['AI_ENGINE_URL'] ?? 'http://localhost:5000';
        $this->timeout = (int)($_ENV['AI_ENGINE_TIMEOUT'] ?? 30);
        
        $this->httpClient = new Client([
            'base_uri' => $this->aiEngineUrl,
            'timeout' => $this->timeout,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ]
        ]);
    }

    /**
     * Calcule le score de matching entre un profil utilisateur et une offre
     */
    public function calculateMatchScore(array $userProfile, array $jobOffer): array
    {
        try {
            $this->logger->info('Calcul du score de matching via IA', [
                'user_id' => $userProfile['id'] ?? null,
                'job_id' => $jobOffer['id'] ?? null
            ]);

            $response = $this->httpClient->post('/match/calculate', [
                'json' => [
                    'user_profile' => $this->formatUserProfile($userProfile),
                    'job_offer' => $this->formatJobOffer($jobOffer)
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success']) {
                throw new \Exception($data['error'] ?? 'Erreur inconnue de l\'IA');
            }

            return $this->processMatchResult($data['data']);

        } catch (GuzzleException $e) {
            $this->logger->error('Erreur de communication avec l\'IA', [
                'error' => $e->getMessage(),
                'user_id' => $userProfile['id'] ?? null,
                'job_id' => $jobOffer['id'] ?? null
            ]);

            // Fallback sur l'algorithme PHP en cas d'erreur
            return $this->fallbackMatching($userProfile, $jobOffer);
        }
    }

    /**
     * Calcule les scores pour plusieurs offres en une fois
     */
    public function calculateBatchMatches(array $userProfile, array $jobOffers): array
    {
        try {
            $this->logger->info('Calcul batch de scores de matching', [
                'user_id' => $userProfile['id'] ?? null,
                'jobs_count' => count($jobOffers)
            ]);

            $response = $this->httpClient->post('/match/batch', [
                'json' => [
                    'user_profile' => $this->formatUserProfile($userProfile),
                    'job_offers' => array_map([$this, 'formatJobOffer'], $jobOffers)
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success']) {
                throw new \Exception($data['error'] ?? 'Erreur inconnue de l\'IA');
            }

            return $data['data'];

        } catch (GuzzleException $e) {
            $this->logger->error('Erreur de communication avec l\'IA pour le batch', [
                'error' => $e->getMessage(),
                'user_id' => $userProfile['id'] ?? null,
                'jobs_count' => count($jobOffers)
            ]);

            // Fallback sur l'algorithme PHP
            $results = [];
            foreach ($jobOffers as $jobOffer) {
                $matchResult = $this->fallbackMatching($userProfile, $jobOffer);
                $matchResult['job_id'] = $jobOffer['id'] ?? null;
                $results[] = $matchResult;
            }

            // Tri par score décroissant
            usort($results, function($a, $b) {
                return $b['total_score'] <=> $a['total_score'];
            });

            return [
                'matches' => $results,
                'total_analyzed' => count($results),
                'best_match_score' => $results[0]['total_score'] ?? 0,
                'fallback_used' => true
            ];
        }
    }

    /**
     * Analyse les compétences d'un texte
     */
    public function analyzeSkills(string $text): array
    {
        try {
            $response = $this->httpClient->post('/analyze/skills', [
                'json' => ['text' => $text]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success']) {
                throw new \Exception($data['error'] ?? 'Erreur d\'analyse des compétences');
            }

            return $data['data'];

        } catch (GuzzleException $e) {
            $this->logger->error('Erreur d\'analyse des compétences', [
                'error' => $e->getMessage()
            ]);

            // Fallback simple
            return [
                'extracted_skills' => $this->extractSkillsSimple($text),
                'processed_text' => strtolower($text),
                'skills_count' => 0,
                'fallback_used' => true
            ];
        }
    }

    /**
     * Génère des recommandations d'amélioration de profil
     */
    public function getProfileRecommendations(array $userProfile, array $targetJobs = []): array
    {
        try {
            $response = $this->httpClient->post('/recommendations/profile', [
                'json' => [
                    'user_profile' => $this->formatUserProfile($userProfile),
                    'target_jobs' => array_map([$this, 'formatJobOffer'], $targetJobs)
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!$data['success']) {
                throw new \Exception($data['error'] ?? 'Erreur de génération des recommandations');
            }

            return $data['data'];

        } catch (GuzzleException $e) {
            $this->logger->error('Erreur de génération des recommandations', [
                'error' => $e->getMessage(),
                'user_id' => $userProfile['id'] ?? null
            ]);

            // Fallback simple
            return [
                'recommendations' => $this->generateBasicRecommendations($userProfile),
                'profile_completeness' => $this->calculateBasicCompleteness($userProfile),
                'fallback_used' => true
            ];
        }
    }

    /**
     * Vérifie la santé de l'engine d'IA
     */
    public function healthCheck(): array
    {
        try {
            $response = $this->httpClient->get('/health');
            $data = json_decode($response->getBody()->getContents(), true);
            
            return [
                'status' => 'healthy',
                'ai_engine_status' => $data['status'] ?? 'unknown',
                'response_time' => $response->getHeader('X-Response-Time')[0] ?? null
            ];

        } catch (GuzzleException $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'ai_engine_status' => 'unreachable'
            ];
        }
    }

    /**
     * Formate le profil utilisateur pour l'IA
     */
    private function formatUserProfile(array $userProfile): array
    {
        return [
            'id' => $userProfile['id'] ?? null,
            'skills' => [
                'technical' => $this->parseSkillsString($userProfile['technical_skills'] ?? ''),
                'soft' => $this->parseSkillsString($userProfile['soft_skills'] ?? '')
            ],
            'psychological_profile' => $userProfile['psychological_profile'] ?? [],
            'preferences' => [
                'locations' => $this->parseSkillsString($userProfile['preferred_locations'] ?? ''),
                'sectors' => $this->parseSkillsString($userProfile['preferred_sectors'] ?? ''),
                'contract_types' => $userProfile['preferred_contract_types'] ?? []
            ],
            'education' => [
                'current_level' => $userProfile['current_level'] ?? '',
                'institution' => $userProfile['institution'] ?? '',
                'field' => $userProfile['field'] ?? ''
            ],
            'experience' => [
                'years' => $userProfile['experience_years'] ?? 0,
                'has_experience' => !empty($userProfile['experience_years'])
            ],
            'personal' => [
                'firstName' => $userProfile['first_name'] ?? '',
                'lastName' => $userProfile['last_name'] ?? '',
                'email' => $userProfile['email'] ?? '',
                'phone' => $userProfile['phone'] ?? '',
                'city' => $userProfile['city'] ?? ''
            ]
        ];
    }

    /**
     * Formate l'offre d'emploi pour l'IA
     */
    private function formatJobOffer(array $jobOffer): array
    {
        return [
            'id' => $jobOffer['id'] ?? null,
            'title' => $jobOffer['title'] ?? '',
            'description' => $jobOffer['description'] ?? '',
            'company' => $jobOffer['company'] ?? '',
            'location' => $jobOffer['location'] ?? '',
            'contract_type' => $jobOffer['contract_type'] ?? '',
            'sector' => $jobOffer['sector'] ?? '',
            'required_skills' => $this->parseSkillsString($jobOffer['required_skills'] ?? ''),
            'preferred_skills' => $this->parseSkillsString($jobOffer['preferred_skills'] ?? ''),
            'required_level' => $jobOffer['required_level'] ?? '',
            'required_experience' => $jobOffer['required_experience'] ?? 0,
            'salary' => $jobOffer['salary'] ?? null,
            'remote_possible' => $jobOffer['remote_possible'] ?? false
        ];
    }

    /**
     * Parse une chaîne de compétences séparées par des virgules
     */
    private function parseSkillsString(string $skillsString): array
    {
        if (empty($skillsString)) {
            return [];
        }

        return array_map('trim', explode(',', $skillsString));
    }

    /**
     * Traite le résultat de matching de l'IA
     */
    private function processMatchResult(array $aiResult): array
    {
        return [
            'total_score' => $aiResult['total_score'] ?? 0,
            'detailed_scores' => $aiResult['detailed_scores'] ?? [],
            'compatibility_level' => $aiResult['compatibility_level'] ?? 'Inconnu',
            'match_reasons' => $aiResult['match_reasons'] ?? [],
            'recommendations' => $aiResult['recommendations'] ?? [],
            'ai_powered' => true,
            'analysis_timestamp' => $aiResult['analysis_timestamp'] ?? date('c')
        ];
    }

    /**
     * Algorithme de fallback en cas d'indisponibilité de l'IA
     */
    private function fallbackMatching(array $userProfile, array $jobOffer): array
    {
        // Utilisation de l'algorithme PHP basique
        return AdvancedMatchingService::calculateMatchScore($userProfile, $jobOffer);
    }

    /**
     * Extraction simple de compétences (fallback)
     */
    private function extractSkillsSimple(string $text): array
    {
        $commonSkills = [
            'javascript', 'python', 'java', 'php', 'html', 'css', 'sql',
            'react', 'vue', 'angular', 'node', 'laravel', 'symfony',
            'git', 'docker', 'aws', 'marketing', 'design', 'management'
        ];

        $textLower = strtolower($text);
        $foundSkills = [];

        foreach ($commonSkills as $skill) {
            if (strpos($textLower, $skill) !== false) {
                $foundSkills[] = $skill;
            }
        }

        return $foundSkills;
    }

    /**
     * Génère des recommandations basiques (fallback)
     */
    private function generateBasicRecommendations(array $userProfile): array
    {
        $recommendations = [];

        if (empty($userProfile['technical_skills'])) {
            $recommendations[] = [
                'type' => 'skills',
                'priority' => 'high',
                'title' => 'Ajoutez vos compétences techniques',
                'description' => 'Les compétences techniques sont essentielles pour un bon matching',
                'action' => 'Complétez la section compétences de votre profil'
            ];
        }

        if (empty($userProfile['psychological_profile'])) {
            $recommendations[] = [
                'type' => 'personality',
                'priority' => 'medium',
                'title' => 'Complétez votre profil psychologique',
                'description' => 'Un profil comportemental améliore la précision des matches',
                'action' => 'Répondez au questionnaire psychologique'
            ];
        }

        return $recommendations;
    }

    /**
     * Calcule la complétude basique du profil (fallback)
     */
    private function calculateBasicCompleteness(array $userProfile): array
    {
        $totalFields = 10;
        $completedFields = 0;

        $fields = [
            'first_name', 'last_name', 'email', 'technical_skills',
            'current_level', 'institution', 'preferred_locations',
            'preferred_sectors', 'psychological_profile', 'phone'
        ];

        foreach ($fields as $field) {
            if (!empty($userProfile[$field])) {
                $completedFields++;
            }
        }

        return [
            'percentage' => round(($completedFields / $totalFields) * 100, 1),
            'completed_fields' => $completedFields,
            'total_fields' => $totalFields,
            'missing_fields' => $totalFields - $completedFields
        ];
    }

    /**
     * Log des performances de l'IA
     */
    public function logPerformanceMetrics(array $metrics): void
    {
        $this->logger->info('Métriques de performance IA', $metrics);
    }
}