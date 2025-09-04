import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Styles globaux
import './styles/globals.css';

// Créer le root de l'application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendu de l'application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);