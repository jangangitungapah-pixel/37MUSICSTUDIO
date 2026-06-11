export function AdminPage() {
  const hasDevAccess =
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem('thirty-seven-dev-auth') === 'true';

  if (!hasDevAccess) {
    return (
      <section
        className="grid min-h-[62vh] content-center gap-6 py-4"
        aria-labelledby="admin-locked-title"
      >
        <div className="grid max-w-2xl gap-4">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
            Admin Access
          </p>

          <h1
            className="m-0 text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]"
            id="admin-locked-title"
          >
            Masuk dulu untuk buka admin.
          </h1>

          <p className="m-0 max-w-xl leading-8 text-[var(--ui-text-main)]">
            Halaman admin masih mode developing. Gunakan akses dev dari halaman login untuk membuka canvas admin kosong.
          </p>

          <a
            className="inline-flex min-h-12 w-fit items-center justify-center rounded-full [background:var(--ui-primary-bg)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            href="/login"
          >
            Ke halaman login
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      className="grid min-h-[62vh] content-center gap-8 py-4"
      aria-labelledby="admin-title"
    >
      <div className="grid max-w-3xl gap-5">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
          Admin Canvas
        </p>

        <h1
          className="m-0 text-[clamp(3rem,7vw,6.4rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]"
          id="admin-title"
        >
          Admin page kosong dulu.
        </h1>

        <p className="m-0 max-w-2xl text-[clamp(1rem,1.45vw,1.18rem)] leading-8 text-[var(--ui-text-main)]">
          Login development berhasil. Area ini disiapkan sebagai canvas awal untuk dashboard admin 37 Music Studio.
        </p>
      </div>
    </section>
  );
}
