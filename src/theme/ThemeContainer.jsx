import { Sparkles } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { useTheme } from './ThemeProvider.jsx';

const themeToggleLabels = {
  dark: 'Light mode',
  light: 'Dark mode',
};

export function ThemeContainer({ children }) {
  const { mode, density, toggleMode, toggleDensity } = useTheme();

  const isCompact = density === 'compact';
  const themeToggleLabel = themeToggleLabels[mode] || 'Theme';

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[var(--ui-bg-base)] text-[var(--ui-text-main)] transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 -z-30 bg-[image:var(--ui-bg-page)]" />

      <div className="pointer-events-none fixed inset-0 -z-20 opacity-[var(--ui-grid-opacity)] [background-image:linear-gradient(var(--ui-grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--ui-grid-line-soft)_1px,transparent_1px)] [background-size:76px_76px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-56 bg-gradient-to-b from-[var(--ui-top-fade)] via-transparent to-transparent" />
      <div className="pointer-events-none fixed inset-y-0 left-0 -z-10 w-[42vw] bg-[linear-gradient(90deg,var(--ui-left-wash),transparent)]" />
      <div className="pointer-events-none fixed inset-y-0 right-0 -z-10 w-[46vw] bg-[linear-gradient(270deg,var(--ui-right-wash),transparent)]" />

      <div className="pointer-events-none fixed -left-40 -top-44 -z-10 size-[520px] rounded-full bg-studio-accent/18 blur-3xl" />
      <div className="pointer-events-none fixed -right-48 bottom-[10vh] -z-10 size-[560px] rounded-full bg-studio-cyan/16 blur-3xl" />
      <div className="pointer-events-none fixed left-1/2 top-24 -z-10 size-[360px] -translate-x-1/2 rounded-full bg-studio-purple/10 blur-3xl" />

      <header
        className={cn(
          'mx-auto flex w-[min(1180px,calc(100vw-32px))] items-center justify-between gap-4',
          'max-[820px]:relative max-[820px]:flex-col max-[820px]:items-stretch',
          isCompact ? 'my-3 min-h-16 py-3' : 'my-4 min-h-[76px] py-4',
        )}
      >
        <a className="flex min-w-0 items-center gap-3" href="/" aria-label="37 Music Studio Home">
          <span className="grid size-11 place-items-center rounded-2xl border border-studio-accent/25 bg-[var(--ui-control)] text-sm font-semibold tracking-[-0.04em] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)]">
            37
          </span>

          <span className="grid min-w-0 gap-0.5">
            <strong className="text-[0.96rem] font-semibold tracking-[-0.025em] text-[var(--ui-text-strong)]">
              37 Music Studio
            </strong>

            <small className="text-xs font-normal text-[var(--ui-text-muted)]">
              Tailwind rebuild system
            </small>
          </span>
        </a>

        <nav
          className="flex items-center justify-end gap-2 max-[820px]:justify-stretch max-[520px]:flex-col"
          aria-label="Theme controls"
        >
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-medium text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 max-[820px]:flex-1 max-[520px]:w-full"
            type="button"
            onClick={toggleDensity}
          >
            Density: {density}
          </button>

          <button
            className="inline-flex min-h-10 w-[112px] items-center justify-center rounded-full bg-[image:var(--ui-primary-bg)] px-5 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 max-[820px]:flex-1 max-[520px]:w-full"
            type="button"
            onClick={toggleMode}
          >
            {themeToggleLabel}
          </button>
        </nav>
      </header>

      <main
        className={cn(
          'mx-auto grid w-[min(1180px,calc(100vw-32px))]',
          isCompact ? 'gap-8 py-4' : 'gap-10 py-8 sm:py-12',
        )}
      >
        <section className="grid gap-8">
          <div className="inline-flex w-fit items-center gap-2 text-xs font-medium text-[var(--ui-text-muted)]">
            <Sparkles size={14} className="text-studio-accent" aria-hidden="true" />
            <span>Tailwind Container Theme v0.8</span>
          </div>

          {children}
        </section>
      </main>
    </div>
  );
}
