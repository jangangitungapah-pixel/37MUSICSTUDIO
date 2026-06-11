import { Navigate, Route, Routes, useLocation } from 'react-router';
import { AdminPage } from './pages/AdminPage.jsx';
import { BookingAdmin } from './pages/bookingadmin.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
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
          <Route path="*" element={<Navigate replace to="/admin/bookings" />} />
        </Route>

        <Route path="*" element={<ThemePreview />} />
      </Routes>
    </ThemeContainer>
  );
}

export default App;
