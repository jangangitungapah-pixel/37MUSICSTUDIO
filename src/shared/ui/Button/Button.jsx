import { Loader2 } from 'lucide-react';
import './Button.css';

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  subtle: 'btn-subtle',
  danger: 'btn-danger',
  success: 'btn-success',
  warning: 'btn-warning',
};

const sizeClasses = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const Button = ({
  as: Component = 'button',
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingLabel,
  disabled,
  type = 'button',
  spinnerSize = 16,
  ...props
}) => {
  const isButton = Component === 'button';
  const content = loading ? (
    <>
      <Loader2 className="spinner" size={spinnerSize} />
      {loadingLabel ? <span>{loadingLabel}</span> : null}
    </>
  ) : children;

  return (
    <Component
      className={joinClasses('ui-button', variantClasses[variant], sizeClasses[size], fullWidth && 'btn-full', className)}
      disabled={isButton ? disabled || loading : undefined}
      aria-disabled={!isButton && (disabled || loading) ? 'true' : undefined}
      type={isButton ? type : undefined}
      {...props}
    >
      {content}
    </Component>
  );
};

export default Button;
