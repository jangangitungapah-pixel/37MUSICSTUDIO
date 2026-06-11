import {
  ArrowRight,
  Calendar,
  Check,
  MessageCircle,
  Mic,
  Music,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

const heroChips = [
  'Latihan Band',
  'Live Recording',
  'Tracking Session',
];

const valuePropositions = [
  {
    label: '01',
    title: 'Latihan band jadi lebih fokus',
    text: 'Datang, set kebutuhan sesi, lalu mulai main. Ruang studio disiapkan untuk membantu band latihan dengan alur yang lebih nyaman dan tidak membingungkan.',
  },
  {
    label: '02',
    title: 'Sound latihan lebih mudah diperhatikan',
    text: 'Saat latihan, band butuh mendengar permainan dengan jelas. Setup studio dibuat untuk mendukung sesi yang lebih terarah, dari aransemen sampai detail permainan.',
  },
  {
    label: '03',
    title: 'Recording punya kontrol yang lebih rapi',
    text: 'Untuk sesi recording, ruang operator membantu proses monitoring dan kontrol sesi agar workflow terasa lebih tertata.',
  },
  {
    label: '04',
    title: 'Fleksibel untuk banyak kebutuhan musik',
    text: 'Dari latihan rutin, live recording, tracking, sampai project rekaman kecil-menengah, format sesi bisa disesuaikan dengan kebutuhanmu.',
  },
];

const services = [
  {
    icon: Users,
    title: 'Latihan Band',
    text: 'Latihan bareng jadi lebih fokus dengan ruang yang siap dipakai untuk rehearsal, pembentukan aransemen, dan persiapan perform.',
    fit: 'Cocok untuk band, sekolah, komunitas musik, project performance, dan latihan rutin.',
  },
  {
    icon: Radio,
    title: 'Live Recording Session',
    text: 'Rekam perform band secara live dalam satu sesi. Cocok untuk menangkap energi permainan bareng tanpa memecah proses terlalu banyak.',
    fit: 'Cocok untuk band, content creator musik, live session, demo lagu, dan dokumentasi perform.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Tracking Recording',
    text: 'Rekam bagian musik secara bertahap agar tiap part bisa lebih diperhatikan. Format ini cocok kalau kamu ingin proses recording yang lebih detail dan terarah.',
    fit: 'Cocok untuk band, musisi solo, vocalist, guitarist, drummer, dan project rekaman kecil-menengah.',
  },
  {
    icon: Mic,
    title: 'Vocal / Instrument Session',
    text: 'Untuk kamu yang ingin fokus merekam vocal atau instrument tertentu tanpa harus membawa full band.',
    fit: 'Cocok untuk vocalist, guitarist, drummer, musisi solo, dan kreator musik.',
  },
];

const setupHighlights = [
  '1 ruang studio utama untuk latihan dan recording',
  '1 ruang operator recording untuk monitoring sesi',
  'Bisa untuk latihan band, live recording, dan tracking',
  'Cocok untuk project musik kecil-menengah',
];

const processSteps = [
  {
    title: 'Pilih kebutuhan sesi',
    text: 'Mau latihan band, live recording, tracking, atau sesi vocal/instrument? Tentukan dulu tujuan sesinya.',
  },
  {
    title: 'Cek jadwal atau hubungi admin',
    text: 'Kirim kebutuhanmu ke admin lewat [nomor WhatsApp]. Nanti jadwal dan slot yang tersedia bisa dicek bareng.',
  },
  {
    title: 'Datang dan mulai sesi',
    text: 'Setelah jadwal cocok, kamu tinggal datang ke studio dan mulai sesi sesuai kebutuhan.',
  },
  {
    title: 'Tentukan format recording',
    text: 'Kalau mau recording, pilih live recording untuk menangkap perform bareng, atau tracking untuk proses yang lebih bertahap.',
  },
];

const microcopy = [
  'Respons admin mengikuti [jam operasional].',
  'Detail jadwal dan kebutuhan sesi bisa dikonfirmasi lewat [nomor WhatsApp].',
  'Harga dan durasi sesi dapat menyesuaikan kebutuhan. Tanyakan detailnya ke admin.',
];

function SectionIntro({ eyebrow, title, text }) {
  return (
    <div className="max-w-3xl">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)] sm:text-4xl">
        {title}
      </h2>

      {text ? (
        <p className="m-0 mt-4 max-w-2xl leading-7 text-[var(--ui-text-main)]">
          {text}
        </p>
      ) : null}
    </div>
  );
}

