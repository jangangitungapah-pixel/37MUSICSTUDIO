import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { getPortalPathForProfile } from '../lib/roles';

const PortalLoader = () => (
  <div className="client-portal-loader">
    <div className="client-loader-card">
      <div className="client-loader-logo">37</div>
      <Loader2 className="spinner" size={24} />
      <span>Mengarahkan portal...</span>
    </div>
  </div>
);

const PortalResolver = () => {
  const { user, userProfile, isAuthLoaded } = useAuthStore();

  if (!isAuthLoaded) {
    return <PortalLoader />;
  }

  if (!user || user.isAnonymous) {
    return <Navigate to="/client" replace />;
  }

  return <Navigate to={getPortalPathForProfile(userProfile, '/client')} replace />;
};

export default PortalResolver;
