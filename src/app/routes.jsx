import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import FullPageLoader from './FullPageLoader';
import PublicLayout from '../layouts/public/PublicLayout';

const AdminShell = lazy(() => import('../layouts/admin/AdminShell'));
const PublicCalendarPage = lazy(() => import('../pages/PublicCalendarPage'));
const PublicGalleryPage = lazy(() => import('../pages/PublicGalleryPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));

const lazyElement = (Component) => (
  <Suspense fallback={<FullPageLoader />}>
    <Component />
  </Suspense>
);

const AppRoutes = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={lazyElement(RegisterPage)} />
      <Route path="/jadwal-publik" element={lazyElement(PublicCalendarPage)} />
      <Route path="/galeri" element={lazyElement(PublicGalleryPage)} />
    </Route>
    <Route path="/*" element={lazyElement(AdminShell)} />
  </Routes>
);

export default AppRoutes;
