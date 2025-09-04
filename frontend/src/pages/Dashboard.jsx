import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  SparklesIcon,
  BriefcaseIcon,
  HeartIcon,
  ChartBarIcon,
  UserIcon,
  TrophyIcon,
  ClockIcon,
  ArrowRightIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import apiService from '../services/apiService';

const Dashboard = () => {
  const { user, stats, setStats } = useApp();
  const [loading, setLoading] = useState(true);
  const [recentMatches, setRecentMatches] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les données du dashboard
      const [matchesResult, recommendationsResult, activitiesResult, statsResult] = await Promise.all([
        apiService.getRecentMatches(),
        apiService.getRecommendations(),
        apiService.getRecentActivities(),
        apiService.getUserStats()
      ]);

      if (matchesResult.success) setRecentMatches(matchesResult.data);
      if (recommendationsResult.success) setRecommendations(recommendationsResult.data);
      if (activitiesResult.success) setActivities(activitiesResult.data);
      if (statsResult.success) setStats(statsResult.data);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Chargement de votre dashboard..." />
      </div>
    );
  }

  return (
    <div
      
      
      
      className="space-y-8"
    >
      {/* Header de bienvenue */}
      <div  className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bonjour {user?.firstName} ! 👋
            </h1>
            <p className="text-primary-100 text-lg">
              Voici un aperçu de votre progression aujourd'hui
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-12 h-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Profil complété</p>
              <p className="text-3xl font-bold text-blue-900">{stats.profileScore}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.profileScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Matches trouvés</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalMatches}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <HeartIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-green-600 text-sm mt-2">
            +{stats.newMatchesThisWeek} cette semaine
          </p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Candidatures</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalApplications}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-purple-600 text-sm mt-2">
            {stats.pendingApplications} en attente
          </p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Taux de réussite</p>
              <p className="text-3xl font-bold text-orange-900">{stats.successRate}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-orange-600 text-sm mt-2">
            Excellent score !
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Matches récents */}
        <div  className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Matches récents</h2>
              <Link to="/matches" className="btn-ghost text-sm">
                Voir tout
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentMatches.length > 0 ? (
                recentMatches.slice(0, 3).map((match, index) => (
                  <div
                    key={match.id}
                    
                    
                    
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {match.company?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{match.title}</h3>
                        <p className="text-sm text-gray-600">{match.company}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {match.matchScore}% compatible
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="btn-ghost p-2">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="btn-primary text-sm px-3 py-1">
                        Postuler
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <HeartIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun match pour le moment</p>
                  <Link to="/jobs" className="btn-primary mt-4 inline-flex items-center">
                    <BriefcaseIcon className="w-4 h-4 mr-2" />
                    Parcourir les offres
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar avec recommandations et activités */}
        <div  className="space-y-6">
          
          {/* Recommandations */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recommandations IA
            </h3>
            
            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-primary-50 rounded-lg">
                    <SparklesIcon className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Complétez votre profil pour recevoir des recommandations personnalisées.</p>
              )}
            </div>
          </div>

          {/* Activités récentes */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activité récente
            </h3>
            
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.slice(0, 4).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucune activité récente</p>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions rapides
            </h3>
            
            <div className="space-y-2">
              <Link to="/profile" className="w-full btn-ghost justify-start">
                <UserIcon className="w-4 h-4 mr-2" />
                Compléter mon profil
              </Link>
              <Link to="/jobs" className="w-full btn-ghost justify-start">
                <BriefcaseIcon className="w-4 h-4 mr-2" />
                Parcourir les offres
              </Link>
              <Link to="/matches" className="w-full btn-ghost justify-start">
                <HeartIcon className="w-4 h-4 mr-2" />
                Voir mes matches
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action si profil incomplet */}
      {stats.profileScore < 80 && (
        <div  className="card bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🚀 Boostez vos chances !
              </h3>
              <p className="text-gray-600 mb-4">
                Complétez votre profil pour obtenir plus de matches personnalisés et augmenter vos chances de trouver l'alternance parfaite.
              </p>
              <Link to="/profile" className="btn-primary inline-flex items-center">
                <PlusIcon className="w-4 h-4 mr-2" />
                Compléter mon profil
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-yellow-200 rounded-full flex items-center justify-center">
                <TrophyIcon className="w-10 h-10 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;