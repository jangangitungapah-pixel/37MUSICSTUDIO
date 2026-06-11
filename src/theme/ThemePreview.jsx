const previewCards = [
  {
    title: 'Surface System',
    text: 'Panel, card, border, radius, dan shadow sudah memakai token dasar.',
  },
  {
    title: 'Responsive Container',
    text: 'Lebar halaman dikunci supaya desktop lega dan mobile tidak kepotong.',
  },
  {
    title: 'Theme Ready',
    text: 'Dark mode, light mode, dan density mode sudah siap jadi fondasi app.',
  },
];

export function ThemePreview() {
  return (
    <div className="theme-preview">
      <section className="hero-panel">
        <p className="eyebrow">Studio Ops Interface</p>
        <h1>Container theme pertama sudah berdiri.</h1>
        <p className="hero-copy">
          Ini adalah panggung dasar untuk rebuild 37 Music Studio. Semua halaman berikutnya
          akan masuk ke sistem token, container, spacing, surface, button, dan panel yang sama.
        </p>

        <div className="hero-actions">
          <button className="ui-button ui-button-primary" type="button">
            Primary Action
          </button>
          <button className="ui-button ui-button-soft" type="button">
            Secondary Action
          </button>
        </div>
      </section>

      <section className="preview-grid" aria-label="Theme preview cards">
        {previewCards.map((card) => (
          <article className="ui-card" key={card.title}>
            <span className="ui-card-kicker">Foundation</span>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="ui-panel">
        <div>
          <p className="eyebrow">Form Surface</p>
          <h2>Input dan panel dasar</h2>
          <p>
            Komponen form awal ini cuma preview. Nanti baru kita pecah jadi komponen reusable
            per kebutuhan.
          </p>
        </div>

        <form className="preview-form">
          <label>
            <span>Nama project</span>
            <input className="ui-input" value="37 Music Studio" readOnly />
          </label>

          <label>
            <span>Status</span>
            <select className="ui-input" defaultValue="foundation">
              <option value="foundation">Foundation Ready</option>
              <option value="design">Design Phase</option>
              <option value="feature">Feature Phase</option>
            </select>
          </label>
        </form>
      </section>
    </div>
  );
}
