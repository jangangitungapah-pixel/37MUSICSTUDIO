import { Sparkles } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { useTheme } from './ThemeProvider.jsx';

const lightPageBackground = [
  'bg-[#f7f1fb]',
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
        <>
          <div className="pointer-events-none fixed inset-0 -z-30 bg-[linear-gradient(180deg,#fff9fd_0%,#f3ecfb_38%,#eaf8ff_72%,#fff9fb_100%)]" />
          <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_8%_8%,rgba(255,74,155,0.34),transparent_24rem),radial-gradient(circle_at_88%_26%,rgba(69,211,255,0.28),transparent_30rem),radial-gradient(circle_at_54%_7%,rgba(154,118,255,0.16),transparent_26rem)]" />
          <div className="pointer-events-none fixed inset-0 -z-20 opacity-[0.34] [background-image:linear-gradient(rgba(23,20,29,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(23,20,29,0.045)_1px,transparent_1px)] [background-size:76px_76px]" />
          <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-56 bg-gradient-to-b from-white/80 via-white/30 to-transparent" />
          <div className="pointer-events-none fixed inset-y-0 left-0 -z-10 w-[42vw] bg-[linear-gradient(90deg,rgba(255,74,155,0.16),transparent)]" />
          <div className="pointer-events-none fixed inset-y-0 right-0 -z-10 w-[46vw] bg-[linear-gradient(270deg,rgba(69,211,255,0.18),transparent)]" />
        </>
      )}

      <div
        className={cn(
          'pointer-events-none fixed -left-40 -top-44 -z-10 size-[520px] rounded-full blur-3xl',
          isDarkMode ? 'bg-studio-accent/20' : 'bg-studio-accent/18',
        )}
      />

      <div
        className={cn(
          'pointer-events-none fixed -right-48 bottom-[10vh] -z-10 size-[560px] rounded-full blur-3xl',
          isDarkMode ? 'bg-studio-cyan/14' : 'bg-studio-cyan/16',
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
            : 'border border-white/80 bg-white/68 px-4 shadow-[0_18px_70px_rgba(73,48,94,0.13)] ring-1 ring-studio-950/[0.035] backdrop-blur-2xl',
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
                : 'bg-white/80 text-studio-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_42px_rgba(255,74,155,0.16)]',
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
                isDarkMode ? 'text-studio-400' : 'text-studio-600',
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
                : 'border border-studio-950/10 bg-white/62 text-studio-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_10px_28px_rgba(73,48,94,0.08)] hover:border-studio-accent/25 hover:bg-white/90',
            )}
            type="button"
            onClick={toggleDensity}
          >
            Density: {density}
          </button>

          <button
            className={cn(
              'inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 max-[820px]:flex-1 max-[520px]:w-full',
              isDarkMode
                ? 'bg-white text-studio-950 shadow-[0_18px_44px_rgba(23,20,29,0.18)] hover:shadow-[0_22px_52px_rgba(23,20,29,0.22)]'
                : 'bg-gradient-to-br from-studio-950 to-studio-700 text-white shadow-[0_20px_54px_rgba(23,20,29,0.20)] hover:shadow-[0_24px_64px_rgba(23,20,29,0.26)]',
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
                : 'border-white/80 bg-white/68 text-studio-700 shadow-[0_14px_38px_rgba(73,48,94,0.10)] ring-1 ring-studio-950/[0.035]',
            )}
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>Tailwind Container Theme v0.6</span>
          </div>

          {children}
        </section>
      </main>
    </div>
  );
}
