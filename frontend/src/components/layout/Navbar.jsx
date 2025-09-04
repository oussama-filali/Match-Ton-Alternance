import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    sidebarOpen, 
    toggleSidebar, 
    logout,
    stats 
  } = useApp();
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState([
    { id: 1, message: 'Nouveau match trouvé !', time: '2 min', unread: true },
    { id: 2, message: 'Profil mis à jour', time: '1h', unread: false },
  ]);

  const handleLogout = async () => {
    await apiService.logout();
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const unreadNotifications = notifications.filter(n => n.unread).length;

  return (
    <nav
      
      
      
      className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm"
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo et menu burger */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              {sidebarOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
            
            <Link to="/dashboard" className="flex items-center gap-3">
              <div
                
                
                className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
              >
                M
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold gradient-text">
                  Match Ton Alternance
                </h1>
                <p className="text-xs text-gray-500 -mt-1">
                  Trouve ton alternance parfaite
                </p>
              </div>
            </Link>
          </div>

          {/* Barre de recherche */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder="Rechercher des offres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </form>
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center gap-3">
            
            {/* Statistiques rapides */}
            <div className="hidden lg:flex items-center gap-4 mr-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary-600">
                  {stats.totalMatches}
                </div>
                <div className="text-xs text-gray-500">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-secondary-600">
                  {stats.profileScore}%
                </div>
                <div className="text-xs text-gray-500">Profil</div>
              </div>
            </div>

            {/* Notifications */}
            <button
              
              
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <BellIcon className="w-6 h-6 text-gray-600" />
              {unreadNotifications > 0 && (
                <span
                  
                  
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                >
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Menu profil */}
            <div className="relative">
              <button
                
                
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName || 'Utilisateur'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email}
                  </div>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${
                  profileMenuOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Menu déroulant profil */}
              
                {profileMenuOpen && (
                  <div
                    
                    
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user?.email}
                      </div>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      Mon Profil
                    </Link>
                    
                    <Link
                      to="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                      Paramètres
                    </Link>
                    
                    <hr className="my-2" />
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      Déconnexion
                    </button>
                  </div>
                )}
              
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche mobile */}
      <div className="md:hidden border-t border-gray-200 p-4">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Rechercher des offres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </form>
      </div>
    </nav>
  );
};

export default Navbar;