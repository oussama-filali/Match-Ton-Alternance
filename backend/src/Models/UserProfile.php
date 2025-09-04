<?php
// filepath: c:\wamp64\www\Match-Ton-Alternance\backend\src\Models\UserProfile.php

namespace App\Models;

// Modèle UserProfile orienté Supabase uniquement (plus de PDO/MySQL)
class UserProfile
{
    // Propriétés du profil utilisateur (doivent correspondre à la table Supabase)
    public $id;
    public $user_id;
    public $first_name;
    public $last_name;
    public $phone;
    public $location;
    public $education_level;
    public $field_of_study;
    public $experience_level;
    public $desired_position;
    public $preferred_company_size;
    public $preferred_work_type;
    public $salary_expectation_min;
    public $salary_expectation_max;
    public $skills;
    public $bio;
    public $created_at;
    public $updated_at;

    // Exemple d'appel Supabase REST API (à implémenter via SupabaseClient)
    // public static function create(array $data) { /* ... */ }
    // public static function findByUserId(string $user_id) { /* ... */ }
    // public static function update(string $user_id, array $data) { /* ... */ }
    // ...
}