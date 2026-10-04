import React from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface HeaderProps {
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ unreadNotificationsCount = 2 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = format(new Date(), 'EEE, MMMM d');

  return (
    <header className="flex items-center justify-between px-5 py-4 sm:px-8 bg-transparent">
      {/* User Avatar & Greeting */}
      <div className="flex items-center gap-3.5">
        <div
          onClick={() => navigate('/settings')}
          className="relative cursor-pointer group"
          title="Profile & Settings"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-warm-sm bg-[#FFE2D5] flex items-center justify-center text-[#FF986F] font-serif font-bold text-lg group-hover:border-[#FF986F] transition-all">
            {user?.display_name ? user.display_name.slice(0, 1).toUpperCase() : 'S'}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#27AE60] rounded-full border-2 border-white" />
        </div>

        <div>
          <h1 className="font-serif text-lg sm:text-xl font-bold text-[#292526] leading-tight flex items-center gap-1.5">
            {getGreeting()}, <span className="font-semibold text-[#FF986F]">{user?.display_name || 'Sarah'}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-[#898487] font-medium">{todayFormatted}</p>
        </div>
      </div>

      {/* Action / Notification Icon */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/assistant')}
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#F0E4DE] text-[#292526] hover:bg-[#FFF7F2] hover:border-[#FF986F] transition-all shadow-warm-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF986F]" />
          <span>Ask Assistant</span>
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="relative w-11 h-11 rounded-full bg-white border border-[#F0E4DE] flex items-center justify-center text-[#292526] hover:bg-[#FFF7F2] transition-colors shadow-warm-sm"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-[#292526]" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF986F] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
