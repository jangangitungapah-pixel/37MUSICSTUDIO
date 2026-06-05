import './Card.css';

const variantClasses = {
  panel: 'app-panel',
  card: 'app-card',
  glass: 'glass-panel',
  plain: '',
};

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const Card = ({ as: Component = 'div', children, className = '', variant = 'panel', interactive = false, ...props }) => (
  <Component
    className={joinClasses('ui-card', variantClasses[variant], interactive && 'card-interactive', className)}
    {...props}
  >
    {children}
  </Component>
);

export default Card;
