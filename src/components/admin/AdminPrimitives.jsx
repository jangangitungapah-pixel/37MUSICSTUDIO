import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const adminBadgeToneClasses = {
  accent: 'border-studio-accent/22 bg-studio-accent/10 text-studio-accent ring-studio-accent/10',
  cyan: 'border-studio-cyan/22 bg-studio-cyan/10 text-studio-cyan ring-studio-cyan/10',
  muted: 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-muted)] ring-[var(--ui-ring)]',
  neutral: 'border-[var(--ui-border)] bg-[var(--ui-glass-soft)] text-[var(--ui-text-main)] ring-[var(--ui-ring)]',
  purple: 'border-studio-purple/22 bg-studio-purple/10 text-studio-purple ring-studio-purple/10',
  strong: 'border-[var(--ui-border-strong)] bg-[var(--ui-control-hover)] text-[var(--ui-text-strong)] ring-[var(--ui-ring)]',
};

const adminButtonVariantClasses = {
  danger: 'border-studio-accent/26 bg-studio-accent/10 text-studio-accent hover:bg-studio-accent/14 focus-visible:ring-studio-accent/20',
  ghost: 'border-transparent bg-transparent text-[var(--ui-text-muted)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)] focus-visible:ring-studio-accent/18',
  primary: 'border-transparent [background:var(--ui-primary-bg)] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-control)] hover:-translate-y-0.5 focus-visible:ring-studio-accent/20',
  secondary: 'border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:ring-studio-accent/18',
  soft: 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-main)] hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:ring-studio-accent/18',
};

const adminButtonSizeClasses = {
  icon: 'min-h-10 min-w-10 px-0',
  lg: 'min-h-12 px-5 text-sm',
  md: 'min-h-10 px-4 text-sm',
  sm: 'min-h-8 px-3 text-xs',
};

const adminPanelVariantClasses = {
  default: 'border-[var(--ui-border)] bg-[var(--ui-glass)] shadow-[var(--ui-shadow-control)] ring-[var(--ui-ring)]',
  flat: 'border-[var(--ui-border)] bg-[var(--ui-glass-soft)] ring-[var(--ui-ring)]',
  solid: 'border-[var(--ui-border-strong)] bg-[var(--ui-bg-base)] shadow-[var(--ui-shadow-soft)] ring-[var(--ui-ring)]',
};

export function AdminPageShell({
  children,
  className = '',
  width = 'standard',
}) {
  const widthClass = width === 'wide'
    ? 'max-w-[1480px]'
    : width === 'narrow'
      ? 'max-w-[1080px]'
      : 'max-w-[1280px]';

  return (
    <section className={cn('mx-auto grid w-full gap-4', widthClass, className)}>
      {children}
    </section>
  );
}

