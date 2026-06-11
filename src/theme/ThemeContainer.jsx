import { Sparkles } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { useTheme } from './ThemeProvider.jsx';

export function ThemeContainer({ children }) {
  const { mode, density, toggleMode, toggleDensity } = useTheme();

  const isCompact = density === 'compact';

  return (
    <div
      className={cn(
        'relative isolate min-h-screen overflow-x-clip',
        'bg-studio-paper text-studio-900 dark:bg-studio-night dark:text-studio-100',
        'transition-colors duration-300',
      )}
    >
      <div
        className={cn(
          'pointer-events-none fixed -left-40 -top-44 -z-10 size-[460px] rounded-full blur-3xl',
          'bg-studio-accent/12 dark:bg-studio-accent/24',
        )}
      />
      <div
        className={cn(
          'pointer-events-none fixed -right-48 bottom-[10vh] -z-10 size-[520px] rounded-full blur-3xl',
          'bg-studio-cyan/10 dark:bg-studio-cyan/18',
        )}
      />

      <header
        className={cn(
          'mx-auto flex w-[min(1180px,calc(100vw-32px))] items-center justify-between gap-4',
          'max-[820px]:relative max-[820px]:flex-col max-[820px]:items-stretch',
          isCompact ? 'min-h-16 py-3' : 'min-h-[76px] py-5',
        )}
      >
        <a className="flex min-w-0 items-center gap-3" href="/" aria-label="37 Music Studio Home">
          <span
            className={cn(
              'grid size-11 place-items-center rounded-2xl',
              'border border-studio-accent/25 bg-studio-accent/8',
              'text-sm font-semibold tracking-[-0.04em] text-studio-950',
              'dark:text-white',
            )}
          >
            37
          </span>

          <span className="grid min-w-0 gap-0.5">
            <strong className="text-[0.96rem] font-semibold tracking-[-0.025em] text-studio-950 dark:text-white">
              37 Music Studio
            </strong>
            <small className="text-xs font-normal text-studio-500 dark:text-studio-400">
              Tailwind rebuild system
            </small>
          </span>
        </a>

        <nav
          className="flex items-center justify-end gap-2 max-[820px]:justify-stretch max-[520px]:flex-col"
          aria-label="Theme controls"
        >
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-studio-950/10 px-4 text-sm font-medium text-studio-600 transition hover:-translate-y-0.5 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 dark:border-white/10 dark:text-studio-300 dark:hover:bg-white/10 max-[820px]:flex-1 max-[520px]:w-full"
            type="button"
            onClick={toggleDensity}
          >
            Density: {density}
          </button>

          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-studio-950 shadow-studio-soft transition hover:-translate-y-0.5 hover:bg-studio-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 dark:bg-white dark:text-studio-950 max-[820px]:flex-1 max-[520px]:w-full"
            type="button"
            onClick={toggleMode}
          >
            {mode === 'dark' ? 'Light mode' : 'Dark mode'}
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
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-studio-950/10 bg-white/40 px-3 py-1.5 text-xs font-medium text-studio-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-studio-300">
            <Sparkles size={14} aria-hidden="true" />
            <span>Tailwind Container Theme v0.3</span>
          </div>

          {children}
        </section>
      </main>
    </div>
  );
}
