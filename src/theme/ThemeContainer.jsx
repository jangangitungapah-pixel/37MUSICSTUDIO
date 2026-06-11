import { LockKeyhole, Moon, Sparkles, Sun } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { useTheme } from './ThemeProvider.jsx';

const themeSwitchStates = {
  dark: {
    ariaLabel: 'Switch to light mode',
    checked: true,
    knobClass: 'translate-x-8',
    knobIcon: Moon,
    trackHintClass: 'bg-studio-cyan/16',
  },
  light: {
    ariaLabel: 'Switch to dark mode',
    checked: false,
    knobClass: 'translate-x-0',
    knobIcon: Sun,
    trackHintClass: 'bg-studio-accent/14',
  },
};

export function ThemeContainer({ children, currentPath = '/' }) {
  const { mode, density, toggleMode, toggleDensity } = useTheme();

  const isCompact = density === 'compact';
  const themeSwitch = themeSwitchStates[mode] || themeSwitchStates.dark;
  const ThemeSwitchIcon = themeSwitch.knobIcon;
  const isLoginPage = currentPath === '/login';
  const isAdminPage = currentPath === '/admin';

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

      {!isAdminPage ? (
        <header
          className={cn(
            'mx-auto flex w-[min(1180px,calc(100vw-32px))] items-center justify-between gap-4',
            'max-[820px]:relative max-[820px]:flex-col max-[820px]:items-stretch',
            isCompact ? 'my-3 min-h-16 py-3' : 'my-4 min-h-[76px] py-4',
          )}
        >
        <a className="flex min-w-0 items-center gap-3" href="/" aria-label="37 Music Studio Home">
          <span className="grid size-11 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] text-sm font-semibold tracking-[-0.04em] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
            37
          </span>

          <span className="grid min-w-0 gap-0.5">
            <strong className="text-[0.96rem] font-semibold tracking-[-0.025em] text-[var(--ui-text-strong)]">
              37 Music Studio
            </strong>

            <small className="text-xs font-medium text-[var(--ui-text-muted)]">
              Tailwind rebuild system
            </small>
          </span>
        </a>

        <nav
          className="flex items-center justify-end gap-2 max-[820px]:justify-stretch max-[520px]:flex-row"
          aria-label="Theme controls"
        >
          <a
            aria-label="Open login page"
            aria-current={isLoginPage ? 'page' : undefined}
            className={cn(
              'inline-grid size-10 shrink-0 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
              isLoginPage && 'border-studio-accent/45 text-studio-accent',
            )}
            href="/login"
            title="Open login page"
          >
            <LockKeyhole size={17} strokeWidth={2.35} aria-hidden="true" />
          </a>

          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25 max-[820px]:flex-1 max-[520px]:flex-none"
            type="button"
            onClick={toggleDensity}
          >
            Density: {density}
          </button>

          <button
            aria-checked={themeSwitch.checked}
            aria-label={themeSwitch.ariaLabel}
            className="group relative inline-flex h-10 w-[76px] shrink-0 items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] p-1 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
            role="switch"
            title={themeSwitch.ariaLabel}
            type="button"
            onClick={toggleMode}
          >
            <span className="sr-only">{themeSwitch.ariaLabel}</span>

            <span className="absolute left-2 grid size-6 place-items-center text-[var(--ui-text-soft)] transition group-hover:text-studio-accent">
              <Sun size={14} aria-hidden="true" />
            </span>

            <span className="absolute right-2 grid size-6 place-items-center text-[var(--ui-text-soft)] transition group-hover:text-studio-cyan">
              <Moon size={14} aria-hidden="true" />
            </span>

            <span
              className={cn(
                'relative z-10 grid size-8 place-items-center rounded-full [background:var(--ui-primary-bg)] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition-transform duration-300 ease-out',
                themeSwitch.knobClass,
              )}
              aria-hidden="true"
            >
              <ThemeSwitchIcon size={16} strokeWidth={2.35} />
            </span>

            <span
              className={cn(
                'pointer-events-none absolute inset-1 rounded-full blur-md transition-opacity duration-300',
                themeSwitch.trackHintClass,
              )}
              aria-hidden="true"
            />
          </button>
        </nav>
        </header>
      ) : null}

      <main
        className={cn(
          'mx-auto grid',
          isAdminPage ? 'w-[min(1760px,calc(100vw-20px))]' : 'w-[min(1180px,calc(100vw-32px))]',
          isAdminPage
            ? 'gap-4 py-3 sm:py-4'
            : isCompact
              ? 'gap-8 py-4'
              : 'gap-10 py-8 sm:py-12',
        )}
      >
        <section className={cn('grid', isAdminPage ? 'gap-4' : 'gap-8')}>
          {!isAdminPage ? (
            <div className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-[var(--ui-text-muted)]">
              <Sparkles size={14} className="text-studio-accent" aria-hidden="true" />
              <span>Tailwind Container Theme v1.1</span>
            </div>
          ) : null}

          {children}
        </section>
      </main>
    </div>
  );
}