export function AdminPageHeader({
  actions = null,
  eyebrow = '',
  description = '',
  meta = null,
  title,
  className = '',
}) {
  return (
    <header className={cn('grid gap-4 rounded-[1.45rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-4 ring-1 ring-[var(--ui-ring)] md:grid-cols-[minmax(0,1fr)_auto] md:items-end', className)}>
      <div className="grid min-w-0 gap-2">
        {eyebrow ? (
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
            {eyebrow}
          </p>
        ) : null}

        <div className="grid min-w-0 gap-2">
          <h1 className="m-0 text-[clamp(2.15rem,5vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--ui-text-strong)]">
            {title}
          </h1>

          {description ? (
            <p className="m-0 max-w-3xl text-sm font-medium leading-7 text-[var(--ui-text-muted)] md:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {meta ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {meta}
          </div>
        ) : null}
      </div>

      {actions ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function AdminCommandBar({
  children,
  className = '',
}) {
  return (
    <section className={cn('grid gap-2 rounded-[1.3rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-2 ring-1 ring-[var(--ui-ring)]', className)}>
      {children}
    </section>
  );
}

export function AdminPanel({
  as: Component = 'section',
  children,
  className = '',
  variant = 'default',
}) {
  return (
    <Component
      className={cn(
        'rounded-[1.35rem] border p-4',
        adminPanelVariantClasses[variant] || adminPanelVariantClasses.default,
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function AdminButton({
  as: Component = 'button',
  children,
  className = '',
  icon: Icon,
  size = 'md',
  type = 'button',
  variant = 'secondary',
  ...props
}) {
  const componentProps = Component === 'button'
    ? { type, ...props }
    : props;

  return (
    <Component
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full border font-semibold tracking-[-0.01em] ring-1 transition focus-visible:outline-none focus-visible:ring-4',
        adminButtonVariantClasses[variant] || adminButtonVariantClasses.secondary,
        adminButtonSizeClasses[size] || adminButtonSizeClasses.md,
        className,
      )}
      {...componentProps}
    >
      {Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.35} aria-hidden="true" />
      ) : null}
      {children}
    </Component>
  );
}

export function AdminBadge({
  children,
  className = '',
  icon: Icon,
  tone = 'neutral',
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-[0.68rem] font-semibold ring-1',
        adminBadgeToneClasses[tone] || adminBadgeToneClasses.neutral,
        className,
      )}
    >
      {Icon ? (
        <Icon size={13} strokeWidth={2.35} aria-hidden="true" />
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function AdminDrawer({
  actions = null,
  children,
  description = '',
  isOpen,
  onClose,
  title,
  widthClass = 'max-w-xl',
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] grid bg-black/60 p-3 backdrop-blur-md sm:justify-items-end" role="presentation">
      <button
        aria-label="Close drawer overlay"
        className="absolute inset-0 cursor-default"
        type="button"
        onClick={onClose}
      />

      <section
        aria-modal="true"
        className={cn('relative z-10 grid max-h-[calc(100vh-1.5rem)] w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[1.45rem] border border-[var(--ui-border-strong)] bg-[var(--ui-bg-base)] shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)]', widthClass)}
        role="dialog"
      >
        <header className="flex min-w-0 items-start justify-between gap-3 border-b border-[var(--ui-border)] p-4">
          <div className="grid min-w-0 gap-1">
            <h2 className="m-0 text-lg font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
              {title}
            </h2>

            {description ? (
              <p className="m-0 text-sm font-medium leading-6 text-[var(--ui-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>

          <button
            aria-label="Close drawer"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            type="button"
            onClick={onClose}
          >
            <X size={16} strokeWidth={2.35} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-4">
          {children}
        </div>

        {actions ? (
          <footer className="flex min-w-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--ui-border)] p-4">
            {actions}
          </footer>
        ) : null}
      </section>
    </div>
  );
}

export function AdminDropdown({
  buttonClassName = '',
  className = '',
  disabled = false,
  hideLabel = false,
  icon: Icon,
  label,
  options,
  placeholder = 'Select',
  value,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const safeOptions = Array.isArray(options) ? options : [];
  const selectedOption = safeOptions.find((item) => item.key === value) || null;
  const displayLabel = selectedOption?.label || placeholder;

  const handleSelect = (nextValue) => {
    if (disabled) {
      return;
    }

    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <label
      className={cn('relative grid min-w-0 gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]', className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      {label ? (
        <span className={hideLabel ? 'sr-only' : 'text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ui-text-muted)]'}>
          {label}
        </span>
      ) : null}

      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex min-h-10 w-full min-w-0 items-center gap-3 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-left text-sm font-semibold text-[var(--ui-text-strong)] ring-1 ring-[var(--ui-ring)] transition hover:bg-[var(--ui-control-hover)] focus-visible:border-studio-accent/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 disabled:cursor-not-allowed disabled:opacity-60',
          buttonClassName,
        )}
        disabled={disabled}
        type="button"
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
      >
        {Icon ? (
          <Icon className="shrink-0 text-[var(--ui-text-muted)]" size={15} strokeWidth={2.35} aria-hidden="true" />
        ) : null}

        <span className="min-w-0 flex-1 truncate">
          {displayLabel}
        </span>

        <ChevronDown
          className={cn('shrink-0 text-[var(--ui-text-muted)] transition-transform', isOpen ? 'rotate-180' : '')}
          size={15}
          strokeWidth={2.35}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[80] max-h-64 overflow-auto rounded-[1.15rem] border border-[var(--ui-border-strong)] bg-[var(--ui-bg-base)] p-1.5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)]"
          role="listbox"
        >
          {safeOptions.map((option) => {
            const isSelected = option.key === value;

            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  'flex min-h-9 w-full items-center justify-between gap-3 rounded-full px-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
                  isSelected
                    ? 'bg-[var(--ui-control-hover)] text-studio-accent'
                    : 'text-[var(--ui-text-main)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
                )}
                key={option.key}
                role="option"
                type="button"
                onClick={() => handleSelect(option.key)}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? (
                  <span className="size-2 rounded-full bg-studio-accent" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </label>
  );
}

export function AdminTableShell({
  children,
  className = '',
  minWidth = 'min-w-[760px]',
}) {
  return (
    <div className={cn('overflow-hidden rounded-[1.35rem] border border-[var(--ui-border)] bg-[var(--ui-glass)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]', className)}>
      <div className="overflow-x-auto">
        <div className={cn('w-full', minWidth)}>
          {children}
        </div>
      </div>
    </div>
  );
}

export const adminPrimitiveContracts = {
  badgeTones: Object.keys(adminBadgeToneClasses),
  buttonSizes: Object.keys(adminButtonSizeClasses),
  buttonVariants: Object.keys(adminButtonVariantClasses),
  panelVariants: Object.keys(adminPanelVariantClasses),
};
