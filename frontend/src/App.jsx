import { BrowserRouter, useLocation } from 'react-router';
import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { CatalogProvider } from './context/Catalog';
import { refreshSession } from './store/auth';

function CreatorRoutes() {
  useEffect(() => { refreshSession(); }, []);
  return <CatalogProvider><AppRoutes /></CatalogProvider>;
}

function SiteRoutes() {
  const { pathname } = useLocation();
  return /^\/m(?:\/|$)/i.test(pathname) ? <AppRoutes /> : <CreatorRoutes />;
}

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user"><SiteRoutes /></MotionConfig>
    </BrowserRouter>
  );
}
