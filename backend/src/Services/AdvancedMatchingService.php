<?php

namespace App\Services;

use App\Models\User;
use App\Models\JobOffer;
use App\Models\PersonalityProfile;

/**
 * Service de matching avancé avec IA comportementale
 * Analyse la compatibilité entre candidats et offres d'emploi
 */
class AdvancedMatchingService 
{
    // Poids des différents critères de matching
    const WEIGHTS = [
        'skills' => 0.35,           // Compétences techniques (35%)
        'personality' => 0.25,      // Profil psychologique (25%)
        'location' => 0.15,         // Localisation (15%)
        'experience' => 0.10,       // Expérience (10%)
        'education' => 0.08,        // Formation (8%)
        'preferences' => 0.07       // Préférences (7%)
    ];

    // Mapping des traits de personnalité avec les types de postes
    const PERSONALITY_JOB_MAPPING = [
        'leadership' => ['manager', 'chef', 'responsable', 'directeur'],
        'creativity' => ['design', 'marketing', 'communication', 'créatif'],
        'analytical' => ['data', 'analyse', 'finance', 'recherche'],
        'social' => ['commercial', 'vente', 'rh', 'relation'],
        'technical' => ['développeur', 'ingénieur', 'technique', 'it'],
        'autonomous' => ['freelance', 'télétravail', 'indépendant'],
        'team_player' => ['équipe', 'collaboratif', 'projet']
    ];

    /**
     * Calcule le score de matching entre un profil utilisateur et une offre
     */
    public static function calculateMatchScore(array $userProfile, array $jobOffer): array
    {
        $scores = [];
        $totalScore = 0;
        $reasons = [];

        // 1. Analyse des compétences techniques (35%)
        $skillsScore = self::calculateSkillsMatch($userProfile, $jobOffer);
        $scores['skills'] = $skillsScore;
        $totalScore += $skillsScore * self::WEIGHTS['skills'];

        if ($skillsScore > 70) {
            $reasons[] = "Excellente correspondance de compétences techniques";
        }

        // 2. Analyse du profil psychologique (25%)
        $personalityScore = self::calculatePersonalityMatch($userProfile, $jobOffer);
        $scores['personality'] = $personalityScore;
        $totalScore += $personalityScore * self::WEIGHTS['personality'];

        if ($personalityScore > 75) {
            $reasons[] = "Profil comportemental très compatible";
        }

        // 3. Analyse géographique (15%)
        $locationScore = self::calculateLocationMatch($userProfile, $jobOffer);
        $scores['location'] = $locationScore;
        $totalScore += $locationScore * self::WEIGHTS['location'];

        if ($locationScore > 80) {
            $reasons[] = "Localisation idéale";
        }

        // 4. Analyse de l'expérience (10%)
        $experienceScore = self::calculateExperienceMatch($userProfile, $jobOffer);
        $scores['experience'] = $experienceScore;
        $totalScore += $experienceScore * self::WEIGHTS['experience'];

        // 5. Analyse de la formation (8%)
        $educationScore = self::calculateEducationMatch($userProfile, $jobOffer);
        $scores['education'] = $educationScore;
        $totalScore += $educationScore * self::WEIGHTS['education'];

        // 6. Analyse des préférences (7%)
        $preferencesScore = self::calculatePreferencesMatch($userProfile, $jobOffer);
        $scores['preferences'] = $preferencesScore;
        $totalScore += $preferencesScore * self::WEIGHTS['preferences'];

        $finalScore = round($totalScore);

        return [
            'total_score' => $finalScore,
            'detailed_scores' => $scores,
            'match_reasons' => $reasons,
            'compatibility_level' => self::getCompatibilityLevel($finalScore),
            'recommendations' => self::generateRecommendations($scores, $userProfile, $jobOffer)
        ];
    }

