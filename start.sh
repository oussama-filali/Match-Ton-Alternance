#!/bin/bash

echo "========================================"
echo "  Match Ton Alternance - Startup Script"
echo "========================================"
echo

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Vérification des prérequis
echo "[1/5] Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi

if ! command -v php &> /dev/null; then
    print_error "PHP n'est pas installé"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 n'est pas installé"
    exit 1
fi

if ! command -v composer &> /dev/null; then
    print_error "Composer n'est pas installé"
    exit 1
fi

print_success "Tous les prérequis sont installés"
echo

# Installation des dépendances si nécessaire
echo "[2/5] Vérification des dépendances..."

if [ ! -d "frontend/node_modules" ]; then
    print_info "Installation des dépendances Frontend..."
    cd frontend
    npm install
    cd ..
fi

if [ ! -d "backend/vendor" ]; then
    print_info "Installation des dépendances Backend..."
    cd backend
    composer install
    cd ..
fi

if [ ! -d "ai-engine/venv" ]; then
    print_info "Création de l'environnement virtuel Python..."
    cd ai-engine
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

print_success "Toutes les dépendances sont installées"
echo

# Vérification des fichiers de configuration
echo "[3/5] Vérification de la configuration..."

if [ ! -f "backend/.env" ]; then
    print_warning "Fichier backend/.env manquant"
    if [ -f "backend/.env.example" ]; then
        print_info "Copie de .env.example vers .env"
        cp backend/.env.example backend/.env
        print_warning "Veuillez configurer backend/.env avant de continuer"
    fi
fi

if [ ! -f "frontend/.env" ]; then
    print_warning "Fichier frontend/.env manquant"
    if [ -f "frontend/.env.example" ]; then
        print_info "Copie de .env.example vers .env"
        cp frontend/.env.example frontend/.env
        print_warning "Veuillez configurer frontend/.env avant de continuer"
    fi
fi

print_success "Configuration vérifiée"
echo

# Fonction pour tuer les processus en arrière-plan à la sortie
cleanup() {
    echo
    print_info "Arrêt des services..."
    kill $AI_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Démarrage des services
echo "[4/5] Démarrage des services..."
echo

print_info "Démarrage de l'AI Engine (Python)..."
cd ai-engine
source venv/bin/activate
python app.py &
AI_PID=$!
cd ..
sleep 3

print_info "Démarrage du Backend (PHP)..."
cd backend
php -S localhost:8000 -t public &
BACKEND_PID=$!
cd ..
sleep 3

print_info "Démarrage du Frontend (React)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
sleep 5

echo
print_success "[5/5] Tous les services sont démarrés !"
echo

echo "========================================"
echo "  Services en cours d'exécution:"
echo "========================================"
echo "  Frontend:   http://localhost:3000"
echo "  Backend:    http://localhost:8000"
echo "  AI Engine:  http://localhost:5000"
echo "========================================"
echo

# Vérification de la santé des services
echo "Vérification de la santé des services..."

# Test AI Engine
if curl -s http://localhost:5000/health > /dev/null; then
    print_success "AI Engine: OK"
else
    print_error "AI Engine: Erreur"
fi

# Test Backend
if curl -s http://localhost:8000/health > /dev/null; then
    print_success "Backend API: OK"
else
    print_warning "Backend API: En cours de démarrage..."
fi

# Test Frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Frontend: OK"
else
    print_warning "Frontend: En cours de démarrage..."
fi

echo
print_info "L'application est maintenant accessible à http://localhost:3000"
echo
print_warning "Appuyez sur Ctrl+C pour arrêter tous les services"

# Ouverture automatique du navigateur (si disponible)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
fi

# Attendre indéfiniment
wait