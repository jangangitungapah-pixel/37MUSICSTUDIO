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
          'pointer-events-none fixed -left-32 -top-36 -z-10 size-[360px] rounded-full blur-2xl',
          'bg-studio-accent/20 dark:bg-studio-accent/35',
        )}
      />
      <div
        className={cn(
          'pointer-events-none fixed -right-32 bottom-[12vh] -z-10 size-[360px] rounded-full blur-2xl',
          'bg-studio-cyan/15 dark:bg-studio-cyan/25',
        )}
      />

      <header
        className={cn(
          'mx-auto flex w-[min(1180px,calc(100vw-32px))] items-center justify-between gap-4',
          'max-[820px]:relative max-[820px]:flex-col max-[820px]:items-stretch',
          isCompact ? 'min-h-16 py-3' : 'min-h-[76px] py-4',
        )}
      >
        <a className="flex min-w-0 items-center gap-3" href="/" aria-label="37 Music Studio Home">
          <span
            className={cn(
              'grid size-12 place-items-center rounded-[18px]',
              'border border-studio-accent/30 bg-studio-accent/10',
              'font-black tracking-[-0.08em] text-studio-950 shadow-studio-card',
              'dark:text-white',
            )}
          >
            37
          </span>

          <span className="grid min-w-0 gap-0.5">
            <strong className="text-[0.98rem] font-extrabold tracking-[-0.03em] text-studio-950 dark:text-white">
              37 Music Studio
            </strong>
            <small className="text-xs font-medium text-studio-500 dark:text-studio-400">
              Tailwind rebuild system
            </small>
          </span>
        </a>

        <nav
          className="flex items-center justify-end gap-2 max-[820px]:justify-stretch max-[520px]:flex-col"
          aria-label="Theme controls"
        >
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-studio-950/10 px-4 text-sm font-extrabold text-studio-600 transition hover:-translate-y-0.5 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 dark:border-white/10 dark:text-studio-300 dark:hover:bg-white/10 max-[820px]:flex-1 max-[520px]:w-full"
            type="button"
            onClick={toggleDensity}
          >
            Density: {density}
          </button>

          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-studio-accent/30 bg-gradient-to-br from-studio-accent to-studio-purple px-5 text-sm font-extrabold text-white shadow-studio-glow transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 max-[820px]:flex-1 max-[520px]:w-full"
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
          isCompact ? 'gap-6 py-6' : 'gap-8 py-10 sm:py-14',
        )}
      >
        <section className="grid gap-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-studio-950/10 bg-white/50 px-3 py-2 text-sm font-semibold text-studio-600 dark:border-white/10 dark:bg-white/[0.045] dark:text-studio-300">
            <Sparkles size={16} aria-hidden="true" />
            <span>Tailwind Container Theme v0.2</span>
          </div>

          {children}
        </section>
      </main>
    </div>
  );
}
