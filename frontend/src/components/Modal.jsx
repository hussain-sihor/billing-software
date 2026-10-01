import { useEffect } from 'react';

// Reusable modal: a backdrop + centered panel. Used by the product/party
// modals and the document preview. Closes on backdrop click and Escape.
export default function Modal({ open, onClose, children, title, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,25,40,.45)] flex items-start justify-center px-4 py-10 z-[900] overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={[
          'bg-white rounded-xl w-full p-[22px] mt-5',
          wide ? 'max-w-[880px]' : 'max-w-[480px]'
        ].join(' ')}
      >
        {title && (
          <h3 className="text-[15px] font-semibold text-navy mb-3.5">{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
}
