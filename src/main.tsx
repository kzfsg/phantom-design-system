import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../design-system/phantom.css';
import Catalogue from './docs/Catalogue';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Catalogue />
  </StrictMode>,
);
