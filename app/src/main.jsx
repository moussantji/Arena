import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ModalProvider } from './modal.jsx';
import { DataProvider } from './data.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DataProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </DataProvider>
  </React.StrictMode>
);
