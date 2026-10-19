import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../design-system/phantom.css';
import Catalogue from './docs/Catalogue';
import Landing from './site/Landing';

// Hash routes, as on Signal: #/ is the landing page, #/system is the design system catalogue.
function useRoute() {
  const read = () => (window.location.hash.startsWith('#/system') ? 'system' : 'landing');
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onHash = () => {
      // in-page anchors (#how) keep the current route; only #/ paths change it
      if (!window.location.hash.startsWith('#/') && window.location.hash !== '') return;
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

function App() {
  const route = useRoute();
  return route === 'system' ? <Catalogue /> : <Landing />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
