<?php

namespace App\Models;

use PDO;

class PersonalityProfile
{
    private PDO $conn;
    private string $table = 'personality_profiles';

    // Propriétés du profil de personnalité
    public ?int $id = null;
    public ?int $user_id = null;
    public ?int $openness = null;           // Ouverture d'esprit (0-100)
    public ?int $conscientiousness = null;  // Conscienciosité (0-100)
    public ?int $extraversion = null;       // Extraversion (0-100)
    public ?int $agreeableness = null;      // Agréabilité (0-100)
    public ?int $neuroticism = null;        // Neuroticisme (0-100)
    public ?string $leadership_style = null;   // Style de leadership
    public ?string $work_environment = null;   // Environnement de travail préféré
    public ?string $communication_style = null; // Style de communication
    public ?string $stress_management = null;  // Gestion du stress
    public $motivation_factors = [];
    public $career_goals = [];
    public ?string $created_at = null;
    public ?string $updated_at = null;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    /**
     * Crée un nouveau profil de personnalité
     */
    public function create(): bool
    {
        $query = "INSERT INTO {$this->table} SET
            user_id = :user_id,
            openness = :openness,
            conscientiousness = :conscientiousness,
            extraversion = :extraversion,
            agreeableness = :agreeableness,
            neuroticism = :neuroticism,
            leadership_style = :leadership_style,
            work_environment = :work_environment,
            communication_style = :communication_style,
            stress_management = :stress_management,
            motivation_factors = :motivation_factors,
            career_goals = :career_goals,
            created_at = NOW(),
            updated_at = NOW()";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données textuelles
        $leadership_style = htmlspecialchars(strip_tags($this->leadership_style ?? ''));
        $work_environment = htmlspecialchars(strip_tags($this->work_environment ?? ''));
        $communication_style = htmlspecialchars(strip_tags($this->communication_style ?? ''));
        $stress_management = htmlspecialchars(strip_tags($this->stress_management ?? ''));

        // Encoder les arrays en JSON
        $motivation_factors_json = json_encode($this->motivation_factors);
        $career_goals_json = json_encode($this->career_goals);

        // Lier les paramètres
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':openness', $this->openness);
        $stmt->bindParam(':conscientiousness', $this->conscientiousness);
        $stmt->bindParam(':extraversion', $this->extraversion);
        $stmt->bindParam(':agreeableness', $this->agreeableness);
        $stmt->bindParam(':neuroticism', $this->neuroticism);
        $stmt->bindParam(':leadership_style', $leadership_style);
        $stmt->bindParam(':work_environment', $work_environment);
        $stmt->bindParam(':communication_style', $communication_style);
        $stmt->bindParam(':stress_management', $stress_management);
        $stmt->bindParam(':motivation_factors', $motivation_factors_json);
        $stmt->bindParam(':career_goals', $career_goals_json);

