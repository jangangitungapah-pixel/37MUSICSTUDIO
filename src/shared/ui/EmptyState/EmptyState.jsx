import './EmptyState.css';

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const EmptyState = ({
  icon,
  title,
  description,
  actions,
  className = '',
  iconClassName = '',
  compact = false,
  showGlow = true,
}) => (
  <div className={joinClasses('ui-empty-state', 'empty-state-container', compact && 'mobile-compact', className)}>
    {icon ? (
      <div className={joinClasses('empty-state-icon-wrapper', iconClassName)}>
        {icon}
        {showGlow ? <div className="empty-state-glow" /> : null}
      </div>
    ) : null}
    {title ? <h4 className="empty-state-title">{title}</h4> : null}
    {description ? <p className="empty-state-subtitle">{description}</p> : null}
    {actions ? <div className="ui-empty-state-actions">{actions}</div> : null}
  </div>
);

export default EmptyState;
