import React from 'react';
import { clsx } from 'clsx';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  text = null,
  className = '',
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    gray: 'text-gray-600'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const containerClasses = clsx(
    'flex flex-col items-center justify-center gap-3',
    fullScreen && 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50',
    className
  );

  return (
    <div className={containerClasses}>
      <div
        
        
        className={clsx(
          sizeClasses[size],
          colorClasses[color],
          'animate-spin'
        )}
      >
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      
      {text && (
        <p
          
          
          
          className={clsx(
            textSizeClasses[size],
            'text-gray-600 font-medium'
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
};

// Composant de loading avec points animés
export const LoadingDots = ({ size = 'md', color = 'primary' }) => {
  const dotSizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    white: 'bg-white',
    gray: 'bg-gray-600'
  };

  const dotVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          
          
          style={{ animationDelay: `${index * 0.2}s` }}
          className={clsx(
            dotSizeClasses[size],
            colorClasses[color],
            'rounded-full'
          )}
        />
      ))}
    </div>
  );
};

// Composant de skeleton loading
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  avatar = false,
  button = false 
}) => {
  return (
    <div className={clsx('animate-pulse', className)}>
      <div className="flex items-start space-x-4">
        {avatar && (
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        )}
        
        <div className="flex-1 space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={clsx(
                'h-4 bg-gray-200 rounded',
                index === lines - 1 ? 'w-3/4' : 'w-full'
              )}
            />
          ))}
          
          {button && (
            <div className="w-24 h-8 bg-gray-200 rounded mt-4"></div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant de loading pour les cartes
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="flex space-x-2 mt-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-14"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;