export function ThemePreview() {
  return (
    <div className="grid gap-16 py-4 sm:gap-20 lg:py-10">
      <section className="relative grid min-h-[62vh] content-center gap-10 lg:grid-cols-[minmax(0,0.96fr)_360px] lg:items-center lg:gap-12">
        <div className="grid gap-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex w-fit text-xs font-semibold tracking-[0.18em] text-studio-accent">
              STUDIO LATIHAN & RECORDING
            </span>
            <span className="text-sm text-[var(--ui-text-muted)]">
              Dari latihan rutin sampai sesi recording
            </span>
          </div>

          <div className="grid gap-5">
            <h1 className="m-0 max-w-[940px] text-[clamp(3rem,8vw,7.2rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]">
              Latihan lebih fokus, recording lebih terarah.
            </h1>

            <p className="m-0 max-w-[700px] text-[clamp(1rem,1.6vw,1.24rem)] leading-8 text-[var(--ui-text-main)]">
              37 Music Studio siap untuk latihan band, live recording, dan tracking dalam satu setup studio yang fleksibel. Cocok untuk kamu yang ingin sesi musik terasa nyaman, jelas, dan tidak ribet dari awal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
              href="#booking"
            >
              Booking Sesi
              <ArrowRight size={17} strokeWidth={2.35} aria-hidden="true" />
            </a>

            <a
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
              href="#layanan"
            >
              Konsultasi Recording
            </a>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {heroChips.map((chip) => (
              <span
                className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]"
                key={chip}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <aside className="hidden border-l border-[var(--ui-border-strong)] pl-8 text-[var(--ui-text-main)] lg:grid lg:gap-7">
          <div>
            <p className="m-0 text-sm font-medium text-[var(--ui-text-muted)]">
              Cocok untuk
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--ui-text-strong)]">
              Band, musisi, vocalist, drummer, guitarist, dan creator musik.
            </p>
          </div>

          <dl className="grid gap-5">
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.18em] text-studio-accent">
                Setup
              </dt>
              <dd className="m-0 mt-1 text-[var(--ui-text-main)]">
                1 ruang studio utama + 1 ruang operator recording
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.18em] text-studio-accent">
                Format
              </dt>
              <dd className="m-0 mt-1 text-[var(--ui-text-main)]">
                Latihan band, live recording, tracking
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.18em] text-studio-accent">
                Booking
              </dt>
              <dd className="m-0 mt-1 text-[var(--ui-text-main)]">
                Cek jadwal, tentukan kebutuhan, lalu mulai sesi
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="grid gap-7" aria-labelledby="value-title">
        <SectionIntro
          eyebrow="KENAPA 37 MUSIC STUDIO"
          title="Sesi musik yang dibuat lebih enak dijalani."
          text="Bukan cuma soal masuk ruangan dan mulai main. Customer butuh sesi yang nyaman, jelas, dan mudah diarahkan sesuai kebutuhan musiknya."
        />

        <div className="grid gap-0 border-y border-[var(--ui-border-strong)] md:grid-cols-2">
          {valuePropositions.map((item) => (
            <article
              className="grid gap-3 border-[var(--ui-border)] px-0 py-7 md:px-7 md:[&:nth-child(even)]:border-l md:[&:nth-child(n+3)]:border-t"
              key={item.title}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
                {item.label}
              </span>

              <h3 className="m-0 text-xl font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
                {item.title}
              </h3>

              <p className="m-0 leading-7 text-[var(--ui-text-main)]">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-7" id="layanan" aria-labelledby="services-title">
        <SectionIntro
          eyebrow="LAYANAN STUDIO"
          title="Pilih sesi sesuai kebutuhan musikmu."
          text="Dari rehearsal sampai recording, format sesi bisa dibuat sederhana dan jelas dari awal."
        />

        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => {
            const ServiceIcon = service.icon;

            return (
              <article
                className="grid gap-5 rounded-[1.75rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-5 ring-1 ring-[var(--ui-ring)] transition hover:border-studio-accent/35 hover:bg-[var(--ui-control)] md:p-6"
                key={service.title}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-11 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
                    <ServiceIcon size={20} strokeWidth={2.25} aria-hidden="true" />
                  </div>

                  <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-1 text-xs font-semibold text-[var(--ui-text-muted)]">
                    Session
                  </span>
                </div>

                <div className="grid gap-2">
                  <h3 className="m-0 text-2xl font-semibold tracking-[-0.05em] text-[var(--ui-text-strong)]">
                    {service.title}
                  </h3>

                  <p className="m-0 leading-7 text-[var(--ui-text-main)]">
                    {service.text}
                  </p>
                </div>

                <p className="m-0 border-t border-[var(--ui-border)] pt-4 text-sm leading-6 text-[var(--ui-text-muted)]">
                  <span className="font-semibold text-[var(--ui-text-strong)]">Cocok untuk: </span>
                  {service.fit}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-8 border-y border-[var(--ui-border-strong)] py-10 lg:grid-cols-[0.82fr_1fr] lg:items-start">
        <div className="grid gap-4">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
            SETUP STUDIO
          </p>

          <h2 className="m-0 text-3xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)] sm:text-4xl">
            Satu ruang studio, satu ruang operator, satu alur sesi yang jelas.
          </h2>

          <p className="m-0 max-w-xl leading-7 text-[var(--ui-text-main)]">
            37 Music Studio memiliki satu ruang studio utama yang fleksibel untuk latihan dan recording, didukung satu ruang operator untuk monitoring dan kontrol sesi.
          </p>

          <p className="m-0 max-w-xl leading-7 text-[var(--ui-text-main)]">
            Setup ini cocok untuk kebutuhan band rehearsal, live recording, tracking, dan sesi instrument atau vocal. Jadi kamu tidak perlu bingung memilih banyak ruangan. Tinggal tentukan kebutuhan sesi, lalu formatnya kita sesuaikan.
          </p>
        </div>

        <div className="grid gap-3">
          {setupHighlights.map((item) => (
            <div
              className="flex items-start gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-4 text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]"
              key={item}
            >
              <Check className="mt-0.5 shrink-0 text-studio-accent" size={17} strokeWidth={2.35} aria-hidden="true" />
              <span className="leading-6">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-7" aria-labelledby="process-title">
        <SectionIntro
          eyebrow="CARA BOOKING"
          title="Mulai sesi tanpa ribet."
          text="Alurnya dibuat sederhana supaya customer baru juga tidak perlu takut salah pilih format sesi."
        />

        <div className="grid gap-0 border-y border-[var(--ui-border-strong)] md:grid-cols-4">
          {processSteps.map((step, index) => (
            <article
              className="grid gap-4 border-[var(--ui-border)] py-7 md:px-5 md:[&:not(:first-child)]:border-l"
              key={step.title}
            >
              <span className="grid size-10 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] text-sm font-semibold text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="grid gap-2">
                <h3 className="m-0 text-lg font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
                  {step.title}
                </h3>

                <p className="m-0 text-sm leading-6 text-[var(--ui-text-main)]">
                  {step.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="relative overflow-hidden rounded-[2.25rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-6 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] sm:p-8 lg:p-10"
        id="booking"
      >
        <div className="pointer-events-none absolute -right-28 -top-32 size-72 rounded-full bg-studio-accent/16 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 size-72 rounded-full bg-studio-cyan/14 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div className="grid gap-4">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
              BOOKING & KONSULTASI
            </p>

            <h2 className="m-0 max-w-3xl text-3xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)] sm:text-5xl">
              Punya lagu, jadwal latihan, atau project recording yang mau mulai digarap?
            </h2>

            <p className="m-0 max-w-2xl leading-7 text-[var(--ui-text-main)]">
              Ceritakan kebutuhan sesimu dulu. Kita bantu arahkan format yang paling pas, dari latihan band sampai recording.
            </p>
          </div>

          <div className="grid gap-3">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
              href="https://wa.me/[nomorWhatsApp]"
            >
              Booking Latihan Band
              <Calendar size={17} strokeWidth={2.35} aria-hidden="true" />
            </a>

            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
              href="https://wa.me/[nomorWhatsApp]"
            >
              Konsultasi Recording
              <MessageCircle size={17} strokeWidth={2.35} aria-hidden="true" />
            </a>

            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-text-strong)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-studio-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
              href="https://wa.me/[nomorWhatsApp]"
            >
              Tanya Kebutuhan Sesi
              <Music size={17} strokeWidth={2.35} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="relative z-10 mt-7 grid gap-2 border-t border-[var(--ui-border)] pt-5">
          {microcopy.map((item) => (
            <p className="m-0 flex gap-2 text-sm leading-6 text-[var(--ui-text-muted)]" key={item}>
              <ShieldCheck className="mt-1 shrink-0 text-studio-accent" size={14} strokeWidth={2.35} aria-hidden="true" />
              <span>{item}</span>
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
