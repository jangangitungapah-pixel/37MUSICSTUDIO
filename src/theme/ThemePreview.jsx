const previewCards = [
  {
    title: 'Utility-first Surface',
    text: 'Panel, card, border, radius, shadow, dan spacing sekarang dibangun langsung dari class Tailwind.',
  },
  {
    title: 'Responsive Container',
    text: 'Lebar halaman pakai utility class dan arbitrary value supaya desktop lega, mobile tetap aman.',
  },
  {
    title: 'Theme Variants',
    text: 'Dark mode dan density mode tetap hidup, tapi styling-nya tidak lagi bergantung pada CSS custom besar.',
  },
];

export function ThemePreview() {
  return (
    <div className="grid gap-8">
      <section className="grid gap-5 rounded-[32px] border border-studio-950/10 bg-white/70 p-7 shadow-studio-card backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.065] sm:p-10 lg:p-16">
        <p className="m-0 text-xs font-black uppercase tracking-[0.16em] text-studio-accent">
          Studio Ops Interface
        </p>

        <h1 className="m-0 max-w-[840px] text-[clamp(2.35rem,7vw,5.75rem)] font-black leading-[0.92] tracking-[-0.09em] text-studio-950 dark:text-white">
          Tailwind jadi tulang punggung UI.
        </h1>

        <p className="m-0 max-w-[720px] text-base leading-8 text-studio-600 dark:text-studio-300 sm:text-lg">
          Mulai dari sini, container, surface, button, panel, form, spacing, dan responsive
          behavior akan kita bangun Tailwind-first. CSS custom cuma dipakai untuk token global
          yang memang layak jadi fondasi.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-studio-accent/30 bg-gradient-to-br from-studio-accent to-studio-purple px-5 font-extrabold text-white shadow-studio-glow transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 sm:flex-none"
            type="button"
          >
            Primary Action
          </button>

          <button
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-studio-950/10 bg-white/65 px-5 font-extrabold text-studio-800 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.11] sm:flex-none"
            type="button"
          >
            Secondary Action
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Theme preview cards">
        {previewCards.map((card) => (
          <article
            className="grid gap-3 rounded-3xl border border-studio-950/10 bg-white/70 p-6 shadow-studio-card dark:border-white/10 dark:bg-white/[0.065]"
            key={card.title}
          >
            <span className="text-xs font-black uppercase tracking-[0.14em] text-studio-accent">
              Foundation
            </span>
            <h2 className="m-0 text-xl font-black tracking-[-0.045em] text-studio-950 dark:text-white">
              {card.title}
            </h2>
            <p className="m-0 leading-7 text-studio-600 dark:text-studio-300">
              {card.text}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 rounded-3xl border border-studio-950/10 bg-white/70 p-6 shadow-studio-card dark:border-white/10 dark:bg-white/[0.065] lg:grid-cols-[0.9fr_1fr]">
        <div className="grid gap-3">
          <p className="m-0 text-xs font-black uppercase tracking-[0.16em] text-studio-accent">
            Form Surface
          </p>
          <h2 className="m-0 text-2xl font-black tracking-[-0.05em] text-studio-950 dark:text-white">
            Input dan panel Tailwind
          </h2>
          <p className="m-0 leading-7 text-studio-600 dark:text-studio-300">
            Ini preview komponen dasar. Nanti kita pecah menjadi component library kecil:
            Button, Card, Input, Select, Badge, PageHeader, dan AppShell.
          </p>
        </div>

        <form className="flex flex-wrap gap-3">
          <label className="grid flex-1 basis-56 gap-2 text-sm font-bold text-studio-600 dark:text-studio-300">
            <span>Nama project</span>
            <input
              className="min-h-12 w-full rounded-2xl border border-studio-950/10 bg-white px-4 font-semibold text-studio-950 outline-none transition focus:border-studio-accent/40 focus:ring-4 focus:ring-studio-accent/15 dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
              value="37 Music Studio"
              readOnly
            />
          </label>

          <label className="grid flex-1 basis-56 gap-2 text-sm font-bold text-studio-600 dark:text-studio-300">
            <span>Status</span>
            <select
              className="min-h-12 w-full rounded-2xl border border-studio-950/10 bg-white px-4 font-semibold text-studio-950 outline-none transition focus:border-studio-accent/40 focus:ring-4 focus:ring-studio-accent/15 dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
              defaultValue="tailwind"
            >
              <option value="tailwind">Tailwind Ready</option>
              <option value="design">Design Phase</option>
              <option value="feature">Feature Phase</option>
            </select>
          </label>
        </form>
      </section>
    </div>
  );
}
