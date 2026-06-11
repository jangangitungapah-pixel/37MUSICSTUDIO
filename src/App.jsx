import { useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage.jsx';
import { ThemeContainer } from './theme/ThemeContainer.jsx';
import { ThemePreview } from './theme/ThemePreview.jsx';

function getCurrentPathname() {
  if (typeof window === 'undefined') {
    return '/';
  }

  return window.location.pathname || '/';
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

  const page = pathname === '/login' ? <LoginPage /> : <ThemePreview />;

  return (
    <ThemeContainer currentPath={pathname}>
      {page}
    </ThemeContainer>
  );
}

export default App;
