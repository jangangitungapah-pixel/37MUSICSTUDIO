import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { activeIndicatorTransition } from '../../animations';

const STATUS_FILTERS = [
  { id: 'all',         label: 'Semua',    shortLabel: 'All' },
  { id: 'pending',     label: 'Pending',  shortLabel: 'P'   },
  { id: 'dp',          label: 'DP',       shortLabel: 'DP'  },
  { id: 'confirmed',   label: 'Lunas',    shortLabel: 'L'   },
  { id: 'maintenance', label: 'Blokir',   shortLabel: 'B'   },
  { id: 'cancelled',   label: 'Batal',    shortLabel: 'X'   },
];

const CalendarWorkspaceToolbar = ({
  dateLabel,
  filterStatus,
  isMobile,
  viewMode,
  viewModes,
  onChangeFilter,
  onChangeViewMode,
  onGoToday,
  onNext,
  onPrev,
}) => (
  <div className="cal-toolbar">
    {/* Left: Date Navigation */}
    <div className="cal-toolbar-left">
      <div className="cal-date-nav">
        <button className="cal-nav-btn" onClick={onPrev} aria-label="Periode sebelumnya">
          <ChevronLeft size={16} />
        </button>
        <span className="cal-period-label">{dateLabel}</span>
        <button className="cal-nav-btn" onClick={onNext} aria-label="Periode berikutnya">
          <ChevronRight size={16} />
        </button>
      </div>
      <button className="cal-today-btn" onClick={onGoToday}>Hari Ini</button>
    </div>

    {/* Right: View switcher + Filter chips */}
    <div className="cal-toolbar-right">
      {/* View mode pills */}
      <div className="cal-view-switcher" role="tablist" aria-label="Format tampilan kalender">
        {viewModes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`cal-view-btn ${viewMode === id ? 'active' : ''}`}
            onClick={() => onChangeViewMode(id)}
            role="tab"
            aria-selected={viewMode === id}
          >
            <Icon size={13} />
            <span>{label}</span>
            {viewMode === id && (
              <motion.div
                layoutId="cal-view-indicator"
                className="cal-view-indicator"
                transition={activeIndicatorTransition}
              />
            )}
          </button>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="cal-filters">
        {STATUS_FILTERS.map(({ id, label, shortLabel }) => (
          <Tooltip.Root key={id}>
            <Tooltip.Trigger asChild>
              <button
                className={`cal-chip ${filterStatus === id ? `active ${id}` : ''}`}
                onClick={() => onChangeFilter(id)}
                aria-pressed={filterStatus === id}
                aria-label={`Filter ${label}`}
              >
                {id !== 'all' && <span className={`cal-chip-dot ${id}`} />}
                {isMobile ? shortLabel : label}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="radix-tooltip-content" sideOffset={5} side="bottom">
                {label}
                <Tooltip.Arrow className="radix-tooltip-arrow" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </div>
  </div>
);

export default CalendarWorkspaceToolbar;
