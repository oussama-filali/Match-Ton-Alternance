import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts
import { AppProvider, useApp } from './contexts/AppContext';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Pages (lazy loading pour optimiser les performances)
const Home = React.lazy(() => import('./pages/Home'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Jobs = React.lazy(() => import('./pages/Jobs'));
const Matches = React.lazy(() => import('./pages/Matches'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));

// Services
import apiService from './services/apiService';

// Styles
import './styles/globals.css';

// Composant de protection des routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Composant de route publique (redirige si connecté)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Layout principal de l'application
const AppLayout = ({ children }) => {
  const { sidebarOpen, isAuthenticated } = useApp();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {isAuthenticated && <Navbar />}
      
      <div className="flex">
        <AnimatePresence>
          {isAuthenticated && sidebarOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>
        
        <main className={`flex-1 transition-all duration-300 ${
          isAuthenticated && sidebarOpen ? 'ml-64' : ''
        }`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="py-8 container-custom"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

// Composant principal de l'application
const AppContent = () => {
  const { setUser, setLoading, setError } = useApp();
  
  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        setLoading(true);
        try {
          const result = await apiService.getCurrentUser();
          if (result.success) {
            setUser(result.data);
          } else {
            apiService.clearAuth();
          }
        } catch (error) {
          console.error('Erreur vérification auth:', error);
          apiService.clearAuth();
        } finally {
          setLoading(false);
        }
      }
    };
    
    checkAuth();
  }, [setUser, setLoading]);
  
  return (
    <Router>
      <AppLayout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Routes publiques */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              
              {/* Routes protégées */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="/jobs" element={
                <ProtectedRoute>
                  <Jobs />
                </ProtectedRoute>
              } />
              
              <Route path="/matches" element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              } />
              
              {/* Route d'accueil */}
              <Route path="/" element={<Home />} />
              
              {/* Route par défaut */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </AppLayout>
    </Router>
  );
};

// Composant App principal avec providers
const App = () => {
  return (
    <AppProvider>
      <AppContent />
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AppProvider>
  );
};

export default App;