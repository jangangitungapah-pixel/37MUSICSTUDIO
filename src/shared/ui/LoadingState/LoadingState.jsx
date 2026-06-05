import { Loader2 } from 'lucide-react';
import './LoadingState.css';

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const LoadingState = ({ className = '', label, size = 32, fullPage = false, ...props }) => (
  <div className={joinClasses('ui-loading-state', fullPage && 'ui-loading-state-full', className)} role="status" aria-live="polite" {...props}>
    <Loader2 className="spinner" size={size} />
    {label ? <span>{label}</span> : null}
  </div>
);

export default LoadingState;
