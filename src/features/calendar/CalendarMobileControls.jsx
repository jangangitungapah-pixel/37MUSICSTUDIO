import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';

const MOBILE_STATUS_FILTERS = [
  { id: 'all',         label: 'Semua'  },
  { id: 'pending',     label: 'Pending'},
  { id: 'dp',          label: 'DP'     },
  { id: 'confirmed',   label: 'Lunas'  },
  { id: 'maintenance', label: 'Blokir' },
  { id: 'cancelled',   label: 'Batal'  },
];

const CalendarMobileControls = ({
  dateLabel,
  filterStatus,
  searchQuery,
  studioName,
  viewMode,
  viewModes,
  onChangeFilter,
  onChangeSearch,
  onChangeViewMode,
  onClearSearch,
  onGoToday,
  onNewBooking,
  onNext,
  onPrev,
}) => (
  <div className="cal-mob-ctrl">
    {/* Top row: title + FAB */}
    <div className="cal-mob-top">
      <div className="cal-mob-title">
        <h2>Booking Calendar</h2>
        <p>{studioName} · {dateLabel}</p>
      </div>
      <button className="cal-mob-fab" onClick={onNewBooking} aria-label="Booking Baru">
        <Plus size={20} />
      </button>
    </div>

    {/* Search + Nav row */}
    <div className="cal-mob-row">
      <div className="cal-mob-search">
        <Search size={13} />
        <input
          type="text"
          placeholder="Cari band / no HP..."
          value={searchQuery}
          onChange={(e) => onChangeSearch(e.target.value)}
          aria-label="Cari band atau nomor HP"
        />
        {searchQuery && (
          <button className="cal-mob-search-clear" onClick={onClearSearch} aria-label="Bersihkan">
            <X size={11} />
          </button>
        )}
      </div>

      <div className="cal-mob-nav">
        <button className="cal-mob-nav-btn" onClick={onPrev} aria-label="Sebelumnya">
          <ChevronLeft size={15} />
        </button>
        <button className="cal-mob-today-btn" onClick={onGoToday}>Hari Ini</button>
        <button className="cal-mob-nav-btn" onClick={onNext} aria-label="Berikutnya">
          <ChevronRight size={15} />
        </button>
      </div>
    </div>

    {/* View mode + Filter row */}
    <div className="cal-mob-row">
      <div className="cal-mob-segments">
        {viewModes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`cal-mob-seg-btn ${viewMode === id ? 'active' : ''}`}
            onClick={() => onChangeViewMode(id)}
          >
            <Icon size={12} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>

    {/* Filter chips */}
    <div className="cal-mob-filters">
      {MOBILE_STATUS_FILTERS.map(({ id, label }) => (
        <button
          key={id}
          className={`cal-chip ${filterStatus === id ? `active ${id}` : ''}`}
          onClick={() => onChangeFilter(id)}
          aria-pressed={filterStatus === id}
        >
          {id !== 'all' && <span className={`cal-chip-dot ${id}`} />}
          {label}
        </button>
      ))}
    </div>
  </div>
);

export default CalendarMobileControls;
