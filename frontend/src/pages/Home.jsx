import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { 
  SparklesIcon,
  RocketLaunchIcon,
  HeartIcon,
  ChartBarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const [stats, setStats] = useState({
    users: 1250,
    matches: 3400,
    companies: 450,
    successRate: 89
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Intersection observers pour les animations au scroll
  const { ref: heroRef, inView: heroInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const { ref: featuresRef, inView: featuresInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const { ref: statsRef, inView: statsInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const features = [
    {
      icon: SparklesIcon,
      title: "IA Avancée",
      description: "Notre algorithme d'IA analyse votre profil et trouve les offres parfaitement adaptées à vos compétences et aspirations.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: HeartIcon,
      title: "Matching Précis",
      description: "Système de matching basé sur la compatibilité réelle entre votre profil et les besoins des entreprises.",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: RocketLaunchIcon,
      title: "Suivi Personnalisé",
      description: "Accompagnement personnalisé tout au long de votre recherche avec des conseils adaptés à votre profil.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: ChartBarIcon,
      title: "Analyses Détaillées",
      description: "Statistiques complètes sur vos candidatures, taux de réussite et recommandations d'amélioration.",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Créez votre profil",
      description: "Renseignez vos compétences, expériences et préférences en quelques minutes.",
      icon: UserGroupIcon
    },
    {
      number: "02",
      title: "L'IA analyse votre profil",
      description: "Notre algorithme étudie votre profil et identifie vos points forts.",
      icon: SparklesIcon
    },
    {
      number: "03",
      title: "Recevez vos matches",
      description: "Découvrez les offres d'alternance qui correspondent parfaitement à votre profil.",
      icon: HeartIcon
    },
    {
      number: "04",
      title: "Postulez facilement",
      description: "Candidatez directement aux offres qui vous intéressent en un clic.",
      icon: RocketLaunchIcon
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      
      {/* Hero Section */}
      <section
        ref={heroRef}
        
        
        animate={heroInView ? "visible" : "hidden"}
        className="relative py-20 overflow-hidden lg:py-32"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            
            
            className="absolute w-20 h-20 rounded-full top-20 left-10 bg-primary-200 opacity-20"
          />
          <div
            
            
            style={{ animationDelay: '1s' }}
            className="absolute w-32 h-32 rounded-full top-40 right-20 bg-secondary-200 opacity-20"
          />
          <div
            
            
            style={{ animationDelay: '2s' }}
            className="absolute w-16 h-16 rounded-full bottom-20 left-1/4 bg-accent-200 opacity-20"
          />
        </div>

        <div className="relative container-custom">
          <div className="max-w-4xl mx-auto text-center">
            
            <div
              
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-primary-100 text-primary-700">
                <SparklesIcon className="w-4 h-4" />
                Plateforme IA de matching d'alternance
              </span>
            </div>

            <h1
              
              className="mb-6 text-5xl font-bold leading-tight text-gray-900 lg:text-7xl"
            >
              Trouve ton
              <span className="block gradient-text">
                alternance parfaite
              </span>
            </h1>

            <p
              
              className="max-w-2xl mx-auto mb-8 text-xl leading-relaxed text-gray-600"
            >
              Notre IA révolutionnaire analyse ton profil et te connecte avec les meilleures opportunités d'alternance. 
              Plus de recherche fastidieuse, que des matches parfaits !
            </p>

            <div
              
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link
                to="/register"
                className="flex items-center gap-2 px-8 py-4 text-lg btn-primary group"
              >
                Commencer gratuitement
                <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <button className="flex items-center gap-2 text-gray-600 transition-colors hover:text-primary-600">
                <div className="flex items-center justify-center w-12 h-12 transition-shadow bg-white rounded-full shadow-lg group-hover:shadow-xl">
                  <PlayIcon className="w-5 h-5 ml-1" />
                </div>
                Voir la démo
              </button>
            </div>

            {/* Stats */}
            <div
              
              className="grid grid-cols-2 gap-8 mt-16 lg:grid-cols-4"
            >
              {[
                { label: "Étudiants", value: stats.users, suffix: "+" },
                { label: "Matches réussis", value: stats.matches, suffix: "+" },
                { label: "Entreprises", value: stats.companies, suffix: "+" },
                { label: "Taux de réussite", value: stats.successRate, suffix: "%" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div
                    
                    animate={heroInView ? { scale: 1 } : { scale: 0 }}
                    
                    className="mb-2 text-3xl font-bold lg:text-4xl text-primary-600"
                  >
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="font-medium text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        
        
        animate={featuresInView ? "visible" : "hidden"}
        className="py-20 bg-white"
      >
        <div className="container-custom">
          <div  className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold text-gray-900 lg:text-5xl">
              Pourquoi choisir notre plateforme ?
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Une technologie de pointe au service de votre réussite professionnelle
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                
                
                className="text-center card group"
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} p-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container-custom">
          <div
            
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-6 text-4xl font-bold text-gray-900 lg:text-5xl">
              Comment ça marche ?
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Un processus simple et efficace pour trouver votre alternance idéale
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={index}
                
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                
                className="relative"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-secondary-300 z-0" />
                )}
                
                <div className="relative z-10 text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-white border-4 shadow-lg rounded-2xl border-primary-100">
                    <step.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  
                  <div className="mb-2 text-sm font-bold text-primary-600">
                    ÉTAPE {step.number}
                  </div>
                  
                  <h3 className="mb-4 text-xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-white bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="text-center container-custom">
          <div
            
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="mb-6 text-4xl font-bold lg:text-5xl">
              Prêt à trouver ton alternance de rêve ?
            </h2>
            <p className="mb-8 text-xl text-white/90">
              Rejoins des milliers d'étudiants qui ont déjà trouvé leur alternance parfaite grâce à notre IA.
            </p>
            
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="px-8 py-4 font-bold transition-all duration-200 transform bg-white rounded-lg shadow-lg text-primary-600 hover:bg-gray-100 hover:shadow-xl hover:-translate-y-1"
              >
                Créer mon compte gratuitement
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 font-bold text-white transition-all duration-200 border-2 border-white rounded-lg hover:bg-white hover:text-primary-600"
              >
                J'ai déjà un compte
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;