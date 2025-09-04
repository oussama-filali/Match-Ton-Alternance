import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  UserIcon,
  BriefcaseIcon,
  HeartIcon,
  ChartBarIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  HeartIcon as HeartIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid';
import { useApp } from '../../contexts/AppContext';

const Sidebar = () => {
  const location = useLocation();
  const { stats, profileCompleted } = useApp();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      badge: null,
      description: 'Vue d\'ensemble'
    },
    {
      name: 'Mon Profil',
      href: '/profile',
      icon: UserIcon,
      iconSolid: UserIconSolid,
      badge: !profileCompleted ? 'À compléter' : null,
      badgeColor: 'bg-orange-100 text-orange-600',
      description: 'Gérer mon profil'
    },
    {
      name: 'Offres d\'emploi',
      href: '/jobs',
      icon: BriefcaseIcon,
      iconSolid: BriefcaseIconSolid,
      badge: stats.totalOffers > 0 ? stats.totalOffers : null,
      badgeColor: 'bg-blue-100 text-blue-600',
      description: 'Parcourir les offres'
    },
    {
      name: 'Mes Matches',
      href: '/matches',
      icon: HeartIcon,
      iconSolid: HeartIconSolid,
      badge: stats.totalMatches > 0 ? stats.totalMatches : null,
      badgeColor: 'bg-pink-100 text-pink-600',
      description: 'Offres compatibles'
    },
    {
      name: 'Statistiques',
      href: '/stats',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      badge: null,
      description: 'Mes performances'
    }
  ];

  const secondaryItems = [
    {
      name: 'Paramètres',
      href: '/settings',
      icon: CogIcon,
      description: 'Configuration'
    },
    {
      name: 'Aide',
      href: '/help',
      icon: QuestionMarkCircleIcon,
      description: 'Support & FAQ'
    }
  ];

  const isActive = (href) => location.pathname === href;

  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <motion.aside
      
      
      
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 shadow-lg z-30 overflow-y-auto custom-scrollbar"
    >
      <div className="p-6">
        
        {/* Score du profil */}
        <div
          
          className="mb-8 p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl border border-primary-100"
        >
          <div className="flex items-center gap-3 mb-3">
            <SparklesIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Score Profil</h3>
              <p className="text-sm text-gray-600">{stats.profileScore}% complété</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              
              animate={{ width: `${stats.profileScore}%` }}
              
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
            />
          </div>
          
          {!profileCompleted && (
            <Link
              to="/profile"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Compléter mon profil →
            </Link>
          )}
        </div>

        {/* Navigation principale */}
        <nav className="space-y-2">
          <div >
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Navigation
            </h2>
          </div>
          
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            const Icon = active ? item.iconSolid : item.icon;
            
            return (
              <div key={item.name} >
                <Link
                  to={item.href}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${
                      active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </div>
                  
                  {item.badge && (
                    <span
                      
                      
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.badgeColor || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Navigation secondaire */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div >
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Autres
            </h2>
          </div>
          
          <nav className="space-y-1">
            {secondaryItems.map((item) => {
              const active = isActive(item.href);
              
              return (
                <div key={item.name} >
                  <Link
                    to={item.href}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      active
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${
                      active ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Call to action */}
        <div
          
          className="mt-8 p-4 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-xl text-white"
        >
          <h3 className="font-semibold mb-2">🚀 Boostez vos chances !</h3>
          <p className="text-sm text-white/90 mb-3">
            Complétez votre profil pour obtenir plus de matches.
          </p>
          <Link
            to="/profile"
            className="inline-block px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            Améliorer mon profil
          </Link>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;