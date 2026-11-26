import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import PublicLayout from '../layouts/PublicLayout';
import Home from '../pages/public/Home';
import Gallery from '../pages/public/Gallery';
import { Categories, CategoryDetail } from '../pages/public/Categories';
import TemplateDetail from '../pages/public/TemplateDetail';
import Info from '../pages/public/Info';
import NotFound from '../pages/public/NotFound';
import Demo from '../pages/recipient/Demo';
import Account from '../pages/auth/Account';
import Settings from '../pages/auth/Settings';
import Dashboard from '../pages/dashboard/Dashboard';

const CreateDraft = lazy(() => import('../pages/dashboard/EditorRoutes').then(module => ({ default: module.CreateDraft })));
const OpenEditor = lazy(() => import('../pages/dashboard/EditorRoutes').then(module => ({ default: module.OpenEditor })));
const PublishedMessage = lazy(() => import('../pages/recipient/PublishedMessage'));

export default function AppRoutes() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === '/') document.title = 'FeelCraft — Every feeling deserves a beautiful expression.';
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Suspense fallback={<main className="shell interior" role="status">Loading workspace…</main>}><Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="templates" element={<Gallery />} />
        <Route path="templates/:slug" element={<TemplateDetail />} />
        <Route path="categories" element={<Categories />} />
        <Route path="categories/:slug" element={<CategoryDetail />} />
        <Route path="create" element={<Gallery creating />} />
        <Route path="how-it-works" element={<Info section="workflow" />} />
        <Route path="about" element={<Info section="about" />} />
        <Route path="pricing" element={<Info section="pricing" />} />
        <Route path="privacy" element={<Info section="privacy" />} />
        <Route path="login" element={<Account key="login" />} />
        <Route path="register" element={<Account key="register" registering />} />
        <Route path="account/settings" element={<Settings />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="demo/:slug" element={<Demo />} />
      <Route path="m/:token" element={<PublishedMessage />} />
      <Route path="m/*" element={<PublishedMessage />} />
      <Route path="published-preview/:id" element={<PublishedMessage owner />} />
      <Route path="editor/new" element={<CreateDraft />} />
      <Route path="editor/local/:id" element={<OpenEditor local />} />
      <Route path="editor/:id" element={<OpenEditor />} />
    </Routes></Suspense>
  );
}
