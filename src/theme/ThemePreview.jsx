import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const foundationNotes = [
  {
    label: 'Layout',
    title: 'Cardless first',
    text: 'Hero dan halaman utama dibuat lega tanpa kotak besar. Card hanya muncul untuk data yang memang butuh wadah.',
  },
  {
    label: 'System',
    title: 'Tailwind tokens',
    text: 'Warna, shadow, spacing, radius, dan dark mode tetap konsisten lewat token Tailwind.',
  },
  {
    label: 'Motion',
    title: 'Calm interface',
    text: 'Visual dibuat modern, ringan, dan tidak terlalu berat supaya enak dipakai harian.',
  },
];

const statusOptions = [
  {
    value: 'cardless',
    label: 'Cardless Hero Ready',
    description: 'Landing lebih lega dan minim card.',
  },
  {
    value: 'design',
    label: 'Design Phase',
    description: 'Eksplorasi visual dan component style.',
  },
  {
    value: 'feature',
    label: 'Feature Phase',
    description: 'Siap masuk modul aplikasi inti.',
  },
];

function StatusDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('cardless');

  const selectedOption = statusOptions.find((option) => option.value === selectedValue) || statusOptions[0];

  const selectOption = (value) => {
    setSelectedValue(value);
    setIsOpen(false);
  };

  return (
    <div className="relative grid gap-2 text-sm font-medium text-studio-600 dark:text-studio-300">
      <span>Status</span>

      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-studio-950/10 bg-white/70 px-4 text-left text-sm font-medium text-studio-950 outline-none transition hover:border-studio-accent/30 hover:bg-white focus-visible:border-studio-accent/40 focus-visible:ring-4 focus-visible:ring-studio-accent/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:border-studio-accent/35 dark:hover:bg-white/[0.09]"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="grid gap-0.5">
          <span>{selectedOption.label}</span>
          <span className="hidden text-xs font-normal text-studio-500 dark:text-studio-400 sm:block">
            {selectedOption.description}
          </span>
        </span>

        <ChevronDown
          className={isOpen ? 'shrink-0 rotate-180 text-studio-accent transition' : 'shrink-0 text-studio-500 transition group-hover:text-studio-accent dark:text-studio-400'}
          size={18}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-studio-950/10 bg-white/95 p-1.5 shadow-studio-soft ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#12121a]/95 dark:ring-white/10"
          role="listbox"
          aria-label="Status options"
        >
          {statusOptions.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <button
                className={isSelected
                  ? 'flex w-full items-start justify-between gap-3 rounded-xl bg-studio-accent/12 px-3 py-3 text-left text-studio-950 dark:bg-studio-accent/18 dark:text-white'
                  : 'flex w-full items-start justify-between gap-3 rounded-xl px-3 py-3 text-left text-studio-700 transition hover:bg-studio-950/[0.045] dark:text-studio-200 dark:hover:bg-white/[0.07]'
                }
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(option.value)}
              >
                <span className="grid gap-1">
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs font-normal leading-5 text-studio-500 dark:text-studio-400">
                    {option.description}
                  </span>
                </span>

                {isSelected && (
                  <Check className="mt-0.5 shrink-0 text-studio-accent" size={16} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ThemePreview() {
  return (
    <div className="grid gap-16 py-4 sm:gap-20 lg:py-10">
      <section className="grid min-h-[62vh] content-center gap-8 lg:grid-cols-[minmax(0,0.96fr)_360px] lg:items-center">
        <div className="grid gap-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-medium tracking-[0.18em] text-studio-accent">
              STUDIO OPS UI
            </span>
            <span className="text-sm text-studio-500 dark:text-studio-400">
              Tailwind-first · Fresh rebuild · 37 Music Studio
            </span>
          </div>

          <div className="grid gap-5">
            <h1 className="m-0 max-w-[940px] text-[clamp(3rem,8vw,7.2rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-studio-950 dark:text-white">
              Build the studio system with calmer UI.
            </h1>

            <p className="m-0 max-w-[690px] text-[clamp(1rem,1.6vw,1.24rem)] leading-8 text-studio-600 dark:text-studio-300">
              Fondasi visual dibuat lebih lapang, modern, dan tidak bergantung pada banyak card.
              Container tetap kuat, tapi halaman utama terasa seperti dashboard studio premium yang ringan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold tracking-[-0.01em] text-studio-950 shadow-studio-soft transition hover:-translate-y-0.5 hover:bg-studio-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 dark:bg-white dark:text-studio-950"
              type="button"
            >
              Start foundation
            </button>

            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-medium tracking-[-0.01em] text-studio-700 transition hover:-translate-y-0.5 hover:border-studio-accent/35 hover:text-studio-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 dark:text-studio-200 dark:hover:text-white"
              type="button"
            >
              View UI system
            </button>
          </div>
        </div>

        <aside className="hidden border-l border-studio-950/10 pl-8 dark:border-white/10 lg:grid lg:gap-7">
          <div>
            <p className="m-0 text-sm font-medium text-studio-500 dark:text-studio-400">
              Current phase
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-studio-950 dark:text-white">
              UI Foundation
            </p>
          </div>

          <dl className="grid gap-5">
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.18em] text-studio-accent">
                Stack
              </dt>
              <dd className="m-0 mt-1 text-studio-700 dark:text-studio-300">
                React · Vite · Tailwind
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.18em] text-studio-accent">
                Direction
              </dt>
              <dd className="m-0 mt-1 text-studio-700 dark:text-studio-300">
                Spatial, clean, operational
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.18em] text-studio-accent">
                Rule
              </dt>
              <dd className="m-0 mt-1 text-studio-700 dark:text-studio-300">
                Card only when useful
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="grid gap-7">
        <div className="max-w-2xl">
          <p className="m-0 text-xs font-medium uppercase tracking-[0.18em] text-studio-accent">
            Foundation notes
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-studio-950 dark:text-white sm:text-4xl">
            Lebih sedikit kotak, lebih banyak ruang.
          </h2>
        </div>

        <div className="grid gap-0 border-y border-studio-950/10 dark:border-white/10 md:grid-cols-3">
          {foundationNotes.map((item, index) => (
            <article
              className="grid gap-3 border-studio-950/10 py-7 md:px-7 md:[&:not(:first-child)]:border-l dark:border-white/10"
              key={item.title}
            >
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-studio-accent">
                {String(index + 1).padStart(2, '0')} · {item.label}
              </span>
              <h3 className="m-0 text-xl font-semibold tracking-[-0.035em] text-studio-950 dark:text-white">
                {item.title}
              </h3>
              <p className="m-0 leading-7 text-studio-600 dark:text-studio-300">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 border-t border-studio-950/10 pt-8 dark:border-white/10 lg:grid-cols-[0.85fr_1fr]">
        <div className="grid gap-3">
          <p className="m-0 text-xs font-medium uppercase tracking-[0.18em] text-studio-accent">
            Form baseline
          </p>
          <h2 className="m-0 text-3xl font-semibold tracking-[-0.055em] text-studio-950 dark:text-white">
            Komponen tetap jelas tanpa harus selalu jadi card.
          </h2>
          <p className="m-0 max-w-xl leading-7 text-studio-600 dark:text-studio-300">
            Form, button, badge, dan panel nanti akan kita pecah jadi component library kecil.
            Untuk landing dan dashboard awal, layout dibuat lebih flat dan lapang.
          </p>
        </div>

        <form className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-studio-600 dark:text-studio-300">
            <span>Nama project</span>
            <input
              className="min-h-12 w-full rounded-2xl border border-studio-950/10 bg-white/70 px-4 text-sm font-medium text-studio-950 outline-none transition focus:border-studio-accent/40 focus:ring-4 focus:ring-studio-accent/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              value="37 Music Studio"
              readOnly
            />
          </label>

          <StatusDropdown />
        </form>
      </section>
    </div>
  );
}
