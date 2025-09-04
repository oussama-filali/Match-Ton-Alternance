#!/usr/bin/env python3
"""
Match Ton Alternance - AI Matching Engine
Algorithme d'IA avancé pour le matching intelligent entre candidats et offres d'emploi
Compatible avec PHP via API REST
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import SnowballStemmer
import re
import json
import logging
from datetime import datetime
import os
from typing import Dict, List, Tuple, Any

# Configuration de l'application Flask
app = Flask(__name__)
CORS(app)

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Téléchargement des ressources NLTK nécessaires
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

def calculate_profile_completeness(user_profile: Dict) -> Dict[str, Any]:
    """
    Calcule le pourcentage de complétude du profil
    """
    total_fields = 0
    completed_fields = 0
    
    # Informations personnelles
    personal_fields = ['firstName', 'lastName', 'email', 'phone', 'city']
    for field in personal_fields:
        total_fields += 1
        if user_profile.get(field):
            completed_fields += 1
    
    # Compétences
    skills = user_profile.get('skills', {})
    total_fields += 2
    if skills.get('technical'):
        completed_fields += 1
    if skills.get('soft'):
        completed_fields += 1
    
    # Formation
    education = user_profile.get('education', {})
    education_fields = ['current_level', 'institution', 'field']
    for field in education_fields:
        total_fields += 1
        if education.get(field):
            completed_fields += 1
    
    # Préférences
    preferences = user_profile.get('preferences', {})
    pref_fields = ['sectors', 'locations', 'contract_types']
    for field in pref_fields:
        total_fields += 1
        if preferences.get(field):
            completed_fields += 1
    
    # Profil psychologique
    total_fields += 1
    if user_profile.get('psychological_profile'):
        completed_fields += 1
    
    completeness_percentage = (completed_fields / total_fields) * 100 if total_fields > 0 else 0
    
    return {
        'percentage': round(completeness_percentage, 1),
        'completed_fields': completed_fields,
        'total_fields': total_fields,
        'missing_fields': total_fields - completed_fields
    }

class AdvancedMatchingAI:
    """
    Classe principale pour l'algorithme de matching avancé
    Utilise des techniques de NLP et Machine Learning
    """
    
    def __init__(self):
        self.stemmer = SnowballStemmer('french')
        self.stop_words = set(stopwords.words('french'))
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words=list(self.stop_words),
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95
        )
        self.scaler = StandardScaler()
        
        # Dictionnaire des compétences et leurs synonymes
        self.skills_synonyms = {
            'javascript': ['js', 'node', 'nodejs', 'react', 'vue', 'angular'],
            'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy'],
            'java': ['spring', 'hibernate', 'maven', 'gradle'],
            'php': ['laravel', 'symfony', 'wordpress', 'drupal'],
            'sql': ['mysql', 'postgresql', 'oracle', 'mongodb'],
            'html': ['css', 'sass', 'less', 'bootstrap'],
            'git': ['github', 'gitlab', 'bitbucket'],
            'docker': ['kubernetes', 'containerisation'],
            'aws': ['azure', 'gcp', 'cloud'],
            'marketing': ['seo', 'sem', 'social media', 'content marketing'],
            'design': ['photoshop', 'illustrator', 'figma', 'sketch'],
            'gestion': ['management', 'leadership', 'organisation'],
            'communication': ['présentation', 'rédaction', 'négociation']
        }
        
        # Mapping des traits de personnalité avec les types de postes
        self.personality_job_mapping = {
            'leadership': {
                'keywords': ['manager', 'chef', 'responsable', 'directeur', 'lead'],
                'weight': 0.8
            },
            'creativity': {
                'keywords': ['design', 'marketing', 'communication', 'créatif', 'innovation'],
                'weight': 0.7
            },
            'analytical': {
                'keywords': ['data', 'analyse', 'finance', 'recherche', 'statistique'],
                'weight': 0.9
            },
            'social': {
                'keywords': ['commercial', 'vente', 'rh', 'relation', 'client'],
                'weight': 0.8
            },
            'technical': {
                'keywords': ['développeur', 'ingénieur', 'technique', 'it', 'informatique'],
                'weight': 0.9
            },
            'autonomous': {
                'keywords': ['freelance', 'télétravail', 'indépendant', 'autonome'],
                'weight': 0.6
            },
            'team_player': {
                'keywords': ['équipe', 'collaboratif', 'projet', 'groupe'],
                'weight': 0.7
            }
        }

    def preprocess_text(self, text: str) -> str:
        """
        Préprocesse le texte pour l'analyse NLP
        """
        if not text:
            return ""
        
        # Conversion en minuscules
        text = text.lower()
        
        # Suppression des caractères spéciaux
        text = re.sub(r'[^a-zA-ZÀ-ÿ\s]', ' ', text)
        
        # Tokenisation
        tokens = word_tokenize(text, language='french')
        
        # Suppression des mots vides et stemming
        processed_tokens = []
        for token in tokens:
            if token not in self.stop_words and len(token) > 2:
                processed_tokens.append(self.stemmer.stem(token))
        
        return ' '.join(processed_tokens)

    def extract_skills_from_text(self, text: str) -> List[str]:
        """
        Extrait les compétences mentionnées dans un texte
        """
        text_lower = text.lower()
        found_skills = []
        
        for main_skill, synonyms in self.skills_synonyms.items():
            if main_skill in text_lower:
                found_skills.append(main_skill)
            else:
                for synonym in synonyms:
                    if synonym in text_lower:
                        found_skills.append(main_skill)
                        break
        
        return list(set(found_skills))

    def calculate_skills_similarity(self, user_skills: List[str], job_skills: List[str]) -> float:
        """
        Calcule la similarité entre les compétences utilisateur et celles requises
        """
        if not user_skills or not job_skills:
            return 0.0
        
        user_skills_expanded = set()
        job_skills_expanded = set()
        
        # Expansion des compétences avec les synonymes
        for skill in user_skills:
            user_skills_expanded.add(skill.lower())
            if skill.lower() in self.skills_synonyms:
                user_skills_expanded.update(self.skills_synonyms[skill.lower()])
        
        for skill in job_skills:
            job_skills_expanded.add(skill.lower())
            if skill.lower() in self.skills_synonyms:
                job_skills_expanded.update(self.skills_synonyms[skill.lower()])
        
        # Calcul de la similarité Jaccard
        intersection = len(user_skills_expanded.intersection(job_skills_expanded))
        union = len(user_skills_expanded.union(job_skills_expanded))
        
        return intersection / union if union > 0 else 0.0

    def analyze_personality_job_fit(self, personality_profile: Dict, job_description: str) -> float:
        """
        Analyse la compatibilité entre le profil psychologique et le poste
        """
        if not personality_profile or not job_description:
            return 0.5
        
        job_text = job_description.lower()
        compatibility_score = 0.0
        total_weight = 0.0
        
        # Analyse du style de travail
        work_style = personality_profile.get('work_style', '')
        if work_style == 'team' and any(keyword in job_text for keyword in ['équipe', 'collabor', 'groupe']):
            compatibility_score += 0.8
            total_weight += 1.0
        elif work_style == 'independent' and any(keyword in job_text for keyword in ['autonome', 'indépendant']):
            compatibility_score += 0.8
            total_weight += 1.0
        else:
            total_weight += 1.0
        
        # Analyse des motivations
        motivations = personality_profile.get('motivation', [])
        if isinstance(motivations, str):
            motivations = [motivations]
        
        for motivation in motivations:
            if motivation == 'learning' and any(keyword in job_text for keyword in ['formation', 'apprentissage', 'développement']):
                compatibility_score += 0.6
            elif motivation == 'impact' and any(keyword in job_text for keyword in ['impact', 'innovation', 'changement']):
                compatibility_score += 0.6
            elif motivation == 'growth' and any(keyword in job_text for keyword in ['évolution', 'carrière', 'promotion']):
                compatibility_score += 0.6
            total_weight += 0.5
        
        # Analyse du style de communication
        communication_style = personality_profile.get('communication_style', '')
        if communication_style == 'direct' and any(keyword in job_text for keyword in ['commercial', 'vente', 'négociation']):
            compatibility_score += 0.7
            total_weight += 1.0
        elif communication_style == 'analytical' and any(keyword in job_text for keyword in ['analyse', 'recherche', 'étude']):
            compatibility_score += 0.7
            total_weight += 1.0
        else:
            total_weight += 1.0
        
        return compatibility_score / total_weight if total_weight > 0 else 0.5

    def calculate_location_score(self, user_locations: List[str], job_location: str, remote_possible: bool = False) -> float:
        """
        Calcule le score de compatibilité géographique
        """
        if not user_locations or not job_location:
            return 0.5
        
        # Si télétravail possible et souhaité
        if remote_possible and any('télétravail' in loc.lower() or 'remote' in loc.lower() for loc in user_locations):
            return 1.0
        
        job_location_lower = job_location.lower()
        
        # Correspondance exacte
        for user_loc in user_locations:
            if user_loc.lower() in job_location_lower or job_location_lower in user_loc.lower():
                return 0.9
        
        # Correspondance régionale approximative
        regions = {
            'paris': ['paris', 'ile-de-france', '75', '77', '78', '91', '92', '93', '94', '95'],
            'lyon': ['lyon', 'rhône', '69', 'auvergne'],
            'marseille': ['marseille', 'bouches-du-rhône', '13', 'paca'],
            'toulouse': ['toulouse', 'haute-garonne', '31', 'occitanie'],
            'lille': ['lille', 'nord', '59', 'hauts-de-france'],
            'bordeaux': ['bordeaux', 'gironde', '33', 'nouvelle-aquitaine']
        }
        
        for region, cities in regions.items():
            user_in_region = any(city in user_loc.lower() for user_loc in user_locations for city in cities)
            job_in_region = any(city in job_location_lower for city in cities)
            
            if user_in_region and job_in_region:
                return 0.7
        
        return 0.3

    def calculate_comprehensive_match_score(self, user_profile: Dict, job_offer: Dict) -> Dict[str, Any]:
        """
        Calcule un score de matching complet avec analyse détaillée
        """
        try:
            # Extraction des données
            user_skills = user_profile.get('skills', {}).get('technical', [])
            user_soft_skills = user_profile.get('skills', {}).get('soft', [])
            user_personality = user_profile.get('psychological_profile', {})
            user_preferences = user_profile.get('preferences', {})
            user_education = user_profile.get('education', {})
            user_experience = user_profile.get('experience', {})
            
            job_title = job_offer.get('title', '')
            job_description = job_offer.get('description', '')
            job_skills = job_offer.get('required_skills', [])
            job_location = job_offer.get('location', '')
            job_contract = job_offer.get('contract_type', '')
            job_sector = job_offer.get('sector', '')
            remote_possible = job_offer.get('remote_possible', False)
            
            # Calculs des scores individuels
            scores = {}
            
            # 1. Score des compétences techniques (35%)
            skills_score = self.calculate_skills_similarity(user_skills, job_skills)
            scores['technical_skills'] = skills_score * 100
            
            # 2. Score de compatibilité psychologique (25%)
            personality_score = self.analyze_personality_job_fit(user_personality, job_title + ' ' + job_description)
            scores['personality'] = personality_score * 100
            
            # 3. Score géographique (15%)
            location_score = self.calculate_location_score(
                user_preferences.get('locations', []), 
                job_location, 
                remote_possible
            )
            scores['location'] = location_score * 100
            
            # 4. Score des soft skills (10%)
            soft_skills_extracted = self.extract_skills_from_text(job_description)
            soft_skills_score = self.calculate_skills_similarity(user_soft_skills, soft_skills_extracted)
            scores['soft_skills'] = soft_skills_score * 100
            
            # 5. Score des préférences (8%)
            preferences_score = 0.5
            if job_contract in user_preferences.get('contract_types', []):
                preferences_score += 0.3
            if any(sector.lower() in job_sector.lower() for sector in user_preferences.get('sectors', [])):
                preferences_score += 0.2
            scores['preferences'] = min(preferences_score * 100, 100)
            
            # 6. Score de formation (7%)
            education_score = 0.7  # Score par défaut
            user_level = user_education.get('current_level', '')
            required_level = job_offer.get('required_level', '')
            if user_level and required_level:
                level_mapping = {'bac': 1, 'bac+1': 2, 'bac+2': 3, 'bac+3': 4, 'bac+4': 5, 'bac+5': 6, 'bac+8': 7}
                user_level_num = level_mapping.get(user_level, 0)
                required_level_num = level_mapping.get(required_level, 0)
                if user_level_num >= required_level_num:
                    education_score = 1.0
                elif user_level_num >= required_level_num - 1:
                    education_score = 0.8
            scores['education'] = education_score * 100
            
            # Calcul du score final pondéré
            weights = {
                'technical_skills': 0.35,
                'personality': 0.25,
                'location': 0.15,
                'soft_skills': 0.10,
                'preferences': 0.08,
                'education': 0.07
            }
            
            final_score = sum(scores[key] * weights[key] for key in scores.keys())
            
            # Génération des raisons du match
            match_reasons = []
            if scores['technical_skills'] > 70:
                match_reasons.append("Excellente correspondance des compétences techniques")
            if scores['personality'] > 75:
                match_reasons.append("Profil comportemental très compatible")
            if scores['location'] > 80:
                match_reasons.append("Localisation idéale")
            if scores['soft_skills'] > 60:
                match_reasons.append("Bonnes compétences transversales")
            
            if not match_reasons:
                match_reasons.append("Profil compatible avec les exigences du poste")
            
            # Détermination du niveau de compatibilité
            if final_score >= 85:
                compatibility_level = "Excellent"
            elif final_score >= 70:
                compatibility_level = "Très bon"
            elif final_score >= 55:
                compatibility_level = "Bon"
            elif final_score >= 40:
                compatibility_level = "Moyen"
            else:
                compatibility_level = "Faible"
            
            # Génération de recommandations
            recommendations = []
            if scores['technical_skills'] < 60:
                recommendations.append("Développez vos compétences techniques pour mieux correspondre aux exigences")
            if scores['personality'] < 50:
                recommendations.append("Mettez en avant les aspects de votre personnalité qui correspondent au poste")
            if scores['location'] < 40:
                recommendations.append("Considérez élargir votre zone de recherche géographique")
            
            return {
                'total_score': round(final_score, 2),
                'detailed_scores': {k: round(v, 2) for k, v in scores.items()},
                'compatibility_level': compatibility_level,
                'match_reasons': match_reasons,
                'recommendations': recommendations,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erreur dans le calcul du score de matching: {str(e)}")
            return {
                'total_score': 0,
                'detailed_scores': {},
                'compatibility_level': 'Erreur',
                'match_reasons': [],
                'recommendations': ['Erreur dans l\'analyse, veuillez réessayer'],
                'error': str(e)
            }

# Instance globale de l'algorithme
matching_ai = AdvancedMatchingAI()

@app.route('/health', methods=['GET'])
def health_check():
    """Point de santé de l'API"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/match/calculate', methods=['POST'])
