import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Sparkles,
  Calendar,
  CheckSquare,
  Users,
  Bell,
  Settings,
  ShieldCheck,
  Cpu,
  Database,
  Clock,
  Mic,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { IntegrationHealth } from '../../types';

export const DesktopSidebar: React.FC = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState<IntegrationHealth | null>(null);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(() => {});
  }, []);

  const navItems = [
    { to: '/', label: 'Home Dashboard', icon: Home },
    { to: '/assistant', label: 'AI Assistant', icon: Sparkles, badge: 'Gemma' },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/promises', label: 'All Promises', icon: CheckSquare },
    { to: '/people', label: 'People I Care About', icon: Users },
    { to: '/notifications', label: 'Reminders & Alerts', icon: Bell },
    { to: '/settings', label: 'Settings & Privacy', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-[#F0E4DE] h-screen sticky top-0 px-4 py-6 justify-between select-none shrink-0">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-[#FFE2D5] flex items-center justify-center text-[#FF986F] shadow-warm-sm border border-[#FFC8B3]/50">
            <Sparkles className="w-5 h-5 fill-[#FF986F]" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-[#292526] tracking-tight">PromisePocket</h2>
            <p className="text-[11px] font-medium text-[#898487]">Family & Personal Memory</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#FFE2D5] text-[#292526] font-semibold shadow-warm-sm'
                      : 'text-[#898487] hover:text-[#292526] hover:bg-[#FFF7F2]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 stroke-[2]" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#FF986F] text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Integration Status & System Footnote */}
      <div className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F0E4DE] text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-[#292526] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#27AE60]" />
              System Engines
            </span>
            <span className="text-[10px] text-[#27AE60] font-bold">Online</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#898487]">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-[#FF986F]" />
              <span>Gemma AI</span>
              <span className={`w-1.5 h-1.5 rounded-full ml-auto ${health?.ollama_connected || health?.groq_gemma_connected ? 'bg-[#27AE60]' : 'bg-[#E67E22]'}`} />
            </div>

            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-[#27AE60]" />
              <span>MongoDB</span>
              <span className={`w-1.5 h-1.5 rounded-full ml-auto ${health?.mongodb_connected ? 'bg-[#27AE60]' : 'bg-[#3498DB]'}`} />
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#3498DB]" />
              <span>Temporal</span>
              <span className={`w-1.5 h-1.5 rounded-full ml-auto ${health?.temporal_connected ? 'bg-[#27AE60]' : 'bg-[#E67E22]'}`} />
            </div>

            <div className="flex items-center gap-1.5">
              <Mic className="w-3 h-3 text-[#9B59B6]" />
              <span>ElevenLabs</span>
              <span className={`w-1.5 h-1.5 rounded-full ml-auto ${health?.elevenlabs_configured ? 'bg-[#27AE60]' : 'bg-[#95A5A6]'}`} />
            </div>
          </div>
        </div>

        {/* User profile snippet */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full bg-[#FFE2D5] flex items-center justify-center text-[#FF986F] font-serif font-bold text-sm">
            {user?.display_name ? user.display_name[0].toUpperCase() : 'S'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-[#292526] truncate">{user?.display_name || 'Sarah'}</p>
            <p className="text-[11px] text-[#898487] truncate">{user?.timezone || 'Asia/Kolkata'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