    /**
     * Calcule la correspondance des compétences techniques
     */
    private static function calculateSkillsMatch(array $userProfile, array $jobOffer): int
    {
        $userSkills = array_map('strtolower', $userProfile['skills']['technical'] ?? []);
        $requiredSkills = array_map('strtolower', $jobOffer['required_skills'] ?? []);
        $preferredSkills = array_map('strtolower', $jobOffer['preferred_skills'] ?? []);

        if (empty($requiredSkills)) {
            return 50; // Score neutre si pas de compétences spécifiées
        }

        $matchedRequired = 0;
        $matchedPreferred = 0;

        // Correspondance des compétences requises (poids 70%)
        foreach ($requiredSkills as $required) {
            foreach ($userSkills as $userSkill) {
                if (self::skillsSimilarity($userSkill, $required) > 0.8) {
                    $matchedRequired++;
                    break;
                }
            }
        }

        // Correspondance des compétences préférées (poids 30%)
        foreach ($preferredSkills as $preferred) {
            foreach ($userSkills as $userSkill) {
                if (self::skillsSimilarity($userSkill, $preferred) > 0.8) {
                    $matchedPreferred++;
                    break;
                }
            }
        }

        $requiredScore = count($requiredSkills) > 0 ? ($matchedRequired / count($requiredSkills)) * 70 : 0;
        $preferredScore = count($preferredSkills) > 0 ? ($matchedPreferred / count($preferredSkills)) * 30 : 30;

        return round($requiredScore + $preferredScore);
    }

    /**
     * Calcule la correspondance du profil psychologique
     */
    private static function calculatePersonalityMatch(array $userProfile, array $jobOffer): int
    {
        $personalityProfile = $userProfile['psychological_profile'] ?? [];
        $jobTitle = strtolower($jobOffer['title'] ?? '');
        $jobDescription = strtolower($jobOffer['description'] ?? '');
        $jobText = $jobTitle . ' ' . $jobDescription;

        $score = 50; // Score de base

        // Analyse du style de travail
        $workStyle = $personalityProfile['work_style'] ?? '';
        if ($workStyle === 'team' && (strpos($jobText, 'équipe') !== false || strpos($jobText, 'collabor') !== false)) {
            $score += 15;
        } elseif ($workStyle === 'independent' && (strpos($jobText, 'autonome') !== false || strpos($jobText, 'indépendant') !== false)) {
            $score += 15;
        }

        // Analyse du style d'apprentissage
        $learningStyle = $personalityProfile['learning_style'] ?? '';
        if ($learningStyle === 'practical' && strpos($jobText, 'pratique') !== false) {
            $score += 10;
        }

        // Analyse de la gestion du stress
        $stressManagement = $personalityProfile['stress_management'] ?? '';
        if ($stressManagement === 'planning' && strpos($jobText, 'organisation') !== false) {
            $score += 10;
        }

        // Analyse des motivations
        $motivations = $personalityProfile['motivation'] ?? [];
        foreach ($motivations as $motivation) {
            switch ($motivation) {
                case 'learning':
                    if (strpos($jobText, 'formation') !== false || strpos($jobText, 'apprentissage') !== false) {
                        $score += 5;
                    }
                    break;
                case 'impact':
                    if (strpos($jobText, 'impact') !== false || strpos($jobText, 'innovation') !== false) {
                        $score += 5;
                    }
                    break;
                case 'growth':
                    if (strpos($jobText, 'évolution') !== false || strpos($jobText, 'carrière') !== false) {
                        $score += 5;
                    }
                    break;
            }
        }

        // Analyse du style de communication
        $communicationStyle = $personalityProfile['communication_style'] ?? '';
        if ($communicationStyle === 'direct' && strpos($jobText, 'commercial') !== false) {
            $score += 10;
        } elseif ($communicationStyle === 'analytical' && strpos($jobText, 'analyse') !== false) {
            $score += 10;
        }

        return min($score, 100);
    }

    /**
     * Calcule la correspondance géographique
     */
    private static function calculateLocationMatch(array $userProfile, array $jobOffer): int
    {
        $userLocations = array_map('strtolower', $userProfile['preferences']['locations'] ?? []);
        $jobLocation = strtolower($jobOffer['location'] ?? '');
        $isRemote = $jobOffer['remote_possible'] ?? false;

        // Si télétravail possible et souhaité
        if ($isRemote && in_array('télétravail', $userLocations)) {
            return 100;
        }

        // Correspondance exacte de ville
        foreach ($userLocations as $userLocation) {
            if (strpos($jobLocation, $userLocation) !== false || strpos($userLocation, $jobLocation) !== false) {
                return 90;
            }
        }

        // Correspondance de région (approximative)
        $regions = [
            'paris' => ['paris', 'ile-de-france', '75', '77', '78', '91', '92', '93', '94', '95'],
            'lyon' => ['lyon', 'rhône', '69'],
            'marseille' => ['marseille', 'bouches-du-rhône', '13'],
            'toulouse' => ['toulouse', 'haute-garonne', '31'],
            'lille' => ['lille', 'nord', '59'],
            'bordeaux' => ['bordeaux', 'gironde', '33']
        ];

        foreach ($regions as $region => $cities) {
            $userInRegion = false;
            $jobInRegion = false;

            foreach ($cities as $city) {
                if (in_array($city, $userLocations)) $userInRegion = true;
                if (strpos($jobLocation, $city) !== false) $jobInRegion = true;
            }

            if ($userInRegion && $jobInRegion) {
                return 70;
            }
        }

        return 30; // Score par défaut si pas de correspondance
    }

