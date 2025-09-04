<?php

namespace App\Controllers;

use App\Models\User;
use App\Models\UserProfile;
use App\Config\Database;
use App\Config\SupabaseClient;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Exception;

class AuthController
{
    private $db;
    private $jwt_secret;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->connect();
        $this->jwt_secret = $_ENV['JWT_SECRET'] ?? 'your-secret-key';
    }

    /**
     * Inscription d'un nouvel utilisateur (simple et lisible)
     */
    public function register(Request $request, Response $response)
    {
        try {
            $payload = (string) $request->getBody();
            $data = json_decode($payload, true) ?: [];

            $email = strtolower(trim($data['email'] ?? ''));
            $password = (string)($data['password'] ?? '');
            $name = trim($data['name'] ?? '');

            // Validations
            if ($email === '' || $password === '' || $name === '') {
                return $this->json($response, 400, false, 'Tous les champs sont obligatoires');
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->json($response, 400, false, 'Email invalide');
            }
            if (strlen($password) < 6) {
                return $this->json($response, 400, false, 'Le mot de passe doit contenir au moins 6 caractères');
            }

            $user = new User($this->db);

            if ($user->emailExists($email)) {
                return $this->json($response, 409, false, 'Cet email est déjà utilisé');
            }

            // Création
            $user->email = $email;
            $user->password = $password;
            $user->name = $name;
            $user->role = 'user';

            if (!$user->create()) {
                return $this->json($response, 500, false, "Erreur lors de la création de l'utilisateur");
            }

            $token = $this->generateJWT($user->id, $user->email, $user->role);
            return $this->json($response, 201, true, 'Inscription réussie', [
                'user' => $user->getPublicData(),
                'token' => $token,
            ]);
        } catch (\PDOException $e) {
            // Contrainte d'unicité Postgres: 23505
            if ($e->getCode() === '23505') {
                return $this->json($response, 409, false, 'Cet email est déjà utilisé');
            }
            return $this->json($response, 500, false, 'Erreur base de données: ' . $e->getMessage());
        } catch (Exception $e) {
            return $this->json($response, 500, false, 'Erreur serveur: ' . $e->getMessage());
        }
    }

    /**
     * Connexion d'un utilisateur (simple et lisible)
     */
    public function login(Request $request, Response $response)
    {
        try {
            $payload = (string) $request->getBody();
            $data = json_decode($payload, true) ?: [];

            $email = strtolower(trim($data['email'] ?? ''));
            $password = (string)($data['password'] ?? '');

            if ($email === '' || $password === '') {
                return $this->json($response, 400, false, 'Email et mot de passe obligatoires');
            }

            $user = new User($this->db);
            if (!$user->findByEmail($email)) {
                return $this->json($response, 401, false, 'Identifiants incorrects');
            }

            if (!$user->verifyPassword($password)) {
                return $this->json($response, 401, false, 'Identifiants incorrects');
            }

            $token = $this->generateJWT($user->id, $user->email, $user->role);
            return $this->json($response, 200, true, 'Connexion réussie', [
                'user' => $user->getPublicData(),
                'token' => $token,
            ]);
        } catch (Exception $e) {
            return $this->json($response, 500, false, 'Erreur serveur: ' . $e->getMessage());
        }
    }

    /**
     * Lancer un email de réinitialisation de mot de passe via Supabase Auth
     */
    public function forgotPassword(Request $request, Response $response)
    {
        try {
            $payload = (string) $request->getBody();
            $data = json_decode($payload, true) ?: [];
            $email = strtolower(trim($data['email'] ?? ''));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->json($response, 400, false, 'Email invalide');
            }

            // Utilise Supabase Auth endpoint /auth/v1/recover
            $client = new SupabaseClient();
            $redirectTo = $_ENV['SUPABASE_REDIRECT_URL'] ?? ($_ENV['APP_URL'] ?? '') . '/reset-password';
            $result = $this->supabaseRecover($client, $email, $redirectTo);

            if (!$result['success']) {
                return $this->json($response, 400, false, 'Impossible d\'envoyer l\'email de réinitialisation');
            }
            return $this->json($response, 200, true, 'Email de réinitialisation envoyé');
        } catch (Exception $e) {
            return $this->json($response, 500, false, 'Erreur serveur: ' . $e->getMessage());
        }
    }

    private function supabaseRecover(SupabaseClient $client, string $email, string $redirectTo): array
    {
        // Reutilise la méthode request via select wrapper -> simple call to auth recover
        $r = (new \ReflectionClass($client))->getMethod('select'); // ensure class is loaded
        // Call private request through a small inline call using REST endpoint in SupabaseClient
        // hack-free approach: create a tiny local cURL here
        $url = rtrim($_ENV['SUPABASE_URL'] ?? '', '/') . '/auth/v1/recover';
        $apiKey = $_ENV['SUPABASE_ANON_KEY'] ?? '';
        $headers = [
            "apikey: {$apiKey}",
            "Authorization: Bearer {$apiKey}",
            'Content-Type: application/json',
            'Accept: application/json',
        ];
        $body = json_encode(['email' => $email, 'redirect_to' => $redirectTo]);
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 30,
        ]);
        $resp = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return [ 'success' => $status >= 200 && $status < 300, 'status' => $status, 'body' => $resp ];
    }

    /**
     * Obtenir le profil de l'utilisateur connecté
     */
    public function getProfile(Request $request, Response $response)
    {
        $user_id = $this->getUserIdFromToken($request);

        if (!$user_id) {
            return $this->json($response, 401, false, 'Token invalide ou manquant');
        }

        $user = new User($this->db);
        if (!$user->findById($user_id)) {
            return $this->json($response, 404, false, 'Utilisateur non trouvé');
        }

        return $this->json($response, 200, true, 'Profil récupéré', $user->getPublicData());
    }

    /**
     * Déconnexion (côté client seulement)
     */
    public function logout(Request $request, Response $response)
    {
        return $this->json($response, 200, true, 'Déconnexion réussie');
    }

    /**
     * Générer un token JWT
     */
    private function generateJWT($user_id, $email, $role)
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + (24 * 60 * 60);

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'data' => [
                'user_id' => $user_id,
                'email' => $email,
                'role' => $role
            ]
        ];

        return JWT::encode($payload, $this->jwt_secret, 'HS256');
    }

    /**
     * Extraire l'ID utilisateur du token JWT
     */
    private function getUserIdFromToken(Request $request)
    {
        $authHeader = $request->getHeaderLine('Authorization');
        if (!$authHeader) return null;
        $token = str_replace('Bearer ', '', $authHeader);

        try {
            $decoded = JWT::decode($token, new Key($this->jwt_secret, 'HS256'));
            return $decoded->data->user_id ?? null;
        } catch (Exception $e) {
            return null;
        }
    }

    /** Helper JSON uniforme */
    private function json(Response $response, int $status, bool $success, string $message, $data = null): Response
    {
        $payload = ['success' => $success, 'message' => $message];
        if ($data !== null) {
            $payload['data'] = $data;
        }
        $response->getBody()->write(json_encode($payload));
        return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
    }

    /**
     * Vérifier si un token est valide
     */
    public function verifyToken(Request $request, Response $response)
    {
        $user_id = $this->getUserIdFromToken($request);
        if (!$user_id) {
            return $this->json($response, 401, false, 'Token invalide');
        }
        return $this->json($response, 200, true, 'Token valide', ['user_id' => $user_id]);
    }
}
