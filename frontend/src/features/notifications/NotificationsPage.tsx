import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  Check,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { InAppNotification } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { formatLocalDate } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const { toast, success, error } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (err: any) {
      console.warn('Could not load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRequestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      toast('Notifications not supported', 'Your browser does not support web notifications', 'error');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        success('Browser notifications enabled', "You'll receive alerts for your promises");
        new Notification('PromisePocket Reminders Enabled', {
          body: 'You will now be notified when your promises are due.',
          icon: '/favicon.svg',
        });
      } else {
        toast('Permission not granted', 'Notifications remained disabled in browser', 'info');
      }
    } catch (err: any) {
      error('Permission request failed', err.message);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (err: any) {
      console.warn('Mark read failed:', err.message);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6 animate-in fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#292526]">Reminders & Notifications</h2>
          <p className="text-xs text-[#898487]">
            {unreadCount} unread {unreadCount === 1 ? 'alert' : 'alerts'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={async () => {
              for (const n of notifications.filter((n) => !n.read_at)) {
                await handleMarkRead(n.id);
              }
              success('All marked as read');
            }}
            className="text-xs font-semibold text-[#FF986F] hover:text-[#F28254]"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Browser Notification Opt-in Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#F0E4DE] shadow-warm-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FFE2D5] text-[#FF986F] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[#292526]">
              Desktop & Browser Notifications
            </h4>
            <p className="text-xs text-[#898487]">
              Status:{' '}
              <span
                className={`font-semibold ${
                  browserPermission === 'granted'
                    ? 'text-[#27AE60]'
                    : browserPermission === 'denied'
                    ? 'text-[#E74C3C]'
                    : 'text-[#E67E22]'
                }`}
              >
                {browserPermission.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        {browserPermission !== 'granted' && (
          <button
            onClick={handleRequestBrowserPermission}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[#FF986F] text-white hover:bg-[#F28254] transition-all shadow-sm shrink-0"
          >
            Enable Browser Alerts
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isRead = !!n.read_at;

            return (
              <div
                key={n.id}
                onClick={() => !isRead && handleMarkRead(n.id)}
                className={`p-4 rounded-3xl border transition-all flex items-start gap-3.5 ${
                  isRead
                    ? 'bg-white/60 border-[#F0E4DE] text-[#898487]'
                    : 'bg-white border-[#FFC8B3] shadow-warm-sm text-[#292526]'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {n.type === 'due_soon' || n.type === 'due_today' ? (
                    <Clock className="w-5 h-5 text-[#FF986F]" />
                  ) : n.type === 'overdue' ? (
                    <AlertCircle className="w-5 h-5 text-[#E74C3C]" />
                  ) : (
                    <Bell className="w-5 h-5 text-[#27AE60]" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{n.title}</h4>
                    <span className="text-[10px] text-[#898487]">
                      {formatLocalDate(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-[#898487] leading-relaxed">{n.body}</p>

                  {n.commitment_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/promises`);
                      }}
                      className="mt-2 text-xs font-semibold text-[#FF986F] hover:underline flex items-center gap-1"
                    >
                      <span>View commitment</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {!isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(n.id);
                    }}
                    className="w-7 h-7 rounded-full bg-[#FFE2D5]/50 hover:bg-[#FFE2D5] text-[#FF986F] flex items-center justify-center shrink-0 transition-colors"
                    title="Mark read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-[#F0E4DE] text-center shadow-warm-sm">
          <p className="text-xs text-[#898487]">You have no notifications or pending alerts.</p>
        </div>
      )}
    </div>
  );
};
