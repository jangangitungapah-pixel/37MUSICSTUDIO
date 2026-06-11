import { useEffect, useState } from 'react';
import { AdminPage } from './pages/AdminPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ThemeContainer } from './theme/ThemeContainer.jsx';
import { ThemePreview } from './theme/ThemePreview.jsx';

function getCurrentPathname() {
  if (typeof window === 'undefined') {
    return '/';
  }

  return window.location.pathname || '/';
}

function resolvePage(pathname) {
  if (pathname === '/admin') {
    return <AdminPage />;
  }

  if (pathname === '/login') {
    return <LoginPage />;
  }

  return <ThemePreview />;
}

function App() {
  const [pathname, setPathname] = useState(getCurrentPathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(getCurrentPathname());
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const page = resolvePage(pathname);

  return (
    <ThemeContainer currentPath={pathname}>
      {page}
    </ThemeContainer>
  );
}

export default App;
