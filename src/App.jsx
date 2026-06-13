import { Navigate, Route, Routes, useLocation } from 'react-router';
import { AdminPage } from './pages/AdminPage.jsx';
import { AuditAdmin } from './pages/auditadmin.jsx';
import { BillingAdmin } from './pages/billingadmin.jsx';
import { BookkeepingAdmin } from './pages/bookkeepingadmin.jsx';
import { BookingAdmin } from './pages/bookingadmin.jsx';
import { CustomerAdmin, CustomerDetailAdmin } from './pages/customeradmin.jsx';
import { InventoryAdmin } from './pages/inventoryadmin.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SettingsAdmin } from './pages/settingsadmin.jsx';
import { ThemeContainer } from './theme/ThemeContainer.jsx';
import { ThemePreview } from './theme/ThemePreview.jsx';

function App() {
  const location = useLocation();

  return (
    <ThemeContainer currentPath={location.pathname}>
      <Routes>
        <Route path="/" element={<ThemePreview />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<Navigate replace to="bookings" />} />
          <Route path="bookings" element={<BookingAdmin />} />
          <Route path="billing" element={<BillingAdmin />} />
          <Route path="bookkeeping" element={<BookkeepingAdmin />} />
          <Route path="customers" element={<CustomerAdmin />} />
          <Route path="customers/:customerId" element={<CustomerDetailAdmin />} />
          <Route path="inventory" element={<InventoryAdmin />} />
          <Route path="audit" element={<AuditAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="*" element={<Navigate replace to="/admin/bookings" />} />
        </Route>

        <Route path="*" element={<ThemePreview />} />
      </Routes>
    </ThemeContainer>
  );
}

export default App;