    /**
     * Calcule la correspondance d'expérience
     */
    private static function calculateExperienceMatch(array $userProfile, array $jobOffer): int
    {
        $userExperience = $userProfile['experience']['years'] ?? 0;
        $requiredExperience = $jobOffer['required_experience'] ?? 0;

        if ($requiredExperience == 0) {
            return 100; // Pas d'expérience requise
        }

        if ($userExperience >= $requiredExperience) {
            return 100;
        } elseif ($userExperience >= $requiredExperience * 0.7) {
            return 80;
        } elseif ($userExperience >= $requiredExperience * 0.5) {
            return 60;
        } else {
            return 30;
        }
    }

    /**
     * Calcule la correspondance de formation
     */
    private static function calculateEducationMatch(array $userProfile, array $jobOffer): int
    {
        $userLevel = $userProfile['education']['current_level'] ?? '';
        $requiredLevel = $jobOffer['required_level'] ?? '';

        $levelMapping = [
            'bac' => 1,
            'bac+1' => 2,
            'bac+2' => 3,
            'bac+3' => 4,
            'bac+4' => 5,
            'bac+5' => 6,
            'bac+8' => 7
        ];

        $userLevelNum = $levelMapping[$userLevel] ?? 0;
        $requiredLevelNum = $levelMapping[$requiredLevel] ?? 0;

        if ($requiredLevelNum == 0) {
            return 100; // Pas de niveau spécifié
        }

        if ($userLevelNum >= $requiredLevelNum) {
            return 100;
        } elseif ($userLevelNum >= $requiredLevelNum - 1) {
            return 80;
        } else {
            return 50;
        }
    }

    /**
     * Calcule la correspondance des préférences
     */
    private static function calculatePreferencesMatch(array $userProfile, array $jobOffer): int
    {
        $score = 0;

        // Type de contrat
        $preferredContracts = $userProfile['preferences']['contract_types'] ?? [];
        $jobContract = $jobOffer['contract_type'] ?? '';
        if (in_array($jobContract, $preferredContracts)) {
            $score += 40;
        }

        // Secteur d'activité
        $preferredSectors = array_map('strtolower', $userProfile['preferences']['sectors'] ?? []);
        $jobSector = strtolower($jobOffer['sector'] ?? '');
        foreach ($preferredSectors as $sector) {
            if (strpos($jobSector, $sector) !== false) {
                $score += 40;
                break;
            }
        }

        // Salaire
        $expectedSalary = $userProfile['preferences']['salary_expectation'] ?? '';
        $offeredSalary = $jobOffer['salary'] ?? 0;
        if ($expectedSalary && $offeredSalary) {
            // Logique de comparaison de salaire
            $score += 20;
        } else {
            $score += 20; // Score neutre si pas d'info salaire
        }

        return min($score, 100);
    }

    /**
     * Calcule la similarité entre deux compétences
     */
    private static function skillsSimilarity(string $skill1, string $skill2): float
    {
        // Correspondance exacte
        if ($skill1 === $skill2) {
            return 1.0;
        }

        // Correspondance partielle
        if (strpos($skill1, $skill2) !== false || strpos($skill2, $skill1) !== false) {
            return 0.9;
        }

        // Synonymes et variantes courantes
        $synonyms = [
            'javascript' => ['js', 'node', 'nodejs'],
            'python' => ['py', 'django', 'flask'],
            'java' => ['spring', 'hibernate'],
            'php' => ['laravel', 'symfony'],
            'react' => ['reactjs', 'react.js'],
            'angular' => ['angularjs'],
            'vue' => ['vuejs', 'vue.js']
        ];

        foreach ($synonyms as $main => $variants) {
            if (($skill1 === $main && in_array($skill2, $variants)) ||
                ($skill2 === $main && in_array($skill1, $variants)) ||
                (in_array($skill1, $variants) && in_array($skill2, $variants))) {
                return 0.85;
            }
        }

        return 0.0;
    }

