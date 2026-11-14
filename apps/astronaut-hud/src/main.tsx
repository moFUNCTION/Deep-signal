import React from 'react';
import ReactDOM from 'react-dom/client';
import { AccessibilityProvider } from '@aura/ui-kit';
import App from './App';
import './style.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <App />
    </AccessibilityProvider>
  </React.StrictMode>,
);
