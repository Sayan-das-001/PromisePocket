import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { Commitment } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CommitmentCard } from '../../components/commitments/CommitmentCard';
import { EditCommitmentModal } from '../../components/commitments/EditCommitmentModal';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { toast, success, error } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);

  const fetchMonthEvents = async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const res = await api.getCalendarEvents(year, month);
      setCommitments(res.events || []);
    } catch (err: any) {
      console.warn('Could not fetch calendar events:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthEvents(currentDate);
  }, [currentDate]);

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else {
      setCurrentDate((prev) => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else {
      setCurrentDate((prev) => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Calculate days for the calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays =
    viewMode === 'month'
      ? eachDayOfInterval({ start: startDate, end: endDate })
      : eachDayOfInterval({
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
        });

  // Filter commitments for selected day
  const selectedDayCommitments = commitments.filter((c) => {
    if (!c.due_at) return false;
    try {
      return isSameDay(new Date(c.due_at), selectedDate);
    } catch {
      return false;
    }
  });

  // Get indicator dots count for a specific date
  const getCommitmentDotsForDate = (date: Date) => {
    return commitments.filter((c) => {
      if (!c.due_at) return false;
      try {
        return isSameDay(new Date(c.due_at), date);
      } catch {
        return false;
      }
    });
  };

  const handleComplete = async (id: string) => {
    try {
      await api.completeCommitment(id);
      success('Promise kept!');
      fetchMonthEvents(currentDate);
    } catch (err: any) {
      error('Failed to complete promise', err.message);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.cancelCommitment(id);
      toast('Promise cancelled', undefined, 'info');
      fetchMonthEvents(currentDate);
    } catch (err: any) {
      error('Failed to cancel promise', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCommitment(id);
      toast('Commitment deleted', undefined, 'info');
      fetchMonthEvents(currentDate);
    } catch (err: any) {
      error('Failed to delete commitment', err.message);
    }
  };

  const handleSaveModal = async (formData: any) => {
    try {
      if (editingCommitment && editingCommitment.id) {
        await api.updateCommitment(editingCommitment.id, {
          title: formData.title,
          person_name_snapshot: formData.person_name,
          category: formData.category,
          due_at: formData.date ? `${formData.date}T${formData.time || '12:00'}:00` : undefined,
          reminder_enabled: formData.reminder_enabled,
        });
        success('Commitment updated');
      } else {
        await api.createCommitment({
          title: formData.title,
          person_name_snapshot: formData.person_name,
          category: formData.category,
          due_at: formData.date ? `${formData.date}T${formData.time || '12:00'}:00` : undefined,
          reminder_enabled: formData.reminder_enabled,
          status: 'pending',
          timezone: user?.timezone || 'Asia/Kolkata',
          source_type: 'typed_text',
        });
        success('New promise added to calendar');
      }
      fetchMonthEvents(currentDate);
    } catch (err: any) {
      error('Failed to save commitment', err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
      {/* Top Header Controls: Title & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#292526]">Calendar</h2>
          <p className="text-xs text-[#898487]">Review your family and personal promises by date</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Week / Month Toggle Pill (inspired by Reference Screen 3) */}
          <div className="bg-white p-1 rounded-full border border-[#F0E4DE] flex items-center shadow-warm-sm">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-[#FF986F] text-white shadow-sm'
                  : 'text-[#898487] hover:text-[#292526]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-[#FF986F] text-white shadow-sm'
                  : 'text-[#898487] hover:text-[#292526]'
              }`}
            >
              Month
            </button>
          </div>

          <button
            onClick={() => {
              setEditingCommitment({
                id: '',
                user_id: user?.id || '',
                title: '',
                category: 'family',
                status: 'pending',
                due_at: `${format(selectedDate, 'yyyy-MM-dd')}T12:00:00`,
                timezone: user?.timezone || 'Asia/Kolkata',
                date_precision: 'exact_time',
                reminder_enabled: true,
                source_type: 'typed_text',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              setIsModalOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-[#FFE2D5] text-[#292526] hover:bg-[#FF986F] hover:text-white flex items-center justify-center transition-all shadow-sm"
            title="Add promise for selected date"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Card Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F0E4DE] shadow-warm">
        {/* Month Navigation & Today Shortcut */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif font-bold text-xl text-[#292526]">
            {format(currentDate, 'MMMM yyyy')}
          </h3>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[#F0E4DE] text-[#292526] hover:bg-[#FFF7F2] transition-colors"
            >
              Today
            </button>
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full border border-[#F0E4DE] flex items-center justify-center text-[#898487] hover:text-[#292526] hover:bg-[#FFE2D5]/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full border border-[#F0E4DE] flex items-center justify-center text-[#898487] hover:text-[#292526] hover:bg-[#FFE2D5]/40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Header Row */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d} className="text-xs font-semibold text-[#898487] py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayCommitments = getCommitmentDotsForDate(day);
            const isCurrentDay = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`relative flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all duration-200 min-h-[54px] ${
                  isSelected
                    ? 'bg-[#FF986F] text-white shadow-warm font-bold'
                    : isCurrentDay
                    ? 'bg-[#FFE2D5]/60 text-[#292526] font-bold border border-[#FF986F]/40'
                    : isCurrentMonth
                    ? 'text-[#292526] hover:bg-[#FFF9F5]'
                    : 'text-[#898487]/40 hover:bg-[#FFF9F5]/40'
                }`}
              >
                <span className="text-sm">{format(day, 'd')}</span>

                {/* Indicator Dots beneath date */}
                <div className="flex items-center gap-0.5 mt-1 h-1.5">
                  {dayCommitments.slice(0, 3).map((item, dotIdx) => (
                    <span
                      key={dotIdx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : item.status === 'completed'
                          ? 'bg-[#27AE60]'
                          : 'bg-[#FF986F]'
                      }`}
                    />
                  ))}
                  {dayCommitments.length > 3 && (
                    <span className={`text-[8px] leading-none ${isSelected ? 'text-white' : 'text-[#FF986F]'}`}>
                      +
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Event List (matching bottom half of Screen 3) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-[#292526]">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <span className="text-xs text-[#898487]">
            {selectedDayCommitments.length} promises
          </span>
        </div>

        {selectedDayCommitments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {selectedDayCommitments.map((commitment) => (
              <CommitmentCard
                key={commitment.id}
                commitment={commitment}
                onComplete={handleComplete}
                onCancel={handleCancel}
                onDelete={handleDelete}
                onEdit={(c) => {
                  setEditingCommitment(c);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-[#F0E4DE] text-center shadow-warm-sm">
            <p className="text-xs text-[#898487] mb-3">No promises scheduled for this day.</p>
            <button
              onClick={() => {
                setEditingCommitment({
                  id: '',
                  user_id: user?.id || '',
                  title: '',
                  category: 'family',
                  status: 'pending',
                  due_at: `${format(selectedDate, 'yyyy-MM-dd')}T12:00:00`,
                  timezone: user?.timezone || 'Asia/Kolkata',
                  date_precision: 'exact_time',
                  reminder_enabled: true,
                  source_type: 'typed_text',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#FFE2D5] text-[#292526] hover:bg-[#FF986F] hover:text-white transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Promise for this day</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      <EditCommitmentModal
        isOpen={isModalOpen}
        commitment={editingCommitment}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCommitment(null);
        }}
        onSave={handleSaveModal}
      />
    </div>
  );
};
