import './Badge.css';

const toneClasses = {
  neutral: 'f-badge-neutral',
  info: 'f-badge-info',
  success: 'f-badge-success',
  danger: 'f-badge-danger',
  warning: 'f-badge-warning',
};

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const Badge = ({ as: Component = 'span', children, className = '', tone = 'neutral', compact = false, ...props }) => (
  <Component className={joinClasses('ui-badge', 'f-badge', toneClasses[tone], compact && 'ui-badge-compact', className)} {...props}>
    {children}
  </Component>
);

export default Badge;
