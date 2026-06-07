import { Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import { useAuthStore } from '../store/useAuthStore';
import './ClientPortal.css';

const ClientEntryPage = () => {
  const { user, isAuthLoaded } = useAuthStore();

  if (!isAuthLoaded) {
    return (
      <div className="client-portal-loader">
        <div className="client-loader-card">
          <div className="client-loader-logo">37</div>
          <span>Menyiapkan Client Portal...</span>
        </div>
      </div>
    );
  }

  if (user && !user.isAnonymous) {
    return <Navigate to="/client/dashboard" replace />;
  }

  return <LandingPage />;
};

export default ClientEntryPage;
