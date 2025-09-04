<?php

namespace App\Config;

use PDO;
use PDOException;

class Database {
    private $driver;
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        $this->driver = $_ENV['DB_DRIVER'] ?? 'mysql';
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->port = $_ENV['DB_PORT'] ?? ($this->driver === 'pgsql' ? '5432' : '3306');
        $this->db_name = $_ENV['DB_DATABASE'] ?? 'match_ton_alternance';
        $this->username = $_ENV['DB_USERNAME'] ?? 'root';
        $this->password = $_ENV['DB_PASSWORD'] ?? '';
    }

    public function connect() {
        $this->conn = null;
        try {
            // Support pour PostgreSQL (Supabase) et MySQL
            if ($this->driver === 'pgsql') {
                $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->db_name};sslmode=require";
            } else {
                $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
            }
            
            $this->conn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 30
            ]);

            // Configuration spécifique pour PostgreSQL
            if ($this->driver === 'pgsql') {
                $this->conn->exec("SET search_path TO public");
            }
            
        } catch(PDOException $e) {
            throw new PDOException("Erreur de connexion à la base de données ({$this->driver}) : " . $e->getMessage());
        }
        return $this->conn;
    }

    /**
     * Tester la connexion à la base de données
     */
    public function testConnection() {
        try {
            $conn = $this->connect();
            if ($this->driver === 'pgsql') {
                $stmt = $conn->query("SELECT version()");
                $version = $stmt->fetchColumn();
                return [
                    'success' => true,
                    'driver' => $this->driver,
                    'host' => $this->host,
                    'database' => $this->db_name,
                    'version' => $version
                ];
            } else {
                $stmt = $conn->query("SELECT VERSION()");
                $version = $stmt->fetchColumn();
                return [
                    'success' => true,
                    'driver' => $this->driver,
                    'host' => $this->host,
                    'database' => $this->db_name,
                    'version' => $version
                ];
            }
        } catch (PDOException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'driver' => $this->driver,
                'host' => $this->host,
                'database' => $this->db_name
            ];
        }
    }
}

