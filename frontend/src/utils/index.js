// Utilitaires généraux pour l'application

/**
 * Formate une date en français
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('fr-FR', defaultOptions);
};

/**
 * Formate une date relative (il y a X temps)
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  
  if (diffInSeconds < 60) {
    return 'À l\'instant';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `Il y a ${diffInMonths} mois`;
};

/**
 * Formate un salaire
 */
export const formatSalary = (salary, currency = '€') => {
  if (!salary) return 'Non spécifié';
  
  if (typeof salary === 'string') {
    return salary.includes(currency) ? salary : `${salary} ${currency}`;
  }
  
  return `${salary.toLocaleString('fr-FR')} ${currency}`;
};

/**
 * Génère des initiales à partir d'un nom
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

/**
 * Valide une adresse email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone français
 */
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
};

/**
 * Génère une couleur aléatoire pour les avatars
 */
export const generateAvatarColor = (name) => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Tronque un texte à une longueur donnée
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Calcule le score de matching entre un profil et une offre
 */
export const calculateMatchScore = (userProfile, jobOffer) => {
  let score = 0;
  const maxScore = 100;
  
  // Correspondance des compétences (40%)
  if (jobOffer.requiredSkills && userProfile.skills?.technical) {
    const jobSkills = jobOffer.requiredSkills.toLowerCase().split(',').map(s => s.trim());
    const userSkills = userProfile.skills.technical.toLowerCase().split(',').map(s => s.trim());
    
    const matchingSkills = jobSkills.filter(skill => 
      userSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
    );
    
    score += (matchingSkills.length / jobSkills.length) * 40;
  }
  
  // Correspondance du secteur (25%)
  if (jobOffer.sector && userProfile.preferences?.sectors) {
    const userSectors = userProfile.preferences.sectors.toLowerCase().split(',').map(s => s.trim());
    if (userSectors.some(sector => jobOffer.sector.toLowerCase().includes(sector))) {
      score += 25;
    }
  }
  
  // Correspondance de la localisation (20%)
  if (jobOffer.location && userProfile.preferences?.locations) {
    const userLocations = userProfile.preferences.locations.toLowerCase().split(',').map(s => s.trim());
    if (userLocations.some(location => 
      jobOffer.location.toLowerCase().includes(location) || location === 'télétravail'
    )) {
      score += 20;
    }
  }
  
  // Correspondance du type de contrat (10%)
  if (jobOffer.contractType && userProfile.preferences?.contractTypes) {
    if (userProfile.preferences.contractTypes.includes(jobOffer.contractType)) {
      score += 10;
    }
  }
  
  // Correspondance du niveau d'études (5%)
  if (jobOffer.requiredLevel && userProfile.education?.currentLevel) {
    const levelMapping = {
      'bac': 1,
      'bac+1': 2,
      'bac+2': 3,
      'bac+3': 4,
      'bac+4': 5,
      'bac+5': 6,
      'bac+8': 7
    };
    
    const userLevel = levelMapping[userProfile.education.currentLevel] || 0;
    const requiredLevel = levelMapping[jobOffer.requiredLevel] || 0;
    
    if (userLevel >= requiredLevel) {
      score += 5;
    }
  }
  
  return Math.round(Math.min(score, maxScore));
};

/**
 * Génère des raisons de matching
 */
export const generateMatchReasons = (userProfile, jobOffer, matchScore) => {
  const reasons = [];
  
  if (matchScore >= 80) {
    reasons.push('Excellente correspondance avec vos compétences');
  }
  
  if (jobOffer.sector && userProfile.preferences?.sectors) {
    const userSectors = userProfile.preferences.sectors.toLowerCase().split(',').map(s => s.trim());
    if (userSectors.some(sector => jobOffer.sector.toLowerCase().includes(sector))) {
      reasons.push(`Secteur ${jobOffer.sector} dans vos préférences`);
    }
  }
  
  if (jobOffer.location && userProfile.preferences?.locations) {
    const userLocations = userProfile.preferences.locations.toLowerCase().split(',').map(s => s.trim());
    if (userLocations.some(location => jobOffer.location.toLowerCase().includes(location))) {
      reasons.push(`Localisation ${jobOffer.location} correspond à vos critères`);
    }
  }
  
  if (jobOffer.contractType && userProfile.preferences?.contractTypes) {
    if (userProfile.preferences.contractTypes.includes(jobOffer.contractType)) {
      reasons.push(`Type de contrat ${jobOffer.contractType} souhaité`);
    }
  }
  
  if (reasons.length === 0) {
    reasons.push('Profil compatible avec les exigences du poste');
  }
  
  return reasons;
};

/**
 * Debounce une fonction
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle une fonction
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Génère un ID unique
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Copie du texte dans le presse-papiers
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback pour les navigateurs plus anciens
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

/**
 * Formate un nom de fichier
 */
export const formatFileName = (fileName) => {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Valide la taille d'un fichier
 */
export const validateFileSize = (file, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Valide le type d'un fichier
 */
export const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  return allowedTypes.includes(file.type);
};