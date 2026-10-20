import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/space-grotesk';
import '@fontsource/press-start-2p';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