    /**
     * Détermine le niveau de compatibilité
     */
    private static function getCompatibilityLevel(int $score): string
    {
        if ($score >= 85) return 'Excellent';
        if ($score >= 70) return 'Très bon';
        if ($score >= 55) return 'Bon';
        if ($score >= 40) return 'Moyen';
        return 'Faible';
    }

    /**
     * Génère des recommandations d'amélioration
     */
    private static function generateRecommendations(array $scores, array $userProfile, array $jobOffer): array
    {
        $recommendations = [];

        if ($scores['skills'] < 60) {
            $recommendations[] = "Développez vos compétences techniques pour mieux correspondre aux exigences";
        }

        if ($scores['personality'] < 50) {
            $recommendations[] = "Mettez en avant les aspects de votre personnalité qui correspondent au poste";
        }

        if ($scores['location'] < 40) {
            $recommendations[] = "Considérez élargir votre zone de recherche géographique";
        }

        if ($scores['experience'] < 50) {
            $recommendations[] = "Valorisez vos expériences pertinentes, même non professionnelles";
        }

        return $recommendations;
    }

    /**
     * Analyse comportementale avancée pour prédire la réussite
     */
    public static function predictJobSuccess(array $userProfile, array $jobOffer): array
    {
        $successFactors = [];
        $riskFactors = [];
        $successProbability = 50; // Base

        $personalityProfile = $userProfile['psychological_profile'] ?? [];
        $jobRequirements = $jobOffer['requirements'] ?? [];

        // Analyse des facteurs de réussite
        if (isset($personalityProfile['work_style']) && $personalityProfile['work_style'] === 'team') {
            if (strpos(strtolower($jobOffer['description'] ?? ''), 'équipe') !== false) {
                $successFactors[] = "Excellent esprit d'équipe";
                $successProbability += 15;
            }
        }

        if (isset($personalityProfile['stress_management']) && $personalityProfile['stress_management'] === 'planning') {
            $successFactors[] = "Bonne gestion du stress par l'organisation";
            $successProbability += 10;
        }

        // Analyse des facteurs de risque
        if (isset($personalityProfile['work_style']) && $personalityProfile['work_style'] === 'independent') {
            if (strpos(strtolower($jobOffer['description'] ?? ''), 'supervision') !== false) {
                $riskFactors[] = "Préférence pour l'autonomie vs environnement supervisé";
                $successProbability -= 10;
            }
        }

        return [
            'success_probability' => min(max($successProbability, 0), 100),
            'success_factors' => $successFactors,
            'risk_factors' => $riskFactors,
            'recommendation' => $successProbability > 70 ? 'Candidature fortement recommandée' : 
                              ($successProbability > 50 ? 'Candidature recommandée avec préparation' : 'Candidature à considérer avec prudence')
        ];
    }

    /**
     * Génère des insights personnalisés pour l'utilisateur
     */
    public static function generatePersonalizedInsights(array $userProfile, array $recentMatches): array
    {
        $insights = [];
        
        // Analyse des tendances de matching
        $avgScore = array_sum(array_column($recentMatches, 'match_score')) / count($recentMatches);
        
        if ($avgScore > 75) {
            $insights[] = [
                'type' => 'positive',
                'message' => 'Votre profil génère d\'excellents matches ! Continuez sur cette voie.',
                'action' => null
            ];
        } elseif ($avgScore < 50) {
            $insights[] = [
                'type' => 'improvement',
                'message' => 'Vos scores de matching peuvent être améliorés.',
                'action' => 'Complétez votre profil et ajoutez plus de compétences'
            ];
        }

        // Analyse des compétences manquantes
        $allRequiredSkills = [];
        foreach ($recentMatches as $match) {
            $allRequiredSkills = array_merge($allRequiredSkills, $match['required_skills'] ?? []);
        }
        
        $skillFrequency = array_count_values($allRequiredSkills);
        arsort($skillFrequency);
        
        $userSkills = array_map('strtolower', $userProfile['skills']['technical'] ?? []);
        $topMissingSkills = [];
        
        foreach (array_slice($skillFrequency, 0, 5, true) as $skill => $frequency) {
            if (!in_array(strtolower($skill), $userSkills)) {
                $topMissingSkills[] = $skill;
            }
        }
        
        if (!empty($topMissingSkills)) {
            $insights[] = [
                'type' => 'skill_recommendation',
                'message' => 'Compétences très demandées dans vos matches : ' . implode(', ', array_slice($topMissingSkills, 0, 3)),
                'action' => 'Considérez développer ces compétences pour améliorer vos matches'
            ];
        }

        return $insights;
    }
}
