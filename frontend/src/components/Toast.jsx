import { useStore } from '../lib/store';

// Global toast — reads the current message from the store. The store clears it
// automatically after ~2.2s (see store.toast()).
export default function Toast() {
  const msg = useStore((s) => s.toastMsg);

  return (
    <div
      className={[
        'fixed bottom-[22px] right-[22px] bg-navy text-white px-[18px] py-3 rounded-lg',
        'text-[13.5px] shadow-[0_8px_24px_rgba(0,0,0,.18)] z-[999] pointer-events-none transition-all duration-200',
        msg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      {msg}
    </div>
  );
}
