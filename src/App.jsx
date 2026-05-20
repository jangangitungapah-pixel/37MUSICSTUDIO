import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import Sidebar from './components/Sidebar';
import TourGuide from './components/TourGuide';
import NotificationToast from './components/NotificationToast';
import PageTransition from './components/PageTransition';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import './index.css';
import './pages/CalendarPage.css'; // Shared global utilities and grid styles
import './components/BookingForm.css'; // Shared global form styles (.form-group, .form-input)

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PublicCalendarPage from './pages/PublicCalendarPage';

// Lazy load pages for code splitting to reduce chunk size
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

const PageLoader = () => (
  <div style={{height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <Loader2 className="spinner" size={32} color="var(--accent-pink)"/>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    // Suspense with null fallback: no spinner flash between lazy-loaded pages.
    // The key on Routes causes React to remount the page component on navigation,
    // which triggers PageTransition's initial→animate enter animation.
    <Suspense fallback={null}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><DashboardPage /></PageTransition>} />
        <Route path="/calendar" element={<PageTransition><CalendarPage /></PageTransition>} />
        <Route path="/customers" element={<PageTransition><CustomersPage /></PageTransition>} />
        <Route path="/inventory" element={<PageTransition><InventoryPage /></PageTransition>} />
        <Route path="/billing" element={<PageTransition><BillingPage /></PageTransition>} />
        <Route path="/finance" element={<PageTransition><FinancePage /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, isAuthLoaded } = useAuthStore();
  
  if (!isAuthLoaded) {
    return <div style={{height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)'}}><Loader2 className="spinner" size={32} color="var(--accent-pink)"/></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Prevent anonymous users from accessing admin routes
  if (user.isAnonymous) {
    return <Navigate to="/jadwal-publik" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <TourGuide />
      <NotificationToast />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <Toaster
        theme={theme}
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            background: 'rgba(22, 22, 28, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#ffffff',
            fontFamily: 'Outfit, sans-serif',
          },
        }}
      />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/jadwal-publik" element={<PublicCalendarPage />} />
          
          {/* Protected Routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AnimatedRoutes />
            </ProtectedRoute>
          } />
        </Routes>
    </Router>
  );
}

export default App;
