import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ModalProvider } from './modal.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </React.StrictMode>
);
