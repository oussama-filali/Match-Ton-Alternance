import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  BriefcaseIcon,
  ClockIcon,
  CurrencyEuroIcon,
  HeartIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  SparklesIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner, { CardSkeleton } from '../components/ui/LoadingSpinner';
import apiService from '../services/apiService';
import { toast } from 'react-hot-toast';

const Jobs = () => {
  const { user } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    location: '',
    contractType: '',
    sector: '',
    salaryMin: '',
    salaryMax: '',
    experience: '',
    remote: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    loadJobs();
  }, [searchQuery, filters, currentPage, sortBy]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      const params = {
        search: searchQuery,
        page: currentPage,
        sortBy,
        ...filters
      };

      const result = await apiService.searchJobs(params);
      
      if (result.success) {
        setJobs(result.data.jobs);
        setTotalPages(result.data.totalPages);
        setFavorites(new Set(result.data.favorites || []));
      } else {
        toast.error('Erreur lors du chargement des offres');
      }
    } catch (error) {
      console.error('Erreur chargement jobs:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchParams({ search: searchQuery });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      contractType: '',
      sector: '',
      salaryMin: '',
      salaryMax: '',
      experience: '',
      remote: false
    });
    setCurrentPage(1);
  };

  const toggleFavorite = async (jobId) => {
    try {
      const result = await apiService.toggleJobFavorite(jobId);
      
      if (result.success) {
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (newFavorites.has(jobId)) {
            newFavorites.delete(jobId);
            toast.success('Retiré des favoris');
          } else {
            newFavorites.add(jobId);
            toast.success('Ajouté aux favoris');
          }
          return newFavorites;
        });
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des favoris');
    }
  };

  const applyToJob = async (jobId) => {
    try {
      const result = await apiService.applyToJob(jobId);
      
      if (result.success) {
        toast.success('Candidature envoyée avec succès !');
        // Mettre à jour le job pour indiquer qu'on a postulé
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, hasApplied: true } : job
        ));
      } else {
        toast.error(result.error || 'Erreur lors de la candidature');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  const getMatchScore = (job) => {
    // Calcul du score de matching basé sur le profil utilisateur
    if (!user?.skills || !user?.preferences) return 0;
    
    let score = 0;
    const maxScore = 100;
    
    // Correspondance des compétences (40%)
    if (job.requiredSkills && user.skills.technical) {
      const jobSkills = job.requiredSkills.toLowerCase().split(',');
      const userSkills = user.skills.technical.toLowerCase().split(',');
      const matchingSkills = jobSkills.filter(skill => 
        userSkills.some(userSkill => userSkill.trim().includes(skill.trim()))
      );
      score += (matchingSkills.length / jobSkills.length) * 40;
    }
    
    // Correspondance du secteur (30%)
    if (job.sector && user.preferences.sectors) {
      const userSectors = user.preferences.sectors.toLowerCase().split(',');
      if (userSectors.some(sector => job.sector.toLowerCase().includes(sector.trim()))) {
        score += 30;
      }
    }
    
    // Correspondance de la localisation (20%)
    if (job.location && user.preferences.locations) {
      const userLocations = user.preferences.locations.toLowerCase().split(',');
      if (userLocations.some(location => job.location.toLowerCase().includes(location.trim()))) {
        score += 20;
      }
    }
    
    // Correspondance du type de contrat (10%)
    if (job.contractType && user.preferences.contractTypes) {
      if (user.preferences.contractTypes.includes(job.contractType)) {
        score += 10;
      }
    }
    
    return Math.round(score);
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

  return (
    <div
      
      
      
      className="space-y-6"
    >
      {/* Header avec recherche */}
      <div  className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Offres d'alternance
            </h1>
            <p className="text-gray-600">
              Découvrez les opportunités qui correspondent à votre profil
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field text-sm"
            >
              <option value="relevance">Plus pertinentes</option>
              <option value="date">Plus récentes</option>
              <option value="salary">Salaire croissant</option>
              <option value="match">Meilleur match</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-ghost flex items-center gap-2 ${showFilters ? 'bg-primary-50 text-primary-700' : ''}`}
            >
              <FunnelIcon className="w-5 h-5" />
              Filtres
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <form onSubmit={handleSearch} className="mt-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, entreprise, compétences..."
              className="input-field pl-10 pr-4"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary px-4 py-2"
            >
              Rechercher
            </button>
          </div>
        </form>
      </div>

      {/* Filtres avancés */}
      
        {showFilters && (
          <div
            
            
            exit={{ opacity: 0, height: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtres avancés</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Effacer tout
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localisation
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="Ville, région..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de contrat
                </label>
                <select
                  value={filters.contractType}
                  onChange={(e) => handleFilterChange('contractType', e.target.value)}
                  className="input-field"
                >
                  <option value="">Tous</option>
                  <option value="Alternance">Alternance</option>
                  <option value="Stage">Stage</option>
                  <option value="CDD">CDD</option>
                  <option value="CDI">CDI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secteur
                </label>
                <select
                  value={filters.sector}
                  onChange={(e) => handleFilterChange('sector', e.target.value)}
                  className="input-field"
                >
                  <option value="">Tous</option>
                  <option value="Informatique">Informatique</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Finance">Finance</option>
                  <option value="RH">Ressources Humaines</option>
                  <option value="Design">Design</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expérience
                </label>
                <select
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  className="input-field"
                >
                  <option value="">Tous niveaux</option>
                  <option value="junior">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="senior">Expérimenté</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.remote}
                  onChange={(e) => handleFilterChange('remote', e.target.checked)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Télétravail possible</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Salaire:</span>
                <input
                  type="number"
                  value={filters.salaryMin}
                  onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                  placeholder="Min"
                  className="input-field w-20 text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={filters.salaryMax}
                  onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                  placeholder="Max"
                  className="input-field w-20 text-sm"
                />
                <span className="text-sm text-gray-500">€/mois</span>
              </div>
            </div>
          </div>
        )}
      

      {/* Liste des offres */}
      <div className="space-y-4">
        {loading ? (
          <CardSkeleton count={5} />
        ) : jobs.length > 0 ? (
          jobs.map((job, index) => {
            const matchScore = getMatchScore(job);
            const isFavorite = favorites.has(job.id);
            
            return (
              <div
                key={job.id}
                
                
                
                
                className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Logo entreprise */}
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.company} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    {/* Informations du poste */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 cursor-pointer">
                            {job.title}
                          </h3>
                          <p className="text-gray-600 font-medium">{job.company}</p>
                        </div>
                        
                        {matchScore > 0 && (
                          <div className="flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4 text-primary-500" />
                            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                              matchScore >= 80 ? 'bg-green-100 text-green-800' :
                              matchScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {matchScore}% compatible
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <BriefcaseIcon className="w-4 h-4" />
                          {job.contractType}
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-1">
                            <CurrencyEuroIcon className="w-4 h-4" />
                            {job.salary}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {job.publishedAt}
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      {/* Tags des compétences */}
                      {job.requiredSkills && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.requiredSkills.split(',').slice(0, 4).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                          {job.requiredSkills.split(',').length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{job.requiredSkills.split(',').length - 4} autres
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(job.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isFavorite ? (
                          <HeartIconSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <EyeIcon className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    <button
                      onClick={() => applyToJob(job.id)}
                      disabled={job.hasApplied}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        job.hasApplied
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {job.hasApplied ? 'Candidature envoyée' : 'Postuler'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div  className="card text-center py-12">
            <BriefcaseIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune offre trouvée
            </h3>
            <p className="text-gray-600 mb-4">
              Essayez de modifier vos critères de recherche ou vos filtres
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Effacer les filtres
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div  className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default Jobs;