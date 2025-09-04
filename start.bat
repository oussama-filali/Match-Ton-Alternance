@echo off
echo ========================================
echo   Match Ton Alternance - Startup Script
echo ========================================
echo.

REM Vérification des prérequis
echo [1/5] Vérification des prérequis...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Node.js n'est pas installé
    pause
    exit /b 1
)

where php >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: PHP n'est pas installé
    pause
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Python n'est pas installé
    pause
    exit /b 1
)

echo ✓ Tous les prérequis sont installés
echo.

REM Installation des dépendances si nécessaire
echo [2/5] Vérification des dépendances...

if not exist "frontend\node_modules" (
    echo Installation des dépendances Frontend...
    cd frontend
    call npm install
    cd ..
)

if not exist "backend\vendor" (
    echo Installation des dépendances Backend...
    cd backend
    call composer install
    cd ..
)

if not exist "ai-engine\venv" (
    echo Création de l'environnement virtuel Python...
    cd ai-engine
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
)

echo ✓ Toutes les dépendances sont installées
echo.

REM Vérification des fichiers de configuration
echo [3/5] Vérification de la configuration...

if not exist "backend\.env" (
    echo ATTENTION: Fichier backend\.env manquant
    echo Copiez backend\.env.example vers backend\.env et configurez-le
    pause
)

if not exist "frontend\.env" (
    echo ATTENTION: Fichier frontend\.env manquant
    echo Copiez frontend\.env.example vers frontend\.env et configurez-le
    pause
)

echo ✓ Configuration vérifiée
echo.

REM Démarrage des services
echo [4/5] Démarrage des services...
echo.

echo Démarrage de l'AI Engine (Python)...
start "AI Engine" cmd /k "cd ai-engine && venv\Scripts\activate && python app.py"
timeout /t 3 /nobreak >nul

echo Démarrage du Backend (PHP)...
start "Backend API" cmd /k "cd backend && php -S localhost:8000 -t public"
timeout /t 3 /nobreak >nul

echo Démarrage du Frontend (React)...
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo [5/5] Tous les services sont démarrés !
echo.
echo ========================================
echo   Services en cours d'exécution:
echo ========================================
echo   Frontend:   http://localhost:3000
echo   Backend:    http://localhost:8000
echo   AI Engine:  http://localhost:5000
echo ========================================
echo.
echo Appuyez sur une touche pour ouvrir l'application...
pause >nul

REM Ouverture de l'application dans le navigateur
start http://localhost:3000

echo.
echo L'application est maintenant accessible !
echo Fermez cette fenêtre pour arrêter tous les services.
echo.
pause