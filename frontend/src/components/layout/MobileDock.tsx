import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Sparkles, Calendar, CheckSquare, Users } from 'lucide-react';

export const MobileDock: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/assistant', label: 'Assistant', icon: Sparkles },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/promises', label: 'Promises', icon: CheckSquare },
    { to: '/people', label: 'People', icon: Users },
  ];

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 md:hidden w-[92%] max-w-sm">
      <div className="glass-dock rounded-full px-3 py-2 flex items-center justify-around shadow-dock">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`relative flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'w-11 h-11 rounded-full bg-[#FF986F] text-white shadow-warm'
                  : 'w-10 h-10 rounded-full text-[#898487] hover:text-[#292526] hover:bg-[#FFE2D5]/40'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
