// React application entry point with initialization

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './gui/App';
import { database } from './storage/Database';

// Initialize database
database.initialize().then(() => {
  console.log('Database initialized');
}).catch((error) => {
  console.error('Failed to initialize database:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
