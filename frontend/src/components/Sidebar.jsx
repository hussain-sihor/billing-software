import { NavLink } from 'react-router-dom';
import { useStore } from '../lib/store';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '■', end: true },
  { to: '/new', label: 'New bill / quotation', icon: '＋' },
  { to: '/saved', label: 'Saved documents', icon: '🗀' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/parties', label: 'Parties', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙' }
];

export default function Sidebar() {
  const settings = useStore((s) => s.settings);

  return (
    <aside className="w-[220px] flex-none bg-navy text-[#E7ECF3] py-[22px] sticky top-0 h-screen overflow-y-auto">
      <div className="px-5 pb-5 border-b border-white/10 mb-3.5">
        <div className="w-[38px] h-[38px] rounded-[9px] bg-gradient-to-br from-accent to-[#14A38A] flex items-center justify-center font-bold text-base text-white mb-2.5">
          B
        </div>
        <div className="text-[15px] font-bold tracking-[.2px]">
          {settings?.companyName || 'Bellavo Billing'}
        </div>
        <div className="text-[11.5px] text-[#9FB0C6] mt-0.5">
          Invoices &amp; quotations
        </div>
      </div>
      <nav className="flex flex-col px-2.5 gap-0.5">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors',
                isActive
                  ? 'bg-navy-2 text-white'
                  : 'text-[#C7D3E3] hover:bg-white/[.06] hover:text-white'
              ].join(' ')
            }
          >
            <span className="w-[18px] text-center text-sm opacity-90">
              {n.icon}
            </span>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
