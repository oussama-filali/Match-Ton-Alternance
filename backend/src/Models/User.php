<?php

namespace App\Models;

use PDO;
use Exception;

class User
{
    private $conn;
    private $table = 'users';

    // Propriétés utilisateur
    public $id;
    public $email;
    public $password;
    public $name;
    public $role;
    public $email_verified;
    public $created_at;
    public $updated_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Créer un nouvel utilisateur
     */
    public function create()
    {
        $query = "INSERT INTO " . $this->table . " (
            email, password, name, role, created_at, updated_at
        ) VALUES (
            :email, :password, :name, :role, NOW(), NOW()
        )";

        $stmt = $this->conn->prepare($query);

        // Nettoyer les données
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->role = $this->role ?? 'user';

        // Hasher le mot de passe
        $hashed_password = password_hash($this->password, PASSWORD_DEFAULT);

        // Lier les paramètres
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':password', $hashed_password);
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':role', $this->role);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Trouver un utilisateur par email
     */
    public function findByEmail($email)
    {
        $query = "SELECT id, email, password, name, role, email_verified, created_at 
                  FROM " . $this->table . " 
                  WHERE email = :email 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->id = $row['id'];
            $this->email = $row['email'];
            $this->password = $row['password'];
            $this->name = $row['name'];
            $this->role = $row['role'];
            $this->email_verified = $row['email_verified'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    /**
     * Trouver un utilisateur par ID
     */
    public function findById($id)
    {
        $query = "SELECT id, email, name, role, email_verified, created_at 
                  FROM " . $this->table . " 
                  WHERE id = :id 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->id = $row['id'];
            $this->email = $row['email'];
            $this->name = $row['name'];
            $this->role = $row['role'];
            $this->email_verified = $row['email_verified'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    /**
     * Vérifier si l'email existe déjà
     */
    public function emailExists($email)
    {
        $query = "SELECT id FROM " . $this->table . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    /**
     * Vérifier le mot de passe
     */
    public function verifyPassword($password)
    {
        return password_verify($password, $this->password);
    }

    /**
     * Mettre à jour le profil utilisateur
     */
    public function update()
    {
        $query = "UPDATE " . $this->table . " 
                  SET name = :name, 
                      updated_at = NOW() 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));

        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Marquer l'email comme vérifié
     */
    public function verifyEmail()
    {
        $query = "UPDATE " . $this->table . " 
                  SET email_verified = 1, 
                      updated_at = NOW() 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Obtenir les données publiques de l'utilisateur
     */
    public function getPublicData()
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->name,
            'role' => $this->role,
            'email_verified' => $this->email_verified,
            'created_at' => $this->created_at
        ];
    }
}
