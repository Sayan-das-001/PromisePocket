import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Bell, User } from 'lucide-react';
import { Commitment, CommitmentCategory, CommitmentProposal } from '../../types';

interface EditCommitmentModalProps {
  isOpen: boolean;
  commitment?: Commitment | CommitmentProposal | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const EditCommitmentModal: React.FC<EditCommitmentModalProps> = ({
  isOpen,
  commitment,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [personName, setPersonName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<CommitmentCategory>('family');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (commitment) {
      setTitle(commitment.title || '');
      setPersonName(
        ('person_name_snapshot' in commitment
          ? commitment.person_name_snapshot
          : (commitment as CommitmentProposal).person_name) || ''
      );

      if ('due_at' in commitment && commitment.due_at) {
        try {
          const d = new Date(commitment.due_at);
          setDate(d.toISOString().slice(0, 10));
          setTime(d.toTimeString().slice(0, 5));
        } catch {
          // ignore
        }
      } else if ('proposed_date' in commitment) {
        const prop = commitment as CommitmentProposal;
        setDate(prop.proposed_date || '');
        setTime(prop.proposed_time || '');
      }

      setCategory(commitment.category || 'family');
      setReminderEnabled(commitment.reminder_enabled ?? true);
    }
  }, [commitment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        person_name: personName.trim() || undefined,
        person_name_snapshot: personName.trim() || undefined,
        date,
        time,
        category,
        reminder_enabled: reminderEnabled,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-warm-lg border border-[#F0E4DE] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full flex items-center justify-center text-[#898487] hover:text-[#292526] hover:bg-[#FFE2D5]/40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-serif font-bold text-xl text-[#292526] mb-4">
          Edit Commitment
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1">
              What did you promise?
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call Ma, Return Rahul's book"
              className="w-full px-4 py-2.5 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-sm text-[#292526] bg-[#FFF9F5]/50"
            />
          </div>

          {/* Person Input */}
          <div>
            <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1">
              For whom?
            </label>
            <div className="relative">
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. Mom, Rahul, Priya"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-sm text-[#292526] bg-[#FFF9F5]/50"
              />
              <User className="w-4 h-4 text-[#898487] absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-xs sm:text-sm text-[#292526] bg-[#FFF9F5]/50"
                />
                <Calendar className="w-3.5 h-3.5 text-[#898487] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1">
                Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-xs sm:text-sm text-[#292526] bg-[#FFF9F5]/50"
                />
                <Clock className="w-3.5 h-3.5 text-[#898487] absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['family', 'friendship', 'study', 'errands', 'health', 'work'] as CommitmentCategory[]).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                      category === cat
                        ? 'bg-[#FFE2D5] border-[#FF986F] text-[#292526]'
                        : 'border-[#F0E4DE] text-[#898487] hover:bg-[#FFF9F5]'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Reminder Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9F5] border border-[#F0E4DE]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#FF986F]" />
              <span className="text-xs font-semibold text-[#292526]">
                Schedule Reminder
              </span>
            </div>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#FF986F] rounded cursor-pointer"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#898487] hover:bg-[#FFF7F2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-full text-xs font-semibold bg-[#FF986F] text-white hover:bg-[#F28254] shadow-warm-sm transition-all"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
