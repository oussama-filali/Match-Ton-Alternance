import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// État initial de l'application
const initialState = {
  // Utilisateur
  user: null,
  isAuthenticated: false,
  
  // Profil utilisateur
  profile: null,
  profileCompleted: false,
  
  // Offres d'emploi
  jobOffers: [],
  filteredOffers: [],
  loading: false,
  
  // Matching
  matches: [],
  matchingInProgress: false,
  
  // UI State
  sidebarOpen: false,
  theme: 'light',
  
  // Erreurs
  error: null,
  
  // Statistiques
  stats: {
    totalOffers: 0,
    totalMatches: 0,
    profileScore: 0
  }
};

// Types d'actions
const ActionTypes = {
  // Auth
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  
  // Profile
  SET_PROFILE: 'SET_PROFILE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_PROFILE_COMPLETED: 'SET_PROFILE_COMPLETED',
  
  // Job Offers
  SET_JOB_OFFERS: 'SET_JOB_OFFERS',
  SET_FILTERED_OFFERS: 'SET_FILTERED_OFFERS',
  ADD_JOB_OFFER: 'ADD_JOB_OFFER',
  
  // Loading
  SET_LOADING: 'SET_LOADING',
  
  // Matching
  SET_MATCHES: 'SET_MATCHES',
  ADD_MATCH: 'ADD_MATCH',
  SET_MATCHING_IN_PROGRESS: 'SET_MATCHING_IN_PROGRESS',
  
  // UI
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_THEME: 'SET_THEME',
  
  // Error
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Stats
  SET_STATS: 'SET_STATS'
};

// Reducer pour gérer les actions
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload
      };
      
    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        profile: null,
        profileCompleted: false,
        matches: []
      };
      
    case ActionTypes.SET_PROFILE:
      return {
        ...state,
        profile: action.payload,
        profileCompleted: action.payload ? isProfileComplete(action.payload) : false
      };
      
    case ActionTypes.UPDATE_PROFILE:
      const updatedProfile = { ...state.profile, ...action.payload };
      return {
        ...state,
        profile: updatedProfile,
        profileCompleted: isProfileComplete(updatedProfile)
      };
      
    case ActionTypes.SET_PROFILE_COMPLETED:
      return {
        ...state,
        profileCompleted: action.payload
      };
      
    case ActionTypes.SET_JOB_OFFERS:
      return {
        ...state,
        jobOffers: action.payload,
        filteredOffers: action.payload
      };
      
    case ActionTypes.SET_FILTERED_OFFERS:
      return {
        ...state,
        filteredOffers: action.payload
      };
      
    case ActionTypes.ADD_JOB_OFFER:
      return {
        ...state,
        jobOffers: [...state.jobOffers, action.payload]
      };
      
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case ActionTypes.SET_MATCHES:
      return {
        ...state,
        matches: action.payload
      };
      
    case ActionTypes.ADD_MATCH:
      return {
        ...state,
        matches: [...state.matches, action.payload]
      };
      
    case ActionTypes.SET_MATCHING_IN_PROGRESS:
      return {
        ...state,
        matchingInProgress: action.payload
      };
      
    case ActionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
      
    case ActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
      
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case ActionTypes.SET_STATS:
      return {
        ...state,
        stats: { ...state.stats, ...action.payload }
      };
      
    default:
      return state;
  }
};

// Fonction pour vérifier si le profil est complet
const isProfileComplete = (profile) => {
  if (!profile) return false;
  
  const requiredFields = [
    'firstName',
    'lastName',
    'email',
    'skills',
    'experience',
    'education',
    'location'
  ];
  
  return requiredFields.every(field => {
    const value = profile[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value && value.toString().trim() !== '';
  });
};

// Création du contexte
const AppContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Provider du contexte
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    // Auth actions
    setUser: (user) => {
      dispatch({ type: ActionTypes.SET_USER, payload: user });
      if (user) {
        toast.success(`Bienvenue ${user.firstName || user.email} !`);
      }
    },
    
    logout: () => {
      dispatch({ type: ActionTypes.LOGOUT });
      toast.success('Déconnexion réussie');
    },
    
    // Profile actions
    setProfile: (profile) => {
      dispatch({ type: ActionTypes.SET_PROFILE, payload: profile });
    },
    
    updateProfile: (updates) => {
      dispatch({ type: ActionTypes.UPDATE_PROFILE, payload: updates });
      toast.success('Profil mis à jour');
    },
    
    // Job offers actions
    setJobOffers: (offers) => {
      dispatch({ type: ActionTypes.SET_JOB_OFFERS, payload: offers });
      dispatch({ 
        type: ActionTypes.SET_STATS, 
        payload: { totalOffers: offers.length } 
      });
    },
    
    setFilteredOffers: (offers) => {
      dispatch({ type: ActionTypes.SET_FILTERED_OFFERS, payload: offers });
    },
    
    addJobOffer: (offer) => {
      dispatch({ type: ActionTypes.ADD_JOB_OFFER, payload: offer });
    },
    
    // Loading actions
    setLoading: (loading) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
    },
    
    // Matching actions
    setMatches: (matches) => {
      dispatch({ type: ActionTypes.SET_MATCHES, payload: matches });
      dispatch({ 
        type: ActionTypes.SET_STATS, 
        payload: { totalMatches: matches.length } 
      });
    },
    
    addMatch: (match) => {
      dispatch({ type: ActionTypes.ADD_MATCH, payload: match });
      toast.success('Nouveau match trouvé !');
    },
    
    setMatchingInProgress: (inProgress) => {
      dispatch({ type: ActionTypes.SET_MATCHING_IN_PROGRESS, payload: inProgress });
    },
    
    // UI actions
    toggleSidebar: () => {
      dispatch({ type: ActionTypes.TOGGLE_SIDEBAR });
    },
    
    setTheme: (theme) => {
      dispatch({ type: ActionTypes.SET_THEME, payload: theme });
      localStorage.setItem('theme', theme);
    },
    
    // Error actions
    setError: (error) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error });
      if (error) {
        toast.error(error);
      }
    },
    
    clearError: () => {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
    },
    
    // Stats actions
    setStats: (stats) => {
      dispatch({ type: ActionTypes.SET_STATS, payload: stats });
    }
  };

  // Effets pour la persistance
  useEffect(() => {
    // Charger le thème depuis localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      actions.setTheme(savedTheme);
    }
  }, []);

  // Calculer le score du profil
  useEffect(() => {
    if (state.profile) {
      const score = calculateProfileScore(state.profile);
      actions.setStats({ profileScore: score });
    }
  }, [state.profile]);

  const value = {
    ...state,
    ...actions
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Fonction pour calculer le score du profil
const calculateProfileScore = (profile) => {
  if (!profile) return 0;
  
  let score = 0;
  const maxScore = 100;
  
  // Informations de base (30 points)
  if (profile.firstName) score += 5;
  if (profile.lastName) score += 5;
  if (profile.email) score += 5;
  if (profile.phone) score += 5;
  if (profile.location) score += 10;
  
  // Compétences (25 points)
  if (profile.skills && profile.skills.length > 0) {
    score += Math.min(25, profile.skills.length * 3);
  }
  
  // Expérience (20 points)
  if (profile.experience) {
    score += Math.min(20, profile.experience.length * 5);
  }
  
  // Éducation (15 points)
  if (profile.education) {
    score += Math.min(15, profile.education.length * 5);
  }
  
  // Soft skills (10 points)
  if (profile.softSkills && profile.softSkills.length > 0) {
    score += Math.min(10, profile.softSkills.length * 2);
  }
  
  return Math.min(maxScore, score);
};

export default AppContext;