import { Sparkles } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { useTheme } from './ThemeProvider.jsx';

export function ThemeContainer({ children }) {
  const { mode, density, toggleMode, toggleDensity } = useTheme();

  const isCompact = density === 'compact';

  return (
    <div
      className={cn(
        'relative isolate min-h-screen overflow-x-clip text-studio-900 transition-colors duration-300',
        'bg-[radial-gradient(circle_at_10%_8%,rgba(255,74,155,0.18),transparent_30rem),radial-gradient(circle_at_86%_18%,rgba(69,211,255,0.16),transparent_32rem),linear-gradient(180deg,#fbf8fd_0%,#f1ebf8_46%,#f9f6fc_100%)]',
        'dark:bg-[radial-gradient(circle_at_10%_8%,rgba(255,74,155,0.22),transparent_30rem),radial-gradient(circle_at_86%_20%,rgba(69,211,255,0.16),transparent_34rem),#090a10] dark:text-studio-100',
      )}
    >
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[linear-gradient(120deg,rgba(255,255,255,0.55),transparent_34%,rgba(255,255,255,0.25)_72%,transparent)] dark:hidden" />

      <div
        className={cn(
          'pointer-events-none fixed -left-40 -top-44 -z-10 size-[520px] rounded-full blur-3xl',
          'bg-studio-accent/24 dark:bg-studio-accent/24',
        )}
      />
      <div
        className={cn(
          'pointer-events-none fixed -right-48 bottom-[10vh] -z-10 size-[560px] rounded-full blur-3xl',
          'bg-studio-cyan/20 dark:bg-studio-cyan/18',
        )}
      />
      <div className="pointer-events-none fixed left-1/2 top-24 -z-10 hidden size-[360px] -translate-x-1/2 rounded-full bg-studio-purple/10 blur-3xl dark:block" />

      <header
        className={cn(
          'mx-auto flex w-[min(1180px,calc(100vw-32px))] items-center justify-between gap-4',
          'border border-white/70 bg-white/58 px-4 shadow-[0_18px_60px_rgba(65,45,86,0.10)] backdrop-blur-2xl',
          'dark:border-transparent dark:bg-transparent dark:px-0 dark:shadow-none dark:backdrop-blur-none',
          'max-[820px]:relative max-[820px]:flex-col max-[820px]:items-stretch',
          isCompact ? 'my-3 min-h-16 rounded-[26px] py-3' : 'my-4 min-h-[76px] rounded-[30px] py-4',
        )}
      >
        <a className="flex min-w-0 items-center gap-3" href="/" aria-label="37 Music Studio Home">
          <span
            className={cn(
              'grid size-11 place-items-center rounded-2xl',
              'border border-studio-accent/25 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_14px_34px_rgba(255,74,155,0.12)]',
              'text-sm font-semibold tracking-[-0.04em] text-studio-950',
              'dark:bg-studio-accent/8 dark:text-white dark:shadow-none',
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
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-studio-950/10 bg-white/50 px-4 text-sm font-medium text-studio-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:-translate-y-0.5 hover:border-studio-accent/25 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 dark:border-white/10 dark:bg-transparent dark:text-studio-300 dark:shadow-none dark:hover:bg-white/10 max-[820px]:flex-1 max-[520px]:w-full"
            type="button"
            onClick={toggleDensity}
          >
            Density: {density}
          </button>

          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-gradient-to-br from-studio-950 to-studio-700 px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(23,20,29,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(23,20,29,0.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 dark:bg-white dark:bg-none dark:text-studio-950 max-[820px]:flex-1 max-[520px]:w-full"
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
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/58 px-3 py-1.5 text-xs font-medium text-studio-600 shadow-[0_12px_34px_rgba(65,45,86,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] dark:text-studio-300 dark:shadow-none">
            <Sparkles size={14} aria-hidden="true" />
            <span>Tailwind Container Theme v0.4</span>
          </div>

          {children}
        </section>
      </main>
    </div>
  );
}
