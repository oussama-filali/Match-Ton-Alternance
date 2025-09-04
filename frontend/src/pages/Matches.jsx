import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  HeartIcon,
  XMarkIcon,
  SparklesIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyEuroIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import apiService from '../services/apiService';
import { toast } from 'react-hot-toast';

const Matches = () => {
  const { user } = useApp();
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMatched, setShowMatched] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  // Motion values pour le swipe
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const result = await apiService.getMatches();
      
      if (result.success) {
        setMatches(result.data);
      } else {
        toast.error('Erreur lors du chargement des matches');
      }
    } catch (error) {
      console.error('Erreur chargement matches:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction, jobId) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    try {
      const result = await apiService.swipeJob(jobId, direction);
      
      if (result.success) {
        if (direction === 'right') {
          setLastAction('like');
          if (result.data.isMatch) {
            setShowMatched(true);
            setTimeout(() => setShowMatched(false), 2000);
          }
          toast.success('Ajouté à vos favoris !');
        } else {
          setLastAction('pass');
        }
        
        // Passer au match suivant
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setIsAnimating(false);
          x.set(0);
        }, 300);
      }
    } catch (error) {
      console.error('Erreur swipe:', error);
      toast.error('Une erreur est survenue');
      setIsAnimating(false);
    }
  };

  const handleDragEnd = (event, info) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      handleSwipe('right', matches[currentIndex]?.id);
    } else if (info.offset.x < -threshold) {
      handleSwipe('left', matches[currentIndex]?.id);
    } else {
      x.set(0);
    }
  };

  const resetStack = () => {
    setCurrentIndex(0);
    loadMatches();
  };

  const currentMatch = matches[currentIndex];
  const hasMoreMatches = currentIndex < matches.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Chargement de vos matches..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Vos Matches IA
        </h1>
        <p className="text-gray-600">
          Swipez à droite pour les offres qui vous intéressent, à gauche pour passer
        </p>
      </motion.div>

      {/* Interface de swipe */}
      <div className="relative h-[600px] flex items-center justify-center">
        
        {hasMoreMatches ? (
          <div className="relative w-full max-w-md">
            
            {/* Stack de cartes */}
            <AnimatePresence>
              {matches.slice(currentIndex, currentIndex + 3).map((match, index) => (
                <motion.div
                  key={match.id}
                  className="absolute inset-0"
                  initial={{ scale: 0.95, y: index * 4, opacity: 0.8 }}
                  animate={{ 
                    scale: index === 0 ? 1 : 0.95,
                    y: index * 4,
                    opacity: index === 0 ? 1 : 0.8,
                    zIndex: 3 - index
                  }}
                  style={index === 0 ? { x, rotate, opacity } : {}}
                  drag={index === 0 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={index === 0 ? handleDragEnd : undefined}
                  whileDrag={{ cursor: 'grabbing' }}
                >
                  <div className="card h-full overflow-hidden shadow-xl border-2 border-gray-100">
                    
                    {/* Header avec logo et infos entreprise */}
                    <div className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center">
                          {match.companyLogo ? (
                            <img src={match.companyLogo} alt={match.company} className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-gray-900">{match.title}</h2>
                          <p className="text-gray-600 font-medium">{match.company}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <SparklesIcon className="w-4 h-4 text-primary-500" />
                            <span className="text-lg font-bold text-primary-600">
                              {match.matchScore}%
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">Compatible</span>
                        </div>
                      </div>
                    </div>

                    {/* Contenu principal */}
                    <div className="p-6 flex-1">
                      
                      {/* Informations clés */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPinIcon className="w-4 h-4" />
                          {match.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <BriefcaseIcon className="w-4 h-4" />
                          {match.contractType}
                        </div>
                        {match.salary && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CurrencyEuroIcon className="w-4 h-4" />
                            {match.salary}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ClockIcon className="w-4 h-4" />
                          {match.publishedAt}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                          {match.description}
                        </p>
                      </div>

                      {/* Compétences requises */}
                      {match.requiredSkills && (
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-2">Compétences recherchées</h3>
                          <div className="flex flex-wrap gap-2">
                            {match.requiredSkills.split(',').slice(0, 6).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                              >
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pourquoi ce match */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <SparklesIcon className="w-4 h-4" />
                          Pourquoi ce match ?
                        </h3>
                        <ul className="text-sm text-green-800 space-y-1">
                          {match.matchReasons?.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                              {reason}
                            </li>
                          )) || [
                            <li key="default" className="flex items-start gap-2">
                              <span className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                              Correspondance élevée avec votre profil
                            </li>
                          ]}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Indicateurs de swipe */}
            <div className="absolute top-20 left-8 z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: x.get() < -50 ? 1 : 0,
                  scale: x.get() < -50 ? 1 : 0.8
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg"
              >
                PASSER
              </motion.div>
            </div>

            <div className="absolute top-20 right-8 z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: x.get() > 50 ? 1 : 0,
                  scale: x.get() > 50 ? 1 : 0.8
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg"
              >
                J'AIME
              </motion.div>
            </div>
          </div>
        ) : (
          /* Fin des matches */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto">
              <SparklesIcon className="w-12 h-12 text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Plus de matches pour le moment !
              </h2>
              <p className="text-gray-600 mb-6">
                Nous cherchons de nouvelles opportunités qui correspondent à votre profil.
                Revenez bientôt ou affinez votre profil pour plus de matches.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetStack}
                className="btn-primary flex items-center gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Recharger les matches
              </button>
              
              <button className="btn-ghost flex items-center gap-2">
                <EyeIcon className="w-5 h-5" />
                Voir mes favoris
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Boutons d'action */}
      {hasMoreMatches && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center items-center gap-8"
        >
          <button
            onClick={() => handleSwipe('left', currentMatch?.id)}
            disabled={isAnimating}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">
              {currentIndex + 1} / {matches.length}
            </div>
            <div className="w-32 h-1 bg-gray-200 rounded-full">
              <div 
                className="h-1 bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / matches.length) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => handleSwipe('right', currentMatch?.id)}
            disabled={isAnimating}
            className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            <HeartIcon className="w-8 h-8" />
          </button>
        </motion.div>
      )}

      {/* Animation de match */}
      <AnimatePresence>
        {showMatched && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              className="bg-white rounded-2xl p-8 text-center max-w-md mx-4"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <HeartIconSolid className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                C'est un match ! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                Cette entreprise correspond parfaitement à votre profil !
              </p>
              
              <button className="btn-primary flex items-center gap-2 mx-auto">
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Envoyer un message
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card bg-gray-50 text-center"
      >
        <h3 className="font-semibold text-gray-900 mb-2">Comment ça marche ?</h3>
        <div className="flex justify-center items-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <XMarkIcon className="w-4 h-4 text-red-600" />
            </div>
            Swipez à gauche pour passer
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <HeartIcon className="w-4 h-4 text-green-600" />
            </div>
            Swipez à droite pour aimer
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Matches;