import axios from 'axios';
import { toast } from 'react-hot-toast';

// Configuration de base pour l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Instance Axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour les requêtes
apiClient.interceptors.request.use(
  (config) => {
    // Ajouter le token d'authentification si disponible
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log des requêtes en développement
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
apiClient.interceptors.response.use(
  (response) => {
    // Log des réponses en développement
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error);
    
    // Gestion des erreurs communes
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expiré ou invalide
          localStorage.removeItem('auth_token');
          toast.error('Session expirée, veuillez vous reconnecter');
          window.location.href = '/login';
          break;
          
        case 403:
          toast.error('Accès refusé');
          break;
          
        case 404:
          toast.error('Ressource non trouvée');
          break;
          
        case 422:
          // Erreurs de validation
          if (data.errors) {
            Object.values(data.errors).flat().forEach(error => {
              toast.error(error);
            });
          } else {
            toast.error(data.message || 'Données invalides');
          }
          break;
          
        case 500:
          toast.error('Erreur serveur, veuillez réessayer');
          break;
          
        default:
          toast.error(data.message || 'Une erreur est survenue');
      }
    } else if (error.request) {
      toast.error('Impossible de contacter le serveur');
    } else {
      toast.error('Erreur de configuration');
    }
    
    return Promise.reject(error);
  }
);

// Service API principal
class ApiService {
  // ==================== AUTH ====================
  
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      // Le backend renvoie { success, message, data: { user, token } } ou parfois { token, user }
      const payload = response.data?.data ?? response.data;
      const token = payload?.token;
      const user = payload?.user;
      
      if (token) {
        localStorage.setItem('auth_token', token);
      }
      
      return { success: true, data: { user, token } };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Erreur de connexion' };
    }
  }
  
  async register(userData) {
    try {
      // Mapper les champs attendus par le backend: name, email, password
      const payload = {
        name: (userData.firstName && userData.lastName)
          ? `${userData.firstName} ${userData.lastName}`.trim()
          : (userData.name || '').trim(),
        email: userData.email,
        password: userData.password,
        ...userData
      };
      const response = await apiClient.post('/auth/register', payload);
        // Normaliser la réponse pour { data: { user, token } } ou { user, token }
        const payloadResp = response.data?.data ?? response.data;
        const token = payloadResp?.token;
        const user = payloadResp?.user;
        if (token) {
          localStorage.setItem('auth_token', token);
        }
        return { success: true, data: { user, token } };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Erreur d\'inscription' };
    }
  }
  
  async logout() {
    try {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('auth_token');
      return { success: true };
    } catch (error) {
      localStorage.removeItem('auth_token');
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  // ==================== PROFILE ====================
  
  async getProfile() {
    try {
      const response = await apiClient.get('/profile');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/profile', profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async analyzeProfile() {
    try {
      const response = await apiClient.post('/profile/analyze');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  // ==================== JOB OFFERS ====================
  
  async getJobOffers(filters = {}) {
    try {
      const response = await apiClient.get('/jobs', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async getJobOffer(id) {
    try {
      const response = await apiClient.get(`/jobs/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async applyToJob(jobId) {
    try {
      const response = await apiClient.post(`/jobs/${jobId}/apply`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async syncJobOffers() {
    try {
      const response = await apiClient.post('/jobs/sync');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async searchJobs(query, filters = {}) {
    try {
      const response = await apiClient.post('/jobs/search', { query, filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  // ==================== MATCHING ====================
  
  async getMatches() {
    try {
      const response = await apiClient.get('/matches');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async generateMatches() {
    try {
      const response = await apiClient.post('/matches/generate');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async getMatchDetails(matchId) {
    try {
      const response = await apiClient.get(`/matches/${matchId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async rateMatch(matchId, rating) {
    try {
      const response = await apiClient.post(`/matches/${matchId}/rate`, { rating });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  // ==================== STATISTICS ====================
  
  async getStats() {
    try {
      const response = await apiClient.get('/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async getDashboardData() {
    try {
      const response = await apiClient.get('/dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  // ==================== RECOMMENDATIONS ====================
  
  async getRecommendations() {
    try {
      const response = await apiClient.get('/recommendations');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async getSkillSuggestions(query) {
    try {
      const response = await apiClient.get('/skills/suggestions', { params: { q: query } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  // ==================== UTILITIES ====================
  
  async uploadFile(file, type = 'profile') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }
  
  // ==================== HELPERS ====================
  
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }
  
  getToken() {
    return localStorage.getItem('auth_token');
  }
  
  clearAuth() {
    localStorage.removeItem('auth_token');
  }
}

// Instance singleton du service
const apiService = new ApiService();

export default apiService;