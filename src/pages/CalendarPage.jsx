import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { createPortal } from 'react-dom';
import { Inbox, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, Search, CalendarCheck, Clock, DollarSign, Trash2, Phone, StickyNote, X, MessageCircle, TrendingUp, Calendar, LayoutGrid, CalendarDays, AlertTriangle, CheckCircle2, XCircle, RotateCcw, Printer } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, addDays, subDays, getDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useBookingRequestStore } from '../store/useBookingRequestStore';
import { useNotificationStore } from '../store/useNotificationStore';
import * as Tooltip from '@radix-ui/react-tooltip';
import Modal from '../components/Modal';
import BookingForm from '../components/BookingForm';
import { getAnomalies } from '../lib/smartInsights';
import { getDepositDeadlineStatus, hasBookingOverlap } from '../lib/bookingWorkflows';
import { useCalendarBookingMove } from '../hooks/useCalendarBookingMove';
import { useCalendarBookingResize } from '../hooks/useCalendarBookingResize';
import { useThemeStore } from '../store/useThemeStore';
import './CalendarPage.css';
import './CalendarP
 size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="quick-filters">
              {[
                { id: 'all', label: 'Semua', shortLabel: 'S' },
                { id: 'pending', label: 'Pending', shortLabel: 'P' },
                { id: 'dp', label: 'DP', shortLabel: 'DP' },
                { id: 'confirmed', label: 'Lunas', shortLabel: 'L' },
                { id: 'maintenance', label: 'Blokir', shortLabel: 'B' },
                { id: 'cancelled', label: 'Batal', shortLabel: 'X' },
              ].map(({ id, label, shortLabel }) => (
                <Tooltip.Root key={id}>
                  <Tooltip.Trigger asChild>
                    <button 
                      className={`filter-chip ${filterStatus === id ? `active ${id}` : ''}`} 
                      onClick={() => setFilterStatus(id)}
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
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className={`monthly-grid-wrapper ${resizingBooking ? 'is-resize-active' : ''} ${movingBooking ? 'is-move-active' : ''}`} ref={gridWrapperRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="monthly-grid" style={{ gridTemplateColumns: `${timeColWidth} repeat(${numDays}, minmax(${colWidth}, 1fr))`, gridTemplateRows: `auto repeat(${hoursArray.length}, minmax(${rowMinHeight}, 1fr))` }}>
            <div className="grid-corner-cell" style={{ gridRow: 1, gridColumn: 1 }}><span className="corner-label">JAM</span></div>

            {daysMetadata.map((meta, idx) => {
              return (
                <div key={idx} className={`grid-header-cell ${meta.isToday ? 'today' : ''} ${meta.isWeekend ? 'weekend' : ''}`} style={{ gridRow: 1, gridColumn: idx + 2 }}>
                  <span className="day-name">{dayNames[meta.dow]} {meta.isBlocked && <AlertTriangle size={12} color="var(--accent-pink)" style={{marginLeft: 4, display: 'inline'}} />}</span>
                  <span className={`day-number ${meta.isToday ? 'today-circle' : ''}`}>{meta.dayNum}</span>
                </div>
              );
            })}

            {hoursArray.map((hour, hourIdx) => {
              const isCurrentHour = now.getHours() === hour;
              return (
                <React.Fragment key={hour}>
   
              </div>
            </div>

            {resizeConfirmData.diff !== 0 && (
              <div className={`resize-diff-note ${resizeConfirmData.diff > 0 ? 'increase' : 'decrease'}`}>
                {resizeConfirmData.diff > 0 
                  ? `Biaya bertambah sebesar ${formatCurrency(resizeConfirmData.diff)}.` 
                  : `Terdapat kelebihan biaya (pengurangan) sebesar ${formatCurrency(Math.abs(resizeConfirmData.diff))}.`}
              </div>
            )}

            {resizeConfirmData.booking.type === 'recording' && resizeConfirmData.newDuration > resizeConfirmData.oldDuration && (
              <div className="resize-recording-note">
                * Sesi recording menggunakan harga paket. Penambahan jam dihitung sebagai overtime.
              </div>
            )}

            {resizeConfirmData.booking.status === 'confirmed' && resizeConfirmData.diff > 0 && (
              <div className="resize-status-warning">
                <strong>Perhatian:</strong> Booking ini sebelumnya berstatus <strong>Lunas</strong>. Karena ada penambahan durasi & biaya, status akan otomatis diubah menjadi <strong>DP</strong> (Kurang Bayar).
              </div>
            )}

            <div className="resize-confirm-actions">
              <button className="btn-secondary" onClick={() => setResizeConfirmData(null)}>Batal</button>
              <button className="btn-primary" onClick={confirmResize}>Konfirmasi Perubahan</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </Tooltip.Provider>
  );
};

export default CalendarPage;

The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.