        if ($stmt->execute()) {
            $this->id = (int)$this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    /**
     * Trouver le profil par user_id
     */
    /**
     * Trouve le profil par user_id
     */
    public function findByUserId(int $user_id): bool
    {
        $query = "SELECT * FROM {$this->table} WHERE user_id = :user_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            foreach ($row as $key => $value) {
                if (property_exists($this, $key)) {
                    if ($key === 'motivation_factors' || $key === 'career_goals') {
                        $this->$key = json_decode($value, true) ?? [];
                    } else {
                        $this->$key = $value;
                    }
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Mettre à jour le profil de personnalité
     */
    /**
     * Met à jour le profil de personnalité
     */
    public function update(): bool
    {
        $query = "UPDATE {$this->table} SET
            openness = :openness,
            conscientiousness = :conscientiousness,
            extraversion = :extraversion,
            agreeableness = :agreeableness,
            neuroticism = :neuroticism,
            leadership_style = :leadership_style,
            work_environment = :work_environment,
            communication_style = :communication_style,
            stress_management = :stress_management,
            motivation_factors = :motivation_factors,
            career_goals = :career_goals,
            updated_at = NOW()
            WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);

        $leadership_style = htmlspecialchars(strip_tags($this->leadership_style ?? ''));
        $work_environment = htmlspecialchars(strip_tags($this->work_environment ?? ''));
        $communication_style = htmlspecialchars(strip_tags($this->communication_style ?? ''));
        $stress_management = htmlspecialchars(strip_tags($this->stress_management ?? ''));

        $motivation_factors_json = json_encode($this->motivation_factors);
        $career_goals_json = json_encode($this->career_goals);

        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':openness', $this->openness);
        $stmt->bindParam(':conscientiousness', $this->conscientiousness);
        $stmt->bindParam(':extraversion', $this->extraversion);
        $stmt->bindParam(':agreeableness', $this->agreeableness);
        $stmt->bindParam(':neuroticism', $this->neuroticism);
        $stmt->bindParam(':leadership_style', $leadership_style);
        $stmt->bindParam(':work_environment', $work_environment);
        $stmt->bindParam(':communication_style', $communication_style);
        $stmt->bindParam(':stress_management', $stress_management);
        $stmt->bindParam(':motivation_factors', $motivation_factors_json);
        $stmt->bindParam(':career_goals', $career_goals_json);

        return $stmt->execute();
    }

    /**
     * Calculer le score de compatibilité avec une offre d'emploi
     */
    public function getCompatibilityScore($jobRequirements)
    {
        $score = 0;
        $maxScore = 0;

        // Évaluer l'ouverture d'esprit pour l'innovation
        if (isset($jobRequirements['innovation_required'])) {
            $maxScore += 20;
            if ($jobRequirements['innovation_required'] && $this->openness >= 70) {
                $score += 20;
            } elseif (!$jobRequirements['innovation_required'] && $this->openness <= 50) {
                $score += 15;
            }
        }

        // Évaluer la conscienciosité pour les rôles de responsabilité
        if (isset($jobRequirements['responsibility_level'])) {
            $maxScore += 25;
            $responsibilityScore = ($this->conscientiousness * $jobRequirements['responsibility_level']) / 100;
            $score += $responsibilityScore * 0.25;
        }

        // Évaluer l'extraversion pour les rôles client/équipe
        if (isset($jobRequirements['team_interaction'])) {
            $maxScore += 20;
            $interactionScore = ($this->extraversion * $jobRequirements['team_interaction']) / 100;
            $score += $interactionScore * 0.20;
        }

        // Évaluer la gestion du stress pour l'environnement de travail
        if (isset($jobRequirements['stress_level'])) {
            $maxScore += 15;
            $stressCompatibility = 100 - abs($this->neuroticism - $jobRequirements['stress_level']);
            $score += ($stressCompatibility / 100) * 15;
        }

        // Évaluer l'agréabilité pour le travail d'équipe
        if (isset($jobRequirements['teamwork_required'])) {
            $maxScore += 20;
            if ($jobRequirements['teamwork_required'] && $this->agreeableness >= 60) {
                $score += 20;
            } elseif (!$jobRequirements['teamwork_required'] && $this->agreeableness <= 40) {
                $score += 15;
            }
        }

        return $maxScore > 0 ? ($score / $maxScore) * 100 : 0;
    }

    /**
     * Obtenir les traits de personnalité sous forme de tableau
     */
    /**
     * Retourne les traits de personnalité sous forme de tableau
     */
    public function getPersonalityTraits(): array
    {
        return [
            'openness' => $this->openness,
            'conscientiousness' => $this->conscientiousness,
            'extraversion' => $this->extraversion,
            'agreeableness' => $this->agreeableness,
            'neuroticism' => $this->neuroticism
        ];
    }

    /**
     * Obtenir les facteurs de motivation décodés
     */
    /**
     * Retourne les facteurs de motivation
     */
    public function getMotivationFactors(): array
    {
        return $this->motivation_factors;
    }

    /**
     * Obtenir les objectifs de carrière décodés
     */
    /**
     * Retourne les objectifs de carrière
     */
    public function getCareerGoals(): array
    {
        return $this->career_goals;
    }

    /**
     * Définir les facteurs de motivation
     */
    /**
     * Définit les facteurs de motivation
     */
    public function setMotivationFactors(array $factors): void
    {
        $this->motivation_factors = $factors;
    }

    /**
     * Définir les objectifs de carrière
     */
    /**
     * Définit les objectifs de carrière
     */
    public function setCareerGoals(array $goals): void
    {
        $this->career_goals = $goals;
    }
}
