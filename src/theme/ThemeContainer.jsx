import { Sparkles } from 'lucide-react';
import { useTheme } from './ThemeProvider.jsx';

export function ThemeContainer({ children }) {
  const { mode, density, toggleMode, toggleDensity } = useTheme();

  return (
    <div className="theme-root">
      <div className="theme-orb theme-orb-primary" />
      <div className="theme-orb theme-orb-secondary" />

      <header className="theme-topbar">
        <a className="brand-mark" href="/" aria-label="37 Music Studio Home">
          <span className="brand-symbol">37</span>
          <span className="brand-copy">
            <strong>37 Music Studio</strong>
            <small>Fresh rebuild system</small>
          </span>
        </a>

        <nav className="theme-actions" aria-label="Theme controls">
          <button className="ui-button ui-button-ghost" type="button" onClick={toggleDensity}>
            Density: {density}
          </button>
          <button className="ui-button ui-button-primary" type="button" onClick={toggleMode}>
            {mode === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </nav>
      </header>

      <main className="theme-main">
        <section className="theme-stage">
          <div className="theme-stage-badge">
            <Sparkles size={16} aria-hidden="true" />
            <span>Container Theme v0.1</span>
          </div>

          {children}
        </section>
      </main>
    </div>
  );
}
