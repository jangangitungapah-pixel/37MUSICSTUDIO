import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Sidebar from './components/Sidebar';
import TourGuide from './components/TourGuide';
import NotificationToast from './components/NotificationToast';
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
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/jadwal-publik" element={<PublicCalendarPage />} />
          
          {/* Protected Routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
