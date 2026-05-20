import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const TutorialOverlay = ({ steps, currentStep, onNext, onPrev, onClose, onComplete }) => {
  const [targetRect, setTargetRect] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateTargetRect = useCallback(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    if (!step || !step.target) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  // Scroll target into view once per step
  useEffect(() => {
    if (step && step.target) {
      // Small delay to allow DOM to render new elements (like the new booking block)
      setTimeout(() => {
        const el = document.querySelector(step.target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          // Update rect after scrolling finishes
          setTimeout(updateTargetRect, 400);
        }
      }, 100);
    }
  }, [currentStep, step, updateTargetRect]);

  useEffect(() => {
    const timeout = setTimeout(updateTargetRect, 300);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    const interval = setInterval(updateTargetRect, 600);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [updateTargetRect]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (step && step.hideNext) return; // Disable keyboard next if action is required
      if (e.key === 'ArrowRight' || e.key === 'Enter') onNext();
      if (e.key === 'ArrowLeft' && currentStep > 0) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, currentStep, step]);

  const getMaskPath = () => {
    const { width, height } = windowSize;
    if (!targetRect) {
      return `M0,0 H${width} V${height} H0 Z`;
    }

    const pad = 10;
    const r = 10;
    const x = Math.max(0, targetRect.left - pad);
    const y = Math.max(0, targetRect.top - pad);
    const w = targetRect.width + pad * 2;
    const h = targetRect.height + pad * 2;

    return `
      M0,0 H${width} V${height} H0 Z
      M${x + r},${y}
      h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r}
      v${h - 2 * r} a${r},${r} 0 0 1 -${r},${r}
      h-${w - 2 * r} a${r},${r} 0 0 1 -${r},-${r}
      v-${h - 2 * r} a${r},${r} 0 0 1 ${r},-${r}
      z
    `;
  };

  const getDialogStyle = () => {
    const isMobile = windowSize.width < 768;
    const dialogWidth = isMobile ? windowSize.width - 32 : 360;

    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${dialogWidth}px`,
        maxWidth: 'calc(100vw - 2rem)'
      };
    }

    const padding = 16;
    
    // Smart docking for mobile devices to prevent target overlap
    if (isMobile) {
      const targetCenterY = targetRect.top + (targetRect.height / 2);
      if (targetCenterY < windowSize.height / 2) {
        // Target is in top half, dock to bottom
        return {
          bottom: `${padding}px`,
          left: `${padding}px`,
          width: `${dialogWidth}px`,
          maxWidth: 'calc(100vw - 2rem)'
        };
      } else {
        // Target is in bottom half, dock to top (clear header)
        return {
          top: '80px',
          left: `${padding}px`,
          width: `${dialogWidth}px`,
          maxWidth: 'calc(100vw - 2rem)'
        };
      }
    }

    // Desktop positioning logic
    const estimatedHeight = 280; // Safer estimation for dialog height
    const spaceBelow = windowSize.height - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let top = targetRect.bottom + padding;
    let left = targetRect.left + (targetRect.width / 2) - (dialogWidth / 2);

    if (spaceBelow < estimatedHeight + padding) {
      if (spaceAbove > spaceBelow) {
        // Place above
        top = targetRect.top - padding - estimatedHeight;
      } else {
        // Not enough space above or below, place below anyway
        top = targetRect.bottom + padding;
      }
    }

    if (left < padding) left = padding;
    if (left + dialogWidth > windowSize.width - padding) {
      left = windowSize.width - dialogWidth - padding;
    }
    if (top < padding) top = padding;

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${dialogWidth}px`,
      maxWidth: 'calc(100vw - 2rem)'
    };
  };

  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        <path
          d={getMaskPath()}
          fill="rgba(0, 0, 0, 0.72)"
          fillRule="evenodd"
          style={{ transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        />
      </svg>
      
      {targetRect && (
        <div style={{
          position: 'absolute',
          top: targetRect.top - 10,
          left: targetRect.left - 10,
          width: targetRect.width + 20,
          height: targetRect.height + 20,
          borderRadius: '12px',
          boxShadow: '0 0 0 3px var(--accent-pink), 0 0 30px rgba(255, 60, 116, 0.4), 0 0 60px rgba(255, 60, 116, 0.15)',
          pointerEvents: 'none',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'tutorial-pulse 2s ease-in-out infinite'
        }} />
      )}

      <div
        style={{
          position: 'absolute',
          padding: '1.75rem',
          background: '#14141a', /* Solid dark background */
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
          pointerEvents: 'auto',
          transition: 'top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'tutorial-dialog-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          ...getDialogStyle()
        }}
      >
        {/* Progress Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', borderRadius: '15px 15px 0 0', overflow: 'hidden', background: 'var(--glass-border)' }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'var(--accent-pink)',
            transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 8px var(--accent-pink)'
          }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
          <h3 style={{ 
            fontSize: '1.2rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            flex: 1,
            paddingRight: '0.5rem',
            margin: 0
          }}>{step.title || 'Panduan Tour'}</h3>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <p style={{ 
          fontSize: '0.95rem', 
          color: 'var(--text-secondary)', 
          lineHeight: '1.6', 
          marginBottom: '1.5rem',
          margin: '0 0 1.5rem 0'
        }}>
          {step.content}
        </p>

        {/* Step Dots */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === currentStep ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === currentStep 
                ? 'var(--accent-pink)' 
                : 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: i === currentStep ? '0 0 6px var(--accent-pink)' : 'none'
            }} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            {currentStep + 1} / {steps.length}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isFirst && (
              <button onClick={onPrev} className="action-btn outline" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ChevronLeft size={16} /> Kembali
              </button>
            )}
            {isFirst && (
              <button onClick={onClose} className="action-btn outline" style={{ padding: '8px 16px' }}>
                Lewati
              </button>
            )}
            {!isLast && !step?.hideNext ? (
              <button onClick={onNext} className="action-btn primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Lanjut <ChevronRight size={16} />
              </button>
            ) : isLast && !step?.hideNext ? (
              <button onClick={onComplete || onClose} className="action-btn primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {step.nextPage === '/calendar' ? 'Lanjut ke Calendar' : step.nextPage === '/customers' ? 'Lanjut ke Customers' : step.nextPage === '/inventory' ? 'Lanjut ke Inventory' : 'Selesai'} <Check size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes tutorial-pulse {
          0%, 100% { box-shadow: 0 0 0 3px var(--accent-pink), 0 0 30px rgba(255, 60, 116, 0.4), 0 0 60px rgba(255, 60, 116, 0.15); }
          50% { box-shadow: 0 0 0 5px var(--accent-pink), 0 0 40px rgba(255, 60, 116, 0.5), 0 0 80px rgba(255, 60, 116, 0.2); }
        }
        @keyframes tutorial-dialog-enter {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default TutorialOverlay;
