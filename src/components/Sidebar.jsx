import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../lib/navItems.js';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 border-l border-brand-border bg-white min-h-dvh sticky top-0">
      <div className="flex items-center gap-3 px-5 py-6">
        <img src="/icons/icon-192.png" alt="EasyLex" className="h-9 w-9 rounded-lg" />
        <span className="font-bold text-brand-text">EasyLex — ניהול על</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-brand-turquoise/10 text-brand-turquoise'
                  : 'text-brand-grey-text hover:bg-brand-grey-light hover:text-brand-text'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
