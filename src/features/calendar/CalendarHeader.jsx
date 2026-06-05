import { format } from 'date-fns';
import { CalendarCheck, ChevronDown, ChevronUp, Plus, Printer, Search, X } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

const CalendarHeader = ({
  areTopPanelsCollapsed,
  currentDate,
  searchQuery,
  studioName,
  onClearSearch,
  onNewBooking,
  onPrint,
  onSearchChange,
  onTogglePanels,
}) => (
  <header className="calendar-page-header app-page-header">
    <div className="app-page-header-left">
      <div className="calendar-header-icon">
        <CalendarCheck size={20} />
      </div>
      <div>
        <h2 className="app-page-title">Booking Calendar</h2>
        <p className="app-page-subtitle">{studioName} - {format(currentDate, 'MMMM yyyy')}</p>
      </div>
    </div>
    <div className="calendar-header-actions app-page-actions">
      <div className="app-search app-search-lg calendar-header-search">
        <Search className="app-search-icon" />
        <input
          type="text"
          className="app-search-input"
          placeholder="Cari band / no HP..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Cari band atau nomor HP"
        />
        {searchQuery && (
          <button type="button" className="app-search-clear" onClick={onClearSearch} aria-label="Bersihkan pencarian" title="Bersihkan pencarian">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="app-page-actions-buttons">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              className="btn-secondary cal-panel-toggle"
              type="button"
              onClick={onTogglePanels}
              aria-expanded={!areTopPanelsCollapsed}
              aria-controls="calendar-top-panels"
            >
              {areTopPanelsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              <span className="hide-on-mobile">{areTopPanelsCollapsed ? 'Tampilkan Panel' : 'Sembunyikan Panel'}</span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="radix-tooltip-content" sideOffset={5}>
              {areTopPanelsCollapsed ? 'Tampilkan statistik' : 'Sembunyikan statistik'}
              <Tooltip.Arrow className="radix-tooltip-arrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button className="btn-secondary calendar-print-btn" onClick={onPrint}>
              <Printer size={16} />
              <span className="hide-on-mobile">Cetak</span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="radix-tooltip-content" sideOffset={5}>
              Cetak jadwal kalender
              <Tooltip.Arrow className="radix-tooltip-arrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        <button className="btn-primary calendar-new-btn" onClick={onNewBooking}>
          <Plus size={18} /><span className="hide-on-mobile">New Booking</span>
        </button>
      </div>
    </div>
  </header>
);

export default CalendarHeader;
