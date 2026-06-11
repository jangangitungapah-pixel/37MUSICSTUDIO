import { Sparkles } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { useTheme } from './ThemeProvider.jsx';

const lightPageBackground = [
  'bg-[radial-gradient(circle_at_10%_8%,rgba(255,74,155,0.18),transparent_30rem),radial-gradient(circle_at_86%_18%,rgba(69,211,255,0.16),transparent_32rem),linear-gradient(180deg,#fbf8fd_0%,#f1ebf8_46%,#f9f6fc_100%)]',
  'text-studio-900',
].join(' ');

const darkPageBackground = [
  'bg-[radial-gradient(circle_at_10%_8%,rgba(255,74,155,0.18),transparent_28rem),radial-gradient(circle_at_86%_20%,rgba(69,211,255,0.12),transparent_34rem),linear-gradient(180deg,#090a10_0%,#0b0b13_48%,#07080d_100%)]',
  'text-studio-100',
].join(' ');

export function ThemeContainer({ children }) {
  const { mode, density, toggleMode, toggleDensity } = useTheme();

  const isCompact = density === 'compact';
  const isDarkMode = mode === 'dark';

  return (
    <div
      className={cn(
        'relative isolate min-h-screen overflow-x-clip transition-colors duration-300',
        isDarkMode ? darkPageBackground : lightPageBackground,
      )}
    >
      {!isDarkMode && (
        <div className="pointer-events-none fixed inset-0 -z-20 bg-[linear-gradient(120deg,rgba(255,255,255,0.55),transparent_34%,rgba(255,255,255,0.25)_72%,transparent)]" />
      )}

      <div
        className={cn(
          'pointer-events-none fixed -left-40 -top-44 -z-10 size-[520px] rounded-full blur-3xl',
          isDarkMode ? 'bg-studio-accent/20' : 'bg-studio-accent/24',
        )}
      />

      <div
        className={cn(
          'pointer-events-none fixed -right-48 bottom-[10vh] -z-10 size-[560px] rounded-full blur-3xl',
          isDarkMode ? 'bg-studio-cyan/14' : 'bg-studio-cyan/20',
        )}
      />

      {isDarkMode && (
        <div className="pointer-events-none fixed left-1/2 top-24 -z-10 size-[360px] -translate-x-1/2 rounded-full bg-studio-purple/10 blur-3xl" />
      )}

      <header
        className={cn(
          'mx-auto flex w-[min(1180px,calc(100vw-32px))] items-center justify-between gap-4',
          isDarkMode
            ? 'px-0 shadow-none'
            : 'border border-white/70 bg-white/58 px-4 shadow-[0_18px_60px_rgba(65,45,86,0.10)] backdrop-blur-2xl',
          'max-[820px]:relative max-[820px]:flex-col max-[820px]:items-stretch',
          isCompact ? 'my-3 min-h-16 rounded-[26px] py-3' : 'my-4 min-h-[76px] rounded-[30px] py-4',
        )}
      >
        <a className="flex min-w-0 items-center gap-3" href="/" aria-label="37 Music Studio Home">
          <span
            className={cn(
              'grid size-11 place-items-center rounded-2xl border border-studio-accent/25',
              'text-sm font-semibold tracking-[-0.04em]',
              isDarkMode
                ? 'bg-studio-accent/8 text-white'
                : 'bg-white/70 text-studio-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_14px_34px_rgba(255,74,155,0.12)]',
            )}
          >
            37
          </span>

          <span className="grid min-w-0 gap-0.5">
            <strong
              className={cn(
                'text-[0.96rem] font-semibold tracking-[-0.025em]',
                isDarkMode ? 'text-white' : 'text-studio-950',
              )}
            >
              37 Music Studio
            </strong>

            <small
              className={cn(
                'text-xs font-normal',
                isDarkMode ? 'text-studio-400' : 'text-studio-500',
              )}
            >
              Tailwind rebuild system
            </small>
          </span>
        </a>

        <nav
          className="flex items-center justify-end gap-2 max-[820px]:justify-stretch max-[520px]:flex-col"
          aria-label="Theme controls"
        >
          <button
            className={cn(
              'inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 max-[820px]:flex-1 max-[520px]:w-full',
              isDarkMode
                ? 'border border-white/10 text-studio-300 hover:bg-white/10'
                : 'border border-studio-950/10 bg-white/50 text-studio-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] hover:border-studio-accent/25 hover:bg-white/80',
            )}
            type="button"
            onClick={toggleDensity}
          >
            Density: {density}
          </button>

          <button
            className={cn(
              'inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-[0_18px_44px_rgba(23,20,29,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(23,20,29,0.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 max-[820px]:flex-1 max-[520px]:w-full',
              isDarkMode
                ? 'bg-white text-studio-950'
                : 'bg-gradient-to-br from-studio-950 to-studio-700 text-white',
            )}
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
          <div
            className={cn(
              'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-xl',
              isDarkMode
                ? 'border-white/10 bg-white/[0.035] text-studio-300'
                : 'border-white/70 bg-white/58 text-studio-600 shadow-[0_12px_34px_rgba(65,45,86,0.08)]',
            )}
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>Tailwind Container Theme v0.5</span>
          </div>

          {children}
        </section>
      </main>
    </div>
  );
}
