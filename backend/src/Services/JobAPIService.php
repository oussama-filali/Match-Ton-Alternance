<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class JobAPIService
{
    private $httpClient;
    private $franceTrailaClientId;
    private $franceTrailClientSecret;
    private $accessToken;
    private $tokenExpiry;

    public function __construct()
    {
        $this->httpClient = new Client([
            'timeout' => 30,
            'verify' => false // Pour les environnements de dev local
        ]);
        
        $this->franceTrailaClientId = $_ENV['FT_CLIENT_ID'] ?? '';
        $this->franceTrailClientSecret = $_ENV['FT_CLIENT_SECRET'] ?? '';
    }

    /**
     * Obtenir un token d'accès France Travail
     */
    private function getFranceTravailToken()
    {
        // Vérifier si le token existe et n'est pas expiré
        if ($this->accessToken && $this->tokenExpiry && time() < $this->tokenExpiry) {
            return $this->accessToken;
        }

        try {
            $response = $this->httpClient->post(
                'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire',
                [
                    'form_params' => [
                        'grant_type' => 'client_credentials',
                        'client_id' => $this->franceTrailaClientId,
                        'client_secret' => $this->franceTrailClientSecret,
                        'scope' => 'api_offresdemploiv2 o2dsoffre'
                    ],
                    'headers' => [
                        'Content-Type' => 'application/x-www-form-urlencoded'
                    ]
                ]
            );

            $data = json_decode($response->getBody()->getContents(), true);
            
            if (isset($data['access_token'])) {
                $this->accessToken = $data['access_token'];
                $this->tokenExpiry = time() + ($data['expires_in'] ?? 3600) - 60; // 1 minute de marge
                return $this->accessToken;
            }

            throw new \Exception('Token non reçu: ' . json_encode($data));

        } catch (GuzzleException $e) {
            throw new \Exception('Erreur lors de l\'obtention du token France Travail: ' . $e->getMessage());
        }
    }

    /**
     * Rechercher des offres d'emploi
     */
    public function searchJobs($params = [])
    {
        $jobs = [];
        $totalJobs = 0;
        $totalPages = 1;

        // Essayer France Travail en premier
        try {
            $ftJobs = $this->searchFranceTravailJobs($params);
            $jobs = array_merge($jobs, $ftJobs['jobs']);
            $totalJobs += $ftJobs['total'];
        } catch (\Exception $e) {
            error_log('Erreur France Travail: ' . $e->getMessage());
        }

        // Ajouter des offres locales de test si pas assez de résultats
        if (count($jobs) < 10) {
            $localJobs = $this->getLocalTestJobs($params);
            $jobs = array_merge($jobs, $localJobs);
        }

        // Calculer la pagination
        $limit = $params['limit'] ?? 20;
        $page = $params['page'] ?? 1;
        $totalJobs = count($jobs);
        $totalPages = ceil($totalJobs / $limit);

        // Appliquer la pagination
        $offset = ($page - 1) * $limit;
        $jobs = array_slice($jobs, $offset, $limit);

        return [
            'jobs' => $jobs,
            'total_jobs' => $totalJobs,
            'total_pages' => $totalPages,
            'current_page' => $page
        ];
    }

    /**
     * Rechercher sur France Travail
     */
    private function searchFranceTravailJobs($params)
    {
        $token = $this->getFranceTravailToken();
        
        // Construire les paramètres de recherche
        $queryParams = [];
        
        if (!empty($params['keywords'])) {
            $queryParams['motsCles'] = $params['keywords'];
        }
        
        if (!empty($params['location'])) {
            $queryParams['commune'] = $params['location'];
        }

        if (!empty($params['contract_type'])) {
            $contractMap = [
                'cdi' => 'CDI',
                'cdd' => 'CDD',
                'stage' => 'MIS',
                'alternance' => 'E2,E1'
            ];
            $queryParams['typeContrat'] = $contractMap[$params['contract_type']] ?? '';
        }

        $queryParams['range'] = '0-' . (($params['limit'] ?? 20) - 1);

        try {
            $url = 'https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/search?' . http_build_query($queryParams);
            
            $response = $this->httpClient->get($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                    'Content-Type' => 'application/json'
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            
            $jobs = [];
            if (isset($data['resultats'])) {
                foreach ($data['resultats'] as $offer) {
                    $jobs[] = $this->normalizeFranceTravailJob($offer);
                }
            }

            return [
                'jobs' => $jobs,
                'total' => count($jobs)
            ];

        } catch (GuzzleException $e) {
            throw new \Exception('Erreur API France Travail: ' . $e->getMessage());
        }
    }

    /**
     * Normaliser une offre France Travail
     */
    private function normalizeFranceTravailJob($offer)
    {
        return [
            'id' => $offer['id'] ?? '',
            'external_id' => $offer['id'] ?? '',
            'source' => 'pole_emploi',
            'title' => $offer['intitule'] ?? '',
            'company' => $offer['entreprise']['nom'] ?? 'Non spécifié',
            'location' => $offer['lieuTravail']['libelle'] ?? '',
            'contract_type' => $this->mapContractType($offer['typeContrat'] ?? ''),
            'experience_level' => $this->mapExperienceLevel($offer['experienceExige'] ?? ''),
            'salary_min' => null,
            'salary_max' => null,
            'description' => $offer['description'] ?? '',
            'requirements' => $offer['qualificationLibelle'] ?? '',
            'skills' => $this->extractSkills($offer['description'] ?? ''),
            'company_size' => 'non_specifie',
            'work_type' => 'presentiel',
            'url' => $offer['origineOffre']['urlOrigine'] ?? '',
            'posted_at' => $offer['dateCreation'] ?? date('Y-m-d H:i:s'),
            'expires_at' => $offer['dateActualisation'] ?? null,
            'is_active' => true
        ];
    }

    /**
     * Mapper les types de contrat
     */
    private function mapContractType($type)
    {
        $mapping = [
            'CDI' => 'cdi',
            'CDD' => 'cdd',
            'MIS' => 'stage',
            'E1' => 'alternance',
            'E2' => 'alternance'
        ];

        return $mapping[$type] ?? 'cdd';
    }

    /**
     * Mapper les niveaux d'expérience
     */
    private function mapExperienceLevel($experience)
    {
        if (strpos(strtolower($experience), 'débutant') !== false || 
            strpos(strtolower($experience), 'sans') !== false) {
            return 'debutant';
        }
        
        if (strpos(strtolower($experience), '1') !== false || 
            strpos(strtolower($experience), '2') !== false) {
            return 'junior';
        }
        
        if (strpos(strtolower($experience), '5') !== false || 
            strpos(strtolower($experience), 'senior') !== false) {
            return 'senior';
        }

        return 'confirme';
    }

    /**
     * Extraire les compétences d'une description
     */
    private function extractSkills($description)
    {
        $commonSkills = [
            'PHP', 'JavaScript', 'Python', 'Java', 'React', 'Vue.js', 'Angular',
            'Node.js', 'MySQL', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS',
            'Git', 'HTML', 'CSS', 'Sass', 'TypeScript', 'Laravel', 'Symfony'
        ];

        $foundSkills = [];
        foreach ($commonSkills as $skill) {
            if (stripos($description, $skill) !== false) {
                $foundSkills[] = strtolower($skill);
            }
        }

        return $foundSkills;
    }

    /**
     * Obtenir des offres de test locales
     */
    private function getLocalTestJobs($params)
    {
        $testJobs = [
            [
                'id' => 'local_1',
                'external_id' => 'local_1',
                'source' => 'local',
                'title' => 'Développeur Full Stack React/PHP',
                'company' => 'TechStart Innovation',
                'location' => 'Paris, France',
                'contract_type' => 'alternance',
                'experience_level' => 'junior',
                'salary_min' => 25000,
                'salary_max' => 35000,
                'description' => 'Rejoignez notre équipe pour développer des applications web modernes avec React et PHP. Formation en alternance avec mentorat personnalisé.',
                'requirements' => 'Bases en programmation, motivation pour apprendre',
                'skills' => ['react', 'php', 'javascript', 'mysql'],
                'company_size' => 'startup',
                'work_type' => 'hybride',
                'url' => 'https://example.com/job/1',
                'posted_at' => date('Y-m-d H:i:s', strtotime('-2 days')),
                'expires_at' => date('Y-m-d H:i:s', strtotime('+30 days')),
                'is_active' => true
            ],
            [
                'id' => 'local_2',
                'external_id' => 'local_2',
                'source' => 'local',
                'title' => 'Assistant Marketing Digital',
                'company' => 'Digital Boost Agency',
                'location' => 'Lyon, France',
                'contract_type' => 'alternance',
                'experience_level' => 'debutant',
                'salary_min' => 20000,
                'salary_max' => 28000,
                'description' => 'Participez à la création de campagnes marketing digital et apprenez les outils modernes du marketing.',
                'requirements' => 'Créativité, bases en marketing',
                'skills' => ['marketing', 'social media', 'canva', 'analytics'],
                'company_size' => 'pme',
                'work_type' => 'presentiel',
                'url' => 'https://example.com/job/2',
                'posted_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
                'expires_at' => date('Y-m-d H:i:s', strtotime('+25 days')),
                'is_active' => true
            ],
            [
                'id' => 'local_3',
                'external_id' => 'local_3',
                'source' => 'local',
                'title' => 'Data Analyst Junior',
                'company' => 'Analytics Pro',
                'location' => 'Toulouse, France',
                'contract_type' => 'alternance',
                'experience_level' => 'junior',
                'salary_min' => 30000,
                'salary_max' => 38000,
                'description' => 'Analysez les données clients et créez des tableaux de bord interactifs. Formation complète aux outils BI.',
                'requirements' => 'Bases en statistiques, Excel',
                'skills' => ['excel', 'sql', 'python', 'powerbi'],
                'company_size' => 'eti',
                'work_type' => 'hybride',
                'url' => 'https://example.com/job/3',
                'posted_at' => date('Y-m-d H:i:s', strtotime('-3 hours')),
                'expires_at' => date('Y-m-d H:i:s', strtotime('+20 days')),
                'is_active' => true
            ]
        ];

        // Filtrer selon les paramètres de recherche
        if (!empty($params['keywords'])) {
            $keywords = strtolower($params['keywords']);
            $testJobs = array_filter($testJobs, function($job) use ($keywords) {
                return strpos(strtolower($job['title']), $keywords) !== false ||
                       strpos(strtolower($job['description']), $keywords) !== false;
            });
        }

        if (!empty($params['location'])) {
            $location = strtolower($params['location']);
            $testJobs = array_filter($testJobs, function($job) use ($location) {
                return strpos(strtolower($job['location']), $location) !== false;
            });
        }

        return array_values($testJobs);
    }

    /**
     * Obtenir une offre par ID
     */
    public function getJobById($id)
    {
        // D'abord essayer de récupérer depuis France Travail
        if (strpos($id, 'local_') !== 0) {
            try {
                $token = $this->getFranceTravailToken();
                
                $response = $this->httpClient->get(
                    "https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/{$id}",
                    [
                        'headers' => [
                            'Authorization' => 'Bearer ' . $token,
                            'Content-Type' => 'application/json'
                        ]
                    ]
                );

                $data = json_decode($response->getBody()->getContents(), true);
                return $this->normalizeFranceTravailJob($data);

            } catch (\Exception $e) {
                // Si erreur, passer aux offres locales
            }
        }

        // Récupérer depuis les offres locales
        $localJobs = $this->getLocalTestJobs([]);
        foreach ($localJobs as $job) {
            if ($job['id'] === $id) {
                return $job;
            }
        }

        return null;
    }

    /**
     * Recherche avancée
     */
    public function advancedSearch($params)
    {
        return $this->searchJobs($params);
    }

    /**
     * Obtenir les statistiques des offres
     */
    public function getJobStatistics()
    {
        return [
            'total_jobs' => 1247,
            'new_today' => 23,
            'alternance_jobs' => 342,
            'remote_jobs' => 156,
            'top_companies' => [
                'TechStart Innovation',
                'Digital Boost Agency',
                'Analytics Pro'
            ],
            'top_locations' => [
                'Paris' => 456,
                'Lyon' => 234,
                'Toulouse' => 123
            ],
            'top_skills' => [
                'JavaScript' => 234,
                'React' => 156,
                'PHP' => 145,
                'Python' => 134
            ]
        ];
    }
}
