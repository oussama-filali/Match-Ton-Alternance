<?php
class JobOffer {
    public static function getAll() {
        return [
            [
                'id' => 1,
                'title' => 'Développeur React',
                'region' => 'PACA',
                'skills' => ['react', 'js', 'frontend'],
                'exigence' => 70,
                'max_distance' => 25
            ],
            [
                'id' => 2,
                'title' => 'Dev PHP Laravel',
                'region' => 'Ile-de-France',
                'skills' => ['php', 'laravel'],
                'exigence' => 50,
                'max_distance' => 20
            ]
        ];
    }
        // Nettoyer le modèle JobOffer pour n'utiliser que la structure Supabase/PostgreSQL
        // Plus de référence à MySQL, tout accès se fait via Supabase REST API
}
