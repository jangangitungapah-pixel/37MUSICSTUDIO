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
  <header className="cal-header">
    <div className="cal-header-left">
      <div className="cal-header-icon">
        <CalendarCheck size={18} />
      </div>
      <div className="cal-header-title">
        <h2>Booking Calendar</h2>
        <p>{studioName} · {format(currentDate, 'MMMM yyyy')}</p>
      </div>
    </div>

    <div className="cal-header-right">
      <div className="cal-search">
        <Search size={14} />
        <input
          type="text"
          placeholder="Cari band / no HP..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Cari band atau nomor HP"
        />
        {searchQuery && (
          <button
            type="button"
            className="cal-search-clear"
            onClick={onClearSearch}
            aria-label="Bersihkan pencarian"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            className="cal-btn-ghost cal-panel-toggle"
            type="button"
            onClick={onTogglePanels}
            aria-expanded={!areTopPanelsCollapsed}
            aria-controls="calendar-top-panels"
          >
            {areTopPanelsCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            <span style={{ display: 'none' }}>{areTopPanelsCollapsed ? 'Tampilkan' : 'Sembunyikan'}</span>
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
          <button className="cal-btn-ghost" onClick={onPrint} aria-label="Cetak jadwal">
            <Printer size={15} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="radix-tooltip-content" sideOffset={5}>
            Cetak jadwal
            <Tooltip.Arrow className="radix-tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <button className="cal-btn-primary" onClick={onNewBooking}>
        <Plus size={16} />
        New Booking
      </button>
    </div>
  </header>
);

export default CalendarHeader;
