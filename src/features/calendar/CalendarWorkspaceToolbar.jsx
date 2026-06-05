import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { activeIndicatorTransition } from '../../animations';

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua', shortLabel: 'S' },
  { id: 'pending', label: 'Pending', shortLabel: 'P' },
  { id: 'dp', label: 'DP', shortLabel: 'DP' },
  { id: 'confirmed', label: 'Lunas', shortLabel: 'L' },
  { id: 'maintenance', label: 'Blokir', shortLabel: 'B' },
  { id: 'cancelled', label: 'Batal', shortLabel: 'X' },
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
  <div className="calendar-workspace-toolbar">
    <div className="calendar-toolbar-left">
      <button className="icon-btn nav-arrow" onClick={onPrev} aria-label="Kembali ke periode sebelumnya">
        <ChevronLeft size={18} />
      </button>
      <span className="current-month">{dateLabel}</span>
      <button className="icon-btn nav-arrow" onClick={onNext} aria-label="Lanjut ke periode berikutnya">
        <ChevronRight size={18} />
      </button>
      <button className="today-btn" onClick={onGoToday}>Hari Ini</button>
    </div>

    <div className="calendar-toolbar-right">
      <div className="view-switcher" role="tablist" aria-label="Pilih format tampilan kalender">
        {viewModes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`view-btn ${viewMode === id ? 'active' : ''}`}
            onClick={() => onChangeViewMode(id)}
            role="tab"
            aria-selected={viewMode === id}
          >
            <Icon size={14} />
            <span>{label}</span>
            {viewMode === id && (
              <motion.div
                layoutId="view-indicator"
                className="view-btn-indicator"
                transition={activeIndicatorTransition}
              />
            )}
          </button>
        ))}
      </div>
      <div className="quick-filters">
        {STATUS_FILTERS.map(({ id, label, shortLabel }) => (
          <Tooltip.Root key={id}>
            <Tooltip.Trigger asChild>
              <button
                className={`filter-chip ${filterStatus === id ? `active ${id}` : ''}`}
                onClick={() => onChangeFilter(id)}
                aria-pressed={filterStatus === id}
                aria-label={`Filter status ${label}`}
              >
                {id !== 'all' && <span className={`dot ${id}`} style={id === 'maintenance' ? { background: '#6b6b76' } : undefined} />}
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
