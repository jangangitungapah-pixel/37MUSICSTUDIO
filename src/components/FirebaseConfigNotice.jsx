import { isFirebaseConfigured } from '../firebase';

const FirebaseConfigNotice = () => {
  if (isFirebaseConfigured || import.meta.env.PROD) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 16,
        zIndex: 9999,
        transform: 'translateX(-50%)',
        width: 'min(92vw, 720px)',
        padding: '12px 16px',
        borderRadius: 16,
        background: 'rgba(255, 193, 7, 0.14)',
        border: '1px solid rgba(255, 193, 7, 0.36)',
        color: 'var(--text-primary, #fff)',
        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.28)',
        backdropFilter: 'blur(18px)',
        fontSize: 13,
        lineHeight: 1.45,
        textAlign: 'center',
      }}
    >
      Firebase belum dikonfigurasi. Salin <code>.env.example</code> ke <code>.env</code>, isi kredensial Firebase, lalu restart dev server.
    </div>
  );
};

export default FirebaseConfigNotice;
