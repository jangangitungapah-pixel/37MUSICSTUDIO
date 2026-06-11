import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getSafeDensityMode,
  getSafeThemeMode,
} from './themeTokens.js';

const STORAGE_KEY = 'thirty-seven-theme-preferences';

const ThemeContext = createContext(null);

function readStoredPreferences() {
  if (typeof window === 'undefined') {
    return {
      mode: 'dark',
      density: 'comfortable',
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;

      return {
        mode: prefersLight ? 'light' : 'dark',
        density: 'comfortable',
      };
    }

    const parsed = JSON.parse(raw);

    return {
      mode: getSafeThemeMode(parsed.mode),
      density: getSafeDensityMode(parsed.density),
    };
  } catch {
    return {
      mode: 'dark',
      density: 'comfortable',
    };
  }
}

export function ThemeProvider({ children }) {
  const [preferences, setPreferences] = useState(readStoredPreferences);

  const value = useMemo(() => {
    const setMode = (mode) => {
      setPreferences((current) => ({
        ...current,
        mode: getSafeThemeMode(mode, current.mode),
      }));
    };

    const setDensity = (density) => {
      setPreferences((current) => ({
        ...current,
        density: getSafeDensityMode(density, current.density),
      }));
    };

    const toggleMode = () => {
      setPreferences((current) => ({
        ...current,
        mode: current.mode === 'dark' ? 'light' : 'dark',
      }));
    };

    const toggleDensity = () => {
      setPreferences((current) => ({
        ...current,
        density: current.density === 'comfortable' ? 'compact' : 'comfortable',
      }));
    };

    return {
      mode: preferences.mode,
      density: preferences.density,
      setMode,
      setDensity,
      toggleMode,
      toggleDensity,
    };
  }, [preferences]);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.mode;
    document.documentElement.dataset.density = preferences.density;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }

  return context;
}
