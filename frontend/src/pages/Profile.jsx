import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  UserIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import apiService from '../services/apiService';

const Profile = () => {
  const { user, setUser, stats, setStats } = useApp();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm();

  useEffect(() => {
    if (user) {
      // Pré-remplir le formulaire avec les données utilisateur
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        bio: user.bio || '',
        // Éducation
        currentLevel: user.education?.currentLevel || '',
        institution: user.education?.institution || '',
        field: user.education?.field || '',
        graduationYear: user.education?.graduationYear || '',
        // Expérience
        hasExperience: user.experience?.hasExperience || false,
        // Préférences
        preferredSectors: user.preferences?.sectors || [],
        preferredLocations: user.preferences?.locations || [],
        contractTypes: user.preferences?.contractTypes || [],
        salaryExpectation: user.preferences?.salaryExpectation || '',
        // Compétences
        technicalSkills: user.skills?.technical || [],
        softSkills: user.skills?.soft || [],
        languages: user.skills?.languages || []
      });
    }
  }, [user, reset]);

  const tabs = [
    { id: 'personal', name: 'Informations personnelles', icon: UserIcon },
    { id: 'education', name: 'Formation', icon: AcademicCapIcon },
    { id: 'experience', name: 'Expérience', icon: BriefcaseIcon },
    { id: 'skills', name: 'Compétences', icon: SparklesIcon },
    { id: 'preferences', name: 'Préférences', icon: DocumentTextIcon }
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      const result = await apiService.updateProfile(data);
      
      if (result.success) {
        setUser(result.data.user);
        setStats(result.data.stats);
        toast.success('Profil mis à jour avec succès !');
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const result = await apiService.uploadProfileImage(formData);
      if (result.success) {
        setProfileImage(result.data.imageUrl);
        toast.success('Photo de profil mise à jour !');
      }
    } catch (error) {
      toast.error('Erreur lors du téléchargement de l\'image');
    }
  };


  return (
    <div
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header avec score de profil */}
      <div  className="card bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
            <p className="text-primary-100">
              Complétez votre profil pour obtenir des matches plus précis
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{stats.profileScore}%</div>
            <div className="text-primary-100 text-sm">Complété</div>
            <div className="w-24 h-2 bg-primary-400 rounded-full mt-2">
              <div 
                className="h-2 bg-white rounded-full transition-all duration-500"
                style={{ width: `${stats.profileScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Navigation des onglets */}
        <div  className="lg:col-span-1">
          <div className="card p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user?.firstName?.charAt(0) || 'U'
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                    <PhotoIcon className="w-3 h-3 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <nav className="space-y-1 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div  className="lg:col-span-3">
          <form onSubmit={handleSubmit(onSubmit)}>
            
              
              {/* Informations personnelles */}
              {activeTab === 'personal' && (
                <div
                  key="personal"
                  className="card space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Informations personnelles
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        {...register('firstName', { required: 'Le prénom est requis' })}
                        type="text"
                        className="input-field"
                        placeholder="Votre prénom"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        {...register('lastName', { required: 'Le nom est requis' })}
                        type="text"
                        className="input-field"
                        placeholder="Votre nom"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        {...register('email', { required: 'L\'email est requis' })}
                        type="email"
                        className="input-field"
                        placeholder="votre@email.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        className="input-field"
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de naissance
                    </label>
                    <input
                      {...register('dateOfBirth')}
                      type="date"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <input
                      {...register('address')}
                      type="text"
                      className="input-field"
                      placeholder="Votre adresse complète"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville
                      </label>
                      <input
                        {...register('city')}
                        type="text"
                        className="input-field"
                        placeholder="Votre ville"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code postal
                      </label>
                      <input
                        {...register('postalCode')}
                        type="text"
                        className="input-field"
                        placeholder="75000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Présentation personnelle
                    </label>
                    <textarea
                      {...register('bio')}
                      rows={4}
                      className="input-field"
                      placeholder="Parlez-nous de vous, vos motivations, vos objectifs..."
                    />
                  </div>
                </div>
              )}

              {/* Formation */}
              {activeTab === 'education' && (
                <div
                  key="education"
                  
                  
                  
                  
                  className="card space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Formation et études
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Niveau d'études actuel *
                      </label>
                      <select
                        {...register('currentLevel', { required: 'Le niveau est requis' })}
                        className="input-field"
                      >
                        <option value="">Sélectionnez votre niveau</option>
                        <option value="bac">Bac</option>
                        <option value="bac+1">Bac+1</option>
                        <option value="bac+2">Bac+2 (BTS, DUT, DEUST)</option>
                        <option value="bac+3">Bac+3 (Licence, Bachelor)</option>
                        <option value="bac+4">Bac+4 (Master 1)</option>
                        <option value="bac+5">Bac+5 (Master 2, Ingénieur)</option>
                        <option value="bac+8">Bac+8+ (Doctorat)</option>
                      </select>
                      {errors.currentLevel && (
                        <p className="mt-1 text-sm text-red-600">{errors.currentLevel.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Établissement *
                      </label>
                      <input
                        {...register('institution', { required: 'L\'établissement est requis' })}
                        type="text"
                        className="input-field"
                        placeholder="Nom de votre école/université"
                      />
                      {errors.institution && (
                        <p className="mt-1 text-sm text-red-600">{errors.institution.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Domaine d'études *
                      </label>
                      <input
                        {...register('field', { required: 'Le domaine est requis' })}
                        type="text"
                        className="input-field"
                        placeholder="Ex: Informatique, Commerce, Marketing..."
                      />
                      {errors.field && (
                        <p className="mt-1 text-sm text-red-600">{errors.field.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Année de diplôme prévue
                      </label>
                      <input
                        {...register('graduationYear')}
                        type="number"
                        min="2024"
                        max="2030"
                        className="input-field"
                        placeholder="2025"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Expérience */}
              {activeTab === 'experience' && (
                <div
                  key="experience"
                  
                  
                  
                  
                  className="card space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Expérience professionnelle
                  </h2>

                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        {...register('hasExperience')}
                        type="checkbox"
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        J'ai déjà une expérience professionnelle
                      </span>
                    </label>
                  </div>

                  {watch('hasExperience') && (
                    <div
                      
                      
                      className="space-y-4"
                    >
                      {/* Ici on pourrait ajouter des champs dynamiques pour les expériences */}
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-600 mb-4">
                          Ajoutez vos expériences professionnelles (stages, jobs étudiants, etc.)
                        </p>
                        <button
                          type="button"
                          className="btn-ghost flex items-center gap-2"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Ajouter une expérience
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Compétences */}
              {activeTab === 'skills' && (
                <div
                  key="skills"
                  
                  
                  
                  
                  className="card space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Compétences et savoir-être
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compétences techniques
                    </label>
                    <input
                      {...register('technicalSkills')}
                      type="text"
                      className="input-field"
                      placeholder="Ex: JavaScript, Python, Photoshop, Excel... (séparées par des virgules)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Savoir-être / Soft skills
                    </label>
                    <input
                      {...register('softSkills')}
                      type="text"
                      className="input-field"
                      placeholder="Ex: Leadership, Créativité, Travail en équipe... (séparées par des virgules)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Langues
                    </label>
                    <input
                      {...register('languages')}
                      type="text"
                      className="input-field"
                      placeholder="Ex: Anglais (courant), Espagnol (intermédiaire)... (séparées par des virgules)"
                    />
                  </div>
                </div>
              )}

              {/* Préférences */}
              {activeTab === 'preferences' && (
                <div
                  key="preferences"
                  
                  
                  
                  
                  className="card space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Préférences de recherche
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secteurs d'activité recherchés
                    </label>
                    <input
                      {...register('preferredSectors')}
                      type="text"
                      className="input-field"
                      placeholder="Ex: Informatique, Marketing, Finance... (séparés par des virgules)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zones géographiques
                    </label>
                    <input
                      {...register('preferredLocations')}
                      type="text"
                      className="input-field"
                      placeholder="Ex: Paris, Lyon, Télétravail... (séparées par des virgules)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Types de contrat
                    </label>
                    <div className="space-y-2">
                      {['Alternance', 'Stage', 'CDD', 'CDI', 'Freelance'].map((type) => (
                        <label key={type} className="flex items-center space-x-3">
                          <input
                            {...register('contractTypes')}
                            type="checkbox"
                            value={type}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rémunération souhaitée (€/mois)
                    </label>
                    <select
                      {...register('salaryExpectation')}
                      className="input-field"
                    >
                      <option value="">Non spécifié</option>
                      <option value="500-800">500 - 800€</option>
                      <option value="800-1200">800 - 1200€</option>
                      <option value="1200-1600">1200 - 1600€</option>
                      <option value="1600+">1600€+</option>
                    </select>
                  </div>
                </div>
              )}

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => reset()}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5" />
                )}
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;