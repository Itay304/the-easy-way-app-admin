import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../lib/navItems.js';

export default function BottomTabs() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-brand-border flex items-stretch z-50">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold ${
              isActive ? 'text-brand-turquoise' : 'text-brand-grey-text'
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
