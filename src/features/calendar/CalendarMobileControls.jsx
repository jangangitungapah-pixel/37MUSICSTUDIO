import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';

const MOBILE_STATUS_FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Pending' },
  { id: 'dp', label: 'DP' },
  { id: 'confirmed', label: 'Lunas' },
  { id: 'maintenance', label: 'Blokir' },
  { id: 'cancelled', label: 'Batal' },
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
  <div className="calendar-mobile-control">
    <div className="calendar-mobile-titlebar">
      <div>
        <h2 className="mobile-title">Booking Calendar</h2>
        <p className="mobile-subtitle">{studioName} - {dateLabel}</p>
      </div>
      <button className="calendar-mobile-new" onClick={onNewBooking} aria-label="Booking Baru">
        <Plus size={20} />
      </button>
    </div>

    <div className="calendar-mobile-search">
      <Search size={14} className="search-icon" />
      <input
        type="text"
        placeholder="Cari band / no HP..."
        value={searchQuery}
        onChange={(event) => onChangeSearch(event.target.value)}
        aria-label="Cari band atau nomor HP"
      />
      {searchQuery && (
        <button onClick={onClearSearch} aria-label="Bersihkan">
          <X size={12} />
        </button>
      )}
    </div>

    <div className="calendar-mobile-period">
      <button onClick={onPrev} aria-label="Sebelumnya">
        <ChevronLeft size={16} />
      </button>
      <button className="calendar-mobile-today" onClick={onGoToday}>
        Hari Ini
      </button>
      <button onClick={onNext} aria-label="Berikutnya">
        <ChevronRight size={16} />
      </button>
    </div>

    <div className="calendar-mobile-segments">
      {viewModes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`view-btn ${viewMode === id ? 'active' : ''}`}
          onClick={() => onChangeViewMode(id)}
        >
          <Icon size={12} />
          <span>{label}</span>
        </button>
      ))}
    </div>

    <div className="calendar-mobile-filters">
      {MOBILE_STATUS_FILTERS.map(({ id, label }) => (
        <button
          key={id}
          className={`filter-chip ${filterStatus === id ? 'active' : ''}`}
          onClick={() => onChangeFilter(id)}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

export default CalendarMobileControls;
