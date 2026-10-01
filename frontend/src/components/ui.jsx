// Small shared UI primitives matching the original app's .btn / .card styles.

const BTN_BASE =
  'inline-flex items-center gap-1.5 rounded-[7px] border border-transparent font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANTS = {
  default: 'bg-navy text-white hover:bg-navy-2',
  primary: 'bg-accent text-white hover:bg-accent-dark',
  ghost: 'bg-transparent border-bordr-strong text-ink hover:bg-[#EEF1F5]',
  danger: 'bg-danger-bg text-danger border-[#F3C9C4] hover:bg-[#FADCD8]'
};

export function Button({ variant = 'default', sm = false, className = '', ...props }) {
  return (
    <button
      className={[
        BTN_BASE,
        VARIANTS[variant] || VARIANTS.default,
        sm ? 'px-2.5 py-1.5 text-[12.5px]' : 'px-4 py-[9px] text-[13.5px]',
        className
      ].join(' ')}
      {...props}
    />
  );
}

export function Card({ title, children, className = '' }) {
  return (
    <div
      className={[
        'bg-paper border border-bordr rounded-[10px] p-5 mb-[18px]',
        className
      ].join(' ')}
    >
      {title && (
        <h3 className="text-[14.5px] text-navy border-b border-bordr pb-2.5 mb-3.5 font-semibold">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export function Topbar({ title, desc, children }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-xl font-semibold text-navy">{title}</h1>
        {desc && <div className="text-muted text-[13px] mt-0.5">{desc}</div>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

const CTRL =
  'w-full px-2.5 py-2 border border-bordr-strong rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent';

export function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs text-muted mb-1 font-semibold">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={[CTRL, className].join(' ')} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={[CTRL, 'resize-y min-h-[56px]', className].join(' ')}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={[CTRL, className].join(' ')} {...props}>
      {children}
    </select>
  );
}

// Pill badge for document type (invoice/quotation).
export function Pill({ type }) {
  const invoice = type === 'invoice';
  return (
    <span
      className={[
        'inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-[.2px]',
        invoice ? 'bg-[#E4F3EE] text-accent-dark' : 'bg-[#EAF0FB] text-[#2A4E9C]'
      ].join(' ')}
    >
      {invoice ? 'Bill' : 'Quotation'}
    </span>
  );
}

// Shared data table shell with uppercase column headers.
export function DTable({ head, children }) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          {head.map((h, i) => (
            <th
              key={i}
              className="text-left text-[11.5px] uppercase tracking-[.3px] text-muted border-b border-bordr-strong px-2 py-2"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function EmptyState({ emoji, children }) {
  return (
    <div className="py-[30px] px-2.5 text-center text-muted text-[13.5px]">
      <div className="text-[26px] mb-1.5">{emoji}</div>
      {children}
    </div>
  );
}
