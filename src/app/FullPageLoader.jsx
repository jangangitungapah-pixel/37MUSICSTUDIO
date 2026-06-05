import { Loader2 } from 'lucide-react';

const FullPageLoader = () => (
  <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
    <Loader2 className="spinner" size={32} color="var(--accent-pink)" />
  </div>
);

export default FullPageLoader;
