import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  User as UserIcon,
  Phone as PhoneIcon,
  Lock as LockClosedIcon,
  Eye as EyeIcon,
  CheckCircle as CheckCircleIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Sparkles as SparklesIcon
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Register = () => {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, getValues } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      acceptTerms: false,
      acceptNewsletter: false
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const psychologicalQuestions = [
    {
      id: 'work_style',
      question: 'Comment préférez-vous travailler ?',
      type: 'radio',
      options: [
        { value: 'team', label: 'En équipe, j\'aime collaborer' },
        { value: 'independent', label: 'De manière autonome' },
        { value: 'mixed', label: 'Les deux selon le contexte' }
      ]
    },
    {
      id: 'learning_style',
      question: 'Quel est votre style d\'apprentissage préféré ?',
      type: 'radio',
      options: [
        { value: 'visual', label: 'Visuel (schémas, graphiques)' },
        { value: 'auditory', label: 'Auditif (explications orales)' },
        { value: 'kinesthetic', label: 'Kinesthésique (pratique)' },
        { value: 'reading', label: 'Lecture/écriture' }
      ]
    },
    {
      id: 'stress_management',
      question: 'Comment gérez-vous le stress ?',
      type: 'radio',
      options: [
        { value: 'planning', label: 'Par la planification et l\'organisation' },
        { value: 'communication', label: 'En communiquant avec les autres' },
        { value: 'break', label: 'En prenant des pauses régulières' },
        { value: 'problem_solving', label: 'En résolvant les problèmes rapidement' }
      ]
    },
    {
      id: 'motivation',
      question: 'Qu\'est-ce qui vous motive le plus ?',
      type: 'checkbox',
      options: [
        { value: 'recognition', label: 'La reconnaissance' },
        { value: 'learning', label: 'L\'apprentissage continu' },
        { value: 'impact', label: 'L\'impact de mon travail' },
        { value: 'growth', label: 'L\'évolution de carrière' },
        { value: 'balance', label: 'L\'équilibre vie pro/perso' }
      ]
    },
    {
      id: 'communication_style',
      question: 'Votre style de communication ?',
      type: 'radio',
      options: [
        { value: 'direct', label: 'Direct et concis' },
        { value: 'diplomatic', label: 'Diplomatique et nuancé' },
        { value: 'enthusiastic', label: 'Enthousiaste et expressif' },
        { value: 'analytical', label: 'Analytique et détaillé' }
      ]
    },
    {
      id: 'problem_solving',
      question: 'Face à un problème complexe, vous :',
      type: 'radio',
      options: [
        { value: 'research', label: 'Recherchez des informations' },
        { value: 'brainstorm', label: 'Brainstormez avec d\'autres' },
        { value: 'systematic', label: 'Adoptez une approche systématique' },
        { value: 'intuitive', label: 'Faites confiance à votre intuition' }
      ]
    }
  ];

  const steps = [
    { id: 1, title: 'Informations personnelles', description: 'Vos données de base' },
    { id: 2, title: 'Profil psychologique', description: 'Questionnaire comportemental' },
    { id: 3, title: 'Finalisation', description: 'Création du compte' }
  ];

  const onSubmit = async (data) => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const registrationData = {
        ...data,
        psychological_profile: {
          work_style: data.work_style,
          learning_style: data.learning_style,
          stress_management: data.stress_management,
          motivation: Array.isArray(data.motivation) ? data.motivation : [data.motivation],
          communication_style: data.communication_style,
          problem_solving: data.problem_solving
        }
      };

      const result = await apiService.register(registrationData);

      if (result.success) {
        setUser(result.data.user);
        toast.success('Compte créé avec succès !');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Erreur lors de la création du compte');
      }
    } catch (error) {
      console.error('Erreur registration:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const nextStep = () => {
    const currentData = getValues();

    if (currentStep === 1) {
      const requiredFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
      const hasErrors = requiredFields.some(field => !currentData[field]);

      if (hasErrors) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (currentData.password !== currentData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, y: 0 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-secondary-50 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 text-xl font-bold text-white shadow-lg bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl">
              M
            </div>
            <span className="text-2xl font-bold gradient-text">
              Match Ton Alternance
            </span>
          </Link>

          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            Créer votre compte
          </h2>
          <p className="text-gray-600">
            Rejoignez notre plateforme intelligente de matching
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {steps[currentStep - 1].title}
            </h3>
            <p className="text-sm text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {/* ÉTAPE 1 */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* 👉 Tous tes champs prénom, nom, email, téléphone, mdp, confirm mdp */}
                  {/* ... je garde ton code tel quel pour les inputs */}
                </motion.div>
              )}

              {/* ÉTAPE 2 */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-8"
                >
                  {/* 👉 Questionnaire comportemental (je garde ton code des questions) */}
                </motion.div>
              )}

              {/* ÉTAPE 3 */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6 text-center"
                >
                  {/* 👉 Conditions + finalisation */}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-200">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 btn-ghost"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Précédent
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 btn-primary"
                >
                  Suivant
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      Créer mon compte
                      <CheckCircleIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Login Link */}
        <motion.div variants={itemVariants} className="mt-6 text-center">
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Se connecter
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