def calculate_match():
    """
    Endpoint principal pour calculer le score de matching
    """
    try:
        data = request.get_json()
        
        if not data or 'user_profile' not in data or 'job_offer' not in data:
            return jsonify({
                'error': 'user_profile et job_offer sont requis'
            }), 400
        
        user_profile = data['user_profile']
        job_offer = data['job_offer']
        
        # Calcul du score de matching
        result = matching_ai.calculate_comprehensive_match_score(user_profile, job_offer)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Erreur dans calculate_match: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/match/batch', methods=['POST'])
def calculate_batch_matches():
    """
    Calcule les scores de matching pour plusieurs offres en une fois
    """
    try:
        data = request.get_json()
        
        if not data or 'user_profile' not in data or 'job_offers' not in data:
            return jsonify({
                'error': 'user_profile et job_offers sont requis'
            }), 400
        
        user_profile = data['user_profile']
        job_offers = data['job_offers']
        
        results = []
        for job_offer in job_offers:
            match_result = matching_ai.calculate_comprehensive_match_score(user_profile, job_offer)
            match_result['job_id'] = job_offer.get('id')
            results.append(match_result)
        
        # Tri par score décroissant
        results.sort(key=lambda x: x['total_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': {
                'matches': results,
                'total_analyzed': len(results),
                'best_match_score': results[0]['total_score'] if results else 0
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur dans calculate_batch_matches: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/analyze/skills', methods=['POST'])
def analyze_skills():
    """
    Analyse les compétences d'un texte (CV, description de poste, etc.)
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'text est requis'
            }), 400
        
        text = data['text']
        
        # Extraction des compétences
        extracted_skills = matching_ai.extract_skills_from_text(text)
        
        # Préprocessing du texte
        processed_text = matching_ai.preprocess_text(text)
        
        return jsonify({
            'success': True,
            'data': {
                'extracted_skills': extracted_skills,
                'processed_text': processed_text,
                'skills_count': len(extracted_skills)
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur dans analyze_skills: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/recommendations/profile', methods=['POST'])
def get_profile_recommendations():
    """
    Génère des recommandations d'amélioration de profil
    """
    try:
        data = request.get_json()
        
        if not data or 'user_profile' not in data:
            return jsonify({
                'error': 'user_profile est requis'
            }), 400
        
        user_profile = data['user_profile']
        target_jobs = data.get('target_jobs', [])
        
        recommendations = []
        
        # Analyse des compétences manquantes
        if target_jobs:
            all_required_skills = []
            for job in target_jobs:
                all_required_skills.extend(job.get('required_skills', []))
            
            skill_frequency = {}
            for skill in all_required_skills:
                skill_frequency[skill] = skill_frequency.get(skill, 0) + 1
            
            user_skills = [skill.lower() for skill in user_profile.get('skills', {}).get('technical', [])]
            
            missing_skills = []
            for skill, freq in sorted(skill_frequency.items(), key=lambda x: x[1], reverse=True):
                if skill.lower() not in user_skills:
                    missing_skills.append({'skill': skill, 'demand': freq})
            
            if missing_skills[:5]:
                recommendations.append({
                    'type': 'skills',
                    'priority': 'high',
                    'title': 'Compétences très demandées',
                    'description': 'Ces compétences sont fréquemment demandées dans vos cibles',
                    'suggestions': missing_skills[:5]
                })
        
        # Analyse du profil psychologique
        personality = user_profile.get('psychological_profile', {})
        if not personality:
            recommendations.append({
                'type': 'personality',
                'priority': 'medium',
                'title': 'Complétez votre profil psychologique',
                'description': 'Un profil comportemental complet améliore significativement vos matches',
                'action': 'Répondez au questionnaire psychologique'
            })
        
        # Analyse des préférences
        preferences = user_profile.get('preferences', {})
        if not preferences.get('locations') or not preferences.get('sectors'):
            recommendations.append({
                'type': 'preferences',
                'priority': 'medium',
                'title': 'Précisez vos préférences',
                'description': 'Des préférences claires permettent un matching plus précis',
                'action': 'Complétez vos préférences de recherche'
            })
        
        return jsonify({
            'success': True,
            'data': {
                'recommendations': recommendations,
                'profile_completeness': calculate_profile_completeness(user_profile)
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur dans get_profile_recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Démarrage du serveur AI Engine sur le port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)